/**
 * Editable adventure definition for Phoenix Adventures.
 *
 * Keep story content here: scene text, image paths, map links, choices, checks,
 * rewards, and future encounter hooks. The engine in game.js should stay
 * generic so the adventure can grow without rewriting rendering logic.
 */

/**
 * @typedef {Object} StatBlock
 * @property {number} might
 * @property {number} wits
 * @property {number} spirit
 * @property {number} gold
 */

/**
 * @typedef {Object} ChoiceEffects
 * @property {string[]=} addItems
 * @property {string[]=} removeItems
 * @property {Partial<StatBlock>=} statDeltas
 * @property {string=} history
 */

/**
 * @typedef {Object} ChoiceCheckOutcome
 * @property {string=} nextSceneId
 * @property {ChoiceEffects=} effects
 */

/**
 * @typedef {Object} ChoiceCheck
 * @property {"might"|"wits"|"spirit"} stat
 * @property {number} target
 * @property {number=} sides
 * @property {ChoiceCheckOutcome=} success
 * @property {ChoiceCheckOutcome=} failure
 */

/**
 * @typedef {Object} ChoiceRequirements
 * @property {string[]=} items
 * @property {Partial<StatBlock>=} stats
 */

/**
 * @typedef {Object} ChoiceDefinition
 * @property {string} id
 * @property {string} label
 * @property {string=} nextSceneId
 * @property {ChoiceRequirements=} requires
 * @property {ChoiceEffects=} effects
 * @property {ChoiceCheck=} check
 */

/**
 * @typedef {Object} SceneDefinition
 * @property {string} id
 * @property {string} mapNodeId
 * @property {string} kicker
 * @property {string} title
 * @property {string} image
 * @property {string} imageAlt
 * @property {string} text
 * @property {ChoiceDefinition[]} choices
 */

