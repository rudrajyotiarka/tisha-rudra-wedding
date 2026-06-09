(function () {
const LOCAL_STORAGE_KEY = "tisha-rudra-gallery";
const BUCKET = "gallery";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

const config = window.WISHES_CONFIG || {};
const form = document.getElementById("gallery-form");
const gridEl = document.getElementById("gallery-grid");
const statusEl = document.getElementById("gallery-form-status");
const noticeEl = document.getElementById("gallery-notice");
const submitBtn = document.getElementById("gallery-submit");

function isSupabaseConfigured() {
  const { supabaseUrl, supabaseAnonKey } = config;
  return (
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("YOUR_") &&
    !supabaseAnonKey.includes("YOUR_")
  );
}

function supabaseHeaders(contentType = "application/json") {
  const headers = {
    apikey: config.supabaseAnonKey,
    Authorization: `Bearer ${config.supabaseAnonKey}`,
  };

  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  return headers;
}

function readLocalPhotos() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLocalPhotos(photos) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(photos));
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function publicPhotoUrl(storagePath) {
  return `${config.supabaseUrl}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

function fileExtension(file) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }

  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function renderPhotos(photos) {
  if (!photos.length) {
    gridEl.innerHTML =
      '<p class="gallery-empty">no photos yet — upload the first memory from the celebration.</p>';
    return;
  }

  gridEl.innerHTML = photos
    .map((photo, index) => {
      const tilt = index % 2 === 0 ? "-2deg" : "2deg";
      const caption = photo.caption ? `<p class="gallery-card-caption">${escapeHtml(photo.caption)}</p>` : "";

      return `
        <figure class="gallery-card reveal-item" style="--tilt: ${tilt}">
          <div class="gallery-card-frame">
            <img src="${escapeHtml(photo.url)}" alt="Photo shared by ${escapeHtml(photo.name)}" loading="lazy" />
          </div>
          <figcaption class="gallery-card-meta">
            <span class="gallery-card-name">${escapeHtml(photo.name)}</span>
            ${caption}
          </figcaption>
        </figure>
      `;
    })
    .join("");

  gridEl.querySelectorAll(".reveal-item").forEach((card, index) => {
    card.style.transitionDelay = `${220 + index * 100}ms`;
  });
  window.observeRevealElements?.(gridEl);
}

async function fetchPhotos() {
  if (isSupabaseConfigured()) {
    const response = await fetch(
      `${config.supabaseUrl}/rest/v1/gallery_photos?select=id,name,caption,storage_path,created_at&order=created_at.desc`,
      { headers: supabaseHeaders() }
    );

    if (!response.ok) {
      throw new Error("Could not load photos.");
    }

    const rows = await response.json();
    return rows.map((row) => ({
      ...row,
      url: publicPhotoUrl(row.storage_path),
    }));
  }

  return readLocalPhotos().sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
}

async function uploadToStorage(file) {
  const path = `${crypto.randomUUID()}.${fileExtension(file)}`;

  const response = await fetch(`${config.supabaseUrl}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "false",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Could not upload photo.");
  }

  return path;
}

async function savePhotoRecord(name, caption, storagePath) {
  const response = await fetch(`${config.supabaseUrl}/rest/v1/gallery_photos`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      name,
      caption: caption || null,
      storage_path: storagePath,
    }),
  });

  if (!response.ok) {
    throw new Error("Could not save photo details.");
  }

  const [saved] = await response.json();
  return {
    ...saved,
    url: publicPhotoUrl(saved.storage_path),
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function savePhotoLocal(name, caption, file) {
  const url = await readFileAsDataUrl(file);
  const photo = {
    id: crypto.randomUUID(),
    name,
    caption: caption || null,
    url,
    created_at: new Date().toISOString(),
  };

  const photos = readLocalPhotos();
  photos.unshift(photo);
  writeLocalPhotos(photos);
  return photo;
}

async function savePhoto(name, caption, file) {
  if (isSupabaseConfigured()) {
    const storagePath = await uploadToStorage(file);
    return savePhotoRecord(name, caption, storagePath);
  }

  return savePhotoLocal(name, caption, file);
}

function showNotice() {
  if (isSupabaseConfigured()) return;

  noticeEl.hidden = false;
  noticeEl.textContent =
    "Demo mode: photos are saved only in this browser. Set up Supabase storage (see wishes-config.example.js) so everyone can share and view photos.";
}

function validateFile(file) {
  if (!file) return "please choose a photo.";
  if (file.size > MAX_FILE_SIZE) return "photo must be 5 mb or smaller.";
  if (!ALLOWED_TYPES.includes(file.type)) return "please use a jpg, png, or webp photo.";
  return "";
}

async function loadPhotos() {
  try {
    const photos = await fetchPhotos();
    renderPhotos(photos);
  } catch {
    gridEl.innerHTML =
      '<p class="gallery-empty">could not load photos right now. please try again later.</p>';
  }
}

if (form && gridEl) {
  showNotice();
  loadPhotos();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = form.name.value.trim();
    const caption = form.caption.value.trim();
    const file = form.photo.files[0];
    const fileError = validateFile(file);

    if (!name) return;
    if (fileError) {
      statusEl.textContent = fileError;
      return;
    }

    submitBtn.disabled = true;
    statusEl.textContent = "uploading...";

    try {
      await savePhoto(name, caption, file);
      form.reset();
      statusEl.textContent = "thank you — your photo was added.";
      await loadPhotos();
    } catch {
      statusEl.textContent = "something went wrong. please try again.";
    } finally {
      submitBtn.disabled = false;
    }
  });
}
})();
