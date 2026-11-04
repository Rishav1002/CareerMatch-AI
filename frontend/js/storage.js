/**
 * CareerMatch AI: Unified Storage Module (Section 13 C)
 * IndexedDB for rich client state (profiles, resumes, analyses, quizzes).
 * Scoped localStorage for tiny UI preferences (cm:v1:{scope}:...).
 * Memory-only fallback when private browsing or quota limits occur.
 */

const DB_NAME = "CareerMatchDB";
const DB_VERSION = 1;

class StorageService {
  constructor() {
    this._db = null;
    this._memoryOnly = false;
    this._memStore = new Map();
    this._currentScope = "guest";
  }

  setScope(userId) {
    this._currentScope = userId ? `user_${userId}` : "guest";
  }

  getScope() {
    return this._currentScope;
  }

  setMemoryOnly(enabled) {
    this._memoryOnly = Boolean(enabled);
  }

  isMemoryOnly() {
    return this._memoryOnly;
  }

  async _getDb() {
    if (this._db) return this._db;
    if (typeof indexedDB === "undefined" || this._memoryOnly) return null;

    return new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains("profiles")) {
            db.createObjectStore("profiles", { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains("resumes")) {
            db.createObjectStore("resumes", { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains("analyses")) {
            db.createObjectStore("analyses", { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains("assessments")) {
            db.createObjectStore("assessments", { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains("roadmaps")) {
            db.createObjectStore("roadmaps", { keyPath: "id" });
          }
        };
        req.onsuccess = () => {
          this._db = req.result;
          resolve(this._db);
        };
        req.onerror = (err) => {
          console.warn("[Storage] IndexedDB unavailable, falling back to memory:", err);
          this._memoryOnly = true;
          resolve(null);
        };
      } catch (err) {
        console.warn("[Storage] IndexedDB open error:", err);
        this._memoryOnly = true;
        resolve(null);
      }
    });
  }

  // --- IndexedDB Operations ---

  async saveItem(storeName, item) {
    if (this._memoryOnly || !item || !item.id) {
      this._memStore.set(`${storeName}:${item?.id}`, item);
      return item;
    }
    const db = await this._getDb();
    if (!db) {
      this._memStore.set(`${storeName}:${item.id}`, item);
      return item;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        store.put({ ...item, scope: this._currentScope, _updatedAt: Date.now() });
        tx.oncomplete = () => resolve(item);
        tx.onerror = () => {
          this._memStore.set(`${storeName}:${item.id}`, item);
          resolve(item);
        };
      } catch {
        this._memStore.set(`${storeName}:${item.id}`, item);
        resolve(item);
      }
    });
  }

  async getItem(storeName, id) {
    if (this._memoryOnly) {
      return this._memStore.get(`${storeName}:${id}`) || null;
    }
    const db = await this._getDb();
    if (!db) {
      return this._memStore.get(`${storeName}:${id}`) || null;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(this._memStore.get(`${storeName}:${id}`) || null);
      } catch {
        resolve(null);
      }
    });
  }

  async getAllItems(storeName) {
    if (this._memoryOnly) {
      const results = [];
      for (const [k, v] of this._memStore.entries()) {
        if (k.startsWith(`${storeName}:`)) results.push(v);
      }
      return results;
    }
    const db = await this._getDb();
    if (!db) return [];

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => {
          const filtered = (req.result || []).filter(
            (item) => !item.scope || item.scope === this._currentScope
          );
          resolve(filtered);
        };
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  async clearAll() {
    this._memStore.clear();
    const db = await this._getDb();
    if (db) {
      ["profiles", "resumes", "analyses", "assessments", "roadmaps"].forEach((storeName) => {
        try {
          const tx = db.transaction(storeName, "readwrite");
          tx.objectStore(storeName).clear();
        } catch {}
      });
    }
    // Also clear localStorage scoped keys
    try {
      const prefix = "cm:v1:";
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) {
          localStorage.removeItem(k);
        }
      }
    } catch {}
  }

  // --- Scoped Preferences in localStorage ---

  getPref(key, defaultValue = null) {
    try {
      const scopedKey = `cm:v1:${this._currentScope}:${key}`;
      const raw = localStorage.getItem(scopedKey) ?? localStorage.getItem(`cm:v1:pref:${key}`);
      return raw !== null ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  setPref(key, value) {
    try {
      const scopedKey = `cm:v1:${this._currentScope}:${key}`;
      localStorage.setItem(scopedKey, JSON.stringify(value));
      // Keep global pref mirror for theme & lang
      if (key === "theme" || key === "lang") {
        localStorage.setItem(`cm:v1:pref:${key}`, JSON.stringify(value));
      }
    } catch (e) {
      console.warn("[Storage] Pref save error:", e);
    }
  }
}

export const storage = new StorageService();
