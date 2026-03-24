// src/api/base44Client.js

// Mocking the base44 SDK structure using localStorage for local persistence
const getLocal = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export const base44 = {
  user: {
    // Returns a dummy local user so AuthContext remains functional
    get: async () => ({ id: "local-user-001", email: "local@player.game", name: "Local Player" })
  },
  entities: {
    Character: {
      list: async () => {
        const chars = getLocal('game_characters');
        // Sort by created_date descending as the original code expects
        return chars.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      },
      create: async (data) => {
        const chars = getLocal('game_characters');
        const newChar = { ...data, id: Math.random().toString(36).substr(2, 9), created_date: new Date().toISOString() };
        setLocal('game_characters', [...chars, newChar]);
        return newChar;
      },
      update: async (id, data) => {
        const chars = getLocal('game_characters');
        const index = chars.findIndex(c => c.id === id);
        if (index > -1) {
          chars[index] = { ...chars[index], ...data };
          setLocal('game_characters', chars);
        }
        return chars[index];
      }
    },
    Leaderboard: {
      list: async () => getLocal('game_leaderboard'),
      create: async (data) => {
        const board = getLocal('game_leaderboard');
        const entry = { ...data, id: Math.random().toString(36).substr(2, 9) };
        setLocal('game_leaderboard', [...board, entry]);
        return entry;
      },
      update: async (id, data) => {
        const board = getLocal('game_leaderboard');
        const index = board.findIndex(b => b.id === id);
        if (index > -1) {
          board[index] = { ...board[index], ...data };
          setLocal('game_leaderboard', board);
        }
        return board[index];
      }
    }
  }
};