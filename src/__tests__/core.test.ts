import { IndexedDBManager } from '../core/IndexedDBManager';
import { DatabaseConfig } from '../types';

describe('Core IndexedDB functionality', () => {
  let manager: IndexedDBManager;
  
  const config: DatabaseConfig = {
    name: 'CoreTestDB',
    version: 1,
    stores: [
      {
        name: 'users',
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
          { name: 'email', keyPath: 'email', unique: true },
          { name: 'age', keyPath: 'age' }
        ]
      },
      {
        name: 'products',
        keyPath: 'id',
        autoIncrement: true
      }
    ]
  };

  beforeEach(async () => {
    // Clean up any existing database
    const deleteReq = indexedDB.deleteDatabase('CoreTestDB');
    await new Promise((resolve) => {
      deleteReq.onsuccess = resolve;
      deleteReq.onerror = resolve;
    });
    
    manager = new IndexedDBManager(config);
    await manager.connect();
  });

  afterEach(async () => {
    await manager.disconnect();
    const deleteReq = indexedDB.deleteDatabase('CoreTestDB');
    await new Promise((resolve) => {
      deleteReq.onsuccess = resolve;
      deleteReq.onerror = resolve;
    });
  });

  test('Database connection', () => {
    expect(manager.isConnected()).toBe(true);
    const db = manager.getDatabase();
    expect(db).toBeDefined();
    expect(db?.name).toBe('CoreTestDB');
    expect(db?.version).toBe(1);
  });

  test('Store creation', () => {
    const db = manager.getDatabase();
    expect(db?.objectStoreNames.contains('users')).toBe(true);
    expect(db?.objectStoreNames.contains('products')).toBe(true);
  });

  test('CRUD operations on users store', async () => {
    // Create
    const userData = { name: 'John Doe', email: 'john@example.com', age: 30 };
    const userId = await manager.add('users', userData);
    expect(userId).toBeDefined();
    expect(typeof userId).toBe('number');

    // Read
    const user = await manager.get('users', userId);
    expect(user).toMatchObject(userData);
    expect(user).toHaveProperty('id', userId);

    // Update
    const updatedData = { ...user, name: 'Jane Doe', age: 31 };
    await manager.put('users', updatedData);
    const updatedUser = await manager.get('users', userId);
    expect(updatedUser).toEqual(updatedData);

    // Delete
    await manager.delete('users', userId);
    const deletedUser = await manager.get('users', userId);
    expect(deletedUser).toBeUndefined();
  });

  test('Batch operations', async () => {
    // Add multiple items
    const users = [
      { name: 'Alice', email: 'alice@example.com', age: 25 },
      { name: 'Bob', email: 'bob@example.com', age: 35 },
      { name: 'Charlie', email: 'charlie@example.com', age: 28 }
    ];

    const ids = [];
    for (const user of users) {
      const id = await manager.add('users', user);
      ids.push(id);
    }

    // Get all
    const allUsers = await manager.getAll('users');
    expect(allUsers.length).toBe(3);

    // Count
    const count = await manager.count('users');
    expect(count).toBe(3);

    // Clear
    await manager.clear('users');
    const afterClear = await manager.getAll('users');
    expect(afterClear.length).toBe(0);
  });

  test('Transaction execution', async () => {
    const transaction = {
      store: 'products',
      mode: 'readwrite' as IDBTransactionMode,
      operations: [
        { type: 'add' as const, data: { name: 'Product 1', price: 100 } },
        { type: 'add' as const, data: { name: 'Product 2', price: 200 } },
        { type: 'add' as const, data: { name: 'Product 3', price: 300 } }
      ]
    };

    const results = await manager.executeTransaction(transaction);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(3);

    const products = await manager.getAll('products');
    expect(products.length).toBe(3);
  });

  test('Subscription mechanism', async () => {
    const mockCallback = jest.fn();
    const subscription = manager.subscribe('products', mockCallback);

    // Wait for initial callback
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(mockCallback).toHaveBeenCalledWith([]);

    // Add data and wait for notification
    await manager.add('products', { name: 'Test Product', price: 99 });
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify callback was called with new data
    const lastCall = mockCallback.mock.calls[mockCallback.mock.calls.length - 1];
    expect(lastCall[0]).toHaveLength(1);
    expect(lastCall[0][0]).toMatchObject({ name: 'Test Product', price: 99 });

    // Unsubscribe
    subscription.unsubscribe();
    mockCallback.mockClear();

    // Add more data after unsubscribe
    await manager.add('products', { name: 'Another Product', price: 199 });
    await new Promise(resolve => setTimeout(resolve, 50));

    // Callback should not have been called
    expect(mockCallback).not.toHaveBeenCalled();
  });
});