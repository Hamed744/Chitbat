import os
import re
import requests
import json
from flask import Flask, render_template, request, Response
import logging
from filelock import FileLock
from pathlib import Path
import base64

class PersianLogFormatter(logging.Formatter):
    LEVEL_MAP = {
        logging.DEBUG: "دیباگ",
        logging.INFO: "اطلاع",
        logging.WARNING: "هشدار",
        logging.ERROR: "خطا",
        logging.CRITICAL: "بحرانی",
    }
    def format(self, record):
        record.levelname = self.LEVEL_MAP.get(record.levelno, record.levelname)
        return super().format(record)

def setup_logging():
    log_format = '[%(asctime)s] [%(levelname)s]: %(message)s'
    date_format = '%Y-%m-%d %H:%M:%S'
    formatter = PersianLogFormatter(log_format, datefmt=date_format)
    root_logger = logging.getLogger()
    if root_logger.hasHandlers():
        root_logger.handlers.clear()
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    root_logger.setLevel(logging.INFO)

setup_logging()

try:
    ALL_GEMINI_API_KEYS_STR = os.getenv('ALL_GEMINI_API_KEYS')
    if not ALL_GEMINI_API_KEYS_STR:
        raise RuntimeError("متغیر ALL_GEMINI_API_KEYS تنظیم نشده است.")
    MASTER_API_KEYS = [key.strip() for key in ALL_GEMINI_API_KEYS_STR.split(',') if key.strip()]
    if not MASTER_API_KEYS:
        raise RuntimeError("هیچ کلید معتبری در ALL_GEMINI_API_KEYS یافت نشد.")
    
    COUNTER_FILE_PATH = '/dev/shm/gunicorn_key_counter.txt'
    lock_path = COUNTER_FILE_PATH + ".lock"
    lock = FileLock(lock_path)
    with lock:
        if not os.path.exists(COUNTER_FILE_PATH):
            logging.info(f"✅ اولین کارگر شروع به کار کرد. با موفقیت {len(MASTER_API_KEYS)} کلید Gemini بارگذاری شد.")
            with open(COUNTER_FILE_PATH, 'w') as f:
                f.write('0')
            logging.info("شمارنده چرخش کلیدها مقداردهی اولیه شد.")

    CACHE_DIR = Path('/dev/shm/file_cache')
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    logging.info(f"پوشه کش فایل‌ها در مسیر '{CACHE_DIR}' آماده استفاده است.")

    META_DIR = Path('/dev/shm/chat_meta')
    META_DIR.mkdir(parents=True, exist_ok=True)
    logging.info(f"پوشه متادیتای چت‌ها در مسیر '{META_DIR}' آماده استفاده است.")
            
except Exception as e:
    logging.critical(f"خطای بحرانی در هنگام بارگذاری کلیدهای API یا تنظیم کش/متا: {e}")
    raise

app = Flask(__name__)
GOOGLE_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

# ------------------------ قوانین/مواد ثابت ------------------------
BASE_RULES_FA = """
**دستورالعمل‌های اجباری برای دستیار هوش مصنوعی آلفا:**
1) هویت: تو «چت‌بات آلفا» هستی که توسط هوش مصنوعی آلفا توسعه داده شده‌ای. وظیفه‌ات کمک به کاربر در همه‌ی زمینه‌هاست.
2) پرهیز از امتناع بی‌جا: به جای امتناع، راه‌حل جایگزین/ایمن بده.
3) تحلیل جامع چندرسانه‌ای:
   - هر نوع فایل (تصویر، ویدیو، صدا، PDF، متن، کُد و...) را تحلیل و محتوا را شرح بده.
   - پاسخ را با تشخیص نوع فایل شروع کن (مثلاً: «این یک فایل صوتی است که...»).
   - اگر کاربر فقط فایل فرستاد و صراحتاً ساخت/ویرایش تصویر نخواست، فقط تحلیل کن (ابزار تصویر را فراخوانی نکن).
4) تصویر (ابزارها الزامی در ساخت/ویرایش):
   - اولویت ابزارها: handle_specific_edit > change_image_aspect_ratio > regenerate_with_enhancement > generate_image > perform_internet_search
   - خروجی ابزار باید functionCall واقعی باشد؛ شبه‌کد مثل print(handle_specific_edit(...)) یا متن‌هایی مانند functionCall: ... ممنوع.
5) ویرایش‌های پیاپی: اگر دستور تکمیلی آمد، با دستور قبلی ادغام کن و بعد ویرایش را انجام بده.
6) گفتگو: اگر پیام محاوره‌ای/تشکر بود، ابزار تصویر را نخوان؛ پاسخ کوتاه و دوستانه فارسی بده.
7) درخواست‌های غیرتصویری (کدنویسی، نگارش، آموزش و...): پاسخ مفید بده؛ برای کد، بلاک Markdown (```lang) بده.
"""

