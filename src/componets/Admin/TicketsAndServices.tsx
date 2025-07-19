import { useState } from "react";
import { motion } from "framer-motion";
import { Square, Briefcase } from "lucide-react";
import Tickets from "./Tickets";
import ServiceTickets from "./ServiceTickets";

const TicketsAndServices = () => {
  const [activeTab, setActiveTab] = useState<"tickets" | "services">("tickets");

  return (
    <div className="space-y-4">
      {/* Header with tabs */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">📋</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  إدارة التذاكر والخدمات
                </h2>
                <p className="text-xs text-gray-500 hidden sm:block">
                  عرض وتحكم في جميع التذاكر والخدمات
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex bg-gray-100 rounded-lg p-1 w-fit mx-auto">
          <button
            onClick={() => setActiveTab("tickets")}
            className={`flex items-center justify-center gap-2 py-2 px-6 rounded-md text-sm font-medium transition-colors ${
              activeTab === "tickets"
                ? "bg-blue-500 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Square className="w-4 h-4" />
            التذاكر
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`flex items-center justify-center gap-2 py-2 px-6 rounded-md text-sm font-medium transition-colors ${
              activeTab === "services"
                ? "bg-green-500 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            الخدمات
          </button>
        </div>
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === "tickets" ? <Tickets /> : <ServiceTickets />}
      </motion.div>
    </div>
  );
};

export default TicketsAndServices;
