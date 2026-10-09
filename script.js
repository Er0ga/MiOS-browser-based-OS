/* ============================================================
   MiOS — main script
    1. Helpers & storage        8. Projects app
    2. Icons                    9. Contact app
    3. App registry            10. Wallpaper app
    4. Topbar                  11. Vigenère app
    5. Window manager          12. Terminal
    6. Desktop icons & dock    13. Sticky notes
    7. About me app            14. Boot screen & startup
   ============================================================ */

/* ===========================================================
   1. HELPERS & STORAGE
   =========================================================== */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

/* localStorage can throw (private mode, blocked site data), so every access is guarded */
const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem("mios." + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem("mios." + key, JSON.stringify(value));
    } catch (e) {}
  },
};

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function debounce(fn, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const isSmallScreen = () => window.matchMedia("(max-width: 640px)").matches;
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ===========================================================
   2. ICONS (Lucide, inlined so there are no external requests)
   =========================================================== */
const ICONS = {
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  note: '<path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M15 3v6h6"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  smartphone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
  arrowRight:'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
};

function icon(name, className = "") {
  return (
    `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
    `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`
  );
}

function tile(iconName, color) {
  return `<span class="tile" style="--tile:${color}">${icon(iconName)}</span>`;
}

/* ===========================================================
   3. APP REGISTRY
   Every window app, plus the Notes launcher. Desktop icons and
   the dock are generated from this list.
   =========================================================== */
const APPS = {
  welcome:   { title: "Welcome",   icon: "home",     color: "linear-gradient(135deg,#ffb347,#ff7e5f)", width: 480, height: 400 },
  about:     { title: "About me",  icon: "user",     color: "linear-gradient(135deg,#7f9cff,#5b6ee1)", width: 620, height: 460 },
  projects:  { title: "Projects",  icon: "folder",   color: "linear-gradient(135deg,#4fd1c5,#2b9e8f)", width: 600, height: 480 },
  terminal:  { title: "Terminal",  icon: "terminal", color: "linear-gradient(135deg,#3a3f4b,#16181f)", width: 660, height: 420 },
  vigenere:  { title: "Vigenère",  icon: "lock",     color: "linear-gradient(135deg,#a78bfa,#6d28d9)", width: 680, height: 580 },
  grapheneos: { title: "GrapheneOS Guide", icon: "smartphone", color: "linear-gradient(135deg,#4fd1c5,#2b9e8f)", width: 700, height: 500 },
  contact:   { title: "Contact",   icon: "mail",     color: "linear-gradient(135deg,#7ee0ff,#3a9bff)", width: 380, height: 400 },
  wallpaper: { title: "Wallpaper", icon: "image",    color: "linear-gradient(135deg,#ff8ad8,#b06cff)", width: 470, height: 400 },
};
const WINDOW_IDS = Object.keys(APPS);

const LAUNCHERS = [
  ...["welcome", "about", "projects", "terminal", "vigenere", "contact"].map((id) => ({ id, ...APPS[id] })),
  { id: "notes", title: "Notes", icon: "note", color: "linear-gradient(135deg,#ffe36e,#f5b800)" },
  { id: "wallpaper", ...APPS.wallpaper },
];

/* ===========================================================
   4. TOPBAR (clock, battery, menu)
   =========================================================== */
function updateTime() {
  $("#timeElement").textContent = new Date().toLocaleString("en-GB", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
updateTime();
setInterval(updateTime, 1000);

function renderBattery(level, charging) {
  const percent = Math.round(level * 100);
  const fillWidth = Math.max(1, Math.round(12 * level));
  const fillColor = level <= 0.2 && !charging ? "#ff6b6b" : "currentColor";
  const shape = charging
    ? '<path d="M15 7h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><path d="M6 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1"/>' +
      '<path d="m11 7-3 5h4l-3 5"/><line x1="22" x2="22" y1="11" y2="13"/>'
    : '<rect width="16" height="10" x="2" y="7" rx="2"/><line x1="22" x2="22" y1="11" y2="13"/>' +
      `<rect x="4" y="9" width="${fillWidth}" height="6" rx="1" fill="${fillColor}" stroke="none"/>`;
  const element = $("#batteryElement");
  element.innerHTML =
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shape}</svg>` +
    `<span>${percent}%</span>`;
  element.setAttribute("aria-label", `Battery ${percent}%${charging ? ", charging" : ""}`);
  element.hidden = false;
}

/* Simulated battery that slowly drains (used when the browser has no Battery API) */
function simulateBattery() {
  let level = 1;
  renderBattery(level, false);
  setInterval(() => {
    level = level <= 0.12 ? 1 : level - 0.01;
    renderBattery(level, false);
  }, 8000);
}

/* Real battery level via the Battery Status API (Chrome, Edge, Opera).
   Firefox and Safari don't expose it, so they get the simulated one. */
if (navigator.getBattery) {
  navigator
    .getBattery()
    .then((battery) => {
      const update = () => renderBattery(battery.level, battery.charging);
      update();
      battery.addEventListener("levelchange", update);
      battery.addEventListener("chargingchange", update);
    })
    .catch(simulateBattery);
} else {
  simulateBattery();
}

$$(".topbar [data-open]").forEach((button) => {
  button.addEventListener("click", () => openWindow(button.dataset.open));
});

/* ===========================================================
   5. WINDOW MANAGER
   Open/close/minimize/maximize, dragging, resizing, stacking,
   and remembering where each window was left.
   =========================================================== */
const desktop = $("#desktop");
const layout = store.get("windows", {}) || {};
let topZ = 10;
let cascade = 0;

const topbarHeight = () => $(".topbar").offsetHeight;
const dockSpace = () => window.innerHeight - $("#dock").getBoundingClientRect().top + 8;
const isVisible = (win) => !win.classList.contains("is-closed") && !win.classList.contains("is-minimized");

const CONTROL_LABELS = { close: "Close", minimize: "Minimize", maximize: "Maximize" };

function setupWindow(win, options = {}) {
  const controls = options.controls || ["close", "minimize", "maximize"];
  const header = $(".window-header", win);

  const group = document.createElement("div");
  group.className = "window-controls";
  controls.forEach((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "wc wc-" + action;
    button.setAttribute("aria-label", CONTROL_LABELS[action]);
    button.addEventListener("click", () => {
      if (action === "close") (options.onClose || closeWindow)(win);
      else if (action === "minimize") minimizeWindow(win);
      else toggleMaximize(win);
    });
    group.appendChild(button);
  });
  header.prepend(group);

  const grip = document.createElement("div");
  grip.className = "resize-handle";
  win.appendChild(grip);

  makeDraggable(win, header);
  makeResizable(win, grip, options.minWidth || 300, options.minHeight || 200);

  if (controls.includes("maximize")) {
    header.addEventListener("dblclick", (e) => {
      if (!e.target.closest(".window-controls")) toggleMaximize(win);
    });
  }
  win.addEventListener("pointerdown", () => focusWindow(win));
}

/* Keeps the title bar reachable: never under the topbar or the dock,
   and at least 96px of the window stays on screen horizontally. */
function placeWindow(win, left, top) {
  const visible = 96;
  const minTop = topbarHeight();
  const maxTop = window.innerHeight - dockSpace() - 38;
  win.style.left = clamp(left, visible - win.offsetWidth, window.innerWidth - visible) + "px";
  win.style.top = clamp(top, minTop, Math.max(minTop, maxTop)) + "px";
}

function setGeometry(win, geometry) {
  const maxWidth = window.innerWidth - 16;
  const maxHeight = window.innerHeight - topbarHeight() - dockSpace() - 16;
  win.style.width = Math.round(Math.min(geometry.width, maxWidth)) + "px";
  win.style.height = Math.round(Math.min(geometry.height, maxHeight)) + "px";
  placeWindow(win, Math.round(geometry.left), Math.round(geometry.top));
}

function defaultGeometry(app) {
  const available = window.innerHeight - topbarHeight() - dockSpace();
  const width = Math.min(app.width, window.innerWidth - 16);
  const height = Math.min(app.height, available - 16);
  const offset = (cascade++ % 6) * 26 - 52;
  return {
    width,
    height,
    left: (window.innerWidth - width) / 2 + offset,
    top: topbarHeight() + (available - height) / 2 + offset,
  };
}

function saveGeometry(win) {
  if (win.classList.contains("sticky-note")) return saveNotes();
  layout[win.id] = {
    left: parseFloat(win.style.left),
    top: parseFloat(win.style.top),
    width: parseFloat(win.style.width),
    height: parseFloat(win.style.height),
  };
  store.set("windows", layout);
}

function makeDraggable(win, handle) {
  let drag = null;

  handle.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || e.target.closest(".window-controls") || win.classList.contains("is-maximized")) return;
    drag = {
      x: e.clientX,
      y: e.clientY,
      left: parseFloat(win.style.left) || 0,
      top: parseFloat(win.style.top) || 0,
    };
    handle.setPointerCapture(e.pointerId);
    win.classList.add("is-dragging");
  });

  handle.addEventListener("pointermove", (e) => {
    if (drag) placeWindow(win, drag.left + e.clientX - drag.x, drag.top + e.clientY - drag.y);
  });

  const stop = () => {
    if (!drag) return;
    drag = null;
    win.classList.remove("is-dragging");
    saveGeometry(win);
  };
  handle.addEventListener("pointerup", stop);
  handle.addEventListener("pointercancel", stop);
}

