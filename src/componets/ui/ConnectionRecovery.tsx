import { useState } from "react";
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { testFirebaseConnection } from "../../api/firebaseConnectionDiagnostic";

export const ConnectionRecovery = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isTesting, setIsTesting] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<any>(null);

  // Monitor online status
  window.addEventListener("online", () => setIsOnline(true));
  window.addEventListener("offline", () => setIsOnline(false));

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const result = await testFirebaseConnection();
      setLastTestResult(result);

      if (result.isConnected) {
        toast.success(`✅ الاتصال يعمل بشكل طبيعي (${result.latency}ms)`);
      } else {
        toast.error("❌ فشل اختبار الاتصال");
      }
    } catch (error) {
      toast.error("❌ خطأ في اختبار الاتصال");
      console.error("Connection test error:", error);
    } finally {
      setIsTesting(false);
    }
  };

  const handleReload = () => {
    if (confirm("هل أنت متأكد من إعادة تحميل الصفحة؟")) {
      window.location.reload();
    }
  };

  if (isOnline && lastTestResult?.isConnected !== false) {
    return null; // Don't show if everything is working
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white border border-red-200 rounded-lg shadow-lg p-4 max-w-md"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {isOnline ? (
            <WifiOff className="w-6 h-6 text-red-500" />
          ) : (
            <WifiOff className="w-6 h-6 text-gray-500" />
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">
            {!isOnline
              ? "لا يوجد اتصال بالإنترنت"
              : "مشكلة في الاتصال بقاعدة البيانات"}
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            {!isOnline
              ? "تحقق من اتصال الإنترنت وحاول مرة أخرى"
              : "يرجى اختبار الاتصال أو إعادة تحميل الصفحة"}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleTestConnection}
          disabled={isTesting || !isOnline}
          className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3 h-3 ${isTesting ? "animate-spin" : ""}`} />
          {isTesting ? "جاري الاختبار..." : "اختبار الاتصال"}
        </button>

        <button
          onClick={handleReload}
          className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          <RefreshCw className="w-3 h-3" />
          إعادة تحميل
        </button>
      </div>

      {lastTestResult && (
        <div className="mt-2 text-xs text-gray-600">
          آخر اختبار:{" "}
          {lastTestResult.isConnected
            ? `✅ نجح (${lastTestResult.latency}ms)`
            : `❌ فشل${lastTestResult.error ? `: ${lastTestResult.error.slice(0, 50)}...` : ""}`}
        </div>
      )}
    </motion.div>
  );
};

export default ConnectionRecovery;
