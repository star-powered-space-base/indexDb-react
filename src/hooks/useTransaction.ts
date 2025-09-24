import { useContext, useCallback, useState } from 'react';
import { IndexedDBContext } from '../context/IndexedDBContext';
import { Transaction, Operation } from '../types';

export interface TransactionBuilder {
  add: (data: any, key?: IDBValidKey) => TransactionBuilder;
  put: (data: any, key?: IDBValidKey) => TransactionBuilder;
  delete: (key: IDBValidKey | IDBKeyRange) => TransactionBuilder;
  clear: () => TransactionBuilder;
  get: (key: IDBValidKey) => TransactionBuilder;
  getAll: (query?: IDBKeyRange | IDBValidKey, count?: number) => TransactionBuilder;
  count: (query?: IDBKeyRange | IDBValidKey) => TransactionBuilder;
  execute: <T = any>() => Promise<T>;
}

export function useTransaction(storeName: string, mode: IDBTransactionMode = 'readwrite') {
  const context = useContext(IndexedDBContext);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  if (!context) {
    throw new Error('useTransaction must be used within IndexedDBProvider');
  }

  const { executeTransaction } = context;

  const createTransactionBuilder = useCallback((): TransactionBuilder => {
    const operations: Operation[] = [];

    const builder: TransactionBuilder = {
      add: (data: any, key?: IDBValidKey) => {
        operations.push({ type: 'add', data, key });
        return builder;
      },
      put: (data: any, key?: IDBValidKey) => {
        operations.push({ type: 'put', data, key });
        return builder;
      },
      delete: (key: IDBValidKey | IDBKeyRange) => {
        operations.push({ type: 'delete', key });
        return builder;
      },
      clear: () => {
        operations.push({ type: 'clear' });
        return builder;
      },
      get: (key: IDBValidKey) => {
        operations.push({ type: 'get', key });
        return builder;
      },
      getAll: (query?: IDBKeyRange | IDBValidKey, count?: number) => {
        operations.push({ type: 'getAll', query, data: count });
        return builder;
      },
      count: (query?: IDBKeyRange | IDBValidKey) => {
        operations.push({ type: 'count', query });
        return builder;
      },
      execute: async <T = any>() => {
        try {
          setIsExecuting(true);
          setError(null);
          
          const transaction: Transaction = {
            store: storeName,
            mode,
            operations
          };
          
          const result = await executeTransaction<T>(transaction);
          setIsExecuting(false);
          return result;
        } catch (err) {
          const error = err as Error;
          setError(error);
          setIsExecuting(false);
          throw error;
        }
      }
    };

    return builder;
  }, [storeName, mode, executeTransaction]);

  return {
    createTransaction: createTransactionBuilder,
    isExecuting,
    error
  };
}