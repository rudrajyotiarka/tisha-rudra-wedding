const PAGE_EXIT_MS = 320;
const STAGGER_MS = 90;
const STAGGER_START_MS = 120;

const SITE_PAGES = [
  { file: "index.html", label: "home" },
  { file: "story.html", label: "story" },
  { file: "place.html", label: "place" },
  { file: "wishes.html", label: "wishes" },
  { file: "gallery.html", label: "gallery" },
  { file: "contact.html", label: "contact" },
];

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function getCurrentPageIndex() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  const current = path === "" ? "index.html" : path;
  const index = SITE_PAGES.findIndex((page) => page.file === current);
  return index >= 0 ? index : 0;
}

function isPageLink(link) {
  const href = link.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || link.hasAttribute("download")) {
    return false;
  }

  if (href.startsWith("http") && !href.includes(window.location.host)) {
    return false;
  }

  return href.endsWith(".html") || href === "/" || href === "./";
}

function applyStagger(container) {
  if (!container || prefersReducedMotion) return;

  [...container.children].forEach((child, index) => {
    child.style.animationDelay = `${STAGGER_START_MS + index * STAGGER_MS}ms`;
  });
}

function initStaggerAnimations() {
  const staggerContainers = [
    ".welcome-inner",
    ".story-panel",
    ".place-panel",
    ".wishes-panel",
    ".gallery-panel",
    ".contact-panel",
    ".story-inner",
    ".place-inner",
    ".wishes-inner",
  ];

  staggerContainers.forEach((selector) => {
    document.querySelectorAll(selector).forEach((container) => {
      container.classList.add("stagger-in");
      applyStagger(container);
    });
  });
}

function initPageTransitions() {
  if (prefersReducedMotion) {
    document.body.classList.add("page-loaded");
    return;
  }

  requestAnimationFrame(() => {
    document.body.classList.add("page-loaded");
  });

  document.querySelectorAll("a").forEach((link) => {
    if (!isPageLink(link)) return;

    link.addEventListener("click", (event) => {
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return;
      }

      const targetUrl = link.href;
      if (targetUrl === window.location.href) return;

      event.preventDefault();
      document.body.classList.add("page-exit");

      window.setTimeout(() => {
        window.location.href = targetUrl;
      }, PAGE_EXIT_MS);
    });
  });
}

function initPageArrows() {
  const index = getCurrentPageIndex();
  const nav = document.createElement("nav");
  nav.className = "page-arrows";
  nav.setAttribute("aria-label", "Page navigation");

  if (index > 0) {
    const prevPage = SITE_PAGES[index - 1];
    const prev = document.createElement("a");
    prev.className = "page-arrow page-arrow--prev";
    prev.href = prevPage.file;
    prev.setAttribute("aria-label", `Previous page: ${prevPage.label}`);
    prev.innerHTML = '<span class="page-arrow-icon" aria-hidden="true">‹</span>';
    nav.appendChild(prev);
  }

  if (index < SITE_PAGES.length - 1) {
    const nextPage = SITE_PAGES[index + 1];
    const next = document.createElement("a");
    next.className = "page-arrow page-arrow--next";
    next.href = nextPage.file;
    next.setAttribute("aria-label", `Next page: ${nextPage.label}`);
    next.innerHTML = '<span class="page-arrow-icon" aria-hidden="true">›</span>';
    nav.appendChild(next);
  }

  if (!nav.children.length) return;

  document.body.appendChild(nav);

  document.addEventListener("keydown", (event) => {
    const tag = event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    if (event.key === "ArrowLeft" && index > 0) {
      const prevLink = nav.querySelector(".page-arrow--prev");
      if (prevLink) prevLink.click();
    }

    if (event.key === "ArrowRight" && index < SITE_PAGES.length - 1) {
      const nextLink = nav.querySelector(".page-arrow--next");
      if (nextLink) nextLink.click();
    }
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
    nav.style.display = "none";
  };

  btn.addEventListener("click", () => {
    const open = header.classList.toggle("nav-open");
    btn.setAttribute("aria-expanded", String(open));
    // Inline style keeps the toggle reliable even if other CSS rules compete.
    nav.style.display = open ? "flex" : "none";
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

initMobileNav();
initPageArrows();
initPageTransitions();
initStaggerAnimations();
