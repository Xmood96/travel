import { useState } from "react";
import { Loader2, Trash2, Check, Edit } from "lucide-react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { useAppData } from "../../api/useAppData";
import { useUsersWithStats } from "../../api/getusers";
import { Modal } from "../ui/modal";
import { motion } from "framer-motion";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../api/Firebase";
import { useCurrencies, useCurrencyUtils } from "../../api/useCurrency";
import { convertToUSD } from "../../api/currencyService";
import { logTicketUpdated, logTicketDeleted } from "../../api/loggingService";
import { useAuth } from "../../context/AuthContext";

const ITEMS_PER_PAGE = 10;

export default function TicketsAdmin() {
  const { ticketsQuery, deleteTicket } = useAppData();
  const usersQuery = useUsersWithStats();

  const [userFilter, setUserFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [editingTicket, setEditingTicket] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    partialPayment: "",
    isPaid: false,
    amountDue: "",
    currency: "USD",
  });

  const { data: currencies } = useCurrencies();
  const { getCurrencyByCode, getFormattedBalance } = useCurrencyUtils();
  const { user } = useAuth();

  const tickets = ticketsQuery.data || [];
  const isLoading = ticketsQuery.isLoading;
  const users = usersQuery.data || [];

  const getDateObject = (
    date: string | { seconds: number } | Date | undefined
  ): Date => {
    if (!date) return new Date();
    if (typeof date === "string") return new Date(date);
    if (date instanceof Date) return date;
    if ("seconds" in date) return new Date(date.seconds * 1000);
    return new Date(); // fallback
  };

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.name ?? "مستخدم غير معروف";
  };
  const filteredTickets = tickets.filter((t) => {
    const createdAtDate = getDateObject(t.createdAt);
    const byUser = userFilter ? t.createdByUserId === userFilter : true;
    const byDate = dateFilter
      ? format(createdAtDate, "yyyy-MM-dd") === dateFilter
      : true;
    return byUser && byDate;
  });

  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  const currentTickets = filteredTickets.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const confirmDelete = (id: string) => {
    setTicketToDelete(id);
  };

  const handleDelete = async () => {
    if (!ticketToDelete || !user) return;

    // Find the ticket to get its details for logging
    const ticketToDeleteObj = tickets.find((t) => t.id === ticketToDelete);
    const agentName =
      users.find((u) => u.id === ticketToDeleteObj?.createdByUserId)?.name ||
      "غير معروف";

    deleteTicket.mutate(ticketToDelete, {
      onSuccess: async () => {
        // Log the deletion
        if (ticketToDeleteObj) {
          await logTicketDeleted(
            ticketToDeleteObj.id,
            ticketToDeleteObj.ticketNumber,
            user.id,
            user.name,
            agentName
          );
        }

        toast.success("تم حذف التذكرة بنجاح");
        setTicketToDelete(null);
      },
      onError: () => {
        toast.error("فشل في حذف التذكرة");
        setTicketToDelete(null);
      },
    });
  };

  const handleEditTicket = (ticket: any) => {
    setEditingTicket(ticket);
    setEditForm({
      partialPayment: ticket.partialPayment?.toString() || "",
      isPaid: ticket.isPaid || false,
      amountDue: ticket.amountDue?.toString() || "",
      currency: "USD", // Default to USD for admin editing
    });
  };

  const handleUpdateTicket = async () => {
    if (!editingTicket || !user) return;

    try {
      const currency = getCurrencyByCode(editForm.currency);
      if (!currency) {
        toast.error("ير��ى اختيار عملة صحيحة");
        return;
      }

      // Convert amounts to USD for storage
      const partialPaymentUSD = editForm.partialPayment
        ? convertToUSD(Number(editForm.partialPayment), currency)
        : 0;
      const amountDueUSD = editForm.amountDue
        ? convertToUSD(Number(editForm.amountDue), currency)
        : editingTicket.amountDue;

      // Track changes for logging
      const changes: { field: string; oldValue: any; newValue: any }[] = [];

      if (partialPaymentUSD !== (editingTicket.partialPayment || 0)) {
        changes.push({
          field: "partialPayment",
          oldValue: editingTicket.partialPayment || 0,
          newValue: partialPaymentUSD,
        });
      }

      if (editForm.isPaid !== editingTicket.isPaid) {
        changes.push({
          field: "isPaid",
          oldValue: editingTicket.isPaid,
          newValue: editForm.isPaid,
        });
      }

      if (amountDueUSD !== editingTicket.amountDue) {
        changes.push({
          field: "amountDue",
          oldValue: editingTicket.amountDue,
          newValue: amountDueUSD,
        });
      }

      const ticketRef = doc(db, "tickets", editingTicket.id);
      await updateDoc(ticketRef, {
        partialPayment: partialPaymentUSD,
        isPaid: editForm.isPaid,
        amountDue: amountDueUSD,
      });

      // Log the update if there were changes
      if (changes.length > 0) {
        await logTicketUpdated(
          editingTicket.id,
          editingTicket.ticketNumber,
          user.id,
          user.name,
          changes
        );
      }

      toast.success("تم تحديث التذكرة بنجاح");
      setEditingTicket(null);
      ticketsQuery.refetch();
    } catch (error) {
      console.error("خطأ في تحديث التذكرة:", error);
      toast.error("فشل في تحديث التذكرة");
    }
  };

  if (isLoading || usersQuery.isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="animate-spin w-6 h-6 text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 text-black space-y-4 max-w-screen mx-auto text-right"
    >
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">📋</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  إدارة التذاكر
                </h2>
                <p className="text-xs text-gray-500 hidden sm:block">
                  عرض وتحكم في تذاكر المستخدمين
                </p>
              </div>
            </div>

            {/* يمكنك وضع زر أو عناصر أخرى هنا عند الحاجة */}
          </div>
        </div>
      </div>

      {/* الفلاتر */}
      <div className="grid grid-cols-2 gap-4 items-center">
        <select
          className="select bg-slate-100 select-bordered w-full"
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
        >
          <option value="">كل المستخدمين</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name || user.email || user.id}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="appearance-none relative pl-10 pr-2 py-2 rounded-lg bg-slate-100  w-full cursor-pointer focus:outline-none focus:ring focus:ring-blue-300"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg fill='blue' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM5 20V9h14v11H5z'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "10px center",
            backgroundSize: "20px 20px",
          }}
        />

        {/* <button
          onClick={() => setPage(1)}
          className="btn btn-primary w-full md:w-auto"
        >
          تطبيق الفلاتر
        </button> */}
      </div>

      {/* التذاكر */}
      <div className="space-y-3">
        {currentTickets.length === 0 ? (
          <p className="text-center text-sm text-gray-500">
            لا توجد تذاكر تطابق الفلاتر.
          </p>
        ) : (
          currentTickets.map((ticket) => {
            const createdAtDate = getDateObject(ticket.createdAt);
            return (
              <div
                key={ticket.id}
                className="bg-slate-100 rounded-xl shadow-sm p-3 flex justify-between items-center"
              >
                <div className="text-right">
                  <p className="font-bold text-sm text-gray-800">
                    تذكرة #{ticket.ticketNumber}
                  </p>
                  <p className="text-xs text-gray-500">
                    المستخدم:{" "}
                    <span className="text-blue-500">
                      {getUserName(ticket.createdByUserId)}
                    </span>
                  </p>
                  <div className="flex gap-3 text-sm mt-1 text-gray-600">
                    <p>
                      السعر: {getFormattedBalance(ticket.paidAmount, "USD")}{" "}
                    </p>
                    <p>
                      المستحق: {getFormattedBalance(ticket.amountDue, "USD")}{" "}
                    </p>
                    {(ticket.partialPayment || 0) > 0 && !ticket.isPaid && (
                      <p className="text-green-600">
                        دفع جزئي:{" "}
                        {getFormattedBalance(ticket.partialPayment || 0, "USD")}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    التاريخ:{" "}
                    {format(createdAtDate, "yyyy-MM-dd", {
                      locale: arSA,
                    })}
                  </p>
                </div>

                <div className="text-left space-y-1 grid text-sm">
                  {ticket.isPaid ? (
                    <span className="text-green-600 font-semibold flex items-center gap-1">
                      <Check className="w-4 h-4" /> مدفوعة
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold">
                      متبقي{" "}
                      {getFormattedBalance(
                        ticket.amountDue - (ticket.partialPayment || 0),
                        "USD"
                      )}
                    </span>
                  )}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditTicket(ticket)}
                      className="btn btn-sm btn-info text-white"
                    >
                      <Edit className="w-4 h-4 mr-1" /> تعديل
                    </button>
                    <button
                      onClick={() => confirmDelete(ticket.id)}
                      className="btn btn-sm btn-error text-white"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> حذف
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* الترق��م */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2 flex-wrap">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`btn btn-sm ${
                page === i + 1 ? "btn-primary" : "btn-outline"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* مودال الحذف */}
      <Modal
        isOpen={!!ticketToDelete}
        onClose={() => setTicketToDelete(null)}
        title="تأكيد الحذف"
      >
        <p className="text-sm text-gray-700">
          هل أنت متأكد أنك تريد حذف هذه التذكرة؟ هذا الإجراء لا يمكن التراجع
          عنه.
        </p>
        <div className="mt-4 flex gap-3 justify-end">
          <button
            onClick={handleDelete}
            className="btn btn-sm btn-error text-white"
          >
            نعم، حذف
          </button>
          <button
            onClick={() => setTicketToDelete(null)}
            className="btn btn-sm btn-ghost"
          >
            إلغاء
          </button>
        </div>
      </Modal>

      {/* م��دال تعديل التذكرة */}
      <Modal
        isOpen={!!editingTicket}
        onClose={() => setEditingTicket(null)}
        title="تعديل التذكرة"
      >
        {editingTicket && (
          <div className="space-y-4">
            <div className="text-sm text-gray-700 mb-4">
              <p>تذكرة #{editingTicket.ticketNumber}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">العملة</label>
                <select
                  className="select bg-slate-100 select-bordered w-full"
                  value={editForm.currency}
                  onChange={(e) =>
                    setEditForm({ ...editForm, currency: e.target.value })
                  }
                >
                  {currencies?.map((currency) => (
                    <option key={currency.id} value={currency.code}>
                      {currency.name} ({currency.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  ال��بلغ المستحق
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input bg-slate-100 input-bordered w-full"
                  value={
                    editForm.amountDue === ""
                      ? ""
                      : Number(editForm.amountDue).toLocaleString("en-US")
                  }
                  onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, "");
                    if (/^\d*$/.test(raw)) {
                      setEditForm({ ...editForm, amountDue: raw });
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  الدفع الجزئي
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input bg-slate-100 input-bordered w-full"
                  value={
                    editForm.partialPayment === ""
                      ? ""
                      : Number(editForm.partialPayment).toLocaleString("en-US")
                  }
                  onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, "");
                    if (/^\d*$/.test(raw)) {
                      const amountDue = Number(editForm.amountDue);
                      if (Number(raw) > amountDue && amountDue > 0) {
                        toast.warn(
                          "الدفع الجزئي لا يمكن أن يتجاوز المبلغ المستحق"
                        );
                        return;
                      }
                      setEditForm({ ...editForm, partialPayment: raw });
                    }
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={editForm.isPaid}
                  onChange={(e) =>
                    setEditForm({ ...editForm, isPaid: e.target.checked })
                  }
                />
                <label className="text-sm">مدفوعة بالكامل</label>
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={handleUpdateTicket}
                className="btn btn-sm btn-primary text-white"
              >
                حفظ التغييرات
              </button>
              <button
                onClick={() => setEditingTicket(null)}
                className="btn btn-sm btn-ghost"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
