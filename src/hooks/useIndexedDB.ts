import { useState, useEffect, useCallback, useContext } from 'react';
import { IndexedDBContext } from '../context/IndexedDBContext';
import { UseIndexedDBReturn } from '../types';

export function useIndexedDB<T = any>(storeName: string): UseIndexedDBReturn<T> {
  const context = useContext(IndexedDBContext);
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  if (!context) {
    throw new Error('useIndexedDB must be used within IndexedDBProvider');
  }

  const { db, executeTransaction, subscribe } = context;

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const subscription = subscribe<T>(storeName, (newData) => {
      setData(newData);
      setLoading(false);
      setError(null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [db, storeName, subscribe]);

  const add = useCallback(async (value: T, key?: IDBValidKey): Promise<IDBValidKey> => {
    try {
      setLoading(true);
      const result = await executeTransaction<IDBValidKey>({
        store: storeName,
        mode: 'readwrite',
        operations: [{ type: 'add', data: value, key }]
      });
      setLoading(false);
      return result;
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  }, [storeName, executeTransaction]);

  const put = useCallback(async (value: T, key?: IDBValidKey): Promise<IDBValidKey> => {
    try {
      setLoading(true);
      const result = await executeTransaction<IDBValidKey>({
        store: storeName,
        mode: 'readwrite',
        operations: [{ type: 'put', data: value, key }]
      });
      setLoading(false);
      return result;
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  }, [storeName, executeTransaction]);

  const deleteItem = useCallback(async (key: IDBValidKey | IDBKeyRange): Promise<void> => {
    try {
      setLoading(true);
      await executeTransaction({
        store: storeName,
        mode: 'readwrite',
        operations: [{ type: 'delete', key }]
      });
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  }, [storeName, executeTransaction]);

  const clear = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      await executeTransaction({
        store: storeName,
        mode: 'readwrite',
        operations: [{ type: 'clear' }]
      });
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  }, [storeName, executeTransaction]);

  const get = useCallback(async (key: IDBValidKey): Promise<T | undefined> => {
    try {
      const result = await executeTransaction<T | undefined>({
        store: storeName,
        mode: 'readonly',
        operations: [{ type: 'get', key }]
      });
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [storeName, executeTransaction]);

  const getAll = useCallback(async (
    query?: IDBKeyRange | IDBValidKey,
    count?: number
  ): Promise<T[]> => {
    try {
      const result = await executeTransaction<T[]>({
        store: storeName,
        mode: 'readonly',
        operations: [{ type: 'getAll', query, data: count }]
      });
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [storeName, executeTransaction]);

  const count = useCallback(async (query?: IDBKeyRange | IDBValidKey): Promise<number> => {
    try {
      const result = await executeTransaction<number>({
        store: storeName,
        mode: 'readonly',
        operations: [{ type: 'count', query }]
      });
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [storeName, executeTransaction]);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const newData = await getAll();
      setData(newData);
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  }, [getAll]);

  return {
    data,
    loading,
    error,
    add,
    put,
    delete: deleteItem,
    clear,
    get,
    getAll,
    count,
    refresh
  };
}