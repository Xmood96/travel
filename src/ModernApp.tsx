import { useAuth } from "./context/AuthContext";
import Login from "./componets/Login";
import ModernAdminDashboard from "./components/Admin/ModernAdminDashboard";
import AgentDashboard from "./componets/AgentDashboard";
import Chat from "./componets/Chat";
import { useEffect } from "react";
import { setupOnlineStatusMonitoring } from "./api/firebaseErrorHandler";
import { NetworkStatus } from "./componets/ui/NetworkStatus";
import { useTranslation } from "react-i18next";

function ModernApp() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  // Setup online status monitoring
  useEffect(() => {
    const cleanup = setupOnlineStatusMonitoring();
    return cleanup;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t("loading")}...
          </h2>
          <p className="text-gray-600">{t("pleaseWaitMoment")}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <NetworkStatus />
        <Login />
      </div>
    );
  }

  if (user.role === "admin") {
    return (
      <>
        <NetworkStatus />
        <ModernAdminDashboard />
        <Chat />
      </>
    );
  }

  if (user.role === "agent") {
    return (
      <>
        <NetworkStatus />
        <AgentDashboard />
        <Chat />
      </>
    );
  }

  // Fallback for unknown roles
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-red-200 max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h3 className="text-xl font-semibold text-red-600 mb-2">
          {t("unknownUserRole")}
        </h3>
        <p className="text-gray-600 mb-4">{t("contactAdminForPermissions")}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          {t("reloadPage")}
        </button>
      </div>
    </div>
  );
}

export default ModernApp;
