(() => {
  const ntp = window.NTP = window.NTP || {};

  const DB_NAME = "ntp.persistence";
  const DB_VERSION = 1;
  const STORE_NAME = "records";
  const META_UPDATED_SUFFIX = ".updatedAt";
  const META_DELETED_SUFFIX = ".deletedAt";

  const memoryRecords = new Map();
  let dbPromise = null;

  const storageStatus = {
    indexedDb: "unknown",
    localStorage: "unknown",
    persistentStorage: "unknown",
    lastError: "",
    lastWriteAt: 0,
    lastReadAt: 0
  };

  function setStorageError(error) {
    storageStatus.lastError = error?.message || String(error || "");
  }

  function getMetaKey(key, suffix) {
    return `${key}${suffix}`;
  }

  function getValueTimestamp(value, fallback = 0) {
    const savedAt = Number(value?.savedAt);
    return Number.isFinite(savedAt) && savedAt > 0 ? savedAt : fallback;
  }

  function readLocalNumber(key) {
    try {
      const value = Number(window.localStorage.getItem(key));
      storageStatus.localStorage = "available";
      return Number.isFinite(value) ? value : 0;
    } catch (error) {
      storageStatus.localStorage = "unavailable";
      setStorageError(error);
      return 0;
    }
  }

  function writeLocalNumber(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
      storageStatus.localStorage = "available";
      return true;
    } catch (error) {
      storageStatus.localStorage = "unavailable";
      setStorageError(error);
      return false;
    }
  }

  function removeLocalKey(key) {
    try {
      window.localStorage.removeItem(key);
      storageStatus.localStorage = "available";
      return true;
    } catch (error) {
      storageStatus.localStorage = "unavailable";
      setStorageError(error);
      return false;
    }
  }

  function readLocalRecord(key) {
    try {
      const raw = window.localStorage.getItem(key);
      storageStatus.localStorage = "available";
      if (!raw) return null;

      const value = JSON.parse(raw);
      const metaUpdatedAt = readLocalNumber(getMetaKey(key, META_UPDATED_SUFFIX));
      return {
        key,
        value,
        updatedAt: getValueTimestamp(value, metaUpdatedAt)
      };
    } catch (error) {
      storageStatus.localStorage = "unavailable";
      setStorageError(error);
      return null;
    }
  }

  function writeLocalRecord(key, value, updatedAt) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      window.localStorage.setItem(getMetaKey(key, META_UPDATED_SUFFIX), String(updatedAt));
      window.localStorage.removeItem(getMetaKey(key, META_DELETED_SUFFIX));
      storageStatus.localStorage = "available";
      return true;
    } catch (error) {
      storageStatus.localStorage = "unavailable";
      setStorageError(error);
      return false;
    }
  }

  function markLocalDeleted(key, deletedAt) {
    writeLocalNumber(getMetaKey(key, META_DELETED_SUFFIX), deletedAt);
    removeLocalKey(key);
    removeLocalKey(getMetaKey(key, META_UPDATED_SUFFIX));
  }

  function getDeletedAt(key) {
    return readLocalNumber(getMetaKey(key, META_DELETED_SUFFIX));
  }

  function openDb() {
    if (!("indexedDB" in window)) {
      storageStatus.indexedDb = "unavailable";
      return Promise.resolve(null);
    }

    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve) => {
      let request;

      try {
        request = window.indexedDB.open(DB_NAME, DB_VERSION);
      } catch (error) {
        storageStatus.indexedDb = "unavailable";
        setStorageError(error);
        resolve(null);
        return;
      }

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      };

      request.onsuccess = () => {
        storageStatus.indexedDb = "available";
        resolve(request.result);
      };

      request.onerror = () => {
        storageStatus.indexedDb = "unavailable";
        setStorageError(request.error);
        resolve(null);
      };

      request.onblocked = () => {
        storageStatus.indexedDb = "blocked";
        setStorageError("IndexedDB upgrade blocked");
      };
    });

    return dbPromise;
  }

  async function readIndexedRecord(key) {
    const db = await openDb();
    if (!db) return null;

    return new Promise((resolve) => {
      let request;

      try {
        const transaction = db.transaction(STORE_NAME, "readonly");
        request = transaction.objectStore(STORE_NAME).get(key);
      } catch (error) {
        storageStatus.indexedDb = "unavailable";
        setStorageError(error);
        resolve(null);
        return;
      }

      request.onsuccess = () => {
        storageStatus.indexedDb = "available";
        resolve(request.result || null);
      };

      request.onerror = () => {
        storageStatus.indexedDb = "unavailable";
        setStorageError(request.error);
        resolve(null);
      };
    });
  }

  async function writeIndexedRecord(key, value, updatedAt) {
    const db = await openDb();
    if (!db) return false;

    return new Promise((resolve) => {
      try {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).put({ key, value, updatedAt });
        transaction.oncomplete = () => {
          storageStatus.indexedDb = "available";
          resolve(true);
        };
        transaction.onerror = () => {
          storageStatus.indexedDb = "unavailable";
          setStorageError(transaction.error);
          resolve(false);
        };
      } catch (error) {
        storageStatus.indexedDb = "unavailable";
        setStorageError(error);
        resolve(false);
      }
    });
  }

  async function deleteIndexedRecord(key) {
    const db = await openDb();
    if (!db) return false;

    return new Promise((resolve) => {
      try {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).delete(key);
        transaction.oncomplete = () => {
          storageStatus.indexedDb = "available";
          resolve(true);
        };
        transaction.onerror = () => {
          storageStatus.indexedDb = "unavailable";
          setStorageError(transaction.error);
          resolve(false);
        };
      } catch (error) {
        storageStatus.indexedDb = "unavailable";
        setStorageError(error);
        resolve(false);
      }
    });
  }

  function chooseNewestRecord(key, records) {
    const deletedAt = getDeletedAt(key);
    const newest = records
      .filter(Boolean)
      .sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))[0] || null;

    if (!newest || Number(newest.updatedAt || 0) <= deletedAt) {
      return null;
    }

    return newest;
  }

  function readPersistentJsonSync(key) {
    const memoryValue = memoryRecords.get(key);
    if (memoryValue) return memoryValue;

    const record = chooseNewestRecord(key, [readLocalRecord(key)]);
    storageStatus.lastReadAt = Date.now();
    return record?.value || null;
  }

  async function readPersistentJson(key) {
    const localRecord = readLocalRecord(key);
    const indexedRecord = await readIndexedRecord(key);
    const record = chooseNewestRecord(key, [localRecord, indexedRecord]);
    const deletedAt = getDeletedAt(key);

    storageStatus.lastReadAt = Date.now();

    if (!record) {
      memoryRecords.delete(key);
      if (indexedRecord && Number(indexedRecord.updatedAt || 0) <= deletedAt) {
        deleteIndexedRecord(key);
      }
      return null;
    }

    memoryRecords.set(key, record.value);

    if (!localRecord || Number(localRecord.updatedAt || 0) < Number(record.updatedAt || 0)) {
      writeLocalRecord(key, record.value, Number(record.updatedAt || Date.now()));
    }

    return record.value;
  }

  function writePersistentJson(key, value) {
    const updatedAt = getValueTimestamp(value, Date.now());
    memoryRecords.set(key, value);
    storageStatus.lastWriteAt = updatedAt;

    const localOk = writeLocalRecord(key, value, updatedAt);
    const indexedDbQueued = "indexedDB" in window;

    writeIndexedRecord(key, value, updatedAt);

    return localOk || indexedDbQueued;
  }

  function removePersistentJson(key) {
    const deletedAt = Date.now();
    memoryRecords.delete(key);
    markLocalDeleted(key, deletedAt);
    storageStatus.lastWriteAt = deletedAt;
    deleteIndexedRecord(key);
  }

  async function requestPersistentStorage() {
    if (!navigator.storage?.persisted || !navigator.storage?.persist) {
      storageStatus.persistentStorage = "unsupported";
      return false;
    }

    try {
      if (await navigator.storage.persisted()) {
        storageStatus.persistentStorage = "granted";
        return true;
      }

      const granted = await navigator.storage.persist();
      storageStatus.persistentStorage = granted ? "granted" : "denied";
      return granted;
    } catch (error) {
      storageStatus.persistentStorage = "unavailable";
      setStorageError(error);
      return false;
    }
  }

  Object.assign(ntp, {
    storageStatus,
    readPersistentJson,
    readPersistentJsonSync,
    writePersistentJson,
    removePersistentJson,
    requestPersistentStorage
  });
})();
