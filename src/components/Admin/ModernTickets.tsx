import { useState } from "react";
import {
  Ticket as TicketIcon,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Search,
  Eye,
  Clock,
} from "lucide-react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { useAppData } from "../../api/useAppData";
import { useUsersWithStats } from "../../api/getusers";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../api/Firebase";
import { useCurrencies, useCurrencyUtils } from "../../api/useCurrency";
import { convertToUSD } from "../../api/currencyService";
import { logTicketUpdated, logTicketDeleted } from "../../api/loggingService";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";

// Modern UI Components
import {
  ModernCard,
  CardHeader,
  CardContent,
  CardFooter,
} from "../ui/modern/Card";
import { ModernButton, IconButton } from "../ui/modern/Button";
import { ModernInput, ModernSelect } from "../ui/modern/Input";
import { ModernModal, ConfirmModal } from "../ui/modern/Modal";
import {
  Container,
  Grid,
  Section,
  PageHeader,
  Stack,
} from "../ui/modern/Layout";

const ITEMS_PER_PAGE = 12;

export default function ModernTickets() {
  const { ticketsQuery, deleteTicket } = useAppData();
  const usersQuery = useUsersWithStats();
  const { data: currencies } = useCurrencies();
  const { getCurrencyByCode, getFormattedBalance } = useCurrencyUtils();
  const { user } = useAuth();

  // State management
  const [userFilter, setUserFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [editingTicket, setEditingTicket] = useState<any | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    partialPayment: "",
    isPaid: false,
    amountDue: "",
    currency: "USD",
  });

  const tickets = ticketsQuery.data || [];
  const isLoading = ticketsQuery.isLoading;
  const users = usersQuery.data || [];

  const getDateObject = (
    date: string | { seconds: number } | Date | undefined,
  ): Date => {
    if (!date) return new Date();
    if (typeof date === "string") return new Date(date);
    if (date instanceof Date) return date;
    if ("seconds" in date) return new Date(date.seconds * 1000);
    return new Date();
  };

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.name ?? "مست��دم غير معروف";
  };

  const getAgentName = (agentId: string) => {
    // This would typically come from agents data
    return `وكيل ${agentId.substring(0, 8)}`;
  };

  // Filter tickets
  const filteredTickets = tickets.filter((t) => {
    const createdAtDate = getDateObject(t.createdAt);
    const byUser = userFilter ? t.createdByUserId === userFilter : true;
    const byStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "paid"
          ? t.isPaid
          : statusFilter === "unpaid"
            ? !t.isPaid
            : true;
    const byDate = dateFilter
      ? format(createdAtDate, "yyyy-MM-dd") === dateFilter
      : true;
    const bySearch = searchTerm
      ? t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    return byUser && byStatus && byDate && bySearch;
  });

  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  const currentTickets = filteredTickets.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  // Filter options
  const userOptions = [
    { value: "", label: "جميع المستخدمين" },
    ...users.map((user) => ({ value: user.id, label: user.name })),
  ];

  const statusOptions = [
    { value: "all", label: "جميع التذاكر" },
    { value: "paid", label: "المدفوعة" },
    { value: "unpaid", label: "غير المدفوعة" },
  ];

  const currencyOptions =
    currencies?.map((currency) => ({
      value: currency.code,
      label: `${currency.name} (${currency.symbol})`,
    })) || [];

  const handleDelete = async () => {
    if (!ticketToDelete || !user) return;

    const ticketToDeleteObj = tickets.find((t) => t.id === ticketToDelete);
    const agentName = getAgentName(ticketToDeleteObj?.agentId || "");

    deleteTicket.mutate(ticketToDelete, {
      onSuccess: async () => {
        if (ticketToDeleteObj) {
          await logTicketDeleted(
            ticketToDeleteObj.id,
            ticketToDeleteObj.ticketNumber,
            user.id,
            user.name,
            agentName,
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
      currency: "USD",
    });
  };

  const handleUpdateTicket = async () => {
    if (!editingTicket || !user) return;

    setLoading(true);
    try {
      const currency = getCurrencyByCode(editForm.currency);
      if (!currency) {
        toast.error("يرجى اختيار عملة صحيحة");
        return;
      }

      const partialPaymentUSD = editForm.partialPayment
        ? convertToUSD(Number(editForm.partialPayment), currency)
        : 0;
      const amountDueUSD = editForm.amountDue
        ? convertToUSD(Number(editForm.amountDue), currency)
        : editingTicket.amountDue;

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

      if (changes.length > 0) {
        await logTicketUpdated(
          editingTicket.id,
          editingTicket.ticketNumber,
          user.id,
          user.name,
          changes,
        );
      }

      toast.success("تم تحدي�� التذكرة بنجاح");
      setEditingTicket(null);
      ticketsQuery.refetch();
    } catch (error) {
      console.error("خطأ في تحديث التذكرة:", error);
      toast.error("فشل في تحديث التذكرة");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || usersQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">
            جاري تحميل التذاكر...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Container>
        <PageHeader
          title="إدارة التذاكر"
          subtitle={`${filteredTickets.length} تذكرة في النظام`}
          breadcrumbs={[{ label: "الرئيسية" }, { label: "إدارة التذاكر" }]}
        />

        <div className="py-8">
          {/* Filters Section */}
          <Section className="mb-8">
            <Stack spacing={4}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ModernInput
                  placeholder="رقم التذكرة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search size={16} />}
                  variant="glass"
                />

                <ModernSelect
                  options={userOptions}
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  placeholder="اختر المستخدم"
                  variant="glass"
                />

                <ModernSelect
                  options={statusOptions}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  variant="glass"
                />

                <ModernInput
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  icon={<Calendar size={16} />}
                  variant="glass"
                />
              </div>

              {(searchTerm ||
                userFilter ||
                statusFilter !== "all" ||
                dateFilter) && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">الفلاتر النشطة:</span>
                  {searchTerm && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs">
                      البحث: {searchTerm}
                    </span>
                  )}
                  {userFilter && (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs">
                      المستخدم: {getUserName(userFilter)}
                    </span>
                  )}
                  {statusFilter !== "all" && (
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs">
                      الحالة:{" "}
                      {
                        statusOptions.find((s) => s.value === statusFilter)
                          ?.label
                      }
                    </span>
                  )}
                  {dateFilter && (
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md text-xs">
                      التاريخ: {dateFilter}
                    </span>
                  )}
                  <ModernButton
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setSearchTerm("");
                      setUserFilter("");
                      setStatusFilter("all");
                      setDateFilter("");
                      setPage(1);
                    }}
                  >
                    مسح الكل
                  </ModernButton>
                </div>
              )}
            </Stack>
          </Section>

          {/* Tickets Grid */}
          <Grid cols={{ base: 1, md: 2, lg: 3 }} gap={6}>
            {currentTickets.map((ticket) => {
              const createdAtDate = getDateObject(ticket.createdAt);
              const remainingAmount =
                ticket.amountDue - (ticket.partialPayment || 0);

              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <ModernCard variant="glass" hover>
                    <CardHeader
                      title={`تذكرة #${ticket.ticketNumber}`}
                      subtitle={getUserName(ticket.createdByUserId)}
                      icon={<TicketIcon size={20} />}
                      action={
                        <div className="flex items-center gap-1">
                          <IconButton
                            icon={<Eye size={14} />}
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTicket(ticket)}
                            tooltip="عرض التفاصيل"
                          />
                          <IconButton
                            icon={<Edit3 size={14} />}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTicket(ticket)}
                            tooltip="تعديل"
                          />
                          <IconButton
                            icon={<Trash2 size={14} />}
                            variant="danger"
                            size="sm"
                            onClick={() => setTicketToDelete(ticket.id)}
                            tooltip="حذف"
                          />
                        </div>
                      }
                    />

                    <CardContent>
                      <Stack spacing={3}>
                        {/* Status Badge */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">الحالة:</span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                              ticket.isPaid
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {ticket.isPaid ? (
                              <>
                                <CheckCircle size={12} />
                                مدفوعة
                              </>
                            ) : (
                              <>
                                <XCircle size={12} />
                                غير مدفوعة
                              </>
                            )}
                          </span>
                        </div>

                        {/* Financial Info */}
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">المدفوع:</span>
                            <span className="font-medium text-blue-600">
                              {getFormattedBalance(ticket.paidAmount, "USD")}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">المستح��:</span>
                            <span className="font-medium">
                              {getFormattedBalance(ticket.amountDue, "USD")}
                            </span>
                          </div>

                          {(ticket.partialPayment || 0) > 0 &&
                            !ticket.isPaid && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">دفع جزئي:</span>
                                <span className="font-medium text-green-600">
                                  {getFormattedBalance(
                                    ticket.partialPayment || 0,
                                    "USD",
                                  )}
                                </span>
                              </div>
                            )}

                          {!ticket.isPaid && remainingAmount > 0 && (
                            <div className="flex items-center justify-between text-sm border-t pt-2">
                              <span className="text-gray-600 font-medium">
                                المتبقي:
                              </span>
                              <span className="font-bold text-red-600">
                                {getFormattedBalance(remainingAmount, "USD")}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock size={12} />
                          <span>
                            {format(createdAtDate, "dd/MM/yyyy", {
                              locale: arSA,
                            })}
                          </span>
                        </div>
                      </Stack>
                    </CardContent>

                    <CardFooter>
                      <div className="flex gap-2 w-full">
                        <ModernButton
                          variant="outline"
                          size="sm"
                          fullWidth
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          التفاصيل
                        </ModernButton>
                        <ModernButton
                          variant="primary"
                          size="sm"
                          fullWidth
                          onClick={() => handleEditTicket(ticket)}
                        >
                          تعديل
                        </ModernButton>
                      </div>
                    </CardFooter>
                  </ModernCard>
                </motion.div>
              );
            })}
          </Grid>

          {/* Empty State */}
          {currentTickets.length === 0 && (
            <div className="text-center py-12">
              <TicketIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا توجد تذاكر
              </h3>
              <p className="text-gray-500">
                {filteredTickets.length === 0
                  ? "لم يتم العثور على تذاكر تطابق البحث"
                  : "لا توجد تذاكر في هذه الصفحة"}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-2">
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >
                  الأولى
                </ModernButton>
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  السابقة
                </ModernButton>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum =
                      Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    if (pageNum <= totalPages) {
                      return (
                        <ModernButton
                          key={pageNum}
                          variant={page === pageNum ? "primary" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </ModernButton>
                      );
                    }
                    return null;
                  })}
                </div>

                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  التالية
                </ModernButton>
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                >
                  الأخيرة
                </ModernButton>
              </div>
            </div>
          )}
        </div>
      </Container>

      {/* Ticket Details Modal */}
      <ModernModal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title="تفاصيل التذكرة"
        size="lg"
      >
        {selectedTicket && (
          <Stack spacing={6}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">
                  معلومات التذكرة
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">رقم التذكرة:</span>
                    <span className="font-medium">
                      {selectedTicket.ticketNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">المعرف:</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {selectedTicket.id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">تاريخ الإنشاء:</span>
                    <span className="font-medium">
                      {format(
                        getDateObject(selectedTicket.createdAt),
                        "dd/MM/yyyy HH:mm",
                        { locale: arSA },
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">المستخدم:</span>
                    <span className="font-medium">
                      {getUserName(selectedTicket.createdByUserId)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">الحالة:</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                        selectedTicket.isPaid
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {selectedTicket.isPaid ? (
                        <>
                          <CheckCircle size={12} />
                          مدفوعة
                        </>
                      ) : (
                        <>
                          <XCircle size={12} />
                          غير مدفوعة
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">
                  المعلومات المالية
                </h4>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">المبلغ المدفوع:</span>
                    <span className="font-semibold text-blue-600">
                      {getFormattedBalance(selectedTicket.paidAmount, "USD")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">المبلغ المستحق:</span>
                    <span className="font-semibold">
                      {getFormattedBalance(selectedTicket.amountDue, "USD")}
                    </span>
                  </div>
                  {(selectedTicket.partialPayment || 0) > 0 &&
                    !selectedTicket.isPaid && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">الدفع الجز��ي:</span>
                        <span className="font-semibold text-green-600">
                          {getFormattedBalance(
                            selectedTicket.partialPayment,
                            "USD",
                          )}
                        </span>
                      </div>
                    )}
                  {!selectedTicket.isPaid && (
                    <div className="flex justify-between text-sm border-t border-blue-200 pt-3">
                      <span className="text-gray-600 font-medium">
                        المبلغ المتبقي:
                      </span>
                      <span className="font-bold text-red-600">
                        {getFormattedBalance(
                          selectedTicket.amountDue -
                            (selectedTicket.partialPayment || 0),
                          "USD",
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Stack>
        )}
      </ModernModal>

      {/* Edit Ticket Modal */}
      <ModernModal
        isOpen={!!editingTicket}
        onClose={() => setEditingTicket(null)}
        title="تعديل التذكرة"
        size="md"
      >
        {editingTicket && (
          <Stack spacing={4}>
            <div className="bg-blue-50 p-4 rounded-xl">
              <h4 className="font-medium text-blue-900">
                تذكرة #{editingTicket.ticketNumber}
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                {getUserName(editingTicket.createdByUserId)}
              </p>
            </div>

            <ModernSelect
              label="العملة"
              options={currencyOptions}
              value={editForm.currency}
              onChange={(e) =>
                setEditForm({ ...editForm, currency: e.target.value })
              }
            />

            <ModernInput
              label="المبلغ المستحق"
              type="number"
              value={editForm.amountDue}
              onChange={(e) =>
                setEditForm({ ...editForm, amountDue: e.target.value })
              }
              icon={<DollarSign size={16} />}
            />

            <ModernInput
              label="الدفع الجزئي"
              type="number"
              value={editForm.partialPayment}
              onChange={(e) => {
                const amount = Number(e.target.value);
                const amountDue = Number(editForm.amountDue);
                if (amount > amountDue && amountDue > 0) {
                  toast.warn("الدفع الجزئي لا يمكن أن يتجاوز المبلغ المستحق");
                  return;
                }
                setEditForm({ ...editForm, partialPayment: e.target.value });
              }}
              icon={<DollarSign size={16} />}
            />

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                checked={editForm.isPaid}
                onChange={(e) =>
                  setEditForm({ ...editForm, isPaid: e.target.checked })
                }
              />
              <label className="text-sm font-medium text-gray-700">
                تم الدفع بالكامل
              </label>
            </div>

            <Stack direction="horizontal" spacing={3}>
              <ModernButton
                variant="outline"
                fullWidth
                onClick={() => setEditingTicket(null)}
              >
                إلغاء
              </ModernButton>
              <ModernButton
                variant="primary"
                fullWidth
                loading={loading}
                onClick={handleUpdateTicket}
              >
                حفظ التغييرات
              </ModernButton>
            </Stack>
          </Stack>
        )}
      </ModernModal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!ticketToDelete}
        onClose={() => setTicketToDelete(null)}
        onConfirm={handleDelete}
        title="تأكيد حذف التذكرة"
        message="هل أنت متأكد أنك تريد حذف هذه التذكرة؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف التذكرة"
        cancelText="إلغاء"
        variant="danger"
      />
    </div>
  );
}
