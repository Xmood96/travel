import { useAuth } from "./context/AuthContext";
import Login from "./componets/Login";
import AdminDashboard from "./componets/Admin/AdminDashboard";
import AgentDashboard from "./componets/AgentDashboard";
import Chat from "./componets/Chat";

function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-center mt-10">جاري التحميل...</div>;

  if (!user) return <Login />;

  if (user.role === "admin") {
    return (
      <>
        <AdminDashboard /> <Chat />
      </>
    );
  }

  if (user.role === "agent") {
    return (
      <>
        <AgentDashboard />
        <Chat />
      </>
    );
  }

  return <div>لا يوجد دور صالح</div>;
}

export default App;
