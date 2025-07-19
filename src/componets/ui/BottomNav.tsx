import {
  Home,
  Users,
  ClipboardList,
  Settings,
  Activity,
  User,
} from "lucide-react";
import { useTranslation } from "react-i18next";

type Tab =
  | "dashboard"
  | "users"
  | "tickets-services"
  | "settings"
  | "logs"
  | "profile";

interface BottomNavProps {
  currentTab: Tab;
  setCurrentTab: (tab: Tab) => void;
}

const BottomNav = ({ currentTab, setCurrentTab }: BottomNavProps) => {
  const { t } = useTranslation();

  const navItems = [
    {
      label: t("dashboard"),
      icon: <Home className="w-5 h-5" />,
      tab: "dashboard",
    },
    {
      label: t("users"),
      icon: <Users className="w-5 h-5" />,
      tab: "users",
    },
    {
      label: t("tickets"),
      icon: <ClipboardList className="w-5 h-5" />,
      tab: "tickets-services",
    },
    {
      label: t("settings"),
      icon: <Settings className="w-5 h-5" />,
      tab: "settings",
    },
    {
      label: t("logs"),
      icon: <Activity className="w-5 h-5" />,
      tab: "logs",
    },
    {
      label: t("profile"),
      icon: <User className="w-5 h-5" />,
      tab: "profile",
    },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-white rounded-xl z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item, index) => {
          const isActive = currentTab === item.tab;

          return (
            <button
              key={index}
              onClick={() => setCurrentTab(item.tab as Tab)}
              className={`flex flex-col items-center text-xs ${
                isActive ? "text-blue-600" : "text-gray-500"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
