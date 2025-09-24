import { 
  DatabaseConfig, 
  Transaction, 
  SubscriptionCallback,
  Subscription 
} from '../types';

export class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private config: DatabaseConfig;
  private subscribers: Map<string, Set<SubscriptionCallback>> = new Map();
  private isInitialized: boolean = false;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<IDBDatabase> {
    if (this.db && this.isInitialized) {
      return this.db;
    }

    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.config.name, this.config.version);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        this.setupEventHandlers();
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.upgradeDatabase(db);
      };
    });
  }

  private upgradeDatabase(db: IDBDatabase): void {
    this.config.stores.forEach(storeConfig => {
      if (!db.objectStoreNames.contains(storeConfig.name)) {
        const store = db.createObjectStore(storeConfig.name, {
          keyPath: storeConfig.keyPath,
          autoIncrement: storeConfig.autoIncrement
        });

        storeConfig.indexes?.forEach(index => {
          store.createIndex(index.name, index.keyPath, {
            unique: index.unique,
            multiEntry: index.multiEntry
          });
        });
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.db) return;

    this.db.onversionchange = () => {
      this.db?.close();
      this.db = null;
      this.isInitialized = false;
    };

    this.db.onclose = () => {
      this.db = null;
      this.isInitialized = false;
    };
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
    this.subscribers.clear();
  }

  async executeTransaction<T = any>(transaction: Transaction): Promise<T> {
    if (!this.db) {
      await this.connect();
    }

    return new Promise<T>((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const tx = this.db.transaction(transaction.store, transaction.mode || 'readonly');
      const store = tx.objectStore(transaction.store);
      const results: any[] = [];

      tx.oncomplete = () => {
        this.notifySubscribers(transaction.store);
        resolve(results.length === 1 ? results[0] : results as T);
      };

      tx.onerror = () => {
        reject(new Error(`Transaction failed: ${tx.error?.message}`));
      };

      transaction.operations.forEach(operation => {
        let request: IDBRequest;

        switch (operation.type) {
          case 'add':
            request = store.add(operation.data, operation.key);
            break;
          case 'put':
            request = store.put(operation.data, operation.key);
            break;
          case 'delete':
            request = store.delete(operation.key!);
            break;
          case 'clear':
            request = store.clear();
            break;
          case 'get':
            request = store.get(operation.key!);
            break;
          case 'getAll':
            request = store.getAll(operation.query, operation.data as number);
            break;
          case 'count':
            request = store.count(operation.query);
            break;
          default:
            throw new Error(`Unknown operation type: ${operation.type}`);
        }

        request.onsuccess = () => {
          results.push(request.result);
        };
      });
    });
  }

  async add<T = any>(storeName: string, value: T, key?: IDBValidKey): Promise<IDBValidKey> {
    return this.executeTransaction<IDBValidKey>({
      store: storeName,
      mode: 'readwrite',
      operations: [{ type: 'add', data: value, key }]
    });
  }

  async put<T = any>(storeName: string, value: T, key?: IDBValidKey): Promise<IDBValidKey> {
    return this.executeTransaction<IDBValidKey>({
      store: storeName,
      mode: 'readwrite',
      operations: [{ type: 'put', data: value, key }]
    });
  }

  async delete(storeName: string, key: IDBValidKey | IDBKeyRange): Promise<void> {
    await this.executeTransaction({
      store: storeName,
      mode: 'readwrite',
      operations: [{ type: 'delete', key }]
    });
  }

  async clear(storeName: string): Promise<void> {
    await this.executeTransaction({
      store: storeName,
      mode: 'readwrite',
      operations: [{ type: 'clear' }]
    });
  }

  async get<T = any>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    return this.executeTransaction<T | undefined>({
      store: storeName,
      mode: 'readonly',
      operations: [{ type: 'get', key }]
    });
  }

  async getAll<T = any>(
    storeName: string, 
    query?: IDBKeyRange | IDBValidKey, 
    count?: number
  ): Promise<T[]> {
    return this.executeTransaction<T[]>({
      store: storeName,
      mode: 'readonly',
      operations: [{ type: 'getAll', query, data: count }]
    });
  }

  async count(storeName: string, query?: IDBKeyRange | IDBValidKey): Promise<number> {
    return this.executeTransaction<number>({
      store: storeName,
      mode: 'readonly',
      operations: [{ type: 'count', query }]
    });
  }

  subscribe<T = any>(storeName: string, callback: SubscriptionCallback<T>): Subscription {
    if (!this.subscribers.has(storeName)) {
      this.subscribers.set(storeName, new Set());
    }

    const callbacks = this.subscribers.get(storeName)!;
    callbacks.add(callback);

    this.getAll<T>(storeName).then(data => {
      callback(data);
    }).catch(console.error);

    return {
      unsubscribe: () => {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(storeName);
        }
      }
    };
  }

  private async notifySubscribers(storeName: string): Promise<void> {
    const callbacks = this.subscribers.get(storeName);
    if (!callbacks || callbacks.size === 0) return;

    try {
      const data = await this.getAll(storeName);
      callbacks.forEach(callback => callback(data));
    } catch (error) {
      console.error('Error notifying subscribers:', error);
    }
  }

  getDatabase(): IDBDatabase | null {
    return this.db;
  }

  isConnected(): boolean {
    return this.isInitialized && this.db !== null;
  }
}