function makeResizable(win, grip, minWidth, minHeight) {
  let resize = null;

  grip.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || win.classList.contains("is-maximized")) return;
    e.preventDefault();
    resize = { x: e.clientX, y: e.clientY, width: win.offsetWidth, height: win.offsetHeight };
    grip.setPointerCapture(e.pointerId);
    win.classList.add("is-resizing");
  });

  grip.addEventListener("pointermove", (e) => {
    if (!resize) return;
    const maxWidth = Math.max(minWidth, window.innerWidth - win.offsetLeft - 4);
    const maxHeight = Math.max(minHeight, window.innerHeight - win.offsetTop - 4);
    win.style.width = clamp(resize.width + e.clientX - resize.x, minWidth, maxWidth) + "px";
    win.style.height = clamp(resize.height + e.clientY - resize.y, minHeight, maxHeight) + "px";
  });

  const stop = () => {
    if (!resize) return;
    resize = null;
    win.classList.remove("is-resizing");
    saveGeometry(win);
  };
  grip.addEventListener("pointerup", stop);
  grip.addEventListener("pointercancel", stop);
}

function focusWindow(win) {
  if (!win.classList.contains("is-active")) {
    $$(".window.is-active").forEach((other) => other.classList.remove("is-active"));
    win.classList.add("is-active");
  }
  if (Number(win.style.zIndex) !== topZ) win.style.zIndex = ++topZ;
  updateDock();
}

function focusTopmost() {
  const next = $$(".window")
    .filter(isVisible)
    .sort((a, b) => b.style.zIndex - a.style.zIndex)[0];
  if (next) focusWindow(next);
}

function openWindow(id) {
  if (id === "notes") return createStickyNote();
  const win = document.getElementById(id);
  if (!win || !APPS[id]) return;

  if (win.classList.contains("is-closed")) {
    setGeometry(win, layout[id] || defaultGeometry(APPS[id]));
    win.classList.toggle("is-maximized", isSmallScreen());
  }
  win.classList.remove("is-closed", "is-minimized");
  win.inert = false;
  focusWindow(win);

  if (id === "terminal") requestAnimationFrame(() => terminalInput.focus({ preventScroll: true }));
}

function hideWindow(win) {
  win.classList.remove("is-active");
  win.inert = true;
  focusTopmost();
  updateDock();
}

function closeWindow(win) {
  if (win.classList.contains("is-closed")) return;
  win.classList.add("is-closed");
  hideWindow(win);
}

function minimizeWindow(win) {
  win.classList.add("is-minimized");
  hideWindow(win);
}

function toggleMaximize(win) {
  win.classList.add("is-animating");
  win.classList.toggle("is-maximized");
  clearTimeout(win.animationTimer);
  win.animationTimer = setTimeout(() => win.classList.remove("is-animating"), 300);
}

/* Esc closes the active window (sticky notes just lose focus, closing deletes them) */
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const active = $(".window.is-active");
  if (!active) return;
  if (active.classList.contains("sticky-note")) document.activeElement.blur();
  else closeWindow(active);
});

/* keep windows reachable when the browser window gets smaller */
window.addEventListener(
  "resize",
  debounce(() => {
    $$(".window").filter(isVisible).forEach((win) => {
      placeWindow(win, parseFloat(win.style.left), parseFloat(win.style.top));
    });
  }, 120)
);

WINDOW_IDS.forEach((id) => setupWindow(document.getElementById(id)));

/* ===========================================================
   6. DESKTOP ICONS & DOCK
   Desktop: click = select, double click = open (tap on touch).
   Dock: open, focus, or minimize if it's already in front.
   =========================================================== */
let selectedIcon = null;

function selectIcon(element) {
  deselectIcon();
  element.classList.add("is-selected");
  selectedIcon = element;
}

function deselectIcon() {
  if (selectedIcon) selectedIcon.classList.remove("is-selected");
  selectedIcon = null;
}

function renderDesktopIcons() {
  const container = $("#desktopIcons");
  LAUNCHERS.forEach((app) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "appicon";
    button.innerHTML = `${tile(app.icon, app.color)}<span class="appicon-label">${app.title}</span>`;

    let pointerType = "mouse";
    button.addEventListener("pointerdown", (e) => (pointerType = e.pointerType));
    button.addEventListener("click", () => {
      if (pointerType === "touch") {
        deselectIcon();
        openWindow(app.id);
      } else {
        selectIcon(button);
      }
    });
    button.addEventListener("dblclick", () => {
      if (pointerType === "touch") return;
      deselectIcon();
      openWindow(app.id);
    });
    button.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openWindow(app.id);
      }
    });
    container.appendChild(button);
  });

  desktop.addEventListener("pointerdown", (e) => {
    if (e.target === desktop || e.target === container) deselectIcon();
  });
}

