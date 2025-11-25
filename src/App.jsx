// src/App.jsx
import { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import Card from './components/Card';
import './App.css';

function App() {
  const {
    gameState, privateState, currentGameId, playerId, error, lastRoll, 
    createGame, joinGame, startGame, 
    drawCard, discardHand, playCard, attackMonster, useHeroAbility, 
    challengeCard, endTurn, passChallenge,
    playModifier, passModifier
  } = useWebSocket();

  const [playerName, setPlayerName] = useState('');
  const [gameIdInput, setGameIdInput] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [modDecisionCard, setModDecisionCard] = useState(null);
  const hasChallengeCard = privateState?.hand?.some(c => c.type === 'CHALLENGE');

  const handleModifierClick = (card) => {
    // Check if card has multiple options (e.g., "+3/-1")
    if (card.name.includes('/')) {
        setModDecisionCard(card); // Open the choice UI
    } else {
        // It's a single value card (e.g., "+4"), just play it
        // We extract the number from the name string
        const val = parseInt(card.name.replace(/[^\d-]/g, '')); 
        playModifier(card.uniqueId, val);
    }
};

const submitModChoice = (val) => {
    if (modDecisionCard) {
        playModifier(modDecisionCard.uniqueId, val);
        setModDecisionCard(null); // Close the choice UI
    }
};

  // --- NEW ROLL MODAL ---
  const renderRollModal = () => {
    if (!gameState.activeRoll || !gameState.activeRoll.active) return null;

    const { 
        type, phase, history = [], passedPlayers = [],
        currentTotal, target, // Standard Roll props
        challengerTotal, defenderTotal, challengerId, defenderId, challengerName, defenderName, challengerRoll, defenderRoll // Challenge Props
    } = gameState.activeRoll;

    const hasPassed = passedPlayers.includes(playerId);
    const myModifiers = privateState?.hand?.filter(c => c.type === 'MODIFIER') || [];

    // --- CASE 1: CHALLENGE UI ---
    if (type === 'CHALLENGE') {
        return (
            <div className="modal-overlay">
                <div className="roll-modal" style={{border: '4px solid #e74c3c'}}>
                    <h2>⚔️ CHALLENGE ⚔️</h2>
                    
                    {/* SCORES BOARD */}
                    <div style={{display:'flex', justifyContent:'space-around', margin:'20px 0', alignItems:'center'}}>
                        <div style={{textAlign:'center', opacity: (phase==='ROLLING' && !challengerRoll) ? 0.5 : 1}}>
                            <h3>{challengerName} (Challenger)</h3>
                            <div className="dice-val" style={{fontSize:'3rem'}}>
                                {challengerRoll !== null ? challengerTotal : '?'}
                            </div>
                            {/* SHOW ROLL BUTTON IF IT'S ME AND I HAVEN'T ROLLED */}
                            {phase === 'ROLLING' && playerId === challengerId && !challengerRoll && (
                                <button className="attack-btn" onClick={rollChallengeDice}>🎲 ROLL</button>
                            )}
                        </div>

                        <div style={{fontWeight:'bold', fontSize:'1.5rem'}}>VS</div>

                        <div style={{textAlign:'center', opacity: (phase==='ROLLING' && !defenderRoll) ? 0.5 : 1}}>
                            <h3>{defenderName} (Defender)</h3>
                            <div className="dice-val" style={{fontSize:'3rem'}}>
                                {defenderRoll !== null ? defenderTotal : '?'}
                            </div>
                            {/* SHOW ROLL BUTTON IF IT'S ME AND I HAVEN'T ROLLED */}
                            {phase === 'ROLLING' && playerId === defenderId && !defenderRoll && (
                                <button className="attack-btn" onClick={rollChallengeDice}>🎲 ROLL</button>
                            )}
                        </div>
                    </div>

                    <div className="roll-history">
                        {history.map((h, i) => <div key={i}>{h}</div>)}
                    </div>

                    {/* MODIFIER PHASE (Only after both rolled) */}
                    {phase === 'MODIFIERS' && (
                        <>
                            <div style={{marginBottom:10, color:'yellow'}}>Modifier Phase! Highest roll wins. (Ties go to Defender)</div>
                            {!hasPassed ? (
                                <div className="modifier-section">
                                    {/* (Use the same Modifier Card rendering/logic as before here) */}
                                    <div className="mod-hand">
                                        {myModifiers.map(card => (
                                            <div key={card.uniqueId} className="mini-card modifier" onClick={() => handleModifierClick(card)}>
                                                {card.name}
                                            </div>
                                        ))}
                                    </div>
                                    <button className="resolve-btn" onClick={passModifier}>PASS</button>
                                </div>
                            ) : (
                                <div>✅ You passed. Waiting for verdict...</div>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }

    // --- CASE 2: STANDARD ROLL UI (Attack/Ability) ---
    // (Paste your existing standard roll return code here, or just let it fall through)
    return (
        <div className="modal-overlay">
            {/* ... Existing Standard Roll Code ... */}
             <div className="roll-modal">
                <h2>{type === 'ATTACK' ? '⚔️ ATTACK ROLL' : '✨ ABILITY ROLL'}</h2>
                <div className="dice-display">
                    <div className={`dice-val ${currentTotal >= target ? 'success' : 'fail'}`}>{currentTotal}</div>
                    <div className="target-val">Goal: {target}+</div>
                </div>
                {/* ... rest of standard UI ... */}
                 {!hasPassed ? (
                    <div className="modifier-section">
                        <div className="mod-hand">
                             {myModifiers.map(card => (
                                <div key={card.uniqueId} className="mini-card modifier" onClick={() => handleModifierClick(card)}>
                                    {card.name}
                                </div>
                            ))}
                        </div>
                        <button className="resolve-btn" onClick={passModifier}>PASS</button>
                    </div>
                 ) : (
                    <div>✅ You passed.</div>
                 )}
             </div>
        </div>
    );
  };

  // --- LOBBY & WAITING ROOM ---
  if (!currentGameId) {
    return (
      <div className="app lobby" style={{display:'flex', alignItems:'center', justifyContent:'center'}}>
        <div style={{textAlign:'center'}}>
            <h1>Here to Slay Clone</h1>
            <input placeholder="Name" value={playerName} onChange={e=>setPlayerName(e.target.value)} style={{padding:8}}/>
            <button onClick={() => createGame(playerName)} style={{margin:5}}>Create</button>
            <br/>
            <input placeholder="Game ID" value={gameIdInput} onChange={e=>setGameIdInput(e.target.value)} style={{padding:8}}/>
            <button onClick={() => joinGame(gameIdInput, playerName)} style={{margin:5}}>Join</button>
        </div>
      </div>
    );
  }

  if (!gameState) return <div>Loading State...</div>;
  if (!gameState.started) {
    return (
      <div className="app waiting-room" style={{textAlign:'center', paddingTop:50}}>
        <h2>Game ID: {currentGameId}</h2>
        <button onClick={startGame}>Start Game</button>
        <ul>{gameState.players.map(p => <li key={p.id}>{p.name}</li>)}</ul>
      </div>
    );
  }

  if (gameState.winner) {
    return <div className="app winner-screen"><h1>Winner: {gameState.players.find(p => p.id === gameState.winner)?.name}</h1></div>;
  }

  const isMyTurn = gameState.players[gameState.currentTurn]?.id === playerId;

  return (
    <div className="app game-board">
      {error && <div className="error-toast" style={{position:'absolute', top:20, right:20, background:'red', padding:10}}>{error}</div>}
      
      {renderRollModal()}
      
      {/* MONSTER BOARD */}
      <div className="monster-board">
        <h3>Monsters</h3>
        <div className="monster-row">
            {gameState.activeMonsters.map(m => (
                <div key={m.id} className="monster-slot">
                    <Card card={m} isMini={true} />
                    {isMyTurn && <button className="attack-btn" onClick={() => attackMonster(m.id)}>⚔️</button>}
                </div>
            ))}
        </div>
      </div>

      {/* CHALLENGES / NOTIFICATIONS */}
      {gameState.challengeState.active && (
         <div className="modal-overlay">
            <div className="modal-content" style={{background:'white', padding:20, color:'black'}}>
                <h3>Challenge Phase</h3>
                <p>
                    {gameState.players.find(p => p.id === gameState.challengeState.sourcePlayerId)?.name} 
                    is playing <strong>{gameState.challengeState.pendingCard?.name}</strong>.
                </p>

                {gameState.challengeState.sourcePlayerId !== playerId ? (
                    /* OPPONENT VIEW */
                    <div style={{display:'flex', gap:10, justifyContent:'center'}}>
                      {!gameState.challengeState.passedPlayers?.includes(playerId) ? (
                        <>
                          <button 
                              style={{
                                  background: hasChallengeCard ? 'red' : 'grey', 
                                  color: 'white', 
                                  cursor: hasChallengeCard ? 'pointer' : 'not-allowed'
                              }} 
                              onClick={challengeCard}
                              disabled={!hasChallengeCard} // <--- DISABLE IF NO CARD
                          >
                              ✋ CHALLENGE!
                          </button>
                          
                          <button onClick={() => passChallenge()}>
                              Pass
                          </button>
                        </>
                      ) : (
                        <div>✅ You passed. Waiting for others...</div>
                      )}
                  </div>
                ) : (
                    /* ACTIVE PLAYER VIEW */
                    <div>
                        <p>Waiting for opponents to decide...</p>
                        {/* Removed manual 'Resolve' button to enforce auto-resolve */}
                        <div className="loader">⏳</div> 
                    </div>
                )}
            </div>
         </div>
      )}
      {lastRoll && (
         <div className="roll-notification" style={{position:'absolute', top:'40%', left:'50%', transform:'translate(-50%,-50%)', background:'white', padding:20, zIndex:2000, color:'black', border:'4px solid gold'}}>
            <h3>{lastRoll.message}</h3>
         </div>
      )}

      {/* OPPONENTS */}
      <div className="opponents-container">
        {gameState.players.filter(p => p.id !== playerId).map(p => (
          <div key={p.id} className="opponent-area">
            <h4>{p.name} (Hand: {p.handCount})</h4>
            <div className="party-row">
                {p.partyLeader && <Card card={p.partyLeader} isMini={true} />}
                {p.party.map((c, i) => <Card key={i} card={c} isMini={true} />)}
            </div>
            <div style={{fontSize:'0.7rem', color:'gold'}}>🏆 {p.slayedMonsters.length}</div>
          </div>
        ))}
      </div>

      {/* MY AREA */}
      <div className="my-area">
        <div className="stats-bar">
            AP: {gameState.actionPoints}/3 | Turn: {gameState.players[gameState.currentTurn].name}
        </div>
        
        <div className="my-party">
            <h3>Party</h3>
            <div className="party-row">
                {gameState.players.find(p => p.id === playerId)?.partyLeader && (
                    <Card card={gameState.players.find(p => p.id === playerId).partyLeader} isMini={true} />
                )}
                {gameState.players.find(p => p.id === playerId)?.party.map((c, i) => (
                    <Card key={i} card={c} isMini={true} canRoll={isMyTurn && c.type === 'HERO'} onRoll={useHeroAbility}/>
                ))}
            </div>
        </div>

        <div className="my-hand">
            <h3>Hand</h3>
            <div className="hand-row">
                {privateState?.hand?.map(c => (
                    <Card key={c.uniqueId} card={c} isSelected={selectedCard?.uniqueId === c.uniqueId} onClick={() => setSelectedCard(c)} />
                ))}
            </div>
        </div>

        <div className="controls">
            <button disabled={!isMyTurn} onClick={drawCard}>Draw (1)</button>
            <button disabled={!isMyTurn || !selectedCard} onClick={() => { playCard(selectedCard.uniqueId); setSelectedCard(null); }}>Play (1)</button>
            <button disabled={!isMyTurn} onClick={discardHand} style={{background:'#c0392b', color:'white'}}>Dump Hand (3)</button>
            <button disabled={!isMyTurn} onClick={endTurn}>End Turn</button>
        </div>
      </div>
    </div>
  );
}

export default App;