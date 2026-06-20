const STORAGE_KEY = "phoenix-adventures-save";
const TRACKING_VERSION = "20260619-9";
const STATE_VERSION = "builder-20260619-8";
const ATTRIBUTE_KEYS = ["strength", "intelligence", "wisdom", "dexterity", "constitution", "charisma"];
const LEGACY_STAT_MAP = {
  might: "strength",
  wits: "wisdom",
  spirit: "wisdom",
};

class Scene {
  constructor(definition) {
    this.id = definition.id;
    this.mapNodeId = definition.mapNodeId;
    this.kicker = definition.kicker;
    this.title = definition.title;
    this.image = definition.image;
    this.imageAlt = definition.imageAlt || "";
    this.text = definition.text || "";
    this.builder = definition.builder || "";
    this.builderConfig = definition.builderConfig || {};
    this.choices = definition.choices || [];
  }
}

class Adventurer {
  constructor(profile = {}) {
    const incomingStats = profile.stats || {};

    this.name = profile.name || "";
    this.level = readNumber(profile.level, 1);
    this.raceKey = profile.raceKey || inferDefinitionKey("races", profile.race, profile.origin);
    this.backgroundKey = profile.backgroundKey || inferDefinitionKey("backgrounds", profile.background);
    this.classKey = profile.classKey || inferDefinitionKey("classes", profile.className);
    this.race = profile.race || "";
    this.origin = profile.origin || "";
    this.background = profile.background || "";
    this.className = profile.className || "";
    this.alignment = profile.alignment || "";
    this.languages = normalizeStringArray(profile.languages);
    this.skills = normalizeStringArray(profile.skills);
    this.proficiencies = normalizeStringArray(profile.proficiencies);
    this.abilityPool = normalizeAbilityPool(profile.abilityPool);
    this.baseScores = ATTRIBUTE_KEYS.reduce((scores, attribute) => {
      scores[attribute] = readNullableNumber(profile.baseScores?.[attribute]);
      return scores;
    }, {});
    this.stats = ATTRIBUTE_KEYS.reduce((stats, attribute) => {
      stats[attribute] = readNullableNumber(incomingStats[attribute]);
      return stats;
    }, {});
    this.stats.gold = readNumber(incomingStats.gold ?? profile.gold, 0);
    this.spells = Array.isArray(profile.spells) ? [...profile.spells] : [];
    this.provisions = Array.isArray(profile.provisions) ? [...profile.provisions] : [];
    this.instrument = profile.instrument || "";
    this.armor = profile.armor || "";
    this.weapon = profile.weapon || "";
    this.armorClass = readNullableNumber(profile.armorClass);
    this.hitPoints = {
      current: readNullableNumber(profile.hitPoints?.current),
      max: readNullableNumber(profile.hitPoints?.max),
    };
    this.inventory = Array.isArray(profile.inventory) ? [...profile.inventory] : [];

    this.syncDefinitionLabels();
    this.refreshFinalScores();
  }

  get raceDefinition() {
    return getDefinition("races", this.raceKey);
  }

  get backgroundDefinition() {
    return getDefinition("backgrounds", this.backgroundKey);
  }

  get classDefinition() {
    return getDefinition("classes", this.classKey);
  }

  syncDefinitionLabels() {
    if (this.raceDefinition) {
      this.race = this.raceDefinition.name;
      this.origin = this.raceDefinition.origin;
    }

    if (this.backgroundDefinition) {
      this.background = this.backgroundDefinition.name;
    }

    if (this.classDefinition) {
      this.className = this.classDefinition.name;
    }
  }

  hasAbilityPool() {
    return this.abilityPool.length === ATTRIBUTE_KEYS.length;
  }

  hasAssignedBaseScores() {
    return ATTRIBUTE_KEYS.every((attribute) => Number.isFinite(this.baseScores[attribute]));
  }

  hasAbilityScores() {
    return ATTRIBUTE_KEYS.every((attribute) => Number.isFinite(this.stats[attribute]));
  }

  raceBonus(attribute) {
    return readNumber(this.raceDefinition?.abilityBonuses?.[attribute], 0);
  }

  raceBonusEntries() {
    return ATTRIBUTE_KEYS.map((attribute) => [attribute, this.raceBonus(attribute)]).filter(([, bonus]) => bonus !== 0);
  }

  rollAbilityPool() {
    this.abilityPool = rollAbilityPool();
    this.clearAbilityScores();
  }

  clearAbilityScores() {
    ATTRIBUTE_KEYS.forEach((attribute) => {
      this.baseScores[attribute] = null;
      this.stats[attribute] = null;
    });
    this.armorClass = null;
    this.hitPoints = { current: null, max: null };
  }

  assignBaseScores(assignments) {
    const assignedValues = ATTRIBUTE_KEYS.map((attribute) => Number(assignments[attribute]));

    if (!this.hasAbilityPool() || assignedValues.some((value) => !Number.isFinite(value))) {
      return false;
    }

    if (!matchesScorePool(assignedValues, this.abilityPool)) {
      return false;
    }

    ATTRIBUTE_KEYS.forEach((attribute) => {
      this.baseScores[attribute] = Number(assignments[attribute]);
    });
    this.refreshFinalScores();
    return true;
  }

  refreshFinalScores() {
    ATTRIBUTE_KEYS.forEach((attribute) => {
      const baseScore = this.baseScores[attribute];

      if (Number.isFinite(baseScore)) {
        this.stats[attribute] = baseScore + this.raceBonus(attribute);
      } else {
        this.stats[attribute] = readNullableNumber(this.stats[attribute]);
      }
    });

    this.refreshDerivedVitals();
  }

  refreshDerivedVitals() {
    if (!this.hasAbilityScores()) {
      this.armorClass = null;
      this.hitPoints = { current: null, max: null };
      return;
    }

    this.armorClass = readNumber(this.armorClass, calculateArmorClass(this.stats.dexterity));
    this.hitPoints = normalizeHitPoints(this.hitPoints, this.stats.constitution, this.classKey);
  }

  applyEffects(effects = {}) {
    if (effects.resetCharacter) {
      const replacement = new Adventurer({ stats: { gold: 12 } });
      Object.assign(this, replacement);
    }

    if (effects.rollAbilityPool) {
      this.rollAbilityPool();
    }

    if (effects.clearAbilityScores) {
      this.clearAbilityScores();
    }

    this.applyCharacterFields(effects.setCharacter);
    this.applyStatDeltas(effects.statDeltas);
    this.applyHitPointDelta(effects.hitPointDelta);
    this.applyArmorClassDelta(effects.armorClassDelta);
    this.addItems(effects.addItems);
    this.addUniqueValues("languages", effects.addLanguages);
    this.addUniqueValues("skills", effects.addSkills);
    this.addUniqueValues("proficiencies", effects.addProficiencies);
    this.syncDefinitionLabels();
    this.refreshFinalScores();
  }

