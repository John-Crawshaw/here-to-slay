// server/classes/Game.js
const { generateDeck, MONSTERS, PARTY_LEADERS } = require('../data/cards');

class Game {
  constructor(id) {
    this.id = id;
    this.players = []; 
    this.deck = [];
    this.discardPile = [];
    
    this.monsterDeck = [];
    this.activeMonsters = [];
    this.partyLeaderDeck = [...PARTY_LEADERS];

    this.currentTurnIndex = 0;
    this.started = false;
    this.actionPoints = 3;
    this.winner = null;

    // ROLL STATE
    this.activeRoll = null; // { active, currentTotal, target, passedPlayers: [], ... }

    // CHALLENGE STATE
    this.challengeState = {
      active: false,
      pendingCard: null,
      sourcePlayerId: null,
      challengerId: null,
      rolling: false
    };
  }

  addPlayer(id, name) {
    if (this.players.length >= 6) return false;
    this.players.push({ 
      id, name, hand: [], party: [], slayedMonsters: [], partyLeader: null 
    });
    return true;
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
  }

  startGame() {
    if (this.players.length < 2) return false;
    this.started = true;
    
    this.deck = generateDeck();
    this.shuffleDeck(this.deck);
    
    this.monsterDeck = [...MONSTERS]; 
    this.shuffleDeck(this.monsterDeck);
    this.activeMonsters = [this.monsterDeck.pop(), this.monsterDeck.pop(), this.monsterDeck.pop()].filter(Boolean);

    this.shuffleDeck(this.partyLeaderDeck);
    this.players.forEach(player => {
      player.partyLeader = this.partyLeaderDeck.pop();
      player.hand = [];
      for(let i=0; i<5; i++) {
        if(this.deck.length > 0) player.hand.push(this.deck.pop());
      }
    });
    
    this.currentTurnIndex = 0;
    this.actionPoints = 3; 
    return true;
  }

