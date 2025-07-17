import { useState, useEffect } from "react";
import { Clock, User, FileText } from "lucide-react";
import { motion } from "framer-motion";
import {
  getTicketLogs,
  formatLogTimestamp,
  getActionIcon,
} from "../../api/loggingService";
import type { TicketLog } from "../../types";

interface TicketLogsProps {
  ticketId: string;
  ticketNumber: string;
}

export default function TicketLogs({
  ticketId,
  ticketNumber,
}: TicketLogsProps) {
  const [logs, setLogs] = useState<TicketLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true);
        const ticketLogs = await getTicketLogs(ticketId);
        setLogs(ticketLogs);
      } catch (err) {
        console.error("Error loading ticket logs:", err);
        setError("فشل في تحميل سجل التذكرة");
      } finally {
        setLoading(false);
      }
    };

    if (ticketId) {
      loadLogs();
    }
  }, [ticketId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-4 text-sm">{error}</div>;
  }

  if (logs.length === 0) {
    return (
      <div className="text-gray-500 text-center py-4 text-sm">
        لا توجد سجلات لهذه التذكرة
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-sm">سجل التذكرة #{ticketNumber}</h3>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {logs.map((log, index) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-50 rounded-lg p-3 border-r-4 border-blue-400"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{getActionIcon(log.action)}</span>
                  <span className="text-sm font-medium text-gray-800">
                    {log.description}
                  </span>
                </div>

                {log.changes && log.changes.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {log.changes.map((change, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-gray-600 bg-white p-2 rounded"
                      >
                        <span className="font-medium">
                          {getFieldName(change.field)}:
                        </span>
                        <span className="text-red-500 mx-1">
                          {formatValue(change.oldValue)}
                        </span>
                        <span className="mx-1">←</span>
                        <span className="text-green-500">
                          {formatValue(change.newValue)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{log.performedByName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatLogTimestamp(log.timestamp)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Helper function to get Arabic field names
function getFieldName(field: string): string {
  const fieldNames: Record<string, string> = {
    amountDue: "المبلغ المستحق",
    partialPayment: "الدفع الجزئي",
    isPaid: "حالة الدفع",
    paidAmount: "المبلغ المدفوع",
    ticketNumber: "رقم التذكرة",
    agentId: "البائع",
  };

  return fieldNames[field] || field;
}

// Helper function to format values for display
function formatValue(value: any): string {
  if (typeof value === "boolean") {
    return value ? "مدفوع" : "غير مدفوع";
  }

  if (typeof value === "number") {
    return value.toLocaleString("en-US");
  }

  if (value === null || value === undefined) {
    return "غير محدد";
  }

  return String(value);
}
