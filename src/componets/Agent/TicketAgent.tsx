import { useState } from "react";

import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import type { Ticket } from "../../types";
import { useUserTickets } from "../../api/ticketbuid";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../api/Firebase";

const ITEMS_PER_PAGE = 5;

export default function TicketHistory({
  userId,
}: {
  userId: string | undefined;
}) {
  const {
    data: tickets,
    isLoading,
    isError,
    refetch,
  } = useUserTickets(userId || "");
  const [page, setPage] = useState(1);

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

  const totalPages = Math.ceil((tickets?.length || 0) / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const sortedTickets = [...(tickets || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const currentTickets =
    sortedTickets?.slice(start, start + ITEMS_PER_PAGE) || [];
  const markTicketAsPaid = async (ticketId: string) => {
    const ref = doc(db, "tickets", ticketId);
    await updateDoc(ref, {
      isPaid: true,
    });
    toast.success("تم تحديث التذكرة كمدفوعة ✅");
    await refetch(); // إعادة جلب البيانات
  };

  return (
    <div className="p-4 text-black space-y-4 max-w-md mx-auto text-right">
      <h2 className="text-lg font-bold text-right mb-4">سجل التذاكر</h2>

      <div className="space-y-4">
        {currentTickets.map((ticket: Ticket) => (
          <div
            key={ticket.id}
            className="bg-slate-100 rounded-xl shadow-sm p-3 flex justify-between items-center"
          >
            <div className="text-right">
              <p className="text-sm text-gray-700 font-bold">
                تذكرة #{ticket.ticketNumber}
              </p>
              <div className="flex gap-4 mt-1 text-sm text-gray-500">
                <p>سعر القطع: {ticket.paidAmount} ريال</p>
                <p>المستحق: {ticket.amountDue} ريال</p>
              </div>
            </div>

            <div className="text-sm text-left grid grid-rows-2">
              {ticket.isPaid ? (
                <span className="text-green-600 translate-y-1/2 font-semibold">
                  ✔️ تم الدفع
                </span>
              ) : (
                <>
                  <span className="text-red-600 font-semibold">
                    🔴 متبقي {ticket.amountDue} ريال
                  </span>
                  <button
                    onClick={async () => {
                      await markTicketAsPaid(ticket.id);
                      // إعادة تحميل التذاكر بعد التحديث
                    }}
                    className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  >
                    تحديث كمدفوع
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
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
    </div>
  );
}
