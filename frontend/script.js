// =====================================================================
//  آدرس Backend را اینجا قرار بده (بدون / در انتها)
//  مثال: const API_URL = "https://car-ai-assistant.onrender.com";
//  توجه: هیچ API Key در این فایل نیست و نباید باشد.
// =====================================================================
const API_URL = "YOUR_BACKEND_URL";

// ---------- داده‌های فرم ----------
const OTHER = "__other__";

const CARS = {
  "ایران‌خودرو": ["سمند", "دنا", "دنا پلاس", "تارا", "رانا", "سورن", "پژو پارس", "پژو 405", "پژو 206", "پژو 207", "هایما S7"],
  "سایپا": ["پراید", "تیبا", "کوییک", "ساینا", "شاهین", "اطلس"],
  "پژو": ["206", "207", "405", "پارس", "2008", "508"],
  "رنو": ["تندر 90 (L90)", "ساندرو", "ساندرو استپ‌وی", "داستر", "کولئوس", "تلیسمان"],
  "کیا": ["سراتو", "اپتیما", "اسپورتیج", "سورنتو", "ریو", "پیکانتو"],
  "هیوندای": ["النترا", "سوناتا", "توسان", "سانتافه", "اکسنت", "i20"],
  "تویوتا": ["کرولا", "کمری", "RAV4", "پرادو", "لندکروز", "هایلوکس", "یاریس"],
  "نیسان": ["جوک", "قشقایی", "ایکس‌تریل", "ماکسیما", "تیانا"],
  "مزدا": ["مزدا 3", "مزدا 2", "مزدا 6", "CX-5"],
  "BMW": ["سری 3", "سری 5", "سری 7", "X1", "X3", "X4", "X5", "X6"],
  "مرسدس بنز": ["C200", "E200", "E250", "S500", "GLA", "GLC", "CLA"],
  "چری / ام‌وی‌ام": ["تیگو 5", "تیگو 7", "تیگو 8", "آریزو 5", "آریزو 6", "MVM X22", "MVM X33", "MVM 315"],
  "جک": ["J4", "S3", "S5", "J7"],
  "لکسوس": ["NX", "RX", "ES", "IS"],
};

const CITIES = [
  "تهران", "مشهد", "اصفهان", "شیراز", "تبریز", "کرج", "اهواز", "قم", "کرمانشاه",
  "رشت", "ارومیه", "کرمان", "یزد", "همدان", "اراک", "اردبیل", "بندرعباس",
  "زاهدان", "قزوین", "ساری", "گرگان", "سنندج", "زنجان", "بوشهر",
];

const GENERIC_ERROR =
  "متأسفانه در ارتباط با سرویس هوش مصنوعی مشکلی پیش آمد. لطفاً چند لحظه بعد دوباره تلاش کنید.";

// ---------- عناصر صفحه ----------
const $ = (id) => document.getElementById(id);

const form = $("carForm");
const submitBtn = $("submitBtn");
const formError = $("formError");
const formCard = $("formCard");
const loadingCard = $("loadingCard");
const loadingSub = $("loadingSub");
const resultCard = $("resultCard");
const resultBody = $("resultBody");
const carChips = $("carChips");

const SUBMIT_TEXT = submitBtn.textContent;
let lastPayload = null;

// ---------- ابزارهای کمکی ----------
// تبدیل عددهای فارسی و عربی به انگلیسی و حذف هر چیز غیرعددی
function toNumber(text) {
  const latin = String(text)
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/[^\d]/g, "");
  return latin === "" ? NaN : Number(latin);
}

const faNum = (n) => Number(n).toLocaleString("fa-IR");

function addOptions(select, items, withOther) {
  items.forEach((item) => select.add(new Option(item, item)));
  if (withOther) select.add(new Option("سایر (خودم می‌نویسم)…", OTHER));
}

// مقدار یک dropdown که گزینه «سایر» دارد
function pick(select, otherInput) {
  return (select.value === OTHER ? otherInput.value : select.value).trim();
}

function toggleOther(select, otherInput) {
  const show = select.value === OTHER;
  otherInput.classList.toggle("hidden", !show);
  if (show) otherInput.focus();
  else otherInput.value = "";
}

// ---------- پر کردن dropdownها ----------
addOptions($("brand"), Object.keys(CARS), true);
addOptions($("city"), CITIES, true);

