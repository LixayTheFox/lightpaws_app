const links = [
  {
    id: "lightpaws",
    label: "LightPaws",
    url: "https://light-paws.com",
    tag: "Klan",
    recommended: true
  },
  {
    id: "bungie",
    label: "Bungie",
    url: "https://www.bungie.net/7/en/Destiny",
    tag: "Oficjalne"
  },
  {
    id: "dim",
    label: "DIM",
    url: "https://app.destinyitemmanager.com",
    tag: "Ekwipunek",
    recommended: true
  },
  {
    id: "lightgg",
    label: "light.gg",
    url: "https://www.light.gg",
    tag: "Loot",
    recommended: true
  },
  {
    id: "braytech",
    label: "Braytech",
    url: "https://bray.tech",
    tag: "Postep"
  },
  {
    id: "foundry",
    label: "D2 Foundry",
    url: "https://d2foundry.gg",
    tag: "Bronie"
  },
  {
    id: "recipes",
    label: "Destiny Recipes",
    url: "https://destinyrecipes.com",
    tag: "Checklisty"
  },
  {
    id: "today",
    label: "Today in Destiny",
    url: "https://todayindestiny.com",
    tag: "Rotacje"
  },
  {
    id: "raid",
    label: "Raid Report",
    url: "https://raid.report",
    tag: "Raids"
  },
  {
    id: "trials",
    label: "Trials Report",
    url: "https://trials.report",
    tag: "Trials"
  },
  {
    id: "checkpoint",
    label: "D2 Checkpoint",
    url: "https://d2checkpoint.com",
    tag: "Checkpointy"
  }
];

const elements = {
  linkList: document.getElementById("linkList"),
  webFrame: document.getElementById("webFrame"),
  siteView: document.getElementById("siteView"),
  siteTag: document.getElementById("siteTag"),
  siteTitle: document.getElementById("siteTitle"),
  siteUrl: document.getElementById("siteUrl"),
  statusDot: document.getElementById("statusDot"),
  statusText: document.getElementById("statusText"),
  emptyState: document.getElementById("emptyState"),
  emptyMessage: document.getElementById("emptyMessage"),
  retryButton: document.getElementById("retryButton"),
  backButton: document.getElementById("backButton"),
  forwardButton: document.getElementById("forwardButton"),
  reloadButton: document.getElementById("reloadButton"),
  externalButton: document.getElementById("externalButton")
};

let activeLink = links[0];

function fitWebView() {
  const width = elements.webFrame.clientWidth;
  const height = elements.webFrame.clientHeight;

  if (!width || !height) {
    return;
  }

  elements.siteView.style.width = `${width}px`;
  elements.siteView.style.height = `${height}px`;
}