function renderDock() {
  const dock = $("#dock");
  LAUNCHERS.forEach((app) => {
    if (app.id === "notes") {
      const separator = document.createElement("span");
      separator.className = "dock-separator";
      dock.appendChild(separator);
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dock-item";
    button.dataset.app = app.id;
    button.dataset.label = app.title;
    button.setAttribute("aria-label", app.title);
    button.innerHTML = tile(app.icon, app.color);
    button.addEventListener("click", () => {
      const win = document.getElementById(app.id);
      if (win && isVisible(win) && win.classList.contains("is-active")) minimizeWindow(win);
      else openWindow(app.id);
    });
    dock.appendChild(button);
  });
}

function updateDock() {
  $$(".dock-item").forEach((item) => {
    let running, active;
    if (item.dataset.app === "notes") {
      running = $$(".sticky-note:not(.is-removing)").length > 0;
      active = Boolean($(".sticky-note.is-active"));
    } else {
      const win = document.getElementById(item.dataset.app);
      running = !win.classList.contains("is-closed");
      active = win.classList.contains("is-active");
    }
    item.classList.toggle("is-running", running);
    item.classList.toggle("is-active", active);
  });
}

renderDesktopIcons();
renderDock();

/* ===========================================================
   7. ABOUT ME APP
   =========================================================== */
const ABOUT_SECTIONS = [
  {
    title: "Hello!",
    meta: "intro",
    body: `
      <h2>hey, I'm eroga</h2>
      <p>
        I study cybersecurity and spend most of my time messing around
        with computers — Linux, privacy stuff, writing scripts, that kind of thing.
      </p>
      <p>
        made this for a Hack Club jam. thought a fake OS
        was more interesting than a normal portfolio page.
      </p>
    `,
  },
  {
    title: "Skills",
    meta: "what I use",
    body: `
      <h2>things I actually use</h2>
      <ul>
        <li><strong>Python</strong> — my main language, mostly for tooling and scripts</li>
        <li><strong>cryptography</strong> — classic ciphers, frequency analysis, that stuff</li>
        <li><strong>Linux &amp; privacy</strong> — GrapheneOS, hardening, de-Googling setups</li>
        <li><strong>HTML / CSS / JS</strong> — enough to make this whole thing (apparently)</li>
      </ul>
      <p style="opacity:0.7; font-size:13px;">still learning a lot, especially on the web side</p>
    `,
  },
  {
    title: "Right now",
    meta: "current projects",
    body: `
      <h2>right now</h2>
      <p>
        apart from this jam I've been working on two things:
        a <strong>Vigenère</strong> cracker in Python (it does statistical
        attacks and brute force), and a <strong>GrapheneOS</strong> setup
        guide for people who want more privacy but don't want to spend
        three hours configuring stuff.
      </p>
      <p>
        both are in the Projects app if you want to check them out,
        and both also work right here: the Vigenère one as its own app,
        and the guide as a window you can read.
        also — the sticky notes were my own feature for this jam, try them.
        they stay on the desktop even if you reload.
      </p>
    `,
  },
];

function showAboutSection(index) {
  $("#aboutContent").innerHTML = ABOUT_SECTIONS[index].body;
  $("#about-title").textContent = ABOUT_SECTIONS[index].title;
  $$(".sidebar-item", $("#aboutSidebar")).forEach((item, i) => {
    item.classList.toggle("is-active", i === index);
    item.setAttribute("aria-current", String(i === index));
  });
}

function renderAbout() {
  const sidebar = $("#aboutSidebar");
  ABOUT_SECTIONS.forEach((section, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "sidebar-item";
    item.innerHTML =
      `<span class="sidebar-item-title">${section.title}</span>` +
      `<span class="sidebar-item-meta">${section.meta}</span>`;
    item.addEventListener("click", () => showAboutSection(index));
    sidebar.appendChild(item);
  });
  showAboutSection(0);
}
renderAbout();

/* ===========================================================
   8. PROJECTS APP
   =========================================================== */
const PROJECTS = [
  {
    slug: "mios",
    icon: "monitor",
    color: "linear-gradient(135deg,#6a5cff,#ff7eb3)",
    name: "MiOS",
    desc: "my portfolio but it's a fake OS. made it for a Hack Club jam.",
    tags: ["HTML", "CSS", "JS"],
    link: "https://github.com/Er0ga/MiOS---browser-based-OS",
  },
  {
    slug: "vigenere",
    icon: "lock",
    color: APPS.vigenere.color,
    name: "Vigenère Tool",
    desc: "Python script to encrypt/decrypt Vigenère and crack it with frequency analysis or brute force. it also runs right here, as a MiOS app.",
    tags: ["Python", "cryptography"],
    link: "https://github.com/Ager90/Cifrado-Vigenere-Proyecto",
    app: "vigenere",
  },
  {
    slug: "grapheneos",
    icon: "smartphone",
    color: "linear-gradient(135deg,#4fd1c5,#2b9e8f)",
    name: "GrapheneOS Guide",
    desc: "setup guide for GrapheneOS focused on everyday use — not for people who live in a bunker. you can read it right here, as a MiOS app.",
    tags: ["privacy", "Android", "Linux"],
    link: "https://github.com/Er0ga/GrapheneOS-for-normal-usage_privacy-without-paranoia",
    app: "grapheneos",
  },
];

function renderProjects() {
  const grid = $("#projectGrid");
  PROJECTS.forEach((project) => {
    const card = document.createElement("article");
    card.className = "project-card";
    const tags = project.tags.map((tag) => `<span class="project-tag">${tag}</span>`).join("");
    const label = project.link && project.link.includes("github.com") ? "View on GitHub" : "Visit site";
    const link = project.link
      ? `<a class="project-link" href="${project.link}" target="_blank" rel="noopener">${label} ${icon("arrowRight")}</a>`
      : `<span class="project-link is-disabled">Coming soon</span>`;
    const appButton = project.app
      ? `<button type="button" class="project-link" data-open-app="${project.app}">Open in MiOS ${icon("arrowRight")}</button>`
      : "";
    card.innerHTML = `
      ${tile(project.icon, project.color)}
      <h3>${project.name}</h3>
      <p>${project.desc}</p>
      <div class="project-tags">${tags}</div>
      <div class="project-links">${appButton}${link}</div>
    `;
    const button = $("[data-open-app]", card);
    if (button) button.addEventListener("click", () => openWindow(project.app));
    grid.appendChild(card);
  });
}
renderProjects();

/* ===========================================================
   8b. GRAPHENEOS GUIDE APP
   A copy of the README at github.com/Er0ga/GrapheneOS-for-normal-usage_privacy-without-paranoia,
   split into sections. If the repo changes, update the text here.
   =========================================================== */
const GRAPHENE_REPO = "https://github.com/Er0ga/GrapheneOS-for-normal-usage_privacy-without-paranoia";

const GRAPHENE_SECTIONS = [
  {
    title: "Intro",
    meta: "what this is",
    body: `
      <h2>GrapheneOS for normal usage</h2>
      <p><em>privacy without paranoia</em></p>
      <p>
        A simple guide to set up GrapheneOS on Google Pixel devices. It is intended for users who want better
        privacy and control of their mobile device without sacrificing usability or spending much time.
      </p>
      <p>
        I created this repo because when I looked for resources on how to set up GrapheneOS, almost every one I
        found aimed at users with extreme privacy concerns (at the expense of usability). I just wanted a
        practical, everyday smartphone experience with better privacy and control, without giving up much
        usability or spending excessive time configuring it.
      </p>
      <p class="guide-source">
        This is a copy of the guide inside MiOS.
        <a href="${GRAPHENE_REPO}" target="_blank" rel="noopener">Read the original on GitHub</a>.
      </p>
    `,
  },
  {
    title: "Installation",
    meta: "WebUSB installer",
    body: `
      <h2>Installation</h2>
      <p>
        Open up a web browser and go to the
        <a href="https://grapheneos.org/install/" target="_blank" rel="noopener">official installation page</a>
        (here I am going to explain the
        <a href="https://grapheneos.org/install/web" target="_blank" rel="noopener">WebUSB-based installer</a>
        because it is the easiest method). Before continuing, check if your browser, OS and mobile are supported.
      </p>
      <blockquote>
        All Google Pixel devices from Pixel 6 through Pixel 10 Pro Fold are supported by GrapheneOS, but you can
        check your specific model on
        <a href="https://grapheneos.org/releases" target="_blank" rel="noopener">grapheneos.org/releases</a>.
      </blockquote>
      <blockquote>
        Only Chromium-based browsers are supported: Chromium (outside Ubuntu), Vanadium, Google Chrome, Microsoft
        Edge, Brave (without Shields enabled). Do not use incognito mode on the browser.
      </blockquote>
      <blockquote>
        Almost every major OS is supported, but you can check yours in the
        <a href="https://grapheneos.org/install/web#prerequisites" target="_blank" rel="noopener">prerequisites</a>.
      </blockquote>
      <ol>
        <li>
          <strong>Enable OEM unlocking.</strong> Enable the Developer options menu: go to
          <strong>Settings &gt; About phone/tablet</strong> and tap the <strong>Build number</strong> entry until
          you see a message confirming that developer mode is enabled. Then go to
          <strong>Settings &gt; System &gt; Developer options</strong> and enable <strong>OEM unlocking</strong>.
          On some devices you must be connected to Wi-Fi to enable this, as it checks if the phone has been
          reported as stolen. <strong>Verizon Pixel phones cannot</strong> have their bootloader unlocked, which
          is a requirement for installing GrapheneOS.
        </li>
        <li>
          <strong>Boot into the bootloader.</strong> Reboot the phone and hold the volume down button. On some
          Windows systems you may need to install
          <a href="https://grapheneos.org/install/web#connecting-device" target="_blank" rel="noopener">fastboot drivers</a>.
        </li>
        <li>
          <strong>Unlock the bootloader.</strong> Connect the phone to your computer with a USB-C cable. In your
          browser, click
          <a href="https://grapheneos.org/install/web#unlocking-the-bootloader" target="_blank" rel="noopener">Unlock bootloader</a>,
          select your phone in the pop-up window and click <strong>Connect</strong>. On your phone you will see
          <strong>Do not unlock the bootloader</strong> next to the power button. Press the volume up or down
          button to change the option to <strong>Unlock the bootloader</strong>, then press the power button to
          confirm.
        </li>
        <li>
          <strong>Flash GrapheneOS.</strong> Click
          <a href="https://grapheneos.org/install/web#obtaining-factory-images" target="_blank" rel="noopener">Download release</a>
          to download the factory images for your device. Once the download is complete, click
          <strong>Flash release</strong>. This flashes the firmware and wipes all previous data.
          <strong>Important: do not interact with the device until the flashing process is finished.</strong>
        </li>
        <li>
          <strong>Lock the bootloader.</strong> After flashing, click <strong>Lock bootloader</strong>. This is
          crucial for the security and integrity of the device. On your phone you will see
          <strong>Do not lock the bootloader</strong> next to the power button. Press the volume up or down button
          to change it to <strong>Lock the bootloader</strong>, then press the power button. The screen should
          display "Device state: locked". Press <strong>Start</strong> with the power button.
        </li>
        <li>
          <strong>Finish the setup.</strong> Complete the initial GrapheneOS setup. For security, disable OEM
          unlocking again: <strong>Settings &gt; About phone/tablet</strong>, tap <strong>Build number</strong> if
          developer mode isn't already enabled, then <strong>Settings &gt; System &gt; Developer options</strong>
          and disable <strong>OEM unlocking</strong>. You can now also disable the Developer options menu.
        </li>
      </ol>
      <blockquote>
        Every time you switch your device on or off, you will see a warning on the screen. This is normal and
        happens because you are not running Google's official OS.
      </blockquote>
    `,
  },
  {
    title: "Getting apps",
    meta: "stores & alternatives",
    body: `
      <h2>Getting apps</h2>
      <p>
        GrapheneOS has an app called <strong>App Store</strong> with the official GrapheneOS apps (Auditor, Camera,
        Info, Messaging, PDF Viewer), <a href="https://accrescent.app/" target="_blank" rel="noopener">Accrescent</a>
        and the ones from the Google ecosystem (mirror): Android Auto, Google Play Store, Google Play services and
        Markup.
      </p>

      <h3>App stores</h3>
      <ul>
        <li>
          <a href="https://f-droid.org/" target="_blank" rel="noopener">F-Droid</a> — the premier app store for
          open source Android applications, prioritizing privacy and user freedom. The one I recommend. Apps cannot
          depend on Google Play Services, are checked for security problems before they are added, and you can see
          the permissions and versions of each app.
        </li>
        <li>
          <a href="https://auroraoss.com/aurora-store" target="_blank" rel="noopener">Aurora Store</a> — the most
          popular free and open source alternative to the Google Play Store, an anonymous Play Store client.
        </li>
        <li>
          <a href="https://play.google.com/store/" target="_blank" rel="noopener">Google Play Store</a> — Google's
          official app store. Unlike the others you need to sign in. Some apps can only be installed through this
          store or have limitations otherwise, for example Google Maps, WhatsApp or banking apps.
        </li>
      </ul>

      <h3>De-Googling your apps</h3>
      <p>To reduce reliance on big tech companies, consider privacy-focused alternatives for your daily needs:</p>
      <ul>
        <li>
          <strong>Email:</strong> private providers such as
          <a href="https://proton.me/mail" target="_blank" rel="noopener">Proton Mail</a> or
          <a href="https://tutanota.com/" target="_blank" rel="noopener">Tutanota</a>. If you already have a Gmail
          account, use an open-source client like
          <a href="https://www.thunderbird.net/" target="_blank" rel="noopener">Thunderbird</a> instead of the
          closed-source Gmail app.
        </li>
        <li>
          <strong>Browsers:</strong>
          <a href="https://grapheneos.org/features#vanadium" target="_blank" rel="noopener">Vanadium</a> is a
          robust option available out of the box. <a href="https://brave.com/" target="_blank" rel="noopener">Brave</a>
          and <a href="https://www.mozilla.org/en-US/firefox/mobile/" target="_blank" rel="noopener">Firefox</a>
          (with privacy settings adjusted) are also strong alternatives.
        </li>
        <li>
          <strong>Password managers:</strong> an open-source one like
          <a href="https://proton.me/pass" target="_blank" rel="noopener">Proton Pass</a> or
          <a href="https://www.keepassdx.com/" target="_blank" rel="noopener">KeePassDX</a>.
        </li>
        <li>
          <strong>YouTube:</strong> for ad-free, telemetry-free, background-playing viewing without an account, try
          <a href="https://newpipe.net/" target="_blank" rel="noopener">NewPipe</a>. For almost the same
          experience with your account, use YouTube in Brave.
        </li>
        <li>
          <strong>Basic apps:</strong> for gallery, calendar, file manager, etc., check out
          <a href="https://fossify.org/" target="_blank" rel="noopener">Fossify</a>. Available on Aurora Store and
          F-Droid.
        </li>
        <li>
          <strong>Maps:</strong> <a href="https://organicmaps.app/" target="_blank" rel="noopener">Organic Maps</a>
          and <a href="https://osmand.net/" target="_blank" rel="noopener">OsmAnd</a> are two strong open source
          alternatives to Google Maps, but in my opinion they are far from offering a similar experience.
        </li>
      </ul>

      <h3>Additional notes and limitations</h3>
      <ul>
        <li>
          <strong>Mobile payment wallets:</strong> I haven't found an open-source alternative to Google Wallet that
          allows contactless payments on GrapheneOS, and Google Wallet is not compatible with it. To store tickets
          (bus, plane, concert, etc.) you can try <a href="https://fossify.org/" target="_blank" rel="noopener">FossWallet</a>,
          available on F-Droid and Aurora Store.
        </li>
        <li>
          <strong>Android Auto:</strong> I haven't tested it on GrapheneOS. According to the official
          documentation, compatibility may vary — see the
          <a href="https://grapheneos.org/usage#android-auto" target="_blank" rel="noopener">Android Auto section</a>.
        </li>
        <li>
          <strong>GPS:</strong> you won't be able to use GPS and precise location in any app out of the box. See
          the <em>Location &amp; GPS</em> section.
        </li>
      </ul>

      <h3>Other recommended apps</h3>
      <ul>
        <li><strong>2FA:</strong>
          <a href="https://getaegis.app/" target="_blank" rel="noopener">Aegis</a>,
          <a href="https://ente.io/auth" target="_blank" rel="noopener">Ente Auth</a>,
          <a href="https://proton.me/authenticator" target="_blank" rel="noopener">Proton Auth</a></li>
        <li><strong>Photos:</strong>
          <a href="https://ente.io/" target="_blank" rel="noopener">Ente Photos</a>,
          <a href="https://immich.app/" target="_blank" rel="noopener">Immich</a></li>
        <li><strong>Notes:</strong>
          <a href="https://notesnook.com/" target="_blank" rel="noopener">Notesnook</a>,
          <a href="https://obsidian.md/" target="_blank" rel="noopener">Obsidian</a>,
          <a href="https://cryptee.com/" target="_blank" rel="noopener">Cryptee</a></li>
        <li><strong>Cloud storage:</strong>
          <a href="https://proton.me/drive" target="_blank" rel="noopener">Proton Drive</a>,
          <a href="https://syncthing.net/" target="_blank" rel="noopener">Syncthing</a>,
          <a href="https://filen.io/" target="_blank" rel="noopener">Filen</a>,
          <a href="https://nextcloud.com/" target="_blank" rel="noopener">Nextcloud</a></li>
      </ul>

      <h3>Where to find more apps</h3>
      <ul>
        <li><a href="https://privacytools.techlore.tech/" target="_blank" rel="noopener">PrivacyTools by Techlore</a></li>
        <li><a href="https://privacyguides.org/en/tools/" target="_blank" rel="noopener">Privacy Guides</a></li>
        <li><a href="https://alternativeto.net/platform/android/" target="_blank" rel="noopener">AlternativeTo</a></li>
      </ul>
    `,
  },
  {
    title: "Location & GPS",
    meta: "navigation, Google Maps",
    body: `
      <h2>Location and GPS</h2>
      <p>
        GrapheneOS isolates your location data by default. To get navigation apps working without leaking your IP
        address or location history to Google, you need to configure the redirection services manually.
      </p>
      <ol>
        <li>
          <strong>Enable the global location.</strong> Go to <strong>Settings &gt; Location</strong> and enable
          <strong>Use location</strong> (off by default). Unlike standard Android, enabling this does not
          immediately start sending data to the cloud.
        </li>
        <li>
          <strong>Configure privacy proxies.</strong> Tap <strong>Location services</strong>. Set
          <strong>Secure User Plane Location (SUPL)</strong> and
          <strong>Predicted Satellite Data Service (PSDS)</strong> to <strong>GrapheneOS proxy</strong>, and make
          sure <strong>Network location</strong> and <strong>Geocoder</strong> also use the
          <strong>GrapheneOS proxy</strong>. External servers (like Google's or Qualcomm's) will see the proxy's IP
          address instead of yours, so you get a GPS lock without showing your location.
        </li>
        <li>
          <strong>Disable background scanning.</strong> In the same menu, I recommend disabling
          <strong>Wi-Fi scanning</strong> and <strong>Bluetooth scanning</strong>. On standard Android these are on
          by default "to improve accuracy", but they constantly broadcast signals to nearby devices even when you
          aren't using them. Turning them off prevents this passive tracking and improves battery life.
        </li>
        <li>
          <strong>App permissions.</strong> When you open a map app (like Organic Maps) for the first time, select
          <strong>Allow only while using the app</strong> — not "Allow all the time" if you want to prevent
          background usage. Make sure <strong>Use precise location</strong> is <strong>ON</strong> if you need
          turn-by-turn navigation.
        </li>
      </ol>

      <h3>Google Maps</h3>
      <p>
        To use <strong>Google Maps</strong> normally on GrapheneOS, beyond the settings above, you must install
        <strong>Google Play Store</strong> and <strong>Google Play Services</strong> from the GrapheneOS
        <strong>App Store</strong>.
      </p>
      <ol>
        <li>
          After installing Google Play Services, go to <strong>Settings &gt; Apps &gt; Google Play Services</strong>
          and enable <strong>Allow background activity</strong> and <strong>Allow network access</strong>.
        </li>
        <li>
          Install <strong>Google Maps</strong> from the Google Play Store. When you first open the app, grant it
          <strong>location permissions</strong> and <strong>precise location</strong> (select
          <strong>Allow only while using the app</strong>).
        </li>
      </ol>
    `,
  },
];

function showGrapheneSection(index) {
  const content = $("#grapheneContent");
  content.innerHTML = GRAPHENE_SECTIONS[index].body;
  content.scrollTop = 0;
  $$(".sidebar-item", $("#grapheneSidebar")).forEach((item, i) => {
    item.classList.toggle("is-active", i === index);
    item.setAttribute("aria-current", String(i === index));
  });
}

function renderGraphene() {
  const sidebar = $("#grapheneSidebar");
  GRAPHENE_SECTIONS.forEach((section, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "sidebar-item";
    item.innerHTML =
      `<span class="sidebar-item-title">${section.title}</span>` +
      `<span class="sidebar-item-meta">${section.meta}</span>`;
    item.addEventListener("click", () => showGrapheneSection(index));
    sidebar.appendChild(item);
  });
  showGrapheneSection(0);
}
renderGraphene();

/* ===========================================================
   9. CONTACT APP
   =========================================================== */
const CONTACT_LINKS = [
  {
    label: "GitHub",
    handle: "@Er0ga",
    url: "https://github.com/Er0ga",
    icon: "github",
    color: "linear-gradient(135deg,#4a4f5a,#16181f)",
  },
  {
    label: "GitHub",
    handle: "@Ager90",
    url: "https://github.com/Ager90/",
    icon: "github",
    color: "linear-gradient(135deg,#4a4f5a,#16181f)",
  },
  {
    label: "LinkedIn",
    handle: "Ager Pérez",
    url: "https://www.linkedin.com/in/ager-p%C3%A9rez-6813b93a0/",
    icon: "linkedin",
    color: "linear-gradient(135deg,#2f8fe0,#0a66c2)",
  },
];

function renderContact() {
  $("#contactList").innerHTML = CONTACT_LINKS.map(
    (link) => `
      <a class="contact-link" href="${link.url}" target="_blank" rel="noopener">
        ${tile(link.icon, link.color)}
        <span><strong>${link.label}</strong><small>${link.handle}</small></span>
        ${icon("external", "arrow")}
      </a>`
  ).join("");
}
renderContact();

/* ===========================================================
   10. WALLPAPER APP
   =========================================================== */
const WALLPAPERS = ["aurora", "sunset", "ocean", "forest", "midnight"];
const currentWallpaper = () => document.documentElement.dataset.wallpaper;

function setWallpaper(name) {
  if (!WALLPAPERS.includes(name)) return false;
  document.documentElement.dataset.wallpaper = name;
  store.set("wallpaper", name);
  $$(".swatch").forEach((swatch) => {
    swatch.setAttribute("aria-pressed", String(swatch.dataset.wallpaper === name));
  });
  return true;
}

function renderWallpapers() {
  const grid = $("#wallpaperGrid");
  WALLPAPERS.forEach((name) => {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = "swatch";
    swatch.dataset.wallpaper = name;
    swatch.innerHTML =
      '<span class="swatch-preview"></span>' +
      `<span>${name.charAt(0).toUpperCase() + name.slice(1)}</span>`;
    swatch.addEventListener("click", () => setWallpaper(name));
    grid.appendChild(swatch);
  });
}
renderWallpapers();
if (!setWallpaper(store.get("wallpaper", "aurora"))) setWallpaper("aurora");

/* ===========================================================
   11. VIGENÈRE APP
   Port of Pygenère (github.com/Ager90/Cifrado-Vigenere-Proyecto):
   encrypt/decrypt, statistical attack (χ² against Spanish or English
   letter frequencies), brute force and a speed benchmark.
   =========================================================== */
/* Letter frequencies (%), A–Z. Spanish is the same table as the Python version. */
const VIGENERE_LANGUAGES = {
  es: {
    name: "Spanish",
    note:
      "Los ataques comparan con las frecuencias de letras del español, así que funcionan mejor con textos en " +
      "español. Con textos en inglés u otros idiomas pueden dar una clave incorrecta. Cifrar y descifrar " +
      "funciona con cualquier idioma.",
    freq: [
      12.53, 1.42, 4.68, 5.86, 13.68, 0.69, 1.01, 0.7, 6.25, 0.44, 0.02, 4.97, 3.15,
      6.71, 8.68, 2.51, 0.88, 6.87, 7.98, 4.63, 3.93, 0.9, 0.01, 0.22, 0.9, 0.52,
    ],
    example:
      "En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía " +
      "un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor. Una olla " +
      "de algo más vaca que carnero, salpicón las más noches, duelos y quebrantos los sábados, lentejas " +
      "los viernes, algún palomino de añadidura los domingos, consumían las tres partes de su hacienda.",
  },
  en: {
    name: "English",
    note:
      "The attacks compare against English letter frequencies, so they work best on English text. " +
      "Spanish or other languages may give the wrong key. Encrypting and decrypting work with any language.",
    freq: [
      8.17, 1.49, 2.78, 4.25, 12.7, 2.23, 2.02, 6.09, 6.97, 0.15, 0.77, 4.03, 2.41,
      6.75, 7.51, 1.93, 0.1, 5.99, 6.33, 9.06, 2.76, 0.98, 2.36, 0.15, 1.97, 0.07,
    ],
    example:
      "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of " +
      "foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, " +
      "it was the season of Darkness, it was the spring of hope, it was the winter of despair, we had " +
      "everything before us, we had nothing before us, we were all going direct to Heaven.",
  },
};
const VIGENERE_EXAMPLE_KEY = "MIOS";

let attackLanguage = VIGENERE_LANGUAGES[store.get("vigenereLanguage", "es")] ? store.get("vigenereLanguage", "es") : "es";
const languageFreq = () => VIGENERE_LANGUAGES[attackLanguage].freq;

/* like normalizar_texto(): strip accents (Ñ → N), uppercase, keep A–Z only */
function normalizeText(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
}

const toCodes = (text) => Array.from(normalizeText(text), (char) => char.charCodeAt(0) - 65);
const fromCodes = (codes) => codes.map((code) => String.fromCharCode(code + 65)).join("");

/* direction: 1 encrypts, -1 decrypts */
function vigenereShift(codes, keyCodes, direction) {
  return codes.map((code, i) => (code + direction * keyCodes[i % keyCodes.length] + 26) % 26);
}

/* same normalization, but numbers, spaces and line breaks are kept */
function prepareText(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^\S\n]+/g, " ")
    .replace(/[^A-Z0-9 \n]/g, "");
}

