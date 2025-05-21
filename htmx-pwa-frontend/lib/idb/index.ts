let idb: Promise<IDBDatabase> | null = null;

export const openIdb = async (): Promise<IDBDatabase> => {
  if (idb) return idb;

  const deleteReq = indexedDB.deleteDatabase('tallyup'); // TODO: Remove this line in production
  idb = new Promise<IDBDatabase>((resolve, reject) => {
    deleteReq.onsuccess = () => {
      const openReq = indexedDB.open('tallyup');
      openReq.onupgradeneeded = (event) => {
        console.log('Upgrade needed:', event);
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('user', { keyPath: 'id' });
        }
      };
      openReq.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
      openReq.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
    };
  });
  return idb;
};
