const STORAGE_KEY = "phoenix-adventures-save";
const ATTRIBUTE_KEYS = ["strength", "intelligence", "wisdom", "dexterity", "constitution", "charisma"];
const LEGACY_STAT_MAP = {
  might: "strength",
  wits: "wisdom",
  spirit: "wisdom",
};
const SCENE_ALIASES = {
  camp: "sracs-tavern",
  mapRoom: "ruin-map",
  ruins: "north-hall",
  courtyard: "central-courtyard",
  shrine: "roadside-shrine",
  merchant: "tavern-yard",
  tournament: "tournament-grounds",
  emberGate: "cinderwake-threshold",
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
    const rolledStats = rollAbilityScores();

    this.name = profile.name || "Ash";
    this.level = readNumber(profile.level, 1);
    this.stats = ATTRIBUTE_KEYS.reduce((stats, attribute) => {
      stats[attribute] = readNumber(incomingStats[attribute], rolledStats[attribute]);
      return stats;
    }, {});
    this.stats.gold = readNumber(incomingStats.gold ?? profile.gold, 0);
    this.armorClass = readNumber(profile.armorClass, calculateArmorClass(this.stats.dexterity));
    this.hitPoints = normalizeHitPoints(profile.hitPoints, this.stats.constitution);
    this.inventory = Array.isArray(profile.inventory) ? [...profile.inventory] : [];
  }

  applyEffects(effects = {}) {
    this.applyStatDeltas(effects.statDeltas);
    this.applyHitPointDelta(effects.hitPointDelta);
    this.applyArmorClassDelta(effects.armorClassDelta);
    this.addItems(effects.addItems);
    this.removeItems(effects.removeItems);
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
    if (!Number.isFinite(Number(delta))) {
      return;
    }

    this.hitPoints.current = clamp(this.hitPoints.current + Number(delta), 0, this.hitPoints.max);
  }

  applyArmorClassDelta(delta) {
    if (!Number.isFinite(Number(delta))) {
      return;
    }

    this.armorClass += Number(delta);
  }

  addItems(items = []) {
    items.forEach((item) => {
      if (!this.inventory.includes(item)) {
        this.inventory.push(item);
      }
    });
  }

  removeItems(items = []) {
    if (items.length === 0) {
      return;
    }

    this.inventory = this.inventory.filter((item) => !items.includes(item));
  }

  rollCheck(check) {
    const stat = LEGACY_STAT_MAP[check.stat] || check.stat;
    const sides = check.sides || 20;
    const roll = Math.floor(Math.random() * sides) + 1;
    const modifier = this.checkModifier(stat);
    const total = roll + modifier;

    return {
      stat,
      target: check.target,
      roll,
      modifier,
      total,
      success: total >= check.target,
    };
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

    return problems;
  }

  checkModifier(stat) {
    return ATTRIBUTE_KEYS.includes(stat) ? abilityModifier(this.stats[stat]) : Number(this.stats[stat]) || 0;
  }

  toJSON() {
    return {
      name: this.name,
      level: this.level,
      stats: { ...this.stats },
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
      internalRolls: [],
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
        name: playerData.name || defaultState.player.name,
        level: playerData.level || defaultState.player.level,
        stats: {
          ...defaultState.player.stats,
          ...(playerData.stats || {}),
        },
        armorClass: playerData.armorClass,
        hitPoints: playerData.hitPoints,
        inventory: Array.isArray(playerData.inventory) ? playerData.inventory : defaultState.player.inventory,
      }).toJSON(),
      history: Array.isArray(saved.history) ? saved.history : defaultState.history,
      internalRolls: Array.isArray(saved.internalRolls) ? saved.internalRolls.slice(-30) : [],
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
        armorClass: saved.armorClass,
        hitPoints: saved.hitPoints,
        inventory: Array.isArray(saved.inventory) ? saved.inventory : this.playerTemplate.inventory,
      }).toJSON(),
      history: Array.isArray(saved.log) ? saved.log : [...this.openingHistory],
      internalRolls: [],
    };
  }

  resolveSceneId(sceneId) {
    const resolvedSceneId = SCENE_ALIASES[sceneId] || sceneId;
    return this.scenes.has(resolvedSceneId) ? resolvedSceneId : this.startSceneId;
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
      hero.name = this.elements.heroName.value.trim() || this.adventure.playerTemplate.name;
      this.state.player = hero.toJSON();
      this.saveState();
    });

    this.elements.saveButton.addEventListener("click", () => {
      this.saveState();
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
    this.elements.sceneText.textContent = scene.text;
    this.elements.heroName.value = hero.name;
    this.elements.heroLevel.textContent = `Level ${hero.level}`;
    this.elements.statStrength.textContent = hero.stats.strength;
    this.elements.statIntelligence.textContent = hero.stats.intelligence;
    this.elements.statWisdom.textContent = hero.stats.wisdom;
    this.elements.statDexterity.textContent = hero.stats.dexterity;
    this.elements.statConstitution.textContent = hero.stats.constitution;
    this.elements.statCharisma.textContent = hero.stats.charisma;
    this.elements.modStrength.textContent = formatModifier(abilityModifier(hero.stats.strength));
    this.elements.modIntelligence.textContent = formatModifier(abilityModifier(hero.stats.intelligence));
    this.elements.modWisdom.textContent = formatModifier(abilityModifier(hero.stats.wisdom));
    this.elements.modDexterity.textContent = formatModifier(abilityModifier(hero.stats.dexterity));
    this.elements.modConstitution.textContent = formatModifier(abilityModifier(hero.stats.constitution));
    this.elements.modCharisma.textContent = formatModifier(abilityModifier(hero.stats.charisma));
    this.elements.armorClass.textContent = hero.armorClass;
    this.elements.hitPoints.textContent = `${hero.hitPoints.current}/${hero.hitPoints.max}`;
    this.elements.statGold.textContent = hero.stats.gold;

    this.renderChoices(scene.choices, hero);
    renderList(this.elements.inventoryList, hero.inventory);
  }

  renderChoices(choices, hero) {
    this.elements.choiceList.replaceChildren(
      ...choices.map((choice) => {
        const button = document.createElement("button");
        const problems = hero.requirementProblems(choice.requires);

        button.type = "button";
        button.textContent = choice.label;
        button.disabled = problems.length > 0;
        button.title = problems.join("; ");
        button.addEventListener("click", () => this.choose(choice));

        return button;
      }),
    );
  }

  choose(choice) {
    const hero = new Adventurer(this.state.player);

    if (hero.requirementProblems(choice.requires).length > 0) {
      return;
    }

    let nextSceneId = choice.nextSceneId || this.state.sceneId;

    if (choice.check) {
      const result = hero.rollCheck(choice.check);
      const outcome = result.success ? choice.check.success : choice.check.failure;

      this.recordInternalRoll(choice, result);
      hero.applyEffects(outcome?.effects);
      this.recordHistory(outcome?.effects?.history);
      nextSceneId = outcome?.nextSceneId || nextSceneId;
    } else {
      hero.applyEffects(choice.effects);
      this.recordHistory(choice.effects?.history);
    }

    this.state.player = hero.toJSON();
    this.state.sceneId = this.adventure.resolveSceneId(nextSceneId);
    this.saveState();
    this.render();
  }

  recordInternalRoll(choice, result) {
    this.state.internalRolls = [
      ...(this.state.internalRolls || []),
      {
        sceneId: this.state.sceneId,
        choiceId: choice.id,
        at: new Date().toISOString(),
        ...result,
      },
    ].slice(-30);
  }

  recordHistory(entry) {
    if (!entry) {
      return;
    }

    this.state.history = [...(this.state.history || []), entry].slice(-50);
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
}

function renderList(list, values) {
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
  return Math.floor((Number(score) - 10) / 2);
}

function formatModifier(modifier) {
  return `${modifier >= 0 ? "+" : ""}${modifier}`;
}

function calculateArmorClass(dexterity) {
  return 10 + abilityModifier(dexterity);
}

function normalizeHitPoints(hitPoints, constitution) {
  const max = readNumber(hitPoints?.max, Math.max(1, 8 + abilityModifier(constitution)));
  const current = clamp(readNumber(hitPoints?.current, max), 0, max);

  return { current, max };
}

function migrateLegacyStats(stats = {}) {
  return Object.entries(LEGACY_STAT_MAP).reduce((migrated, [legacyStat, nextStat]) => {
    if (Number.isFinite(Number(stats[legacyStat])) && !Number.isFinite(Number(stats[nextStat]))) {
      migrated[nextStat] = 10 + Number(stats[legacyStat]);
    }
    return migrated;
  }, {});
}

function readNumber(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

const elements = {
  sceneImage: document.querySelector("#sceneImage"),
  sceneKicker: document.querySelector("#sceneKicker"),
  sceneTitle: document.querySelector("#sceneTitle"),
  sceneText: document.querySelector("#sceneText"),
  choiceList: document.querySelector("#choiceList"),
  heroName: document.querySelector("#heroName"),
  heroLevel: document.querySelector("#heroLevel"),
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
};

window.PhoenixAdventure = {
  Adventure,
  Adventurer,
  AdventureGame,
  Scene,
};

const game = new AdventureGame(new Adventure(window.PHOENIX_ADVENTURE), elements);
game.start();
