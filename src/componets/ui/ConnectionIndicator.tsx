import { useState, useEffect } from "react";
import { Wifi, WifiOff, AlertCircle } from "lucide-react";
import { getConnectionStatus } from "../../api/firebaseConnection";
import { useTranslation } from "react-i18next";

export const ConnectionIndicator = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState(getConnectionStatus());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      const newStatus = getConnectionStatus();
      setStatus(newStatus);
      
      // Show indicator if there are connection issues
      setIsVisible(!newStatus.isOnline || newStatus.connectionAttempts > 0);
    };

    // Check immediately
    checkConnection();

    // Check every 10 seconds
    const interval = setInterval(checkConnection, 10000);

    // Listen for online/offline events
    const handleOnline = () => {
      setTimeout(checkConnection, 1000); // Small delay to let Firebase reconnect
    };

    const handleOffline = () => {
      checkConnection();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isVisible) return null;

  const getStatusColor = () => {
    if (!navigator.onLine) return "bg-gray-500";
    if (!status.isOnline) return "bg-red-500";
    if (status.connectionAttempts > 0) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusIcon = () => {
    if (!navigator.onLine) return <WifiOff className="w-4 h-4" />;
    if (!status.isOnline) return <AlertCircle className="w-4 h-4" />;
    return <Wifi className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (!navigator.onLine) return t("networkOffline", "No Internet");
    if (!status.isOnline && status.connectionAttempts > 0) {
      return t("connectionRetrying", `Reconnecting... (${status.connectionAttempts}/${status.maxAttempts})`);
    }
    if (!status.isOnline) return t("connectionFailed", "Connection Failed");
    return t("connected", "Connected");
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm font-medium shadow-lg
          ${getStatusColor()}
          transition-all duration-300 ease-in-out
        `}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
        
        {status.connectionAttempts > 0 && (
          <div className="w-4 h-4 relative">
            <div className="absolute inset-0 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionIndicator;
