/**
 * Editable character-builder path for Phoenix Adventures.
 *
 * Story scenes still provide the route through campus, but the main purpose of
 * this file is now game data: race bonuses, background hooks, class guidance,
 * and the choices that write those details to the character sheet.
 */

const PHOENIX_ABILITIES = {
  strength: {
    label: "Strength",
    shortLabel: "STR",
    description: "Power, lifting, melee pressure, and athletics.",
  },
  intelligence: {
    label: "Intelligence",
    shortLabel: "INT",
    description: "Study, memory, investigation, and wizard magic.",
  },
  wisdom: {
    label: "Wisdom",
    shortLabel: "WIS",
    description: "Awareness, intuition, survival, and divine magic.",
  },
  dexterity: {
    label: "Dexterity",
    shortLabel: "DEX",
    description: "Reflexes, stealth, aim, and unarmored defense.",
  },
  constitution: {
    label: "Constitution",
    shortLabel: "CON",
    description: "Endurance, grit, and hit points.",
  },
  charisma: {
    label: "Charisma",
    shortLabel: "CHA",
    description: "Presence, persuasion, performance, and oath magic.",
  },
};

const PHOENIX_RACES = {
  elf: {
    key: "elf",
    name: "Elf",
    origin: "Woodland Elves",
    quote: "I am {name} of the Woodland Elves.",
    abilityBonuses: { dexterity: 2, intelligence: 1 },
    traits: ["Keen senses", "Quiet movement", "Long memory"],
    bestFor: ["Wizard", "Ranger", "Rogue"],
    summary: "Graceful, alert, and well suited to characters who prize precision.",
    advice: "Put a strong rolled score into Dexterity if you want stealth or archery, or into Intelligence if you are leaning Wizard.",
  },
  dwarf: {
    key: "dwarf",
    name: "Dwarf",
    origin: "Hill Dwarves",
    quote: "I am {name} of the Hill Dwarves.",
    abilityBonuses: { constitution: 2, wisdom: 1 },
    traits: ["Stone sense", "Stubborn endurance", "Craft memory"],
    bestFor: ["Cleric", "Paladin", "Fighter"],
    summary: "Durable and steady, with bonuses that make front-line and divine classes forgiving.",
    advice: "Constitution raises hit points. Wisdom supports Cleric, Ranger, and perception-heavy builds.",
  },
  halfling: {
    key: "halfling",
    name: "Halfling",
    origin: "River Halflings",
    quote: "I am {name} of the River Halflings.",
    abilityBonuses: { dexterity: 2, charisma: 1 },
    traits: ["Lucky timing", "Small target", "Warm welcome"],
    bestFor: ["Rogue", "Bard", "Ranger"],
    summary: "Quick and charming, with a natural fit for agile or social characters.",
    advice: "Dexterity helps AC, ranged attacks, and stealth. Charisma makes social and Bard choices shine.",
  },
  human: {
    key: "human",
    name: "Human",
    origin: "Free Folk of Santa Rosa",
    quote: "I am {name} of the Free Folk of Santa Rosa.",
    abilityBonuses: {
      strength: 1,
      intelligence: 1,
      wisdom: 1,
      dexterity: 1,
      constitution: 1,
      charisma: 1,
    },
    traits: ["Flexible training", "Fast learner", "Local connections"],
    bestFor: ["Any class"],
    summary: "Broad and adaptable, adding a small bonus to every ability.",
    advice: "Humans are forgiving when you are still deciding what kind of character you want.",
  },
  dragonborn: {
    key: "dragonborn",
    name: "Dragonborn",
    origin: "Emberborn",
    quote: "I am {name} of the Emberborn.",
    abilityBonuses: { strength: 2, charisma: 1 },
    traits: ["Ember breath", "Commanding presence", "Scaled resolve"],
    bestFor: ["Paladin", "Fighter", "Bard"],
    summary: "Bold and forceful, strongest when built around presence and melee power.",
    advice: "Strength supports weapons and athletics. Charisma supports Paladin oaths and Bard performance.",
  },
};

