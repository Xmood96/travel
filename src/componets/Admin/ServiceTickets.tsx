import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  Search,
  Filter,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../api/Firebase";
import { Modal } from "../ui/modal";
import { Button } from "../ui/botom";
import type { ServiceTicket, Service } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useCurrencyUtils } from "../../api/useCurrency";
import { useUsersWithStats } from "../../api/getusers";
import { useAppData } from "../../api/useAppData";
import { getAllServices } from "../../api/serviceService";

export default function ServiceTickets() {
  const { user } = useAuth();
  const [serviceTickets, setServiceTickets] = useState<ServiceTicket[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid">(
    "all",
  );
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(
    null,
  );
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const { data: users } = useUsersWithStats();
  const { agentsQuery } = useAppData();
  const { getFormattedBalance } = useCurrencyUtils();

  const [editForm, setEditForm] = useState({
    amountDue: "",
    partialPayment: "",
    isPaid: false,
    isClosed: false,
  });

  useEffect(() => {
    loadServiceTickets();
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const servicesData = await getAllServices();
      setServices(servicesData);
    } catch (error) {
      console.error("Error loading services:", error);
      toast.error("فشل في تحميل الخدمات");
    }
  };

  const loadServiceTickets = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "serviceTickets"),
        orderBy("createdAt", "desc"),
      );
      const snapshot = await getDocs(q);
      const tickets = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ServiceTicket[];
      setServiceTickets(tickets);
    } catch (error) {
      console.error("Error loading service tickets:", error);
      toast.error("فشل في تحميل تذاكر الخدمات");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!ticketToDelete) return;

    try {
      await deleteDoc(doc(db, "serviceTickets", ticketToDelete));
      toast.success("تم حذف تذكرة الخدمة بنجاح!");
      setTicketToDelete(null);
      loadServiceTickets();
    } catch (error) {
      console.error("Error deleting service ticket:", error);
      toast.error("فشل في حذف تذكرة الخدمة");
    }
  };

  const openEditModal = (ticket: ServiceTicket) => {
    setSelectedTicket(ticket);
    setEditForm({
      amountDue: ticket.amountDue.toString(),
      partialPayment: (ticket.partialPayment || 0).toString(),
      isPaid: ticket.isPaid,
      isClosed: ticket.isClosed || false,
    });
    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedTicket) return;

    setUpdating(true);
    try {
      const updates = {
        amountDue: Number(editForm.amountDue),
        partialPayment: Number(editForm.partialPayment),
        isPaid: editForm.isPaid,
        isClosed: editForm.isClosed,
      };

      await updateDoc(doc(db, "serviceTickets", selectedTicket.id), updates);
      toast.success("تم تحديث تذكرة الخدمة بنجاح!");
      setEditModalOpen(false);
      setSelectedTicket(null);
      loadServiceTickets();
    } catch (error) {
      console.error("Error updating service ticket:", error);
      toast.error("فشل في تحديث تذكرة الخدمة");
    } finally {
      setUpdating(false);
    }
  };

  const getAgentName = (agentId: string) => {
    return (
      agentsQuery.data?.find((agent) => agent.id === agentId)?.name ||
      "غير معروف"
    );
  };

  const getUserName = (userId: string) => {
    return users?.find((user) => user.id === userId)?.name || "غير معروف";
  };

  const filteredTickets = serviceTickets.filter((ticket) => {
    const matchesSearch =
      ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getAgentName(ticket.agentId)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      getUserName(ticket.createdByUserId)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "paid" && ticket.isPaid) ||
      (filterStatus === "unpaid" && !ticket.isPaid);

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (ticket: ServiceTicket) => {
    if (ticket.isClosed) return "text-gray-500";
    if (ticket.isPaid) return "text-green-600";
    if (ticket.partialPayment && ticket.partialPayment > 0)
      return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusIcon = (ticket: ServiceTicket) => {
    if (ticket.isClosed) return <XCircle className="w-4 h-4" />;
    if (ticket.isPaid) return <CheckCircle className="w-4 h-4" />;
    if (ticket.partialPayment && ticket.partialPayment > 0)
      return <Clock className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  const getStatusText = (ticket: ServiceTicket) => {
    if (ticket.isClosed) return "مغلقة";
    if (ticket.isPaid) return "مدفوعة";
    if (ticket.partialPayment && ticket.partialPayment > 0) return "دفع جزئي";
    return "غير مدفوعة";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="text-lg">جار التحميل...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 space-y-4 text-black"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-green-600" />
          تذاكر الخدمات
        </h1>
        <div className="text-sm text-gray-600">
          إجمالي: {serviceTickets.length} تذكرة خدمة
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="البحث في تذاكر الخدمات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as "all" | "paid" | "unpaid")
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">جميع الحالات</option>
            <option value="paid">مدفوعة</option>
            <option value="unpaid">غير مدفوعة</option>
          </select>
        </div>
      </div>

      {/* Service Tickets List */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">لا توجد تذاكر خدمات</p>
            <p className="text-sm">لم يتم العثور على تذاكر خدمات تطابق البحث</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-green-600">
                      #{ticket.ticketNumber}
                    </span>
                    <span
                      className={`flex items-center gap-1 text-sm ${getStatusColor(ticket)}`}
                    >
                      {getStatusIcon(ticket)}
                      {getStatusText(ticket)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-green-500" />
                      <span>{ticket.serviceName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-500" />
                      <span>البائع: {getAgentName(ticket.agentId)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-500" />
                      <span>المحرر: {getUserName(ticket.createdByUserId)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-yellow-500" />
                      <span>السعر الأساسي: ${ticket.serviceBasePrice}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-red-500" />
                      <span>
                        المستحق:{" "}
                        {getFormattedBalance(
                          ticket.amountDue,
                          user?.preferredCurrency || "USD",
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>
                        {new Date(ticket.createdAt).toLocaleDateString("ar-SA")}
                      </span>
                    </div>
                  </div>

                  {ticket.partialPayment && ticket.partialPayment > 0 && (
                    <div className="text-sm text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                      دفع جزئي:{" "}
                      {getFormattedBalance(
                        ticket.partialPayment,
                        user?.preferredCurrency || "USD",
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(ticket)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="تعديل"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setTicketToDelete(ticket.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedTicket(null);
        }}
        title="تعديل تذكرة الخدمة"
      >
        {selectedTicket && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الخدمة
              </label>
              <input
                type="text"
                value={selectedTicket.serviceName}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المبلغ المستحق (USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={editForm.amountDue}
                onChange={(e) =>
                  setEditForm({ ...editForm, amountDue: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الدفع الجزئي (USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={editForm.partialPayment}
                onChange={(e) =>
                  setEditForm({ ...editForm, partialPayment: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.isPaid}
                  onChange={(e) =>
                    setEditForm({ ...editForm, isPaid: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm">مدفوعة</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.isClosed}
                  onChange={(e) =>
                    setEditForm({ ...editForm, isClosed: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm">مغلقة</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedTicket(null);
                }}
              >
                إلغاء
              </Button>
              <Button onClick={handleUpdate} disabled={updating}>
                {updating ? "جاري التحديث..." : "حفظ التعديلات"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!ticketToDelete}
        onClose={() => setTicketToDelete(null)}
        title="تأكيد الحذف"
      >
        <p className="text-sm text-gray-700 mb-4">
          هل أنت متأكد أنك تريد حذف هذه التذكرة؟ هذا الإجراء لا يمكن التراجع
          عنه.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setTicketToDelete(null)}>
            إلغاء
          </Button>
          <Button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            حذف التذكرة
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}
