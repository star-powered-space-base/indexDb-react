import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';

// Polyfill for structuredClone in Node.js test environment
if (typeof structuredClone === 'undefined') {
  global.structuredClone = (obj: any) => {
    return JSON.parse(JSON.stringify(obj));
  };
}

global.indexedDB = new IDBFactory();