  applyCharacterFields(fields = {}) {
    const previousClassKey = this.classKey;

    Object.entries(fields).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        this[key] = [...value];
      } else {
        this[key] = value;
      }
    });

    if ((fields.classKey || fields.className) && this.classKey !== previousClassKey) {
      this.hitPoints = { current: null, max: null };
    }
  }

  applyStatDeltas(statDeltas = {}) {
    Object.entries(statDeltas).forEach(([stat, delta]) => {
      const normalizedStat = LEGACY_STAT_MAP[stat] || stat;

      if (normalizedStat === "gold") {
        const current = Number(this.stats.gold) || 0;
        this.stats.gold = Math.max(0, current + Number(delta));
        return;
      }

      if (!ATTRIBUTE_KEYS.includes(normalizedStat)) {
        return;
      }

      if (Number.isFinite(this.baseScores[normalizedStat])) {
        this.baseScores[normalizedStat] += Number(delta);
      } else {
        const current = Number(this.stats[normalizedStat]) || 0;
        this.stats[normalizedStat] = current + Number(delta);
      }
    });
  }

  applyHitPointDelta(delta) {
    if (!isNumericValue(delta) || !isNumericValue(this.hitPoints.current)) {
      return;
    }

    this.hitPoints.current = clamp(this.hitPoints.current + Number(delta), 0, this.hitPoints.max);
  }

  applyArmorClassDelta(delta) {
    if (!isNumericValue(delta) || Number(delta) === 0) {
      return;
    }

    this.armorClass = readNumber(this.armorClass, calculateArmorClass(this.stats.dexterity)) + Number(delta);
  }

  addItems(items = []) {
    normalizeStringArray(items).forEach((item) => {
      if (!this.inventory.includes(item)) {
        this.inventory.push(item);
      }
    });
  }

  addUniqueValues(field, values = []) {
    if (!Array.isArray(this[field])) {
      this[field] = [];
    }

    normalizeStringArray(values).forEach((value) => {
      if (!this[field].includes(value)) {
        this[field].push(value);
      }
    });
  }

  requirementProblems(requirements = {}) {
    const problems = [];
    const missingItems = (requirements.items || []).filter((item) => !this.inventory.includes(item));

    if (requirements.abilityPool && !this.hasAbilityPool()) {
      problems.push("Roll ability scores first");
    }

    if (requirements.abilityScoresAssigned && !this.hasAssignedBaseScores()) {
      problems.push("Assign all six ability scores first");
    }

    if (missingItems.length > 0) {
      problems.push(`Needs ${missingItems.join(", ")}`);
    }

    Object.entries(requirements.stats || {}).forEach(([stat, minimum]) => {
      const normalizedStat = LEGACY_STAT_MAP[stat] || stat;
      if ((Number(this.stats[normalizedStat]) || 0) < Number(minimum)) {
        problems.push(`Needs ${minimum} ${formatStatLabel(normalizedStat)}`);
      }
    });

    Object.entries(requirements.character || {}).forEach(([field, expected]) => {
      const actual = this[field];
      const expectedValues = Array.isArray(expected) ? expected : [expected];

      if (!expectedValues.includes(actual)) {
        problems.push(`Needs ${expectedValues.join(" or ")}`);
      }
    });

    return problems;
  }

  toJSON() {
    return {
      name: this.name,
      level: this.level,
      raceKey: this.raceKey,
      race: this.race,
      origin: this.origin,
      backgroundKey: this.backgroundKey,
      background: this.background,
      classKey: this.classKey,
      className: this.className,
      alignment: this.alignment,
      languages: [...this.languages],
      skills: [...this.skills],
      proficiencies: [...this.proficiencies],
      abilityPool: [...this.abilityPool],
      baseScores: { ...this.baseScores },
      stats: { ...this.stats },
      spells: [...this.spells],
      provisions: [...this.provisions],
      instrument: this.instrument,
      armor: this.armor,
      weapon: this.weapon,
      armorClass: this.armorClass,
      hitPoints: { ...this.hitPoints },
      inventory: [...this.inventory],
    };
  }
}

class Adventure {
  constructor(definition) {
    this.definition = definition;
    this.title = definition.title;
    this.startSceneId = definition.startSceneId;
    this.openingHistory = definition.openingHistory || [];
    this.playerTemplate = definition.player;
    this.trackingPixel = definition.trackingPixel || "assets/character-pixel.svg";
    this.scenes = new Map((definition.scenes || []).map((scene) => [scene.id, new Scene(scene)]));
  }

  getScene(sceneId) {
    return this.scenes.get(sceneId) || this.scenes.get(this.startSceneId);
  }

  createDefaultState() {
    return {
      version: STATE_VERSION,
      sceneId: this.startSceneId,
      player: new Adventurer(this.playerTemplate).toJSON(),
      history: [...this.openingHistory],
      events: [],
      view: "adventure",
    };
  }

  normalizeState(saved) {
    if (!saved || typeof saved !== "object" || saved.version !== STATE_VERSION) {
      return this.createDefaultState();
    }

    if (saved.scene || saved.stats) {
      return this.normalizeLegacyState(saved);
    }

    const defaultState = this.createDefaultState();
    const playerData = saved.player || {};

    return {
      ...defaultState,
      sceneId: this.resolveSceneId(saved.sceneId),
      player: new Adventurer({
        ...defaultState.player,
        ...playerData,
        stats: {
          ...defaultState.player.stats,
          ...(playerData.stats || {}),
        },
      }).toJSON(),
      history: Array.isArray(saved.history) ? saved.history : defaultState.history,
      events: Array.isArray(saved.events) ? saved.events : defaultState.events,
      view: saved.view === "sheet" ? "sheet" : "adventure",
    };
  }

  normalizeLegacyState(saved) {
    return {
      version: STATE_VERSION,
      sceneId: this.resolveSceneId(saved.scene),
      player: new Adventurer({
        name: saved.heroName || this.playerTemplate.name,
        level: saved.level || this.playerTemplate.level,
        stats: {
          ...(this.playerTemplate.stats || {}),
          ...migrateLegacyStats(saved.stats || {}),
          ...(saved.stats || {}),
        },
        inventory: Array.isArray(saved.inventory) ? saved.inventory : this.playerTemplate.inventory,
      }).toJSON(),
      history: Array.isArray(saved.log) ? saved.log : [...this.openingHistory],
      events: [],
      view: "adventure",
    };
  }

