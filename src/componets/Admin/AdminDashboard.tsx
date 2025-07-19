import { useState } from "react";
import logo from "../../assets/logo.png";
import { motion } from "framer-motion";

import Dashboard from "./Dashboard";
import BottomNav from "../ui/BottomNav";
import Users from "./Users";
import TicketsAndServices from "./TicketsAndServices";
import Settings from "./Settings";
import AdminLogs from "../Logs/AdminLogs";
import UserProfile from "../Profile";
import { useAuth } from "../../context/AuthContext";

const AdminDashboard = () => {
  const [currentTab, setCurrentTab] = useState<
    "dashboard" | "users" | "tickets-services" | "settings" | "logs" | "profile"
  >("dashboard");
  const renderContent = () => {
    switch (currentTab) {
      case "dashboard":
        return <Dashboard />;
      case "users":
        return <Users />;
      case "tickets-services":
        return <TicketsAndServices />;
      case "settings":
        return <Settings />;
      case "logs":
        return <AdminLogs />;
      case "profile":
        return <UserProfile />;
      default:
        return null;
    }
  };

  const { user } = useAuth();
  return (
    <>
      <div dir="rtl" className="pb-20">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between p-4  max-w-md mx-auto"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-row items-center">
            <img
              src={user?.photoURL}
              alt="avatar"
              className="rounded-full w-10 h-10"
            />
            <div className="mr-3">
              <p className="text-sm text-gray-500">مرحبا، {user?.name}</p>
              <h1 className="text-xl text-blue-400 font-bold">وكالة الإحسان</h1>
            </div>
          </div>
          <div className="text-2xl text-blue-500 font-bold cursor-pointer">
            <img className="h-18 w-18" src={logo}></img>
          </div>
        </motion.div>
        {renderContent()}
      </div>{" "}
      {/* Stats */}
      <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
    </>
  );
};

export default AdminDashboard;
