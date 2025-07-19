import { db } from "./Firebase";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";

export interface ConnectionDiagnostic {
  isConnected: boolean;
  latency: number;
  error?: string;
  timestamp: number;
}

export const testFirebaseConnection =
  async (): Promise<ConnectionDiagnostic> => {
    const startTime = Date.now();

    try {
      // Try to read a simple document to test connectivity
      // We'll try to read from a minimal collection first
      const testRef = doc(db, "_connection_test", "test");

      await getDoc(testRef);

      const latency = Date.now() - startTime;

      return {
        isConnected: true,
        latency,
        timestamp: Date.now(),
      };
    } catch (error) {
      const latency = Date.now() - startTime;

      console.error("Firebase connection test failed:", error);

      return {
        isConnected: false,
        latency,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      };
    }
  };

export const diagnoseNetworkIssue = async (): Promise<void> => {
  console.log("🔍 Starting network diagnostics...");

  // Check basic network connectivity
  if (!navigator.onLine) {
    toast.error("لا يوجد اتصال بالإنترنت. يرجى التحقق من الاتصال.");
    return;
  }

  // Test Firebase connection
  const result = await testFirebaseConnection();

  if (!result.isConnected) {
    console.error("Firebase connection failed:", result);

    if (result.error?.includes("Failed to fetch")) {
      toast.error(
        "فشل في الاتصال بقاعدة البيانات. يرجى إعادة تحميل الصفحة أو التحقق من الاتصال بالإنترنت.",
        {
          autoClose: 8000,
          onClose: () => {
            // Suggest page reload after a delay
            setTimeout(() => {
              if (confirm("هل تريد إعادة تحميل الصفحة لحل مشكلة الاتصال؟")) {
                window.location.reload();
              }
            }, 2000);
          },
        },
      );
    } else {
      toast.error("مشكلة في الاتصال بقاعدة البيانات. يرجى المحاولة مرة أخرى.");
    }
  } else {
    console.log(`✅ Firebase connection successful (${result.latency}ms)`);

    if (result.latency > 3000) {
      toast.warning("الاتصال بطيء. قد تواجه تأخير في تحميل البيانات.");
    }
  }
};

export const initializeConnectionMonitoring = () => {
  let isMonitoring = false;

  const startMonitoring = async () => {
    if (isMonitoring) return;
    isMonitoring = true;

    // Initial connection test
    await diagnoseNetworkIssue();

    // Monitor connection every 30 seconds if there are issues
    const monitorInterval = setInterval(async () => {
      const result = await testFirebaseConnection();

      if (!result.isConnected) {
        console.warn("Connection issue detected, running diagnostics...");
        await diagnoseNetworkIssue();
      }
    }, 30000);

    // Stop monitoring when the page is about to unload
    window.addEventListener("beforeunload", () => {
      clearInterval(monitorInterval);
    });
  };

  // Start monitoring when the page loads
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startMonitoring);
  } else {
    startMonitoring();
  }
};

export const handleConnectionError = (error: any) => {
  console.error("Connection error detected:", error);

  // If it's a fetch error, run diagnostics
  if (
    error?.message?.includes("Failed to fetch") ||
    error?.toString()?.includes("Failed to fetch")
  ) {
    diagnoseNetworkIssue();
  }
};