  resolveSceneId(sceneId) {
    return this.scenes.has(sceneId) ? sceneId : this.startSceneId;
  }
}

class AdventureGame {
  constructor(adventure, elements) {
    this.adventure = adventure;
    this.elements = elements;
    this.state = this.loadState();
  }

  start() {
    this.bindEvents();
    this.saveState();
    this.render();
  }

  bindEvents() {
    this.elements.saveButton.addEventListener("click", () => {
      this.saveState();
      this.updateTrackingPixel("save");
      flashButton(this.elements.saveButton, "Saved");
    });

    this.elements.newGameButton.addEventListener("click", () => {
      this.state = this.adventure.createDefaultState();
      this.saveState();
      this.render();
    });

    this.elements.viewToggleButton?.addEventListener("click", () => {
      const hero = new Adventurer(this.state.player);
      if (!shouldShowCharacterSheet(hero)) {
        return;
      }

      this.state.view = this.state.view === "sheet" ? "adventure" : "sheet";
      this.saveState();
      this.render();
    });
  }

  render() {
    const scene = this.adventure.getScene(this.state.sceneId);
    const hero = new Adventurer(this.state.player);

    this.renderEventLog(scene, hero);

    this.renderCharacterSheet(hero);
    this.renderAbilityScores(hero);
    this.renderBuilder(scene, hero);
    this.renderChoices(scene.choices, hero);
    if (this.elements.inventoryList) {
      renderList(this.elements.inventoryList, hero.inventory);
    }
    this.updateTrackingPixel("render");
  }

  renderEventLog(scene, hero) {
    if (!this.elements.eventLog) {
      return;
    }

    const changed = this.ensureSceneEvent(scene, hero);
    const events = this.state.events || [];

    const cards = events.map((event, index) => {
      const card = document.createElement("article");
      card.className = `event-card${index === events.length - 1 ? " is-current" : ""}`;

      if (event.image) {
        const image = document.createElement("img");
        image.src = event.image;
        image.alt = event.imageAlt || "";
        card.append(image);
      }

      const copy = document.createElement("div");
      copy.className = "event-copy";
      copy.append(createElement("p", event.kicker || ""), createElement("h2", event.title || ""), createElement("span", event.text || ""));
      card.append(copy);
      return card;
    });

    this.elements.eventLog.replaceChildren(...cards);

    if (changed) {
      this.saveState();
      window.requestAnimationFrame(() => {
        if (this.state.view !== "sheet") {
          window.scrollTo({ top: document.documentElement.scrollHeight });
        }
      });
    }
  }

  ensureSceneEvent(scene, hero) {
    const renderedEvent = {
      sceneId: scene.id,
      kicker: scene.kicker,
      title: scene.title,
      image: scene.image,
      imageAlt: scene.imageAlt,
      text: this.interpolate(scene.text, hero),
    };
    const events = Array.isArray(this.state.events) ? this.state.events : [];
    const last = events[events.length - 1];

    if (last?.sceneId === scene.id) {
      const updated = { ...last, ...renderedEvent };
      const changed = JSON.stringify(updated) !== JSON.stringify(last);
      if (changed) {
        this.state.events = [...events.slice(0, -1), updated];
      }
      return changed;
    }

    this.state.events = [...events, renderedEvent].slice(-18);
    return true;
  }

  updateHeroName(value) {
    const hero = new Adventurer(this.state.player);
    hero.name = value.trim();
    this.state.player = hero.toJSON();
    this.saveState();
    this.updateTrackingPixel("name");
    this.renderCharacterSheet(hero);
  }

  renderCharacterSheet(hero) {
    const hasSheetContent = shouldShowCharacterSheet(hero);
    const activeView = hasSheetContent && this.state.view === "sheet" ? "sheet" : "adventure";

    this.state.view = activeView;

    if (this.elements.gameLayout) {
      this.elements.gameLayout.classList.toggle("sheet-view", activeView === "sheet");
    }

    if (!this.elements.characterSheet || !this.elements.sheetSummary) {
      return;
    }

    if (this.elements.scenePanel) {
      this.elements.scenePanel.hidden = activeView === "sheet";
    }

    this.elements.characterSheet.hidden = activeView !== "sheet";

    this.renderViewToggle(hasSheetContent, activeView);

    if (this.elements.heroLevel) {
      this.elements.heroLevel.textContent = `Level ${hero.level}`;
    }

    if (!hasSheetContent) {
      this.elements.sheetSummary.replaceChildren();
      return;
    }

    const rows = [];

    if (hero.name) {
      rows.push(sheetDatum("Name", hero.name));
    }

    if (hero.race) {
      rows.push(sheetDatum("Race", hero.race));
    }

    if (hero.origin) {
      rows.push(sheetDatum("Origin", hero.origin));
    }

    if (hero.background) {
      rows.push(sheetDatum("Background", hero.background));
    }

    if (hero.alignment) {
      rows.push(sheetDatum("Alignment", hero.alignment));
    }

    if (hero.languages.length > 0) {
      rows.push(sheetDatum("Languages", hero.languages.join(", ")));
    }

    if (hero.skills.length > 0) {
      rows.push(sheetDatum("Skills", hero.skills.join(", ")));
    }

    if (hero.proficiencies.length > 0) {
      rows.push(sheetDatum("Proficiencies", hero.proficiencies.join(", ")));
    }

    if (hero.hasAssignedBaseScores()) {
      rows.push(sheetAbilityScores(hero));
    }

    if (hero.className) {
      rows.push(sheetDatum("Class", hero.className));
    }

    if (hero.classKey && Number.isFinite(hero.armorClass)) {
      rows.push(sheetDatum("Armor Class", formatScore(hero.armorClass)));
    }

    if (hero.classKey && Number.isFinite(hero.hitPoints.current) && Number.isFinite(hero.hitPoints.max)) {
      rows.push(sheetDatum("Hit Points", `${hero.hitPoints.current}/${hero.hitPoints.max}`));
    }

    if (hero.provisions.length > 0) {
      rows.push(sheetDatum("Provisions", hero.provisions.join(", ")));
    }

    if (hero.spells.length > 0) {
      rows.push(sheetDatum(hero.instrument ? "Songs" : "Spells", hero.spells.join(", ")));
    }

    if (hero.instrument) {
      rows.push(sheetDatum("Instrument", hero.instrument));
    }

    if (hero.weapon) {
      rows.push(sheetDatum("Weapon", hero.weapon));
    }

    if (hero.armor) {
      rows.push(sheetDatum("Armor", hero.armor));
    }

    if (hero.classKey || hero.weapon || hero.armor) {
      rows.push(sheetDatum("Gold", stringifyValue(hero.stats.gold)));
    }

    if (hero.inventory.length > 0) {
      rows.push(sheetDatum("Inventory", hero.inventory.join(", ")));
    }

    this.elements.sheetSummary.replaceChildren(...rows);
  }

