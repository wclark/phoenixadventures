const STORAGE_KEY = "phoenix-adventures-save";
const TRACKING_VERSION = "20260619-1";
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
    this.text = definition.text;
    this.choices = definition.choices || [];
  }
}

class Adventurer {
  constructor(profile = {}) {
    const incomingStats = profile.stats || {};

    this.name = profile.name || "";
    this.level = readNumber(profile.level, 1);
    this.stats = ATTRIBUTE_KEYS.reduce((stats, attribute) => {
      stats[attribute] = readNullableNumber(incomingStats[attribute]);
      return stats;
    }, {});
    this.stats.gold = readNumber(incomingStats.gold ?? profile.gold, 0);
    this.race = profile.race || "";
    this.origin = profile.origin || "";
    this.background = profile.background || "";
    this.className = profile.className || "";
    this.spells = Array.isArray(profile.spells) ? [...profile.spells] : [];
    this.provisions = Array.isArray(profile.provisions) ? [...profile.provisions] : [];
    this.instrument = profile.instrument || "";
    this.armor = profile.armor || "";
    this.weapon = profile.weapon || "";
    this.armorClass = readNullableNumber(profile.armorClass);
    this.hitPoints = normalizeHitPoints(profile.hitPoints, this.stats.constitution);
    this.inventory = Array.isArray(profile.inventory) ? [...profile.inventory] : [];

    this.refreshDerivedVitals();
  }

  hasAbilityScores() {
    return ATTRIBUTE_KEYS.every((attribute) => Number.isFinite(this.stats[attribute]));
  }

  rollAbilities() {
    this.stats = {
      ...this.stats,
      ...rollAbilityScores(),
    };
    this.armorClass = calculateArmorClass(this.stats.dexterity);
    this.hitPoints = normalizeHitPoints(null, this.stats.constitution);
  }

  refreshDerivedVitals() {
    if (!this.hasAbilityScores()) {
      this.armorClass = null;
      this.hitPoints = { current: null, max: null };
      return;
    }

    this.armorClass = readNumber(this.armorClass, calculateArmorClass(this.stats.dexterity));
    this.hitPoints = normalizeHitPoints(this.hitPoints, this.stats.constitution);
  }

  applyEffects(effects = {}) {
    if (effects.resetCharacter) {
      const replacement = new Adventurer({ stats: { gold: 12 } });
      Object.assign(this, replacement);
    }

    if (effects.rollAbilities) {
      this.rollAbilities();
    }

    this.applyCharacterFields(effects.setCharacter);
    this.applyStatDeltas(effects.statDeltas);
    this.applyHitPointDelta(effects.hitPointDelta);
    this.applyArmorClassDelta(effects.armorClassDelta);
    this.addItems(effects.addItems);
  }

