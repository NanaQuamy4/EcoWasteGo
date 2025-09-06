// Custom storage adapter that works without native modules
// This provides basic storage functionality for development

interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

// Simple in-memory storage for development
class MemoryStorage implements StorageAdapter {
  private storage: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }
}

// Try to use AsyncStorage if available, fallback to memory storage
let storageAdapter: StorageAdapter;

try {
  // Try to import AsyncStorage
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  storageAdapter = AsyncStorage;
  console.log('Using AsyncStorage for persistence');
} catch (error) {
  console.log('AsyncStorage not available, using memory storage');
  storageAdapter = new MemoryStorage();
}

export default storageAdapter;