# ------------------------ ابزار/کش فایل ------------------------
def get_file_data_from_url(url):
    try:
        logging.info(f"شروع بازیابی فایل از URL: {url}")
        response = requests.get(url, timeout=60)
        response.raise_for_status()
        content_type = response.headers.get('Content-Type', 'application/octet-stream')
        file_content_bytes = response.content
        base64_encoded_data = base64.b64encode(file_content_bytes).decode('utf-8')
        logging.info(f"فایل با موفقیت بازیابی شد. نوع: {content_type}, حجم: {len(file_content_bytes)} بایت")
        return {"mimeType": content_type, "data": base64_encoded_data}
    except requests.exceptions.RequestException as e:
        logging.error(f"خطا در هنگام بازیابی فایل از URL {url}: {e}")
        return None

def get_and_increment_key_index():
    lock_path = COUNTER_FILE_PATH + ".lock"
    lock = FileLock(lock_path)
    with lock:
        try:
            with open(COUNTER_FILE_PATH, 'r') as f:
                current_index = int(f.read().strip())
        except (FileNotFoundError, ValueError):
            current_index = 0
        index_to_use = current_index % len(MASTER_API_KEYS)
        next_index = (current_index + 1)
        with open(COUNTER_FILE_PATH, 'w') as f:
            f.write(str(next_index))
        return index_to_use

def get_keys_for_request():
    start_index = get_and_increment_key_index()
    return MASTER_API_KEYS[start_index:] + MASTER_API_KEYS[:start_index]

# ------------------------ متای چت ------------------------
def _meta_path(chat_id: str) -> Path:
    safe_id = ''.join(c for c in str(chat_id) if c.isalnum() or c in ('-', '_'))
    return META_DIR / f"{safe_id}.json"

def load_chat_meta(chat_id: str) -> dict:
    path = _meta_path(chat_id)
    lock = FileLock(str(path) + ".lock")
    with lock:
        if path.exists():
            try:
                return json.load(open(path, 'r', encoding='utf-8'))
            except Exception as e:
                logging.warning(f"خواندن متای چت {chat_id} ناموفق بود: {e}")
                return {}
        return {}

def save_chat_meta(chat_id: str, meta: dict):
    path = _meta_path(chat_id)
    lock = FileLock(str(path) + ".lock")
    with lock:
        try:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(meta or {}, f, ensure_ascii=False)
        except Exception as e:
            logging.warning(f"ذخیره متای چت {chat_id} ناموفق بود: {e}")

def update_chat_meta(chat_id: str, **kwargs):
    meta = load_chat_meta(chat_id)
    meta.update({k: v for k, v in kwargs.items() if v is not None})
    save_chat_meta(chat_id, meta)

# ------------------------ ابزارها ------------------------
def get_all_tools():
    search_tool = {
        "name": "perform_internet_search",
        "description": "فقط برای جستجوی اطلاعات به‌روز، وقایع جاری، قیمت‌ها و... استفاده شود.",
        "parameters": {"type": "OBJECT","properties": {"query": {"type": "STRING"}},"required": ["query"]}
    }
    image_tools = [
        {
            "name": "generate_image",
            "description": "ساخت تصویر جدید (نه توصیف متنی).",
            "parameters": {"type": "OBJECT","properties": {
                "english_prompt": {"type": "STRING"},
                "aspect_ratio": {"type": "STRING"},
                "initial_response_text": {"type": "STRING"},
                "follow_up_text": {"type": "STRING"}
            },"required": ["english_prompt", "initial_response_text", "follow_up_text"]}
        },
        {
            "name": "handle_specific_edit",
            "description": "تغییر مشخص روی تصویر قبلی؛ دستور جدید را در صورت لزوم با قبلی ادغام کن.",
            "parameters": {"type": "OBJECT","properties": {"edit_request": {"type": "STRING"}},"required": ["edit_request"]}
        },
        {
            "name": "regenerate_with_enhancement",
            "description": "برای درخواست‌های کلی/مبهم؛ نیاز به رفع ابهام.",
            "parameters": {"type": "OBJECT","properties": {
                "enhancement_request": {"type": "STRING"},
                "previous_english_prompt": {"type": "STRING"},
                "previous_aspect_ratio": {"type": "STRING"}
            },"required": ["enhancement_request", "previous_english_prompt", "previous_aspect_ratio"]}
        },
        {
            "name": "change_image_aspect_ratio",
            "description": "تغییر نسبت/اندازه تصویر قبلی.",
            "parameters": {"type": "OBJECT","properties": {
                "new_aspect_ratio": {"type": "STRING"},
                "previous_english_prompt": {"type": "STRING"}
            },"required": ["new_aspect_ratio", "previous_english_prompt"]}
        }
    ]
    return [{"function_declarations": image_tools + [search_tool]}]

