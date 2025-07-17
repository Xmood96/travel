import { useState } from "react";
import logo from "../assets/logo.png";
import { motion } from "framer-motion";

import { useAuth } from "../context/AuthContext";

import UserProfile from "./Profile";
import BottomNav2 from "./ui/bonavp";
import DashAgent from "./Agent/DashAgent";
import TicketList from "./Agent/TicketAgent";
import UserServiceTickets from "./Agent/UserServiceTickets";

const AgentDashboard = () => {
  const { user: authUser } = useAuth();
  const [currentTab, setCurrentTab] = useState<
    "dashboard" | "tickets" | "profile"
  >("dashboard");
  const renderContent = () => {
    switch (currentTab) {
      case "dashboard":
        return <DashAgent />;

      case "tickets":
        return <TicketList userId={authUser?.id} />;
      case "profile":
        return <UserProfile />;
      default:
        return null;
    }
  };
  const { user } = useAuth();
  return (
    <>
      <div dir="rtl" className="pb-20 text-black">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between p-4 space-y-2 max-w-md mx-auto"
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
              <h1 className="text-xl font-bold text-blue-400">وكالة الإحسان</h1>
            </div>
          </div>
          <div className="text-2xl text-blue-500 font-bold cursor-pointer">
            <img className="h-18 w-18 text-blue-300" src={logo}></img>
          </div>
        </motion.div>
        {renderContent()}
      </div>{" "}
      {/* Stats */}
      <BottomNav2 currentTab={currentTab} setCurrentTab={setCurrentTab} />
    </>
  );
};

export default AgentDashboard;
