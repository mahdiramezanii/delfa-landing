/* =====================================================================
   DelFa — Coming Soon
   ---------------------------------------------------------------------
   CONFIGURATION
   LAUNCH_DATE: ISO 8601 string, e.g. "2026-12-01T09:00:00+03:30".
     Leave it as "" until an official date is confirmed. While empty, the
     page shows "Launching Soon" instead of a countdown.
   NOTIFY_ENDPOINT: URL of a backend/form service that accepts a POST with
     JSON { "email": "..." } (e.g. your own API, Formspree, Mailchimp proxy).
     Leave it as "" and the form will honestly say it is not connected.
   ===================================================================== */
const LAUNCH_DATE = "";
const NOTIFY_ENDPOINT = "";

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;
  let lang = "en";

  const T = {
    en: {
      soon: "Launching Soon", live: "We’re Live", wait: "Counting down to the official unveiling.",
      none: "Official date to be announced.",
      invalid: "Please enter a valid email address.",
      unconnected: "Email notifications aren’t connected yet, so nothing was saved. Please check back soon.",
      sent: "Thanks — you’re on the list.", fail: "Something went wrong. Please try again later.",
      toFa: "Switch language to Persian", toEn: "Switch language to English", btn: "فارسی"
    },
    fa: {
      soon: "به‌زودی", live: "ما رونمایی شدیم", wait: "شمارش معکوس تا رونمایی رسمی.",
      none: "تاریخ رسمی به‌زودی اعلام می‌شود.",
      invalid: "لطفاً یک نشانی ایمیل معتبر وارد کنید.",
      unconnected: "اعلان ایمیلی هنوز متصل نشده است، بنابراین چیزی ذخیره نشد. لطفاً بعداً دوباره سر بزنید.",
      sent: "سپاس — نام شما ثبت شد.", fail: "مشکلی پیش آمد. لطفاً بعداً دوباره تلاش کنید.",
      toFa: "", toEn: "Switch language to English", btn: "English"
    }
  };

  /* ---------- Countdown ---------- */
  const box = $("countdown");
  const status = $("status");
  const parts = { d: $("d"), h: $("h"), m: $("m"), s: $("s") };
  const target = LAUNCH_DATE ? new Date(LAUNCH_DATE).getTime() : NaN;
  const hasDate = Number.isFinite(target);
  let timer = null;
  let state = "pending"; // "pending" | "running" | "live"

  const pad = (n) => String(n).padStart(2, "0");
  const units = box.innerHTML; // keep original markup so we can restore it

  function showText(text) {
    box.classList.add("is-text");
    box.textContent = text;
  }

  // Update a digit and replay a short "tick" animation when it changes.
  function setDigit(el, val) {
    if (el.textContent === val) return;
    const first = el.textContent === "--";
    el.textContent = val;
    if (first) return;
    el.classList.remove("tick");
    void el.offsetWidth; // restart the CSS animation
    el.classList.add("tick");
  }

  function render() {
    if (!hasDate) {
      state = "pending";
      showText(T[lang].soon);
      status.textContent = T[lang].none;
      return;
    }
    const diff = target - Date.now();
    if (diff <= 0) {
      state = "live";
      clearInterval(timer);
      showText(T[lang].live);
      status.textContent = "";
      return;
    }
    if (state !== "running") {
      box.classList.remove("is-text");
      box.innerHTML = units;
      parts.d = $("d"); parts.h = $("h"); parts.m = $("m"); parts.s = $("s");
      state = "running";
      applyLang(); // re-translate the restored unit labels
    }
    const sec = Math.floor(diff / 1000);
    setDigit(parts.d, pad(Math.floor(sec / 86400)));
    setDigit(parts.h, pad(Math.floor((sec % 86400) / 3600)));
    setDigit(parts.m, pad(Math.floor((sec % 3600) / 60)));
    setDigit(parts.s, pad(sec % 60));
    status.textContent = T[lang].wait;
  }

  /* ---------- Language toggle ---------- */
  function applyLang() {
    root.lang = lang;
    root.dir = lang === "fa" ? "rtl" : "ltr";
    document.querySelectorAll("[data-en]").forEach((el) => {
      el.textContent = el.dataset[lang];
    });
    const btn = $("lang");
    btn.textContent = T[lang].btn;
    btn.setAttribute("aria-label", T[lang].toEn || T.en.toFa);
    $("email").dir = "ltr";
  }

  $("lang").addEventListener("click", () => {
    lang = lang === "en" ? "fa" : "en";
    applyLang();
    if (state === "pending" || state === "live") render();
    else status.textContent = T[lang].wait;
    $("note").textContent = "";
  });

  /* ---------- Email notification ---------- */
  const form = $("notify");
  const toggle = $("notify-toggle");
  const note = $("note");

  toggle.addEventListener("click", () => {
    const open = form.hidden;
    form.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    if (open) $("email").focus();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("email").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      note.textContent = T[lang].invalid;
      return;
    }
    if (!NOTIFY_ENDPOINT) {
      note.textContent = T[lang].unconnected; // honest: nothing is stored
      return;
    }
    try {
      const res = await fetch(NOTIFY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (!res.ok) throw new Error(res.status);
      note.textContent = T[lang].sent;
      form.reset();
    } catch (err) {
      note.textContent = T[lang].fail;
    }
  });

  /* ---------- Motion (skipped entirely when reduced motion is preferred) ---------- */
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!calm) {
    // Scroll reveal: elements stay visible if JS or IntersectionObserver is unavailable.
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.2 });
      document.querySelectorAll(".story-mark, .story-text, .divisions h2, .item").forEach((el, i) => {
        el.classList.add("pre");
        el.style.transitionDelay = el.classList.contains("item") ? (i % 3) * 120 + "ms" : "0ms";
        io.observe(el);
      });
    }
    // Gentle pointer drift on the hero visual (mouse/trackpad only, a few pixels).
    const hero = document.querySelector(".hero");
    const vis = document.querySelector(".visual");
    if (hero && vis && window.matchMedia("(hover: hover)").matches) {
      hero.addEventListener("pointermove", (e) => {
        const r = hero.getBoundingClientRect();
        vis.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        vis.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      });
      hero.addEventListener("pointerleave", () => {
        vis.style.setProperty("--px", 0); vis.style.setProperty("--py", 0);
      });
    }
  }

  /* ---------- Init ---------- */
  $("year").textContent = new Date().getFullYear();
  render();
  if (hasDate && state === "running") timer = setInterval(render, 1000);
})();