  shuffleDeck(deckArr) {
    for (let i = deckArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deckArr[i], deckArr[j]] = [deckArr[j], deckArr[i]];
    }
  }

  // --- ROLL MECHANICS ---

  createRoll(playerId, type, targetVal, sourceCardId, failVal = 0) {
    const player = this.players.find(p => p.id === playerId);
    const sourceCard = type === 'ATTACK' 
        ? this.activeMonsters.find(m => m.id === sourceCardId)
        : player.party.find(c => c.uniqueId === sourceCardId);

    // Leader Bonus Logic
    let bonus = 0;
    if (type === 'HERO_ABILITY' && player.partyLeader && sourceCard && player.partyLeader.class === sourceCard.class) {
        bonus = 2; 
    }

    this.activeRoll = {
        active: true,
        phase: 'WAITING', // <--- Waits for user click
        playerId,
        type, 
        sourceCardId,
        baseRoll: null,    // <--- No numbers yet
        leaderBonus: bonus,
        modifierTotal: 0,
        currentTotal: null, // <--- No numbers yet
        target: targetVal,
        failTarget: failVal,
        history: [], // Starts empty
        passedPlayers: []
    };
  }

  // 2. NEW METHOD: The actual roll
  rollMainDice(playerId) {
    if (!this.activeRoll || !this.activeRoll.active) return;
    if (this.activeRoll.phase !== 'WAITING') return;
    if (this.activeRoll.playerId !== playerId) return;

    // Generate Numbers
    const r1 = Math.floor(Math.random() * 6) + 1;
    const r2 = Math.floor(Math.random() * 6) + 1;
    const base = r1 + r2;

    this.activeRoll.baseRoll = base;
    this.activeRoll.currentTotal = base + (this.activeRoll.leaderBonus || 0);
    this.activeRoll.phase = 'MODIFIERS'; // Move to next phase
    
    // Log
    this.activeRoll.history.push(`🎲 Rolled ${r1} + ${r2} = ${base}`);
    if (this.activeRoll.leaderBonus > 0) {
        this.activeRoll.history.push(`+${this.activeRoll.leaderBonus} Leader Bonus`);
    }

    return { success: true };
  }

  passModifier(playerId) {
    if (!this.activeRoll?.active) return { error: "No active roll" };
    
    // Add to passed list
    if (!this.activeRoll.passedPlayers.includes(playerId)) {
        this.activeRoll.passedPlayers.push(playerId);
    }

    // CHECK CONSENSUS: If ALL players have passed, resolve.
    if (this.activeRoll.passedPlayers.length >= this.players.length) {
        // --- FIX START ---
        if (this.activeRoll.type === 'CHALLENGE') {
            return this.resolveChallenge();
        } else {
            return this.resolveCurrentRoll();
        }
        // --- FIX END ---
    }

    return { success: true };
  }

  // Add this to Game.js
 resolveChallenge() {
    const { challengerTotal, defenderTotal, challengerId, defenderId, defenderName } = this.activeRoll;
    const pendingCard = this.challengeState.pendingCard;
    let msg = "";

    // TIES go to the DEFENDER (The person playing the card) usually?
    // Rules: "If the challenger rolls higher, the card is cast away." 
    // So Defender wins ties.
    
    if (challengerTotal > defenderTotal) {
        msg = `🚫 Challenge Success! (${challengerTotal} vs ${defenderTotal}). Card Discarded.`;
        this.discardPile.push(pendingCard);
        // Refund AP? Usually no.
    } else {
        msg = `✅ Challenge Failed! (${challengerTotal} vs ${defenderTotal}). ${defenderName} plays the card.`;
        this.resolveNoChallenge(); // Proceed to play logic
    }

    this.activeRoll = null;
    if (challengerTotal > defenderTotal) {
        // Only clear if failed, otherwise resolveNoChallenge cleared it
        this.challengeState = { active: false, pendingCard: null, sourcePlayerId: null }; 
    }
    
    return { resolved: true, message: msg };
  }

  playModifier(playerId, cardUniqueId, val) {
    if (!this.activeRoll?.active) return { error: "No active roll" };
    
    const player = this.players.find(p => p.id === playerId);
    const cardIndex = player.hand.findIndex(c => c.uniqueId === cardUniqueId);
    if (cardIndex === -1) return { error: "Card not in hand" };
    
    const card = player.hand[cardIndex];
    if (card.type !== 'MODIFIER') return { error: "Not a modifier" };

    // USE THE CHOSEN VALUE
    // If 'val' was sent from client, use it. Otherwise, parse the first number found in name.
    let modValue = val !== undefined ? parseInt(val) : (parseInt(card.name.replace(/[^\d-]/g, '')) || 1);

    // Fallback if client didn't send a value (e.g. for simple cards like "+4")
    if (val === undefined || val === null) {
         const match = card.name.match(/([+-]?\d+)/);
         if (match) modValue = parseInt(match[0]);
    }

   if (this.activeRoll.type === 'CHALLENGE') {
        // If it's a challenge, we need to know who to apply it to.
        // SIMPLIFICATION: If you play it, it applies to YOU if you are involved.
        // If you are a 3rd party, default to helping the Defender (or block 3rd parties).
        
        if (playerId === this.activeRoll.challengerId) {
            this.activeRoll.challengerTotal += modValue;
            this.activeRoll.history.push(`${player.name} modified their roll by ${modValue}`);
        } else {
            // Defender OR 3rd party affects Defender's score
            this.activeRoll.defenderTotal += modValue;
            this.activeRoll.history.push(`${player.name} modified Defender's roll by ${modValue}`);
        }
    } else {
        // Standard Roll
        this.activeRoll.modifierTotal += modValue;
        this.activeRoll.currentTotal += modValue;
        this.activeRoll.history.push(`${player.name} played ${card.name} (${modValue})`);
    }

    this.activeRoll.passedPlayers = []; // Reset passes
    player.hand.splice(cardIndex, 1);
    this.discardPile.push(card);
    
    return { success: true };
  }

  // server/classes/Game.js -> resolveCurrentRoll method

  resolveCurrentRoll() {
    if (!this.activeRoll?.active) return { error: "No roll" };

    const { type, currentTotal, target, failTarget, sourceCardId, playerId } = this.activeRoll;
    const player = this.players.find(p => p.id === playerId);
    let resultMessage = "";

    if (type === 'HERO_ABILITY') {
        const card = player.party.find(c => c.uniqueId === sourceCardId);
        // Add safety check in case card was stolen/destroyed mid-roll
        if (!card) {
            resultMessage = "Hero missing! Effect cancelled.";
        } else if (currentTotal >= target) {
            resultMessage = this.resolveHeroEffect(player, card); 
        } else {
            resultMessage = "Ability Failed.";
        }
    } 
    else if (type === 'ATTACK') {
        const monsterIndex = this.activeMonsters.findIndex(m => m.id === sourceCardId);
        
        if (monsterIndex === -1) {
             resultMessage = "Monster is already gone!";
        } else {
            const monster = this.activeMonsters[monsterIndex];

            if (currentTotal >= target) {
                 this.activeMonsters.splice(monsterIndex, 1);
                 player.slayedMonsters.push(monster);
                 if (this.monsterDeck.length > 0) this.activeMonsters.push(this.monsterDeck.pop());
                 resultMessage = `Slayed ${monster.name}!`;
                 this.checkWinCondition(player);
            } else if (currentTotal <= failTarget) {
                // FIXED: Actually apply punishment (Simple version: Discard 1 card)
                resultMessage = `Attack Failed! Punishment: ${monster.punishment}`;
                if (player.hand.length > 0) {
                    const discarded = player.hand.pop();
                    this.discardPile.push(discarded);
                }
            } else {
                resultMessage = "Attack Missed (No punishment).";
            }
        }
    }

    this.activeRoll = null;
    return { success: true, message: resultMessage, resolved: true };
  }

  initiateChallenge(challengerId) {
    if (!this.challengeState.active) return { error: "No active challenge window" };
    if (this.challengeState.sourcePlayerId === challengerId) return { error: "Cannot challenge yourself" };
    
    const challenger = this.players.find(p => p.id === challengerId);
    const challengeCardIndex = challenger.hand.findIndex(c => c.type === 'CHALLENGE');
    if (challengeCardIndex === -1) return { error: "You don't have a Challenge card!" };

    // Burn Card
    const challengeCard = challenger.hand.splice(challengeCardIndex, 1)[0];
    this.discardPile.push(challengeCard);

    // SETUP CHALLENGE ROLL STATE
    this.activeRoll = {
        active: true,
        type: 'CHALLENGE',
        phase: 'ROLLING', // <--- New Phase Concept
        challengerId: challengerId,
        defenderId: this.challengeState.sourcePlayerId,
        challengerName: challenger.name,
        defenderName: this.players.find(p => p.id === this.challengeState.sourcePlayerId).name,
        challengerRoll: null, // Waiting for input
        defenderRoll: null,   // Waiting for input
        challengerTotal: 0,
        defenderTotal: 0,
        history: [`⚔️ ${challenger.name} challenged! Waiting for rolls...`],
        passedPlayers: []
    };

    return { success: true };
  }

  // 2. NEW METHOD: Handle individual rolls
  rollChallengeDice(playerId) {
      if (!this.activeRoll || this.activeRoll.type !== 'CHALLENGE') return;
      if (this.activeRoll.phase !== 'ROLLING') return;

      const rollVal = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;

      if (playerId === this.activeRoll.challengerId && this.activeRoll.challengerRoll === null) {
          this.activeRoll.challengerRoll = rollVal;
          this.activeRoll.challengerTotal = rollVal;
          this.activeRoll.history.push(`${this.activeRoll.challengerName} rolled ${rollVal}`);
      } 
      else if (playerId === this.activeRoll.defenderId && this.activeRoll.defenderRoll === null) {
          this.activeRoll.defenderRoll = rollVal;
          this.activeRoll.defenderTotal = rollVal;
          this.activeRoll.history.push(`${this.activeRoll.defenderName} rolled ${rollVal}`);
      }

      // If both have rolled, move to MODIFIER phase
      if (this.activeRoll.challengerRoll !== null && this.activeRoll.defenderRoll !== null) {
          this.activeRoll.phase = 'MODIFIERS';
          this.activeRoll.history.push("Both rolled! Modifier Phase started.");
      }
  }

  resolveHeroEffect(player, card) {
    let msg = "";
    switch (card.id) {
        case 'h1': // Fighter
            if (this.deck.length > 0) { player.hand.push(this.deck.pop()); msg = "Drew a card!"; }
            break;
        case 'h2': // Bard
            if (this.deck.length > 0) { player.hand.push(this.deck.pop()); msg = "Bard Song! (Drew 1)"; }
            break;
        case 'h3': // Guardian
             if (this.deck.length > 0) { player.hand.push(this.deck.pop()); msg = "Protected! (Drew 1)"; }
            break;
        case 'h4': // Ranger (Destroy Item)
            const targetOpponent = this.players.find(p => p.id !== player.id && p.party.some(c => c.type === 'ITEM'));
            if (targetOpponent) {
                const idx = targetOpponent.party.findIndex(c => c.type === 'ITEM');
                const destroyed = targetOpponent.party.splice(idx, 1)[0];
                this.discardPile.push(destroyed);
                msg = `Destroyed ${targetOpponent.name}'s ${destroyed.name}!`;
            } else msg = "No items to destroy.";
            break;
        case 'h5': // Thief (Steal Card)
            const victim = this.players.find(p => p.id !== player.id && p.hand.length > 0);
            if (victim) {
                const randIdx = Math.floor(Math.random() * victim.hand.length);
                const stolen = victim.hand.splice(randIdx, 1)[0];
                player.hand.push(stolen);
                msg = `Stole card from ${victim.name}!`;
            } else msg = "No one has cards.";
            break;
        case 'h6': // Wizard
            if (this.deck.length > 0) { player.hand.push(this.deck.pop()); msg = "Magic Found! (Drew 1)"; }
            break;
        default: msg = "Effect triggered!"; break;
    }
    return msg;
  }

  // --- STANDARD ACTIONS ---

  drawCard(playerId) {
    if (this.players[this.currentTurnIndex].id !== playerId) return { error: "Not turn" };
    if (this.actionPoints < 1) return { error: "Low AP" };
    const p = this.players.find(p => p.id === playerId);
    if(this.deck.length > 0) p.hand.push(this.deck.pop());
    this.actionPoints--;
    return { success: true };
  }

  playCard(playerId, cardUniqueId) {
    if (this.challengeState.active || this.activeRoll?.active) return { error: "Busy" };
    if (this.players[this.currentTurnIndex].id !== playerId) return { error: "Not turn" };
    
    const p = this.players.find(p => p.id === playerId);
    const idx = p.hand.findIndex(c => c.uniqueId === cardUniqueId);
    if (idx === -1) return { error: "No card" };

    if (this.actionPoints < 1) return { error: "Low AP" };

    const card = p.hand[idx];
    // Modifiers cannot be played as Actions, only during Rolls
    if (card.type === 'MODIFIER') return { error: "Play modifiers during a roll only." };

    p.hand.splice(idx, 1);
    
    if (['HERO', 'ITEM', 'MAGIC'].includes(card.type)) {
      this.challengeState = { active: true, pendingCard: card, sourcePlayerId: playerId, rolling: false, passedPlayers: [] };
      this.actionPoints -= 1;
      return { success: true, message: "Waiting for challenges..." };
    } 
    return { success: true };
  }

  passChallenge(playerId) {
      if (!this.challengeState.active) return { error: "No active challenge" };
      if (playerId === this.challengeState.sourcePlayerId) return { error: "Cannot pass own card" };

      // Record the pass
      if (!this.challengeState.passedPlayers.includes(playerId)) {
          this.challengeState.passedPlayers.push(playerId);
      }

      // AUTO-RESOLVE CHECK: 
      // If (Everyone passed) AND (No one challenged), resolve immediately.
      // We check against players.length - 1 because the source player doesn't pass/challenge.
      if (this.challengeState.passedPlayers.length >= (this.players.length - 1)) {
          this.resolveNoChallenge(); // Proceed to play the card
      }

      return { success: true };
  }

  attackMonster(playerId, monsterId) {
    if (this.activeRoll?.active) return { error: "Roll Active" };
    if (this.players[this.currentTurnIndex].id !== playerId) return { error: "Not turn" };
    if (this.actionPoints < 2) return { error: "Need 2 AP" };

    const monster = this.activeMonsters.find(m => m.id === monsterId);
    if (!monster) return { error: "Monster not found" };

    const player = this.players.find(p => p.id === playerId);
    
    // Check hero count requirement
    if (monster.reqCount && player.party.filter(c => c.type === 'HERO').length < monster.reqCount) {
      return { error: `Need ${monster.reqCount} hero${monster.reqCount > 1 ? 'es' : ''} in party` };
    }

    // Check class requirement
    if (monster.reqClass && !player.party.some(c => c.class === monster.reqClass)) {
      return { error: `Need a ${monster.reqClass} in party` };
    }

    this.actionPoints -= 2;
    this.createRoll(playerId, 'ATTACK', monster.rollTarget, monsterId, monster.failTarget);
    return { success: true };
  }

  useHeroAbility(playerId, cardUniqueId) {
    if (this.activeRoll?.active) return { error: "Roll Active" };
    if (this.players[this.currentTurnIndex].id !== playerId) return { error: "Not turn" };
    if (this.actionPoints < 1) return { error: "Need 1 AP" };

    const p = this.players.find(p => p.id === playerId);
    const card = p.party.find(c => c.uniqueId === cardUniqueId);
    if (card.isUsedThisTurn) return { error: "Used already" };

    this.actionPoints -= 1;
    card.isUsedThisTurn = true;
    this.createRoll(playerId, 'HERO_ABILITY', card.rollRequirement, cardUniqueId);
    return { success: true };
  }

  resolveNoChallenge() {
     if (!this.challengeState.active) return;
     
     const p = this.players.find(p => p.id === this.challengeState.sourcePlayerId);
     const c = this.challengeState.pendingCard;
     


     if (c.type === 'MAGIC') {
         this.discardPile.push(c); 
         // TODO: You can trigger magic effects here similar to how we trigger Hero rolls below
     } 
     else if (c.type === 'HERO') {
         // 2. Add Hero to Party
         p.party.push(c);
         
         // 3. Mark as used so they can't manually roll again for another AP this turn
         c.isUsedThisTurn = true; 

         // 4. TRIGGER THE FORCED ROLL
         // We reuse the existing 'HERO_ABILITY' logic. 
         // createRoll sets this.activeRoll, which opens the UI modal for everyone.
         this.createRoll(p.id, 'HERO_ABILITY', c.rollRequirement, c.uniqueId);
         
         // Add a history log so people know why a roll started
         this.activeRoll.history.push(`➡️ ${p.name} played ${c.name} and rolls immediately!`);
     } 
     else {
         // Items, Leaders, etc. just land in the party
         p.party.push(c);
     }

     // 5. Clear the Challenge State
     this.challengeState = { 
         active: false, 
         pendingCard: null, 
         sourcePlayerId: null, 
         passedPlayers: [] 
     };
  }

  discardHand(playerId) {
    if (this.players[this.currentTurnIndex].id !== playerId) return { error: "Not turn" };
    if (this.actionPoints < 3) return { error: "Need 3 AP" };
    
    const p = this.players.find(p => p.id === playerId);
    
    // Discard current hand
    this.discardPile.push(...p.hand);
    p.hand = [];
    
    // Draw 5 new cards
    for(let i = 0; i < 5; i++) {
      if(this.deck.length > 0) {
        p.hand.push(this.deck.pop());
      }
    }
    
    this.actionPoints -= 3;
    return { success: true };
  }

  endTurn() {
    this.players[this.currentTurnIndex].party.forEach(c => c.isUsedThisTurn = false);
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
    this.actionPoints = 3; 
    this.checkWinCondition(this.players[this.currentTurnIndex]);
  }

  checkWinCondition(player) {
    if (player.slayedMonsters.length >= 3) this.winner = player.id;
    // Add 6 class check here
  }

  getPublicState() {
    return {
      id: this.id,
      started: this.started,
      winner: this.winner,
      currentTurn: this.currentTurnIndex,
      activeMonsters: this.activeMonsters,
      activeRoll: this.activeRoll,
      actionPoints: this.actionPoints,
      challengeState: this.challengeState,
      players: this.players.map(p => ({
        id: p.id, 
        name: p.name, 
        partyLeader: p.partyLeader, 
        party: p.party, 
        slayedMonsters: p.slayedMonsters, 
        handCount: p.hand.length 
      }))
    };
  }

  getPlayerPrivateState(playerId) {
    const p = this.players.find(p => p.id === playerId);
    return p ? { hand: p.hand } : { hand: [] };
  }
}

module.exports = Game;