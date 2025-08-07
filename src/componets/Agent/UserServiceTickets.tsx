import { useState, useEffect, useMemo } from "react";
import { Loader2, Edit, Briefcase } from "lucide-react";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";
import { getServiceTickets } from "../../api/serviceService";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../api/Firebase";
import { Modal } from "../ui/modal";
import { useCurrencies, useCurrencyUtils } from "../../api/useCurrency";
import { convertFromUSD, convertToUSD } from "../../api/currencyService";
import { useAuth } from "../../context/AuthContext";
import { logServiceTicketUpdated } from "../../api/loggingService";
import { useTranslation } from "react-i18next";

const ITEMS_PER_PAGE = 5;

type FilterOption = "all" | "paid" | "unpaid";
type SortOption = "newest" | "oldest";

export default function UserServiceTicketsHistory({
  userId,
}: {
  userId?: string;
}) {
  const { user } = useAuth();
  const serviceTicketsQuery = useQuery({
    queryKey: ["serviceTickets", userId],
    queryFn: getServiceTickets,
    select: (data) =>
      data.filter(
        (ticket: any) => ticket.createdByUserId === (userId || user?.id),
      ),
  });
const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [editingServiceTicket, setEditingServiceTicket] = useState<any | null>(
    null,
  );
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

  useEffect(() => {
    if (serviceTicketsQuery.isError)
      toast.error(t("errorLoadingServiceTickets"));
  }, [serviceTicketsQuery.isError]);

  const filteredServiceTickets = useMemo(() => {
    let list = [...(serviceTicketsQuery.data || [])];
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
  }, [serviceTicketsQuery.data, filter, sort]);

  if (!userId && !user?.id) {
    return (
      <div className="text-center text-gray-500">{t("noUserSpecified")}</div>
    );
  }

  if (serviceTicketsQuery.isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="animate-spin w-6 h-6 text-primary" />
      </div>
    );
  }

  const totalPages = Math.ceil(filteredServiceTickets.length / ITEMS_PER_PAGE);
  const currentServiceTickets = filteredServiceTickets.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const markServiceTicketAsPaid = async (serviceTicketId: string) => {
    try {
      const serviceTicket = serviceTicketsQuery.data?.find(
        (t) => t.id === serviceTicketId,
      );
      if (!serviceTicket || !user) return;
      await updateDoc(doc(db, "serviceTickets", serviceTicketId), {
        isPaid: true,
      });

      await logServiceTicketUpdated(
        serviceTicketId,
        serviceTicket.ticketNumber,
        user.id,
        user.name,
        [{ field: "isPaid", oldValue: false, newValue: true }],
      );

      toast.success(t("ticketUpdated"));
      await serviceTicketsQuery.refetch();
    } catch (err) {
      console.error(err);
      toast.error(t("ticketUpdateError"));
    }
  };

  const handleEditServiceTicket = (serviceTicket: any) => {
    setEditingServiceTicket(serviceTicket);
    const currency = getCurrencyByCode(userCurrency);
    if (currency) {
      const partial = convertFromUSD(
        serviceTicket.partialPayment || 0,
        currency,
      );
      const due = convertFromUSD(serviceTicket.amountDue, currency);
      setEditForm({
        partialPayment: partial > 0 ? partial.toString() : "",
        isPaid: serviceTicket.isPaid || false,
        amountDue: due.toString(),
        currency: userCurrency,
      });
    }
  };

  const handleUpdateServiceTicket = async () => {
    if (!editingServiceTicket || !user) return;

    // Check if service ticket is closed and user is not admin
    if (editingServiceTicket.isClosed && user.role !== "admin") {
      toast.error(t("cannotEditClosedServiceTicket"));
      setEditingServiceTicket(null);
      return;
    }

    try {
      const currency = getCurrencyByCode(editForm.currency);
      if (!currency) return toast.error(t("invalidCurrency"));

      const partial = convertToUSD(
        Number(editForm.partialPayment || 0),
        currency,
      );
      const due = convertToUSD(
        Number(editForm.amountDue || editingServiceTicket.amountDue),
        currency,
      );

      // Check minimum amount for service (including quantity)
      const quantity = editingServiceTicket.quantity || 1;
      const minimumServicePrice = editingServiceTicket.serviceBasePrice * quantity;
      if (due < minimumServicePrice) {
        return toast.error(
          `المبلغ المستحق يجب أن يكون أكبر من أو يساوي سعر الخدمة (${minimumServicePrice.toFixed(2)} دولار)`,
        );
      }

      if (partial > due) {
        return toast.error(t("partialPaymentExceedsAmountDue"));
      }

      const changes = [];
      if (partial !== (editingServiceTicket.partialPayment || 0))
        changes.push({
          field: "partialPayment",
          oldValue: editingServiceTicket.partialPayment || 0,
          newValue: partial,
        });
      if (editForm.isPaid !== editingServiceTicket.isPaid)
        changes.push({
          field: "isPaid",
          oldValue: editingServiceTicket.isPaid,
          newValue: editForm.isPaid,
        });
      if (due !== editingServiceTicket.amountDue)
        changes.push({
          field: "amountDue",
          oldValue: editingServiceTicket.amountDue,
          newValue: due,
        });

      await updateDoc(doc(db, "serviceTickets", editingServiceTicket.id), {
        partialPayment: partial,
        isPaid: editForm.isPaid,
        amountDue: due,
      });

      if (changes.length > 0) {
        await logServiceTicketUpdated(
          editingServiceTicket.id,
          editingServiceTicket.ticketNumber,
          user.id,
          user.name,
          changes,
        );
      }

      toast.success(t("changesSaved"));
      setEditingServiceTicket(null);
      await serviceTicketsQuery.refetch();
    } catch (err) {
      console.error(err);
      toast.error(t("errorSavingChanges"));
    }
  };

  return (
    <div className="p-4 text-black space-y-4 max-w-md mx-auto text-right">
      <h2 className="text-lg font-bold mb-4 gap-2 flex items-center">
        <Briefcase className="w-5 h-5 text-green-600" />
        {t("serviceTickets")}
      </h2>

      {/* فلاتر */}
      <div className="flex flex-wrap gap-8 mb-3 justify-start">
        <select
          className="select-accent select select-md select-bordered bg-black/0 w-min"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterOption)}
        >
          <option value="all">{t("all")}</option>
          <option value="paid">{t("paid")}</option>
          <option value="unpaid">{t("unpaid")}</option>
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

      {/* قائمة تذاكر الخدمات */}
      <div className="space-y-4">
        {currentServiceTickets.map((serviceTicket) => (
          <div
            key={serviceTicket.id}
            className="bg-white rounded-xl shadow-sm p-4 border border-green-200"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
              <div className="text-right flex-1">
                <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-green-600" />
                  {t("service")} #{serviceTicket.ticketNumber}
                </p>
                <p className="text-sm text-green-700 font-medium mt-1">
                  {serviceTicket.serviceName}
                  {serviceTicket.quantity && serviceTicket.quantity > 1 && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs ml-2">
                      الكمية: {serviceTicket.quantity}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
                  <p>
                    {t("price")}:{" "}
                    {getFormattedBalance(
                      serviceTicket.serviceBasePrice ||
                        serviceTicket.paidAmount,
                      userCurrency,
                    )}
                    {serviceTicket.quantity && serviceTicket.quantity > 1 && (
                      <span className="text-green-600 font-medium">
                        {" × "}{serviceTicket.quantity}{" = "}
                        {getFormattedBalance(
                          (serviceTicket.serviceBasePrice || serviceTicket.paidAmount) * serviceTicket.quantity,
                          userCurrency,
                        )}
                      </span>
                    )}
                  </p>
                  <p>
                    {t("amountDue")}:{" "}
                    {getFormattedBalance(serviceTicket.amountDue, userCurrency)}
                  </p>
                  {(serviceTicket.partialPayment || 0) > 0 &&
                    !serviceTicket.isPaid && (
                      <p className="text-green-600">
                        {t("partialPayment")}:{" "}
                        {getFormattedBalance(
                          serviceTicket.partialPayment || 0,
                          userCurrency,
                        )}
                      </p>
                    )}
                </div>
              </div>
              <div className="text-sm space-y-2 text-right">
                {serviceTicket.isPaid ? (
                  <span className="text-green-600 font-semibold">
                    ✔️ {t("paid")}
                  </span>
                ) : (
                  <span className="text-red-600 font-semibold">
                    🔴 {t("remaining")}{" "}
                    {getFormattedBalance(
                      serviceTicket.amountDue -
                        (serviceTicket.partialPayment || 0),
                      userCurrency,
                    )}
                  </span>
                )}
                <div className="flex flex-wrap gap-4 justify-end my-2">
                  {serviceTicket.isClosed ? (
                    <span className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                      {t("ticketClosed")} - {t("cannotEdit")}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleEditServiceTicket(serviceTicket)}
                      className="btn-accent btn btn-sm bg-green-500 text-white"
                    >
                      <Edit className="w-3 h-3" /> {t("edit")}
                    </button>
                  )}
                  {!serviceTicket.isPaid &&
                    (serviceTicket.partialPayment || 0) === 0 && (
                      <button
                        onClick={() =>
                          markServiceTicketAsPaid(serviceTicket.id)
                        }
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

      {/* مودال تعديل تذكرة الخدمة */}
      <Modal
        isOpen={!!editingServiceTicket}
        onClose={() => setEditingServiceTicket(null)}
        title={t("editServiceTicket")}
      >
        {editingServiceTicket && (
          <div className="space-y-4">
            <div className="text-sm text-gray-700 mb-4">
              <p>{t("service")} #{editingServiceTicket.ticketNumber}</p>
              <p className="text-green-600 font-medium">
                {editingServiceTicket.serviceName}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t("currency")}</label>
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
                <p className="text-xs text-gray-500 mt-1">
                  {t("minimumAmount")}:{" "}
                  {getFormattedBalance(
                    (editingServiceTicket.serviceBasePrice ||
                      editingServiceTicket.paidAmount) * (editingServiceTicket.quantity || 1),
                    editForm.currency,
                  )}
                  {editingServiceTicket.quantity && editingServiceTicket.quantity > 1 && (
                    <span className="text-green-600">
                      {" ("}
                      {getFormattedBalance(
                        editingServiceTicket.serviceBasePrice || editingServiceTicket.paidAmount,
                        editForm.currency,
                      )}
                      {" × "}{editingServiceTicket.quantity}{")"}
                    </span>
                  )}
                </p>
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
                          t("partialPaymentCannotExceedAmountDue"),
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
                <label className="text-sm">{t("fullyPaid")}</label>
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={handleUpdateServiceTicket}
                className="btn btn-sm btn-primary text-white"
              >
                {t("saveChanges")}
              </button>
              <button
                onClick={() => setEditingServiceTicket(null)}
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
