(function () {
const LOCAL_STORAGE_KEY = "tisha-rudra-rsvps";

const config = window.WISHES_CONFIG || {};

function getRsvpElements() {
  return {
    overlay: document.getElementById("rsvp-overlay"),
    form: document.getElementById("rsvp-form"),
    closeBtn: document.getElementById("rsvp-close"),
    statusEl: document.getElementById("rsvp-status"),
    submitBtn: document.getElementById("rsvp-submit"),
    nameInput: document.getElementById("rsvp-name"),
    guestsInput: document.getElementById("rsvp-guests"),
    attendingInput: document.getElementById("rsvp-attending"),
  };
}

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
  const { overlay, statusEl, nameInput } = getRsvpElements();
  if (!overlay) return;

  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("rsvp-open");
  if (statusEl) statusEl.textContent = "";

  window.setTimeout(() => {
    nameInput?.focus({ preventScroll: true });
  }, 0);
}

function closeModal() {
  const { overlay } = getRsvpElements();
  if (!overlay) return;

  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
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

function bindOpenButtons() {
  document.querySelectorAll("[data-rsvp-open]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openModal();
    });
  });
}

function initRsvp() {
  const { overlay, form, closeBtn, statusEl, submitBtn, nameInput, guestsInput, attendingInput } =
    getRsvpElements();

  if (!overlay || !form) return;

  bindOpenButtons();

  closeBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    closeModal();
  });

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlay.classList.contains("is-open")) closeModal();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = nameInput?.value.trim() ?? "";
    const guestCount = Number(guestsInput?.value);
    const attending = attendingInput?.checked ?? true;

    if (!name || guestCount < 1) return;

    if (submitBtn) submitBtn.disabled = true;
    if (statusEl) statusEl.textContent = "sending...";

    try {
      await saveRsvp(name, guestCount, attending);
      form.reset();
      if (guestsInput) guestsInput.value = "1";
      if (attendingInput) attendingInput.checked = true;
      if (statusEl) {
        statusEl.textContent = attending
          ? "thank you — we can't wait to see you."
          : "thank you — we'll miss you.";

        if (!isSupabaseConfigured()) {
          statusEl.textContent += " (saved locally for demo only)";
        }
      }
    } catch {
      if (statusEl) statusEl.textContent = "something went wrong. please try again.";
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

initRsvp();
})();