  renderViewToggle(hasSheetContent, activeView) {
    const button = this.elements.viewToggleButton;

    if (!button) {
      return;
    }

    button.hidden = !hasSheetContent;
    button.disabled = !hasSheetContent;
    button.classList.toggle("is-sheet-view", activeView === "sheet");
    button.setAttribute("aria-pressed", String(activeView === "sheet"));

    const label = activeView === "sheet" ? "Show adventure log" : "Show character sheet";
    button.setAttribute("aria-label", label);
    button.title = label;
  }

  renderAbilityScores(hero) {
    ATTRIBUTE_KEYS.forEach((attribute) => {
      const score = hero.stats[attribute];
      const baseScore = hero.baseScores[attribute];
      const raceBonus = hero.raceBonus(attribute);
      const scoreElement = this.elements[`stat${capitalize(attribute)}`];
      const modifierElement = this.elements[`mod${capitalize(attribute)}`];

      if (scoreElement) {
        scoreElement.textContent = formatScore(score);
        scoreElement.title = Number.isFinite(baseScore)
          ? `Base ${baseScore}${raceBonus ? ` ${formatSigned(raceBonus)} race` : ""}`
          : "Assign a rolled score in the Gymnasium";
      }

      if (modifierElement) {
        modifierElement.textContent = formatModifier(abilityModifier(score));
        modifierElement.title = `${formatStatLabel(attribute)} modifier`;
      }
    });

    if (this.elements.armorClass) {
      this.elements.armorClass.textContent = formatScore(hero.armorClass);
    }

    if (this.elements.hitPoints) {
      this.elements.hitPoints.textContent =
        Number.isFinite(hero.hitPoints.current) && Number.isFinite(hero.hitPoints.max)
          ? `${hero.hitPoints.current}/${hero.hitPoints.max}`
          : "--";
    }

    if (this.elements.statGold) {
      this.elements.statGold.textContent = hero.stats.gold;
    }
  }

  renderBuilder(scene, hero) {
    if (!this.elements.builderPanel || !scene.builder) {
      this.elements.builderPanel.hidden = true;
      this.elements.builderPanel.replaceChildren();
      return;
    }

    if (scene.builder === "identity-entry") {
      this.renderIdentityEntryBuilder(hero);
      return;
    }

    if (scene.builder === "ability-assignment") {
      this.renderAbilityAssignmentBuilder(hero);
      return;
    }

    if (scene.builder === "option-picker") {
      this.renderOptionPickerBuilder(scene, hero);
      return;
    }

    if (scene.builder === "character-review") {
      this.renderCharacterReviewBuilder(hero);
      return;
    }

    this.elements.builderPanel.hidden = true;
    this.elements.builderPanel.replaceChildren();
  }

  renderIdentityEntryBuilder(hero) {
    const panel = this.elements.builderPanel;
    panel.hidden = false;
    panel.className = "builder-panel identity-builder";

    const heading = document.createElement("div");
    heading.className = "builder-heading";
    heading.append(
      createElement("h3", "Tell the barkeep who you are"),
      createElement("p", "The character sheet appears after you choose a race, then grows as each station adds another completed piece."),
    );

    const label = document.createElement("label");
    label.className = "name-field";
    label.setAttribute("for", "heroNameEntry");

    const labelText = createElement("span", "Character Name");
    const input = document.createElement("input");
    input.id = "heroNameEntry";
    input.maxLength = 28;
    input.placeholder = "Enter a name";
    input.value = hero.name;
    input.addEventListener("input", (event) => {
      this.updateHeroName(event.currentTarget.value);
    });

    label.append(labelText, input);
    panel.replaceChildren(heading, label);
  }

  renderOptionPickerBuilder(scene, hero) {
    const panel = this.elements.builderPanel;
    const config = scene.builderConfig || {};
    const options = getOptionDefinitions(config.source);
    const field = config.field;
    const mode = config.mode || "single";
    const minimum = readNumber(config.min, mode === "single" ? 1 : 0);
    const maximum = readNumber(config.max, mode === "single" ? 1 : options.length);
    const existingValues = normalizeStringArray(hero[field]);
    const selected = new Set(config.append ? [] : mode === "multi" ? existingValues : normalizeStringArray([hero[field]]));

    panel.hidden = false;
    panel.className = "builder-panel option-builder";

    const heading = document.createElement("div");
    heading.className = "builder-heading";
    heading.append(
      createElement("h3", optionPickerHeading(field, mode, minimum, maximum)),
      createElement("p", optionPickerHelp(mode, minimum, maximum)),
    );

    const grid = document.createElement("div");
    grid.className = "option-picker-grid";

    const existing = document.createElement("div");
    existing.className = "option-existing";
    if (config.append && existingValues.length > 0) {
      existing.append(createElement("span", "Already on the sheet"));
      existingValues.forEach((value) => existing.append(createElement("strong", value)));
    }

    const applyButton = document.createElement("button");
    applyButton.type = "button";
    applyButton.className = "apply-scores-button";
    applyButton.textContent = optionPickerButtonLabel(field);

    const updateSelection = () => {
      grid.querySelectorAll(".option-picker-card").forEach((card) => {
        const isSelected = selected.has(card.dataset.value);
        card.classList.toggle("is-selected", isSelected);
        card.setAttribute("aria-pressed", String(isSelected));
      });

      const count = selected.size;
      applyButton.disabled = count < minimum || count > maximum;
    };

    options.forEach((option) => {
      const value = option.name || option.key;
      const card = document.createElement("button");
      card.type = "button";
      card.className = "option-picker-card";
      card.dataset.value = value;
      card.setAttribute("aria-pressed", "false");
      card.append(createElement("strong", option.name || option.key));

      if (config.append && existingValues.includes(value)) {
        card.disabled = true;
        card.classList.add("is-owned");
      }

      const meta = option.ability || option.type;
      if (meta) {
        card.append(createElement("em", formatStatLabel(meta)));
      }

      if (option.summary) {
        card.append(createElement("span", option.summary));
      }

      card.addEventListener("click", () => {
        if (mode === "single") {
          selected.clear();
          selected.add(value);
        } else if (selected.has(value)) {
          selected.delete(value);
        } else if (selected.size < maximum) {
          selected.add(value);
        }

        updateSelection();
      });

      grid.append(card);
    });

    applyButton.addEventListener("click", () => {
      const count = selected.size;
      if (count < minimum || count > maximum) {
        return;
      }

      const nextHero = new Adventurer(this.state.player);
      const selectedValues = [...selected];

      if (mode === "single") {
        nextHero[field] = selectedValues[0] || "";
      } else if (config.append) {
        nextHero.addUniqueValues(field, selectedValues);
      } else {
        nextHero[field] = selectedValues;
      }

      this.state.player = nextHero.toJSON();
      this.state.sceneId = this.adventure.resolveSceneId(config.nextSceneId || this.state.sceneId);
      this.recordHistory(config.history);
      this.saveState();
      this.render();
      this.updateTrackingPixel(field || "option");
    });

    updateSelection();
    panel.replaceChildren(...(existing.childNodes.length ? [heading, existing, grid, applyButton] : [heading, grid, applyButton]));
  }

