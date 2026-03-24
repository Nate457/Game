// src/api/base44Client.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, query, orderBy, limit, where, onSnapshot } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD2VD5SlfT8skI1i0v7hN3xCdiXZ7LRY3g",
  authDomain: "game-10c46.firebaseapp.com",
  projectId: "game-10c46",
  storageBucket: "game-10c46.firebasestorage.app",
  messagingSenderId: "825671982649",
  appId: "1:825671982649:web:e868151ba6a13105bd37e8",
  measurementId: "G-STBQ1JTVHX"
};

const GEMINI_API_KEY = "AIzaSyAB-VHk5Dq7-i-wtnzxQkXXZaReyz7iRaI";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Safely wait for Firebase to initialize the user before fetching data
const getCurrentUser = () => new Promise((resolve, reject) => {
  const unsubscribe = onAuthStateChanged(auth, user => {
    unsubscribe();
    if (user) resolve(user);
    else signInAnonymously(auth).then(c => resolve(c.user)).catch(reject);
  });
});

export const base44 = {
  auth: {
    me: async () => {
      const user = await getCurrentUser();
      return { id: user.uid, name: "Player" };
    }
  },
  integrations: {
    Core: {
      InvokeLLM: async ({ prompt, response_json_schema }) => {
        // FIX: The 400 Bad Request is caused by the API's strict OpenAPI schema validation.
        // We inject the schema into the prompt directly to bypass the error entirely.
        const robustPrompt = `${prompt}\n\nIMPORTANT: You must return ONLY valid JSON. The JSON must strictly match this schema structure:\n${JSON.stringify(response_json_schema, null, 2)}`;
        
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: robustPrompt }] }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          console.error("Gemini API Error:", data);
          throw new Error(`AI Generation Failed: ${res.status}`);
        }
        
        return JSON.parse(data.candidates[0].content.parts[0].text);
      }
    }
  },
  entities: {
    Character: {
      list: async (sortStr) => {
        const user = await getCurrentUser();
        if (sortStr === "-created_date") {
          const q = query(collection(db, "characters"), where("userId", "==", user.uid));
          const snap = await getDocs(q);
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          return docs.sort((a,b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 1);
        } else {
          const q = query(collection(db, "characters"), orderBy("level", "desc"), limit(50));
          const snap = await getDocs(q);
          return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      },
      create: async (data) => {
        const user = await getCurrentUser();
        const docRef = await addDoc(collection(db, "characters"), {
          ...data,
          userId: user.uid,
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
    },
    CoopSession: {
      create: async (data) => {
        const docRef = await addDoc(collection(db, "coop_sessions"), data);
        return { id: docRef.id, ...data };
      },
      update: async (id, data) => {
        await updateDoc(doc(db, "coop_sessions", id), data);
      },
      getByCode: async (code) => {
        const q = query(collection(db, "coop_sessions"), where("code", "==", code.toUpperCase()));
        const snap = await getDocs(q);
        if (snap.empty) return null;
        return { id: snap.docs[0].id, ...snap.docs[0].data() };
      },
      listen: (id, callback) => {
        return onSnapshot(doc(db, "coop_sessions", id), (doc) => {
          if (doc.exists()) callback({ id: doc.id, ...doc.data() });
          else callback(null);
        });
      }
    }
  }
};