const PHOENIX_BACKGROUNDS = {
  sage: {
    key: "sage",
    name: "Sage",
    skillFocus: "Arcana, History",
    item: "Ink-stained Notebook",
    summary: "A bookish start for curious characters who want lore and investigation.",
    advice: "Pairs naturally with Intelligence-heavy classes, but any class can benefit from knowing old secrets.",
  },
  folkHero: {
    key: "folkHero",
    name: "Folk Hero",
    skillFocus: "Athletics, Animal Handling",
    item: "Lucky Token",
    summary: "A public-hearted background for characters who are known for helping people.",
    advice: "Good for Paladins, Fighters, Rangers, or anyone who wants a grounded heroic reputation.",
  },
  urchin: {
    key: "urchin",
    name: "Urchin",
    skillFocus: "Stealth, Sleight of Hand",
    item: "Bent Lockpick",
    summary: "A streetwise start for careful, quick, or sneaky characters.",
    advice: "Especially useful when Dexterity is one of your best scores.",
  },
  artisan: {
    key: "artisan",
    name: "Guild Artisan",
    skillFocus: "Insight, Persuasion",
    item: "Maker's Chisel",
    summary: "A practical craft background for builders, negotiators, and tinkerers.",
    advice: "Pairs nicely with Intelligence or Charisma, depending on whether you build or bargain first.",
  },
  outlander: {
    key: "outlander",
    name: "Outlander",
    skillFocus: "Survival, Athletics",
    item: "Weathered Compass",
    summary: "A trail-tested background for characters who know how to survive away from town.",
    advice: "A strong fit for Rangers, Fighters, and hardy characters with Wisdom or Strength.",
  },
};

const PHOENIX_CLASSES = {
  wizard: {
    key: "wizard",
    name: "Wizard",
    primaryAbilities: ["intelligence"],
    hitDie: 6,
    summary: "Solves problems with study, rituals, and spell choices.",
    details: ["Primary ability: Intelligence", "Hit die: d6", "Armor: light protection at best", "Good scores: Intelligence first, then Dexterity or Constitution"],
    startingItem: "Blank Spellbook",
  },
  paladin: {
    key: "paladin",
    name: "Paladin",
    primaryAbilities: ["strength", "charisma"],
    hitDie: 10,
    summary: "A durable oathbound champion who mixes weapons, protection, and presence.",
    details: ["Primary abilities: Strength and Charisma", "Hit die: d10", "Armor: excellent", "Good scores: Strength, Charisma, Constitution"],
    startingItem: "Oath Primer",
  },
  ranger: {
    key: "ranger",
    name: "Ranger",
    primaryAbilities: ["dexterity", "wisdom"],
    hitDie: 10,
    summary: "A scout and hunter who notices trouble early and fights well at range.",
    details: ["Primary abilities: Dexterity and Wisdom", "Hit die: d10", "Armor: light or medium", "Good scores: Dexterity, Wisdom, Constitution"],
    startingItem: "Trail Map",
  },
  rogue: {
    key: "rogue",
    name: "Rogue",
    primaryAbilities: ["dexterity"],
    hitDie: 8,
    summary: "A precise specialist built around stealth, timing, and useful tricks.",
    details: ["Primary ability: Dexterity", "Hit die: d8", "Armor: light", "Good scores: Dexterity first, then Intelligence or Charisma"],
    startingItem: "Practice Picks",
  },
  fighter: {
    key: "fighter",
    name: "Fighter",
    primaryAbilities: ["strength", "dexterity"],
    hitDie: 10,
    summary: "A flexible weapon expert who can be built for melee, archery, or defense.",
    details: ["Primary abilities: Strength or Dexterity", "Hit die: d10", "Armor: excellent", "Good scores: Strength or Dexterity, then Constitution"],
    startingItem: "Training Medal",
  },
  cleric: {
    key: "cleric",
    name: "Cleric",
    primaryAbilities: ["wisdom"],
    hitDie: 8,
    summary: "A spellcaster and protector whose power comes from conviction and insight.",
    details: ["Primary ability: Wisdom", "Hit die: d8", "Armor: usually solid", "Good scores: Wisdom, Constitution, Strength if armored"],
    startingItem: "Prayer Beads",
  },
  bard: {
    key: "bard",
    name: "Bard",
    primaryAbilities: ["charisma"],
    hitDie: 8,
    summary: "A social spellcaster who turns performance, lore, and nerve into power.",
    details: ["Primary ability: Charisma", "Hit die: d8", "Armor: light", "Good scores: Charisma, Dexterity, Constitution"],
    startingItem: "Song Ledger",
  },
  tinkerer: {
    key: "tinkerer",
    name: "Tinkerer",
    primaryAbilities: ["intelligence", "dexterity"],
    hitDie: 8,
    summary: "A workshop-minded adventurer who fights with tools, devices, and cleverness.",
    details: ["Primary abilities: Intelligence and Dexterity", "Hit die: d8", "Armor: light or medium", "Good scores: Intelligence, Dexterity, Constitution"],
    startingItem: "Gear Sketchbook",
  },
};

