import { db } from "./Firebase";
import {
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  enableNetwork,
  writeBatch,
  type Unsubscribe,
  type DocumentData,
  type Query,
  type DocumentReference,
  type QuerySnapshot,
  type DocumentSnapshot
} from "firebase/firestore";
import { handleFirebaseError, withRetry } from "./firebaseErrorHandler";
import { toast } from "react-toastify";

// Connection state management
let isOnline = true;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;
const RECONNECTION_DELAYS = [1000, 2000, 5000, 10000, 30000]; // Progressive delays

// Connection test function
export const testConnection = async (): Promise<boolean> => {
  try {
    await withRetry(async () => {
      const testRef = doc(db, "_connection_test", "test");
      await getDoc(testRef);
    }, 2, 1000);
    
    connectionAttempts = 0;
    isOnline = true;
    return true;
  } catch (error) {
    console.error("Connection test failed:", error);
    isOnline = false;
    return false;
  }
};

// Enhanced wrapper functions with connection handling
export const safeGetDoc = async (docRef: DocumentReference): Promise<DocumentSnapshot<DocumentData> | null> => {
  try {
    return await withRetry(async () => {
      if (!isOnline) {
        await attemptReconnection();
      }
      return await getDoc(docRef);
    }, 3, 1000);
  } catch (error) {
    handleFirebaseError(error, "reading document");
    return null;
  }
};

export const safeGetDocs = async (q: Query): Promise<QuerySnapshot<DocumentData> | null> => {
  try {
    return await withRetry(async () => {
      if (!isOnline) {
        await attemptReconnection();
      }
      return await getDocs(q);
    }, 3, 1000);
  } catch (error) {
    handleFirebaseError(error, "reading collection");
    return null;
  }
};

export const safeAddDoc = async (collectionRef: any, data: any): Promise<DocumentReference | null> => {
  try {
    return await withRetry(async () => {
      if (!isOnline) {
        await attemptReconnection();
      }
      return await addDoc(collectionRef, data);
    }, 3, 1000);
  } catch (error) {
    handleFirebaseError(error, "adding document");
    return null;
  }
};

export const safeUpdateDoc = async (docRef: DocumentReference, data: any): Promise<boolean> => {
  try {
    await withRetry(async () => {
      if (!isOnline) {
        await attemptReconnection();
      }
      await updateDoc(docRef, data);
    }, 3, 1000);
    return true;
  } catch (error) {
    handleFirebaseError(error, "updating document");
    return false;
  }
};

export const safeDeleteDoc = async (docRef: DocumentReference): Promise<boolean> => {
  try {
    await withRetry(async () => {
      if (!isOnline) {
        await attemptReconnection();
      }
      await deleteDoc(docRef);
    }, 3, 1000);
    return true;
  } catch (error) {
    handleFirebaseError(error, "deleting document");
    return false;
  }
};

export const safeBatchWrite = async (operations: Array<() => void>): Promise<boolean> => {
  try {
    return await withRetry(async () => {
      if (!isOnline) {
        await attemptReconnection();
      }
      
      const batch = writeBatch(db);
      operations.forEach(op => op());
      await batch.commit();
      return true;
    }, 3, 1000);
  } catch (error) {
    handleFirebaseError(error, "batch write operation");
    return false;
  }
};

// Enhanced onSnapshot with connection recovery
export const safeOnSnapshot = (
  q: Query,
  callback: (snapshot: QuerySnapshot) => void,
  errorCallback?: (error: Error) => void
): Unsubscribe => {
  let unsubscribe: Unsubscribe | null = null;
  let isSubscribed = true;
  
  const setupListener = async () => {
    if (!isSubscribed) return;
    
    try {
      if (!isOnline) {
        await attemptReconnection();
      }
      
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (isSubscribed) {
            isOnline = true;
            connectionAttempts = 0;
            callback(snapshot);
          }
        },
        async (error) => {
          console.error("Firestore snapshot error:", error);
          
          // Handle network errors specifically
          if (error.message.includes("Failed to fetch") || error.code === "unavailable") {
            isOnline = false;
            toast.warning("Connection lost. Attempting to reconnect...");
            
            // Attempt to reconnect
            setTimeout(async () => {
              if (isSubscribed) {
                await attemptReconnection();
                if (isOnline) {
                  setupListener(); // Re-establish the listener
                }
              }
            }, RECONNECTION_DELAYS[Math.min(connectionAttempts, RECONNECTION_DELAYS.length - 1)]);
          }
          
          if (errorCallback) {
            errorCallback(error);
          }
        }
      );
    } catch (error) {
      console.error("Failed to setup snapshot listener:", error);
      
      // Retry setup after delay
      if (isSubscribed && connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
        setTimeout(() => {
          if (isSubscribed) {
            setupListener();
          }
        }, RECONNECTION_DELAYS[Math.min(connectionAttempts, RECONNECTION_DELAYS.length - 1)]);
      }
    }
  };
  
  // Initial setup
  setupListener();
  
  // Return cleanup function
  return () => {
    isSubscribed = false;
    if (unsubscribe) {
      unsubscribe();
    }
  };
};

// Connection recovery mechanism
const attemptReconnection = async (): Promise<void> => {
  if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
    toast.error("Multiple connection failures. Please check your internet connection and refresh the page.");
    return;
  }

  connectionAttempts++;
  console.log(`Attempting reconnection ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}...`);
  
  try {
    // Try to re-enable network
    await enableNetwork(db);
    
    // Test the connection
    const isConnected = await testConnection();
    
    if (isConnected) {
      toast.success("Connection restored successfully!");
      connectionAttempts = 0;
      isOnline = true;
    } else {
      throw new Error("Connection test failed");
    }
  } catch (error) {
    console.error(`Reconnection attempt ${connectionAttempts} failed:`, error);
    
    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      const delay = RECONNECTION_DELAYS[Math.min(connectionAttempts - 1, RECONNECTION_DELAYS.length - 1)];
      toast.info(`Retrying connection in ${delay / 1000} seconds...`);
      
      setTimeout(async () => {
        await attemptReconnection();
      }, delay);
    } else {
      toast.error("Unable to restore connection. Please refresh the page.");
      isOnline = false;
    }
  }
};

// Initialize connection monitoring
export const initializeConnection = async (): Promise<void> => {
  // Test initial connection
  const isConnected = await testConnection();
  
  if (!isConnected) {
    console.warn("Initial connection failed, starting recovery process...");
    await attemptReconnection();
  }
  
  // Monitor online/offline status
  window.addEventListener("online", async () => {
    console.log("Network came back online, testing Firebase connection...");
    await testConnection();
  });
  
  window.addEventListener("offline", () => {
    console.log("Network went offline");
    isOnline = false;
  });
};

// Export connection status
export const getConnectionStatus = () => ({
  isOnline,
  connectionAttempts,
  maxAttempts: MAX_CONNECTION_ATTEMPTS
});
