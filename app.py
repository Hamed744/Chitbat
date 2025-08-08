import os
import json
import uuid
from datetime import datetime
from flask import Flask, render_template, request, jsonify, session

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-here')

# ذخیره پیام‌ها در memory (در production از database استفاده کنید)
conversations = {}

@app.route('/')
def index():
    """صفحه اصلی چت‌بات"""
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    """API برای ارسال و دریافت پیام‌ها"""
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        conversation_id = data.get('conversation_id')
        
        if not message:
            return jsonify({'error': 'پیام خالی است'}), 400
        
        # اگر conversation_id وجود ندارد، یکی جدید بساز
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
            conversations[conversation_id] = []
        
        # پیام کاربر را ذخیره کن
        user_message = {
            'role': 'user',
            'content': message,
            'timestamp': datetime.now().isoformat()
        }
        
        if conversation_id not in conversations:
            conversations[conversation_id] = []
        
        conversations[conversation_id].append(user_message)
        
        # پاسخ ساده بات (اینجا می‌توانید با API واقعی جایگزین کنید)
        bot_response = generate_response(message)
        
        bot_message = {
            'role': 'assistant',
            'content': bot_response,
            'timestamp': datetime.now().isoformat()
        }
        
        conversations[conversation_id].append(bot_message)
        
        return jsonify({
            'success': True,
            'conversation_id': conversation_id,
            'response': bot_response,
            'message_count': len(conversations[conversation_id])
        })
        
    except Exception as e:
        return jsonify({'error': f'خطا در پردازش پیام: {str(e)}'}), 500

@app.route('/api/conversations/<conversation_id>')
def get_conversation(conversation_id):
    """دریافت تاریخچه مکالمه"""
    if conversation_id in conversations:
        return jsonify({
            'conversation_id': conversation_id,
            'messages': conversations[conversation_id]
        })
    else:
        return jsonify({'error': 'مکالمه پیدا نشد'}), 404

@app.route('/api/conversations')
def list_conversations():
    """لیست تمام مکالمات"""
    conv_list = []
    for conv_id, messages in conversations.items():
        if messages:
            first_message = messages[0]['content'][:50] + ('...' if len(messages[0]['content']) > 50 else '')
            conv_list.append({
                'id': conv_id,
                'title': first_message,
                'message_count': len(messages),
                'last_updated': messages[-1]['timestamp'] if messages else None
            })
    
    # مرتب کردن بر اساس آخرین بروزرسانی
    conv_list.sort(key=lambda x: x['last_updated'] or '', reverse=True)
    
    return jsonify({'conversations': conv_list})

@app.route('/api/conversations/<conversation_id>', methods=['DELETE'])
def delete_conversation(conversation_id):
    """حذف مکالمه"""
    if conversation_id in conversations:
        del conversations[conversation_id]
        return jsonify({'success': True, 'message': 'مکالمه حذف شد'})
    else:
        return jsonify({'error': 'مکالمه پیدا نشد'}), 404

@app.route('/health')
def health():
    """چک کردن سلامت سرور"""
    return jsonify({'status': 'ok', 'message': 'سرور در حال اجرا است'})

def generate_response(message):
    """تولید پاسخ ساده (می‌توانید با AI واقعی جایگزین کنید)"""
    
    # پاسخ‌های پیش‌فرض
    if 'سلام' in message or 'درود' in message:
        return 'سلام! من ChatGPT هستم. چطور می‌توانم کمکتان کنم؟'
    
    elif 'چطوری' in message or 'حالت چطوره' in message:
        return 'من یک هوش مصنوعی هستم و همیشه آماده کمک به شما هستم! چه کاری می‌توانم برایتان انجام دهم؟'
    
    elif 'اسمت چیه' in message or 'نامت چیست' in message:
        return 'من ChatGPT هستم، یک مدل زبانی هوش مصنوعی که توسط OpenAI ساخته شده‌ام.'
    
    elif 'کمک' in message:
        return 'البته! من می‌توانم در موارد زیر به شما کمک کنم:\n\n• پاسخ به سوالات عمومی\n• نوشتن متن\n• ترجمه\n• برنامه‌نویسی\n• و خیلی موارد دیگر\n\nچه کاری می‌توانم برایتان انجام دهم؟'
    
    elif 'خداحافظ' in message or 'بای' in message:
        return 'خداحافظ! امیدوارم گفتگوی ما مفید بوده باشد. هر وقت احتیاج داشتید برگردید! 👋'
    
    else:
        # پاسخ عمومی
        responses = [
            f'پیام شما "{message}" را دریافت کردم. متاسفانه در حال حاضر امکان پردازش کامل پیام‌ها وجود ندارد، اما این سیستم آماده اتصال به API های هوش مصنوعی است.',
            f'درباره "{message}" سوال جالبی پرسیدید! برای پاسخ کامل‌تر، لطفاً API واقعی هوش مصنوعی را پیکربندی کنید.',
            f'موضوع "{message}" جذاب است. این یک نسخه نمایشی از چت‌بات است که می‌تواند با هر API هوش مصنوعی کار کند.'
        ]
        
        import random
        return random.choice(responses)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)