// Offline handling utilities

interface QueuedOperation {
  id: string;
  operation: () => Promise<any>;
  context: string;
  timestamp: number;
}

class OfflineHandler {
  private queue: QueuedOperation[] = [];
  private isProcessing = false;

  constructor() {
    // Listen for online events to process queued operations
    window.addEventListener("online", () => {
      this.processQueue();
    });
  }

  // Add operation to queue when offline
  queueOperation(operation: () => Promise<any>, context: string): string {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    this.queue.push({
      id,
      operation,
      context,
      timestamp: Date.now(),
    });

    // Try to process immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }

    return id;
  }

  // Process all queued operations
  async processQueue() {
    if (this.isProcessing || !navigator.onLine || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const operations = [...this.queue];
    this.queue = [];

    for (const item of operations) {
      try {
        await item.operation();
        console.log(`Successfully processed queued operation: ${item.context}`);
      } catch (error) {
        console.error(
          `Failed to process queued operation: ${item.context}`,
          error,
        );
        // Re-queue if it's a retryable error
        if (this.shouldRetryOperation(error)) {
          this.queue.push(item);
        }
      }
    }

    this.isProcessing = false;

    // If there are still items in queue, try again later
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 5000);
    }
  }

  private shouldRetryOperation(error: any): boolean {
    // Don't retry very old operations (older than 1 hour)
    const maxAge = 60 * 60 * 1000; // 1 hour
    return Date.now() - error.timestamp < maxAge;
  }

  // Get number of queued operations
  getQueueSize(): number {
    return this.queue.length;
  }

  // Clear all queued operations
  clearQueue(): void {
    this.queue = [];
  }
}

// Global offline handler instance
export const offlineHandler = new OfflineHandler();

// Wrapper for Firebase operations with offline support
export const withOfflineSupport = async <T>(
  operation: () => Promise<T>,
  context: string,
): Promise<T> => {
  if (!navigator.onLine) {
    // Queue the operation for later
    offlineHandler.queueOperation(operation, context);
    throw new Error("عملية مؤجلة - سيتم تنفيذها عند استعادة الاتصال");
  }

  return operation();
};

// Local storage cache for frequently accessed data
export class LocalCache {
  private static readonly CACHE_PREFIX = "travel_agency_cache_";
  private static readonly CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

  static set(key: string, data: any): void {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.CACHE_PREFIX + key, JSON.stringify(cacheData));
    } catch (error) {
      console.warn("Failed to cache data:", error);
    }
  }

  static get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(this.CACHE_PREFIX + key);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const isExpired = Date.now() - cacheData.timestamp > this.CACHE_EXPIRY;

      if (isExpired) {
        this.remove(key);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.warn("Failed to retrieve cached data:", error);
      return null;
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(this.CACHE_PREFIX + key);
    } catch (error) {
      console.warn("Failed to remove cached data:", error);
    }
  }

  static clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("Failed to clear cache:", error);
    }
  }
}