  renderAbilityAssignmentBuilder(hero) {
    const panel = this.elements.builderPanel;
    panel.hidden = false;
    panel.className = "builder-panel ability-builder";

    const heading = document.createElement("div");
    heading.className = "builder-heading";
    heading.append(
      createElement("h3", "Assign rolled scores"),
      createElement(
        "p",
        hero.race
          ? `${hero.race} bonuses: ${formatRaceBonuses(hero)}. Pick where each rolled base score belongs.`
          : "Pick a race before assigning scores so the final totals include racial bonuses.",
      ),
    );

    if (!hero.hasAbilityPool()) {
      const empty = createElement("p", "Roll a score pool below to begin. You will get six numbers, then assign each one to a different ability.");
      empty.className = "builder-note";
      panel.replaceChildren(heading, empty);
      return;
    }

    const pool = document.createElement("div");
    pool.className = "score-pool";
    pool.append(createElement("span", "Rolled scores"));
    hero.abilityPool.forEach((score) => {
      const chip = createElement("strong", String(score));
      pool.append(chip);
    });

    const assignmentGrid = document.createElement("div");
    assignmentGrid.className = "assignment-grid";
    const assignedIndexes = assignedIndexMap(hero);
    const controls = [];

    ATTRIBUTE_KEYS.forEach((attribute) => {
      const row = document.createElement("div");
      row.className = "assignment-row";
      row.dataset.attribute = attribute;

      const label = document.createElement("div");
      label.className = "assignment-label";
      label.append(createElement("strong", formatStatLabel(attribute)), createElement("span", getAbilityDefinition(attribute).description));

      const scoreOptions = document.createElement("div");
      scoreOptions.className = "score-options";
      scoreOptions.setAttribute("role", "group");
      scoreOptions.setAttribute("aria-label", `${formatStatLabel(attribute)} score options`);

      const modifiers = document.createElement("div");
      modifiers.className = "assignment-modifiers";

      const modifierList = document.createElement("div");
      modifierList.className = "modifier-list";
      modifiers.append(modifierList);

      const finalCard = createFinalScoreCard(attribute, null);
      finalCard.classList.add("assignment-final");

      const control = {
        attribute,
        row,
        optionButtons: [],
        assignmentIndex: Number.isInteger(assignedIndexes[attribute]) ? assignedIndexes[attribute] : null,
        modifierList,
        finalCard,
      };

      hero.abilityPool.forEach((score, index) => {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "score-choice";
        option.textContent = String(score);
        option.dataset.scoreIndex = String(index);
        option.addEventListener("click", () => {
          if (control.assignmentIndex === index) {
            return;
          }

          controls.forEach((candidate) => {
            if (candidate !== control && candidate.assignmentIndex === index) {
              candidate.assignmentIndex = null;
            }
          });
          control.assignmentIndex = index;
          updateAssignmentPreview();
        });
        scoreOptions.append(option);
        control.optionButtons.push(option);
      });

      row.append(label, scoreOptions, modifiers, finalCard);
      assignmentGrid.append(row);
      controls.push(control);
    });

    const applyButton = document.createElement("button");
    applyButton.type = "button";
    applyButton.className = "apply-scores-button";
    applyButton.textContent = hero.hasAssignedBaseScores() ? "Update assigned scores" : "Apply these scores";

    const updateAssignmentPreview = () => {
      const selectedIndexes = new Set(
        controls
          .map(({ assignmentIndex }) => assignmentIndex)
          .filter(Number.isInteger),
      );

      controls.forEach((control) => {
        control.optionButtons.forEach((option, index) => {
          const selectedHere = control.assignmentIndex === index;
          const usedElsewhere = !selectedHere && selectedIndexes.has(index);
          option.classList.toggle("is-selected", selectedHere);
          option.classList.toggle("is-used", usedElsewhere);
          option.classList.toggle("is-available", !selectedHere && !usedElsewhere);
          option.setAttribute("aria-pressed", String(selectedHere));
          option.title = usedElsewhere ? "Assigned to another ability; click to move it here." : `Assign ${option.textContent} to ${formatStatLabel(control.attribute)}`;
        });
      });

      controls.forEach(({ attribute, assignmentIndex, modifierList, finalCard }) => {
        const baseScore = Number.isInteger(assignmentIndex) ? hero.abilityPool[assignmentIndex] : null;
        const adjustment = abilityAdjustmentTotal(hero, attribute);
        const finalScore = Number.isFinite(baseScore) ? baseScore + adjustment : null;

        renderModifierList(modifierList, hero, attribute);
        updateFinalScoreCard(finalCard, attribute, finalScore);
      });

      applyButton.disabled = selectedIndexes.size !== ATTRIBUTE_KEYS.length;
    };

    applyButton.addEventListener("click", () => {
      const selectedIndexes = controls.map(({ assignmentIndex }) => assignmentIndex);
      if (selectedIndexes.some((value) => !Number.isInteger(value)) || new Set(selectedIndexes).size !== ATTRIBUTE_KEYS.length) {
        return;
      }

      const assignments = controls.reduce((nextAssignments, { attribute, assignmentIndex }) => {
        nextAssignments[attribute] = hero.abilityPool[assignmentIndex];
        return nextAssignments;
      }, {});
      const nextHero = new Adventurer(this.state.player);

      if (!nextHero.assignBaseScores(assignments)) {
        return;
      }

      this.state.player = nextHero.toJSON();
      this.recordHistory("Assigned rolled scores to abilities.");
      this.saveState();
      this.render();
      this.updateTrackingPixel("assign-scores");
    });

    updateAssignmentPreview();
    panel.replaceChildren(heading, pool, assignmentGrid, applyButton);
  }