$("brand").addEventListener("change", () => {
  const brand = $("brand").value;
  const model = $("model");
  toggleOther($("brand"), $("brandOther"));

  model.length = 0;
  $("modelOther").classList.add("hidden");
  $("modelOther").value = "";

  if (!brand) {
    model.add(new Option("اول برند را انتخاب کن", ""));
    model.disabled = true;
    return;
  }
  model.disabled = false;
  model.add(new Option("انتخاب کن…", ""));
  addOptions(model, CARS[brand] || [], true);
  if (brand === OTHER) {
    model.value = OTHER;
    $("modelOther").classList.remove("hidden");
  }
});

$("model").addEventListener("change", () => toggleOther($("model"), $("modelOther")));
$("city").addEventListener("change", () => toggleOther($("city"), $("cityOther")));

$("mileage").addEventListener("input", () => {
  const km = toNumber($("mileage").value);
  $("mileageHint").textContent = isNaN(km)
    ? "اگر صفر است، ۰ بنویس"
    : faNum(km) + " کیلومتر";
});

$("description").addEventListener("input", () => {
  $("descCount").textContent = faNum($("description").value.length);
});

// ---------- جمع‌آوری و بررسی فرم ----------
function collectForm() {
  const data = {
    brand: pick($("brand"), $("brandOther")),
    model: pick($("model"), $("modelOther")),
    year: toNumber($("year").value),
    mileage: toNumber($("mileage").value),
    body_condition: $("body").value,
    paint_condition: $("paint").value,
    technical_condition: $("tech").value,
    city: pick($("city"), $("cityOther")),
    description: $("description").value.trim(),
  };

  const yearOk =
    (data.year >= 1350 && data.year <= 1410) || (data.year >= 1970 && data.year <= 2030);

  // [عنصر, آیا درست است؟, نام فارسی]
  const checks = [
    [$("brand").value === OTHER ? $("brandOther") : $("brand"), !!data.brand, "برند"],
    [$("model").value === OTHER ? $("modelOther") : $("model"), !!data.model, "مدل"],
    [$("year"), yearOk, "سال تولید"],
    [$("mileage"), data.mileage >= 0 && data.mileage <= 2000000, "کارکرد"],
    [$("body"), !!data.body_condition, "وضعیت بدنه"],
    [$("paint"), !!data.paint_condition, "میزان رنگ‌شدگی"],
    [$("tech"), !!data.technical_condition, "وضعیت فنی"],
    [$("city").value === OTHER ? $("cityOther") : $("city"), !!data.city, "شهر"],
  ];

  document.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
  const missing = [];
  checks.forEach(([el, ok, label]) => {
    if (!ok) {
      el.classList.add("invalid");
      missing.push(label);
    }
  });

  return { data, missing, firstInvalid: checks.find((c) => !c[1])?.[0] };
}

