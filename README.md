# 🚗 دستیار هوشمند قیمت خودرو (AI Car Price Assistant)

نسخه جدید پروژه **Artin**: کاربر مشخصات خودرو را وارد می‌کند، هوش مصنوعی (DeepSeek از طریق Metis) آن را تحلیل می‌کند و یک **بازه قیمت تخمینی و آموزشی** همراه با دلیل‌ها و نکات خرید و فروش نمایش می‌دهد.

> ⚠️ این پروژه آموزشی است. هوش مصنوعی به قیمت لحظه‌ای بازار دسترسی ندارد و عددها فقط تخمین هستند.

---

## معماری (Demo architecture)

```text
User
 ↓
GitHub Pages  (HTML + CSS + JavaScript)
 ↓  POST /api/analyze-car
Python Backend (FastAPI روی Render)   ← کلید API فقط اینجاست
 ↓
Metis API
 ↓
DeepSeek
 ↓
Python Backend
 ↓
Frontend
 ↓
User
```

**چرا این انتخاب‌ها؟**

| بخش | انتخاب | دلیل |
|---|---|---|
| Frontend | HTML/CSS/JS ساده | بدون نصب و build؛ مستقیم روی GitHub Pages اجرا می‌شود |
| Backend | FastAPI | کم‌حجم، یک فایل، و صفحه تست خودکار در `/docs` |
| میزبانی Backend | [Render](https://render.com) (پلن Free) | مستقیم به GitHub وصل می‌شود، بدون Docker و کارت بانکی، و Environment Variable را در یک فرم ساده می‌گیرد |

## ساختار فایل‌ها

```text
car-ai-assistant/
│
├── frontend/
│   ├── index.html        ← صفحه سایت
│   ├── style.css         ← ظاهر سایت
│   └── script.js         ← منطق فرم و ارتباط با Backend
│
├── backend/
│   ├── main.py           ← API (FastAPI)
│   ├── requirements.txt  ← کتابخانه‌های Python
│   ├── .env.example      ← نمونه فایل تنظیمات (بدون کلید واقعی)
│   └── .gitignore        ← جلوگیری از آپلود .env
│
├── .github/workflows/pages.yml  ← انتشار خودکار frontend روی GitHub Pages
└── README.md
```

## How it works

```text
Browser
   ↓
Frontend
   ↓
FastAPI
   ↓
Metis
   ↓
DeepSeek
   ↓
FastAPI
   ↓
Browser
```

1. کاربر فرم را پر می‌کند و دکمه «🤖 تخمین و تحلیل خودرو» را می‌زند.
2. `script.js` فرم را بررسی می‌کند و یک درخواست `POST` با JSON به `API_URL/api/analyze-car` می‌فرستد.
3. `main.py` ورودی را validate می‌کند، یک Prompt می‌سازد و با کلیدی که در Environment Variable است Metis را صدا می‌زند.
4. Metis درخواست را به مدل DeepSeek می‌دهد و متن پاسخ را برمی‌گرداند.
5. Backend پاسخ را به شکل `{"success": true, "analysis": "..."}` به مرورگر می‌فرستد.
6. `script.js` متن را به چهار کارت (بازه قیمت، تحلیل، عوامل مؤثر، نکات مهم) تبدیل و نمایش می‌دهد.

کلید API هیچ‌وقت به مرورگر نمی‌رسد؛ برای همین Backend لازم است.

---

## ۱) نصب Backend (روی کامپیوتر خودتان)

پیش‌نیاز: Python 3.10 یا بالاتر.

```bash
cd backend
python -m venv venv

# ویندوز:
venv\Scripts\activate
# مک / لینوکس:
source venv/bin/activate

pip install -r requirements.txt
```

## ۲) تنظیم API Key

از فایل نمونه یک کپی به نام `.env` بسازید:

```bash
# ویندوز:
copy .env.example .env
# مک / لینوکس:
cp .env.example .env
```

فایل `.env` را باز کنید و کلید واقعی Metis را بگذارید:

```text
METIS_API_KEY=کلید_واقعی_شما
```

فایل `.env` در `.gitignore` است و به GitHub نمی‌رود. **کلید را هیچ جای دیگری ننویسید.**

تنظیمات اختیاری (معمولاً لازم نیست):

| متغیر | پیش‌فرض | کاربرد |
|---|---|---|
| `METIS_MODEL` | `deepseek-v4-flash` | نام مدل |
| `METIS_BASE_URL` | `https://api.metisai.ir/deepseek/v1` | آدرس Metis |
| `ALLOWED_ORIGINS` | `*` | سایت‌هایی که اجازه صدا زدن API را دارند |

## ۳) اجرای Local

```bash
cd backend
uvicorn main:app --reload --port 8000
```

حالا Backend روی `http://127.0.0.1:8000` است.

برای دیدن سایت: در `frontend/script.js` موقتاً بنویسید `const API_URL = "http://127.0.0.1:8000";` و فایل `frontend/index.html` را در مرورگر باز کنید. (قبل از انتشار، آدرس Render را جایش بگذارید.)

## ۴) تست API

**Health check:** در مرورگر باز کنید: `http://127.0.0.1:8000/health`

```json
{"status": "ok", "api_key_configured": true, "model": "deepseek-v4-flash"}
```

اگر `api_key_configured` برابر `false` بود، کلید خوانده نشده است.

**تست تحلیل خودرو (ساده‌ترین راه):** `http://127.0.0.1:8000/docs` را باز کنید ← `POST /api/analyze-car` ← **Try it out** ← این JSON را بگذارید ← **Execute**:

```json
{
  "brand": "BMW",
  "model": "X3",
  "year": 2022,
  "mileage": 40000,
  "body_condition": "سالم و بدون خط و خش",
  "paint_condition": "بدون رنگ",
  "technical_condition": "عالی",
  "city": "تهران",
  "description": ""
}
```

یا با curl:

```bash
curl -X POST http://127.0.0.1:8000/api/analyze-car \
  -H "Content-Type: application/json" \
  -d '{"brand":"BMW","model":"X3","year":2022,"mileage":40000,"body_condition":"سالم","paint_condition":"بدون رنگ","technical_condition":"عالی","city":"تهران","description":""}'
```

پاسخ موفق: `{"success": true, "analysis": "...", "model": "..."}`
پاسخ خطا: `{"success": false, "message": "پیام فارسی قابل فهم"}`

---

## ۵) قرار دادن پروژه روی GitHub

1. در GitHub یک repository جدید و **Public** بسازید (مثلاً `car-ai-assistant`).
2. در پوشه پروژه:

```bash
git init
git add .
git commit -m "AI Car Price Assistant"
git branch -M main
git remote add origin https://github.com/USERNAME/car-ai-assistant.git
git push -u origin main
```

قبل از push با `git status` مطمئن شوید فایل `.env` در لیست نیست.

(بدون خط فرمان: در صفحه repository روی **Add file → Upload files** بزنید و پوشه‌ها را بکشید داخل صفحه. پوشه `.github` مخفی است؛ حتماً آن را هم آپلود کنید. فایل `.env` را آپلود نکنید.)

## ۶) Deploy Backend روی Render

1. در [render.com](https://render.com) با حساب GitHub ثبت‌نام کنید.
2. **New + → Web Service** و repository پروژه را انتخاب کنید.
3. تنظیمات را دقیقاً این‌طور پر کنید:

| گزینه | مقدار |
|---|---|
| Name | `car-ai-assistant` (دلخواه) |
| Language / Runtime | `Python 3` |
| Branch | `main` |
| **Root Directory** | `backend` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Instance Type | `Free` |

4. **تنظیم کلید Metis:** در بخش **Environment Variables** روی **Add Environment Variable** بزنید:
   - Key: `METIS_API_KEY`
   - Value: کلید واقعی شما
5. روی **Create Web Service** بزنید و چند دقیقه صبر کنید تا وضعیت **Live** شود.
6. آدرس سرویس بالای صفحه است؛ چیزی مثل `https://car-ai-assistant.onrender.com`.
7. تست: `https://car-ai-assistant.onrender.com/health` را باز کنید و مطمئن شوید `"api_key_configured": true` است.

برای تغییر کلید در آینده: صفحه سرویس ← **Environment** ← ویرایش ← **Save Changes** (سرویس خودش دوباره راه‌اندازی می‌شود).

**نکته‌های پلن Free:**
- سرویس بعد از حدود ۱۵ دقیقه بی‌کاری می‌خوابد و اولین درخواست بعدی حدود ۳۰ تا ۶۰ ثانیه طول می‌کشد. سایت در این حالت پیام «سرور دارد از خواب بیدار می‌شود» نشان می‌دهد. قبل از ارائه در کلاس، یک بار `/health` را باز کنید تا سرور بیدار شود.
- سرور Render خارج از ایران است. اگر Metis از آنجا در دسترس نبود (در Logs خطای اتصال دیدید)، همین پوشه `backend` را بدون تغییر روی یک سرویس داخلی که Python را پشتیبانی می‌کند قرار دهید؛ فقط همان Start Command و همان `METIS_API_KEY` لازم است.

## ۷) اتصال Frontend و Backend

فایل `frontend/script.js` را باز کنید و خط بالای فایل را عوض کنید:

```javascript
const API_URL = "https://car-ai-assistant.onrender.com";
```

(بدون `/` در انتها.) بعد تغییر را commit و push کنید.

## ۸) Deploy Frontend روی GitHub Pages

1. در repository: **Settings → Pages**.
2. در **Build and deployment → Source** گزینه **GitHub Actions** را انتخاب کنید.
3. به تب **Actions** بروید؛ workflow با نام *Deploy frontend to GitHub Pages* باید اجرا و سبز شود. (اگر اجرا نشده بود: روی نامش بزنید ← **Run workflow**.)
4. سایت در این آدرس است: `https://USERNAME.github.io/car-ai-assistant/`

از این به بعد هر push روی `main` سایت را خودکار به‌روز می‌کند.

> روش جایگزین بدون Actions: نام پوشه `frontend` را به `docs` تغییر دهید و در **Settings → Pages** گزینه **Deploy from a branch** ← `main` ← `/docs` را انتخاب کنید.

## ۹) تست نهایی

1. `https://آدرس-backend/health` باز شود و `api_key_configured` برابر `true` باشد.
2. سایت GitHub Pages را باز کنید.
3. فرم را خالی بفرستید ← باید پیام «لطفاً این بخش‌ها را درست پر کن» بیاید.
4. فرم را کامل پر کنید و دکمه را بزنید ← دکمه «در حال تحلیل خودرو... 🤖» می‌شود و بعد چهار کارت نتیجه نمایش داده می‌شود.
5. «🔄 تحلیل دوباره» و «🚘 خودروی جدید» را امتحان کنید.
6. سایت را روی موبایل هم باز کنید.

---

## مشکلات رایج

| مشکل | علت و راه‌حل |
|---|---|
| پیام «آدرس سرور هنوز تنظیم نشده است» | `API_URL` در `script.js` هنوز `YOUR_BACKEND_URL` است. آدرس Render را بگذارید و push کنید. |
| پیام «کلید سرویس هوش مصنوعی معتبر نیست» | `METIS_API_KEY` اشتباه است. در Render ← Environment اصلاحش کنید (بدون فاصله و گیومه). |
| پیام «سرور هنوز کامل تنظیم نشده است» | متغیر `METIS_API_KEY` اصلاً تعریف نشده است. |
| پیام «سرویس هوش مصنوعی الان شلوغ است یا اعتبار آن تمام شده» | اعتبار حساب Metis را بررسی کنید. |
| اولین درخواست خیلی طول می‌کشد | سرور رایگان خواب بوده؛ طبیعی است. درخواست‌های بعدی سریع هستند. |
| پیام کلی «در ارتباط با سرویس هوش مصنوعی مشکلی پیش آمد» | (۱) آدرس `API_URL` غلط است یا `http` به جای `https` نوشته شده؛ (۲) سرور خاموش است؛ (۳) Metis در دسترس سرور نیست. در Render ← **Logs** علت دقیق نوشته می‌شود. |
| خطای CORS در Console مرورگر | اگر `ALLOWED_ORIGINS` را تنظیم کرده‌اید باید دقیقاً `https://USERNAME.github.io` باشد (بدون مسیر و بدون `/` آخر). اگر تنظیمش نکرده‌اید، معمولاً یعنی سرور اصلاً جواب نداده است. |
| Deploy در Render با خطا متوقف می‌شود | Root Directory باید `backend` باشد و Start Command دقیقاً همان خط بالا. |
| سایت GitHub Pages خطای 404 می‌دهد | Source روی **GitHub Actions** نیست، یا workflow هنوز تمام نشده، یا پوشه `.github` آپلود نشده است. |
| تغییرات سایت دیده نمی‌شود | با Ctrl+F5 صفحه را تازه کنید. |
| نام مدل پیدا نمی‌شود | متغیر `METIS_MODEL` را در Render با نام مدلی که در پنل Metis فعال است تنظیم کنید. |

## امنیت

- کلید API فقط در Environment Variable سرور است؛ نه در HTML، نه در JavaScript، نه در GitHub.
- `.env` در `.gitignore` است و `.env.example` فقط مقدار نمونه دارد.
- متن پاسخ AI با `textContent` نمایش داده می‌شود، پس کد مخرب احتمالی در آن اجرا نمی‌شود.
- اگر کلیدی اشتباهی در GitHub قرار گرفت، فوراً آن را در پنل Metis باطل کنید و کلید جدید بسازید.