  renderCharacterReviewBuilder(hero) {
    const panel = this.elements.builderPanel;
    panel.hidden = false;
    panel.className = "builder-panel review-builder";

    const heading = document.createElement("div");
    heading.className = "builder-heading";
    heading.append(
      createElement("h3", hero.name ? `${hero.name}'s character sheet` : "Character sheet"),
      createElement("p", "This is the completed sheet assembled from the builder choices. These are the values sent through the tracking pixel."),
    );

    const identity = document.createElement("div");
    identity.className = "review-strip";
    identity.append(
      reviewDatum("Race", hero.race || "Unchosen"),
      reviewDatum("Origin", hero.origin || "Undeclared"),
      reviewDatum("Background", hero.background || "Unchosen"),
      reviewDatum("Alignment", hero.alignment || "Unchosen"),
      reviewDatum("Class", hero.className || "Unregistered"),
    );

    const stats = document.createElement("div");
    stats.className = "review-stats";
    ATTRIBUTE_KEYS.forEach((attribute) => {
      const card = document.createElement("div");
      card.className = "review-stat-card";
      const baseScore = hero.baseScores[attribute];
      const raceBonus = hero.raceBonus(attribute);
      card.append(
        createElement("span", getAbilityDefinition(attribute).shortLabel),
        createElement("strong", formatScore(hero.stats[attribute])),
        createElement("small", `${Number.isFinite(baseScore) ? `Base ${baseScore}` : "Base --"}${raceBonus ? ` ${formatSigned(raceBonus)} race` : ""}`),
        createElement("em", formatModifier(abilityModifier(hero.stats[attribute]))),
      );
      stats.append(card);
    });

    const vitals = document.createElement("div");
    vitals.className = "review-strip";
    vitals.append(
      reviewDatum("Armor Class", formatScore(hero.armorClass)),
      reviewDatum(
        "Hit Points",
        Number.isFinite(hero.hitPoints.current) && Number.isFinite(hero.hitPoints.max) ? `${hero.hitPoints.current}/${hero.hitPoints.max}` : "--",
      ),
      reviewDatum("Gold", stringifyValue(hero.stats.gold)),
      reviewDatum("Weapon", hero.weapon || "Unchosen"),
      reviewDatum("Armor", hero.armor || "Unchosen"),
    );

    const inventory = document.createElement("div");
    inventory.className = "review-inventory";
    inventory.append(createElement("h3", "Inventory"));
    const inventoryList = document.createElement("ul");
    inventoryList.className = "token-list";
    renderList(inventoryList, hero.inventory);
    inventory.append(inventoryList);

    const training = document.createElement("div");
    training.className = "review-inventory";
    training.append(createElement("h3", "Training"));
    const trainingList = document.createElement("ul");
    trainingList.className = "token-list";
    renderList(trainingList, [...hero.languages, ...hero.skills, ...hero.proficiencies]);
    training.append(trainingList);

    panel.replaceChildren(heading, identity, stats, vitals, training, inventory);
  }

  renderChoices(choices, hero) {
    const buttons = choices
      .map((choice) => {
        const problems = hero.requirementProblems(choice.requires);

        if (choice.hideUnavailable && problems.length > 0) {
          return null;
        }

        const button = document.createElement("button");
        button.type = "button";
        button.className = "choice-card";
        button.dataset.choiceId = choice.id;
        button.disabled = problems.length > 0;
        button.title = problems.join("; ");
        button.addEventListener("click", () => this.choose(choice));

        button.append(createElement("strong", this.interpolate(choice.label, hero)));

        if (choice.summary) {
          button.append(createElement("span", this.interpolate(choice.summary, hero)));
        }

        if (choice.meta) {
          const metaList = document.createElement("dl");
          metaList.className = "choice-meta";
          Object.entries(choice.meta).forEach(([term, value]) => {
            metaList.append(createElement("dt", term), createElement("dd", this.interpolate(String(value), hero)));
          });
          button.append(metaList);
        }

        if (Array.isArray(choice.details) && choice.details.length > 0) {
          const details = document.createElement("ul");
          details.className = "choice-details";
          choice.details.forEach((detail) => {
            const item = createElement("li", this.interpolate(detail, hero));
            details.append(item);
          });
          button.append(details);
        }

        if (problems.length > 0) {
          const locked = createElement("small", problems.join("; "));
          locked.className = "choice-lock";
          button.append(locked);
        }

        return button;
      })
      .filter(Boolean);

    this.elements.choiceList.replaceChildren(...buttons);
  }

  choose(choice) {
    const hero = new Adventurer(this.state.player);

    if (hero.requirementProblems(choice.requires).length > 0) {
      return;
    }

    hero.applyEffects(choice.effects);
    this.recordHistory(choice.effects?.history);
    this.state.player = hero.toJSON();
    this.state.sceneId = this.adventure.resolveSceneId(choice.nextSceneId || this.state.sceneId);
    this.saveState();
    this.render();
  }

  recordHistory(entry) {
    if (!entry) {
      return;
    }

    this.state.history = [...(this.state.history || []), entry].slice(-50);
  }

  interpolate(text, hero) {
    return text
      .replaceAll("{name}", hero.name || "the traveler")
      .replaceAll("{origin}", hero.origin || "nowhere named")
      .replaceAll("{class}", hero.className || "unregistered");
  }

  loadState() {
    try {
      return this.adventure.normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)));
    } catch {
      return this.adventure.createDefaultState();
    }
  }

  saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  updateTrackingPixel(eventName) {
    if (!this.elements.logPixel) {
      return;
    }

    const hero = new Adventurer(this.state.player);
    const params = new URLSearchParams({
      v: TRACKING_VERSION,
      event: eventName,
      scene: this.state.sceneId,
      name: hero.name,
      raceKey: hero.raceKey,
      race: hero.race,
      origin: hero.origin,
      backgroundKey: hero.backgroundKey,
      background: hero.background,
      alignment: hero.alignment,
      languages: hero.languages.join("|"),
      skills: hero.skills.join("|"),
      proficiencies: hero.proficiencies.join("|"),
      classKey: hero.classKey,
      class: hero.className,
      abilityPool: hero.abilityPool.join("|"),
      baseScores: formatScoreMap(hero.baseScores),
      raceBonuses: formatScoreMap(raceBonusMap(hero)),
      ac: stringifyValue(hero.armorClass),
      hp: stringifyValue(hero.hitPoints.current),
      hpMax: stringifyValue(hero.hitPoints.max),
      gold: stringifyValue(hero.stats.gold),
      spells: hero.spells.join("|"),
      provisions: hero.provisions.join("|"),
      instrument: hero.instrument,
      armor: hero.armor,
      weapon: hero.weapon,
      inventory: hero.inventory.join("|"),
      rid: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    });

    ATTRIBUTE_KEYS.forEach((attribute) => {
      params.set(attribute, stringifyValue(hero.stats[attribute]));
    });

    this.elements.logPixel.src = `${this.adventure.trackingPixel}?${params.toString()}`;
  }
}

