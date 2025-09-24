export interface DatabaseConfig {
  name: string;
  version: number;
  stores: StoreConfig[];
}

export interface StoreConfig {
  name: string;
  keyPath?: string;
  autoIncrement?: boolean;
  indexes?: IndexConfig[];
}

export interface IndexConfig {
  name: string;
  keyPath: string | string[];
  unique?: boolean;
  multiEntry?: boolean;
}

export interface QueryOptions {
  index?: string;
  direction?: IDBCursorDirection;
  limit?: number;
  offset?: number;
}

export interface Transaction {
  store: string;
  mode?: IDBTransactionMode;
  operations: Operation[];
}

export interface Operation {
  type: 'add' | 'put' | 'delete' | 'clear' | 'get' | 'getAll' | 'count';
  data?: any;
  key?: IDBValidKey | IDBKeyRange;
  query?: IDBKeyRange | IDBValidKey;
}

export type SubscriptionCallback<T = any> = (data: T[]) => void;

export interface Subscription {
  unsubscribe: () => void;
}

export interface IndexedDBState {
  isLoading: boolean;
  error: Error | null;
  isConnected: boolean;
}

export interface UseIndexedDBReturn<T = any> {
  data: T | T[] | null;
  loading: boolean;
  error: Error | null;
  add: (value: T, key?: IDBValidKey) => Promise<IDBValidKey>;
  put: (value: T, key?: IDBValidKey) => Promise<IDBValidKey>;
  delete: (key: IDBValidKey | IDBKeyRange) => Promise<void>;
  clear: () => Promise<void>;
  get: (key: IDBValidKey) => Promise<T | undefined>;
  getAll: (query?: IDBKeyRange | IDBValidKey, count?: number) => Promise<T[]>;
  count: (query?: IDBKeyRange | IDBValidKey) => Promise<number>;
  refresh: () => Promise<void>;
}

export interface IndexedDBContextValue {
  db: IDBDatabase | null;
  state: IndexedDBState;
  executeTransaction: <T = any>(transaction: Transaction) => Promise<T>;
  subscribe: <T = any>(storeName: string, callback: SubscriptionCallback<T>) => Subscription;
}