import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { IndexedDBManager } from '../core/IndexedDBManager';
import { 
  DatabaseConfig, 
  IndexedDBContextValue, 
  IndexedDBState,
  Transaction,
  SubscriptionCallback,
  Subscription
} from '../types';

export const IndexedDBContext = createContext<IndexedDBContextValue | null>(null);

export interface IndexedDBProviderProps {
  children: ReactNode;
  config: DatabaseConfig;
  onError?: (error: Error) => void;
  onSuccess?: (db: IDBDatabase) => void;
}

export function IndexedDBProvider({ 
  children, 
  config, 
  onError,
  onSuccess 
}: IndexedDBProviderProps) {
  const [manager] = useState(() => new IndexedDBManager(config));
  const [state, setState] = useState<IndexedDBState>({
    isLoading: true,
    error: null,
    isConnected: false
  });
  const [db, setDb] = useState<IDBDatabase | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeDatabase = async () => {
      try {
        setState({ isLoading: true, error: null, isConnected: false });
        
        const database = await manager.connect();
        
        if (mounted) {
          setDb(database);
          setState({ isLoading: false, error: null, isConnected: true });
          onSuccess?.(database);
        }
      } catch (error) {
        if (mounted) {
          const err = error as Error;
          setState({ isLoading: false, error: err, isConnected: false });
          onError?.(err);
        }
      }
    };

    initializeDatabase();

    return () => {
      mounted = false;
      manager.disconnect();
    };
  }, [config.name, config.version]);

  const executeTransaction = async <T = any>(transaction: Transaction): Promise<T> => {
    if (!manager.isConnected()) {
      throw new Error('Database not connected');
    }
    return manager.executeTransaction<T>(transaction);
  };

  const subscribe = <T = any>(
    storeName: string, 
    callback: SubscriptionCallback<T>
  ): Subscription => {
    return manager.subscribe<T>(storeName, callback);
  };

  const contextValue: IndexedDBContextValue = {
    db,
    state,
    executeTransaction,
    subscribe
  };

  return (
    <IndexedDBContext.Provider value={contextValue}>
      {children}
    </IndexedDBContext.Provider>
  );
}