function shouldShowCharacterSheet(hero) {
  return Boolean(
      hero.raceKey ||
      hero.backgroundKey ||
      hero.alignment ||
      hero.languages.length ||
      hero.skills.length ||
      hero.proficiencies.length ||
      hero.hasAssignedBaseScores() ||
      hero.classKey ||
      hero.provisions.length ||
      hero.spells.length ||
      hero.instrument ||
      hero.weapon ||
      hero.armor ||
      hero.inventory.length,
  );
}

function sheetDatum(label, value) {
  const wrapper = document.createElement("div");
  wrapper.append(createElement("dt", label), createElement("dd", value));
  return wrapper;
}

function sheetAbilityScores(hero) {
  const wrapper = document.createElement("div");
  wrapper.className = "sheet-ability-block";

  const details = document.createElement("dd");
  const column = document.createElement("div");
  column.className = "sheet-ability-column";

  ATTRIBUTE_KEYS.forEach((attribute) => {
    column.append(createFinalScoreCard(attribute, hero.stats[attribute]));
  });

  details.append(column);
  wrapper.append(createElement("dt", "Ability Scores"), details);
  return wrapper;
}

function renderModifierList(modifierList, hero, attribute) {
  modifierList.replaceChildren(...abilityModifierEntries(hero, attribute).map(({ label, value }) => modifierChip(label, value)));
}

function abilityModifierEntries(hero, attribute) {
  return [{ label: hero.race ? `${hero.race} race` : "Race", value: hero.raceBonus(attribute) }];
}

function abilityAdjustmentTotal(hero, attribute) {
  return abilityModifierEntries(hero, attribute).reduce((total, { value }) => total + Number(value), 0);
}

function modifierChip(label, value) {
  const chip = document.createElement("div");
  chip.append(createElement("span", label), createElement("strong", formatSigned(value)));
  return chip;
}

function createFinalScoreCard(attribute, finalScore) {
  const card = document.createElement("div");
  card.className = "final-score-card";
  card.append(createElement("span", getAbilityDefinition(attribute).shortLabel), createElement("strong", "--"), createElement("em", "--"));
  updateFinalScoreCard(card, attribute, finalScore);
  return card;
}

function updateFinalScoreCard(card, attribute, finalScore) {
  const [labelNode, scoreNode, modifierNode] = card.children;
  labelNode.textContent = getAbilityDefinition(attribute).shortLabel;
  scoreNode.textContent = Number.isFinite(finalScore) ? String(finalScore) : "--";
  modifierNode.textContent = Number.isFinite(finalScore) ? formatModifier(abilityModifier(finalScore)) : "--";
  modifierNode.title = `${formatStatLabel(attribute)} bonus from the final score`;
}

function renderList(list, values) {
  if (values.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "Pack is empty";
    empty.className = "empty-token";
    list.replaceChildren(empty);
    return;
  }

  list.replaceChildren(
    ...values.map((value) => {
      const item = document.createElement("li");
      item.textContent = value;
      return item;
    }),
  );
}

function reviewDatum(label, value) {
  const item = document.createElement("div");
  item.append(createElement("span", label), createElement("strong", value || "--"));
  return item;
}

function flashButton(button, label) {
  const original = button.textContent;
  button.textContent = label;
  window.setTimeout(() => {
    button.textContent = original;
  }, 900);
}

function createElement(tagName, text) {
  const element = document.createElement(tagName);
  element.textContent = text;
  return element;
}

function getDefinition(collection, key) {
  return window.PHOENIX_ADVENTURE?.[collection]?.[key] || null;
}

function getOptionDefinitions(source) {
  const definitions = window.PHOENIX_ADVENTURE?.[source];
  if (Array.isArray(definitions)) {
    return definitions;
  }

  return Object.values(definitions || {});
}

function getAbilityDefinition(attribute) {
  return getDefinition("abilities", attribute) || {
    label: formatStatLabel(attribute),
    shortLabel: formatStatLabel(attribute).slice(0, 3).toUpperCase(),
    description: "",
  };
}

function inferDefinitionKey(collection, ...values) {
  const definitions = window.PHOENIX_ADVENTURE?.[collection] || {};
  const normalizedValues = values.filter(Boolean).map((value) => String(value).toLowerCase());

  return (
    Object.entries(definitions).find(([, definition]) =>
      [definition.name, definition.origin].filter(Boolean).some((candidate) => normalizedValues.includes(String(candidate).toLowerCase())),
    )?.[0] || ""
  );
}

function optionPickerHeading(field, mode, minimum, maximum) {
  const label = formatStatLabel(field || "options");
  if (mode === "single") {
    return `Choose ${label}`;
  }

  if (minimum === maximum) {
    return `Choose ${minimum} ${label}`;
  }

  return `Choose ${minimum}-${maximum} ${label}`;
}

function optionPickerHelp(mode, minimum, maximum) {
  if (mode === "single") {
    return "Pick one card, then confirm it for the character sheet.";
  }

  if (minimum === 0) {
    return `Pick up to ${maximum}, then confirm them for the character sheet.`;
  }

  return `Pick ${minimum === maximum ? minimum : `${minimum} to ${maximum}`}, then confirm them for the character sheet.`;
}

function optionPickerButtonLabel(field) {
  if (field === "alignment") {
    return "Set alignment";
  }

  return `Add ${formatStatLabel(field || "choices")}`;
}

function assignedIndexMap(hero) {
  const usedIndexes = new Set();
  return ATTRIBUTE_KEYS.reduce((map, attribute) => {
    const baseScore = hero.baseScores[attribute];
    if (!Number.isFinite(baseScore)) {
      return map;
    }

    const index = hero.abilityPool.findIndex((score, candidateIndex) => score === baseScore && !usedIndexes.has(candidateIndex));
    if (index >= 0) {
      usedIndexes.add(index);
      map[attribute] = index;
    }

    return map;
  }, {});
}

function matchesScorePool(values, pool) {
  const remaining = [...pool].sort((a, b) => a - b);
  const requested = [...values].sort((a, b) => a - b);

  return remaining.length === requested.length && remaining.every((score, index) => score === requested[index]);
}

