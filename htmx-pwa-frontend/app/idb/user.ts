import { openIdb } from '../../lib/idb';

export type User = {
  authToken: string;
  email: string;
};

const get = async (): Promise<User | null> => {
  const db = await openIdb();
  return new Promise<User | null>((resolve, reject) => {
    const tx = db.transaction('user', 'readonly');
    const store = tx.objectStore('user');
    const req = store.get(1);
    req.onsuccess = (event) => {
      const user = (event.target as IDBRequest).result;
      resolve(user ? user : null);
    };
    req.onerror = (event) => reject((event.target as IDBRequest).error);
  });
};

const set = async (user: User): Promise<void> => {
  const db = await openIdb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('users', 'readwrite');
    const store = tx.objectStore('users');
    const req = store.put({ ...user, id: 1 });
    req.onsuccess = () => resolve();
    req.onerror = (event) => reject((event.target as IDBRequest).error);
  });
};

export const user = { get, set };
