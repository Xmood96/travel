import { useState } from "react";
import { Loader2, Trash2, Check } from "lucide-react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { useAppData } from "../../api/useAppData";
import { useUsersWithStats } from "../../api/getusers";
import { Modal } from "../ui/modal";
import { motion } from "framer-motion";

const ITEMS_PER_PAGE = 10;

export default function TicketsAdmin() {
  const { ticketsQuery, deleteTicket } = useAppData();
  const usersQuery = useUsersWithStats();

  const [userFilter, setUserFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);

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

  const handleDelete = () => {
    if (!ticketToDelete) return;
    deleteTicket.mutate(ticketToDelete, {
      onSuccess: () => {
        toast.success("تم حذف التذكرة بنجاح");
        setTicketToDelete(null);
      },
      onError: () => {
        toast.error("فشل في حذف التذكرة");
        setTicketToDelete(null);
      },
    });
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
      className="p-4 text-black space-y-4 max-w-md mx-auto text-right"
    >
      <h2 className="text-xl font-bold mb-2">📋 إدارة التذاكر</h2>

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
                    <p>السعر: {ticket.paidAmount} </p>
                    <p>المستحق: {ticket.amountDue} </p>
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
                      متبقي {ticket.amountDue} ريال
                    </span>
                  )}
                  <button
                    onClick={() => confirmDelete(ticket.id)}
                    className="btn btn-sm btn-error text-white mt-1"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> حذف
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* الترقيم */}
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
    </motion.div>
  );
}
