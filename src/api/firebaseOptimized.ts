// Optimized Firebase configuration with performance monitoring
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  enableNetwork,
  disableNetwork,
  writeBatch,
} from "firebase/firestore";
import { getPerformance } from "firebase/performance";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZl9JWuIm4yHS6ZZtJi_xJk5KeGWcQRC8",
  authDomain: "travelagency-sd.firebaseapp.com",
  projectId: "travelagency-sd",
  storageBucket: "travelagency-sd.firebasestorage.app",
  messagingSenderId: "1021951570638",
  appId: "1:1021951570638:web:9a87b4217d4f40cc30d69f",
  measurementId: "G-FQDWFV931W",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize performance monitoring (only in production)
let perf: ReturnType<typeof getPerformance> | null = null;
if (import.meta.env.PROD) {
  try {
    perf = getPerformance(app);
  } catch (error) {
    console.warn("Performance monitoring failed to initialize:", error);
  }
}

// Connection state management
export const connectionManager = {
  isOnline: navigator.onLine,

  // Enable offline persistence
  enableOffline: async () => {
    try {
      await disableNetwork(db);
      console.log("Firestore offline mode enabled");
    } catch (error) {
      console.error("Failed to enable offline mode:", error);
    }
  },

  // Enable online mode
  enableOnline: async () => {
    try {
      await enableNetwork(db);
      console.log("Firestore online mode enabled");
    } catch (error) {
      console.error("Failed to enable online mode:", error);
    }
  },

  // Initialize connection listeners
  init: () => {
    window.addEventListener("online", async () => {
      connectionManager.isOnline = true;
      await connectionManager.enableOnline();
    });

    window.addEventListener("offline", async () => {
      connectionManager.isOnline = false;
      await connectionManager.enableOffline();
    });
  },
};

// Initialize connection management
connectionManager.init();

// Firestore query optimization helpers
export const queryHelpers = {
  // Create optimized queries with proper indexing hints
  createOptimizedQuery: (
    collectionRef: unknown,
    options: {
      orderBy?: { field: string; direction: "asc" | "desc" };
      where?: { field: string; operator: string; value: unknown }[];
      limit?: number;
      startAfter?: unknown;
    },
  ) => {
    // This is a helper function that would be implemented based on specific use case
    console.log("Optimized query would be created with:", collectionRef, options);
    return collectionRef;
  },

  // Batch operations for better performance
  createBatch: () => {
    return writeBatch(db);
  },

  // Optimized field selection (when available)
  selectFields: (fields: string[]) => {
    // Firestore v10+ feature - select specific fields
    // Currently not available in v9, but prepared for future
    return fields;
  },
};

// Performance monitoring helpers
export const performanceMonitoring = {
  // Track custom traces
  trace: (name: string) => {
    if (!perf) return null;

    try {
      // Performance tracing would be implemented here
      console.log("Performance trace started:", name);
      return {
        start: () => console.log("Trace started:", name),
        stop: () => console.log("Trace stopped:", name),
        putAttribute: (key: string, value: string) => console.log("Trace attribute:", key, value)
      };
    } catch (error) {
      console.warn("Failed to create performance trace:", error);
      return null;
    }
  },

  // Track page load performance
  trackPageLoad: (pageName: string) => {
    const trace = performanceMonitoring.trace(`page_load_${pageName}`);
    if (trace) {
      trace.start();

      // Auto-stop after 10 seconds max
      setTimeout(() => {
        if (trace) {
          trace.stop();
        }
      }, 10000);

      return trace;
    }
    return null;
  },

  // Track API call performance
  trackApiCall: (apiName: string) => {
    const trace = performanceMonitoring.trace(`api_call_${apiName}`);
    if (trace) {
      trace.start();
      return {
        stop: () => trace.stop(),
        putAttribute: (key: string, value: string) => {
          try {
            trace.putAttribute(key, value);
          } catch (error) {
            console.warn("Failed to put trace attribute:", error);
          }
        },
      };
    }
    return {
      stop: () => {},
      putAttribute: () => {},
    };
  },
};

// Memory management helpers
export const memoryManagement = {
  // Clean up listeners and references
  cleanup: () => {
    // Clear any global references
    // This would be called on app unmount
  },

  // Monitor memory usage (development only)
  logMemoryUsage: () => {
    if (import.meta.env.DEV && "memory" in performance) {
      const memory = (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      if (memory) {
        console.log("Memory usage:", {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + "MB",
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + "MB",
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + "MB",
        });
      }
    }
  },
};

// Error tracking and reporting
export const errorReporting = {
  // Report Firebase errors with context
  reportError: (error: unknown, context: string) => {
    console.error(`Firebase error in ${context}:`, error);

    // In production, you might want to send to error tracking service
    if (import.meta.env.PROD) {
      // Example: Sentry.captureException(error, { tags: { context } });
    }
  },

  // Report performance issues
  reportPerformanceIssue: (
    operation: string,
    duration: number,
    threshold: number = 5000,
  ) => {
    if (duration > threshold) {
      console.warn(
        `Performance issue: ${operation} took ${duration}ms (threshold: ${threshold}ms)`,
      );

      // Track slow operations
      if (import.meta.env.PROD) {
        // Report to analytics or monitoring service
      }
    }
  },
};

// Development helpers
if (import.meta.env.DEV) {
  // Enable emulators in development if needed
  // connectAuthEmulator(auth, "http://localhost:9099");
  // connectFirestoreEmulator(db, 'localhost', 8080);

  // Log memory usage periodically in development
  setInterval(() => {
    memoryManagement.logMemoryUsage();
  }, 30000); // Every 30 seconds
}

export { app, perf };
