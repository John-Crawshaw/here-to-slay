// src/App.jsx
import { useState, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import Card from './components/Card';
import './App.css';

function App() {
  const {
    gameState, privateState, currentGameId, playerId, error, lastRoll, 
    createGame, joinGame, startGame, 
    drawCard, discardHand, playCard, attackMonster, useHeroAbility, 
    challengeCard, endTurn, passChallenge,
    playModifier, passModifier,
    rollMainDice, rollChallengeDice,
    handleInteraction 
  } = useWebSocket();

  // ... (State definitions remain the same) ...
  const [playerName, setPlayerName] = useState('');
  const [gameIdInput, setGameIdInput] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [modDecisionCard, setModDecisionCard] = useState(null);
  const pendingInteraction = gameState?.pendingInteraction;
  const isChoosing = pendingInteraction?.sourcePlayerId === playerId;
  const hasChallengeCard = privateState?.hand?.some(c => c.type === 'CHALLENGE');
  const [isRolling, setIsRolling] = useState(false);
  const [displayedDice, setDisplayedDice] = useState(1);
  const [isChallengeRolling, setIsChallengeRolling] = useState(false);
  const [displayedChallengeDice, setDisplayedChallengeDice] = useState(1);

  // ... (useEffect and Handlers remain the same) ...
  useEffect(() => {
    if (gameState?.activeRoll?.currentTotal) setIsRolling(false);
    if (gameState?.activeRoll?.type === 'CHALLENGE' && 
        gameState?.activeRoll?.challengerRoll !== null && 
        gameState?.activeRoll?.defenderRoll !== null) {
        setIsChallengeRolling(false);
    }
  }, [gameState?.activeRoll]);

  const handleRollClick = () => {
    setIsRolling(true);
    const shuffle = setInterval(() => setDisplayedDice(Math.floor(Math.random() * 11) + 2), 100);
    rollMainDice();
    setTimeout(() => clearInterval(shuffle), 1000);
  };

  const handleChallengeRollClick = () => {
    setIsChallengeRolling(true);
    const shuffle = setInterval(() => setDisplayedChallengeDice(Math.floor(Math.random() * 11) + 2), 100);
    rollChallengeDice();
    setTimeout(() => clearInterval(shuffle), 1000);
  };

  const handleModifierClick = (card) => {
    if (card.name.includes('/')) {
        setModDecisionCard(card);
    } else {
        const match = card.name.match(/([+-]?\d+)/);
        const val = match ? parseInt(match[0]) : 1; 
        playModifier(card.uniqueId, val);
    }
  };

  const submitModChoice = (val) => {
    if (modDecisionCard) {
        playModifier(modDecisionCard.uniqueId, val);
        setModDecisionCard(null);
    }
  };

  // Helper to determine if a specific card is a valid target based on server instruction
  const isCardValidTarget = (card, locationOwnerId) => {
    if (!isChoosing || !pendingInteraction) return false;
    const { type, action } = pendingInteraction;

    // NOTE: I removed the FORCE_DISCARD check here because we are handling
    // player selection via the Modal now, not by clicking cards on the board.
    
    if (type === 'SELECT_HERO') {
        return card.type === 'HERO' && locationOwnerId !== playerId;
    }
    if (action === 'SACRIFICE') {
        return card.type === 'HERO' && locationOwnerId === playerId;
    }
    return false;
  };

  // --- 1. MOVED THIS OUTSIDE ---
  const renderInteractionModal = () => {
    if (!isChoosing || !pendingInteraction) return null;

    // If the server wants us to SELECT A PLAYER
    if (pendingInteraction.type === 'SELECT_PLAYER') {
        // Filter out myself, only show opponents
        const opponents = gameState.players.filter(p => p.id !== playerId);

        return (
            <div className="modal-overlay">
                <div className="roll-modal">
                    <h2>{pendingInteraction.msg || "Choose a Player"}</h2>
                    <div className="player-selection-list">
                        {opponents.map(p => (
                            <button 
                                key={p.id} 
                                className="attack-btn-large" 
                                style={{margin: '10px', display: 'block', width: '100%'}}
                                onClick={() => handleInteraction(p.id)} // Send Player ID
                            >
                                {p.name} ({p.handCount} cards)
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    return null;
  };

  // --- 2. RENDER ROLL MODAL (Kept separate) ---
  const renderRollModal = () => {
    if (!gameState.activeRoll || !gameState.activeRoll.active) return null;
    const { type, phase, history = [], passedPlayers = [], currentTotal, target, challengerTotal, defenderTotal, challengerId, defenderId, challengerName, defenderName, challengerRoll, defenderRoll } = gameState.activeRoll;
    const hasPassed = passedPlayers.includes(playerId);
    const myModifiers = privateState?.hand?.filter(c => c.type === 'MODIFIER') || [];

    if (type === 'CHALLENGE') {
        const iAmChallenger = playerId === challengerId;
        const iAmDefender = playerId === defenderId;
        const needToRoll = (iAmChallenger || iAmDefender) && (iAmChallenger ? challengerRoll : defenderRoll) === null && phase === 'ROLLING';

        return (
            <div className="modal-overlay">
                <div className="roll-modal" style={{border: '4px solid #e74c3c'}}>
                    <h2>⚔️ CHALLENGE ⚔️</h2>
                    {needToRoll && !isChallengeRolling ? (
                        <div className="roll-section" style={{textAlign: 'center', margin: '20px 0'}}>
                            <button className="attack-btn-large" onClick={handleChallengeRollClick}>🎲 CLICK TO ROLL</button>
                        </div>
                    ) : (
                        <div style={{display:'flex', justifyContent:'space-around', margin:'20px 0', alignItems:'center'}}>
                            <div style={{textAlign:'center'}}>
                                <h3>{challengerName}</h3>
                                <div className={`dice-val ${isChallengeRolling && iAmChallenger ? 'shaking' : ''}`} style={{fontSize:'3rem'}}>
                                    {isChallengeRolling && iAmChallenger ? displayedChallengeDice : challengerTotal}
                                </div>
                            </div>
                            <div style={{fontWeight:'bold', fontSize:'1.5rem'}}>VS</div>
                            <div style={{textAlign:'center'}}>
                                <h3>{defenderName}</h3>
                                <div className={`dice-val ${isChallengeRolling && iAmDefender ? 'shaking' : ''}`} style={{fontSize:'3rem'}}>
                                    {isChallengeRolling && iAmDefender ? displayedChallengeDice : defenderTotal}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="roll-history">{history.map((h, i) => <div key={i}>{h}</div>)}</div>
                    {phase === 'MODIFIERS' && !hasPassed && (
                        <div className="modifier-section">
                            <div className="mod-hand">
                                {myModifiers.map(card => (
                                    <div key={card.uniqueId} className="mini-card modifier" onClick={() => handleModifierClick(card)}>{card.name}</div>
                                ))}
                            </div>
                            <button className="resolve-btn" onClick={passModifier}>PASS</button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const showRollButton = phase === 'WAITING' && gameState.activeRoll.playerId === playerId && currentTotal === null;
    return (
        <div className="modal-overlay">
             <div className="roll-modal">
                <h2>{type === 'ATTACK' ? '⚔️ ATTACK ROLL' : '✨ ABILITY ROLL'}</h2>
                <div className="dice-display">
                    {showRollButton && !isRolling ? (
                         <div className="roll-section">
                            <p>Target: <strong>{target}+</strong></p>
                            <button className="attack-btn-large" onClick={handleRollClick}>🎲 CLICK TO ROLL</button>
                         </div>
                    ) : (
                        <>
                            <div className={`dice-val ${isRolling ? 'shaking' : (currentTotal >= target ? 'success' : 'fail')}`}>
                                {isRolling ? displayedDice : (currentTotal ?? '?')}
                            </div>
                            <div className="target-val">Goal: {target}+</div>
                        </>
                    )}
                </div>
                <div className="roll-history">{history.map((h, i) => <div key={i}>{h}</div>)}</div>
                {!showRollButton && !isRolling && phase === 'MODIFIERS' && !hasPassed && (
                    <div className="modifier-section">
                        <div className="mod-hand">
                             {myModifiers.map(card => (
                                <div key={card.uniqueId} className="mini-card modifier" onClick={() => handleModifierClick(card)}>{card.name}</div>
                            ))}
                        </div>
                        <button className="resolve-btn" onClick={passModifier}>PASS</button>
                    </div>
                 )}
             </div>
        </div>
    );
  };

  // ... (Rest of the component returns logic remains the same) ...
  if (!currentGameId) {
     // ... lobby UI ...
     return (
        <div className="app lobby" style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100vh'}}>
          <div style={{textAlign:'center'}}>
              <h1>Here to Slay</h1>
              <input placeholder="Name" value={playerName} onChange={e=>setPlayerName(e.target.value)} style={{padding:8}}/><br/>
              <button onClick={() => createGame(playerName)} style={{margin:5}}>Create</button>
              <br/>
              <input placeholder="Game ID" value={gameIdInput} onChange={e=>setGameIdInput(e.target.value)} style={{padding:8}}/><br/>
              <button onClick={() => joinGame(gameIdInput, playerName)} style={{margin:5}}>Join</button>
          </div>
        </div>
      );
  }

  if (!gameState) return <div>Loading State...</div>;
  if (!gameState.started) {
     // ... waiting room UI ...
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
    <div className={`app game-board ${isChoosing ? 'selecting-mode' : ''}`}>
      {error && <div className="error-toast">{error}</div>}
      
      {isChoosing && (
        <div className="selection-banner">
            <h2>{pendingInteraction.msg || "Select a target"}</h2>
        </div>
      )}

      {/* Render Functions called here need to be in scope */}
      {renderRollModal()}
      {renderInteractionModal()} 

      {/* ... The rest of your main UI (Hand, Party, etc) ... */}
      
      {/* MODIFIER CHOICE MODAL */}
      {modDecisionCard && (
        <div className="modal-overlay">
          <div className="mod-choice-box">
            <p>Choose value for {modDecisionCard.name}:</p>
            <div style={{display:'flex', gap:'10px'}}>
              {modDecisionCard.name.split('/').map(opt => (
                <button key={opt} onClick={() => submitModChoice(parseInt(opt))}>{opt}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="monster-board">
        <h3>Monsters</h3>
        <div className="monster-row">
            {gameState.activeMonsters.map(m => (
                <div key={m.id} className="monster-slot">
                    <Card card={m} isMini={true} />
                    {isMyTurn && !isChoosing && <button className="attack-btn" onClick={() => attackMonster(m.id)}>⚔️</button>}
                </div>
            ))}
        </div>
        <div className="discard-pile" style={{marginLeft: '20px', borderLeft: '1px solid #444', paddingLeft: '20px'}}>
            <h4>Discard ({gameState.discardPile?.length || 0})</h4>
            <div className="discard-stack" onClick={() => isChoosing && pendingInteraction.type === 'SELECT_DISCARD' && handleInteraction('DISCARD_PILE')}>
                <div className="card-back-mini">View</div>
            </div>
        </div>
      </div>

      {gameState.challengeState.active && (!gameState.activeRoll || gameState.activeRoll.type !== 'CHALLENGE') && (
         <div className="modal-overlay">
            <div className="modal-content dark">
                <h3>Challenge?</h3>
                <p>{gameState.players.find(p => p.id === gameState.challengeState.sourcePlayerId)?.name} is playing {gameState.challengeState.pendingCard?.name}</p>
                {gameState.challengeState.sourcePlayerId !== playerId ? (
                    <div style={{display:'flex', gap:10}}>
                      {!gameState.challengeState.passedPlayers?.includes(playerId) && (
                        <>
                          <button className="challenge-btn" onClick={challengeCard} disabled={!hasChallengeCard}>✋ CHALLENGE</button>
                          <button onClick={passChallenge}>Pass</button>
                        </>
                      )}
                    </div>
                ) : <p>Waiting for others...</p>}
            </div>
         </div>
      )}

      <div className="opponents-container">
        {gameState.players.filter(p => p.id !== playerId).map(p => (
            <div key={p.id} className="opponent-area">
                <h4>{p.name} ({p.handCount} cards)</h4>
                <div className="party-row">
                  {p.partyLeader && (
                      <Card 
                          card={p.partyLeader} 
                          isMini={true} 
                          className={isCardValidTarget(p.partyLeader, p.id) ? 'target-glow' : ''}
                          onClick={() => isCardValidTarget(p.partyLeader, p.id) && handleInteraction(p.partyLeader.uniqueId)}
                      />
                  )}
                  {p.party.map((c, i) => (
                      <Card 
                          key={i} 
                          card={c} 
                          isMini={true} 
                          className={isCardValidTarget(c, p.id) ? 'target-glow' : ''}
                          onClick={() => isCardValidTarget(c, p.id) && handleInteraction(c.uniqueId)}
                      />
                  ))}
              </div>
            </div>
        ))}
      </div>

      <div className="my-area">
        <div className="stats-bar">
            AP: {gameState.actionPoints}/3 | Turn: {gameState.players[gameState.currentTurn].name}
        </div>
        
        <div className="my-party">
            <h3>My Party</h3>
            <div className="party-row">
                {gameState.players.find(p => p.id === playerId)?.partyLeader && (
                    <Card card={gameState.players.find(p => p.id === playerId).partyLeader} isMini={true} />
                )}
                {gameState.players.find(p => p.id === playerId)?.party.map((c, i) => (
                    <Card 
                        key={i} 
                        card={c} 
                        isMini={true} 
                        className={isCardValidTarget(c, playerId) ? 'sacrifice-glow' : ''}
                        canRoll={isMyTurn && c.type === 'HERO' && !isChoosing && !c.isUsedThisTurn} 
                        onRoll={useHeroAbility}
                        onClick={() => isCardValidTarget(c, playerId) && handleInteraction(c.uniqueId)}
                    />
                ))}
            </div>
        </div>

        <div className="my-hand">
            <h3>Hand</h3>
            <div className="hand-row">
                {privateState?.hand?.map(c => (
                    <Card 
                        key={c.uniqueId} 
                        card={c} 
                        isSelected={selectedCard?.uniqueId === c.uniqueId} 
                        onClick={() => !isChoosing && setSelectedCard(c)} 
                    />
                ))}
            </div>
        </div>

        <div className="controls">
            <button disabled={!isMyTurn || isChoosing} onClick={drawCard}>Draw (1)</button>
            <button disabled={!isMyTurn || !selectedCard || isChoosing} onClick={() => { playCard(selectedCard.uniqueId); setSelectedCard(null); }}>Play (1)</button>
            <button disabled={!isMyTurn || isChoosing} onClick={discardHand} style={{background:'#c0392b'}}>Dump Hand (3)</button>
            <button disabled={!isMyTurn || isChoosing} onClick={endTurn}>End Turn</button>
        </div>
      </div>
    </div>
  );
}

export default App;