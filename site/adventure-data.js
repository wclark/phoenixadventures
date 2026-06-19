/**
 * Editable character-generator path for Phoenix Adventures.
 *
 * This file owns story content and character creation choices. The engine in
 * game.js renders scenes, applies effects, and sends the log-pixel request.
 */

/**
 * @typedef {Object} StatBlock
 * @property {number=} strength
 * @property {number=} intelligence
 * @property {number=} wisdom
 * @property {number=} dexterity
 * @property {number=} constitution
 * @property {number=} charisma
 * @property {number=} gold
 */

/**
 * @typedef {Object} CharacterFields
 * @property {string=} race
 * @property {string=} origin
 * @property {string=} background
 * @property {string=} className
 * @property {string[]=} spells
 * @property {string[]=} provisions
 * @property {string=} instrument
 * @property {string=} armor
 * @property {string=} weapon
 */

/**
 * @typedef {Object} ChoiceEffects
 * @property {string[]=} addItems
 * @property {Partial<StatBlock>=} statDeltas
 * @property {Partial<CharacterFields>=} setCharacter
 * @property {boolean=} rollAbilities
 * @property {boolean=} resetCharacter
 * @property {number=} hitPointDelta
 * @property {number=} armorClassDelta
 * @property {string=} history
 */

/**
 * @typedef {Object} ChoiceRequirements
 * @property {string[]=} items
 * @property {Partial<StatBlock>=} stats
 * @property {Partial<CharacterFields>=} character
 */

/**
 * @typedef {Object} ChoiceDefinition
 * @property {string} id
 * @property {string} label
 * @property {string=} nextSceneId
 * @property {ChoiceRequirements=} requires
 * @property {boolean=} hideUnavailable
 * @property {ChoiceEffects=} effects
 */