# ------------------------ پرامپت‌سازی/ادغام ------------------------
def enhance_prompt(base_prompt, enhancement_request, model):
    api_key = get_keys_for_request()[0] 
    url = f"{GOOGLE_API_BASE_URL}/{model}:generateContent?key={api_key}"
    system_prompt = f"""You are an expert prompt engineer. Merge the base English image prompt with the user's modification (Persian or English). Return only the final, ready-to-use English prompt.

Base Prompt: "{base_prompt}"
User's Request: "{enhancement_request}"
"""
    payload = {"contents": [{"role": "user", "parts": [{"text": system_prompt}]}],"generationConfig": { "temperature": 0.7 }}
    try:
        response = requests.post(url, json=payload, timeout=45)
        response.raise_for_status()
        enhanced_prompt = response.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        logging.info(f"✅ پرامپت بهبود یافت: {enhanced_prompt}")
        return enhanced_prompt
    except Exception as e:
        logging.error(f"❌ خطا در enhance_prompt: {e}")
        return f"{base_prompt}, {enhancement_request}"

def create_artistic_prompt(user_prompt, model):
    api_key = get_keys_for_request()[0]
    url = f"{GOOGLE_API_BASE_URL}/{model}:generateContent?key={api_key}"
    system_instruction = "Convert user's (possibly Persian) idea to a highly-detailed English prompt. Output ONLY the final English prompt."
    payload = {
        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "generationConfig": { "temperature": 0.7 }
    }
    try:
        r = requests.post(url, json=payload, timeout=45)
        r.raise_for_status()
        return r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception as e:
        logging.error(f"❌ خطا در create_artistic_prompt: {e}")
        return user_prompt

def merge_edit_prompt(chat_id: str, user_edit_request: str, model: str) -> str:
    meta = load_chat_meta(chat_id)
    base_prompt = (meta.get("last_edit_prompt") or meta.get("last_english_prompt") or "").strip()
    if base_prompt:
        try:
            return enhance_prompt(base_prompt, user_edit_request, model) or user_edit_request
        except Exception as e:
            logging.warning(f"ادغام پرامپت ویرایش ناموفق: {e}")
            return user_edit_request
    return user_edit_request

# ------------------------ جستجو ------------------------
def stream_search_results(query):
    logging.info(f"🚀 جستجو برای: '{query}'")
    keys_to_try = get_keys_for_request()
    search_model = 'gemini-2.5-flash' 
    url = f"{GOOGLE_API_BASE_URL}/{search_model}:streamGenerateContent?alt=sse"
    payload = {"contents": [{"role": "user", "parts": [{"text": query}]}],"tools": [{"google_search": {}}],"systemInstruction": {"parts": [{"text": "Answer in Persian."}]}}
    for api_key in keys_to_try:
        try:
            with requests.post(url, params={'key': api_key}, json=payload, stream=True, timeout=120) as response:
                if response.status_code == 429:
                    logging.warning("کلید جستجو مسدود. کلید بعدی...")
                    continue
                response.raise_for_status()
                for line in response.iter_lines():
                    if line:
                        yield f"{line.decode('utf-8')}\n\n"
                return
        except requests.exceptions.RequestException as e:
            logging.warning(f"خطای جستجو: {e}. کلید بعدی...")
            continue
    yield f"data: {json.dumps({'error': {'code': 'SEARCH_FAILED','message': 'سرویس جستجو موقتاً در دسترس نیست.'}})}\n\n"

# ------------------------ Fallback parser برای شبه‌کد و متن‌های functionCall: ... ------------------------
def parse_tool_call_from_text(text: str):
    if not text:
        return None
    # حالت‌های مختلف:
    if "functionCall" in text:
        m = re.search(r'functionCall\s*:\s*(\w+)\s*KATEX_INLINE_OPEN', text, flags=re.I)
        if m:
            name = m.group(1)
            return (name, {})  # آرگومان‌ها را در صورت نیاز بعداً پر می‌کنیم
    if "handle_specific_edit" in text:
        m = re.search(r'edit_request\s*=\s*(["\'])(?P<val>.+?)\1', text, flags=re.S)
        if m: return ("handle_specific_edit", {"edit_request": m.group("val")})
        m2 = re.search(r'handle_specific_edit\s*KATEX_INLINE_OPEN', text)
        if m2: return ("handle_specific_edit", {})
    if "change_image_aspect_ratio" in text:
        m_ar = re.search(r'new_aspect_ratio\s*=\s*(["\'])(?P<ar>.+?)\1', text, flags=re.S)
        args = {}
        if m_ar: args["new_aspect_ratio"] = m_ar.group("ar")
        return ("change_image_aspect_ratio", args) if "change_image_aspect_ratio" in text else None
    if "regenerate_with_enhancement" in text:
        return ("regenerate_with_enhancement", {})
    if "generate_image" in text and "english_prompt" in text:
        m_ep = re.search(r'english_prompt\s*=\s*(["\'])(?P<ep>.+?)\1', text, flags=re.S)
        m_ar = re.search(r'aspect_ratio\s*=\s*(["\'])(?P<ar>.+?)\1', text, flags=re.S)
        args = {}
        if m_ep: args["english_prompt"] = m_ep.group("ep")
        if m_ar: args["aspect_ratio"]  = m_ar.group("ar")
        return ("generate_image", args)
    if "print" in text and "handle_specific_edit" in text:
        return ("handle_specific_edit", {})
    return None

