const STORAGE_KEY = "phoenix-adventures-save";

const scenes = {
  camp: {
    kicker: "Camp at Ashfall Road",
    title: "The road waits for a decision.",
    image: "assets/scene-camp.svg",
    text:
      "Your fire burns low beside the old trade road. Somewhere past the black pines, a bell rings from a ruin that should have no living keeper.",
    choices: [
      { label: "Follow the bell toward the ruins", next: "ruins", log: "Followed the bell into the old forest." },
      { label: "Search the roadside shrine", next: "shrine", log: "Stopped at the roadside shrine." },
      { label: "Question the hooded merchant", next: "merchant", log: "Shared a fire with the hooded merchant." },
      { label: "Scout the treeline", next: "treeline", stat: "wits", target: 11 },
    ],
  },
  ruins: {
    kicker: "Moonlit Ruins",
    title: "A bronze bell swings without wind.",
    image: "assets/scene-camp.svg",
    text:
      "Stone birds watch from a broken arch. The bell rope is braided with red thread, and the dust beneath it has been disturbed by fresh tracks.",
    choices: [
      { label: "Pull the bell rope", next: "emberGate", stat: "spirit", target: 12 },
      { label: "Track the fresh footprints", next: "treeline", stat: "wits", target: 10 },
      { label: "Return to camp", next: "camp" },
    ],
  },
  shrine: {
    kicker: "Roadside Shrine",
    title: "An offering bowl glows under old ash.",
    image: "assets/scene-camp.svg",
    text:
      "The shrine is cracked but warm to the touch. A phoenix sigil flashes once when you brush away the dust.",
    choices: [
      { label: "Take the ember charm", next: "camp", item: "Ember Charm", log: "Recovered an ember charm." },
      { label: "Leave a gold coin", next: "camp", gold: -1, spirit: 1, log: "Left an offering at the shrine." },
    ],
  },
  merchant: {
    kicker: "Ashfall Road",
    title: "The merchant knows the ruin by another name.",
    image: "assets/scene-camp.svg",
    text:
      "He calls it Cinderwake Keep and will trade a map for five gold. His pack smells faintly of rain, iron, and cedar smoke.",
    choices: [
      { label: "Buy the map", next: "camp", gold: -5, item: "Cinderwake Map", log: "Bought a map to Cinderwake Keep." },
      { label: "Decline and return to watch", next: "camp" },
    ],
  },
  treeline: {
    kicker: "Black Pine Verge",
    title: "Something huge moved here before dusk.",
    image: "assets/scene-camp.svg",
    text:
      "Branches hang snapped above your head. In the mud, claw marks curve around a feather made of cooling ash.",
    choices: [
      { label: "Pocket the ash feather", next: "camp", item: "Ash Feather", log: "Found an ash feather near the pines." },
      { label: "Press deeper into the pines", next: "emberGate", stat: "might", target: 13 },
      { label: "Return to camp", next: "camp" },
    ],
  },
  emberGate: {
    kicker: "Cinderwake Threshold",
    title: "The hidden gate opens like an eye.",
    image: "assets/scene-camp.svg",
    text:
      "Beyond the gate, red light pulses through a buried hall. This is where the first real encounter will live as the game grows.",
    choices: [
      { label: "Mark this place in the quest log", next: "camp", log: "Discovered the gate beneath Cinderwake Keep." },
      { label: "Rest and prepare", next: "camp" },
    ],
  },
};

const defaultState = {
  heroName: "Ash",
  level: 1,
  scene: "camp",
  lastRoll: null,
  stats: {
    might: 2,
    wits: 2,
    spirit: 3,
    gold: 8,
  },
  inventory: ["Torch", "Travel Rations"],
  log: ["Reached Ashfall Road."],
};

let state = loadState();

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
  dieFace: document.querySelector("#dieFace"),
  lastRoll: document.querySelector("#lastRoll"),
  rollButton: document.querySelector("#rollButton"),
  saveButton: document.querySelector("#saveButton"),
  newGameButton: document.querySelector("#newGameButton"),
  inventoryList: document.querySelector("#inventoryList"),
  questLog: document.querySelector("#questLog"),
};

elements.heroName.addEventListener("input", () => {
  state.heroName = elements.heroName.value.trim() || "Ash";
  saveState();
});

elements.rollButton.addEventListener("click", () => {
  rollDie();
  saveState();
  render();
});

elements.saveButton.addEventListener("click", () => {
  saveState();
  flashButton(elements.saveButton, "Saved");
});

elements.newGameButton.addEventListener("click", () => {
  state = clone(defaultState);
  saveState();
  render();
});

render();

function render() {
  const scene = scenes[state.scene] || scenes.camp;

  elements.sceneImage.src = scene.image;
  elements.sceneKicker.textContent = scene.kicker;
  elements.sceneTitle.textContent = scene.title;
  elements.sceneText.textContent = scene.text;
  elements.heroName.value = state.heroName;
  elements.heroLevel.textContent = `Level ${state.level}`;
  elements.statMight.textContent = state.stats.might;
  elements.statWits.textContent = state.stats.wits;
  elements.statSpirit.textContent = state.stats.spirit;
  elements.statGold.textContent = state.stats.gold;
  elements.dieFace.textContent = state.lastRoll ?? "20";
  elements.lastRoll.textContent = state.lastRoll ? `Last roll ${state.lastRoll}` : "d20 ready";

  renderChoices(scene.choices);
  renderList(elements.inventoryList, state.inventory);
  renderLog();
}

function renderChoices(choices) {
  elements.choiceList.replaceChildren(
    ...choices.map((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = choice.label;
      button.addEventListener("click", () => choose(choice));
      return button;
    }),
  );
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

function renderLog() {
  elements.questLog.replaceChildren(
    ...state.log.slice(-5).map((entry) => {
      const item = document.createElement("li");
      item.textContent = entry;
      return item;
    }),
  );
}

function choose(choice) {
  const result = choice.stat ? resolveCheck(choice.stat, choice.target) : null;

  if (result) {
    state.log.push(
      `${capitalize(choice.stat)} check ${result.total} vs ${choice.target}: ${result.success ? "success" : "setback"}.`,
    );
  }

  if (!result || result.success) {
    applyChoiceRewards(choice);
    state.scene = choice.next;
  } else {
    state.stats.gold = Math.max(0, state.stats.gold - 1);
    state.log.push("The attempt costs time and a little coin.");
  }

  saveState();
  render();
}

function resolveCheck(stat, target) {
  const roll = rollDie();
  const total = roll + state.stats[stat];
  return {
    roll,
    total,
    success: total >= target,
  };
}

function rollDie() {
  state.lastRoll = Math.floor(Math.random() * 20) + 1;
  return state.lastRoll;
}

function applyChoiceRewards(choice) {
  if (choice.item && !state.inventory.includes(choice.item)) {
    state.inventory.push(choice.item);
  }

  if (choice.gold) {
    state.stats.gold = Math.max(0, state.stats.gold + choice.gold);
  }

  if (choice.spirit) {
    state.stats.spirit += choice.spirit;
  }

  if (choice.log) {
    state.log.push(choice.log);
  }
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved ? { ...clone(defaultState), ...saved, stats: { ...defaultState.stats, ...saved.stats } } : clone(defaultState);
  } catch {
    return clone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function flashButton(button, label) {
  const original = button.textContent;
  button.textContent = label;
  window.setTimeout(() => {
    button.textContent = original;
  }, 900);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
