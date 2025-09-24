export { IndexedDBManager } from './core/IndexedDBManager';
export { IndexedDBProvider, IndexedDBContext } from './context/IndexedDBContext';
export { useIndexedDB } from './hooks/useIndexedDB';
export { useIndexedDBStore } from './hooks/useIndexedDBStore';
export { useTransaction } from './hooks/useTransaction';
export { useLiveQuery } from './hooks/useLiveQuery';

export type {
  DatabaseConfig,
  StoreConfig,
  IndexConfig,
  QueryOptions,
  Transaction,
  Operation,
  SubscriptionCallback,
  Subscription,
  IndexedDBState,
  UseIndexedDBReturn,
  IndexedDBContextValue
} from './types';

export type { IndexedDBProviderProps } from './context/IndexedDBContext';
export type { TransactionBuilder } from './hooks/useTransaction';
export type { LiveQueryOptions } from './hooks/useLiveQuery';