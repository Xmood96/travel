import { useState } from "react";
import logo from "../assets/logo.png";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { useAuth } from "../context/AuthContext";

import UserProfile from "./Profile";
import BottomNav2 from "./ui/bonavp";
import DashAgent from "./Agent/DashAgent";
import TicketList from "./Agent/TicketAgent";
import UserServiceTickets from "./Agent/UserServiceTickets";
import LanguageSwitcher from "./ui/LanguageSwitcher";

const AgentDashboard = () => {
  const { t, i18n } = useTranslation();
  const { user: authUser } = useAuth();
  const { user } = useAuth();
  const isRTL = i18n.language === "ar";

  const [currentTab, setCurrentTab] = useState<
    "dashboard" | "tickets" | "services" | "profile"
  >("dashboard");

  const renderContent = () => {
    switch (currentTab) {
      case "dashboard":
        return <DashAgent />;
      case "tickets":
        return <TicketList userId={authUser?.id} />;
      case "services":
        return <UserServiceTickets />;
      case "profile":
        return <UserProfile />;
      default:
        return null;
    }
  };
  return (
    <>
      <div className="pb-20 text-black">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between p-4 space-y-2 max-w-md mx-auto"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            className={`flex flex-row items-center ${isRTL ? "" : "order-2"}`}
          >
            <img
              src={user?.photoURL}
              alt="avatar"
              className="rounded-full w-10 h-10"
            />
            <div className={`${isRTL ? "mr-3" : "ml-3"}`}>
              <p className="text-sm text-gray-500">
                {t("welcomeMessage", { name: user?.name })}
              </p>
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