/* encrypts/decrypts the letters and leaves numbers and spaces untouched;
   the key only advances on letters, so the attacks (letters only) still line up */
function vigenereText(text, keyCodes, direction) {
  let k = 0;
  return prepareText(text).replace(/[A-Z]/g, (char) => {
    const shift = direction * keyCodes[k++ % keyCodes.length];
    return String.fromCharCode(((char.charCodeAt(0) - 65 + shift + 26) % 26) + 65);
  });
}

const exampleCiphertext = () =>
  vigenereText(VIGENERE_LANGUAGES[attackLanguage].example, toCodes(VIGENERE_EXAMPLE_KEY), 1);

function chiSquared(counts, total) {
  const freq = languageFreq();
  let chi = 0;
  for (let i = 0; i < 26; i++) {
    const expected = (total * freq[i]) / 100;
    chi += (counts[i] - expected) ** 2 / expected;
  }
  return chi;
}

function columnCounts(codes, length) {
  const columns = Array.from({ length }, () => new Array(26).fill(0));
  codes.forEach((code, i) => columns[i % length][code]++);
  return columns;
}

/* plaintext letter i comes from ciphertext letter i + shift */
function bestShift(counts) {
  const total = counts.reduce((sum, count) => sum + count, 0);
  let best = { shift: 0, chi: Infinity };
  for (let shift = 0; shift < 26; shift++) {
    const chi = chiSquared(counts.map((_, i) => counts[(i + shift) % 26]), total);
    if (chi < best.chi) best = { shift, chi };
  }
  return best;
}

