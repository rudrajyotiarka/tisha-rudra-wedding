const LOCAL_STORAGE_KEY = "tisha-rudra-rsvps";

const config = window.WISHES_CONFIG || {};
const overlay = document.getElementById("rsvp-overlay");
const openBtn = document.getElementById("rsvp-open");
const openContactBtn = document.getElementById("rsvp-open-contact");
const closeBtn = document.getElementById("rsvp-close");
const form = document.getElementById("rsvp-form");
const statusEl = document.getElementById("rsvp-status");
const submitBtn = document.getElementById("rsvp-submit");

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

function readLocalRsVps() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLocalRsVps(rsVps) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(rsVps));
}

function openModal() {
  if (!overlay) return;
  overlay.hidden = false;
  document.body.classList.add("rsvp-open");
  statusEl.textContent = "";
  form.name.focus();
}

function closeModal() {
  if (!overlay) return;
  overlay.hidden = true;
  document.body.classList.remove("rsvp-open");
}

async function saveRsvp(name, guestCount, attending) {
  if (isSupabaseConfigured()) {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/rsvp_responses`, {
      method: "POST",
      headers: {
        ...supabaseHeaders(),
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        name,
        guest_count: guestCount,
        attending,
      }),
    });

    if (!response.ok) {
      throw new Error("Could not save RSVP.");
    }

    return response.json();
  }

  const rsvp = {
    id: crypto.randomUUID(),
    name,
    guest_count: guestCount,
    attending,
    created_at: new Date().toISOString(),
  };

  const rsVps = readLocalRsVps();
  rsVps.unshift(rsvp);
  writeLocalRsVps(rsVps);
  return rsvp;
}

if (overlay && form) {
  [openBtn, openContactBtn].forEach((btn) => {
    if (btn) btn.addEventListener("click", openModal);
  });
  closeBtn.addEventListener("click", closeModal);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) closeModal();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = form.name.value.trim();
    const guestCount = Number(form.guest_count.value);
    const attending = form.attending.checked;

    if (!name || guestCount < 1) return;

    submitBtn.disabled = true;
    statusEl.textContent = "sending...";

    try {
      await saveRsvp(name, guestCount, attending);
      form.reset();
      form.guest_count.value = "1";
      form.attending.checked = true;
      statusEl.textContent = attending
        ? "thank you — we can't wait to see you."
        : "thank you — we'll miss you.";

      if (!isSupabaseConfigured()) {
        statusEl.textContent += " (saved locally for demo only)";
      }
    } catch {
      statusEl.textContent = "something went wrong. please try again.";
    } finally {
      submitBtn.disabled = false;
    }
  });
}