function faviconFor(url) {
  return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(url)}`;
}

function initialsFor(label) {
  return label
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function createNavButton(link) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "nav-link";
  button.dataset.linkId = link.id;
  button.classList.toggle("nav-link-recommended", Boolean(link.recommended));

  const logo = document.createElement("span");
  logo.className = "nav-logo";

  const image = document.createElement("img");
  image.src = link.icon || faviconFor(link.url);
  image.alt = "";
  image.decoding = "async";
  image.referrerPolicy = "no-referrer";
  image.addEventListener("error", () => {
    logo.classList.add("logo-fallback");
    image.hidden = true;
  });

  const fallback = document.createElement("span");
  fallback.textContent = initialsFor(link.label);

  logo.append(image, fallback);

  const copy = document.createElement("span");
  copy.className = "nav-copy";

  const title = document.createElement("strong");
  title.textContent = link.label;

  const meta = document.createElement("span");
  meta.className = "nav-meta";

  const tag = document.createElement("span");
  tag.className = "nav-tag";
  tag.textContent = link.tag;
  meta.append(tag);

  if (link.recommended) {
    const badge = document.createElement("span");
    badge.className = "clan-badge";
    badge.textContent = "Klan poleca";
    meta.append(badge);
  }

  copy.append(title, meta);
  button.replaceChildren(logo, copy);
  button.addEventListener("click", () => selectLink(link.id));

  return button;
}

function createNavSeparator() {
  const separator = document.createElement("div");
  separator.className = "nav-separator";
  separator.setAttribute("role", "separator");
  separator.innerHTML = "<span>Pozostale strony</span>";
  return separator;
}

function renderLinks() {
  elements.linkList.innerHTML = "";

  const recommendedLinks = links.filter((link) => link.recommended);
  const regularLinks = links.filter((link) => !link.recommended);

  for (const link of recommendedLinks) {
    elements.linkList.appendChild(createNavButton(link));
  }

  if (regularLinks.length > 0) {
    elements.linkList.appendChild(createNavSeparator());
  }

  for (const link of regularLinks) {
    elements.linkList.appendChild(createNavButton(link));
  }

  updateActiveLink();
}

function updateActiveLink() {
  document.querySelectorAll(".nav-link").forEach((button) => {
    const isActive = button.dataset.linkId === activeLink.id;
    const wasActive = button.classList.contains("active");

    button.classList.toggle("active", isActive);

    if (isActive && !wasActive) {
      button.classList.remove("nav-link-selected");
      void button.offsetWidth;
      button.classList.add("nav-link-selected");
    }
  });
}

function setStatus(kind, text) {
  elements.statusDot.dataset.status = kind;
  elements.statusText.textContent = text;
}

function selectLink(linkId) {
  const nextLink = links.find((link) => link.id === linkId);
  if (!nextLink) {
    return;
  }

  activeLink = nextLink;
  elements.siteTitle.textContent = activeLink.label;
  elements.siteUrl.textContent = activeLink.url;
  elements.siteTag.textContent = activeLink.tag;
  elements.emptyState.hidden = true;
  updateActiveLink();
  setStatus("loading", "Ladowanie...");
  elements.siteView.src = activeLink.url;
}

function currentUrl() {
  return elements.siteView.getURL ? elements.siteView.getURL() : activeLink.url;
}

elements.backButton.addEventListener("click", () => {
  if (elements.siteView.canGoBack()) {
    elements.siteView.goBack();
  }
});

elements.forwardButton.addEventListener("click", () => {
  if (elements.siteView.canGoForward()) {
    elements.siteView.goForward();
  }
});

elements.reloadButton.addEventListener("click", () => {
  elements.emptyState.hidden = true;
  elements.siteView.reload();
});

elements.externalButton.addEventListener("click", () => {
  window.lightPaws.openExternal(currentUrl());
});

elements.retryButton.addEventListener("click", () => {
  elements.emptyState.hidden = true;
  setStatus("loading", "Ladowanie...");
  elements.siteView.reload();
});

elements.siteView.addEventListener("did-start-loading", () => {
  fitWebView();
  elements.emptyState.hidden = true;
  setStatus("loading", "Ladowanie...");
});

elements.siteView.addEventListener("did-stop-loading", () => {
  fitWebView();
  setStatus("ready", "Gotowe");
});

elements.siteView.addEventListener("did-navigate", (event) => {
  elements.siteUrl.textContent = event.url;
});

elements.siteView.addEventListener("did-navigate-in-page", (event) => {
  elements.siteUrl.textContent = event.url;
});

elements.siteView.addEventListener("did-fail-load", (event) => {
  if (!event.isMainFrame || event.errorCode === -3) {
    return;
  }

  setStatus("error", "Problem z ladowaniem");
  elements.emptyMessage.textContent = `${activeLink.label}: ${event.errorDescription || "Nie mozna zaladowac strony."}`;
  elements.emptyState.hidden = false;
});

elements.siteView.addEventListener("new-window", (event) => {
  event.preventDefault();
  window.lightPaws.openExternal(event.url);
});

const webFrameObserver = new ResizeObserver(fitWebView);
webFrameObserver.observe(elements.webFrame);
window.addEventListener("resize", fitWebView);
elements.linkList.addEventListener("animationend", (event) => {
  event.target.classList.remove("nav-link-selected");
});

renderLinks();
selectLink(activeLink.id);
requestAnimationFrame(fitWebView);
