// src/hooks/useWebSocket.js
import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

export const useWebSocket = () => {
  const socketRef = useRef(null);
  
  // State
  const [gameState, setGameState] = useState(null);
  const [privateState, setPrivateState] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [currentGameId, setCurrentGameId] = useState(null);
  const [lastRoll, setLastRoll] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize Socket
    socketRef.current = io(SOCKET_URL);

    // --- EVENT LISTENERS ---

    // Connection / Lobby Events
    socketRef.current.on('gameCreated', ({ gameId, playerId: pId }) => { 
        setCurrentGameId(gameId); 
        setPlayerId(pId); 
    });
    
    socketRef.current.on('gameJoined', ({ gameId, playerId: pId }) => { 
        setCurrentGameId(gameId); 
        setPlayerId(pId); 
    });

    // Game State Updates
    socketRef.current.on('gameStateUpdate', (state) => {
        // console.log("State Update:", state); // Debugging
        setGameState(state);
    });

    socketRef.current.on('privateState', (state) => {
        setPrivateState(state);
    });

    // Feedback Events
    socketRef.current.on('error', (msg) => { 
        setError(msg); 
        setTimeout(() => setError(null), 3000); 
    });

    socketRef.current.on('rollResult', (data) => { 
        // Only show toast if it contains a final message
        if(data.message) {
            setLastRoll(data); 
            setTimeout(() => setLastRoll(null), 5000); 
        }
    });

    // Cleanup on unmount
    return () => socketRef.current.disconnect();
  }, []);

  // --- ACTIONS ---

  // Lobby
  const createGame = (name) => socketRef.current.emit('createGame', name);
  const joinGame = (gid, name) => socketRef.current.emit('joinGame', { gameId: gid, playerName: name });
  const startGame = () => socketRef.current.emit('startGame');
  
  // Standard Gameplay
  const drawCard = () => socketRef.current.emit('drawCard');
  const discardHand = () => socketRef.current.emit('discardHand');
  const playCard = (cid) => socketRef.current.emit('playCard', cid);
  const attackMonster = (mid) => socketRef.current.emit('attackMonster', mid);
  const useHeroAbility = (cid) => socketRef.current.emit('useHeroAbility', cid);
  const endTurn = () => socketRef.current.emit('endTurn');

  // Challenge System
  const challengeCard = () => socketRef.current.emit('challengeCard');
  const resolveNoChallenge = () => socketRef.current.emit('resolveNoChallenge');
  const passChallenge = () => socketRef.current.emit('passChallenge');
  const rollChallengeDice = () => socketRef.current.emit('rollChallengeDice');

  // **NEW** Roll & Modifier System
  const playModifier = (cid, val) => socketRef.current.emit('playModifier', { cardId: cid, val });
  const passModifier = () => socketRef.current.emit('passModifier');
  // Note: resolveRoll is technically no longer needed as a user action since the server auto-resolves on consensus, 
  // but if you kept a force-resolve button for debugging:
  const resolveRoll = () => socketRef.current.emit('resolveRoll'); 

  return {
    gameState, privateState, playerId, currentGameId, error, lastRoll,
    createGame, joinGame, startGame, 
    drawCard, discardHand, playCard, attackMonster, useHeroAbility, 
    challengeCard, passChallenge, endTurn, 
    // Export new functions
    playModifier, passModifier, resolveRoll, rollChallengeDice, resolveNoChallenge
  };
};