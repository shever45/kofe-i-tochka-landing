// Настройка сбора заявок:
// 1) Formspree: создайте форму на https://formspree.io и вставьте URL вида https://formspree.io/f/xxxxxxx
// 2) Google Sheets: создайте веб-приложение Apps Script и вставьте его URL
// Оставьте пустым, чтобы заявки сохранялись локально в браузере (demo-режим).
const FORM_ENDPOINT = "https://script.google.com/macros/s/AKfycbx9BCF-demMvJWlz-kCYOEU6e1oqEfF3b1bq7fOTL7xq4Jr3PywSao9oJFvYLMmRq_2VQ/exec";

document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  setupNav();
  setupOrderButtons();
  setupForm();
});

function setupNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

  const closeNav = () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Открыть меню");
  };

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("click", (e) => {
    if (!nav.classList.contains("open")) return;
    if (!nav.contains(e.target) && !toggle.contains(e.target)) closeNav();
  });
}

function setupOrderButtons() {
  const message = document.getElementById("message");
  const name = document.getElementById("name");
  document.querySelectorAll("[data-order]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.getAttribute("data-order");
      if (message) {
        const prefix = `Хочу заказать: ${item}.`;
        message.value = message.value && !message.value.startsWith(prefix)
          ? `${prefix} ${message.value}`
          : (message.value || `${prefix} `);
      }
      document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => (name || message)?.focus(), 350);
    });
  });
}

function setupForm() {
  const form = document.getElementById("order-form");
  const status = document.getElementById("form-status");
  const submitBtn = document.getElementById("submit-btn");
  if (!form || !status || !submitBtn) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "";
    status.className = "form-status";

    const data = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      time: form.time.value.trim(),
      message: form.message.value.trim(),
      page: window.location.href,
      submittedAt: new Date().toISOString(),
    };

    const error = validate(data);
    if (error) {
      status.textContent = error;
      status.classList.add("error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Отправляем...";

    try {
      const saved = saveLocal(data);
      if (FORM_ENDPOINT) {
        // Отправляем как text/plain, чтобы избежать CORS preflight при запросе к Google Apps Script
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(data),
        });
        const text = await res.text();
        let payload = null;
        try { payload = text ? JSON.parse(text) : null; } catch (_) {}
        if (!res.ok || (payload && payload.ok === false)) {
          throw new Error((payload && payload.error) || "Request failed");
        }
        status.textContent = `Спасибо, ${data.name}! Заявка №${saved.id} отправлена. Мы свяжемся с вами в ближайшее время.`;
      } else {
        status.textContent = `Спасибо, ${data.name}! Заявка №${saved.id} сохранена локально (demo). Чтобы собирать заявки в Google Таблицу/Telegram, укажите FORM_ENDPOINT в script.js.`;
      }
      status.classList.add("success");
      form.reset();
    } catch (err) {
      status.textContent = "Не удалось отправить заявку. Позвоните нам: +7 (900) 123-45-67.";
      status.classList.add("error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Отправить заявку";
    }
  });
}

function validate(data) {
  if (data.name.length < 2) return "Пожалуйста, укажите имя (минимум 2 символа).";
  const digits = data.phone.replace(/\D/g, "");
  if (digits.length < 10) return "Пожалуйста, укажите корректный номер телефона.";
  if (data.message.length < 3) return "Пожалуйста, напишите, что вы хотите заказать или уточнить.";
  return "";
}

function saveLocal(data) {
  const key = "kofe_i_tochka_leads";
  const leads = JSON.parse(localStorage.getItem(key) || "[]");
  const id = String(leads.length + 1).padStart(4, "0");
  const record = { id, ...data };
  leads.push(record);
  localStorage.setItem(key, JSON.stringify(leads));
  return record;
}