// ---------- نمایش پیام‌ها ----------
function showError(message) {
  formError.textContent = "😕 " + message;
  formError.classList.remove("hidden");
  formError.scrollIntoView({ behavior: "smooth", block: "center" });
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  $("retryBtn").disabled = isLoading;
  submitBtn.textContent = isLoading ? "در حال تحلیل خودرو... 🤖" : SUBMIT_TEXT;
  loadingCard.classList.toggle("hidden", !isLoading);
  if (isLoading) {
    loadingSub.textContent = "هوش مصنوعی دارد مشخصات را بررسی می‌کند";
    resultCard.classList.add("hidden");
    formError.classList.add("hidden");
    loadingCard.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// ---------- تبدیل متن AI به کارت‌های مرتب ----------
const SECTIONS = [
  { title: "بازه قیمت تقریبی", icon: "💰", cls: "price" },
  { title: "تحلیل", icon: "🔍", cls: "" },
  { title: "عوامل مؤثر", icon: "⚙️", cls: "" },
  { title: "نکات مهم", icon: "💡", cls: "" },
];

const normalize = (s) => s.replace(/ؤ/g, "و").replace(/\s+/g, " ").trim();

function parseAnalysis(text) {
  const blocks = [];
  let current = null;

  text.split("\n").forEach((rawLine) => {
    // حذف علامت‌های Markdown مثل # و **
    const line = rawLine.replace(/\*\*/g, "").replace(/^\s*#+\s*/, "").trim();
    if (!line) return;

    const norm = normalize(line);
    const section = SECTIONS.find((s) => {
      const t = normalize(s.title);
      return norm === t || norm.startsWith(t + ":") || norm.startsWith(t + " :");
    });

    if (section) {
      current = { ...section, items: [] };
      blocks.push(current);
      const rest = line.slice(line.indexOf(":") + 1).trim();
      if (line.includes(":") && rest) current.items.push({ type: "p", text: rest });
      return;
    }

    if (!current) {
      current = { title: "", icon: "", cls: "", items: [] };
      blocks.push(current);
    }
    const bullet = line.match(/^(?:[-•*–]|\d+[.)])\s+(.*)$/);
    current.items.push(bullet ? { type: "li", text: bullet[1] } : { type: "p", text: line });
  });

  return blocks.filter((b) => b.items.length);
}

function renderAnalysis(text) {
  resultBody.textContent = "";

  parseAnalysis(text).forEach((block) => {
    const box = document.createElement("div");
    box.className = "section " + block.cls;

    if (block.title) {
      const h = document.createElement("h3");
      h.textContent = block.icon + " " + block.title;
      box.appendChild(h);
    }

    let list = null;
    block.items.forEach((item) => {
      if (item.type === "li") {
        if (!list) {
          list = document.createElement("ul");
          box.appendChild(list);
        }
        const li = document.createElement("li");
        li.textContent = item.text; // textContent یعنی متن AI هرگز به شکل HTML اجرا نمی‌شود
        list.appendChild(li);
      } else {
        list = null;
        const p = document.createElement("p");
        p.textContent = item.text;
        box.appendChild(p);
      }
    });

    resultBody.appendChild(box);
  });
}

function renderChips(car) {
  carChips.textContent = "";
  [
    car.brand + " " + car.model,
    "سال " + car.year,
    faNum(car.mileage) + " کیلومتر",
    car.paint_condition,
    "فنی: " + car.technical_condition,
    car.city,
  ].forEach((text) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = text;
    carChips.appendChild(chip);
  });
}

// ---------- ارسال به Backend ----------
async function analyze(payload) {
  if (!API_URL || API_URL === "YOUR_BACKEND_URL") {
    showError("آدرس سرور هنوز تنظیم نشده است. در فایل script.js مقدار API_URL را با آدرس Backend خودت عوض کن.");
    return;
  }

  setLoading(true);

  // سرورهای رایگان بعد از مدتی بی‌کاری می‌خوابند و بیدار شدنشان تا یک دقیقه طول می‌کشد
  const slowTimer = setTimeout(() => {
    loadingSub.textContent = "سرور دارد از خواب بیدار می‌شود؛ ممکن است تا یک دقیقه طول بکشد ⏳";
  }, 8000);

  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(API_URL.replace(/\/+$/, "") + "/api/analyze-car", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    let result = null;
    try {
      result = await response.json();
    } catch (e) {
      result = null;
    }

    if (!response.ok || !result || !result.success || !result.analysis) {
      throw new Error((result && result.message) || GENERIC_ERROR);
    }

    renderChips(payload);
    renderAnalysis(result.analysis);
    setLoading(false);
    resultCard.classList.remove("hidden");
    resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    setLoading(false);
    // خطاهای شبکه (TypeError / AbortError) متن فنی دارند؛ به جایش پیام ساده نشان می‌دهیم
    const friendly =
      error.name === "TypeError" || error.name === "AbortError" ? GENERIC_ERROR : error.message;
    showError(friendly);
    console.error("Analyze failed:", error);
  } finally {
    clearTimeout(slowTimer);
    clearTimeout(abortTimer);
  }
}

// ---------- رویدادها ----------
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const { data, missing, firstInvalid } = collectForm();

  if (missing.length) {
    showError("لطفاً این بخش‌ها را درست پر کن: " + missing.join("، "));
    if (firstInvalid) firstInvalid.focus({ preventScroll: true });
    return;
  }

  lastPayload = data;
  analyze(data);
});

// وقتی کاربر چیزی را اصلاح می‌کند، علامت خطا و پیام خطا پاک شود
["input", "change"].forEach((type) =>
  form.addEventListener(type, (event) => {
    event.target.classList.remove("invalid");
    formError.classList.add("hidden");
  })
);

$("retryBtn").addEventListener("click", () => {
  if (lastPayload) analyze(lastPayload);
});

$("newBtn").addEventListener("click", () => {
  form.reset();
  $("brand").dispatchEvent(new Event("change"));
  $("city").dispatchEvent(new Event("change"));
  $("mileageHint").textContent = "اگر صفر است، ۰ بنویس";
  $("descCount").textContent = "۰";
  resultCard.classList.add("hidden");
  formError.classList.add("hidden");
  lastPayload = null;
  formCard.scrollIntoView({ behavior: "smooth", block: "start" });
});
