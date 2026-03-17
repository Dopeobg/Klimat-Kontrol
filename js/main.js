const TG_USERNAME = "dady_bear6";
const PHONE_RAW = "+79215894842";

function qs(sel, root = document) {
  return root.querySelector(sel);
}
function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function buildTelegramLink(payload) {
  const lines = [
    "Заявка на установку кондиционера / сплит-системы",
    payload.service ? `Услуга: ${payload.service}` : null,
    payload.name ? `Имя: ${payload.name}` : null,
    payload.phone ? `Телефон: ${payload.phone}` : null,
    payload.comment ? `Комментарий: ${payload.comment}` : null,
    `Источник: лендинг (СПб)`,
  ].filter(Boolean);

  const text = encodeURIComponent(lines.join("\n"));
  return `https://t.me/${TG_USERNAME}?text=${text}`;
}

function normalizePhone(v) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  const digits = s.replace(/[^\d+]/g, "");
  return digits;
}

function validate(payload) {
  const phone = normalizePhone(payload.phone);
  if (!phone || phone.replace(/[^\d]/g, "").length < 10) {
    return { ok: false, message: "Укажите корректный телефон (минимум 10 цифр)." };
  }
  return { ok: true, message: "" };
}

function setupReveal() {
  const nodes = qsa("[data-reveal]");
  if (!nodes.length) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    nodes.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const delay = Number(e.target.getAttribute("data-reveal-delay") || 0);
        e.target.style.transitionDelay = `${delay}ms`;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    },
    { threshold: 0.14 }
  );

  nodes.forEach((el) => io.observe(el));
}

function setupHeaderElevate() {
  const header = qs("[data-elevate]");
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle("is-elevated", window.scrollY > 6);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function setupBurger() {
  const btn = qs("[data-burger]");
  const panel = qs("[data-mobile-nav]");
  if (!btn || !panel) return;

  const close = () => {
    panel.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
  };

  btn.addEventListener("click", () => {
    const open = panel.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  qsa("a[href^=\"#\"]", panel).forEach((a) => a.addEventListener("click", close));
  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) close();
  });
}

function setupDialogLead() {
  const dialog = qs("[data-dialog]");
  const status = qs("[data-dialog-status]");
  const submitBtn = qs("[data-submit-dialog]");
  const serviceInput = qs("[data-dialog-service]");
  const closeBtn = qs("[data-dialog-close]");
  if (!dialog || !submitBtn || !status) return;

  function open(service) {
    status.textContent = "";
    status.className = "dialog__status";
    if (serviceInput) serviceInput.value = service || "";
    if (typeof dialog.showModal === "function") dialog.showModal();
  }

  qsa("[data-open-lead]").forEach((el) => {
    el.addEventListener("click", () => {
      const service = el.getAttribute("data-service") || "";
      open(service);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      try {
        dialog.close();
      } catch {}
    });
  }

  submitBtn.addEventListener("click", () => {
    const form = qs("[data-dialog-panel]", dialog);
    if (!form) return;

    const fd = new FormData(form);
    const payload = {
      service: String(fd.get("service") || "").trim(),
      name: String(fd.get("name") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      comment: String(fd.get("comment") || "").trim(),
    };
    const v = validate(payload);
    if (!v.ok) {
      status.textContent = v.message;
      status.classList.add("err");
      return;
    }

    status.textContent = "Готово. Открываю Telegram с вашей заявкой…";
    status.classList.remove("err");
    status.classList.add("ok");

    window.open(buildTelegramLink(payload), "_blank", "noreferrer");
    try {
      dialog.close();
    } catch {}
  });
}

function setupInlineLeadForm() {
  const form = qs("[data-lead-form]");
  const status = qs("[data-form-status]");
  if (!form || !status) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const payload = {
      service: "Консультация и расчёт",
      name: String(fd.get("name") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      comment: String(fd.get("comment") || "").trim(),
    };
    const v = validate(payload);
    if (!v.ok) {
      status.textContent = v.message;
      status.className = "form__status err";
      return;
    }

    status.textContent = "Открываю Telegram с вашей заявкой…";
    status.className = "form__status ok";
    window.open(buildTelegramLink(payload), "_blank", "noreferrer");
  });
}

function setupYear() {
  const el = qs("[data-year]");
  if (el) el.textContent = String(new Date().getFullYear());
}

function setupStickyCta() {
  const sticky = qs(".sticky-cta");
  const hero = qs("#hero");
  if (!sticky || !hero) return;

  const mq = window.matchMedia("(max-width: 640px)");

  const setVisible = (visible) => {
    sticky.classList.toggle("is-visible", visible);
    sticky.setAttribute("aria-hidden", visible ? "false" : "true");
  };

  const teardown = () => {
    setVisible(false);
  };

  let io = null;
  const setup = () => {
    teardown();
    if (!mq.matches) return;

    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;
          setVisible(!entry.isIntersecting);
        },
        { threshold: 0.22 }
      );
      io.observe(hero);
      return;
    }

    const onScroll = () => {
      const rect = hero.getBoundingClientRect();
      const heroVisible = rect.bottom > 0 && rect.top < window.innerHeight * 0.6;
      setVisible(!heroVisible);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  };

  setup();

  mq.addEventListener?.("change", () => {
    if (io) {
      try {
        io.disconnect();
      } catch {}
      io = null;
    }
    setup();
  });
}

setupReveal();
setupHeaderElevate();
setupBurger();
setupDialogLead();
setupInlineLeadForm();
setupYear();
setupStickyCta();