window.PHOENIX_ADVENTURE = {
  title: "Phoenix Adventures",
  startSceneId: "sracs-gate",
  openingHistory: ["Arrived outside SRAC'S, where every adventurer begins as a question."],
  trackingPixel: "assets/character-pixel.svg",
  player: {
    name: "",
    level: 1,
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
      kicker: "SRAC'S",
      title: "The tavern waits at the edge of the keep.",
      image: "assets/scene-sracs-tavern.png",
      imageAlt: "SRAC'S tavern, a long fantasy tavern with lantern-lit windows, purple doors, trees, a white fence, and storm clouds overhead.",
      text:
        "Rain-dark cobbles lead to the purple doors of SRAC'S. The sign creaks above the porch, and warm voices spill from within. This is not the start of a quest yet. This is where the person who will take that quest gets made.",
      choices: [
        {
          id: "enter-sracs",
          label: "Enter SRAC'S",
          nextSceneId: "barkeep",
          effects: {
            history: "Stepped inside SRAC'S to meet the barkeep.",
          },
        },
      ],
    },
    {
      id: "barkeep",
      mapNodeId: "sracs-gate",
      kicker: "The Barkeep",
      title: "A barkeep asks your name and where you are from.",
      image: "assets/scene-sracs-tavern.png",
      imageAlt: "The lantern-lit exterior of SRAC'S, where the barkeep begins the character ledger.",
      text:
        "The barkeep slides a clean card across the counter. \"Name first,\" they say, tapping the sheet. \"Then tell me whose roads taught you to walk. Woodland boughs? Dwarven stone? Human streets? Halfling fields?\" Enter a name on the character sheet, then choose your people.",
      choices: [
        {
          id: "race-woodland-elf",
          label: "I'm of the Woodland Elves.",
          nextSceneId: "outdoor-bar",
          effects: {
            setCharacter: { race: "Elf", origin: "Woodland Elves" },
            history: "Declared kinship with the Woodland Elves.",
          },
        },
        {
          id: "race-hill-dwarf",
          label: "I'm of the Hill Dwarves.",
          nextSceneId: "outdoor-bar",
          effects: {
            setCharacter: { race: "Dwarf", origin: "Hill Dwarves" },
            history: "Declared kinship with the Hill Dwarves.",
          },
        },
        {
          id: "race-river-halfling",
          label: "I'm of the River Halflings.",
          nextSceneId: "outdoor-bar",
          effects: {
            setCharacter: { race: "Halfling", origin: "River Halflings" },
            history: "Declared kinship with the River Halflings.",
          },
        },
        {
          id: "race-santa-rosa-human",
          label: "I'm of the Free Folk of Santa Rosa.",
          nextSceneId: "outdoor-bar",
          effects: {
            setCharacter: { race: "Human", origin: "Free Folk of Santa Rosa" },
            history: "Declared kinship with the Free Folk of Santa Rosa.",
          },
        },
        {
          id: "race-emberborn",
          label: "I'm of the Emberborn.",
          nextSceneId: "outdoor-bar",
          effects: {
            setCharacter: { race: "Dragonborn", origin: "Emberborn" },
            history: "Declared kinship with the Emberborn.",
          },
        },
      ],
    },
    {
      id: "outdoor-bar",
      mapNodeId: "outdoor-bar",
      kicker: "Outdoor Bar",
      title: "Around the courtyard bar, strangers trade stories.",
      image: "assets/scene-courtyard.svg",
      imageAlt: "A ruined central courtyard remade as an outdoor tavern patio.",
      text:
        "Beyond the side door, the outdoor bar hums under canvas awnings. Travelers lean over railings and ask what you did before SRAC'S wrote you into the ledger.",
      choices: [
        {
          id: "background-sage",
          label: "I kept old books and stranger secrets.",
          nextSceneId: "gymnasium",
          effects: {
            setCharacter: { background: "Sage" },
            addItems: ["Ink-stained Notebook"],
            history: "Chose the Sage background.",
          },
        },
        {
          id: "background-folk-hero",
          label: "I stood up when no one else would.",
          nextSceneId: "gymnasium",
          effects: {
            setCharacter: { background: "Folk Hero" },
            addItems: ["Lucky Token"],
            history: "Chose the Folk Hero background.",
          },
        },
        {
          id: "background-urchin",
          label: "I learned every alley by moonlight.",
          nextSceneId: "gymnasium",
          effects: {
            setCharacter: { background: "Urchin" },
            addItems: ["Bent Lockpick"],
            history: "Chose the Urchin background.",
          },
        },
        {
          id: "background-artisan",
          label: "I made things that outlasted their makers.",
          nextSceneId: "gymnasium",
          effects: {
            setCharacter: { background: "Guild Artisan" },
            addItems: ["Maker's Chisel"],
            history: "Chose the Guild Artisan background.",
          },
        },
        {
          id: "background-outlander",
          label: "I followed tracks past the map edge.",
          nextSceneId: "gymnasium",
          effects: {
            setCharacter: { background: "Outlander" },
            addItems: ["Weathered Compass"],
            history: "Chose the Outlander background.",
          },
        },
      ],
    },
    {
      id: "gymnasium",
      mapNodeId: "gymnasium",
      kicker: "Gymnasium",
      title: "The old gym measures what your story can survive.",
      image: "assets/scene-tournament-grounds.svg",
      imageAlt: "An athletic ground transformed into a fantasy training arena.",
      text:
        "The gymnasium floor is marked with six chalk circles: lift, solve, listen, dodge, endure, persuade. Step through the trials and your ability scores are rolled: 4d6, keep the highest three.",
      choices: [
        {
          id: "roll-abilities",
          label: "Take the six ability trials",
          nextSceneId: "main-office",
          effects: {
            rollAbilities: true,
            history: "Completed the Gymnasium trials and revealed ability scores.",
          },
        },
      ],
    },
    {
      id: "main-office",
      mapNodeId: "main-office",
      kicker: "Main Office",
      title: "The registrar asks which class belongs on your record.",
      image: "assets/scene-courtyard.svg",
      imageAlt: "A ruined hall office with warm light, registers, and class banners.",
      text:
        "Behind the main desk, class banners hang like enrollment forms for impossible futures. The registrar dips a quill and waits.",
      choices: [
        {
          id: "class-wizard",
          label: "Wizard",
          nextSceneId: "cafeteria",
          effects: {
            setCharacter: { className: "Wizard" },
            addItems: ["Blank Spellbook"],
            history: "Registered as a Wizard.",
          },
        },
        {
          id: "class-paladin",
          label: "Paladin",
          nextSceneId: "cafeteria",
          effects: {
            setCharacter: { className: "Paladin" },
            addItems: ["Oath Primer"],
            history: "Registered as a Paladin.",
          },
        },
        {
          id: "class-ranger",
          label: "Ranger",
          nextSceneId: "cafeteria",
          effects: {
            setCharacter: { className: "Ranger" },
            addItems: ["Trail Map"],
            history: "Registered as a Ranger.",
          },
        },
        {
          id: "class-rogue",
          label: "Rogue",
          nextSceneId: "cafeteria",
          effects: {
            setCharacter: { className: "Rogue" },
            addItems: ["Practice Picks"],
            history: "Registered as a Rogue.",
          },
        },
        {
          id: "class-fighter",
          label: "Fighter",
          nextSceneId: "cafeteria",
          effects: {
            setCharacter: { className: "Fighter" },
            addItems: ["Training Medal"],
            history: "Registered as a Fighter.",
          },
        },
        {
          id: "class-cleric",
          label: "Cleric",
          nextSceneId: "cafeteria",
          effects: {
            setCharacter: { className: "Cleric" },
            addItems: ["Prayer Beads"],
            history: "Registered as a Cleric.",
          },
        },
        {
          id: "class-bard",
          label: "Bard",
          nextSceneId: "cafeteria",
          effects: {
            setCharacter: { className: "Bard" },
            addItems: ["Song Ledger"],
            history: "Registered as a Bard.",
          },
        },
        {
          id: "class-tinkerer",
          label: "Tinkerer",
          nextSceneId: "cafeteria",
          effects: {
            setCharacter: { className: "Tinkerer" },
            addItems: ["Gear Sketchbook"],
            history: "Registered as a Tinkerer.",
          },
        },
      ],
    },
    {
      id: "cafeteria",
      mapNodeId: "cafeteria",
      kicker: "Cafeteria",
      title: "The quartermaster packs provisions for the road.",
      image: "assets/scene-courtyard.svg",
      imageAlt: "A warm ruined hall serving counter stocked with fantasy provisions.",
      text:
        "The cafeteria line has become a quartermaster's counter. Pick the provisions that sound like they belong in your pack.",
      choices: [
        {
          id: "provisions-trail-rations",
          label: "Trail rations and canteen",
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
      kicker: "Hallway",
      title: "Two elective halls wait beyond the cafeteria.",
      image: "assets/campus-ruins-map.svg",
      imageAlt: "A simplified fantasy campus map of Falconrise Keep.",
      text:
        "The library glows with spell-script. The music room answers with tuning strings. The STEM workshops clatter farther down the hall for anyone ready to gear up.",
      choices: [
        {
          id: "go-library-wizard",
          label: "Visit the Library for spells",
          nextSceneId: "library",
          requires: { character: { className: ["Wizard", "Paladin", "Ranger", "Cleric"] } },
          hideUnavailable: true,
        },
        {
          id: "go-music-room",
          label: "Visit the Music Room",
          nextSceneId: "music-room",
          requires: { character: { className: "Bard" } },
          hideUnavailable: true,
        },
        {
          id: "go-stem-workshops",
          label: "Head to the STEM workshops",
          nextSceneId: "stem-workshops",
        },
      ],
    },
    {
      id: "library",
      mapNodeId: "library",
      kicker: "Library",
      title: "Choose the magic you want in reach.",
      image: "assets/scene-courtyard.svg",
      imageAlt: "A ruined school library transformed into a candlelit spell archive.",
      text:
        "Stacks of books lean like old towers. A librarian points you toward three beginning spell bundles and pretends not to notice the shelves whispering your name.",
      choices: [
        {
          id: "spells-ember-and-ward",
          label: "Ember, Light, and Shield",
          nextSceneId: "stem-workshops",
          effects: {
            setCharacter: { spells: ["Ember", "Light", "Shield"] },
            addItems: ["Spell Bundle: Ember, Light, Shield"],
            history: "Selected the Ember, Light, and Shield spell bundle.",
          },
        },
        {
          id: "spells-vine-and-mending",
          label: "Vine Snare, Mending, and Speak with Beasts",
          nextSceneId: "stem-workshops",
          effects: {
            setCharacter: { spells: ["Vine Snare", "Mending", "Speak with Beasts"] },
            addItems: ["Spell Bundle: Vine Snare, Mending, Speak with Beasts"],
            history: "Selected the Vine Snare, Mending, and Speak with Beasts spell bundle.",
          },
        },
        {
          id: "spells-oath-and-courage",
          label: "Blessing, Courage, and Sacred Flame",
          nextSceneId: "stem-workshops",
          effects: {
            setCharacter: { spells: ["Blessing", "Courage", "Sacred Flame"] },
            addItems: ["Spell Bundle: Blessing, Courage, Sacred Flame"],
            history: "Selected the Blessing, Courage, and Sacred Flame spell bundle.",
          },
        },
      ],
    },
    {
      id: "music-room",
      mapNodeId: "music-room",
      kicker: "Music Room",
      title: "Pick the sound your legend enters with.",
      image: "assets/scene-courtyard.svg",
      imageAlt: "A ruined school music room with instruments, banners, and candlelight.",
      text:
        "A room of battered instruments hums in harmony. The music teacher asks whether you lead with strings, pipes, or drums.",
      choices: [
        {
          id: "instrument-lute",
          label: "Lute and charm songs",
          nextSceneId: "stem-workshops",
          effects: {
            setCharacter: { instrument: "Lute", spells: ["Charm", "Inspire", "Echo"] },
            addItems: ["Lute"],
            history: "Selected a lute and charm songs.",
          },
        },
        {
          id: "instrument-flute",
          label: "Flute and wind songs",
          nextSceneId: "stem-workshops",
          effects: {
            setCharacter: { instrument: "Flute", spells: ["Gust", "Lullaby", "Quickstep"] },
            addItems: ["Flute"],
            history: "Selected a flute and wind songs.",
          },
        },
        {
          id: "instrument-drum",
          label: "Drum and courage songs",
          nextSceneId: "stem-workshops",
          effects: {
            setCharacter: { instrument: "Drum", spells: ["Courage", "Thunderbeat", "Rally"] },
            addItems: ["Drum"],
            history: "Selected a drum and courage songs.",
          },
        },
      ],
    },
    {
      id: "stem-workshops",
      mapNodeId: "stem-workshops",
      kicker: "STEM Workshops",
      title: "Tinkerers offer armor, weapons, and bright ideas.",
      image: "assets/scene-tournament-grounds.svg",
      imageAlt: "Training courts transformed into tinkerer workshops full of tools, racks, and gear.",
      text:
        "The STEM classrooms have become tinkerer workshops. Workbenches glitter with rivets, wood shavings, practice blades, and half-finished contraptions.",
      choices: [
        {
          id: "gear-staff-robes",
          label: "Buy staff, robes, and component pouch (4 gold)",
          nextSceneId: "character-complete",
          requires: { stats: { gold: 4 } },
          effects: {
            setCharacter: { weapon: "Quarterstaff", armor: "Traveling Robes" },
            addItems: ["Quarterstaff", "Traveling Robes", "Component Pouch"],
            statDeltas: { gold: -4 },
            history: "Chose staff, robes, and a component pouch.",
          },
        },
        {
          id: "gear-bow-leather",
          label: "Buy shortbow, leather armor, and knife (7 gold)",
          nextSceneId: "character-complete",
          requires: { stats: { gold: 7 } },
          effects: {
            setCharacter: { weapon: "Shortbow", armor: "Leather Armor" },
            addItems: ["Shortbow", "Leather Armor", "Utility Knife"],
            statDeltas: { gold: -7 },
            history: "Chose shortbow, leather armor, and a utility knife.",
          },
        },
        {
          id: "gear-sword-shield",
          label: "Buy sword, shield, and chain shirt (10 gold)",
          nextSceneId: "character-complete",
          requires: { stats: { gold: 10 } },
          effects: {
            setCharacter: { weapon: "Longsword", armor: "Chain Shirt and Shield" },
            addItems: ["Longsword", "Shield", "Chain Shirt"],
            statDeltas: { gold: -10 },
            armorClassDelta: 3,
            history: "Chose sword, shield, and a chain shirt.",
          },
        },
        {
          id: "gear-tools-crossbow",
          label: "Buy toolkit, light crossbow, and padded coat (6 gold)",
          nextSceneId: "character-complete",
          requires: { stats: { gold: 6 } },
          effects: {
            setCharacter: { weapon: "Light Crossbow", armor: "Padded Coat" },
            addItems: ["Tinkerer's Toolkit", "Light Crossbow", "Padded Coat"],
            statDeltas: { gold: -6 },
            history: "Chose toolkit, light crossbow, and a padded coat.",
          },
        },
      ],
    },
    {
      id: "character-complete",
      mapNodeId: "sracs-gate",
      kicker: "Ledger Complete",
      title: "Your character is ready to leave SRAC'S.",
      image: "assets/scene-sracs-tavern.png",
      imageAlt: "SRAC'S tavern glowing under storm clouds as a new adventurer prepares to depart.",
      text:
        "The barkeep stamps the ledger, the quartermaster cinches your pack, and the registrar files your card. Your character now exists in the story and in the request logs carried by the tracking pixel.",
      choices: [
        {
          id: "review-map",
          label: "Review the campus map",
          nextSceneId: "character-map",
        },
        {
          id: "restart-generator",
          label: "Start a new character",
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
      kicker: "Character Route",
      title: "The campus has become a character sheet you walk through.",
      image: "assets/campus-ruins-map.svg",
      imageAlt: "A simplified fantasy map showing SRAC'S, the courtyard, halls, gym, fields, and workshops.",
      text:
        "SRAC'S starts the name and origin. The outdoor bar gives background. The Gymnasium reveals ability scores. The Main Office registers class. The Cafeteria fills the pack. The Library, Music Room, and STEM Workshops finish spells, songs, armor, and weapons.",
      choices: [
        {
          id: "return-complete",
          label: "Return to the completed ledger",
          nextSceneId: "character-complete",
        },
      ],
    },
  ],
};
