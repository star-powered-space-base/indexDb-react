# @starpower/use-indexdb

A powerful React library for using IndexedDB as state management with TypeScript support.

## Features

- 🚀 Simple and intuitive React hooks for IndexedDB operations
- 💾 Use IndexedDB as a state management solution
- 🔄 Real-time data synchronization with live queries
- 📦 TypeScript support out of the box
- ⚡ Optimized performance with subscription-based updates
- 🎯 Transaction builder for complex operations
- 🔧 Flexible and extensible architecture

## Installation

```bash
npm install @starpower/use-indexdb
# or
yarn add @starpower/use-indexdb
# or
pnpm add @starpower/use-indexdb
```

## Quick Start

### 1. Setup the Provider

Wrap your app with the `IndexedDBProvider`:

```tsx
import React from 'react';
import { IndexedDBProvider } from '@starpower/use-indexdb';

const dbConfig = {
  name: 'MyAppDB',
  version: 1,
  stores: [
    {
      name: 'users',
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'email', keyPath: 'email', unique: true },
        { name: 'age', keyPath: 'age', unique: false }
      ]
    },
    {
      name: 'products',
      keyPath: 'id',
      autoIncrement: true
    }
  ]
};

function App() {
  return (
    <IndexedDBProvider config={dbConfig}>
      <YourApp />
    </IndexedDBProvider>
  );
}
```

### 2. Use the Hooks

```tsx
import React from 'react';
import { useIndexedDB } from '@starpower/use-indexdb';

interface User {
  id?: number;
  name: string;
  email: string;
  age: number;
}

function UserComponent() {
  const { 
    data, 
    loading, 
    error, 
    add, 
    put, 
    delete: deleteUser,
    clear 
  } = useIndexedDB<User>('users');

  const handleAddUser = async () => {
    await add({
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    });
  };

  const handleUpdateUser = async (user: User) => {
    await put({ ...user, name: 'Jane Doe' });
  };

  const handleDeleteUser = async (id: number) => {
    await deleteUser(id);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Users</h2>
      <button onClick={handleAddUser}>Add User</button>
      <button onClick={clear}>Clear All</button>
      
      {data && data.map((user: User) => (
        <div key={user.id}>
          <span>{user.name} - {user.email}</span>
          <button onClick={() => handleUpdateUser(user)}>Update</button>
          <button onClick={() => handleDeleteUser(user.id!)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

## API Reference

### Hooks

#### `useIndexedDB<T>(storeName: string)`

Main hook for interacting with an IndexedDB store.

**Returns:**
- `data`: Array of items in the store
- `loading`: Loading state
- `error`: Error object if any
- `add(value: T, key?: IDBValidKey)`: Add a new item
- `put(value: T, key?: IDBValidKey)`: Update or insert an item
- `delete(key: IDBValidKey | IDBKeyRange)`: Delete an item
- `clear()`: Clear all items in the store
- `get(key: IDBValidKey)`: Get a single item
- `getAll(query?, count?)`: Get all items matching query
- `count(query?)`: Count items matching query
- `refresh()`: Manually refresh the data

#### `useLiveQuery<T>(options: LiveQueryOptions)`

Hook for real-time queries that automatically update when data changes.

```tsx
const { data, loading, error } = useLiveQuery<User>({
  storeName: 'users',
  query: IDBKeyRange.bound(20, 40), // Users aged 20-40
  count: 10 // Limit to 10 results
});
```

#### `useTransaction(storeName: string, mode?: IDBTransactionMode)`

Hook for building and executing complex transactions.

```tsx
const { createTransaction, isExecuting, error } = useTransaction('users');

const performBatchOperations = async () => {
  const result = await createTransaction()
    .add({ name: 'User 1', email: 'user1@example.com' })
    .add({ name: 'User 2', email: 'user2@example.com' })
    .put({ id: 1, name: 'Updated User' })
    .delete(5)
    .execute();
};
```

#### `useIndexedDBStore(config: DatabaseConfig)`

Hook for managing the IndexedDB connection at a lower level.

```tsx
const { manager, isConnected, error, isLoading, reconnect } = useIndexedDBStore(dbConfig);
```

### Components

#### `IndexedDBProvider`

Provider component that initializes and manages the IndexedDB connection.

**Props:**
- `config: DatabaseConfig`: Database configuration
- `children: ReactNode`: Child components
- `onError?: (error: Error) => void`: Error callback
- `onSuccess?: (db: IDBDatabase) => void`: Success callback

### Types

```typescript
interface DatabaseConfig {
  name: string;
  version: number;
  stores: StoreConfig[];
}

interface StoreConfig {
  name: string;
  keyPath?: string;
  autoIncrement?: boolean;
  indexes?: IndexConfig[];
}

interface IndexConfig {
  name: string;
  keyPath: string | string[];
  unique?: boolean;
  multiEntry?: boolean;
}
```

## Advanced Usage

### Working with Indexes

```tsx
const dbConfig = {
  name: 'MyDB',
  version: 1,
  stores: [
    {
      name: 'users',
      keyPath: 'id',
      indexes: [
        { name: 'email', keyPath: 'email', unique: true },
        { name: 'ageAndCity', keyPath: ['age', 'city'] }
      ]
    }
  ]
};
```

### Complex Queries

```tsx
// Query by range
const youngUsers = await getAll(IDBKeyRange.bound(18, 30));

// Query with limit
const topUsers = await getAll(undefined, 10);

// Count items
const userCount = await count();
```

### Batch Operations

```tsx
const { createTransaction } = useTransaction('users', 'readwrite');

const batchImport = async (users: User[]) => {
  const transaction = createTransaction();
  
  users.forEach(user => {
    transaction.add(user);
  });
  
  await transaction.execute();
};
```

## Browser Support

This library requires a browser that supports IndexedDB:
- Chrome 24+
- Firefox 16+
- Safari 8+
- Edge 12+
- Opera 15+

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please visit the [GitHub Issues](https://github.com/starpower/use-indexdb/issues) page.