import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Ticket,
  Settings,
  BarChart3,
  Bell,
  Menu,
  X,
  ChevronRight,
  Briefcase,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Import the modern interfaces
import ModernUsers from "./ModernUsers";
import ModernTickets from "./ModernTickets";
import ServiceTickets from "../../componets/Admin/ServiceTickets";
import SettingsComponent from "../../componets/Admin/Settings";
import Dashboard from "../../componets/Admin/Dashboard"; // Keep the existing dashboard for stats

// Modern UI Components
import { ModernCard } from "../ui/modern/Card";
import { IconButton } from "../ui/modern/Button";

type TabType = "dashboard" | "users" | "tickets" | "services" | "settings";

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  badge?: number;
}

export default function ModernAdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabs: Tab[] = [
    {
      id: "dashboard",
      label: "لوحة التحكم",
      icon: <LayoutDashboard size={20} />,
      component: <Dashboard />,
    },
    {
      id: "users",
      label: "إدارة المستخدمين",
      icon: <Users size={20} />,
      component: <ModernUsers />,
    },
    {
      id: "tickets",
      label: "إدارة التذاكر",
      icon: <Ticket size={20} />,
      component: <ModernTickets />,
    },
    {
      id: "services",
      label: "إدارة الخدمات",
      icon: <Briefcase size={20} />,
      component: <ServiceTickets />,
    },
    {
      id: "settings",
      label: "الإعدادات",
      icon: <Settings size={20} />,
      component: <SettingsComponent />,
    },
  ];

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconButton
            icon={<Menu size={20} />}
            variant="ghost"
            onClick={() => setSidebarOpen(true)}
          />
          <h1 className="text-lg font-semibold text-gray-900">
            {activeTabData?.label}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <IconButton icon={<Bell size={20} />} variant="ghost" />
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || window.innerWidth >= 1024) && (
            <>
              {/* Mobile Overlay */}
              {sidebarOpen && (
                <motion.div
                  className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSidebarOpen(false)}
                />
              )}

              {/* Sidebar Content */}
              <motion.div
                className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 lg:relative lg:z-auto"
                initial={{ x: -256 }}
                animate={{ x: 0 }}
                exit={{ x: -256 }}
                transition={{ type: "spring", damping: 25 }}
              >
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        لوحة الإدارة
                      </h2>
                      <p className="text-xs text-gray-500">
                        نظام إدارة الوكالة
                      </p>
                    </div>
                  </div>
                  <IconButton
                    icon={<X size={16} />}
                    variant="ghost"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                  />
                </div>

                {/* Navigation */}
                <nav className="p-4">
                  <div className="space-y-2">
                    {tabs.map((tab) => (
                      <motion.button
                        key={tab.id}
                        className={`
                          w-full flex items-center justify-between px-4 py-3 rounded-xl text-right transition-all duration-200
                          ${
                            activeTab === tab.id
                              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                              : "text-gray-700 hover:bg-gray-100"
                          }
                        `}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setSidebarOpen(false);
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`
                            ${activeTab === tab.id ? "text-white" : "text-gray-500"}
                          `}
                          >
                            {tab.icon}
                          </div>
                          <span className="font-medium">{tab.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {tab.badge && (
                            <span
                              className={`
                              px-2 py-1 rounded-full text-xs font-medium
                              ${
                                activeTab === tab.id
                                  ? "bg-white/20 text-white"
                                  : "bg-blue-100 text-blue-600"
                              }
                            `}
                            >
                              {tab.badge}
                            </span>
                          )}
                          <ChevronRight
                            size={16}
                            className={`
                              ${activeTab === tab.id ? "text-white" : "text-gray-400"}
                            `}
                          />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </nav>

                {/* Sidebar Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          ث
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          وكالة السفر
                        </p>
                        <p className="text-xs text-gray-500">نسخة 2.0.0</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 min-h-screen">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {activeTabData?.component}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