function indexOfCoincidence(counts) {
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total < 2) return 0;
  return counts.reduce((sum, count) => sum + count * (count - 1), 0) / (total * (total - 1));
}

/* "MIOSMIOS" → "MIOS", so a repeated key is only listed once */
function shortestPeriod(key) {
  for (let period = 1; period < key.length; period++) {
    if (key.length % period === 0 && key.slice(0, period).repeat(key.length / period) === key) {
      return key.slice(0, period);
    }
  }
  return key;
}

function uniqueKeys(results) {
  const seen = new Set();
  return results
    .map((result) => ({ ...result, key: shortestPeriod(result.key) }))
    .filter((result) => !seen.has(result.key) && seen.add(result.key));
}

function statisticalAttack(codes, maxLength) {
  const results = [];
  const limit = Math.min(maxLength, Math.floor(codes.length / 2));
  for (let length = 1; length <= limit; length++) {
    const columns = columnCounts(codes, length);
    const fits = columns.map(bestShift);
    results.push({
      key: fromCodes(fits.map((fit) => fit.shift)),
      chi: fits.reduce((sum, fit) => sum + fit.chi, 0) / length,
      ioc: columns.reduce((sum, column) => sum + indexOfCoincidence(column), 0) / length,
    });
  }
  const ranking = uniqueKeys(results.slice().sort((a, b) => a.chi - b.chi));
  /* long keys overfit and can score slightly better than the real one, so the best guess
     is the shortest key whose χ² is close to the lowest one */
  const best = ranking
    .filter((result) => result.chi <= ranking[0].chi * 1.5)
    .sort((a, b) => a.key.length - b.key.length)[0];
  return { best, ranking: ranking.slice(0, 5) };
}

/* Tries every key up to maxLength, in small slices so the page stays responsive.
   Each key is scored with χ² on letter counts per column (same result as
   decrypting the whole text, but much faster). Returns a cancel function. */
function bruteForce(codes, maxLength, onProgress, onDone) {
  const total = Array.from({ length: maxLength }, (_, i) => 26 ** (i + 1)).reduce((a, b) => a + b, 0);
  const expected = languageFreq().map((freq) => (codes.length * freq) / 100);
  const combined = new Float64Array(26);
  const top = [];
  const start = performance.now();
  let length = 0;
  let digits = [];
  let columns = null;
  let tested = 0;
  let cancelled = false;

  function nextLength() {
    length++;
    digits = new Array(length).fill(0);
    /* each column is stored twice in a row so (i + shift) never needs a modulo */
    columns = new Int32Array(length * 52);
    codes.forEach((code, i) => {
      const base = (i % length) * 52;
      columns[base + code]++;
      columns[base + code + 26]++;
    });
  }

  function consider(chi) {
    if (top.length === 5 && chi >= top[4].chi) return;
    const key = shortestPeriod(fromCodes(digits));
    const existing = top.findIndex((entry) => entry.key === key);
    if (existing !== -1) {
      if (top[existing].chi <= chi) return;
      top.splice(existing, 1);
    }
    top.push({ key, chi });
    top.sort((a, b) => a.chi - b.chi);
    if (top.length > 5) top.pop();
  }

  function finish() {
    onDone({ top, tested, total, seconds: (performance.now() - start) / 1000, cancelled });
  }

  function step() {
    if (cancelled) return finish();
    const sliceEnd = performance.now() + 30;
    while (performance.now() < sliceEnd) {
      for (let batch = 0; batch < 2000; batch++) {
        combined.fill(0);
        for (let c = 0; c < length; c++) {
          const base = c * 52 + digits[c];
          for (let i = 0; i < 26; i++) combined[i] += columns[base + i];
        }
        let chi = 0;
        for (let i = 0; i < 26; i++) chi += (combined[i] - expected[i]) ** 2 / expected[i];
        consider(chi);
        tested++;

        let position = length - 1;
        while (position >= 0 && ++digits[position] === 26) digits[position--] = 0;
        if (position < 0) {
          if (length === maxLength) return finish();
          nextLength();
        }
      }
    }
    onProgress(tested, total, (performance.now() - start) / 1000);
    setTimeout(step, 0);
  }

  nextLength();
  setTimeout(step, 0);
  return () => (cancelled = true);
}

/* Like ejecutar_benchmark(): how many full decryptions per second this browser manages */
function runBenchmark(onDone) {
  const codes = toCodes(exampleCiphertext());
  const key = [0, 0, 0, 0];
  let count = 0;
  let busy = 0;
  (function tick() {
    const sliceStart = performance.now();
    while (performance.now() - sliceStart < 50) {
      for (let i = 0; i < 100; i++) {
        key[i % 4] = count % 26;
        vigenereShift(codes, key, -1);
        count++;
      }
    }
    busy += performance.now() - sliceStart;
    if (busy < 1000) setTimeout(tick, 0);
    else onDone({ rate: count / (busy / 1000), letters: codes.length });
  })();
}

function formatDuration(seconds) {
  if (seconds < 1) return Math.max(1, Math.round(seconds * 1000)) + " ms";
  if (seconds < 60) return seconds.toFixed(1) + " s";
  if (seconds < 3600) return (seconds / 60).toFixed(1) + " min";
  if (seconds < 86400) return (seconds / 3600).toFixed(1) + " h";
  if (seconds < 31557600) return (seconds / 86400).toFixed(1) + " days";
  return Math.round(seconds / 31557600).toLocaleString("en-GB") + " years";
}

const formatNumber = (number) => Math.round(number).toLocaleString("en-GB");

