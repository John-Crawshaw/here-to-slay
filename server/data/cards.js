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
  // HEROES - UPDATED FROM CSV
  // Fighters
  { id: 'h_f1', type: 'HERO', class: 'Fighter', name: 'Bad Axe', cost: 1, rollRequirement: 8, description: '8+: Destroy a Hero Card' },
  { id: 'h_f2', type: 'HERO', class: 'Fighter', name: 'Beary Wise', cost: 1, rollRequirement: 7, description: '7+: Each other player must DISCARD a card. Choose one of the discarded cards and add it to your hand.' },
  { id: 'h_f3', type: 'HERO', class: 'Fighter', name: 'Bear Claw', cost: 1, rollRequirement: 7, description: "7+: Pull a card from another player's hand. If it is a Hero card, pull a second card from that player's hand." },
  { id: 'h_f4', type: 'HERO', class: 'Fighter', name: 'Qi Bear', cost: 1, rollRequirement: 10, description: '10+: DISCARD up to 3 cards. For each card discarded, DESTROY a Hero card.' },
  { id: 'h_f5', type: 'HERO', class: 'Fighter', name: 'Fury Knuckle', cost: 1, rollRequirement: 5, description: "5+: Pull a card from another player's hand. If it is a Challenge card, pull a second card from that player's hand." },
  { id: 'h_f6', type: 'HERO', class: 'Fighter', name: 'Pan Chucks', cost: 1, rollRequirement: 8, description: '8+: DRAW 2 cards. If at least one of those cards is a Challenge card, you may reveal it, then DESTROY a Hero card' },
  { id: 'h_f7', type: 'HERO', class: 'Fighter', name: 'Heavy Bear', cost: 1, rollRequirement: 5, description: '5+: Choose a player. That player must DISCARD 2 cards.' },
  { id: 'h_f8', type: 'HERO', class: 'Fighter', name: 'Tough Teddy', cost: 1, rollRequirement: 4, description: '4+: Each other player with a Fighter in their Party must DISCARD a card.' },

  // Bards
  { id: 'h_b1', type: 'HERO', class: 'Bard', name: 'Greedy Cheeks', cost: 1, rollRequirement: 8, description: '8+: Each other player must give you a card from their hand.' },
  { id: 'h_b2', type: 'HERO', class: 'Bard', name: 'Napping Nibbles', cost: 1, rollRequirement: 2, description: '2+: Do nothing' },
  { id: 'h_b3', type: 'HERO', class: 'Bard', name: 'Tipsy Tootie', cost: 1, rollRequirement: 6, description: '6+: Choose a player. STEAL a Hero from that player and move this card to their Party.' },

  // Guardians
  { id: 'h_g1', type: 'HERO', class: 'Guardian', name: 'Mighty Blade', cost: 1, rollRequirement: 8, description: '8+: Hero cards in your Party cannot be destroyed until the end of your next turn' },
  { id: 'h_g2', type: 'HERO', class: 'Guardian', name: 'Wise Shield', cost: 1, rollRequirement: 6, description: '+3 to all your rolls until the end of your turn.' },
  { id: 'h_g3', type: 'HERO', class: 'Guardian', name: 'Vibrant Glow', cost: 1, rollRequirement: 9, description: '+5 to all your rolls until the end of your turn.' },

  // Rangers
  { id: 'h_r1', type: 'HERO', class: 'Ranger', name: 'Lookie Rookie', cost: 1, rollRequirement: 5, description: '5+: Search the discard pile for an item card and add it to your hand.' },
  { id: 'h_r2', type: 'HERO', class: 'Ranger', name: 'Serious Grey', cost: 1, rollRequirement: 9, description: '9+: DESTROY a Hero and DRAW a card' },
  { id: 'h_r3', type: 'HERO', class: 'Ranger', name: 'Wildshot', cost: 1, rollRequirement: 8, description: '8+: DRAW 3 cards and DISCARD a card' },

  // Thieves
  { id: 'h_t1', type: 'HERO', class: 'Thief', name: 'Shurikitty', cost: 1, rollRequirement: 9, description: '9+: DESTROY a Hero card. If that Hero card had an item card equipped to it, add that item card to your hand instead of moving it to the discard pile.' },
  { id: 'h_t2', type: 'HERO', class: 'Thief', name: 'Sly Pickings', cost: 1, rollRequirement: 6, description: "6+: Pull a card from another player's hand. If that card is an item card, you may play it immediately." },
  { id: 'h_t3', type: 'HERO', class: 'Thief', name: 'Smooth Mimimeow', cost: 1, rollRequirement: 7, description: '7+: Pull a card from the hand of each other player with a Thief in their Party' },

  // Wizards
  { id: 'h_w1', type: 'HERO', class: 'Wizard', name: 'Bun Bun', cost: 1, rollRequirement: 5, description: '5+: Search the discard pile for a Magic card and add it to your hand.' },
  { id: 'h_w2', type: 'HERO', class: 'Wizard', name: 'Hopper', cost: 1, rollRequirement: 7, description: '7+: Choose a player. That player must SACRIFICE a Hero card.' },
  { id: 'h_w3', type: 'HERO', class: 'Wizard', name: 'Wiggles', cost: 1, rollRequirement: 10, description: '10+: STEAL a Hero and roll to use its effect immediately' },
  { id: 'h_w4', type: 'HERO', class: 'Wizard', name: 'Spooky', cost: 1, rollRequirement: 10, description: '10+: Each other player must SACRIFICE a Hero card.' },

  // ITEMS & MAGIC
  { id: 'i1', type: 'ITEM', name: 'Mask of Disguise', cost: 1, effect: 'Equipped Hero counts as any class' },
  { id: 'm1', type: 'MAGIC', name: 'Entangle', cost: 1, effect: 'Discard opponent card' },
  { id: 'm2', type: 'MAGIC', name: 'Forced Exchange', cost: 1, effect: 'Swap hands with a player' },
  
  // MODIFIERS
  { id: 'mod1', type: 'MODIFIER', name: '+3/-1', cost: 0, effect: 'Modify a roll by +3 or -1' },
  { id: 'mod2', type: 'MODIFIER', name: '+2/-2', cost: 0, effect: 'Modify a roll by +2 or -2' },

  // CHALLENGES
  { id: 'c1', type: 'CHALLENGE', name: 'Challenge!', cost: 0, effect: 'Stop a card from being played' },
];

const generateDeck = () => {
  let deck = [];
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