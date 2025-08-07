import { toast } from "react-toastify";

export interface FirebaseErrorInfo {
  code: string;
  message: string;
  isNetworkError: boolean;
  shouldRetry: boolean;
}

export const parseFirebaseError = (error: any): FirebaseErrorInfo => {
  const errorCode = error?.code || "unknown";
  const errorMessage =
    error?.message || error?.toString() || "حدث خطأ غير معروف";

  // Check for network-related errors
  const networkErrorPatterns = [
    "fetch",
    "Failed to fetch",
    "network",
    "offline",
    "connection",
    "timeout",
    "NETWORK_ERROR",
    "unavailable",
    "TypeError: Failed to fetch",
    "net::",
    "ERR_",
  ];

  const isNetworkError = networkErrorPatterns.some(
    (pattern) =>
      errorMessage.toLowerCase().includes(pattern.toLowerCase()) ||
      errorCode.toLowerCase().includes(pattern.toLowerCase()),
  );

  // Determine if we should retry
  const shouldRetry =
    isNetworkError ||
    errorCode === "unavailable" ||
    errorCode === "deadline-exceeded" ||
    errorCode === "resource-exhausted";

  return {
    code: errorCode,
    message: errorMessage,
    isNetworkError,
    shouldRetry,
  };
};

export const getErrorMessage = (error: FirebaseErrorInfo): string => {
  // Check for specific "Failed to fetch" errors
  if (
    error.message.includes("Failed to fetch") ||
    error.message.includes("TypeError: Failed to fetch")
  ) {
    return "فشل في الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت وإعادة تحميل الصفحة.";
  }

  if (error.isNetworkError) {
    return "مشكلة في الاتصال بالإنترنت. يرجى التحقق من الاتصال والمحاولة مرة أخرى.";
  }

  switch (error.code) {
    case "permission-denied":
      return "ليس لديك صلاحية للوصول إلى هذه البيانات";
    case "unavailable":
      return "الخدمة غير متاحة حالياً. يرجى المحاولة لاحقاً";
    case "deadline-exceeded":
      return "انتهت مهلة الطلب. يرجى المحاولة مرة أخرى";
    case "resource-exhausted":
      return "تم تجاوز حد الاستخدام. يرجى المحاولة لاحقاً";
    case "not-found":
      return "البيانات المطلوبة غير موجودة";
    case "already-exists":
      return "البيانات ��وجودة بالفعل";
    default:
      return "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى";
  }
};

export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
): Promise<T> => {
  let lastError: any;

  // Check if we're offline before starting
  if (!checkOnlineStatus()) {
    throw new Error("No internet connection available");
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const errorInfo = parseFirebaseError(error);

      console.warn(`Attempt ${attempt}/${maxRetries} failed:`, {
        ...errorInfo,
        originalError: error,
        isOnline: checkOnlineStatus(),
      });

      // Special handling for "Failed to fetch" errors
      if (
        errorInfo.message.includes("Failed to fetch") ||
        errorInfo.message.includes("TypeError: Failed to fetch")
      ) {
        console.error("Network fetch error detected:", error);
        // Wait longer for network errors
        if (attempt < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, delay * attempt * 2),
          );
          continue;
        }
      }

      // Don't retry if it's not a retryable error
      if (!errorInfo.shouldRetry) {
        break;
      }

      // Don't wait after the last attempt
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  }

  // If we get here, all retries failed
  const errorInfo = parseFirebaseError(lastError);
  const userMessage = getErrorMessage(errorInfo);

  // Show user-friendly error message
  toast.error(userMessage);

  throw lastError;
};

export const handleFirebaseError = (error: any, context: string = "") => {
  const errorInfo = parseFirebaseError(error);
  const userMessage = getErrorMessage(errorInfo);

  console.error(`Firebase error${context ? ` in ${context}` : ""}:`, {
    code: errorInfo.code,
    message: errorInfo.message,
    isNetworkError: errorInfo.isNetworkError,
    originalError: error,
  });

  toast.error(userMessage);

  return errorInfo;
};

// Check if we're online
export const checkOnlineStatus = (): boolean => {
  return navigator.onLine;
};

// Monitor online status
export const setupOnlineStatusMonitoring = () => {
  const handleOnline = () => {
    toast.success("تم استعادة الاتصال بالإنترنت");
  };

  const handleOffline = () => {
    toast.warning(
      "تم فقدان الاتصال بالإنترنت. سيتم إعادة المحاولة عند استعادة ��لاتصال.",
    );
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
};
