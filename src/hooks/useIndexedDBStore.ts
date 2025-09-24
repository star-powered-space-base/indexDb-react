import { useState, useEffect, useCallback } from 'react';
import { IndexedDBManager } from '../core/IndexedDBManager';
import { DatabaseConfig } from '../types';

export function useIndexedDBStore(config: DatabaseConfig) {
  const [manager, setManager] = useState<IndexedDBManager | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const dbManager = new IndexedDBManager(config);
    
    dbManager.connect()
      .then(() => {
        setManager(dbManager);
        setIsConnected(true);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });

    return () => {
      dbManager.disconnect();
    };
  }, [config.name, config.version]);

  const reconnect = useCallback(async () => {
    if (!manager) return;
    
    try {
      setIsLoading(true);
      await manager.connect();
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(err as Error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [manager]);

  return {
    manager,
    isConnected,
    error,
    isLoading,
    reconnect
  };
}