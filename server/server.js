// server/server.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Game = require('./classes/Game');

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
});

const games = new Map(); 
const playerMap = new Map(); 

io.on('connection', (socket) => {
  
  const broadcastGameState = (gameId) => {
    const game = games.get(gameId);
    if (!game) return;
    io.to(gameId).emit('gameStateUpdate', game.getPublicState());
    game.players.forEach(player => {
      io.to(player.id).emit('privateState', game.getPlayerPrivateState(player.id));
    });
  };

  // --- ACTIONS ---

  socket.on('createGame', (playerName) => {
    const gameId = Math.random().toString(36).substring(2, 7).toUpperCase();
    const game = new Game(gameId);
    game.addPlayer(socket.id, playerName);
    games.set(gameId, game);
    playerMap.set(socket.id, gameId);
    socket.join(gameId);
    socket.emit('gameCreated', { gameId, playerId: socket.id });
    broadcastGameState(gameId);
  });

  socket.on('joinGame', ({ gameId, playerName }) => {
    const room = gameId.toUpperCase(); 
    const game = games.get(room);
    if (!game || game.started) { socket.emit('error', 'Cannot join'); return; }
    game.addPlayer(socket.id, playerName);
    playerMap.set(socket.id, room);
    socket.join(room);
    socket.emit('gameJoined', { gameId: room, playerId: socket.id });
    broadcastGameState(room);
  });

  socket.on('startGame', () => {
    const gameId = playerMap.get(socket.id);
    const game = games.get(gameId);
    if (game && game.startGame()) {
      io.to(gameId).emit('gameStarted');
      broadcastGameState(gameId);
    }
  });

  socket.on('drawCard', () => {
    const gameId = playerMap.get(socket.id);
    const game = games.get(gameId);
    if(game) {
        const result = game.drawCard(socket.id);
        if(result.error) socket.emit('error', result.error);
        else broadcastGameState(gameId);
    }
  });

  socket.on('discardHand', () => {
    const gameId = playerMap.get(socket.id);
    const game = games.get(gameId);
    if(game) {
        const result = game.discardHand(socket.id);
        if(result.error) socket.emit('error', result.error);
        else broadcastGameState(gameId);
    }
  });

  socket.on('playCard', (cardUniqueId) => {
    const gameId = playerMap.get(socket.id);
    const game = games.get(gameId);
    if (game) {
        const result = game.playCard(socket.id, cardUniqueId);
        if(result.error) socket.emit('error', result.error);
        else broadcastGameState(gameId);
    }
  });

  socket.on('challengeCard', () => {
    const gameId = playerMap.get(socket.id);
    const game = games.get(gameId);
    if (game) {
        game.initiateChallenge(socket.id);
        broadcastGameState(gameId);
    }
  });

  socket.on('resolveNoChallenge', () => {
    const gameId = playerMap.get(socket.id);
    const game = games.get(gameId);
    if (game) {
        game.resolveNoChallenge();
        broadcastGameState(gameId);
    }
  });


  socket.on('rollChallengeDice', () => {
    const gameId = playerMap.get(socket.id);
    const game = games.get(gameId);
    if (game) {
        game.rollChallengeDice(socket.id);
        broadcastGameState(gameId);
    }
  });

  
  socket.on('useHeroAbility', (cardUniqueId) => {
    const gameId = playerMap.get(socket.id);
    const game = games.get(gameId);
    if (game) {
        const result = game.useHeroAbility(socket.id, cardUniqueId);
        if(result.error) socket.emit('error', result.error);
        else {
            broadcastGameState(gameId);
        }
    }
  });


  socket.on('attackMonster', (monsterId) => {
    const gameId = playerMap.get(socket.id);
    const game = games.get(gameId);
    if (game) {
        const result = game.attackMonster(socket.id, monsterId);
        if(result.error) {
            socket.emit('error', result.error);
        } else {
            // Just broadcast the state - the roll modal will open
            broadcastGameState(gameId);
        }
    }
  });

  socket.on('endTurn', () => {
    const gameId = playerMap.get(socket.id);
    const game = games.get(gameId);
    if (game) {
      game.endTurn();
      broadcastGameState(gameId);
    }
  });

  socket.on('passChallenge', () => {
    const gameId = playerMap.get(socket.id);
    const game = games.get(gameId);
    if (game) {
        game.passChallenge(socket.id);
        broadcastGameState(gameId);
    }
  });
  socket.on('playModifier', ({ cardId, val }) => {
    const gameId = playerMap.get(socket.id);
    const game = games.get(gameId);
    if (game) {
        // Pass the chosen 'val' to the game logic
        const result = game.playModifier(socket.id, cardId, val);
        if (result.error) {
            socket.emit('error', result.error);
        } else {
            broadcastGameState(gameId);
        }
    }
});

  socket.on('passModifier', () => {
    const gameId = playerMap.get(socket.id);
    const game = games.get(gameId);
    if (game) {
        const result = game.passModifier(socket.id);
        
        // If the pass resulted in the roll finishing (consensus reached):
        if (result.resolved) {
            broadcastGameState(gameId);
            // Send the final result notification to everyone
            io.to(gameId).emit('rollResult', { 
                playerName: 'System', 
                message: result.message 
            });
        } else {
            // Just update the UI (showing who passed)
            broadcastGameState(gameId);
        }
    }
  });
  socket.on('rollMainDice', () => {
    const gameId = playerMap.get(socket.id);
    const game = games.get(gameId);
    if (game) {
        game.rollMainDice(socket.id);
        broadcastGameState(gameId);
    }
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });