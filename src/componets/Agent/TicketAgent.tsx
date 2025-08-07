// ✅ Refactored TicketHistory with logical corrections & filtering & accurate currency behavior
import { useState, useEffect, useMemo } from "react";
import { Loader2, Edit } from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import type { Ticket } from "../../types";
import { useUserTickets } from "../../api/ticketbuid";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../api/Firebase";
import { Modal } from "../ui/modal";
import { useCurrencies, useCurrencyUtils } from "../../api/useCurrency";
import { convertFromUSD, convertToUSD } from "../../api/currencyService";
import { useAuth } from "../../context/AuthContext";
import { logTicketUpdated } from "../../api/loggingService";

const ITEMS_PER_PAGE = 5;

type FilterOption = "all" | "paid" | "unpaid";

type SortOption = "newest" | "oldest";

export default function TicketHistory({ userId }: { userId?: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    data: tickets,
    isLoading,
    isError,
    refetch,
  } = useUserTickets(userId || "");

  const [page, setPage] = useState(1);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [editForm, setEditForm] = useState({
    partialPayment: "",
    isPaid: false,
    amountDue: "",
    currency: "USD",
  });
  const { data: currencies } = useCurrencies();
  const { getCurrencyByCode, getFormattedBalance } = useCurrencyUtils();
  const userCurrency = user?.preferredCurrency || "USD";

  const [filter, setFilter] = useState<FilterOption>("all");
  const [sort, setSort] = useState<SortOption>("newest");

  // Move ALL hooks before any conditional returns to follow Rules of Hooks
  const filteredTickets = useMemo(() => {
    let list = [...(tickets || [])];
    if (filter === "paid") list = list.filter((t) => t.isPaid);
    else if (filter === "unpaid") list = list.filter((t) => !t.isPaid);

    if (sort === "newest")
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    else
      list.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

    return list;
  }, [tickets, filter, sort]);

  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  const currentTickets = filteredTickets.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    if (isError) toast.error(t("ticketLoadError"));
  }, [isError, t]);

  // Conditional returns AFTER all hooks
  if (!userId) {
    return (
      <div className="text-center text-gray-500">{t("userNotSpecified")}</div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="animate-spin w-6 h-6 text-primary" />
      </div>
    );
  }

  const markTicketAsPaid = async (ticketId: string) => {
    try {
      const ticket = tickets?.find((t) => t.id === ticketId);
      if (!ticket || !user) return;
      await updateDoc(doc(db, "tickets", ticketId), { isPaid: true });

      await logTicketUpdated(
        ticketId,
        ticket.ticketNumber,
        user.id,
        user.name,
        [{ field: "isPaid", oldValue: false, newValue: true }],
      );

      toast.success(t("ticketUpdated"));
      await refetch();
    } catch (err) {
      console.error(err);
      toast.error(t("ticketUpdateError"));
    }
  };

  const handleEditTicket = (ticket: Ticket) => {
    setEditingTicket(ticket);
    const currency = getCurrencyByCode(userCurrency);
    if (currency) {
      const partial = convertFromUSD(ticket.partialPayment || 0, currency);
      const due = convertFromUSD(ticket.amountDue, currency);
      setEditForm({
        partialPayment: partial > 0 ? partial.toString() : "",
        isPaid: ticket.isPaid || false,
        amountDue: due.toString(),
        currency: userCurrency,
      });
    }
  };

  const handleUpdateTicket = async () => {
    if (!editingTicket || !user) return;

    // Check if ticket is closed and user is not admin
    if (editingTicket.isClosed && user.role !== "admin") {
      toast.error(t("ticketClosed"));
      setEditingTicket(null);
      return;
    }
    try {
      const currency = getCurrencyByCode(editForm.currency);
      if (!currency) return toast.error(t("selectValidCurrency"));

      const partial = convertToUSD(
        Number(editForm.partialPayment || 0),
        currency,
      );
      const due = convertToUSD(
        Number(editForm.amountDue || editingTicket.amountDue),
        currency,
      );

      if (partial > due) {
        return toast.error(t("partialPaymentExceedsAmountDue"));
      }

      const changes = [];
      if (partial !== (editingTicket.partialPayment || 0))
        changes.push({
          field: "partialPayment",
          oldValue: editingTicket.partialPayment || 0,
          newValue: partial,
        });
      if (editForm.isPaid !== editingTicket.isPaid)
        changes.push({
          field: "isPaid",
          oldValue: editingTicket.isPaid,
          newValue: editForm.isPaid,
        });
      if (due !== editingTicket.amountDue)
        changes.push({
          field: "amountDue",
          oldValue: editingTicket.amountDue,
          newValue: due,
        });

      await updateDoc(doc(db, "tickets", editingTicket.id), {
        partialPayment: partial,
        isPaid: editForm.isPaid,
        amountDue: due,
      });

      if (changes.length > 0) {
        await logTicketUpdated(
          editingTicket.id,
          editingTicket.ticketNumber,
          user.id,
          user.name,
          changes,
        );
      }

      toast.success(t("changesSaved"));
      setEditingTicket(null);
      await refetch();
    } catch (err) {
      console.error(err);
      toast.error(t("saveError"));
    }
  };

  return (
    <div className="p-4 text-black space-y-4 max-w-md mx-auto text-right">
      <h2 className="text-lg font-bold mb-4 gap-2">{t("ticketHistory")}</h2>

      {/* فلاتر */}
      <div className="flex  flex-wrap gap-8 mb-3 justify-start ">
        <select
          className="select-accent select select-md select-bordered bg-black/0 w-min"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterOption)}
        >
          <option value="all">{t("allTickets")}</option>
          <option value="paid">{t("paidTickets")}</option>
          <option value="unpaid">{t("unpaidTickets")}</option>
        </select>

        <select
          className="select-accent select select-md select-bordered bg-black/0 w-min"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
        >
          <option value="newest">{t("newest")}</option>
          <option value="oldest">{t("oldest")}</option>
        </select>
      </div>

      {/* قائمة التذاكر */}
      <div className="space-y-4">
        {currentTickets.map((ticket) => (
          <div
            key={ticket.id}
            className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
              <div className="text-right flex-1">
                <p className="text-sm font-bold text-gray-800">
                  {t("ticket")} #{ticket.ticketNumber}
                </p>
                <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
                  <p>
                    {t("price")}:{" "}
                    {getFormattedBalance(ticket.paidAmount, userCurrency)}
                  </p>
                  <p>
                    {t("due")}:{" "}
                    {getFormattedBalance(ticket.amountDue, userCurrency)}
                  </p>
                  {(ticket.partialPayment || 0) > 0 && !ticket.isPaid && (
                    <p className="text-green-600">
                      {t("partial")}:{" "}
                      {getFormattedBalance(
                        ticket.partialPayment || 0,
                        userCurrency,
                      )}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-sm space-y-2 text-right">
                {ticket.isPaid ? (
                  <span className="text-green-600 font-semibold">
                    ✔️ {t("paid")}
                  </span>
                ) : (
                  <span className="text-red-600 font-semibold">
                    🔴 {t("remaining")}{" "}
                    {getFormattedBalance(
                      ticket.amountDue - (ticket.partialPayment || 0),
                      userCurrency,
                    )}
                  </span>
                )}
                <div className="flex flex-wrap gap-4 justify-end my-2">
                  {ticket.isClosed ? (
                    <span className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                      {t("ticketClosed")} - {t("cannotEdit")}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleEditTicket(ticket)}
                      className="btn-accent btn btn-sm bg-green-500 text-white"
                    >
                      <Edit className="w-3 h-3" /> {t("edit")}
                    </button>
                  )}
                  {!ticket.isPaid && (ticket.partialPayment || 0) === 0 && (
                    <button
                      onClick={() => markTicketAsPaid(ticket.id)}
                      className="btn btn-sm bg-blue-500 text-white"
                    >
                      {t("updateAsPaid")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ترقيم الصفحات */}
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

      {/* مودال تعديل التذكرة */}
      <Modal
        isOpen={!!editingTicket}
        onClose={() => setEditingTicket(null)}
        title={t("editTicket")}
      >
        {editingTicket && (
          <div className="space-y-4">
            <div className="text-sm text-gray-700 mb-4">
              <p>{t("ticket")} #{editingTicket.ticketNumber}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t("currencyLabel")}</label>
                <select
                  className="select bg-slate-100 select-bordered w-full"
                  value={editForm.currency}
                  onChange={(e) => {
                    const newCurrency = e.target.value;
                    const newCurrencyObj = getCurrencyByCode(newCurrency);
                    const oldCurrencyObj = getCurrencyByCode(editForm.currency);
                    if (!newCurrencyObj || !oldCurrencyObj) return;

                    const newAmountDue = convertFromUSD(
                      convertToUSD(Number(editForm.amountDue), oldCurrencyObj),
                      newCurrencyObj,
                    );

                    const newPartialPayment = convertFromUSD(
                      convertToUSD(
                        Number(editForm.partialPayment || 0),
                        oldCurrencyObj,
                      ),
                      newCurrencyObj,
                    );

                    setEditForm({
                      ...editForm,
                      currency: newCurrency,
                      amountDue: newAmountDue.toFixed(2),
                      partialPayment:
                        newPartialPayment > 0
                          ? newPartialPayment.toFixed(2)
                          : "",
                    });
                  }}
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
                  {t("amountDue")}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="input bg-slate-100 input-bordered w-full"
                  value={editForm.amountDue}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, "");
                    if (/^\d*\.?\d*$/.test(raw)) {
                      setEditForm({ ...editForm, amountDue: raw });
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("partialPayment")}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="input bg-slate-100 input-bordered w-full"
                  value={editForm.partialPayment}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, "");
                    if (/^\d*\.?\d*$/.test(raw)) {
                      const amountDue = Number(editForm.amountDue);
                      if (Number(raw) > amountDue && amountDue > 0) {
                        toast.warn(
                          t("partialPaymentExceedsAmountDue"),
                        );
                        return;
                      }
                      const newIsPaid =
                        Number(raw) === amountDue && amountDue > 0;
                      setEditForm({
                        ...editForm,
                        partialPayment: newIsPaid ? "0" : raw,
                        isPaid: newIsPaid,
                      });
                    }
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={editForm.isPaid}
                  disabled={
                    Number(editForm.partialPayment || 0) > 0 &&
                    Number(editForm.partialPayment || 0) <
                      Number(editForm.amountDue || 0)
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setEditForm({
                        ...editForm,
                        isPaid: true,
                        partialPayment: "0",
                      });
                    } else {
                      setEditForm({ ...editForm, isPaid: false });
                    }
                  }}
                />
                <label className="text-sm">{t("full")}</label>
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={handleUpdateTicket}
                className="btn btn-sm btn-primary text-white"
              >
                {t("saveChanges")}
              </button>
              <button
                onClick={() => setEditingTicket(null)}
                className="btn btn-sm btn-ghost"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
