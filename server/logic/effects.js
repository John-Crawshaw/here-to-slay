// server/logic/effects.js

const Effects = {
  // --- FIGHTERS ---
  'h_f1': (game, player) => ({ type: 'SELECT_HERO', action: 'DESTROY', msg: 'Select a hero to destroy' }),
  
  'h_f2': (game, player) => {
    // Each other player discards. This is complex, so we simplify: 
    // Server forces random discard from others, then player picks one from a "temp" pool
    const pool = [];
    game.players.filter(p => p.id !== player.id).forEach(p => {
      if (p.hand.length > 0) {
        const index = Math.floor(Math.random() * p.hand.length);
        pool.push(p.hand.splice(index, 1)[0]);
      }
    });
    player.hand.push(...pool); // For simplicity, player takes all for now, or you can trigger SELECT_CARD
    return `Stole cards from all opponents!`;
  },

  'h_f7': (game, player) => ({ type: 'SELECT_PLAYER', action: 'FORCE_DISCARD', count: 2, msg: "Select an opponent's Hero to make them discard 2 cards." }),

  // --- BARDS ---
  'h_b1': (game, player) => {
    game.players.filter(p => p.id !== player.id).forEach(p => {
      if (p.hand.length > 0) player.hand.push(p.hand.pop());
    });
    return "You took a card from everyone!";
  },

  'h_b3': (game, player) => ({ type: 'SELECT_HERO', action: 'STEAL_AND_SWAP', msg: 'Steal a hero, but give them Tipsy Tootie' }),

  // --- GUARDIANS ---
  'h_g2': (game, player) => {
    player.tempModifier = (player.tempModifier || 0) + 3;
    return "Applied +3 to all your rolls this turn!";
  },

  // --- RANGERS ---
  'h_r1': (game, player) => {
    const items = game.discardPile.filter(c => c.type === 'ITEM');
    if (items.length === 0) return "Discard pile has no items.";
    return { type: 'SELECT_DISCARD', filter: 'ITEM', action: 'HAND', msg: 'Pick an item from discard' };
  },

  // --- WIZARDS ---
  'h_w2': (game, player) => ({ type: 'SELECT_PLAYER', action: 'SACRIFICE', msg: 'Target player must sacrifice a hero' }),

  'h_w3': (game, player) => ({ type: 'SELECT_HERO', action: 'STEAL_AND_ROLL', msg: 'Steal a hero and use it now!' }),
};

module.exports = Effects;