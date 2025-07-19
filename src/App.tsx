import { useAuth } from "./context/AuthContext";
import Login from "./componets/Login";
import AdminDashboard from "./componets/Admin/AdminDashboard";
import AgentDashboard from "./componets/AgentDashboard";
import Chat from "./componets/Chat";
import { useEffect } from "react";
import { setupOnlineStatusMonitoring } from "./api/firebaseErrorHandler";
import { NetworkStatus } from "./componets/ui/NetworkStatus";
import { useTranslation } from "react-i18next";

function App() {
  const { user, loading } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // Setup online status monitoring
  useEffect(() => {
    const cleanup = setupOnlineStatusMonitoring();
    return cleanup;
  }, []);

  // Update document direction when language changes
  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [isRTL, i18n.language]);

  if (loading)
    return <div className="text-center mt-10">{t("loading")}...</div>;

  if (!user) return <Login />;

  if (user.role === "admin") {
    return (
      <>
        <NetworkStatus />
        <AdminDashboard />
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

  return (
    <div>
      {t("error")}: {t("invalidRole")}
    </div>
  );
}

export default App;
