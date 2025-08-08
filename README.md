---
title: Chatlala
emoji: 🏃
colorFrom: red
colorTo: green
sdk: docker
pinned: false
---

Check out the configuration reference at https://huggingface.co/docs/hub/spaces-config-reference

# ChatGPT Clone

یک کلون کامل و دقیق از ChatGPT با طراحی مشابه و عملکرد کامل.

## ویژگی‌ها

- ✅ طراحی دقیقاً مشابه ChatGPT اصلی
- ✅ تم روشن و تاریک
- ✅ ذخیره تاریخچه مکالمات
- ✅ رابط کاربری واکنش‌گرا (Responsive)
- ✅ انیمیشن‌های نرم و زیبا
- ✅ کاملاً فارسی

## راه‌اندازی محلی

```bash
# کلون کردن پروژه
git clone [YOUR_REPO_URL]
cd chatgpt-clone

# نصب dependencies
pip install -r requirements.txt

# اجرای سرور
python app.py
```

سپس به `http://localhost:5000` بروید.

## Deploy در Render

### مرحله 1: آپلود کد
1. کد را در GitHub قرار دهید
2. به [Render.com](https://render.com) بروید
3. "New Web Service" را انتخاب کنید
4. Repository GitHub خود را انتخاب کنید

### مرحله 2: تنظیمات Deploy
```
Name: chatgpt-clone
Environment: Python 3
Build Command: pip install -r requirements.txt
Start Command: gunicorn app:app
```

### مرحله 3: متغیرهای محیطی (اختیاری)
```
SECRET_KEY=your-secret-key-here
PORT=10000
```

### مرحله 4: Deploy
"Create Web Service" را کلیک کنید و منتظر بمانید تا deploy کامل شود.

## ساختار پروژه

```
chatgpt-clone/
├── app.py                 # سرور Flask اصلی
├── requirements.txt       # Dependencies
├── templates/
│   └── index.html        # صفحه اصلی
└── static/
    ├── css/
    │   └── style.css     # استایل‌های ChatGPT
    └── js/
        └── script.js     # عملکرد JavaScript
```

## API Endpoints

- `GET /` - صفحه اصلی
- `POST /api/chat` - ارسال پیام
- `GET /api/conversations` - دریافت لیست مکالمات
- `GET /api/conversations/<id>` - دریافت مکالمه خاص
- `DELETE /api/conversations/<id>` - حذف مکالمه
- `GET /health` - چک سلامت سرور

## مشکلات رایج

### 1. سرور روشن نمی‌شود
```bash
# چک کردن Python version
python --version

# نصب مجدد dependencies
pip install -r requirements.txt
```

### 2. صفحه لود نمی‌شود
- مطمئن شوید port 5000 آزاد باشد
- فایروال را چک کنید

### 3. JavaScript کار نمی‌کند
- Console را در Developer Tools چک کنید
- مطمئن شوید تمام فایل‌ها لود شده‌اند

## لایسنس

MIT License - برای استفاده شخصی و تجاری آزاد هستید.

## حمایت

اگر این پروژه برایتان مفید بود، ⭐ بدهید!

---

ساخته شده با ❤️ برای جامعه ایرانی
