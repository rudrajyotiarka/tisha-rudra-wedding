const MUSIC_SRC = "assets/song.mp3";
const MUSIC_VOLUME = 0.35;
const STORAGE_KEY = "wedding-music-state";

function readMusicState() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeMusicState(state) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveMusicState(audio, playing) {
  writeMusicState({
    playing,
    time: audio.currentTime || 0,
  });
}

function initBackgroundMusic() {
  const wrap = document.createElement("div");
  wrap.className = "music-control";

  const audio = document.createElement("audio");
  audio.src = MUSIC_SRC;
  audio.loop = true;
  audio.volume = MUSIC_VOLUME;
  audio.preload = "metadata";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "music-toggle";
  btn.setAttribute("aria-label", "Toggle background music");
  btn.textContent = "play music";

  let playing = false;

  function setButtonLabel() {
    btn.textContent = playing ? "pause music" : "play music";
    btn.setAttribute("aria-pressed", String(playing));
  }

  async function playMusic() {
    try {
      await audio.play();
      playing = true;
      setButtonLabel();
      saveMusicState(audio, true);
    } catch {
      playing = false;
      setButtonLabel();
      btn.textContent = "tap to play music";
    }
  }

  function pauseMusic() {
    audio.pause();
    playing = false;
    setButtonLabel();
    saveMusicState(audio, false);
  }

  btn.addEventListener("click", () => {
    if (playing) {
      pauseMusic();
    } else {
      playMusic();
    }
  });

  audio.addEventListener("timeupdate", () => {
    if (playing) {
      saveMusicState(audio, true);
    }
  });

  window.addEventListener("beforeunload", () => {
    saveMusicState(audio, playing);
  });

  document.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      saveMusicState(audio, playing);
    });
  });

  wrap.appendChild(btn);
  wrap.appendChild(audio);
  document.body.appendChild(wrap);

  const saved = readMusicState();
  if (saved.time) {
    audio.currentTime = saved.time;
  }

  if (saved.playing) {
    setButtonLabel();
    btn.textContent = "resume music";
    playMusic();
  }
}

initBackgroundMusic();