/* ---------- Vigenère window ---------- */
function decryptPreview(text, key) {
  const plain = vigenereText(text, toCodes(key), -1);
  return plain.length > 280 ? plain.slice(0, 280) + "…" : plain;
}

function bestKeyCard(label, key, meta, preview) {
  return `
    <div class="vig-best">
      <span class="vig-best-label">${label}</span>
      <span class="vig-best-key">${escapeHtml(key)}</span>
      <span class="vig-best-meta">${meta}</span>
      <pre class="vig-preview">${escapeHtml(preview)}</pre>
    </div>`;
}

function rankingTable(rows) {
  return `
    <table class="vig-table">
      <thead><tr><th>#</th><th>Key</th><th>Length</th><th>χ²</th></tr></thead>
      <tbody>${rows
        .map(
          (row, i) =>
            `<tr><td>${i + 1}</td><td class="mono">${escapeHtml(row.key)}</td>` +
            `<td>${row.key.length}</td><td>${row.chi.toFixed(1)}</td></tr>`
        )
        .join("")}</tbody>
    </table>`;
}

const vigError = (text) => `<p class="vig-error">${text}</p>`;

function setupVigenereApp() {
  const app = $("#vigenere");
  const tabs = $$("[data-tab]", app);

  function showTab(name) {
    tabs.forEach((tab) => tab.setAttribute("aria-selected", String(tab.dataset.tab === name)));
    $$("[data-panel]", app).forEach((panel) => (panel.hidden = panel.dataset.panel !== name));
  }
  tabs.forEach((tab) => tab.addEventListener("click", () => showTab(tab.dataset.tab)));

  /* attack language (Spanish / English letter frequencies) */
  function setAttackLanguage(code) {
    attackLanguage = code;
    store.set("vigenereLanguage", code);
    $$("[data-lang]", app).forEach((button) => {
      button.setAttribute("aria-checked", String(button.dataset.lang === code));
    });
    $("#vigLangNote").textContent = VIGENERE_LANGUAGES[code].note;
  }
  $$("[data-lang]", app).forEach((button) => {
    button.addEventListener("click", () => setAttackLanguage(button.dataset.lang));
  });
  setAttackLanguage(attackLanguage);

  function loadCiphertext(text) {
    $("#statsText").value = text;
    $("#bruteText").value = text;
  }
  $$("[data-example]", app).forEach((button) => {
    button.addEventListener("click", () => loadCiphertext(exampleCiphertext()));
  });

  /* encrypt / decrypt */
  function runCipher(direction) {
    const hasText = prepareText($("#vigText").value).trim() !== "";
    const key = toCodes($("#vigKey").value);
    const error = $("#vigError");
    error.hidden = true;
    if (!hasText || !key.length) {
      error.textContent = !hasText ? "Write some text first." : "The key needs at least one letter.";
      error.hidden = false;
      $("#vigOutput").hidden = true;
      return;
    }
    $("#vigResult").textContent = vigenereText($("#vigText").value, key, direction);
    $("#vigOutput").hidden = false;
  }
  $("#vigEncrypt").addEventListener("click", () => runCipher(1));
  $("#vigDecrypt").addEventListener("click", () => runCipher(-1));

  $("#vigCopy").addEventListener("click", (e) => {
    const button = e.currentTarget;
    navigator.clipboard
      .writeText($("#vigResult").textContent)
      .then(() => {
        button.textContent = "Copied!";
        setTimeout(() => (button.textContent = "Copy"), 1200);
      })
      .catch(() => {});
  });
  $("#vigCrack").addEventListener("click", () => {
    loadCiphertext($("#vigResult").textContent);
    showTab("stats");
  });

  /* statistical attack */
  $("#statsRun").addEventListener("click", () => {
    const codes = toCodes($("#statsText").value);
    const output = $("#statsResult");
    if (codes.length < 20) {
      output.innerHTML = vigError("Paste at least 20 letters of ciphertext (a few hundred work best).");
      return;
    }
    const maxLength = clamp(parseInt($("#statsMax").value, 10) || 20, 1, 30);
    const { best, ranking } = statisticalAttack(codes, maxLength);
    output.innerHTML =
      bestKeyCard(
        "Most likely key",
        best.key,
        `length ${best.key.length} · χ² ${best.chi.toFixed(1)} · IoC ${best.ioc.toFixed(3)}`,
        decryptPreview($("#statsText").value, best.key)
      ) +
      rankingTable(ranking) +
      '<p class="vig-note">Like the original: the ranking shows statistical plausibility, not guaranteed correctness.</p>';
  });

  /* brute force */
  let cancelBrute = null;
  $("#bruteRun").addEventListener("click", () => {
    const ciphertext = $("#bruteText").value;
    const codes = toCodes(ciphertext);
    const output = $("#bruteResult");
    if (codes.length < 10) {
      output.innerHTML = vigError("Paste at least 10 letters of ciphertext.");
      return;
    }
    const maxLength = Number($("#bruteMax").value);
    $("#bruteRun").disabled = true;
    $("#bruteCancel").hidden = false;
    output.innerHTML =
      '<div class="progress"><span id="bruteBar"></span></div><p class="vig-stats" id="bruteStats">Starting…</p>';

    cancelBrute = bruteForce(
      codes,
      maxLength,
      (tested, total, seconds) => {
        $("#bruteBar").style.width = (tested / total) * 100 + "%";
        $("#bruteStats").textContent =
          `${formatNumber(tested)} / ${formatNumber(total)} keys · ` +
          `${formatNumber(tested / seconds)} keys/s · ${seconds.toFixed(1)} s`;
      },
      ({ top, tested, total, seconds, cancelled }) => {
        cancelBrute = null;
        $("#bruteRun").disabled = false;
        $("#bruteCancel").hidden = true;
        const summary =
          `${cancelled ? "Cancelled after" : "Tested"} ${formatNumber(tested)} of ${formatNumber(total)} keys ` +
          `in ${formatDuration(seconds)}.`;
        if (!top.length) {
          output.innerHTML = `<p class="vig-stats">${summary}</p>`;
          return;
        }
        output.innerHTML =
          bestKeyCard(
            cancelled ? "Best key so far" : "Best key",
            top[0].key,
            `length ${top[0].key.length} · χ² ${top[0].chi.toFixed(1)}`,
            decryptPreview(ciphertext, top[0].key)
          ) +
          rankingTable(top) +
          `<p class="vig-stats">${summary}</p>`;
      }
    );
  });
  $("#bruteCancel").addEventListener("click", () => cancelBrute && cancelBrute());

  /* benchmark */
  $("#benchRun").addEventListener("click", () => {
    const button = $("#benchRun");
    const output = $("#benchResult");
    button.disabled = true;
    output.innerHTML = '<p class="vig-stats">Measuring for about a second…</p>';
    runBenchmark(({ rate, letters }) => {
      button.disabled = false;
      const rows = Array.from({ length: 8 }, (_, i) => {
        const combinations = 26 ** (i + 1);
        return (
          `<tr><td>${i + 1}</td><td>${formatNumber(combinations)}</td>` +
          `<td>${formatDuration(combinations / rate)}</td></tr>`
        );
      }).join("");
      output.innerHTML = `
        <div class="vig-best">
          <span class="vig-best-label">Your browser</span>
          <span class="vig-best-key">${formatNumber(rate)}</span>
          <span class="vig-best-meta">decryptions per second (${letters}-letter text)</span>
        </div>
        <table class="vig-table">
          <thead><tr><th>Key length</th><th>Combinations</th><th>Estimated time</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    });
  });
}
setupVigenereApp();

/* ===========================================================
   12. TERMINAL
   A tiny shell with a fake file system, history (↑/↓),
   Tab completion and a working Vigenère cipher.
   =========================================================== */
const terminalBody = $("#terminalBody");
const terminalOutput = $("#terminalOutput");
const terminalInput = $("#terminalInput");
const commandHistory = [];
let historyIndex = 0;
let cwd = []; // path segments below ~

const accent = (html) => `<span class="term-accent">${html}</span>`;
const muted = (html) => `<span class="term-muted">${html}</span>`;
const warn = (html) => `<span class="term-warn">${html}</span>`;

const LOGO = [
  " __  __  _   ___   ____  ",
  "|  \\/  |(_) / _ \\ / ___| ",
  "| |\\/| || || | | |\\___ \\ ",
  "| |  | || || |_| | ___) |",
  "|_|  |_||_| \\___/ |____/ ",
];

const ABOUT_TEXT =
  "hey, I'm eroga.\n" +
  "I study cybersecurity and spend most of my time messing around\n" +
  "with computers — Linux, privacy stuff, writing scripts, that kind of thing.\n\n" +
  "made MiOS for a Hack Club jam: a fake OS felt more interesting\n" +
  "than a normal portfolio page.";

const SKILLS_TEXT =
  "Python ▓▓▓▓▓▓▓░░░\n" +
  "Linux  ▓▓▓▓▓▓░░░░\n" +
  "Crypto ▓▓▓▓▓░░░░░\n" +
  "Web    ▓▓▓▓░░░░░░\n" +
  "(the web bar went down while making this)";

function termPrint(html) {
  const line = document.createElement("div");
  line.className = "terminal-line";
  line.innerHTML = html;
  terminalOutput.appendChild(line);
  terminalBody.scrollTop = terminalBody.scrollHeight;
}

/* ---------- fake file system ---------- */
function buildFileSystem() {
  const file = (content) => ({ type: "file", content });
  const dir = (children) => ({ type: "dir", children });
  const projectText = (p) =>
    `# ${p.name}\n${p.desc}\n\ntags: ${p.tags.join(", ")}\nlink: ${p.link || "coming soon"}`;

  return dir({
    "about.txt": file(ABOUT_TEXT),
    "skills.txt": file(SKILLS_TEXT),
    "contact.txt": file(CONTACT_LINKS.map((link) => `${link.label}: ${link.url}`).join("\n")),
    projects: dir(Object.fromEntries(PROJECTS.map((p) => [p.slug + ".md", file(projectText(p))]))),
    notes: dir(
      Object.fromEntries(
        currentNotes().map((note, i) => [`note-${i + 1}.txt`, file(note.text.trim() || "(empty note)")])
      )
    ),
  });
}

function resolvePath(path) {
  const parts = /^[~/]/.test(path) ? [] : cwd.slice();
  path
    .replace(/^~/, "")
    .split("/")
    .forEach((segment) => {
      if (!segment || segment === ".") return;
      if (segment === "..") parts.pop();
      else parts.push(segment);
    });
  return parts;
}

function getNode(parts) {
  let node = buildFileSystem();
  for (const part of parts) {
    if (node.type !== "dir" || !node.children[part]) return null;
    node = node.children[part];
  }
  return node;
}

const pathLabel = (parts) => "~" + parts.map((part) => "/" + part).join("");
const promptText = () => `eroga@MiOS:${pathLabel(cwd)}$`;

function updatePrompt() {
  $("#terminalPrompt").textContent = promptText();
  $("#terminal-title").textContent = "eroga@MiOS: " + pathLabel(cwd);
}

/* ---------- helpers for commands ---------- */
function vigenere(text, key, decrypt) {
  const cleanKey = key.toLowerCase().replace(/[^a-z]/g, "");
  if (!cleanKey) return null;
  let k = 0;
  return text.replace(/[a-z]/gi, (char) => {
    const base = char <= "Z" ? 65 : 97;
    const shift = (cleanKey.charCodeAt(k++ % cleanKey.length) - 97) * (decrypt ? -1 : 1);
    return String.fromCharCode(((char.charCodeAt(0) - base + shift + 26) % 26) + base);
  });
}

function browserName() {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "Edge";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua)) return "Safari";
  return "a browser";
}

function formatUptime() {
  const seconds = Math.floor(performance.now() / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes === 0) return `${seconds} secs`;
  return `${minutes} min${minutes === 1 ? "" : "s"}`;
}

/* ---------- commands ---------- */
const COMMANDS = {
  help: {
    usage: "help",
    desc: "this list",
    run: () => {
      const rows = Object.values(COMMANDS)
        .filter((command) => !command.hidden)
        .map((command) => {
          const [name, ...rest] = command.usage.split(" ");
          const usage = accent(name) + escapeHtml(rest.length ? " " + rest.join(" ") : "");
          const padding = " ".repeat(Math.max(1, 31 - command.usage.length));
          return "  " + usage + padding + muted(command.desc);
        });
      return "Available commands:\n" + rows.join("\n") + "\n\n" + muted("Tab autocompletes · ↑/↓ history · Ctrl+L clears");
    },
  },
  about: {
    usage: "about",
    desc: "who I am",
    run: () =>
      "eroga. cybersecurity student, computer nerd.\n" +
      "made MiOS for the Hack Club webOS jam.\n" +
      `more info: ${accent("open about")} or ${accent("cat about.txt")}`,
  },
  whoami: {
    usage: "whoami",
    desc: "short version",
    run: () => "eroga — probably should be sleeping",
  },
  projects: {
    usage: "projects",
    desc: "my projects",
    run: () =>
      "Projects:\n" +
      PROJECTS.map((p) => `  ${accent(escapeHtml(p.name))} — ${escapeHtml(p.desc)}`).join("\n") +
      `\n\nOpen in a window with ${accent("open projects")}, or ${accent("ls projects")}.`,
  },
  skills: {
    usage: "skills",
    desc: "my skills",
    run: () => SKILLS_TEXT,
  },
  contact: {
    usage: "contact",
    desc: "where to find me",
    run: () =>
      CONTACT_LINKS.map(
        (link) =>
          `  ${link.label.padEnd(10)} <a class="term-link" href="${link.url}" target="_blank" rel="noopener">${link.url}</a>`
      ).join("\n"),
  },
  neofetch: {
    usage: "neofetch",
    desc: "system info",
    run: () => {
      const noteCount = $$(".sticky-note:not(.is-removing)").length;
      const info = [
        accent("eroga") + "@" + accent("MiOS"),
        "----------",
        `${accent("OS")}: MiOS 2.0 (web)`,
        `${accent("Host")}: ${browserName()}`,
        `${accent("Shell")}: mios-sh`,
        `${accent("WM")}: MiOS window manager`,
        `${accent("Uptime")}: ${formatUptime()}`,
        `${accent("Apps")}: ${LAUNCHERS.length}`,
        `${accent("Wallpaper")}: ${currentWallpaper()}`,
        `${accent("Notes")}: ${noteCount}`,
        `${accent("Built with")}: HTML + CSS + JS ❤️`,
      ];
      if (isSmallScreen()) return LOGO.map(accent).join("\n") + "\n\n" + info.join("\n");
      const rows = Math.max(LOGO.length, info.length);
      const lines = [];
      for (let i = 0; i < rows; i++) {
        lines.push(accent((LOGO[i] || "").padEnd(28)) + (info[i] || ""));
      }
      return lines.join("\n");
    },
  },
  ls: {
    usage: "ls [dir]",
    desc: "list files",
    run: (args) => {
      const parts = resolvePath(args[0] || ".");
      const node = getNode(parts);
      if (!node) return warn(`ls: ${escapeHtml(args[0])}: No such file or directory`);
      if (node.type === "file") return escapeHtml(parts[parts.length - 1]);
      const names = Object.keys(node.children);
      if (!names.length) return muted("(empty)");
      return names
        .map((name) =>
          node.children[name].type === "dir" ? `<span class="term-dir">${escapeHtml(name)}/</span>` : escapeHtml(name)
        )
        .join("  ");
    },
  },
  cd: {
    usage: "cd <dir>",
    desc: "change directory",
    run: (args) => {
      const parts = resolvePath(args[0] || "~");
      const node = getNode(parts);
      if (!node) return warn(`cd: ${escapeHtml(args[0])}: No such directory`);
      if (node.type !== "dir") return warn(`cd: ${escapeHtml(args[0])}: Not a directory`);
      cwd = parts;
      updatePrompt();
      return "";
    },
  },
  pwd: {
    usage: "pwd",
    desc: "current directory",
    run: () => "/home/eroga" + cwd.map((part) => "/" + escapeHtml(part)).join(""),
  },
  cat: {
    usage: "cat <file>",
    desc: "show a file",
    run: (args) => {
      if (!args[0]) return warn("usage: cat <file>") + " — try " + accent("cat about.txt");
      const node = getNode(resolvePath(args[0]));
      if (!node) return warn(`cat: ${escapeHtml(args[0])}: No such file or directory`);
      if (node.type === "dir") return warn(`cat: ${escapeHtml(args[0])}: Is a directory`);
      return escapeHtml(node.content);
    },
  },
  open: {
    usage: "open <app>",
    desc: "open a window",
    run: (args) => {
      const app = (args[0] || "").toLowerCase();
      if (app === "notes" || app === "note") {
        createStickyNote();
        return accent("New note created on the desktop.");
      }
      if (APPS[app]) {
        openWindow(app);
        return `Opening ${APPS[app].title}…`;
      }
      return warn("Unknown app.") + " Try: " + [...WINDOW_IDS, "notes"].join(", ");
    },
  },
  wallpaper: {
    usage: "wallpaper [name]",
    desc: "change the wallpaper",
    run: (args) => {
      if (!args[0]) {
        return (
          `Current: ${accent(currentWallpaper())}\n` +
          `Available: ${WALLPAPERS.join(", ")}\n` +
          `Usage: ${accent("wallpaper ocean")}`
        );
      }
      const name = args[0].toLowerCase();
      if (setWallpaper(name)) return `Wallpaper set to ${accent(name)}.`;
      return warn(`wallpaper: unknown wallpaper "${escapeHtml(args[0])}".`) + " Try: " + WALLPAPERS.join(", ");
    },
  },
  vigenere: {
    usage: "vigenere enc|dec|crack …",
    desc: "Vigenère cipher",
    run: (args) => {
      const mode = (args[0] || "").toLowerCase();
      const decrypt = mode === "dec" || mode === "decrypt";
      const encrypt = mode === "enc" || mode === "encrypt";
      if (mode === "example") {
        return (
          `Key: ${accent(VIGENERE_EXAMPLE_KEY)} (${VIGENERE_LANGUAGES[attackLanguage].name} text)\n${exampleCiphertext()}\n\n` +
          muted("Try: vigenere crack &lt;paste it here&gt;")
        );
      }
      if (mode === "crack") {
        const ciphertext = args.slice(1).join(" ");
        const codes = toCodes(ciphertext);
        if (codes.length < 20) return warn("vigenere crack: give me at least 20 letters of ciphertext.");
        const { best } = statisticalAttack(codes, 20);
        return (
          `Most likely key: ${accent(escapeHtml(best.key))} (length ${best.key.length}, ` +
          `${VIGENERE_LANGUAGES[attackLanguage].name} frequencies)\n` +
          escapeHtml(decryptPreview(ciphertext, best.key)) +
          "\n" +
          muted("Full ranking, brute force and benchmark: open vigenere")
        );
      }
      if ((!encrypt && !decrypt) || args.length < 3) {
        return (
          "usage:\n" +
          "  vigenere enc &lt;key&gt; &lt;text&gt;\n" +
          "  vigenere dec &lt;key&gt; &lt;text&gt;\n" +
          "  vigenere crack &lt;ciphertext&gt;   statistical attack\n" +
          "  vigenere example              a ciphertext to practise on\n" +
          `example: ${accent("vigenere enc lemon attack at dawn")}\n` +
          muted("(the full app: open vigenere)")
        );
      }
      const result = vigenere(args.slice(2).join(" "), args[1], decrypt);
      if (result === null) return warn("vigenere: the key needs at least one letter");
      return accent(escapeHtml(result));
    },
  },
  note: {
    usage: "note",
    desc: "create a sticky note",
    run: () => {
      createStickyNote();
      return accent("New note created on the desktop.");
    },
  },
  history: {
    usage: "history",
    desc: "previous commands",
    run: () =>
      commandHistory.map((cmd, i) => muted(String(i + 1).padStart(4)) + "  " + escapeHtml(cmd)).join("\n"),
  },
  date: {
    usage: "date",
    desc: "current date and time",
    run: () => new Date().toLocaleString("en-GB"),
  },
  echo: {
    usage: "echo <text>",
    desc: "repeat text",
    run: (args) => escapeHtml(args.join(" ")),
  },
  clear: {
    usage: "clear",
    desc: "clear the screen",
    run: () => {
      terminalOutput.innerHTML = "";
      return "";
    },
  },
  reboot: {
    usage: "reboot",
    desc: "restart MiOS",
    run: () => {
      try {
        sessionStorage.removeItem("mios.booted");
      } catch (e) {}
      setTimeout(() => location.reload(), 400);
      return muted("Rebooting…");
    },
  },
  sudo: {
    hidden: true,
    run: () => warn("Nice try 😏 — no root here."),
  },
};

function printPromptLine(text) {
  termPrint(`<span class="term-prompt-echo">${escapeHtml(promptText())}</span> ${escapeHtml(text)}`);
}

function runCommand(raw) {
  const input = raw.trim();
  printPromptLine(input);
  if (!input) return;

  commandHistory.push(input);
  historyIndex = commandHistory.length;

  const [name, ...args] = input.split(/\s+/);
  const command = COMMANDS[name.toLowerCase()];
  if (!command) {
    termPrint(warn(`command not found: ${escapeHtml(name)}`) + " — type " + accent("help"));
    return;
  }
  const output = command.run(args);
  if (output) termPrint(output);
}

/* ---------- Tab completion ---------- */
function completionOptions(words) {
  if (words.length === 1) return Object.keys(COMMANDS).filter((name) => !COMMANDS[name].hidden);
  const command = words[0].toLowerCase();
  if (command === "open") return [...WINDOW_IDS, "notes"];
  if (command === "wallpaper") return WALLPAPERS;
  if (command === "vigenere" && words.length === 2) return ["enc", "dec", "crack", "example"];
  if (command === "ls" || command === "cd" || command === "cat") {
    return pathOptions(words[words.length - 1], command === "cd");
  }
  return [];
}

function pathOptions(word, dirsOnly) {
  const dirPart = word.slice(0, word.lastIndexOf("/") + 1);
  const dir = getNode(resolvePath(dirPart || "."));
  if (!dir || dir.type !== "dir") return [];
  return Object.entries(dir.children)
    .filter(([, node]) => !dirsOnly || node.type === "dir")
    .map(([name, node]) => dirPart + name + (node.type === "dir" ? "/" : ""));
}

function commonPrefix(list) {
  return list.reduce((prefix, item) => {
    let i = 0;
    while (i < prefix.length && prefix[i] === item[i]) i++;
    return prefix.slice(0, i);
  });
}

function autocomplete() {
  const value = terminalInput.value;
  const words = value.split(" ");
  const current = words[words.length - 1];
  const matches = completionOptions(words).filter((option) => option.startsWith(current));
  if (!matches.length) return;

  if (matches.length === 1) {
    words[words.length - 1] = matches[0] + (matches[0].endsWith("/") ? "" : " ");
    terminalInput.value = words.join(" ");
    return;
  }
  const prefix = commonPrefix(matches);
  if (prefix.length > current.length) {
    words[words.length - 1] = prefix;
    terminalInput.value = words.join(" ");
  } else {
    printPromptLine(value);
    termPrint(matches.map(escapeHtml).join("  "));
  }
}

terminalInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    runCommand(terminalInput.value);
    terminalInput.value = "";
  } else if (e.key === "Tab") {
    e.preventDefault();
    autocomplete();
  } else if (e.key === "l" && e.ctrlKey) {
    e.preventDefault();
    terminalOutput.innerHTML = "";
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (historyIndex > 0) {
      historyIndex--;
      terminalInput.value = commandHistory[historyIndex];
    }
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    if (historyIndex < commandHistory.length - 1) {
      historyIndex++;
      terminalInput.value = commandHistory[historyIndex];
    } else {
      historyIndex = commandHistory.length;
      terminalInput.value = "";
    }
  }
});