def is_tool_like_text(txt: str) -> bool:
    if not txt: return False
    patterns = [
        r'\bfunctionCall\s*:',
        r'\bhandle_specific_edit\s*KATEX_INLINE_OPEN',
        r'\bchange_image_aspect_ratio\s*KATEX_INLINE_OPEN',
        r'\bregenerate_with_enhancement\s*KATEX_INLINE_OPEN',
        r'\bgenerate_image\s*KATEX_INLINE_OPEN',
        r'print\s*KATEX_INLINE_OPEN\s*handle_specific_edit',
    ]
    return any(re.search(p, txt, flags=re.I) for p in patterns)

def sse_text_event(text: str) -> str:
    return f"data: {json.dumps({'candidates':[{'content':{'parts':[{'text': text}]}}]})}\n\n"

# ------------------------ Intent Classifier ------------------------
def classify_user_intent(user_text: str) -> dict:
    """
    intents: NONE, SPECIFIC_EDIT, ASPECT_RATIO_CHANGE, QUALITY_ENHANCEMENT, NEW_IMAGE, CODE_TASK
    optional: normalized_edit, new_aspect_ratio, code_language
    """
    if not user_text or not user_text.strip():
        return {"intent":"NONE"}
    keys_to_try = get_keys_for_request()
    classify_model = 'gemini-2.5-flash'
    url = f"{GOOGLE_API_BASE_URL}/{classify_model}:generateContent"
    system = (
        "You classify ONLY the latest message.\n"
        "Return strict JSON: {\"intent\":\"...\", \"normalized_edit\":\"...\", \"new_aspect_ratio\":\"...\", \"code_language\":\"...\"}\n"
        "intents=[NONE,SPECIFIC_EDIT,ASPECT_RATIO_CHANGE,QUALITY_ENHANCEMENT,NEW_IMAGE,CODE_TASK]. "
        "Thanks/ack/greetings => NONE. Code/markup requests => CODE_TASK."
    )
    payload = {
        "contents": [{"role":"user","parts":[{"text": user_text}]}],
        "systemInstruction": {"parts":[{"text": system}]},
        "generationConfig": {"temperature": 0.0, "maxOutputTokens": 128}
    }
    for api_key in keys_to_try:
        try:
            r = requests.post(f"{url}?key={api_key}", json=payload, timeout=20)
            if r.status_code == 429: continue
            r.raise_for_status()
            txt = r.json()["candidates"][0]["content"]["parts"][0]["text"].strip().strip('`').strip()
            s, e = txt.find('{'), txt.rfind('}')
            if s != -1 and e != -1: txt = txt[s:e+1]
            data = json.loads(txt)
            if "intent" not in data: return {"intent":"NONE"}
            return data
        except Exception as e:
            logging.warning(f"Intent classify failed: {e}")
            continue
    return {"intent":"NONE"}

# ------------------------ استریم‌های متنی/کد/تحلیل فایل ------------------------
def stream_text_only(user_text: str, model_name: str):
    keys_to_try = get_keys_for_request()
    system_text = BASE_RULES_FA + """
[TURN MODE: TEXT ONLY]
- ابزارها را فراخوانی نکن.
- یک پاسخ کوتاه، دوستانه و فارسی بده.
- هرگز نام ابزار یا واژه‌هایی مانند functionCall را در خروجی ننویس.
- از عذرخواهی/محدودیت‌گویی اجتناب کن.
"""
    contents = [{"role":"user","parts":[{"text": user_text }]}]
    responded_text = ""
    for api_key in keys_to_try:
        try:
            url = f"{GOOGLE_API_BASE_URL}/{model_name}:streamGenerateContent?alt=sse&key={api_key}"
            payload = {
                "contents": contents,
                "tools": None,
                "systemInstruction": {"parts": [{"text": system_text}]},
                "generationConfig": {"temperature": 0.3, "maxOutputTokens": 128}
            }
            with requests.post(url, json=payload, stream=True, timeout=60) as resp:
                if resp.status_code == 429:
                    logging.warning("کلید API مسدود. کلید بعدی...")
                    continue
                resp.raise_for_status()
                for line in resp.iter_lines():
                    if not line: continue
                    if line.startswith(b"data: "):
                        chunk_str = line.decode("utf-8")[6:]
                        try:
                            data_chunk = json.loads(chunk_str)
                            part = data_chunk.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0]
                            if "text" in part:
                                t = part["text"]
                                if is_tool_like_text(t):
                                    # نادیده بگیر
                                    continue
                                responded_text += t
                                yield sse_text_event(t)
                        except Exception:
                            continue
                # اگر هیچ متنی نداد، یک پاسخ کوتاه بده
                if not responded_text:
                    default_reply = "مرسی از بازخوردت! خوشحالم که راضی بودی 🌟"
                    yield sse_text_event(default_reply)
                return
        except requests.exceptions.RequestException as e:
            logging.warning(f"Text-only error: {e}")
            continue
    yield f"data: {json.dumps({'error': {'code':'TEXT_STREAM_FAILED','message':'پاسخ متنی موقتاً در دسترس نیست.'}})}\n\n"

