import { AlertCircle, Loader2, Eye } from "lucide-react";
import { IoTicket } from "react-icons/io5";
import { Card } from "../ui/card";
import AddTicketForm from "./Addtick";
import { useAuth } from "../../context/AuthContext";
import { useUserTickets } from "../../api/ticketbuid";
import { toast } from "react-toastify";
import { useCurrencyUtils } from "../../api/useCurrency";
import { useState } from "react";
import {
  getLogsByUser,
  formatLogTimestamp,
  getActionIcon,
} from "../../api/loggingService";
import type { LogEntry } from "../../types";
import { Modal } from "../ui/modal";

const DashAgent = () => {
  const { user } = useAuth();
  const { getFormattedBalance } = useCurrencyUtils();
  const { data: tickets, isLoading, isError } = useUserTickets(user?.id || "");
  const [isBalanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceLogs, setBalanceLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  if (isError) {
    toast.error("حدث خطأ أثناء تحميل التذاكر");
    return <div className="text-red-500 p-4">خطأ في تحميل البيانات</div>;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="animate-spin w-6 h-6 text-primary" />
      </div>
    );
  }
  const unpaidTotal =
    tickets?.reduce((sum, ticket) => {
      if (ticket.isPaid) return sum;

      const partialPayment = (ticket as any).partialPayment || 0;
      const remaining = Number(ticket.amountDue) - partialPayment;
      return sum + remaining;
    }, 0) || 0;

  const loadBalanceLogs = async () => {
    if (!user?.id) return;
    setLogsLoading(true);
    try {
      const logs = await getLogsByUser(user.id, 50);
      // Filter for balance-related logs
      const balanceRelatedLogs = logs.filter(
        (log) =>
          log.action.includes("balance") ||
          log.action.includes("debt_paid") ||
          log.targetId === user.id,
      );
      setBalanceLogs(balanceRelatedLogs);
    } catch (error) {
      console.error("Error loading balance logs:", error);
      toast.error("فشل في تحميل سجل الرصيد");
    } finally {
      setLogsLoading(false);
    }
  };

  const openBalanceModal = () => {
    setBalanceModalOpen(true);
    loadBalanceLogs();
  };
  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      <Card className="flex items-center  gap-4 p-4 border-blue-400  border-s-4 ">
        <IoTicket className="w-6 h-6 text-blue-500" />
        <div>
          <p className=" text-slate-800 text-lg">التذاكر </p>
          <h2 className="text-lg font-bold text-blue-400">
            {tickets?.length} تذكره
          </h2>
        </div>
      </Card>
      <Card className="flex items-center  gap-4 p-4 border-red-600  border-s-4 ">
        <AlertCircle className="w-6 h-6 text-red-500" />
        <div>
          <p className=" text-slate-800 text-lg">مبالغ مستحقة </p>
          <h2 className="text-lg font-bold text-red-600">
            {getFormattedBalance(unpaidTotal, user?.preferredCurrency || "USD")}
          </h2>
        </div>
      </Card>
      <Card className="flex items-center justify-between p-4 border-green-600 border-s-4">
        <div className="flex items-center gap-4">
          <AlertCircle className="w-6 h-6 text-green-500" />
          <div>
            <p className="text-slate-800 text-lg">الر��يد</p>
            <h2 className="text-lg font-bold text-green-600">
              {getFormattedBalance(
                (user as any)?.userBalance || 0,
                user?.preferredCurrency || "USD",
              )}
            </h2>
          </div>
        </div>
        <button
          onClick={openBalanceModal}
          className="btn btn-sm btn-outline btn-primary flex items-center gap-2"
          title="عرض تفاصيل الرصيد"
        >
          <Eye className="w-4 h-4" />
          تفاصيل
        </button>
      </Card>
      <AddTicketForm />

      {/* Balance Details Modal */}
      <Modal
        isOpen={isBalanceModalOpen}
        onClose={() => setBalanceModalOpen(false)}
        title="تفاصيل حركات الرصيد"
      >
        <div className="space-y-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">الرصيد الحالي</p>
            <p className="text-lg font-bold text-green-600">
              {getFormattedBalance(
                (user as any)?.userBalance || 0,
                user?.preferredCurrency || "USD",
              )}
            </p>
          </div>

          {logsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin w-6 h-6" />
            </div>
          ) : balanceLogs.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>لا توجد حركات رصيد مسجلة</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <h3 className="font-medium text-gray-800">سجل حركات الرصيد</h3>
              {balanceLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-gray-50 p-3 rounded-lg border-r-4 border-blue-400"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-lg">{getActionIcon(log.action)}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {log.description}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">
                          {formatLogTimestamp(log.timestamp)}
                        </span>
                        <span className="text-xs text-blue-600">
                          بواسطة: {log.performedByName}
                        </span>
                      </div>

                      {/* Show amount changes if available */}
                      {(log.oldValue !== undefined ||
                        log.newValue !== undefined) && (
                        <div className="mt-2 text-xs bg-white p-2 rounded">
                          {log.oldValue !== undefined && (
                            <div className="text-red-600">
                              الرصيد السابق:{" "}
                              {typeof log.oldValue === "number"
                                ? log.oldValue.toLocaleString()
                                : log.oldValue}
                            </div>
                          )}
                          {log.newValue !== undefined && (
                            <div className="text-green-600">
                              الرصيد الجديد:{" "}
                              {typeof log.newValue === "number"
                                ? log.newValue.toLocaleString()
                                : log.newValue}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default DashAgent;
