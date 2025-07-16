import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Plane, FileText } from "lucide-react";

interface FABAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
}

interface FloatingActionButtonProps {
  actions: FABAction[];
}

export const FloatingActionButton = ({
  actions,
}: FloatingActionButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleFAB = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed top-20 left-4 z-50 md:hidden">
      {/* Action buttons */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="flex flex-col space-y-3 mb-3"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            {actions.map((action, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.5 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className={`${action.color} text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-200`}
              >
                {action.icon}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.button
        onClick={toggleFAB}
        className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-200"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </motion.button>

      {/* Action labels */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute bottom-0 right-16 flex flex-col space-y-3 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {actions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-800 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg mb-2"
              >
                {action.label}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const getDefaultFABActions = (
  onAddTicket: () => void,
  onAddAgent: () => void,
): FABAction[] => [
  {
    icon: <FileText className="w-5 h-5" />,
    label: "تذكرة جديدة",
    onClick: onAddTicket,
    color: "bg-blue-500 hover:bg-blue-600",
  },
  {
    icon: <Plane className="w-5 h-5" />,
    label: "وكيل جديد",
    onClick: onAddAgent,
    color: "bg-purple-500 hover:bg-purple-600",
  },
];
