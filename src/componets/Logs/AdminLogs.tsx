import { useState, useEffect } from "react";
import { Clock, User, Filter, Activity, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import {
  getAdminLogs,
  formatLogTimestamp,
  getActionIcon,
} from "../../api/loggingService";
import type { LogEntry, LogActionType } from "../../types";

export default function AdminLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<LogActionType | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const loadLogs = async () => {
    try {
      setLoading(true);
      const adminLogs = await getAdminLogs(100); // Get last 100 logs
      setLogs(adminLogs);
      setFilteredLogs(adminLogs);
    } catch (err) {
      console.error("Error loading admin logs:", err);
      setError("فشل في تحميل سجل الأنشطة");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Filter logs based on action type and search term
  useEffect(() => {
    let filtered = logs;

    // Filter by action type
    if (filter !== "all") {
      filtered = filtered.filter((log) => log.action === filter);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.description.toLowerCase().includes(searchLower) ||
          log.performedByName.toLowerCase().includes(searchLower),
      );
    }

    setFilteredLogs(filtered);
  }, [logs, filter, searchTerm]);

  const getActionTypeDisplayName = (action: LogActionType): string => {
    const actionNames: Record<LogActionType, string> = {
      ticket_created: "إنشاء تذكرة",
      ticket_updated: "تحديث تذكرة",
      ticket_deleted: "حذف تذكرة",
      ticket_payment_updated: "تحديث دفع تذكرة",
      agent_created: "إضافة بائع",
      agent_updated: "تحديث بائع",
      agent_deleted: "حذف بائع",
      agent_balance_updated: "تحديث رصيد بائع",
      user_created: "إضافة مستخدم",
      user_updated: "تحديث مستخدم",
      user_deleted: "حذف مستخدم",
      user_balance_updated: "تحديث رصيد مستخدم",
      user_debt_paid_from_balance: "دفع دين من رصيد مستخدم",
      currency_created: "إضافة عملة",
      currency_updated: "تحديث عملة",
      currency_deleted: "حذف عملة",
    };

    return actionNames[action] || action;
  };

  const getActionColor = (action: LogActionType): string => {
    if (action.includes("created")) return "border-green-400 bg-green-50";
    if (action.includes("updated")) return "border-blue-400 bg-blue-50";
    if (action.includes("deleted")) return "border-red-400 bg-red-50";
    return "border-gray-400 bg-gray-50";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">
        <p>{error}</p>
        <button
          onClick={loadLogs}
          className="mt-2 text-blue-500 hover:text-blue-700 text-sm"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-4 text-black max-w-screen mx-auto"
    >
      <div className="w-full bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* العنوان والأيقونة */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">سجل الأنشطة</h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  عرض أحدث الأنشطة والعمليات
                </p>
              </div>
            </div>

            {/* زر التحديث */}
            <div className="hidden md:flex">
              <button
                onClick={loadLogs}
                className="flex items-center gap-1 text-sm font-medium bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition"
                title="تحديث السجل"
              >
                <RefreshCw className="w-4 h-4" />
                <span>تحديث</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            className="select bg-slate-100 select-bordered w-full text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value as LogActionType | "all")}
          >
            <option value="all">جميع الأنشطة</option>
            <optgroup label="التذاكر">
              <option value="ticket_created">إنشاء تذكرة</option>
              <option value="ticket_updated">تحديث تذكرة</option>
              <option value="ticket_deleted">حذف تذكرة</option>
            </optgroup>
            <optgroup label="البائعين">
              <option value="agent_created">إضافة بائع</option>
              <option value="agent_updated">تحديث بائع</option>
              <option value="agent_deleted">حذف بائع</option>
              <option value="agent_balance_updated">تحديث رصيد بائع</option>
            </optgroup>
            <optgroup label="المستخدمين">
              <option value="user_created">إضافة مستخدم</option>
              <option value="user_updated">تحديث مستخدم</option>
              <option value="user_deleted">حذف مستخدم</option>
            </optgroup>
            <optgroup label="العملات">
              <option value="currency_created">إضافة عملة</option>
              <option value="currency_updated">تحديث عملة</option>
              <option value="currency_deleted">حذف عملة</option>
            </optgroup>
          </select>
        </div>

        <input
          type="text"
          placeholder="البحث في السجل..."
          className="input bg-slate-100 input-bordered w-full text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        عرض {filteredLogs.length} من أصل {logs.length} نشاط
      </div>

      {/* Logs list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="text-gray-500 text-center py-8 text-sm">
            {searchTerm || filter !== "all"
              ? "لا توجد أنشطة تطابق الفلتر المحدد"
              : "لا توجد أنشطة بعد"}
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-lg p-3 border-r-4 ${getActionColor(
                log.action,
              )}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getActionIcon(log.action)}</span>
                    <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {getActionTypeDisplayName(log.action)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-800 leading-relaxed">
                    {log.description}
                  </p>

                  {/* Show old/new values for updates */}
                  {(log.oldValue !== undefined ||
                    log.newValue !== undefined) && (
                    <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded">
                      {log.oldValue !== undefined && (
                        <div>
                          <span className="font-medium">القيمة السابقة:</span>
                          <span className="text-red-500 mr-1">
                            {formatValue(log.oldValue)}
                          </span>
                        </div>
                      )}
                      {log.newValue !== undefined && (
                        <div>
                          <span className="font-medium">القيمة الجديدة:</span>
                          <span className="text-green-500 mr-1">
                            {formatValue(log.newValue)}
                          </span>
                        </div>
                      )}
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
          ))
        )}
      </div>
    </motion.div>
  );
}

// Helper function to format values for display
function formatValue(value: any): string {
  if (typeof value === "boolean") {
    return value ? "نعم" : "لا";
  }

  if (typeof value === "number") {
    return value.toLocaleString("en-US");
  }

  if (value === null || value === undefined) {
    return "غير محدد";
  }

  return String(value);
}
