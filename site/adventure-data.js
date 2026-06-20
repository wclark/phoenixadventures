/**
 * Data loader and scene assembler for Phoenix Adventures.
 *
 * Character-building content lives in data/game-data.json so races,
 * backgrounds, classes, alignments, proficiencies, and shop inventories can be
 * edited without changing the game engine.
 */

const PHOENIX_DATA_URL = "data/game-data.json?v=20260619-8";

window.PhoenixDataReady = loadPhoenixAdventure();

async function loadPhoenixAdventure() {
  const response = await fetch(PHOENIX_DATA_URL, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Could not load ${PHOENIX_DATA_URL}: ${response.status}`);
  }

  const source = await response.json();
  const adventure = buildPhoenixAdventure(source);
  window.PHOENIX_ADVENTURE = adventure;
  return adventure;
}

function buildPhoenixAdventure(source) {
  const data = {
    ...source,
    races: keyBy(source.races),
    backgrounds: keyBy(source.backgrounds),
    classes: keyBy(source.classes),
  };

  return {
    title: data.title,
    startSceneId: data.startSceneId,
    openingHistory: data.openingHistory || [],
    trackingPixel: data.trackingPixel,
    abilities: data.abilities,
    races: data.races,
    backgrounds: data.backgrounds,
    classes: data.classes,
    alignments: data.alignments || [],
    languages: data.languages || [],
    skills: data.skills || [],
    proficiencies: data.proficiencies || [],
    stores: data.stores || {},
    player: {
      name: "",
      level: 1,
      raceKey: "",
      backgroundKey: "",
      classKey: "",
      abilityPool: [],
      baseScores: {},
      stats: {
        gold: 12,
        ...(data.player?.stats || {}),
      },
      inventory: [...(data.player?.inventory || [])],
    },
    map: {
      image: "assets/campus-ruins-map.svg",
      nodes: [
        { id: "sracs-gate", label: "SRAC'S", sceneId: "sracs-gate", x: 0.74, y: 0.31 },
        { id: "outdoor-bar", label: "Outdoor Bar", sceneId: "outdoor-bar", x: 0.78, y: 0.46 },
        { id: "gymnasium", label: "Gymnasium", sceneId: "gymnasium", x: 0.38, y: 0.76 },
        { id: "main-office", label: "Main Office", sceneId: "main-office", x: 0.42, y: 0.32 },
        { id: "cafeteria", label: "Cafeteria", sceneId: "cafeteria", x: 0.41, y: 0.44 },
        { id: "library", label: "Library", sceneId: "library", x: 0.33, y: 0.28 },
        { id: "music-room", label: "Music Room", sceneId: "music-room", x: 0.31, y: 0.52 },
        { id: "stem-workshops", label: "STEM Workshops", sceneId: "stem-workshops", x: 0.74, y: 0.61 },
      ],
    },
    scenes: buildScenes(data),
  };
}

function buildScenes(data) {
  return [
    {
      id: "sracs-gate",
      mapNodeId: "sracs-gate",
      kicker: "Step 1",
      title: "Start a character at SRAC'S.",
      image: "assets/scene-sracs-tavern.png",
      imageAlt: "SRAC'S tavern, a long fantasy tavern with lantern-lit windows, purple doors, trees, a white fence, and storm clouds overhead.",
      text:
        "This builder walks you through name, race, background, alignment, language, skills, proficiencies, rolled abilities, class, provisions, and starting gear. Each completed choice fills in the character sheet.",
      choices: [
        {
          id: "enter-sracs",
          label: "Begin at the barkeep",
          summary: "Enter your name and choose the people your character comes from.",
          nextSceneId: "barkeep",
          effects: {
            history: "Started character creation at SRAC'S.",
          },
        },
      ],
    },
    {
      id: "barkeep",
      mapNodeId: "sracs-gate",
      kicker: "Race and Origin",
      title: "Name your character, then choose a race.",
      image: "assets/scene-sracs-tavern.png",
      imageAlt: "The lantern-lit exterior of SRAC'S, where the barkeep begins the character ledger.",
      builder: "identity-entry",
      text:
        "The barkeep opens a ledger and asks who has come to SRAC'S. Type your character name below, then choose a race. Race data, bonuses, traits, starting languages, and proficiencies are loaded from the editable JSON file.",
      choices: Object.values(data.races).map((race) => raceChoice(race, data.abilities)),
    },
    {
      id: "outdoor-bar",
      mapNodeId: "outdoor-bar",
      kicker: "Background",
      title: "Pick what your character did before adventuring.",
      image: "assets/scene-courtyard.svg",
      imageAlt: "A ruined central courtyard remade as an outdoor tavern patio.",
      text:
        "At the outdoor tables, strangers ask what you did before the road brought you here. Backgrounds can add skills, languages, proficiencies, and small story items.",
      choices: Object.values(data.backgrounds).map((background) => backgroundChoice(background)),
    },
    optionPickerScene({
      id: "alignment-choice",
      mapNodeId: "outdoor-bar",
      kicker: "Alignment",
      title: "Choose the compass your character follows.",
      image: "assets/scene-courtyard.svg",
      imageAlt: "The SRAC'S outdoor tables under evening light.",
      text:
        "Alignment is a quick signal for how your character tends to make hard choices. It is not a cage, but it gives the sheet a moral heading.",
      source: "alignments",
      field: "alignment",
      mode: "single",
      min: 1,
      max: 1,
      nextSceneId: "language-choice",
      history: "Chose an alignment.",
    }),
    optionPickerScene({
      id: "language-choice",
      mapNodeId: "outdoor-bar",
      kicker: "Languages",
      title: "Choose additional languages.",
      image: "assets/scene-courtyard.svg",
      imageAlt: "A courtyard table scattered with phrasebooks and travel marks.",
      text:
        "Your race and background may already add languages. Choose up to two more that fit the character you are building.",
      source: "languages",
      field: "languages",
      mode: "multi",
      min: 0,
      max: 2,
      append: true,
      nextSceneId: "skill-choice",
      history: "Chose additional languages.",
    }),
    optionPickerScene({
      id: "skill-choice",
      mapNodeId: "outdoor-bar",
      kicker: "Skills",
      title: "Choose two additional skills.",
      image: "assets/scene-courtyard.svg",
      imageAlt: "A courtyard table where adventurers compare talents and stories.",
      text:
        "Skills are the things your character is practiced at doing. Race and background can add some automatically; choose two more areas where your character has training.",
      source: "skills",
      field: "skills",
      mode: "multi",
      min: 2,
      max: 2,
      append: true,
      nextSceneId: "proficiency-choice",
      history: "Chose additional skills.",
    }),
    optionPickerScene({
      id: "proficiency-choice",
      mapNodeId: "outdoor-bar",
      kicker: "Proficiencies",
      title: "Choose practical proficiencies.",
      image: "assets/scene-courtyard.svg",
      imageAlt: "A courtyard table laid with tools, straps, buckles, and practice weapons.",
      text:
        "Proficiencies cover trained gear, tools, armor, and weapon categories. Choose up to two that match how your character handles trouble.",
      source: "proficiencies",
      field: "proficiencies",
      mode: "multi",
      min: 1,
      max: 2,
      append: true,
      nextSceneId: "gymnasium",
      history: "Chose practical proficiencies.",
    }),
    {
      id: "gymnasium",
      mapNodeId: "gymnasium",
      kicker: "Ability Scores",
      title: "Roll six scores, then assign them yourself.",
      image: "assets/scene-tournament-grounds.svg",
      imageAlt: "An athletic ground transformed into a fantasy training arena.",
      builder: "ability-assignment",
      text:
        "The gym rolls six numbers using 4d6, keeping the highest three dice each time. You choose which rolled number goes to each ability. Race modifiers are shown before you confirm.",
      choices: [
        {
          id: "roll-score-pool",
          label: "Roll or reroll six ability scores",
          summary: "Creates a fresh pool of six rolled scores. Assignments are cleared when you reroll.",
          details: ["Method: roll 4d6, drop the lowest die", "You can assign the scores in any order", "Race bonuses apply after assignment"],
          effects: {
            rollAbilityPool: true,
            history: "Rolled a fresh set of ability scores.",
          },
        },
        {
          id: "continue-after-scores",
          label: "Continue to class registration",
          summary: "Available after all six rolled scores are assigned.",
          nextSceneId: "main-office",
          requires: { abilityScoresAssigned: true },
        },
      ],
    },
    {
      id: "main-office",
      mapNodeId: "main-office",
      kicker: "Class",
      title: "Register a class for the character.",
      image: "assets/scene-courtyard.svg",
      imageAlt: "A ruined hall office with warm light, registers, and class banners.",
      text:
        "Classes do not add ability-score bonuses, but they set hit die, suggest important abilities, and can add starting proficiencies, skills, and gear from JSON.",
      choices: Object.values(data.classes).map((characterClass) => classChoice(characterClass, data.abilities)),
    },
    {
      id: "cafeteria",
      mapNodeId: "cafeteria",
      kicker: "Provisions",
      title: "Pick a provision bundle.",
      image: "assets/scene-courtyard.svg",
      imageAlt: "A warm ruined hall serving counter stocked with fantasy provisions.",
      text:
        "The cafeteria stocks travel kits and practical bundles. This inventory is loaded from the editable store data.",
      choices: storeChoices(data.stores.cafeteria, "study-choice"),
    },
    {
      id: "study-choice",
      mapNodeId: "cafeteria",
      kicker: "Elective",
      title: "Choose the next builder station.",
      image: "assets/campus-ruins-map.svg",
      imageAlt: "A simplified fantasy campus map of Falconrise Keep.",
      text:
        "Spellcasting classes can visit the library. Bards can visit the music room. Everyone can go straight to the STEM workshops for equipment.",
      choices: [
        {
          id: "go-library-caster",
          label: "Visit the Library for spells",
          summary: "Available to Wizard, Paladin, Ranger, and Bard characters.",
          nextSceneId: "library",
          requires: { character: { className: ["Wizard", "Paladin", "Ranger", "Bard"] } },
          hideUnavailable: true,
        },
        {
          id: "go-music-room",
          label: "Visit the Music Room",
          summary: "Available to Bard characters.",
          nextSceneId: "music-room",
          requires: { character: { className: "Bard" } },
          hideUnavailable: true,
        },
        {
          id: "go-stem-workshops",
          label: "Head to the STEM workshops",
          summary: "Skip electives and choose starting equipment.",
          nextSceneId: "stem-workshops",
        },
      ],
    },
    {
      id: "library",
      mapNodeId: "library",
      kicker: "Spells",
      title: "Choose an opening spell bundle.",
      image: "assets/scene-courtyard.svg",
      imageAlt: "A ruined school library transformed into a candlelit spell archive.",
      text:
        "For now, spells are bundled to keep character creation quick. Later we can break this into individual spell picks with class-specific limits.",
      choices: storeChoices(data.stores.library, "stem-workshops"),
    },
    {
      id: "music-room",
      mapNodeId: "music-room",
      kicker: "Bard Kit",
      title: "Pick the sound your bard carries.",
      image: "assets/scene-courtyard.svg",
      imageAlt: "A ruined school music room with instruments, banners, and candlelight.",
      text:
        "Bards use Charisma first, but their instrument can signal whether they charm, move, or rally people.",
      choices: storeChoices(data.stores.musicRoom, "stem-workshops"),
    },
    {
      id: "stem-workshops",
      mapNodeId: "stem-workshops",
      kicker: "Gear",
      title: "Buy starting armor and weapons.",
      image: "assets/scene-tournament-grounds.svg",
      imageAlt: "Training courts transformed into tinkerer workshops full of tools, racks, and gear.",
      text:
        "Gear choices spend gold and set armor and weapon fields on the sheet. Armor Class starts from 10 plus Dexterity modifier, then gear can improve it.",
      choices: storeChoices(data.stores.stemWorkshops, "character-complete"),
    },
    {
      id: "character-complete",
      mapNodeId: "sracs-gate",
      kicker: "Complete",
      title: "Review the finished character.",
      image: "assets/scene-sracs-tavern.png",
      imageAlt: "SRAC'S tavern glowing under storm clouds as a new adventurer prepares to depart.",
      builder: "character-review",
      text:
        "The sheet now has name, race, background, alignment, languages, skills, proficiencies, ability scores, class, provisions, and starting gear. The final pixel request includes those values in the query string.",
      choices: [
        {
          id: "review-map",
          label: "Review the builder route",
          summary: "See the campus stations that produced this sheet.",
          nextSceneId: "character-map",
        },
        {
          id: "restart-generator",
          label: "Start a new character",
          summary: "Clear the sheet and begin again at SRAC'S.",
          nextSceneId: "sracs-gate",
          effects: {
            resetCharacter: true,
            history: "Returned to the SRAC'S gate to begin again.",
          },
        },
      ],
    },
    {
      id: "character-map",
      mapNodeId: "sracs-gate",
      kicker: "Route",
      title: "The campus stations map to character-builder steps.",
      image: "assets/campus-ruins-map.svg",
      imageAlt: "A simplified fantasy map showing SRAC'S, the courtyard, halls, gym, fields, and workshops.",
      text:
        "SRAC'S sets name and race. The outdoor bar sets background, alignment, languages, skills, and proficiencies. The gym rolls and assigns abilities. The main office registers class. The cafeteria, library, music room, and STEM workshops fill in equipment and options.",
      choices: [
        {
          id: "return-complete",
          label: "Return to the completed sheet",
          nextSceneId: "character-complete",
        },
      ],
    },
  ];
}

function optionPickerScene({ id, mapNodeId, kicker, title, image, imageAlt, text, source, field, mode, min, max, append, nextSceneId, history }) {
  return {
    id,
    mapNodeId,
    kicker,
    title,
    image,
    imageAlt,
    text,
    builder: "option-picker",
    builderConfig: {
      source,
      field,
      mode,
      min,
      max,
      append,
      nextSceneId,
      history,
    },
    choices: [],
  };
}

function raceChoice(race, abilities) {
  return {
    id: `race-${race.key}`,
    label: race.name,
    summary: race.summary,
    meta: {
      "Ability bonuses": formatBonuses(race.abilityBonuses, abilities),
      "Good fits": race.bestFor,
    },
    details: [race.advice, `Traits: ${(race.traits || []).join(", ")}`].filter(Boolean),
    nextSceneId: "outdoor-bar",
    effects: {
      setCharacter: { raceKey: race.key },
      addLanguages: race.languages,
      addSkills: race.skills,
      addProficiencies: race.proficiencies,
      addItems: race.items,
      history: `Chose ${race.name} from ${race.origin}.`,
    },
  };
}

function backgroundChoice(background) {
  return {
    id: `background-${background.key}`,
    label: background.name,
    summary: background.summary,
    meta: {
      "Skill focus": background.skillFocus,
      Items: (background.items || []).join(", "),
    },
    details: [background.choiceText, ...(background.details || [])].filter(Boolean),
    nextSceneId: "alignment-choice",
    effects: {
      setCharacter: { backgroundKey: background.key },
      addLanguages: background.languages,
      addSkills: background.skills,
      addProficiencies: background.proficiencies,
      addItems: background.items,
      history: `Chose the ${background.name} background.`,
    },
  };
}

function classChoice(characterClass, abilities) {
  return {
    id: `class-${characterClass.key}`,
    label: characterClass.name,
    summary: characterClass.summary,
    meta: {
      "Primary abilities": formatPrimaryAbilities(characterClass.primaryAbilities, abilities),
      "Hit die": `d${characterClass.hitDie}`,
    },
    details: characterClass.details || [],
    nextSceneId: "cafeteria",
    effects: {
      setCharacter: { classKey: characterClass.key },
      addSkills: characterClass.skills,
      addProficiencies: characterClass.proficiencies,
      addItems: [characterClass.startingItem].filter(Boolean),
      history: `Registered as a ${characterClass.name}.`,
    },
  };
}

function storeChoices(store, nextSceneId) {
  return (store?.bundles || []).map((bundle) => {
    const cost = Number(bundle.cost) || 0;
    const meta = {
      ...(cost > 0 ? { Cost: `${cost} gold` } : {}),
      ...(bundle.weapon ? { Weapon: bundle.weapon } : {}),
      ...(bundle.armor ? { Armor: bundle.armor } : {}),
      ...(bundle.instrument ? { Instrument: bundle.instrument } : {}),
      ...(bundle.spells ? { Spells: bundle.spells.join(", ") } : {}),
      ...(bundle.provisions ? { Contents: bundle.provisions.join(", ") } : {}),
    };

    return {
      id: `${store.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}-${bundle.key}`,
      label: cost > 0 ? `${bundle.name} (${cost} gold)` : bundle.name,
      summary: bundle.summary,
      meta,
      details: [
        ...(bundle.proficiencies?.length ? [`Adds proficiencies: ${bundle.proficiencies.join(", ")}`] : []),
        ...(bundle.armorClassDelta ? [`Armor Class bonus: +${bundle.armorClassDelta}`] : []),
      ],
      nextSceneId,
      requires: cost > 0 ? { stats: { gold: cost } } : undefined,
      effects: {
        setCharacter: {
          ...(bundle.provisions ? { provisions: bundle.provisions } : {}),
          ...(bundle.spells ? { spells: bundle.spells } : {}),
          ...(bundle.instrument ? { instrument: bundle.instrument } : {}),
          ...(bundle.armor ? { armor: bundle.armor } : {}),
          ...(bundle.weapon ? { weapon: bundle.weapon } : {}),
        },
        addItems: bundle.items,
        addProficiencies: bundle.proficiencies,
        statDeltas: cost > 0 ? { gold: -cost } : undefined,
        armorClassDelta: bundle.armorClassDelta || 0,
        history: `Chose ${bundle.name}.`,
      },
    };
  });
}

function keyBy(items = []) {
  return items.reduce((map, item) => {
    map[item.key] = item;
    return map;
  }, {});
}

function formatBonuses(bonuses = {}, abilities = {}) {
  const entries = Object.entries(bonuses);

  if (entries.length === 0) {
    return "None";
  }

  return entries
    .map(([ability, bonus]) => `${Number(bonus) >= 0 ? "+" : ""}${bonus} ${(abilities[ability]?.shortLabel || ability).toUpperCase()}`)
    .join(", ");
}

function formatPrimaryAbilities(primaryAbilities = [], abilities = {}) {
  return primaryAbilities
    .map((ability) => {
      const key = String(ability).toLowerCase();
      return abilities[key]?.shortLabel || ability;
    })
    .join(", ");
}
