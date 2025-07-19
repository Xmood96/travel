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
      <div className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-green-500/10 border-b border-gray-200/50 sticky top-0 z-40 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">📋</span>
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  إدارة التذاكر والخدمات
                </h2>
                <p className="text-sm text-gray-600 font-medium">
                  عرض وتحكم في جميع التذاكر والخدمات
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
              <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-medium">
                تذاكر
              </span>
              <span className="text-gray-400">+</span>
              <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full font-medium">
                خدمات
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex bg-white/80 backdrop-blur-lg rounded-xl p-1 w-fit mx-auto border border-gray-200/50 shadow-lg">
          <button
            onClick={() => setActiveTab("tickets")}
            className={`flex items-center justify-center gap-3 py-3 px-8 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "tickets"
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transform scale-105"
                : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            }`}
          >
            <Square className="w-5 h-5" />
            <span className="font-semibold">التذاكر</span>
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`flex items-center justify-center gap-3 py-3 px-8 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "services"
                ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md transform scale-105"
                : "text-gray-600 hover:text-green-600 hover:bg-green-50"
            }`}
          >
            <Briefcase className="w-5 h-5" />
            <span className="font-semibold">الخدمات</span>
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
