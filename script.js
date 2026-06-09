const STAGGER_MS = 320;
const STAGGER_START_MS = 400;

const SITE_SECTIONS = [
  { id: "home", label: "home" },
  { id: "story", label: "story" },
  { id: "place", label: "place" },
  { id: "wishes", label: "wishes" },
  { id: "gallery", label: "gallery" },
  { id: "contact", label: "contact" },
];

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function getSectionElements() {
  return SITE_SECTIONS.map((section) => document.getElementById(section.id)).filter(Boolean);
}

function getCurrentSectionIndex() {
  const sections = getSectionElements();
  const scrollY = window.scrollY + 120;

  let current = 0;
  sections.forEach((section, index) => {
    if (section.offsetTop <= scrollY) {
      current = index;
    }
  });

  return current;
}

function scrollToSection(id) {
  const section = document.getElementById(id);
  if (!section) return;

  section.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  });
}

function setActiveNav(sectionId) {
  document.querySelectorAll(".main-nav a[data-section]").forEach((link) => {
    const isActive = link.dataset.section === sectionId;
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

let revealObserver;

function applyStagger(container) {
  if (!container || prefersReducedMotion) return;

  [...container.children].forEach((child, index) => {
    child.style.setProperty("--stagger-delay", `${STAGGER_START_MS + index * STAGGER_MS}ms`);
  });
}

function revealElement(element) {
  if (!element || element.classList.contains("is-revealed")) return;
  element.classList.add("is-revealed");
  revealObserver?.unobserve(element);
}

const REVEAL_BLOCKS = [
  ".story-panel",
  ".place-panel",
  ".wishes-panel",
  ".gallery-panel",
  ".contact-panel",
];

function observeRevealElements(root = document) {
  if (!revealObserver) return;

  REVEAL_BLOCKS.forEach((selector) => {
    root.querySelectorAll(`${selector}:not(.is-revealed)`).forEach((element) => {
      revealObserver.observe(element);
    });
  });

  root.querySelectorAll(".reveal-item:not(.is-revealed)").forEach((element) => {
    revealObserver.observe(element);
  });
}

function initStaggerContainers() {
  const staggerContainers = [
    ".story-inner",
    ".place-inner",
    ".wishes-inner",
    ".gallery-upload",
    ".gallery-display",
  ];

  staggerContainers.forEach((selector) => {
    document.querySelectorAll(selector).forEach((container) => {
      container.classList.add("stagger-in");
      applyStagger(container);
    });
  });

  document.querySelectorAll(".story-photos, .place-photos").forEach((container) => {
    container.querySelectorAll(".story-photo-card, .place-photo-card").forEach((card, index) => {
      card.classList.add("reveal-item");
      card.style.setProperty("--reveal-delay", `${480 + index * 240}ms`);
    });
  });
}

function initScrollReveal() {
  if (prefersReducedMotion) {
    document.querySelectorAll(".story-panel, .place-panel, .wishes-panel, .gallery-panel, .contact-panel, .reveal-item").forEach((element) => {
      element.classList.add("is-revealed");
    });
    return;
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          revealElement(entry.target);
        }
      });
    },
    {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.18,
    }
  );

  observeRevealElements();
}

window.observeRevealElements = observeRevealElements;

function initSectionNav() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href === "#") return;

    link.addEventListener("click", (event) => {
      const id = href.slice(1);
      const section = document.getElementById(id);
      if (!section) return;

      event.preventDefault();
      scrollToSection(id);
      history.replaceState(null, "", `#${id}`);
      setActiveNav(id);
    });
  });

  const hash = window.location.hash.slice(1);
  if (hash && document.getElementById(hash)) {
    window.setTimeout(() => scrollToSection(hash), 0);
    setActiveNav(hash);
  } else {
    setActiveNav("home");
  }
}

function initScrollSpy() {
  const sections = getSectionElements();
  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible?.target?.id) {
        setActiveNav(visible.target.id);
      }
    },
    {
      rootMargin: "-20% 0px -55% 0px",
      threshold: [0.15, 0.35, 0.55],
    }
  );

  sections.forEach((section) => observer.observe(section));
}

function initPageArrows() {
  const nav = document.createElement("nav");
  nav.className = "page-arrows";
  nav.setAttribute("aria-label", "Section navigation");

  const prev = document.createElement("button");
  prev.type = "button";
  prev.className = "page-arrow page-arrow--prev";
  prev.setAttribute("aria-label", "Previous section");
  prev.innerHTML = '<span class="page-arrow-icon" aria-hidden="true">‹</span>';

  const next = document.createElement("button");
  next.type = "button";
  next.className = "page-arrow page-arrow--next";
  next.setAttribute("aria-label", "Next section");
  next.innerHTML = '<span class="page-arrow-icon" aria-hidden="true">›</span>';

  function updateArrows() {
    const index = getCurrentSectionIndex();
    prev.disabled = index === 0;
    next.disabled = index === SITE_SECTIONS.length - 1;
    prev.style.visibility = index === 0 ? "hidden" : "visible";
    next.style.visibility = index === SITE_SECTIONS.length - 1 ? "hidden" : "visible";
  }

  prev.addEventListener("click", () => {
    const index = getCurrentSectionIndex();
    if (index > 0) {
      const target = SITE_SECTIONS[index - 1].id;
      scrollToSection(target);
      history.replaceState(null, "", `#${target}`);
      setActiveNav(target);
    }
  });

  next.addEventListener("click", () => {
    const index = getCurrentSectionIndex();
    if (index < SITE_SECTIONS.length - 1) {
      const target = SITE_SECTIONS[index + 1].id;
      scrollToSection(target);
      history.replaceState(null, "", `#${target}`);
      setActiveNav(target);
    }
  });

  window.addEventListener("scroll", updateArrows, { passive: true });
  updateArrows();

  nav.appendChild(prev);
  nav.appendChild(next);
  document.body.appendChild(nav);

  document.addEventListener("keydown", (event) => {
    const tag = event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    const index = getCurrentSectionIndex();
    if (event.key === "ArrowLeft" && index > 0) prev.click();
    if (event.key === "ArrowRight" && index < SITE_SECTIONS.length - 1) next.click();
  });
}

function initMobileNav() {
  const header = document.querySelector(".hero-nav");
  const nav = header?.querySelector(".main-nav");
  const btn = header?.querySelector(".nav-toggle");
  if (!header || !nav || !btn) return;

  const closeMenu = () => {
    header.classList.remove("nav-open");
    btn.setAttribute("aria-expanded", "false");
    nav.style.display = "";
  };

  btn.addEventListener("click", () => {
    const open = header.classList.toggle("nav-open");
    btn.setAttribute("aria-expanded", String(open));
    nav.style.display = open ? "flex" : "";
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

function initPageLoad() {
  if (prefersReducedMotion) {
    document.body.classList.add("page-loaded");
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.add("page-loaded");
    });
  });
}

initMobileNav();
initSectionNav();
initScrollSpy();
initPageArrows();
initStaggerContainers();
initScrollReveal();
initPageLoad();
