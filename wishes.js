const LOCAL_STORAGE_KEY = "tisha-rudra-wishes";

const config = window.WISHES_CONFIG || {};
const form = document.getElementById("wish-form");
const listEl = document.getElementById("wishes-list");
const statusEl = document.getElementById("wish-form-status");
const noticeEl = document.getElementById("wishes-notice");
const submitBtn = document.getElementById("wish-submit");

function isSupabaseConfigured() {
  const { supabaseUrl, supabaseAnonKey } = config;
  return (
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("YOUR_") &&
    !supabaseAnonKey.includes("YOUR_")
  );
}

function supabaseHeaders() {
  return {
    apikey: config.supabaseAnonKey,
    Authorization: `Bearer ${config.supabaseAnonKey}`,
    "Content-Type": "application/json",
  };
}

function readLocalWishes() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLocalWishes(wishes) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(wishes));
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderWishes(wishes) {
  if (!wishes.length) {
    listEl.innerHTML = '<p class="wishes-empty">no wishes yet — be the first to write one.</p>';
    return;
  }

  listEl.innerHTML = wishes
    .map(
      (wish) => `
        <article class="wish-card">
          <p class="wish-card-message">${escapeHtml(wish.message)}</p>
          <footer class="wish-card-meta">
            <span class="wish-card-name">${escapeHtml(wish.name)}</span>
            <time class="wish-card-date">${formatDate(wish.created_at)}</time>
          </footer>
        </article>
      `
    )
    .join("");
}

async function fetchWishes() {
  if (isSupabaseConfigured()) {
    const response = await fetch(
      `${config.supabaseUrl}/rest/v1/wishes?select=id,name,message,created_at&order=created_at.desc`,
      { headers: supabaseHeaders() }
    );

    if (!response.ok) {
      throw new Error("Could not load wishes.");
    }

    return response.json();
  }

  return readLocalWishes().sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
}

async function saveWish(name, message) {
  if (isSupabaseConfigured()) {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/wishes`, {
      method: "POST",
      headers: {
        ...supabaseHeaders(),
        Prefer: "return=representation",
      },
      body: JSON.stringify({ name, message }),
    });

    if (!response.ok) {
      throw new Error("Could not save your wish.");
    }

    const [saved] = await response.json();
    return saved;
  }

  const wish = {
    id: crypto.randomUUID(),
    name,
    message,
    created_at: new Date().toISOString(),
  };

  const wishes = readLocalWishes();
  wishes.unshift(wish);
  writeLocalWishes(wishes);
  return wish;
}

function showNotice() {
  if (isSupabaseConfigured()) return;

  noticeEl.hidden = false;
  noticeEl.textContent =
    "Demo mode: wishes are saved only in this browser. Set up Supabase in wishes-config.js so all guests can see them.";
}

async function loadWishes() {
  try {
    const wishes = await fetchWishes();
    renderWishes(wishes);
  } catch {
    listEl.innerHTML =
      '<p class="wishes-empty">could not load wishes right now. please try again later.</p>';
  }
}

if (form && listEl) {
  showNotice();
  loadWishes();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = form.name.value.trim();
    const message = form.message.value.trim();

    if (!name || !message) return;

    submitBtn.disabled = true;
    statusEl.textContent = "sending...";

    try {
      await saveWish(name, message);
      form.reset();
      statusEl.textContent = "thank you — your wish was sent.";
      await loadWishes();
    } catch {
      statusEl.textContent = "something went wrong. please try again.";
    } finally {
      submitBtn.disabled = false;
    }
  });
}