  applyCharacterFields(fields = {}) {
    Object.entries(fields).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        this[key] = [...value];
      } else {
        this[key] = value;
      }
    });
  }

  applyStatDeltas(statDeltas = {}) {
    Object.entries(statDeltas).forEach(([stat, delta]) => {
      const normalizedStat = LEGACY_STAT_MAP[stat] || stat;
      const current = Number(this.stats[normalizedStat]) || 0;
      const nextValue = current + Number(delta);
      this.stats[normalizedStat] = normalizedStat === "gold" ? Math.max(0, nextValue) : nextValue;
    });
  }

  applyHitPointDelta(delta) {
    if (!isNumericValue(delta) || !isNumericValue(this.hitPoints.current)) {
      return;
    }

    this.hitPoints.current = clamp(this.hitPoints.current + Number(delta), 0, this.hitPoints.max);
  }

  applyArmorClassDelta(delta) {
    if (!isNumericValue(delta)) {
      return;
    }

    this.armorClass = readNumber(this.armorClass, calculateArmorClass(this.stats.dexterity)) + Number(delta);
  }

  addItems(items = []) {
    items.forEach((item) => {
      if (!this.inventory.includes(item)) {
        this.inventory.push(item);
      }
    });
  }

  requirementProblems(requirements = {}) {
    const problems = [];
    const missingItems = (requirements.items || []).filter((item) => !this.inventory.includes(item));

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
      stats: { ...this.stats },
      race: this.race,
      origin: this.origin,
      background: this.background,
      className: this.className,
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
      sceneId: this.startSceneId,
      player: new Adventurer(this.playerTemplate).toJSON(),
      history: [...this.openingHistory],
    };
  }

  normalizeState(saved) {
    if (!saved || typeof saved !== "object") {
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
    };
  }

  normalizeLegacyState(saved) {
    return {
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
    this.elements.heroName.addEventListener("input", () => {
      const hero = new Adventurer(this.state.player);
      hero.name = this.elements.heroName.value.trim();
      this.state.player = hero.toJSON();
      this.saveState();
      this.updateTrackingPixel("name");
      this.renderIdentity(hero);
    });

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
  }

  render() {
    const scene = this.adventure.getScene(this.state.sceneId);
    const hero = new Adventurer(this.state.player);

    this.elements.sceneImage.src = scene.image;
    this.elements.sceneImage.alt = scene.imageAlt;
    this.elements.sceneKicker.textContent = scene.kicker;
    this.elements.sceneTitle.textContent = scene.title;
    this.elements.sceneText.textContent = this.interpolate(scene.text, hero);
    this.elements.heroName.value = hero.name;
    this.elements.heroLevel.textContent = `Level ${hero.level}`;

    this.renderIdentity(hero);
    this.renderAbilityScores(hero);
    this.renderChoices(scene.choices, hero);
    renderList(this.elements.inventoryList, hero.inventory);
    this.updateTrackingPixel("render");
  }

  renderIdentity(hero) {
    const name = hero.name || "Unnamed";
    this.elements.identityRace.textContent = hero.race || "Unchosen";
    this.elements.identityOrigin.textContent = hero.origin ? `${name} of the ${hero.origin}` : "Undeclared";
    this.elements.identityBackground.textContent = hero.background || "Unchosen";
    this.elements.identityClass.textContent = hero.className || "Unregistered";
  }

  renderAbilityScores(hero) {
    ATTRIBUTE_KEYS.forEach((attribute) => {
      const score = hero.stats[attribute];
      const scoreElement = this.elements[`stat${capitalize(attribute)}`];
      const modifierElement = this.elements[`mod${capitalize(attribute)}`];

      scoreElement.textContent = formatScore(score);
      modifierElement.textContent = formatModifier(abilityModifier(score));
    });

    this.elements.armorClass.textContent = formatScore(hero.armorClass);
    this.elements.hitPoints.textContent =
      Number.isFinite(hero.hitPoints.current) && Number.isFinite(hero.hitPoints.max)
        ? `${hero.hitPoints.current}/${hero.hitPoints.max}`
        : "--";
    this.elements.statGold.textContent = hero.stats.gold;
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
        button.textContent = this.interpolate(choice.label, hero);
        button.disabled = problems.length > 0;
        button.title = problems.join("; ");
        button.addEventListener("click", () => this.choose(choice));

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
      race: hero.race,
      origin: hero.origin,
      background: hero.background,
      class: hero.className,
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

function flashButton(button, label) {
  const original = button.textContent;
  button.textContent = label;
  window.setTimeout(() => {
    button.textContent = original;
  }, 900);
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

function rollAbilityScores() {
  return ATTRIBUTE_KEYS.reduce((stats, attribute) => {
    stats[attribute] = rollAbilityScore();
    return stats;
  }, {});
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

function formatModifier(modifier) {
  if (!Number.isFinite(Number(modifier))) {
    return "--";
  }

  return `${modifier >= 0 ? "+" : ""}${modifier}`;
}

function formatScore(score) {
  return isNumericValue(score) ? String(score) : "--";
}

function calculateArmorClass(dexterity) {
  const modifier = abilityModifier(dexterity);
  return Number.isFinite(modifier) ? 10 + modifier : null;
}

function normalizeHitPoints(hitPoints, constitution) {
  if (!isNumericValue(constitution)) {
    return { current: null, max: null };
  }

  const max = readNumber(hitPoints?.max, Math.max(1, 8 + abilityModifier(constitution)));
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
  sceneImage: document.querySelector("#sceneImage"),
  sceneKicker: document.querySelector("#sceneKicker"),
  sceneTitle: document.querySelector("#sceneTitle"),
  sceneText: document.querySelector("#sceneText"),
  choiceList: document.querySelector("#choiceList"),
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
  inventoryList: document.querySelector("#inventoryList"),
  logPixel: document.querySelector("#logPixel"),
};

window.PhoenixAdventure = {
  Adventure,
  Adventurer,
  AdventureGame,
  Scene,
};

const game = new AdventureGame(new Adventure(window.PHOENIX_ADVENTURE), elements);
game.start();
