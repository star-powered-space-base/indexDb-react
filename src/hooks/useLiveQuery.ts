import { useState, useEffect, useContext, DependencyList } from 'react';
import { IndexedDBContext } from '../context/IndexedDBContext';

export interface LiveQueryOptions {
  storeName: string;
  query?: IDBKeyRange | IDBValidKey;
  count?: number;
  index?: string;
}

export function useLiveQuery<T = any>(
  options: LiveQueryOptions,
  deps: DependencyList = []
) {
  const context = useContext(IndexedDBContext);
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  if (!context) {
    throw new Error('useLiveQuery must be used within IndexedDBProvider');
  }

  const { db, executeTransaction, subscribe } = context;

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    let unsubscribed = false;

    const loadData = async () => {
      try {
        setLoading(true);
        const result = await executeTransaction<T[]>({
          store: options.storeName,
          mode: 'readonly',
          operations: [{
            type: 'getAll',
            query: options.query,
            data: options.count
          }]
        });

        if (!unsubscribed) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!unsubscribed) {
          setError(err as Error);
        }
      } finally {
        if (!unsubscribed) {
          setLoading(false);
        }
      }
    };

    loadData();

    const subscription = subscribe<T>(options.storeName, (newData) => {
      if (!unsubscribed) {
        setData(newData);
        setError(null);
      }
    });

    return () => {
      unsubscribed = true;
      subscription.unsubscribe();
    };
  }, [db, options.storeName, options.query, options.count, ...deps]);

  return { data, loading, error };
}