def stream_code_reply(user_text: str, model_name: str, code_language: str = None):
    keys_to_try = get_keys_for_request()
    lang = (code_language or "").lower()
    if lang not in {"html","css","javascript","python","sql","bash","json","yaml","xml","markdown","typescript","csharp","java","c","cpp","php","go","rust","kotlin","swift"}:
        lang = "html"
    system_text = BASE_RULES_FA + f"""
[TURN MODE: CODE]
- هیچ ابزاری را فراخوانی نکن.
- کد کامل و قابل اجرا تولید کن داخل ```{lang}.
- توضیح کوتاه فارسی مجاز، تمرکز روی کد.
"""
    contents = [{"role":"user","parts":[{"text": user_text }]}]
    for api_key in keys_to_try:
        try:
            url = f"{GOOGLE_API_BASE_URL}/{model_name}:streamGenerateContent?alt=sse&key={api_key}"
            payload = {
                "contents": contents,
                "tools": None,
                "systemInstruction": {"parts": [{"text": system_text}]},
                "generationConfig": {"temperature": 0.2, "maxOutputTokens": 2048}
            }
            with requests.post(url, json=payload, stream=True, timeout=120) as response:
                if response.status_code == 429:
                    logging.warning("کلید API مسدود. کلید بعدی...")
                    continue
                response.raise_for_status()
                for line in response.iter_lines():
                    if line:
                        # در پاسخ کد، به‌طور معمول فقط متن می‌آید
                        yield line.decode('utf-8') + "\n\n"
                return
        except requests.exceptions.RequestException as e:
            logging.warning(f"Code stream error: {e}")
            continue
    yield f"data: {json.dumps({'error': {'code':'CODE_STREAM_FAILED','message':'تولید کد موقتاً در دسترس نیست.'}})}\n\n"

def stream_file_analysis(history_for_gemini, model_name: str):
    keys_to_try = get_keys_for_request()
    system_text = BASE_RULES_FA + """
[TURN MODE: FILE ANALYSIS]
- ابزارها را فراخوانی نکن.
- فایل ضمیمه‌شده در آخرین پیام کاربر را تحلیل کن: نوع فایل را دقیق تشخیص بده و محتوای آن را خلاصه و منظم شرح بده.
- اگر تصویر است و کاربر صرفاً تحلیل خواسته، فقط محتوای تصویر را توضیح بده (نه ساخت/ویرایش).
"""
    # اینجا می‌توانیم pass-through کنیم؛ معمولاً فقط متن می‌آید
    for api_key in keys_to_try:
        try:
            url = f"{GOOGLE_API_BASE_URL}/{model_name}:streamGenerateContent?alt=sse&key={api_key}"
            payload = {
                "contents": history_for_gemini,
                "tools": None,
                "systemInstruction": {"parts": [{"text": system_text}]},
                "generationConfig": {"temperature": 0.3, "maxOutputTokens": 1024}
            }
            with requests.post(url, json=payload, stream=True, timeout=180) as response:
                if response.status_code == 429:
                    logging.warning("کلید API مسدود. کلید بعدی...")
                    continue
                response.raise_for_status()
                for line in response.iter_lines():
                    if line:
                        yield line.decode('utf-8') + "\n\n"
                return
        except requests.exceptions.RequestException as e:
            logging.warning(f"File analysis error: {e}")
            continue
    yield f"data: {json.dumps({'error': {'code':'FILE_ANALYSIS_FAILED','message':'تحلیل فایل موقتاً در دسترس نیست.'}})}\n\n"

