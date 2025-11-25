// server/data/cards.js

const PARTY_LEADERS = [
  { id: 'pl1', type: 'LEADER', class: 'Fighter', name: 'The Fist of Reason', skill: '+2 to all Fighter rolls' },
  { id: 'pl2', type: 'LEADER', class: 'Bard', name: 'Charismatic Song', skill: '+2 to all Bard rolls' },
  { id: 'pl3', type: 'LEADER', class: 'Guardian', name: 'Protecting Horn', skill: '+2 to all Guardian rolls' },
  { id: 'pl4', type: 'LEADER', class: 'Ranger', name: 'Shadow Claw', skill: '+2 to all Ranger rolls' },
  { id: 'pl5', type: 'LEADER', class: 'Thief', name: 'Cloaked Sage', skill: '+2 to all Thief rolls' },
  { id: 'pl6', type: 'LEADER', class: 'Wizard', name: 'Spelling Bee', skill: '+2 to all Wizard rolls' },
];

const MONSTERS = [
  { 
    id: 'mon1', type: 'MONSTER', name: 'Draco', 
    reqText: '1 Hero', reqCount: 1, 
    rollTarget: 8, failTarget: 4, 
    reward: 'Draw 2 cards', punishment: 'Discard 1 card' 
  },
  { 
    id: 'mon2', type: 'MONSTER', name: 'Terratuga', 
    reqText: '2 Heroes', reqCount: 2, 
    rollTarget: 9, failTarget: 5, 
    reward: '+1 Action Point next turn', punishment: 'Sacrifice a Hero' 
  },
  { 
    id: 'mon3', type: 'MONSTER', name: 'War Bear', 
    reqText: 'Fighter Class', reqClass: 'Fighter', 
    rollTarget: 7, failTarget: 3, 
    reward: 'Your Fighters get +1', punishment: 'Discard 2 cards' 
  },
  { 
    id: 'mon4', type: 'MONSTER', name: 'Abyss Queen', 
    reqText: '3 Heroes', reqCount: 3, 
    rollTarget: 10, failTarget: 6, 
    reward: 'Steal a Hero', punishment: 'Slain Monsters -1' 
  },
];

const CARDS = [
  // HEROES
  { id: 'h1', type: 'HERO', class: 'Fighter', name: 'Heavy Bear', cost: 1, rollRequirement: 5, description: '5+: Draw a card' },
  { id: 'h2', type: 'HERO', class: 'Bard', name: 'Lute Loot', cost: 1, rollRequirement: 6, description: '6+: +2 to all rolls this turn' },
  { id: 'h3', type: 'HERO', class: 'Guardian', name: 'Holy Guard', cost: 1, rollRequirement: 4, description: '4+: Look at top 3 cards' },
  { id: 'h4', type: 'HERO', class: 'Ranger', name: 'Sharp Eye', cost: 1, rollRequirement: 5, description: '5+: Destroy an item' },
  { id: 'h5', type: 'HERO', class: 'Thief', name: 'Sly Fox', cost: 1, rollRequirement: 7, description: '7+: Steal a card' },
  { id: 'h6', type: 'HERO', class: 'Wizard', name: 'Wise Old Owl', cost: 1, rollRequirement: 6, description: '6+: Search deck for Magic' },

  // ITEMS & MAGIC
  { id: 'i1', type: 'ITEM', name: 'Mask of Disguise', cost: 1, effect: 'Equipped Hero counts as any class' },
  { id: 'm1', type: 'MAGIC', name: 'Entangle', cost: 1, effect: 'Discard opponent card' },
  { id: 'm2', type: 'MAGIC', name: 'Forced Exchange', cost: 1, effect: 'Swap hands with a player' },
  
  // MODIFIERS (Simplified for this version)
  { id: 'mod1', type: 'MODIFIER', name: '+3/-1', cost: 0, effect: 'Modify a roll by +3 or -1' },
  { id: 'mod2', type: 'MODIFIER', name: '+2/-2', cost: 0, effect: 'Modify a roll by +2 or -2' },

  // CHALLENGES
  { id: 'c1', type: 'CHALLENGE', name: 'Challenge!', cost: 0, effect: 'Stop a card from being played' },
];

const generateDeck = () => {
  let deck = [];
  // Add 4 copies of standard cards
  for(let i=0; i<4; i++) {
    deck = [...deck, ...CARDS.map(c => ({ 
      ...c, 
      uniqueId: `${c.id}-${i}-${Math.random()}`,
      isUsedThisTurn: false 
    }))];
  }
  return deck;
};

module.exports = { CARDS, MONSTERS, PARTY_LEADERS, generateDeck };