/* clicking anywhere in the terminal focuses the input, unless you're selecting text */
terminalBody.addEventListener("click", () => {
  if (!window.getSelection().toString()) terminalInput.focus({ preventScroll: true });
});

termPrint(accent(LOGO.join("\n")));
termPrint(`Welcome to MiOS. Type ${accent("help")} to get started.`);
termPrint(muted("Tip: Tab autocompletes, ↑ / ↓ repeat commands."));

/* ===========================================================
   13. STICKY NOTES (custom feature)
   Editable, draggable, resizable notes saved in localStorage.
   =========================================================== */
const NOTE_COLORS = [
  { bg: "#fff59d", header: "#f6dd5c", text: "#3a3000" },
  { bg: "#c8f0c8", header: "#9bd99b", text: "#0a3000" },
  { bg: "#cfe0ff", header: "#a3c2f5", text: "#001a40" },
  { bg: "#ffd3d3", header: "#f5a8a8", text: "#400000" },
];
let noteCount = 0;

function noteData(note) {
  return {
    id: note.id,
    color: Number(note.dataset.color),
    text: $("textarea", note).value,
    left: parseFloat(note.style.left),
    top: parseFloat(note.style.top),
    width: parseFloat(note.style.width),
    height: parseFloat(note.style.height),
  };
}

