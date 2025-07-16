import { useAuth } from "./context/AuthContext";
import Login from "./componets/Login";
import AdminDashboard from "./componets/Admin/AdminDashboard";
import AgentDashboard from "./componets/AgentDashboard";
import Chat from "./componets/Chat";
import { useEffect } from "react";
import { setupOnlineStatusMonitoring } from "./api/firebaseErrorHandler";
import { NetworkStatus } from "./componets/ui/NetworkStatus";

function App() {
  const { user, loading } = useAuth();

  // Setup online status monitoring
  useEffect(() => {
    const cleanup = setupOnlineStatusMonitoring();
    return cleanup;
  }, []);

  if (loading) return <div className="text-center mt-10">جاري التحميل...</div>;

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

  return <div>لا يوجد دور صالح</div>;
}

export default App;
