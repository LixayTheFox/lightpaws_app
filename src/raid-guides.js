(() => {
  const symbols = [
    { id: "circle", label: "Kolo", short: "C" },
    { id: "triangle", label: "Trojkat", short: "T" },
    { id: "square", label: "Kwadrat", short: "S" }
  ];
  const symbolIds = symbols.map((symbol) => symbol.id);
  const positions = [
    { id: "left", label: "Lewy" },
    { id: "middle", label: "Srodek" },
    { id: "right", label: "Prawy" }
  ];
  const solidShapes = [
    { id: "sphere", label: "Kula", symbols: ["circle", "circle"] },
    { id: "pyramid", label: "Piramida", symbols: ["triangle", "triangle"] },
    { id: "cube", label: "Szescian", symbols: ["square", "square"] },
    { id: "cone", label: "Stozek", symbols: ["circle", "triangle"] },
    { id: "cylinder", label: "Walec", symbols: ["circle", "square"] },
    { id: "prism", label: "Pryzmat", symbols: ["triangle", "square"] }
  ];

  const state = {
    guideVisible: false,
    mode: "inside",
    inside: [
      { own: "circle", held: ["circle", "circle"] },
      { own: "triangle", held: ["triangle", "triangle"] },
      { own: "square", held: ["square", "square"] }
    ],
    dissection: [
      { own: "circle", solid: "sphere" },
      { own: "triangle", solid: "pyramid" },
      { own: "square", solid: "cube" }
    ]
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function symbolById(id) {
    return symbols.find((symbol) => symbol.id === id) || symbols[0];
  }

  function solidById(id) {
    return solidShapes.find((shape) => shape.id === id) || solidShapes[0];
  }

  function sortedPair(pair) {
    return [...pair].sort().join("|");
  }

  function solidForSymbols(pair) {
    const key = sortedPair(pair);
    return solidShapes.find((shape) => sortedPair(shape.symbols) === key) || solidShapes[0];
  }

  function symbolOptions(selected) {
    return symbols
      .map((symbol) => {
        const isSelected = symbol.id === selected ? " selected" : "";
        return `<option value="${symbol.id}"${isSelected}>${symbol.label} (${symbol.short})</option>`;
      })
      .join("");
  }

  function solidOptions(selected) {
    return solidShapes
      .map((shape) => {
        const isSelected = shape.id === selected ? " selected" : "";
        const compact = shape.symbols.map((symbol) => symbolById(symbol).short).join("+");
        return `<option value="${shape.id}"${isSelected}>${shape.label} (${compact})</option>`;
      })
      .join("");
  }

  function symbolIcon(id) {
    const symbol = symbolById(id);
    return `<span class="d2-symbol d2-symbol-${symbol.id}" title="${symbol.label}" aria-label="${symbol.label}"></span>`;
  }

  function symbolChip(id) {
    const symbol = symbolById(id);
    return `<span class="symbol-chip">${symbolIcon(id)}<span>${symbol.label}</span></span>`;
  }

  function solidChip(id) {
    const shape = solidById(id);
    return `
      <span class="solid-chip">
        <span class="solid-icons">${shape.symbols.map((symbol) => symbolIcon(symbol)).join("")}</span>
        <span>${shape.label}</span>
      </span>
    `;
  }

  function blankCounts() {
    return Object.fromEntries(symbolIds.map((symbol) => [symbol, 0]));
  }

  function countSymbols(items) {
    const counts = blankCounts();
    for (const item of items) {
      counts[item] += 1;
    }
    return counts;
  }

  function countsDone(current, target) {
    return current.every((counts, index) => symbolIds.every((symbol) => counts[symbol] === target[index][symbol]));
  }

  function surplusSymbols(current, target, index) {
    return symbolIds.filter((symbol) => current[index][symbol] > target[index][symbol]);
  }

  function deficitSymbols(current, target, index) {
    return symbolIds.filter((symbol) => current[index][symbol] < target[index][symbol]);
  }

  function ownSymbolsAreUnique(entries) {
    const counts = countSymbols(entries.map((entry) => entry.own));
    return symbolIds.every((symbol) => counts[symbol] === 1);
  }

  function totalCountsAreValid(entries, reader) {
    const total = blankCounts();
    for (const entry of entries) {
      for (const symbol of reader(entry)) {
        total[symbol] += 1;
      }
    }
    return symbolIds.every((symbol) => total[symbol] === 2);
  }

  function targetPairForOwn(own) {
    return symbolIds.filter((symbol) => symbol !== own);
  }

  function status(kind, text) {
    const dot = byId("statusDot");
    const statusText = byId("statusText");
    if (dot) {
      dot.dataset.status = kind;
    }
    if (statusText) {
      statusText.textContent = text;
    }
  }

  function injectStylesheet() {
    if (document.querySelector('link[href="./raid-guides.css"]')) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "./raid-guides.css";
    document.head.appendChild(link);
  }

  function createGuidePanel() {
    const webFrame = byId("webFrame");
    if (!webFrame || byId("raidGuidePanel")) {
      return;
    }

    const panel = document.createElement("section");
    panel.id = "raidGuidePanel";
    panel.className = "raid-guide-panel";
    panel.hidden = true;
    panel.innerHTML = `
      <div class="raid-guide-shell">
        <aside class="raid-guide-controls">
          <div class="raid-guide-kicker">Raid tools</div>
          <h3>Salvation's Edge</h3>
          <p>Verity: szybkie callouty dla drugiego wymiaru i dissection.</p>

          <label class="tool-field">
            <span>Raid / Dungeon</span>
            <select id="raidActivitySelect">
              <option value="salvations-edge">Salvation's Edge</option>
            </select>
          </label>

          <label class="tool-field">
            <span>Encounter</span>
            <select id="raidEncounterSelect">
              <option value="verity">Verity</option>
            </select>
          </label>

          <div class="guide-mode-switch" role="tablist" aria-label="Tryb Verity">
            <button id="insideModeButton" class="active" type="button">Drugi wymiar</button>
            <button id="dissectionModeButton" type="button">Dissection</button>
          </div>

          <div class="guide-summary" id="guideSummary"></div>
        </aside>

        <section class="verity-workspace">
          <header class="verity-header">
            <div>
              <span class="verity-eyebrow" id="verityModeEyebrow">Verity / Drugi wymiar</span>
              <h3 id="verityModeTitle">Kto komu oddaje symbol</h3>
            </div>
            <button id="raidResetButton" type="button">Reset</button>
          </header>

          <div class="verity-visual" id="verityVisual"></div>

          <section class="verity-tool" id="insideTool">
            <div class="tool-grid" id="insideInputs"></div>
            <div class="tool-actions">
              <button id="insideCalculateButton" type="button">Policz ruchy</button>
            </div>
            <div class="tool-result" id="insideResult"></div>
          </section>

          <section class="verity-tool" id="dissectionTool" hidden>
            <div class="tool-grid" id="dissectionInputs"></div>
            <div class="tool-actions">
              <button id="dissectionCalculateButton" type="button">Policz dissection</button>
            </div>
            <div class="tool-result" id="dissectionResult"></div>
          </section>
        </section>
      </div>
    `;

    webFrame.appendChild(panel);
  }

  function createHubSwitcher() {
    const sidebar = document.querySelector(".sidebar");
    const brand = document.querySelector(".brand");
    const linkList = byId("linkList");

    if (!sidebar || !brand || !linkList || byId("hubModePanel")) {
      return;
    }

    brand.classList.add("brand-clickable");
    brand.setAttribute("role", "button");
    brand.setAttribute("tabindex", "0");
    brand.setAttribute("title", "Wybierz Websites albo Tools");
    brand.setAttribute("aria-controls", "hubModePanel");
    brand.setAttribute("aria-expanded", "false");

    const panel = document.createElement("section");
    panel.id = "hubModePanel";
    panel.className = "hub-mode-panel";
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML = `
      <div class="hub-mode-switch" role="tablist" aria-label="LightPaws hub">
        <button id="hubWebsitesButton" class="active" type="button">Websites</button>
        <button id="hubToolsButton" type="button">Tools</button>
      </div>
    `;
    brand.insertAdjacentElement("afterend", panel);

    const toolList = document.createElement("nav");
    toolList.id = "toolList";
    toolList.className = "tool-list";
    toolList.hidden = true;
    toolList.setAttribute("aria-label", "LightPaws tools");
    toolList.innerHTML = `
      <button id="raidGuidesToolButton" class="nav-link nav-link-recommended tool-link" type="button">
        <span class="nav-logo logo-fallback"><span>RG</span></span>
        <span class="nav-copy">
          <strong>Raid Guides</strong>
          <span class="nav-meta">
            <span class="nav-tag">Verity</span>
            <span class="clan-badge">Tool</span>
          </span>
        </span>
      </button>
    `;
    linkList.insertAdjacentElement("afterend", toolList);

    const setMenuOpen = (open) => {
      panel.classList.toggle("open", open);
      brand.classList.toggle("hub-menu-open", open);
      brand.setAttribute("aria-expanded", String(open));
      panel.setAttribute("aria-hidden", String(!open));
    };
    const togglePanel = () => setMenuOpen(!panel.classList.contains("open"));
    brand.addEventListener("click", togglePanel);
    brand.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        togglePanel();
      }
    });

    byId("hubWebsitesButton")?.addEventListener("click", () => {
      setHubMode("websites");
      setMenuOpen(false);
    });
    byId("hubToolsButton")?.addEventListener("click", () => {
      setHubMode("tools");
      setMenuOpen(false);
    });
    byId("raidGuidesToolButton")?.addEventListener("click", showGuide);
    setHubMode("websites");
  }

  function setHubMode(mode) {
    const sidebar = document.querySelector(".sidebar");
    const workspace = document.querySelector(".workspace");
    const linkList = byId("linkList");
    const toolList = byId("toolList");
    const websitesButton = byId("hubWebsitesButton");
    const toolsButton = byId("hubToolsButton");

    if (sidebar) {
      sidebar.dataset.hubMode = mode;
      sidebar.classList.remove("hub-list-switching");
      void sidebar.offsetWidth;
      sidebar.classList.add("hub-list-switching");
      window.setTimeout(() => sidebar.classList.remove("hub-list-switching"), 260);
    }
    if (workspace) {
      workspace.classList.remove("workspace-switching");
      void workspace.offsetWidth;
      workspace.classList.add("workspace-switching");
      window.setTimeout(() => workspace.classList.remove("workspace-switching"), 260);
    }
    if (linkList) {
      linkList.hidden = mode !== "websites";
    }
    if (toolList) {
      toolList.hidden = mode !== "tools";
    }
    if (websitesButton) {
      websitesButton.classList.toggle("active", mode === "websites");
    }
    if (toolsButton) {
      toolsButton.classList.toggle("active", mode === "tools");
    }

    if (mode === "websites") {
      hideGuide();
      return;
    }

    showGuide();
  }

  function toolbarForGuide(isGuide) {
    for (const id of ["backButton", "forwardButton", "reloadButton", "externalButton"]) {
      const button = byId(id);
      if (button) {
        button.disabled = isGuide;
      }
    }
  }

  function showGuide() {
    const panel = byId("raidGuidePanel");
    const siteView = byId("siteView");
    const calendarPanel = byId("calendarPanel");
    const emptyState = byId("emptyState");
    const toolButton = byId("raidGuidesToolButton");

    state.guideVisible = true;
    if (siteView) {
      siteView.hidden = true;
    }
    if (calendarPanel) {
      calendarPanel.hidden = true;
    }
    if (emptyState) {
      emptyState.hidden = true;
    }
    if (panel) {
      panel.hidden = false;
    }

    document.querySelectorAll(".link-list .nav-link").forEach((button) => {
      button.classList.remove("active");
    });
    document.querySelectorAll(".tool-list .nav-link").forEach((button) => {
      button.classList.toggle("active", button === toolButton);
    });

    const tag = byId("siteTag");
    const title = byId("siteTitle");
    const url = byId("siteUrl");
    if (tag) {
      tag.textContent = "Raid tool";
    }
    if (title) {
      title.textContent = "Salvation's Edge: Verity";
    }
    if (url) {
      url.textContent = state.mode === "inside" ? "Drugi wymiar" : "Dissection";
    }

    toolbarForGuide(true);
    status("ready", "Raid tools gotowe");
    updateVisual();
  }

  function hideGuide() {
    if (!state.guideVisible) {
      return;
    }

    state.guideVisible = false;
    const panel = byId("raidGuidePanel");
    if (panel) {
      panel.hidden = true;
    }
    byId("raidGuidesToolButton")?.classList.remove("active");
    toolbarForGuide(false);
  }

  function bindGlobalExit() {
    const linkList = byId("linkList");
    const calendarButton = byId("calendarButton");

    if (linkList) {
      linkList.addEventListener("click", (event) => {
        const clicked = event.target.closest(".nav-link");
        if (clicked) {
          hideGuide();
        }
      });
    }

    if (calendarButton) {
      calendarButton.addEventListener("click", hideGuide);
    }
  }

  function setMode(mode) {
    state.mode = mode;
    const insideTool = byId("insideTool");
    const dissectionTool = byId("dissectionTool");
    const insideButton = byId("insideModeButton");
    const dissectionButton = byId("dissectionModeButton");
    const eyebrow = byId("verityModeEyebrow");
    const title = byId("verityModeTitle");
    const url = byId("siteUrl");

    if (insideTool) {
      insideTool.hidden = mode !== "inside";
    }
    if (dissectionTool) {
      dissectionTool.hidden = mode !== "dissection";
    }
    if (insideButton) {
      insideButton.classList.toggle("active", mode === "inside");
    }
    if (dissectionButton) {
      dissectionButton.classList.toggle("active", mode === "dissection");
    }
    if (eyebrow) {
      eyebrow.textContent = mode === "inside" ? "Verity / Drugi wymiar" : "Verity / Dissection";
    }
    if (title) {
      title.textContent = mode === "inside" ? "Kto komu oddaje symbol" : "Jak ustawic klucze";
    }
    if (url && state.guideVisible) {
      url.textContent = mode === "inside" ? "Drugi wymiar" : "Dissection";
    }

    updateGuideSummary();
    updateVisual();
  }

  function updateGuideSummary() {
    const summary = byId("guideSummary");
    if (!summary) {
      return;
    }

    if (state.mode === "inside") {
      summary.innerHTML = `
        <strong>Cel:</strong>
        <span>Solo ma sciane/projekcje z dwoma symbolami innymi niz symbol statuy, a na koncu podnosi oba do wyjscia.</span>
      `;
      return;
    }

    summary.innerHTML = `
      <strong>Cel:</strong>
      <span>Dissection dopasowuje bryly 3D do symboli potrzebnych solo: Cylinder S+C, Cone C+T, Prism S+T.</span>
    `;
  }

  function renderInsideInputs() {
    const container = byId("insideInputs");
    if (!container) {
      return;
    }

    container.innerHTML = positions
      .map((position, index) => {
        const player = state.inside[index];
        return `
          <article class="tool-card">
            <header>
              <span>${position.label}</span>
              ${symbolChip(player.own)}
            </header>
            <label class="tool-field">
              <span>Symbol statuy</span>
              <select data-inside-own="${index}">${symbolOptions(player.own)}</select>
            </label>
            <div class="held-fields">
              <label class="tool-field">
                <span>Masz 1</span>
                <select data-inside-held="${index}:0">${symbolOptions(player.held[0])}</select>
              </label>
              <label class="tool-field">
                <span>Masz 2</span>
                <select data-inside-held="${index}:1">${symbolOptions(player.held[1])}</select>
              </label>
            </div>
          </article>
        `;
      })
      .join("");

    container.querySelectorAll("[data-inside-own]").forEach((select) => {
      select.addEventListener("change", () => {
        state.inside[Number(select.dataset.insideOwn)].own = select.value;
        renderInsideInputs();
        calculateInside();
        updateVisual();
      });
    });

    container.querySelectorAll("[data-inside-held]").forEach((select) => {
      select.addEventListener("change", () => {
        const [playerIndex, heldIndex] = select.dataset.insideHeld.split(":").map(Number);
        state.inside[playerIndex].held[heldIndex] = select.value;
        calculateInside();
        updateVisual();
      });
    });
  }

  function renderDissectionInputs() {
    const container = byId("dissectionInputs");
    if (!container) {
      return;
    }

    container.innerHTML = positions
      .map((position, index) => {
        const statue = state.dissection[index];
        return `
          <article class="tool-card">
            <header>
              <span>${position.label}</span>
              ${solidChip(statue.solid)}
            </header>
            <label class="tool-field">
              <span>Symbol statuy</span>
              <select data-dissection-own="${index}">${symbolOptions(statue.own)}</select>
            </label>
            <label class="tool-field">
              <span>Aktualna bryla</span>
              <select data-dissection-solid="${index}">${solidOptions(statue.solid)}</select>
            </label>
          </article>
        `;
      })
      .join("");

    container.querySelectorAll("[data-dissection-own]").forEach((select) => {
      select.addEventListener("change", () => {
        state.dissection[Number(select.dataset.dissectionOwn)].own = select.value;
        renderDissectionInputs();
        calculateDissection();
        updateVisual();
      });
    });

    container.querySelectorAll("[data-dissection-solid]").forEach((select) => {
      select.addEventListener("change", () => {
        state.dissection[Number(select.dataset.dissectionSolid)].solid = select.value;
        renderDissectionInputs();
        calculateDissection();
        updateVisual();
      });
    });
  }

  function insideTargetCounts() {
    return state.inside.map((player) => countSymbols(targetPairForOwn(player.own)));
  }

  function calculateInside() {
    const result = byId("insideResult");
    if (!result) {
      return;
    }

    const warnings = [];
    if (!ownSymbolsAreUnique(state.inside)) {
      warnings.push("Statuy powinny miec po jednym symbolu C, T i S.");
    }
    if (!totalCountsAreValid(state.inside, (entry) => entry.held)) {
      warnings.push("W pokojach powinny byc lacznie po dwa symbole kazdego typu.");
    }

    const target = insideTargetCounts();
    const current = state.inside.map((player) => countSymbols(player.held));
    const steps = [];

    if (warnings.length === 0) {
      let guard = 0;
      while (!countsDone(current, target) && guard < 12) {
        guard += 1;
        let moved = false;

        for (let from = 0; from < current.length && !moved; from += 1) {
          for (const symbol of symbolIds) {
            if (current[from][symbol] <= target[from][symbol]) {
              continue;
            }

            const to = current.findIndex((counts, index) => {
              return index !== from && counts[symbol] < target[index][symbol];
            });

            if (to >= 0) {
              current[from][symbol] -= 1;
              current[to][symbol] += 1;
              steps.push({ from, to, symbol });
              moved = true;
              break;
            }
          }
        }

        if (!moved) {
          warnings.push("Nie da sie ulozyc bez zmiany danych wejsciowych.");
          break;
        }
      }
    }

    const targetRows = state.inside
      .map((player, index) => {
        const targetPair = targetPairForOwn(player.own);
        return `
          <li>
            <strong>${positions[index].label}</strong>
            <span>${targetPair.map((symbol) => symbolChip(symbol)).join("")}</span>
          </li>
        `;
      })
      .join("");

    const stepRows =
      warnings.length > 0
        ? `<li><span>!</span><p>Popraw dane wejsciowe, potem policz ruchy ponownie.</p></li>`
        : steps.length > 0
        ? steps
            .map((step, index) => {
              return `
                <li>
                  <span>${index + 1}</span>
                  <p><strong>${positions[step.from].label}</strong> daje ${symbolChip(step.symbol)} do <strong>${positions[step.to].label}</strong>.</p>
                </li>
              `;
            })
            .join("")
        : `<li><span>OK</span><p>Uklad juz pasuje do wyjscia.</p></li>`;

    result.innerHTML = `
      ${warnings.map((warning) => `<div class="tool-warning">${warning}</div>`).join("")}
      <div class="result-block">
        <h4>Finalne symbole</h4>
        <ul class="target-list">${targetRows}</ul>
      </div>
      <div class="result-block">
        <h4>Ruchy</h4>
        <ol class="step-list">${stepRows}</ol>
      </div>
    `;
  }

  function dissectionTargets() {
    return state.dissection.map((statue) => {
      const pair = targetPairForOwn(statue.own);
      return {
        pair,
        solid: solidForSymbols(pair)
      };
    });
  }

  function swapSymbols(current, first, firstSymbol, second, secondSymbol) {
    current[first][firstSymbol] -= 1;
    current[first][secondSymbol] += 1;
    current[second][secondSymbol] -= 1;
    current[second][firstSymbol] += 1;
  }

  function calculateDissection() {
    const result = byId("dissectionResult");
    if (!result) {
      return;
    }

    const warnings = [];
    if (!ownSymbolsAreUnique(state.dissection)) {
      warnings.push("Statuy powinny miec po jednym symbolu C, T i S.");
    }
    if (!totalCountsAreValid(state.dissection, (entry) => solidById(entry.solid).symbols)) {
      warnings.push("Bryly powinny zawierac lacznie po dwa symbole kazdego typu.");
    }

    const targets = dissectionTargets();
    const targetCounts = targets.map((target) => countSymbols(target.pair));
    const current = state.dissection.map((statue) => countSymbols(solidById(statue.solid).symbols));
    const steps = [];

    if (warnings.length === 0) {
      let guard = 0;
      while (!countsDone(current, targetCounts) && guard < 8) {
        guard += 1;
        let moved = false;

        for (let first = 0; first < current.length && !moved; first += 1) {
          for (let second = first + 1; second < current.length && !moved; second += 1) {
            for (const firstSymbol of surplusSymbols(current, targetCounts, first)) {
              for (const secondSymbol of surplusSymbols(current, targetCounts, second)) {
                const firstNeedsSecond = deficitSymbols(current, targetCounts, first).includes(secondSymbol);
                const secondNeedsFirst = deficitSymbols(current, targetCounts, second).includes(firstSymbol);

                if (firstSymbol !== secondSymbol && firstNeedsSecond && secondNeedsFirst) {
                  swapSymbols(current, first, firstSymbol, second, secondSymbol);
                  steps.push({ first, firstSymbol, second, secondSymbol });
                  moved = true;
                  break;
                }
              }
              if (moved) {
                break;
              }
            }
          }
        }

        if (moved) {
          continue;
        }

        for (let first = 0; first < current.length && !moved; first += 1) {
          for (const firstSymbol of surplusSymbols(current, targetCounts, first)) {
            for (const secondSymbol of deficitSymbols(current, targetCounts, first)) {
              const second = current.findIndex((counts, index) => {
                return index !== first && counts[secondSymbol] > targetCounts[index][secondSymbol];
              });

              if (second >= 0 && firstSymbol !== secondSymbol) {
                swapSymbols(current, first, firstSymbol, second, secondSymbol);
                steps.push({ first, firstSymbol, second, secondSymbol });
                moved = true;
                break;
              }
            }
            if (moved) {
              break;
            }
          }
        }

        if (!moved) {
          warnings.push("Nie da sie ulozyc kluczy z tych danych.");
          break;
        }
      }
    }

    const targetRows = targets
      .map((target, index) => {
        return `
          <li>
            <strong>${positions[index].label}</strong>
            <span>${solidChip(target.solid.id)} ${target.pair.map((symbol) => symbolChip(symbol)).join("")}</span>
          </li>
        `;
      })
      .join("");

    const stepRows =
      warnings.length > 0
        ? `<li><span>!</span><p>Popraw dane wejsciowe, potem policz dissection ponownie.</p></li>`
        : steps.length > 0
        ? steps
            .map((step, index) => {
              return `
                <li>
                  <span>${index + 1}</span>
                  <p><strong>${positions[step.first].label}</strong>: rozbij ${symbolChip(step.firstSymbol)}, potem <strong>${positions[step.second].label}</strong>: rozbij ${symbolChip(step.secondSymbol)}.</p>
                </li>
              `;
            })
            .join("")
        : `<li><span>OK</span><p>Bryly sa juz ustawione pod klucze.</p></li>`;

    result.innerHTML = `
      ${warnings.map((warning) => `<div class="tool-warning">${warning}</div>`).join("")}
      <div class="result-block">
        <h4>Klucze</h4>
        <ul class="target-list">${targetRows}</ul>
      </div>
      <div class="result-block">
        <h4>Dissection</h4>
        <ol class="step-list">${stepRows}</ol>
      </div>
    `;
  }

  function updateVisual() {
    const visual = byId("verityVisual");
    if (!visual) {
      return;
    }

    if (state.mode === "inside") {
      visual.innerHTML = `
        <div class="visual-lane">
          ${state.inside
            .map((player, index) => {
              return `
                <article class="visual-card">
                  <span class="visual-label">${positions[index].label}</span>
                  <div class="visual-statue">${symbolChip(player.own)}</div>
                  <div class="visual-held">${player.held.map((symbol) => symbolChip(symbol)).join("")}</div>
                </article>
              `;
            })
            .join("")}
        </div>
        <div class="symbol-stream" aria-hidden="true"><span></span><span></span><span></span></div>
      `;
      return;
    }

    const targets = dissectionTargets();
    visual.innerHTML = `
      <div class="visual-lane">
        ${state.dissection
          .map((statue, index) => {
            return `
              <article class="visual-card">
                <span class="visual-label">${positions[index].label}</span>
                <div class="visual-statue">${symbolChip(statue.own)}</div>
                <div class="visual-held">${solidChip(statue.solid)}</div>
                <div class="visual-target">${solidChip(targets[index].solid.id)}</div>
              </article>
            `;
          })
          .join("")}
      </div>
      <div class="symbol-stream" aria-hidden="true"><span></span><span></span><span></span></div>
    `;
  }

  function resetCurrentMode() {
    if (state.mode === "inside") {
      state.inside = [
        { own: "circle", held: ["circle", "circle"] },
        { own: "triangle", held: ["triangle", "triangle"] },
        { own: "square", held: ["square", "square"] }
      ];
      renderInsideInputs();
      calculateInside();
    } else {
      state.dissection = [
        { own: "circle", solid: "sphere" },
        { own: "triangle", solid: "pyramid" },
        { own: "square", solid: "cube" }
      ];
      renderDissectionInputs();
      calculateDissection();
    }

    updateVisual();
  }

  function bindPanelEvents() {
    byId("insideModeButton")?.addEventListener("click", () => setMode("inside"));
    byId("dissectionModeButton")?.addEventListener("click", () => setMode("dissection"));
    byId("insideCalculateButton")?.addEventListener("click", calculateInside);
    byId("dissectionCalculateButton")?.addEventListener("click", calculateDissection);
    byId("raidResetButton")?.addEventListener("click", resetCurrentMode);
  }

  function init() {
    injectStylesheet();
    createGuidePanel();
    createHubSwitcher();
    bindGlobalExit();
    bindPanelEvents();
    updateGuideSummary();
    renderInsideInputs();
    renderDissectionInputs();
    calculateInside();
    calculateDissection();
    updateVisual();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