window.PHOENIX_ADVENTURE = {
  title: "Phoenix Adventures",
  startSceneId: "sracs-tavern",
  openingHistory: ["Arrived at SRAC'S as sunset touched the ruined keep."],
  player: {
    name: "Ash",
    level: 1,
    stats: {
      might: 2,
      wits: 2,
      spirit: 3,
      gold: 8,
    },
    inventory: ["Torch", "Travel Rations"],
  },
  map: {
    image: "assets/campus-ruins-map.svg",
    nodes: [
      { id: "sracs-tavern", label: "SRAC'S", sceneId: "sracs-tavern", x: 0.74, y: 0.31 },
      { id: "central-courtyard", label: "Central Courtyard", sceneId: "central-courtyard", x: 0.41, y: 0.45 },
      { id: "north-hall", label: "North Hall", sceneId: "north-hall", x: 0.39, y: 0.3 },
      { id: "tournament-grounds", label: "Tournament Grounds", sceneId: "tournament-grounds", x: 0.38, y: 0.76 },
      { id: "training-courts", label: "Training Courts", sceneId: "training-courts", x: 0.74, y: 0.61 },
    ],
  },
  scenes: [
    {
      id: "sracs-tavern",
      mapNodeId: "sracs-tavern",
      kicker: "SRAC'S",
      title: "The charter hall is now a tavern at the edge of the keep.",
      image: "assets/scene-sracs-tavern.png",
      imageAlt: "SRAC'S tavern, a long fantasy tavern with lantern-lit windows, purple doors, trees, a white fence, and storm clouds overhead.",
      text:
        "The low white hall has been reborn in timber, lantern light, and phoenix-red paint. Beyond its separate wagon yard, Falconrise Keep gathers around a central courtyard and a bell that should have fallen years ago.",
      choices: [
        {
          id: "study-map",
          label: "Study the ruin map",
          nextSceneId: "ruin-map",
          effects: {
            addItems: ["Ruin Map"],
            history: "Studied the map of Falconrise Keep.",
          },
        },
        {
          id: "enter-courtyard",
          label: "Enter the broken courtyard",
          nextSceneId: "central-courtyard",
          effects: {
            history: "Passed beneath the falcon gate.",
          },
        },
        {
          id: "search-shrine",
          label: "Search the roadside shrine",
          nextSceneId: "roadside-shrine",
          effects: {
            history: "Stopped at the roadside shrine.",
          },
        },
        {
          id: "question-merchant",
          label: "Question the hooded merchant",
          nextSceneId: "tavern-yard",
          effects: {
            history: "Shared a fire with the hooded merchant.",
          },
        },
      ],
    },
    {
      id: "ruin-map",
      mapNodeId: "sracs-tavern",
      kicker: "Fictional Map",
      title: "The keep follows the old campus bones.",
      image: "assets/campus-ruins-map.svg",
      imageAlt: "A parchment-style fantasy map showing SRAC'S, a wagon yard, hall wings, a central courtyard, training courts, fields, and a tournament track.",
      text:
        "The parchment simplifies the old grounds into adventure landmarks: main hall wings around a central courtyard, the detached SRAC'S tavern and wagon yard, training courts, ball fields, and a tournament track.",
      choices: [
        {
          id: "mark-north-hall",
          label: "Mark the north hall",
          nextSceneId: "north-hall",
          effects: {
            history: "Marked the north hall on the ruin map.",
          },
        },
        {
          id: "mark-courtyard",
          label: "Mark the central courtyard",
          nextSceneId: "central-courtyard",
          effects: {
            history: "Marked the central courtyard on the ruin map.",
          },
        },
        {
          id: "mark-tournament-grounds",
          label: "Mark the tournament oval",
          nextSceneId: "tournament-grounds",
          effects: {
            history: "Marked the tournament oval on the ruin map.",
          },
        },
        {
          id: "return-to-sracs",
          label: "Return to SRAC'S",
          nextSceneId: "sracs-tavern",
        },
      ],
    },
    {
      id: "north-hall",
      mapNodeId: "north-hall",
      kicker: "North Hall",
      title: "A bronze bell swings without wind.",
      image: "assets/scene-courtyard.svg",
      imageAlt: "A ruined school courtyard transformed into a fantasy stone hall with vines, arches, and warm evening light.",
      text:
        "Stone birds watch from a broken arcade. The bell rope is braided with red thread, and the dust beneath it has been disturbed by fresh tracks.",
      choices: [
        {
          id: "pull-bell-rope",
          label: "Pull the bell rope",
          check: {
            stat: "spirit",
            target: 12,
            success: {
              nextSceneId: "cinderwake-threshold",
              effects: {
                history: "The bell answered and revealed the Cinderwake Threshold.",
              },
            },
            failure: {
              nextSceneId: "north-hall",
              effects: {
                statDeltas: { gold: -1 },
                history: "The bell stayed silent, and the delay cost a little coin.",
              },
            },
          },
        },
        {
          id: "track-footprints",
          label: "Track the fresh footprints",
          check: {
            stat: "wits",
            target: 10,
            success: {
              nextSceneId: "tournament-grounds",
              effects: {
                history: "Tracked fresh footprints toward the tournament grounds.",
              },
            },
            failure: {
              nextSceneId: "central-courtyard",
              effects: {
                history: "Lost the footprints and circled back to the courtyard.",
              },
            },
          },
        },
        {
          id: "return-to-map",
          label: "Return to the map",
          nextSceneId: "ruin-map",
        },
      ],
    },
    {
      id: "central-courtyard",
      mapNodeId: "central-courtyard",
      kicker: "Central Courtyard",
      title: "Vines lace the courtyard stones like old spellwork.",
      image: "assets/scene-courtyard.svg",
      imageAlt: "A central ruined courtyard with stone wings, broken paving, vines, and a carved falcon sigil.",
      text:
        "Long hall wings lean inward around a grass-grown court. The paving stones are split by amber weeds, and a carved falcon sigil glints from a fallen lintel.",
      choices: [
        {
          id: "recover-falcon-sigil",
          label: "Recover the falcon sigil",
          nextSceneId: "central-courtyard",
          effects: {
            addItems: ["Falcon Sigil"],
            history: "Recovered a falcon sigil from Ash Court.",
          },
        },
        {
          id: "listen-at-arcade",
          label: "Listen at the broken arcade",
          check: {
            stat: "wits",
            target: 11,
            success: {
              nextSceneId: "north-hall",
              effects: {
                history: "Heard the hollow bell and followed the sound north.",
              },
            },
            failure: {
              nextSceneId: "central-courtyard",
              effects: {
                history: "The arcade only answered with wind.",
              },
            },
          },
        },
        {
          id: "cross-training-yards",
          label: "Cross to the training yards",
          nextSceneId: "training-courts",
        },
        {
          id: "return-to-sracs",
          label: "Return to SRAC'S",
          nextSceneId: "sracs-tavern",
        },
      ],
    },
    {
      id: "roadside-shrine",
      mapNodeId: "sracs-tavern",
      kicker: "Roadside Shrine",
      title: "An offering bowl glows under old ash.",
      image: "assets/scene-gatehouse.svg",
      imageAlt: "A fantasy gatehouse path with old stonework, sunset trees, and a small shrine along the road.",
      text:
        "The shrine is cracked but warm to the touch. A phoenix sigil flashes once when you brush away the dust.",
      choices: [
        {
          id: "take-ember-charm",
          label: "Take the ember charm",
          nextSceneId: "sracs-tavern",
          effects: {
            addItems: ["Ember Charm"],
            history: "Recovered an ember charm.",
          },
        },
        {
          id: "leave-gold",
          label: "Leave a gold coin",
          nextSceneId: "sracs-tavern",
          effects: {
            statDeltas: { gold: -1, spirit: 1 },
            history: "Left an offering at the shrine.",
          },
        },
      ],
    },
    {
      id: "tavern-yard",
      mapNodeId: "sracs-tavern",
      kicker: "Tavern Yard",
      title: "The merchant knows the ruin by another name.",
      image: "assets/scene-sracs-tavern.png",
      imageAlt: "The SRAC'S tavern exterior with glowing windows, trees, cobblestones, and a sign over the right entrance.",
      text:
        "He waits beside the wagon yard and calls the ruin Falconrise Keep. He will trade a charcoal-rubbed map for five gold, and his pack smells faintly of rain, iron, and cedar smoke.",
      choices: [
        {
          id: "buy-map",
          label: "Buy the map",
          nextSceneId: "ruin-map",
          requires: {
            stats: { gold: 5 },
          },
          effects: {
            statDeltas: { gold: -5 },
            addItems: ["Ruin Map"],
            history: "Bought a map to Falconrise Keep.",
          },
        },
        {
          id: "decline-map",
          label: "Decline and return to watch",
          nextSceneId: "sracs-tavern",
        },
      ],
    },
    {
      id: "training-courts",
      mapNodeId: "training-courts",
      kicker: "Training Courts",
      title: "Cracked courts serve as the keep's practice yard.",
      image: "assets/scene-tournament-grounds.svg",
      imageAlt: "An overgrown athletic ground transformed into a fantasy training yard with cracked courts and ruined terraces.",
      text:
        "Faded court lines show through dust and grass. Racks of broken practice spears lean against a wall where old chain-link has become thorned iron.",
      choices: [
        {
          id: "inspect-spears",
          label: "Inspect the broken spear rack",
          check: {
            stat: "might",
            target: 11,
            success: {
              nextSceneId: "training-courts",
              effects: {
                addItems: ["Practice Spear"],
                history: "Pulled a usable practice spear from the rack.",
              },
            },
            failure: {
              nextSceneId: "training-courts",
              effects: {
                history: "The rack collapsed into dust before anything useful came free.",
              },
            },
          },
        },
        {
          id: "cross-to-tournament",
          label: "Cross to the tournament oval",
          nextSceneId: "tournament-grounds",
        },
        {
          id: "return-courtyard",
          label: "Return to the central courtyard",
          nextSceneId: "central-courtyard",
        },
      ],
    },
    {
      id: "tournament-grounds",
      mapNodeId: "tournament-grounds",
      kicker: "Tournament Oval",
      title: "The old athletic grounds have become a knight's arena.",
      image: "assets/scene-tournament-grounds.svg",
      imageAlt: "A ruined athletic oval transformed into a tournament arena with dry grass, broken terraces, and drifting ash feathers.",
      text:
        "The oval field is ringed by broken terraces and cracked training yards. Dry grass whispers underfoot, and ash feathers drift over the goal lines like black snow.",
      choices: [
        {
          id: "pocket-ash-feather",
          label: "Pocket an ash feather",
          nextSceneId: "tournament-grounds",
          effects: {
            addItems: ["Ash Feather"],
            history: "Found an ash feather in the tournament oval.",
          },
        },
        {
          id: "cross-training-yard",
          label: "Cross the cracked training yard",
          check: {
            stat: "might",
            target: 13,
            success: {
              nextSceneId: "cinderwake-threshold",
              effects: {
                history: "Forced a path through the training yard to the buried gate.",
              },
            },
            failure: {
              nextSceneId: "training-courts",
              effects: {
                history: "The cracked yard forced a retreat to the courts.",
              },
            },
          },
        },
        {
          id: "circle-back-courtyard",
          label: "Circle back to Ash Court",
          nextSceneId: "central-courtyard",
        },
        {
          id: "return-map",
          label: "Return to the map",
          nextSceneId: "ruin-map",
        },
      ],
    },
    {
      id: "cinderwake-threshold",
      mapNodeId: "north-hall",
      kicker: "Cinderwake Threshold",
      title: "The hidden gate opens like an eye.",
      image: "assets/scene-tournament-grounds.svg",
      imageAlt: "A fantasy ruin lit by red light from a hidden underground gate.",
      text:
        "Beyond the gate, red light pulses through a buried hall. This is where the first real encounter will live as the game grows.",
      choices: [
        {
          id: "note-threshold",
          label: "Record the threshold on the map",
          nextSceneId: "ruin-map",
          effects: {
            history: "Recorded the gate beneath Falconrise Keep.",
          },
        },
        {
          id: "rest-banners",
          label: "Rest beneath the falcon banners",
          nextSceneId: "sracs-tavern",
        },
      ],
    },
  ],
};
