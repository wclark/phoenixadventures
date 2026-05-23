const STORAGE_KEY = "phoenix-adventures-save";
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
    this.name = profile.name || "Ash";
    this.level = Number(profile.level) || 1;
    this.stats = {
      might: 0,
      wits: 0,
      spirit: 0,
      gold: 0,
      ...(profile.stats || {}),
    };
    this.inventory = Array.isArray(profile.inventory) ? [...profile.inventory] : [];
  }

  applyEffects(effects = {}) {
    this.applyStatDeltas(effects.statDeltas);
    this.addItems(effects.addItems);
    this.removeItems(effects.removeItems);
  }

  applyStatDeltas(statDeltas = {}) {
    Object.entries(statDeltas).forEach(([stat, delta]) => {
      const current = Number(this.stats[stat]) || 0;
      const nextValue = current + Number(delta);
      this.stats[stat] = stat === "gold" ? Math.max(0, nextValue) : nextValue;
    });
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
    const sides = check.sides || 20;
    const roll = Math.floor(Math.random() * sides) + 1;
    const modifier = Number(this.stats[check.stat]) || 0;
    const total = roll + modifier;

    return {
      stat: check.stat,
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
      if ((Number(this.stats[stat]) || 0) < Number(minimum)) {
        problems.push(`Needs ${minimum} ${capitalize(stat)}`);
      }
    });

    return problems;
  }

  toJSON() {
    return {
      name: this.name,
      level: this.level,
      stats: { ...this.stats },
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
          ...this.playerTemplate.stats,
          ...(saved.stats || {}),
        },
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
    this.elements.statMight.textContent = hero.stats.might;
    this.elements.statWits.textContent = hero.stats.wits;
    this.elements.statSpirit.textContent = hero.stats.spirit;
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

const elements = {
  sceneImage: document.querySelector("#sceneImage"),
  sceneKicker: document.querySelector("#sceneKicker"),
  sceneTitle: document.querySelector("#sceneTitle"),
  sceneText: document.querySelector("#sceneText"),
  choiceList: document.querySelector("#choiceList"),
  heroName: document.querySelector("#heroName"),
  heroLevel: document.querySelector("#heroLevel"),
  statMight: document.querySelector("#statMight"),
  statWits: document.querySelector("#statWits"),
  statSpirit: document.querySelector("#statSpirit"),
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
