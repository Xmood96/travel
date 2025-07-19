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
      toast.error("حدث خطأ أثناء تحميل تذاكر الخدمات");
  }, [serviceTicketsQuery.isError]);

  if (!userId && !user?.id) {
    return (
      <div className="text-center text-gray-500">لم يتم تحديد المستخدم</div>
    );
  }

  if (serviceTicketsQuery.isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="animate-spin w-6 h-6 text-primary" />
      </div>
    );
  }

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

      toast.success("تم تحديث تذكرة الخدمة كمدفوعة ✅");
      await serviceTicketsQuery.refetch();
    } catch (err) {
      console.error(err);
      toast.error("فشل في تحديث تذكرة الخدمة");
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
      toast.error("لا يمكن تعديل تذكرة خدمة مغلقة");
      setEditingServiceTicket(null);
      return;
    }

    try {
      const currency = getCurrencyByCode(editForm.currency);
      if (!currency) return toast.error("يرجى اختيار عملة صحيحة");

      const partial = convertToUSD(
        Number(editForm.partialPayment || 0),
        currency,
      );
      const due = convertToUSD(
        Number(editForm.amountDue || editingServiceTicket.amountDue),
        currency,
      );

      // Check minimum amount for service
      if (due < editingServiceTicket.serviceBasePrice) {
        return toast.error(
          `المبلغ المستحق يجب أن يكون أكبر من أو يساوي سعر الخدمة (${editingServiceTicket.serviceBasePrice} دولار)`,
        );
      }

      if (partial > due) {
        return toast.error("الدفع الجزئي لا يمكن أن يتجاوز المبلغ المستحق");
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

      toast.success("تم حفظ التغييرات");
      setEditingServiceTicket(null);
      await serviceTicketsQuery.refetch();
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء حفظ التعديلات");
    }
  };

  return (
    <div className="p-4 text-black space-y-4 max-w-md mx-auto text-right">
      <h2 className="text-lg font-bold mb-4 gap-2 flex items-center">
        <Briefcase className="w-5 h-5 text-green-600" />
        سجل تذاكر الخدمات
      </h2>

      {/* فلاتر */}
      <div className="flex flex-wrap gap-8 mb-3 justify-start">
        <select
          className="select-accent select select-md select-bordered bg-black/0 w-min"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterOption)}
        >
          <option value="all">كل الخدمات</option>
          <option value="paid">المدفوعة</option>
          <option value="unpaid">الغير مدفوعة</option>
        </select>

        <select
          className="select-accent select select-md select-bordered bg-black/0 w-min"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
        >
          <option value="newest">الأحدث أولاً</option>
          <option value="oldest">الأقدم أولاً</option>
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
                  خدمة #{serviceTicket.ticketNumber}
                </p>
                <p className="text-sm text-green-700 font-medium mt-1">
                  {serviceTicket.serviceName}
                </p>
                <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
                  <p>
                    سعر الخدمة:{" "}
                    {getFormattedBalance(
                      serviceTicket.serviceBasePrice ||
                        serviceTicket.paidAmount,
                      userCurrency,
                    )}
                  </p>
                  <p>
                    المستحق:{" "}
                    {getFormattedBalance(serviceTicket.amountDue, userCurrency)}
                  </p>
                  {(serviceTicket.partialPayment || 0) > 0 &&
                    !serviceTicket.isPaid && (
                      <p className="text-green-600">
                        دفع جزئي:{" "}
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
                    ✔️ تم الدفع
                  </span>
                ) : (
                  <span className="text-red-600 font-semibold">
                    🔴 متبقي{" "}
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
                      تذكرة مغلقة - لا يمكن التعديل
                    </span>
                  ) : (
                    <button
                      onClick={() => handleEditServiceTicket(serviceTicket)}
                      className="btn-accent btn btn-sm bg-green-500 text-white"
                    >
                      <Edit className="w-3 h-3" /> تعديل
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
                        تحديث كمدفوع
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
        title="تعديل تذكرة الخدمة"
      >
        {editingServiceTicket && (
          <div className="space-y-4">
            <div className="text-sm text-gray-700 mb-4">
              <p>خدمة #{editingServiceTicket.ticketNumber}</p>
              <p className="text-green-600 font-medium">
                {editingServiceTicket.serviceName}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">العملة</label>
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
                  المبلغ المستحق
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
                  الحد الأدنى:{" "}
                  {getFormattedBalance(
                    editingServiceTicket.serviceBasePrice ||
                      editingServiceTicket.paidAmount,
                    editForm.currency,
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  الدفع الجزئي
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
                          "الدفع الجزئي لا يمكن أن يتجاوز المبلغ المستحق",
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
                <label className="text-sm">مدفوعة بالكامل</label>
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={handleUpdateServiceTicket}
                className="btn btn-sm btn-primary text-white"
              >
                حفظ التغييرات
              </button>
              <button
                onClick={() => setEditingServiceTicket(null)}
                className="btn btn-sm btn-ghost"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