window.PHOENIX_ADVENTURE = {
  title: "Phoenix Adventures",
  startSceneId: "sracs-gate",
  openingHistory: ["Opened the SRAC'S character ledger."],
  trackingPixel: "assets/character-pixel.svg",
  abilities: PHOENIX_ABILITIES,
  races: PHOENIX_RACES,
  backgrounds: PHOENIX_BACKGROUNDS,
  classes: PHOENIX_CLASSES,
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
    },
    inventory: [],
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
  scenes: [
    {
      id: "sracs-gate",
      mapNodeId: "sracs-gate",
      kicker: "Step 1",
      title: "Start a character at SRAC'S.",
      image: "assets/scene-sracs-tavern.png",
      imageAlt: "SRAC'S tavern, a long fantasy tavern with lantern-lit windows, purple doors, trees, a white fence, and storm clouds overhead.",
      text:
        "This builder walks you through name, race, background, rolled abilities, class, provisions, and starting gear. Your choices are mirrored in the character sheet and sent through the log pixel for later retrieval.",
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
      text:
        "Type your character name on the sheet. Each race adds ability-score bonuses after you assign your rolled scores, so a 14 Dexterity with a +2 racial bonus becomes 16.",
      choices: [
        raceChoice("elf", "race-woodland-elf", "Woodland Elf"),
        raceChoice("dwarf", "race-hill-dwarf", "Hill Dwarf"),
        raceChoice("halfling", "race-river-halfling", "River Halfling"),
        raceChoice("human", "race-santa-rosa-human", "Free Folk Human"),
        raceChoice("dragonborn", "race-emberborn", "Emberborn Dragonborn"),
      ],
    },
    {
      id: "outdoor-bar",
      mapNodeId: "outdoor-bar",
      kicker: "Background",
      title: "Pick what your character did before adventuring.",
      image: "assets/scene-courtyard.svg",
      imageAlt: "A ruined central courtyard remade as an outdoor tavern patio.",
      text:
        "Backgrounds do not change ability scores here. They add identity, a small starting item, and a hint about skills your character is likely to know.",
      choices: [
        backgroundChoice("sage", "background-sage"),
        backgroundChoice("folkHero", "background-folk-hero"),
        backgroundChoice("urchin", "background-urchin"),
        backgroundChoice("artisan", "background-artisan"),
        backgroundChoice("outlander", "background-outlander"),
      ],
    },
    {
      id: "gymnasium",
      mapNodeId: "gymnasium",
      kicker: "Ability Scores",
      title: "Roll six scores, then assign them yourself.",
      image: "assets/scene-tournament-grounds.svg",
      imageAlt: "An athletic ground transformed into a fantasy training arena.",
      builder: "ability-assignment",
      text:
        "The gym rolls six numbers using 4d6, keeping the highest three dice each time. You choose which rolled number goes to each ability. Racial bonuses are shown beside each ability before you confirm.",
      choices: [
        {
          id: "roll-score-pool",
          label: "Roll or reroll six ability scores",
          summary: "Creates a fresh pool of six rolled scores. Assignments are cleared when you reroll.",
          details: ["Method: roll 4d6, drop the lowest die", "You can assign the scores in any order", "Racial bonuses apply after assignment"],
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
        "Classes do not add ability-score bonuses, but they tell you which abilities matter most, change your hit point baseline, and guide later spell, music, and equipment choices.",
      choices: [
        classChoice("wizard", "class-wizard"),
        classChoice("paladin", "class-paladin"),
        classChoice("ranger", "class-ranger"),
        classChoice("rogue", "class-rogue"),
        classChoice("fighter", "class-fighter"),
        classChoice("cleric", "class-cleric"),
        classChoice("bard", "class-bard"),
        classChoice("tinkerer", "class-tinkerer"),
      ],
    },
    {
      id: "cafeteria",
      mapNodeId: "cafeteria",
      kicker: "Provisions",
      title: "Pick a provision bundle.",
      image: "assets/scene-courtyard.svg",
      imageAlt: "A warm ruined hall serving counter stocked with fantasy provisions.",
      text:
        "These choices are mostly inventory flavor for now. Later we can make them matter in travel, recovery, and social scenes.",
      choices: [
        {
          id: "provisions-trail-rations",
          label: "Trail rations and canteen",
          summary: "Plain, practical, and useful for long travel.",
          meta: { Contents: "Trail Rations, Canteen" },
          nextSceneId: "study-choice",
          effects: {
            setCharacter: { provisions: ["Trail Rations", "Canteen"] },
            addItems: ["Trail Rations", "Canteen"],
            history: "Packed trail rations and a canteen.",
          },
        },
        {
          id: "provisions-herbal-kit",
          label: "Herbal tea and healer's bundle",
          summary: "A gentler kit for characters who expect to patch people up.",
          meta: { Contents: "Herbal Tea, Healer's Bundle" },
          nextSceneId: "study-choice",
          effects: {
            setCharacter: { provisions: ["Herbal Tea", "Healer's Bundle"] },
            addItems: ["Herbal Tea", "Healer's Bundle"],
            history: "Packed herbal tea and a healer's bundle.",
          },
        },
        {
          id: "provisions-feast-box",
          label: "Feast box and sweet rolls",
          summary: "Social supplies for making friends before trouble starts.",
          meta: { Contents: "Feast Box, Sweet Rolls" },
          nextSceneId: "study-choice",
          effects: {
            setCharacter: { provisions: ["Feast Box", "Sweet Rolls"] },
            addItems: ["Feast Box", "Sweet Rolls"],
            history: "Packed a feast box and sweet rolls.",
          },
        },
      ],
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
          summary: "Available to Wizard, Paladin, Ranger, and Cleric characters.",
          nextSceneId: "library",
          requires: { character: { className: ["Wizard", "Paladin", "Ranger", "Cleric"] } },
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
      choices: [
        spellChoice("spells-ember-and-ward", "Ember, Light, and Shield", ["Ember", "Light", "Shield"], "Balanced offense, utility, and defense."),
        spellChoice("spells-vine-and-mending", "Vine Snare, Mending, and Speak with Beasts", ["Vine Snare", "Mending", "Speak with Beasts"], "Nature, repair, and exploration tools."),
        spellChoice("spells-oath-and-courage", "Blessing, Courage, and Sacred Flame", ["Blessing", "Courage", "Sacred Flame"], "Supportive magic with a divine edge."),
      ],
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
      choices: [
        instrumentChoice("instrument-lute", "Lute and charm songs", "Lute", ["Charm", "Inspire", "Echo"], "Social magic and graceful performance."),
        instrumentChoice("instrument-flute", "Flute and wind songs", "Flute", ["Gust", "Lullaby", "Quickstep"], "Movement, air, and soft control."),
        instrumentChoice("instrument-drum", "Drum and courage songs", "Drum", ["Courage", "Thunderbeat", "Rally"], "Morale, rhythm, and battlefield nerve."),
      ],
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
      choices: [
        gearChoice({
          id: "gear-staff-robes",
          label: "Staff, robes, and component pouch",
          cost: 4,
          weapon: "Quarterstaff",
          armor: "Traveling Robes",
          items: ["Quarterstaff", "Traveling Robes", "Component Pouch"],
          summary: "Low cost and natural for Wizards, Clerics, Bards, or anyone staying light.",
        }),
        gearChoice({
          id: "gear-bow-leather",
          label: "Shortbow, leather armor, and knife",
          cost: 7,
          weapon: "Shortbow",
          armor: "Leather Armor",
          items: ["Shortbow", "Leather Armor", "Utility Knife"],
          summary: "A Dexterity kit for Rangers, Rogues, and mobile Fighters.",
        }),
        gearChoice({
          id: "gear-sword-shield",
          label: "Sword, shield, and chain shirt",
          cost: 10,
          weapon: "Longsword",
          armor: "Chain Shirt and Shield",
          armorClassDelta: 3,
          items: ["Longsword", "Shield", "Chain Shirt"],
          summary: "A defensive melee kit for Paladins and Fighters.",
        }),
        gearChoice({
          id: "gear-tools-crossbow",
          label: "Toolkit, light crossbow, and padded coat",
          cost: 6,
          weapon: "Light Crossbow",
          armor: "Padded Coat",
          items: ["Tinkerer's Toolkit", "Light Crossbow", "Padded Coat"],
          summary: "A practical workshop kit for Tinkerers or clever ranged builds.",
        }),
      ],
    },
    {
      id: "character-complete",
      mapNodeId: "sracs-gate",
      kicker: "Complete",
      title: "Review the finished character.",
      image: "assets/scene-sracs-tavern.png",
      imageAlt: "SRAC'S tavern glowing under storm clouds as a new adventurer prepares to depart.",
      text:
        "The sheet now has name, race, background, assigned ability scores, class, provisions, and starting gear. The final pixel request includes those values in the query string.",
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
        "SRAC'S sets name and race. The outdoor bar sets background. The gym rolls and assigns abilities. The main office registers class. The cafeteria, library, music room, and STEM workshops fill in equipment and options.",
      choices: [
        {
          id: "return-complete",
          label: "Return to the completed sheet",
          nextSceneId: "character-complete",
        },
      ],
    },
  ],
};

function raceChoice(key, id, label) {
  const race = PHOENIX_RACES[key];
  return {
    id,
    label,
    summary: race.summary,
    meta: {
      "Ability bonuses": formatBonuses(race.abilityBonuses),
      "Good fits": race.bestFor.join(", "),
    },
    details: [race.advice, `Traits: ${race.traits.join(", ")}`],
    nextSceneId: "outdoor-bar",
    effects: {
      setCharacter: { raceKey: key, race: race.name, origin: race.origin },
      history: `Chose ${race.name} from the ${race.origin}.`,
    },
  };
}

function backgroundChoice(key, id) {
  const background = PHOENIX_BACKGROUNDS[key];
  return {
    id,
    label: background.name,
    summary: background.summary,
    meta: {
      "Skill focus": background.skillFocus,
      "Starting item": background.item,
    },
    details: [background.advice],
    nextSceneId: "gymnasium",
    effects: {
      setCharacter: { backgroundKey: key, background: background.name },
      addItems: [background.item],
      history: `Chose the ${background.name} background.`,
    },
  };
}

function classChoice(key, id) {
  const characterClass = PHOENIX_CLASSES[key];
  return {
    id,
    label: characterClass.name,
    summary: characterClass.summary,
    meta: {
      "Primary abilities": characterClass.primaryAbilities.map((ability) => PHOENIX_ABILITIES[ability].shortLabel).join(", "),
      "Hit die": `d${characterClass.hitDie}`,
    },
    details: characterClass.details,
    nextSceneId: "cafeteria",
    effects: {
      setCharacter: { classKey: key, className: characterClass.name },
      addItems: [characterClass.startingItem],
      history: `Registered as a ${characterClass.name}.`,
    },
  };
}

function spellChoice(id, label, spells, summary) {
  return {
    id,
    label,
    summary,
    meta: { Spells: spells.join(", ") },
    nextSceneId: "stem-workshops",
    effects: {
      setCharacter: { spells },
      addItems: [`Spell Bundle: ${spells.join(", ")}`],
      history: `Selected ${label}.`,
    },
  };
}

function instrumentChoice(id, label, instrument, spells, summary) {
  return {
    id,
    label,
    summary,
    meta: { Instrument: instrument, Songs: spells.join(", ") },
    nextSceneId: "stem-workshops",
    effects: {
      setCharacter: { instrument, spells },
      addItems: [instrument],
      history: `Selected ${instrument} and ${spells.join(", ")}.`,
    },
  };
}

function gearChoice(definition) {
  return {
    id: definition.id,
    label: `${definition.label} (${definition.cost} gold)`,
    summary: definition.summary,
    meta: {
      Cost: `${definition.cost} gold`,
      Weapon: definition.weapon,
      Armor: definition.armor,
    },
    details: definition.armorClassDelta ? [`Armor Class bonus: +${definition.armorClassDelta}`] : ["Armor Class uses your Dexterity modifier."],
    nextSceneId: "character-complete",
    requires: { stats: { gold: definition.cost } },
    effects: {
      setCharacter: { weapon: definition.weapon, armor: definition.armor },
      addItems: definition.items,
      statDeltas: { gold: -definition.cost },
      armorClassDelta: definition.armorClassDelta || 0,
      history: `Chose ${definition.label}.`,
    },
  };
}

function formatBonuses(bonuses) {
  return Object.entries(bonuses)
    .map(([ability, bonus]) => `${bonus >= 0 ? "+" : ""}${bonus} ${PHOENIX_ABILITIES[ability].shortLabel}`)
    .join(", ");
}