function normalizeAbilityPool(values) {
  return Array.isArray(values)
    ? values.map((value) => Number(value)).filter((value) => Number.isFinite(value)).slice(0, ATTRIBUTE_KEYS.length)
    : [];
}

function normalizeStringArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.map((value) => String(value || "").trim()).filter(Boolean);
}

function rollAbilityPool() {
  return Array.from({ length: ATTRIBUTE_KEYS.length }, rollAbilityScore).sort((a, b) => b - a);
}

function rollAbilityScore() {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1)
    .sort((a, b) => b - a)
    .slice(0, 3)
    .reduce((total, roll) => total + roll, 0);
}

function abilityModifier(score) {
  return isNumericValue(score) ? Math.floor((Number(score) - 10) / 2) : null;
}

function calculateArmorClass(dexterity) {
  const modifier = abilityModifier(dexterity);
  return Number.isFinite(modifier) ? 10 + modifier : null;
}

function calculateHitPointMax(constitution, classKey) {
  if (!isNumericValue(constitution)) {
    return null;
  }

  const hitDie = readNumber(getDefinition("classes", classKey)?.hitDie, 8);
  return Math.max(1, hitDie + abilityModifier(constitution));
}

function normalizeHitPoints(hitPoints, constitution, classKey) {
  const max = calculateHitPointMax(constitution, classKey);
  if (!Number.isFinite(max)) {
    return { current: null, max: null };
  }

  const previousMax = readNullableNumber(hitPoints?.max);
  if (previousMax !== max) {
    return { current: max, max };
  }

  const current = clamp(readNumber(hitPoints?.current, max), 0, max);
  return { current, max };
}

function migrateLegacyStats(stats = {}) {
  return Object.entries(LEGACY_STAT_MAP).reduce((migrated, [legacyStat, nextStat]) => {
    if (isNumericValue(stats[legacyStat]) && !isNumericValue(stats[nextStat])) {
      migrated[nextStat] = 10 + Number(stats[legacyStat]);
    }
    return migrated;
  }, {});
}

function formatRaceBonuses(hero) {
  const entries = hero.raceBonusEntries();
  if (entries.length === 0) {
    return "no ability-score bonuses";
  }

  return entries.map(([attribute, bonus]) => `${formatSigned(bonus)} ${getAbilityDefinition(attribute).shortLabel}`).join(", ");
}

function raceBonusMap(hero) {
  return ATTRIBUTE_KEYS.reduce((bonuses, attribute) => {
    bonuses[attribute] = hero.raceBonus(attribute);
    return bonuses;
  }, {});
}

function formatScoreMap(scores) {
  return ATTRIBUTE_KEYS.map((attribute) => `${attribute}:${stringifyValue(scores[attribute])}`).join("|");
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatStatLabel(value) {
  return value
    .split(/(?=[A-Z])|-/)
    .map((part) => capitalize(part))
    .join(" ");
}

function formatModifier(modifier) {
  if (!Number.isFinite(Number(modifier))) {
    return "--";
  }

  return `${modifier >= 0 ? "+" : ""}${modifier}`;
}

function formatSigned(value) {
  return `${Number(value) >= 0 ? "+" : ""}${Number(value)}`;
}

function formatScore(score) {
  return isNumericValue(score) ? String(score) : "--";
}

function readNullableNumber(value) {
  return isNumericValue(value) ? Number(value) : null;
}

function readNumber(value, fallback) {
  return isNumericValue(value) ? Number(value) : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function stringifyValue(value) {
  return isNumericValue(value) || value ? String(value) : "";
}

function isNumericValue(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
}

const elements = {
  gameLayout: document.querySelector("#gameLayout"),
  scenePanel: document.querySelector(".scene-panel"),
  eventLog: document.querySelector("#eventLog"),
  builderPanel: document.querySelector("#builderPanel"),
  choiceList: document.querySelector("#choiceList"),
  characterSheet: document.querySelector("#characterSheet"),
  sheetSummary: document.querySelector("#sheetSummary"),
  heroName: document.querySelector("#heroName"),
  heroLevel: document.querySelector("#heroLevel"),
  identityRace: document.querySelector("#identityRace"),
  identityOrigin: document.querySelector("#identityOrigin"),
  identityBackground: document.querySelector("#identityBackground"),
  identityClass: document.querySelector("#identityClass"),
  statStrength: document.querySelector("#statStrength"),
  statIntelligence: document.querySelector("#statIntelligence"),
  statWisdom: document.querySelector("#statWisdom"),
  statDexterity: document.querySelector("#statDexterity"),
  statConstitution: document.querySelector("#statConstitution"),
  statCharisma: document.querySelector("#statCharisma"),
  modStrength: document.querySelector("#modStrength"),
  modIntelligence: document.querySelector("#modIntelligence"),
  modWisdom: document.querySelector("#modWisdom"),
  modDexterity: document.querySelector("#modDexterity"),
  modConstitution: document.querySelector("#modConstitution"),
  modCharisma: document.querySelector("#modCharisma"),
  armorClass: document.querySelector("#armorClass"),
  hitPoints: document.querySelector("#hitPoints"),
  statGold: document.querySelector("#statGold"),
  saveButton: document.querySelector("#saveButton"),
  newGameButton: document.querySelector("#newGameButton"),
  viewToggleButton: document.querySelector("#viewToggleButton"),
  inventoryList: document.querySelector("#inventoryList"),
  logPixel: document.querySelector("#logPixel"),
};

window.PhoenixAdventure = {
  Adventure,
  Adventurer,
  AdventureGame,
  Scene,
};

bootPhoenixAdventure();

async function bootPhoenixAdventure() {
  try {
    const definition = await (window.PhoenixDataReady || Promise.resolve(window.PHOENIX_ADVENTURE));
    const game = new AdventureGame(new Adventure(definition), elements);
    window.PhoenixGame = game;
    game.start();
  } catch (error) {
    renderStartupError(error);
  }
}

function renderStartupError(error) {
  if (elements.eventLog) {
    const card = document.createElement("article");
    card.className = "event-card is-current";
    const copy = document.createElement("div");
    copy.className = "event-copy";
    copy.append(
      createElement("p", "Startup"),
      createElement("h2", "The adventure data could not load."),
      createElement("span", error instanceof Error ? error.message : String(error)),
    );
    card.append(copy);
    elements.eventLog.replaceChildren(card);
  }

  if (elements.choiceList) {
    elements.choiceList.replaceChildren();
  }
}