# ------------------------ روت‌ها ------------------------
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/healthz')
def healthz():
    return Response(json.dumps({"status": "ok"}), status=200, mimetype='application/json')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    if not data:
        return Response(json.dumps({"error": "Invalid request"}), status=400, mimetype='application/json')
    
    model = data.get('model', 'gemini-2.5-flash')
    history = data.get('history', [])
    action_payload = data.get('action')
    chat_id = data.get('chatId')

    if not chat_id:
        return Response(json.dumps({"error": "chatId is required"}), status=400, mimetype='application/json')

    # -------- کش فایل: یافتن آخرین پیام کاربر و تزریق قطعی inlineData --------
    def find_last_user_index(hist):
        for i in range(len(hist)-1, -1, -1):
            if hist[i].get('role') == 'user':
                return i
        return None

    cache_file_path = CACHE_DIR / f"{chat_id}.json"
    cache_lock = FileLock(str(cache_file_path) + ".lock")
    file_data_for_gemini = None

    with cache_lock:
        last_user_idx = find_last_user_index(history)
        last_user_message = history[last_user_idx] if last_user_idx is not None else None

        # 1) اگر inlineData در بدنه هست
        if last_user_message:
            existing_inline = next((p for p in (last_user_message.get('parts') or []) if 'inlineData' in p), None)
            if existing_inline:
                file_data_for_gemini = existing_inline['inlineData']
                with open(cache_file_path, 'w') as f:
                    json.dump(file_data_for_gemini, f)
                logging.info(f"inlineData جدید دریافت و کش شد.")

        # 2) از کش
        if not file_data_for_gemini and cache_file_path.exists():
            try:
                with open(cache_file_path, 'r') as f:
                    file_data_for_gemini = json.load(f)
                logging.info(f"inlineData از کش خوانده شد.")
            except (json.JSONDecodeError, FileNotFoundError):
                logging.warning("کش خراب/حذف شده بود.")

        # 3) بازیابی هوشمند از URL
        if not file_data_for_gemini:
            logging.info("کش خالی است. تلاش برای بازیابی از تاریخچه.")
            file_url_to_recover = None
            for message in reversed(history):
                # فقط فایل‌های ارسالی کاربر را برای بازیابی در نظر بگیر
                if message.get('role') == 'user':
                    file_part = next((p for p in (message.get('parts') or []) if p.get('fileUrl')), None)
                    if file_part:
                        file_url_to_recover = file_part['fileUrl']
                        break
            if file_url_to_recover:
                recovered = get_file_data_from_url(file_url_to_recover)
                if recovered:
                    file_data_for_gemini = recovered
                    with open(cache_file_path, 'w') as f:
                        json.dump(file_data_for_gemini, f)
                    logging.info("فایل بازیابی و کش شد.")
            else:
                logging.info("URL بازیابی یافت نشد.")

        # 4) تزریق inlineData به آخرین پیام کاربر
        if file_data_for_gemini and last_user_message:
            parts = last_user_message.get('parts', []) or []
            already = any('inlineData' in p for p in parts)
            if not already:
                parts.insert(0, {'inlineData': file_data_for_gemini})
                last_user_message['parts'] = parts
                logging.info("inlineData به آخرین پیام کاربر تزریق شد.")

    # -------- اکشن مستقیم clarify --------
    if action_payload and action_payload.get('intent') == 'regenerate_with_enhancement':
        def stream_action_result():
            try:
                base_prompt = action_payload.get("base_english_prompt")
                enhancement_request = action_payload.get("enhancement_request")
                aspect_ratio = action_payload.get("aspect_ratio", "9:16")
                if not base_prompt or not enhancement_request:
                    yield f"data: {json.dumps({'error': {'code':'MISSING_ARGS','message':'پارامترهای لازم موجود نیست.'}})}\n\n"
                    return
                logging.info(f"🚀 بهبود پرامپت برای بازسازی: '{enhancement_request}'")
                new_prompt = enhance_prompt(base_prompt, enhancement_request, model)
                yield f"data: {json.dumps({'intent':'generate_image','english_prompt': new_prompt,'aspect_ratio': aspect_ratio})}\n\n"
            except Exception as e:
                logging.error(f"❌ خطای اجرای اکشن: {e}")
                yield f"data: {json.dumps({'error': {'code':'ACTION_EXECUTION_FAILED','message': str(e)}})}\n\n"
        return Response(stream_action_result(), mimetype='text/event-stream')

    # ------------------------ استریم اصلی ------------------------
    def stream_events():
        def send_event(event_data):
            return f"data: {json.dumps(event_data)}\n\n"

        # تاریخچه برای Gemini (فقط text/inlineData/توابع)
        history_for_gemini = []
        for msg in history:
            if 'role' not in msg: continue
            new_msg = {'role': msg['role'], 'parts': []}
            for part in (msg.get('parts') or []):
                if isinstance(part, dict) and any(k in part for k in ['text','inlineData','functionCall','functionResponse']):
                    new_msg['parts'].append(part)
            if new_msg['parts']:
                history_for_gemini.append(new_msg)

        # تشخیص زمینه
        def find_last_user_index_local(hist):
            for i in range(len(hist)-1, -1, -1):
                if hist[i].get('role') == 'user':
                    return i
            return None

        last_user_idx = find_last_user_index_local(history)
        last_user_text = ""
        has_inline_file = False
        if last_user_idx is not None:
            lu = history[last_user_idx]
            last_user_text = ''.join(p.get('text','') for p in (lu.get('parts') or [])).strip()
            has_inline_file = any('inlineData' in p for p in (lu.get('parts') or []))

        image_in_recent_history = False
        for m in history[-4:]:
            if m.get('role') == 'model' and any('image_url' in p or 'edited_images' in p for p in (m.get('parts') or [])):
                image_in_recent_history = True
                break

        intent_info = classify_user_intent(last_user_text) if last_user_text else {"intent":"NONE"}
        intent = (intent_info.get("intent") or "NONE").upper()
        logging.info(f"Intent: {intent} | inline={has_inline_file} | image_recent={image_in_recent_history}")

        # 1) کدنویسی
        if intent == "CODE_TASK":
            yield from stream_code_reply(last_user_text, model, intent_info.get("code_language"))
            return

        # 2) بعد از تصویر: تشکر/گفت‌وگو => متن کوتاه
        # FIX: اولویت پاسخ متنی کوتاه بعد از تولید/ویرایش تصویر حتی در صورت وجود inlineData
        if image_in_recent_history and last_user_text and intent == "NONE":
            yield from stream_text_only(last_user_text, model)
            return

        # 3) اگر فایل هست و کاربر درخواست تصویر/کد نداده => تحلیل فایل
        if has_inline_file and intent in {"NONE"}:
            yield from stream_file_analysis(history_for_gemini, model)
            return

        # 4) مسیرهای تصویر بر اساس intent
        if image_in_recent_history and last_user_text:
            if intent == "SPECIFIC_EDIT":
                merged = merge_edit_prompt(chat_id, intent_info.get("normalized_edit") or last_user_text, model)
                update_chat_meta(chat_id, last_edit_prompt=merged)
                yield send_event({"intent": "edit_image", "prompt": merged})
                return
            elif intent == "ASPECT_RATIO_CHANGE":
                meta = load_chat_meta(chat_id)
                ep = meta.get("last_edit_prompt") or meta.get("last_english_prompt") or ""
                new_ar = intent_info.get("new_aspect_ratio") or meta.get("last_aspect_ratio") or "9:16"
                yield send_event({"intent": "generate_image", "english_prompt": ep, "aspect_ratio": new_ar})
                return
            elif intent == "QUALITY_ENHANCEMENT":
                meta = load_chat_meta(chat_id)
                prev_ep = meta.get("last_edit_prompt") or meta.get("last_english_prompt") or ""
                prev_ar = meta.get("last_aspect_ratio") or "9:16"
                enh = intent_info.get("normalized_edit") or last_user_text
                yield send_event({
                    "intent": "clarify_action",
                    "question": "بسیار خب! تصویر فعلی را ویرایش کنم یا یک تصویر جدید بسازم؟",
                    "options": {
                        "edit": {"label": "ویرایش همین تصویر", "intent": "edit_image", "prompt": enh},
                        "regenerate": {"label": "ساخت تصویر جدید", "intent": "regenerate_with_enhancement", "base_english_prompt": prev_ep, "enhancement_request": enh, "aspect_ratio": prev_ar}
                    }
                })
                return
            elif intent == "NEW_IMAGE":
                ep = create_artistic_prompt(last_user_text, model)
                update_chat_meta(chat_id, last_english_prompt=ep, last_aspect_ratio="9:16", last_edit_prompt=None)
                yield send_event({
                    "intent": "generate_image_with_text",
                    "text": "در حال ساخت تصویر جدید برای شما...",
                    "image_generation_payload": {"english_prompt": ep, "aspect_ratio": "9:16"},
                    "follow_up_text": "تصویر شما آماده شد!"
                })
                return

        # 5) مسیر جنرال با ابزارهای تصویر
        tools_for_request = get_all_tools()
        final_system_prompt = BASE_RULES_FA + """
[TURN MODE: GENERAL]
- برای درخواست‌های تصویر از ابزارها استفاده کن؛ در غیر این صورت پاسخ متنی/کُد بده.
- از شبه‌کد برای ابزارها خودداری کن (فقط functionCall واقعی). هرگز متن‌هایی مانند 'functionCall: ...' در خروجی ننویس.
"""

        keys_to_try = get_keys_for_request()
        accumulated_function_call_args = None
        function_call_name = None

        for api_key in keys_to_try:
            try:
                url = f"{GOOGLE_API_BASE_URL}/{model}:streamGenerateContent?alt=sse&key={api_key}"
                payload = {"contents": history_for_gemini, "tools": tools_for_request, "systemInstruction": {"parts": [{"text": final_system_prompt}]}}
                with requests.post(url, json=payload, stream=True, timeout=720) as response:
                    if response.status_code == 429:
                        logging.warning("کلید API مسدود. کلید بعدی...")
                        continue
                    response.raise_for_status()

                    for line in response.iter_lines():
                        if not line: continue
                        if line.startswith(b'data: '):
                            chunk_str = line.decode('utf-8')[6:]
                            try:
                                data_chunk = json.loads(chunk_str)
                                part = data_chunk.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0]

                                if "functionCall" in part:
                                    if not accumulated_function_call_args:
                                        accumulated_function_call_args = {}
                                        function_call_name = part["functionCall"].get("name")
                                    args_chunk = part["functionCall"].get("args", {})
                                    for k, v in (args_chunk or {}).items():
                                        if k not in accumulated_function_call_args:
                                            accumulated_function_call_args[k] = v
                                        elif isinstance(accumulated_function_call_args[k], str):
                                            accumulated_function_call_args[k] += str(v)
                                elif "text" in part:
                                    t = part["text"]
                                    # فیلتر متن‌های شبیه functionCall:
                                    if is_tool_like_text(t):
                                        continue
                                    # پاس‌ترو متن پاک‌شده
                                    yield sse_text_event(t)

                            except Exception:
                                continue

                if accumulated_function_call_args:
                    args = accumulated_function_call_args
                    logging.info(f"✅ functionCall: {function_call_name} args={args}")

                    if function_call_name == "handle_specific_edit":
                        raw_req = (args.get("edit_request") or "").strip()
                        if not raw_req:
                            yield send_event({"error": {"code":"EMPTY_EDIT_REQUEST","message":"دستور ویرایش دریافت نشد."}})
                            return
                        merged = merge_edit_prompt(chat_id, raw_req, model)
                        update_chat_meta(chat_id, last_edit_prompt=merged)
                        yield send_event({"intent":"edit_image","prompt": merged})
                        return

                    elif function_call_name == "regenerate_with_enhancement":
                        meta = load_chat_meta(chat_id)
                        prev_ep = args.get("previous_english_prompt") or meta.get("last_edit_prompt") or meta.get("last_english_prompt") or ""
                        prev_ar = args.get("previous_aspect_ratio") or meta.get("last_aspect_ratio") or "9:16"
                        enhancement_request = args.get("enhancement_request", "")
                        yield send_event({
                            "intent":"clarify_action",
                            "question":"بسیار خب! با این تغییرات چه کنم؟",
                            "options":{
                                "edit":{"label":"ویرایش همین تصویر","intent":"edit_image","prompt": enhancement_request},
                                "regenerate":{"label":"ساخت تصویر جدید","intent":"regenerate_with_enhancement","base_english_prompt": prev_ep,"enhancement_request": enhancement_request,"aspect_ratio": prev_ar}
                            }
                        })
                        return

                    elif function_call_name == "change_image_aspect_ratio":
                        meta = load_chat_meta(chat_id)
                        ep = args.get("previous_english_prompt") or meta.get("last_edit_prompt") or meta.get("last_english_prompt") or ""
                        new_ar = args.get("new_aspect_ratio") or meta.get("last_aspect_ratio") or "9:16"
                        yield send_event({"intent":"generate_image","english_prompt": ep,"aspect_ratio": new_ar})
                        return

                    elif function_call_name == "generate_image":
                        ep = args.get("english_prompt")
                        ar = args.get("aspect_ratio", "9:16")
                        update_chat_meta(chat_id, last_english_prompt=ep, last_aspect_ratio=ar, last_edit_prompt=None)
                        yield send_event({
                            "intent":"generate_image_with_text",
                            "text": args.get("initial_response_text"),
                            "image_generation_payload": {"english_prompt": ep,"aspect_ratio": ar},
                            "follow_up_text": args.get("follow_up_text")
                        })
                        return

                    elif function_call_name == "perform_internet_search":
                        yield from stream_search_results(args.get('query'))
                        return

                # Fallback: شبه‌کد/متن‌های ابزار
                return

            except requests.exceptions.RequestException as e:
                if getattr(e, "response", None) is not None:
                    logging.error(f"HTTP خطا از Gemini: {e.response.status_code} - {e.response.text}. کلید بعدی...")
                else:
                    logging.warning(f"خطا در ارتباط با Gemini: {e}. کلید بعدی...")
                continue

        yield send_event({"error": {"code": "ALL_KEYS_FAILED", "message": "تمام کلیدهای API خطا دادند یا درخواست نامعتبر بود."}})

    return Response(stream_events(), mimetype='text/event-stream')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=7860)