function currentNotes() {
  return $$(".sticky-note:not(.is-removing)").map(noteData);
}

function saveNotes() {
  store.set("notes", currentNotes());
}
const saveNotesSoon = debounce(saveNotes, 300);

function createStickyNote(data) {
  const restoring = Boolean(data);
  data = data || {};
  const colorIndex = Number.isInteger(data.color) ? data.color % NOTE_COLORS.length : noteCount % NOTE_COLORS.length;
  const color = NOTE_COLORS[colorIndex];
  noteCount++;

  const note = document.createElement("section");
  note.className = "window sticky-note is-closed";
  note.id = data.id || "note-" + Date.now().toString(36) + "-" + noteCount;
  note.dataset.color = colorIndex;
  note.setAttribute("role", "dialog");
  note.setAttribute("aria-label", "Sticky note");
  note.style.setProperty("--note-bg", color.bg);
  note.style.setProperty("--note-header", color.header);
  note.style.setProperty("--note-text", color.text);
  note.innerHTML =
    '<header class="window-header"><h2 class="window-title">Note</h2></header>' +
    '<textarea class="sticky-textarea" placeholder="Write here…" aria-label="Note text"></textarea>';

  const textarea = $("textarea", note);
  textarea.value = data.text || "";
  textarea.addEventListener("input", saveNotesSoon);
  desktop.appendChild(note);

  setupWindow(note, { controls: ["close"], minWidth: 170, minHeight: 140, onClose: removeStickyNote });

  const usableHeight = window.innerHeight - topbarHeight() - dockSpace();
  setGeometry(note, {
    width: data.width || 220,
    height: data.height || 200,
    left: Number.isFinite(data.left) ? data.left : 120 + Math.random() * Math.max(60, window.innerWidth - 420),
    top: Number.isFinite(data.top)
      ? data.top
      : topbarHeight() + 30 + Math.random() * Math.max(40, usableHeight - 280),
  });

  void note.offsetWidth; // flush styles so the opening animation plays
  note.classList.remove("is-closed");
  focusWindow(note);

  if (!restoring) {
    textarea.focus({ preventScroll: true });
    saveNotes();
  }
  return note;
}

function removeStickyNote(note) {
  note.classList.add("is-closed", "is-removing");
  note.inert = true;
  saveNotes();
  hideWindow(note);
  setTimeout(() => {
    note.remove();
    updateDock();
  }, 220);
}

const savedNotes = store.get("notes", []);
if (Array.isArray(savedNotes)) savedNotes.forEach((note) => createStickyNote(note));

/* ===========================================================
   14. BOOT SCREEN & STARTUP
   The boot screen plays once per browser session (or after `reboot`).
   =========================================================== */
function boot(onReady) {
  const screen = $("#boot");
  let alreadyBooted = false;
  try {
    alreadyBooted = sessionStorage.getItem("mios.booted") === "1";
  } catch (e) {}
  if (alreadyBooted) {
    screen.remove();
    onReady();
    return;
  }

  let finished = false;
  const timer = setTimeout(finish, reducedMotion() ? 800 : 3200);

  /* a key press or click skips the wait */
  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    document.removeEventListener("keydown", finish);
    screen.removeEventListener("pointerdown", finish);
    try {
      sessionStorage.setItem("mios.booted", "1");
    } catch (e) {}
    screen.classList.add("is-done");
    setTimeout(() => screen.remove(), 500);
    onReady();
  }

  document.addEventListener("keydown", finish);
  screen.addEventListener("pointerdown", finish);
}

boot(() => openWindow("welcome"));
