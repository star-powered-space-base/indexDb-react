import { IndexedDBManager } from '../core/IndexedDBManager';
import { DatabaseConfig } from '../types';

describe('IndexedDBManager', () => {
  let manager: IndexedDBManager;
  
  const config: DatabaseConfig = {
    name: 'TestDB',
    version: 1,
    stores: [
      {
        name: 'users',
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
          { name: 'email', keyPath: 'email', unique: true }
        ]
      }
    ]
  };

  beforeEach(async () => {
    // Clear any existing database
    const deleteReq = indexedDB.deleteDatabase('TestDB');
    await new Promise((resolve, reject) => {
      deleteReq.onsuccess = resolve;
      deleteReq.onerror = reject;
    });
    
    manager = new IndexedDBManager(config);
    await manager.connect();
  });

  afterEach(async () => {
    await manager.disconnect();
    // Clean up database after each test
    const deleteReq = indexedDB.deleteDatabase('TestDB');
    await new Promise((resolve, reject) => {
      deleteReq.onsuccess = resolve;
      deleteReq.onerror = reject;
    });
  });

  it('should connect to database', async () => {
    expect(manager.isConnected()).toBe(true);
    const db = manager.getDatabase();
    expect(db).toBeDefined();
    expect(db?.name).toBe('TestDB');
  });

  it('should add data to store', async () => {
    const userData = { name: 'John', email: 'john@example.com' };
    const key = await manager.add('users', userData);
    expect(key).toBeDefined();
    expect(typeof key === 'number' || typeof key === 'string').toBe(true);
  });

  it('should get data from store', async () => {
    const userData = { name: 'John', email: 'john@example.com' };
    const key = await manager.add('users', userData);
    
    const user = await manager.get('users', key);
    expect(user).toBeDefined();
    expect(user).toMatchObject(userData);
    expect(user).toHaveProperty('id', key);
  });

  it('should update data in store', async () => {
    const userData = { name: 'John', email: 'john@example.com' };
    const key = await manager.add('users', userData);
    
    const updatedData = { id: key, name: 'Jane', email: 'jane@example.com' };
    await manager.put('users', updatedData);
    
    const user = await manager.get('users', key);
    expect(user).toEqual(updatedData);
  });

  it('should delete data from store', async () => {
    const userData = { name: 'John', email: 'john@example.com' };
    const key = await manager.add('users', userData);
    
    // Verify data exists
    let user = await manager.get('users', key);
    expect(user).toBeDefined();
    
    // Delete the data
    await manager.delete('users', key);
    
    // Verify data is deleted
    user = await manager.get('users', key);
    expect(user).toBeUndefined();
  });

  it('should clear all data from store', async () => {
    // Add multiple users
    await manager.add('users', { name: 'John', email: 'john@example.com' });
    await manager.add('users', { name: 'Jane', email: 'jane@example.com' });
    
    // Verify data exists
    let users = await manager.getAll('users');
    expect(users.length).toBe(2);
    
    // Clear all data
    await manager.clear('users');
    
    // Verify store is empty
    users = await manager.getAll('users');
    expect(users).toEqual([]);
  });

  it('should count items in store', async () => {
    // Initially should be 0
    let count = await manager.count('users');
    expect(count).toBe(0);
    
    // Add users
    await manager.add('users', { name: 'John', email: 'john@example.com' });
    await manager.add('users', { name: 'Jane', email: 'jane@example.com' });
    
    // Should now be 2
    count = await manager.count('users');
    expect(count).toBe(2);
  });

  it('should handle subscriptions', async () => {
    const mockCallback = jest.fn();
    
    // Subscribe to changes
    const subscription = manager.subscribe('users', mockCallback);
    
    // Wait for initial callback
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should have been called at least once with empty array
    expect(mockCallback).toHaveBeenCalled();
    const initialCallIndex = mockCallback.mock.calls.findIndex(
      call => Array.isArray(call[0]) && call[0].length === 0
    );
    expect(initialCallIndex).toBeGreaterThanOrEqual(0);
    
    // Reset mock to track new calls
    mockCallback.mockClear();
    
    // Add data
    await manager.add('users', { name: 'John', email: 'john@example.com' });
    
    // Wait for subscription callback
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should be called with the new data
    expect(mockCallback).toHaveBeenCalled();
    const callWithData = mockCallback.mock.calls.find(
      call => Array.isArray(call[0]) && call[0].length === 1
    );
    expect(callWithData).toBeDefined();
    expect(callWithData[0][0]).toMatchObject({ name: 'John', email: 'john@example.com' });
    
    // Unsubscribe
    subscription.unsubscribe();
    
    // Clear mock and add more data after unsubscribe
    const callCountBeforeUnsubscribe = mockCallback.mock.calls.length;
    await manager.add('users', { name: 'Jane', email: 'jane@example.com' });
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should not have additional calls after unsubscribe
    expect(mockCallback.mock.calls.length).toBe(callCountBeforeUnsubscribe);
  });
});