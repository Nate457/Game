// src/api/base44Client.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, query, orderBy, limit, where } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD2VD5SlfT8skI1i0v7hN3xCdiXZ7LRY3g",
  authDomain: "game-10c46.firebaseapp.com",
  projectId: "game-10c46",
  storageBucket: "game-10c46.firebasestorage.app",
  messagingSenderId: "825671982649",
  appId: "1:825671982649:web:e868151ba6a13105bd37e8",
  measurementId: "G-STBQ1JTVHX"
};

const GEMINI_API_KEY = "AIzaSyCy39_ATqV3uVFhdX4XVF23GhalcpjAQhM";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export const base44 = {
  auth: {
    me: async () => {
      return new Promise((resolve, reject) => {
        auth.onAuthStateChanged(user => {
          if (user) resolve({ id: user.uid, name: "Player" });
          else signInAnonymously(auth).then(c => resolve({ id: c.user.uid })).catch(reject);
        });
      });
    }
  },
  integrations: {
    Core: {
      InvokeLLM: async ({ prompt, response_json_schema }) => {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: response_json_schema
            }
          })
        });
        const data = await res.json();
        return JSON.parse(data.candidates[0].content.parts[0].text);
      }
    }
  },
  entities: {
    Character: {
      list: async (sortStr) => {
        if (sortStr === "-created_date") {
          // Fetch this user's characters, then sort in JS to avoid Firebase Index errors
          const q = query(collection(db, "characters"), where("userId", "==", auth.currentUser.uid));
          const snap = await getDocs(q);
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // Sort by newest first and grab the top one
          return docs.sort((a,b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 1);
        } else {
          // For the Co-op lobby
          const q = query(collection(db, "characters"), orderBy("level", "desc"), limit(50));
          const snap = await getDocs(q);
          return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      },
      create: async (data) => {
        const docRef = await addDoc(collection(db, "characters"), {
          ...data,
          userId: auth.currentUser.uid,
          created_date: new Date().toISOString()
        });
        return { id: docRef.id, ...data };
      },
      update: async (id, data) => {
        await updateDoc(doc(db, "characters", id), data);
        return { id, ...data };
      }
    },
    Leaderboard: {
      list: async () => {
        const snap = await getDocs(query(collection(db, "leaderboard"), orderBy("level", "desc"), limit(50)));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      },
      create: async (data) => {
        const docRef = await addDoc(collection(db, "leaderboard"), data);
        return { id: docRef.id, ...data };
      },
      update: async (id, data) => {
        await updateDoc(doc(db, "leaderboard", id), data);
      },
      filter: async (filters) => {
        const snap = await getDocs(query(collection(db, "leaderboard"), where("character_id", "==", filters.character_id)));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    },
    Quest: {
      filter: async (filters) => {
        const snap = await getDocs(query(collection(db, "quests"), where("character_id", "==", filters.character_id)));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      },
      create: async (data) => {
        const docRef = await addDoc(collection(db, "quests"), data);
        return { id: docRef.id, ...data };
      },
      update: async (id, data) => {
        await updateDoc(doc(db, "quests", id), data);
      }
    }
  }
};