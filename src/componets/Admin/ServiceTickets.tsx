import { useState } from "react";
import { Loader2, Trash2, Check, Edit, Briefcase } from "lucide-react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getServiceTickets } from "../../api/serviceService";
import { useUsersWithStats } from "../../api/getusers";
import { Modal } from "../ui/modal";
import { motion } from "framer-motion";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../api/Firebase";
import { useCurrencies, useCurrencyUtils } from "../../api/useCurrency";
import { convertToUSD } from "../../api/currencyService";
import {
  logServiceTicketUpdated,
  logServiceTicketDeleted,
} from "../../api/loggingService";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import type { ServiceTicket } from "../../types";

const ITEMS_PER_PAGE = 10;

export default function ServiceTicketsAdmin() {
  const queryClient = useQueryClient();
  const serviceTicketsQuery = useQuery<ServiceTicket[]>({
    queryKey: ["serviceTickets"],
    queryFn: getServiceTickets,
  });
  const usersQuery = useUsersWithStats();
  const { t } = useTranslation();

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
    isClosed: false,
  });

  const { data: currencies } = useCurrencies();
  const { getCurrencyByCode, getFormattedBalance } = useCurrencyUtils();
  const { user } = useAuth();

  const serviceTickets = serviceTicketsQuery.data || [];
  const isLoading = serviceTicketsQuery.isLoading;
  const users = usersQuery.data || [];

  const deleteServiceTicket = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "serviceTickets", id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serviceTickets"] });
    },
  });

  const getDateObject = (
    date: string | { seconds: number } | Date | undefined,
  ): Date => {
    if (!date) return new Date();
    if (typeof date === "string") return new Date(date);
    if (date instanceof Date) return date;
    if ("seconds" in date) return new Date(date.seconds * 1000);
    return new Date(); // fallback
  };

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.name ?? t("unknownUser");
  };

  const filteredServiceTickets = serviceTickets.filter((t) => {
    const createdAtDate = getDateObject(t.createdAt);
    const byUser = userFilter ? t.createdByUserId === userFilter : true;
    const byDate = dateFilter
      ? format(createdAtDate, "yyyy-MM-dd") === dateFilter
      : true;
    return byUser && byDate;
  });

  const totalPages = Math.ceil(filteredServiceTickets.length / ITEMS_PER_PAGE);
  const currentServiceTickets = filteredServiceTickets.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const confirmDelete = (id: string) => {
    setTicketToDelete(id);
  };

  const handleDelete = async () => {
    if (!ticketToDelete || !user) return;

    // Find the service ticket to get its details for logging
    const serviceTicketToDeleteObj = serviceTickets.find(
      (t) => t.id === ticketToDelete,
    );
    const agentName =
      users.find((u) => u.id === serviceTicketToDeleteObj?.createdByUserId)
        ?.name || "غير معروف";

    deleteServiceTicket.mutate(ticketToDelete, {
      onSuccess: async () => {
        // Log the deletion
        if (serviceTicketToDeleteObj) {
          await logServiceTicketDeleted(
            serviceTicketToDeleteObj.id,
            serviceTicketToDeleteObj.ticketNumber,
            user.id,
            user.name,
            agentName,
          );
        }

        toast.success(t("ticketDeleted"));
        setTicketToDelete(null);
      },
      onError: () => {
        toast.error(t("ticketDeleteError"));
        setTicketToDelete(null);
      },
    });
  };

  const handleEditServiceTicket = (serviceTicket: any) => {
    setEditingTicket(serviceTicket);
    setEditForm({
      partialPayment: serviceTicket.partialPayment?.toString() || "",
      isPaid: serviceTicket.isPaid || false,
      amountDue: serviceTicket.amountDue?.toString() || "",
      currency: "USD", // Default to USD for admin editing
      isClosed: serviceTicket.isClosed || false,
    });
  };

  const handleUpdateServiceTicket = async () => {
    if (!editingTicket || !user) return;

    try {
      const currency = getCurrencyByCode(editForm.currency);
      if (!currency) {
        toast.error(t("selectValidCurrency"));
        return;
      }

      // Convert amounts to USD for storage
      const partialPaymentUSD = editForm.partialPayment
        ? convertToUSD(Number(editForm.partialPayment), currency)
        : 0;
      const amountDueUSD = editForm.amountDue
        ? convertToUSD(Number(editForm.amountDue), currency)
        : editingTicket.amountDue;

      // Check minimum amount for service (including quantity)
      const quantity = editingTicket.quantity || 1;
      const minimumServicePrice = editingTicket.serviceBasePrice * quantity;
      if (amountDueUSD < minimumServicePrice) {
        toast.error(
          t("amountDueMustBeGreaterOrEqualServicePrice", {
            price: minimumServicePrice.toFixed(2),
          }),
        );
        return;
      }

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

      if (editForm.isClosed !== (editingTicket.isClosed || false)) {
        changes.push({
          field: "isClosed",
          oldValue: editingTicket.isClosed || false,
          newValue: editForm.isClosed,
        });
      }

      const serviceTicketRef = doc(db, "serviceTickets", editingTicket.id);
      await updateDoc(serviceTicketRef, {
        partialPayment: partialPaymentUSD,
        isPaid: editForm.isPaid,
        amountDue: amountDueUSD,
        isClosed: editForm.isClosed,
      });

      // Log the update if there were changes
      if (changes.length > 0) {
        await logServiceTicketUpdated(
          editingTicket.id,
          editingTicket.ticketNumber,
          user.id,
          user.name,
          changes,
        );
      }

      toast.success(t("ticketUpdated"));
      setEditingTicket(null);
      serviceTicketsQuery.refetch();
    } catch (error) {
      console.error("خطأ في تحديث تذكرة الخدمة:", error);
      toast.error(t("ticketUpdateError"));
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
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {t("serviceTickets")}
                </h2>
                <p className="text-xs text-gray-500 hidden sm:block">
                  {t("serviceTicketsDescription")}
                </p>
              </div>
            </div>
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
          <option value="">{t("allUsers")}</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name || user.email || user.id}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="appearance-none relative pl-10 pr-2 py-2 rounded-lg bg-slate-100 w-full cursor-pointer focus:outline-none focus:ring focus:ring-green-300"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg fill='green' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM5 20V9h14v11H5z'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "10px center",
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      {/* تذاكر الخدمات */}
      <div className="space-y-3">
        {currentServiceTickets.length === 0 ? (
          <p className="text-center text-sm text-gray-500">
            {t("noServiceTickets")}
          </p>
        ) : (
          currentServiceTickets.map((serviceTicket) => {
            const createdAtDate = getDateObject(serviceTicket.createdAt);
            return (
              <div
                key={serviceTicket.id}
                className="bg-green-50 rounded-xl shadow-sm p-3 flex justify-between items-center border border-green-200"
              >
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-gray-800">
                      {t("serviceNumber")} #{serviceTicket.ticketNumber}
                    </p>
                    {serviceTicket.isClosed && (
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                        {t("closed")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {t("createdBy")}:{" "}
                    <span className="text-green-600">
                      {getUserName(serviceTicket.createdByUserId)}
                    </span>
                  </p>
                  <p className="text-xs text-green-600 font-medium">
                    {t("service")}: {serviceTicket.serviceName}
                    {serviceTicket.quantity && serviceTicket.quantity > 1 && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs ml-2">
                        الكمية: {serviceTicket.quantity}
                      </span>
                    )}
                  </p>
                  <div className="flex gap-3 text-sm mt-1 text-gray-600">
                    <p>
                      {t("servicePrice")}:{" "}
                      {getFormattedBalance(
                        serviceTicket.serviceBasePrice ||
                          serviceTicket.paidAmount,
                        "USD",
                      )}
                      {serviceTicket.quantity && serviceTicket.quantity > 1 && (
                        <span className="text-green-600 font-medium">
                          {" × "}{serviceTicket.quantity}{" = "}
                          {getFormattedBalance(
                            (serviceTicket.serviceBasePrice || serviceTicket.paidAmount) * serviceTicket.quantity,
                            "USD",
                          )}
                        </span>
                      )}
                    </p>
                    <p>
                      {t("amountDue")}:{" "}
                      {getFormattedBalance(serviceTicket.amountDue, "USD")}{" "}
                    </p>
                    {(serviceTicket.partialPayment || 0) > 0 &&
                      !serviceTicket.isPaid && (
                        <p className="text-green-600">
                          {t("partialPayment")}:{" "}
                          {getFormattedBalance(
                            serviceTicket.partialPayment || 0,
                            "USD",
                          )}
                        </p>
                      )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {t("date")}:{" "}
                    {format(createdAtDate, "yyyy-MM-dd", {
                      locale: arSA,
                    })}
                  </p>
                </div>

                <div className="text-left space-y-1 grid text-sm">
                  {serviceTicket.isPaid ? (
                    <span className="text-green-600 font-semibold flex items-center gap-1">
                      <Check className="w-4 h-4" /> {t("paid")}
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold">
                      {t("remaining")}{" "}
                      {getFormattedBalance(
                        serviceTicket.amountDue -
                          (serviceTicket.partialPayment || 0),
                        "USD",
                      )}
                    </span>
                  )}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditServiceTicket(serviceTicket)}
                      className="btn btn-sm btn-info text-white"
                    >
                      <Edit className="w-4 h-4 mr-1" /> {t("edit")}
                    </button>
                    <button
                      onClick={() => confirmDelete(serviceTicket.id)}
                      className="btn btn-sm btn-error text-white"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> {t("delete")}
                    </button>
                  </div>
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
              {t("page")} {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* مودال الحذف */}
      <Modal
        isOpen={!!ticketToDelete}
        onClose={() => setTicketToDelete(null)}
        title={t("confirmDelete")}
      >
        <p className="text-sm text-gray-700">
          {t("confirmDeleteMessage")}
        </p>
        <div className="mt-4 flex gap-3 justify-end">
          <button
            onClick={handleDelete}
            className="btn btn-sm btn-error text-white"
          >
            {t("yesDelete")}
          </button>
          <button
            onClick={() => setTicketToDelete(null)}
            className="btn btn-sm btn-ghost"
          >
            {t("cancel")}
          </button>
        </div>
      </Modal>

      {/* مودال تعديل تذكرة الخدمة */}
      <Modal
        isOpen={!!editingTicket}
        onClose={() => setEditingTicket(null)}
        title={t("editServiceTicket")}
      >
        {editingTicket && (
          <div className="space-y-4">
            <div className="text-sm text-gray-700 mb-4">
              <p>{t("serviceNumber")} #{editingTicket.ticketNumber}</p>
              <p className="text-green-600 font-medium">
                {t("service")}: {editingTicket.serviceName}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("currency")}
                </label>
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
                  {t("amountDue")}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="input bg-slate-100 input-bordered w-full"
                  value={
                    editForm.amountDue === ""
                      ? ""
                      : Number(editForm.amountDue).toLocaleString("en-US")
                  }
                  onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, "");
                    // دعم الأرقام العشرية
                    if (/^\d*\.?\d*$/.test(raw)) {
                      setEditForm({ ...editForm, amountDue: raw });
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t("minimumAmount")}: {" "}
                  {getFormattedBalance(
                    (editingTicket.serviceBasePrice || editingTicket.paidAmount) * (editingTicket.quantity || 1),
                    "USD",
                  )}
                  {editingTicket.quantity && editingTicket.quantity > 1 && (
                    <span className="text-green-600">
                      {" ("}
                      {getFormattedBalance(
                        editingTicket.serviceBasePrice || editingTicket.paidAmount,
                        "USD",
                      )}
                      {" × "}{editingTicket.quantity}{")"}
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
                  value={
                    editForm.partialPayment === ""
                      ? ""
                      : Number(editForm.partialPayment).toLocaleString("en-US")
                  }
                  onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, "");
                    // دعم الأرقام العشرية
                    if (/^\d*\.?\d*$/.test(raw)) {
                      const amountDue = Number(editForm.amountDue) || 0;
                      const partialAmount = Number(raw) || 0;
                      if (partialAmount > amountDue && amountDue > 0) {
                        toast.warn(
                          t("partialPaymentExceedsAmountDue"),
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
                <label className="text-sm">{t("paid")}</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-warning"
                  checked={editForm.isClosed}
                  onChange={(e) =>
                    setEditForm({ ...editForm, isClosed: e.target.checked })
                  }
                />
                <label className="text-sm">
                  {t("closeTicketAfterPayment")}
                </label>
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
                onClick={() => setEditingTicket(null)}
                className="btn btn-sm btn-ghost"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
