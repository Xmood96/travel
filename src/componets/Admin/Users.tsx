import { useState } from "react";
import {
  UserPlusIcon,
  Edit,
  Trash2,
  Wallet,
  CreditCard,
  User2,
  ShieldCheck,
} from "lucide-react";
import { useUsersWithStats, type UserWithStats } from "../../api/getusers";
import { Button } from "../ui/botom";
import { Modal } from "../ui/modal";
import { deleteDoc, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../../api/Firebase";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useCurrencies, useCurrencyUtils } from "../../api/useCurrency";
import { convertToUSD } from "../../api/currencyService";
import {
  logUserCreated,
  logUserUpdated,
  logUserDeleted,
  logUserBalanceUpdated,
  logUserDebtPaidFromBalance,
  logTicketUpdated,
} from "../../api/loggingService";
import { useAuth } from "../../context/AuthContext";
import PaymentInputs from "./PaymentInputs";

export default function Users() {
  const { data: users, isLoading, refetch } = useUsersWithStats();
  const { data: currencies } = useCurrencies();
  const { getCurrencyByCode, getFormattedBalance } = useCurrencyUtils();
  const { user: currentUser } = useAuth();

  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isBalanceModalOpen, setBalanceModalOpen] = useState(false);
  const [isPayDebtModalOpen, setPayDebtModalOpen] = useState(false);
  const [balanceUser, setBalanceUser] = useState<UserWithStats | null>(null);

  // بيانات المستخدم الجديد
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    role: "agent",
  });

  // بيانات المستخدم للتعديل
  const [editUserData, setEditUserData] = useState({
    id: "",
    name: "",
    role: "agent",
  });

  // بيانات إدارة الرصيد
  const [balanceData, setBalanceData] = useState({
    amount: "",
    currency: "USD",
    operation: "set" as "set" | "add" | "subtract",
  });

  // بيانات دفع الدين من الرصيد
  const [payDebtData, setPayDebtData] = useState({
    paymentType: "general" as "general" | "ticket",
    ticketId: "",
    amount: "",
    currency: "USD",
    comment: "",
    closeTicket: false,
  });

  // رسالة خطأ
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isLoading) return <div>ج��ر التحميل...</div>;

  // دالة إضافة مستخدم جديد
  const handleCreateUser = async () => {
    setError("");
    setLoading(true);

    // التحقق من صحة البيانات
    if (!newUserData.name.trim()) {
      setError("يرجى إدخال اسم المستخدم.");
      setLoading(false);
      return;
    }

    if (!newUserData.email.trim()) {
      setError("يرجى إدخال البريد الإلكتروني.");
      setLoading(false);
      return;
    }

    if (!newUserData.password.trim() || newUserData.password.length < 6) {
      setError("يرجى إدخال كلمة مرور صحيحة (6 أحرف على الأقل).");
      setLoading(false);
      return;
    }

    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserData.email)) {
      setError("يرجى إدخال ��ريد إلكتروني صحيح.");
      setLoading(false);
      return;
    }

    try {
      // إنشاء المستخدم في Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUserData.email.trim(),
        newUserData.password,
      );

      const user = userCredential.user;

      // إضافة ��يانات المستخدم إلى Firestore
      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        name: newUserData.name.trim(),
        email: newUserData.email.trim(),
        role: newUserData.role,
        photoURL: "https://via.placeholder.com/100",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });

      // Log the user creation
      if (currentUser) {
        await logUserCreated(
          user.uid,
          newUserData.name.trim(),
          newUserData.email.trim(),
          newUserData.role,
          currentUser.id,
          currentUser.name,
        );
      }

      toast.success("تم إضافة المستخدم بن��اح!");

      // تنظيف البيانات وإغلاق المودال
      setAddModalOpen(false);
      setNewUserData({ name: "", email: "", password: "", role: "agent" });

      // إعاد�� تحميل قائمة المس��خدمين
      refetch();
    } catch (error: any) {
      console.error("خطأ أثناء إضافة المستخدم:", error);

      // معالجة أخطاء Firebase المختلفة
      if (error.code === "auth/email-already-in-use") {
        setError("هذا البريد ����لإلكتروني مستخدم بالفعل.");
      } else if (error.code === "auth/weak-password") {
        setError("كلمة المرور ضعيفة جداً.");
      } else if (error.code === "auth/invalid-email") {
        setError("الب��يد الإلكتروني غير صحيح.");
      } else {
        setError("حدث خط�� أثناء إضافة المستخدم.");
      }

      toast.error("فشل في إضافة المستخدم");
    } finally {
      setLoading(false);
    }
  };

  // دالة تعديل المستخدم
  const handleEditUser = async () => {
    setError("");
    setLoading(true);

    if (!editUserData.name.trim()) {
      setError("يرجى إدخال اسم المستخدم.");
      setLoading(false);
      return;
    }

    try {
      // العثور على المس��خدم في القائمة للحصول على document ID
      const userDoc = users?.find((u) => u.id === editUserData.id);
      if (!userDoc) {
        setError("لم يتم العثور على المستخدم.");
        setLoading(false);
        return;
      }

      // تحديث بيانات المستخدم في Firestore
      const userRef = doc(db, "users", editUserData.id);
      await updateDoc(userRef, {
        name: editUserData.name.trim(),
        role: editUserData.role,
      });

      // Log the user update
      if (currentUser) {
        const changes = `الاسم: ${editUserData.name.trim()}، الدور: ${
          editUserData.role === "admin" ? "مدير" : "��كيل"
        }`;
        await logUserUpdated(
          editUserData.id,
          editUserData.name.trim(),
          currentUser.id,
          currentUser.name,
          changes,
        );
      }

      toast.success("تم تحديث بيانات المستخدم بنجاح!");

      // إغلاق المودال وإعادة تحميل البيانات
      setEditModalOpen(false);
      refetch();
    } catch (error) {
      console.error("خطأ أثناء تحديث المستخدم:", error);
      setError("حدث خطأ أثناء تحديث المستخدم.");
      toast.error("فشل في تحديث المستخدم");
    } finally {
      setLoading(false);
    }
  };

  // دالة حذف المستخدم
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      // Get user data before deletion for logging
      const userToDeleteData = users?.find((u) => u.id === userToDelete);

      // حذف المستخدم من Firestore
      const userRef = doc(db, "users", userToDelete);
      await deleteDoc(userRef);

      // Log the user deletion
      if (currentUser && userToDeleteData) {
        await logUserDeleted(
          userToDelete,
          userToDeleteData.name,
          currentUser.id,
          currentUser.name,
        );
      }

      toast.success("تم حذف المستخدم بنجاح!");

      // إغلاق المودال وإعادة تحميل البيانات
      setUserToDelete(null);
      refetch();
    } catch (error) {
      console.error("خطأ أثناء حذف المستخدم:", error);
      toast.error("فشل في حذف المستخدم");
    }
  };

  // دالة فتح مودال ��لتعديل
  const openEditModal = (user: UserWithStats) => {
    setEditUserData({
      id: user.id,
      name: user.name,
      role: user.role,
    });
    setEditModalOpen(true);
  };

  // دالة فتح مودال إدارة الرصيد
  const openBalanceModal = (user: UserWithStats) => {
    setBalanceUser(user);
    setBalanceData({
      amount: "",
      currency: "USD",
      operation: "set",
    });
    setBalanceModalOpen(true);
  };

  // دالة فتح مودال دفع الدين
  const openPayDebtModal = (user: UserWithStats) => {
    setBalanceUser(user);
    setPayDebtData({
      paymentType: "general",
      ticketId: "",
      amount: "",
      currency: "USD",
      comment: "",
      closeTicket: false,
    });
    setPayDebtModalOpen(true);
  };

  // دالة تحديث رصيد المستخدم
  const handleUpdateUserBalance = async () => {
    if (!balanceUser || !currentUser) return;

    setError("");
    setLoading(true);

    // التحقق من صحة البيانات
    if (!balanceData.amount.trim() || Number(balanceData.amount) < 0) {
      setError("يرجى إدخال مبلغ صحيح");
      setLoading(false);
      return;
    }

    try {
      const currency = getCurrencyByCode(balanceData.currency);
      if (!currency) {
        setError("يرجى اختيار عملة صح��حة");
        setLoading(false);
        return;
      }

      // Convert amount to USD for storage
      const amountUSD = convertToUSD(Number(balanceData.amount), currency);
      const currentBalance = (balanceUser as any).userBalance || 0;

      let newBalance = 0;
      if (balanceData.operation === "set") {
        newBalance = amountUSD;
      } else if (balanceData.operation === "add") {
        newBalance = currentBalance + amountUSD;
      } else {
        newBalance = currentBalance - amountUSD;
      }

      // Update user balance in Firestore
      const userRef = doc(db, "users", balanceUser.id);
      await updateDoc(userRef, {
        userBalance: newBalance,
        preferredCurrency: balanceData.currency,
      });

      // Log the balance update
      await logUserBalanceUpdated(
        balanceUser.id,
        balanceUser.name,
        currentUser.id,
        currentUser.name,
        currentBalance,
        newBalance,
        balanceData.operation,
        balanceData.currency,
      );

      toast.success("تم تحديث رصيد المستخدم بنجاح!");
      setBalanceModalOpen(false);
      setBalanceUser(null);
      setBalanceData({ amount: "", currency: "USD", operation: "set" });
      refetch();
    } catch (error) {
      console.error("Error updating user balance:", error);
      setError("حدث خطأ أثناء تحديث الرصيد");
      toast.error("فشل في تحديث الرصيد");
    } finally {
      setLoading(false);
    }
  };

  // دالة دفع الدين من الرصيد
  const handlePayDebtFromBalance = async () => {
    if (!balanceUser || !currentUser) return;

    setError("");
    setLoading(true);

    // التحقق من صحة البيانات
    if (!payDebtData.amount.trim() || Number(payDebtData.amount) <= 0) {
      setError("يرجى إدخال مبلغ صحي��");
      setLoading(false);
      return;
    }

    // التحقق من اختيار تذكرة في حالة الدفع لتذكرة محددة
    if (payDebtData.paymentType === "ticket" && !payDebtData.ticketId) {
      setError("يرجى اختيار تذكرة");
      setLoading(false);
      return;
    }

    try {
      const currency = getCurrencyByCode(payDebtData.currency);
      if (!currency) {
        setError("يرجى اختيار عملة صحيحة");
        setLoading(false);
        return;
      }

      // Convert amount to USD
      const amountUSD = convertToUSD(Number(payDebtData.amount), currency);
      const currentBalance = (balanceUser as any).userBalance || 0;

      // Check if user has enough balance
      if (amountUSD > currentBalance) {
        setError("رصيد المستخدم غير كافي");
        setLoading(false);
        return;
      }

      // Calculate new balance
      const newBalance = currentBalance - amountUSD;

      // Update user balance
      const userRef = doc(db, "users", balanceUser.id);
      await updateDoc(userRef, {
        userBalance: newBalance,
      });

      // في حالة الدفع لتذكرة محددة، نحدث بيانات التذكرة
      if (payDebtData.paymentType === "ticket" && payDebtData.ticketId) {
        const ticketRef = doc(db, "tickets", payDebtData.ticketId);
        // جلب بيانات التذكرة الحالية
        const ticketSnap = await getDoc(ticketRef);
        if (ticketSnap.exists()) {
          const ticketData = ticketSnap.data();
          const currentPaidAmount = ticketData.paidAmount || 0;
          const currentPartialPayment = ticketData.partialPayment || 0;

          // Calculate new amounts
          const newPaidAmount = currentPaidAmount + amountUSD;
          const newPartialPayment = currentPartialPayment + amountUSD;
          const isPaid = newPaidAmount >= ticketData.amountDue;

          // Log ticket update for audit
          const changes = [
            {
              field: "paidAmount",
              oldValue: currentPaidAmount,
              newValue: newPaidAmount,
            },
            {
              field: "partialPayment",
              oldValue: currentPartialPayment,
              newValue: newPartialPayment,
            },
            {
              field: "isPaid",
              oldValue: ticketData.isPaid || false,
              newValue: isPaid,
            },
          ];

          // Add closure change if requested
          if (payDebtData.closeTicket) {
            changes.push({
              field: "isClosed",
              oldValue: ticketData.isClosed || false,
              newValue: true,
            });
          }

          const updateData: any = {
            paidAmount: newPaidAmount,
            partialPayment: newPartialPayment,
            isPaid: isPaid,
          };

          // Add closure if requested
          if (payDebtData.closeTicket) {
            updateData.isClosed = true;
          }

          await updateDoc(ticketRef, updateData);

          // Log ticket payment
          await logTicketUpdated(
            payDebtData.ticketId,
            ticketData.ticketNumber || payDebtData.ticketId,
            currentUser.id,
            currentUser.name,
            changes,
          );
        }
      }

      // Log the transaction
      const description =
        payDebtData.paymentType === "general"
          ? `خصم عام - ${payDebtData.comment || "بدون تعليق"}`
          : `دفع تذكرة رقم ${payDebtData.ticketId}`;

      await logUserDebtPaidFromBalance(
        balanceUser.id,
        balanceUser.name,
        payDebtData.ticketId || "general_deduction",
        description,
        currentUser.id,
        currentUser.name,
        amountUSD,
        balanceUser.balance, // remaining debt (debt from tickets)
        newBalance,
        payDebtData.currency,
      );

      const successMessage =
        payDebtData.paymentType === "general"
          ? "تم خصم المبلغ من رصيد المستخدم بنج��ح!"
          : "تم دفع التذكرة من رصيد المستخدم بنجاح!";

      toast.success(successMessage);
      setPayDebtModalOpen(false);
      setBalanceUser(null);
      setPayDebtData({
        paymentType: "general",
        ticketId: "",
        amount: "",
        currency: "USD",
        comment: "",
        closeTicket: false,
      });
      refetch();
    } catch (error) {
      console.error("Error paying debt from balance:", error);
      setError("��دث خطأ أثناء دفع المبلغ");
      toast.error("فشل في دفع المبلغ من الرصيد");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 space-y-4 text-black max-w-screen mx-auto"
    >
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* معلومات القسم */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <UserPlusIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  إدارة المستخدمين
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  إضافة وتعديل المستخدمين
                </p>
              </div>
            </div>

            {/* زر الإضافة */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAddModalOpen(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 text-sm"
              >
                <UserPlusIcon className="w-4 h-4" />
                <span>مستخدم جديد</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {users?.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-2xl shadow-md p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            {/* القسم الأيسر: معلومات المستخدم */}
            <div className="flex items-center gap-4 flex-1">
              <img
                src={user.photoURL || "https://via.placeholder.com/100"}
                alt={user.name}
                className="w-12 h-12 rounded-full border border-gray-200 object-cover"
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-base font-semibold text-gray-800">
                    {user.name}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                      user.role === "admin"
                        ? "bg-red-100 text-red-600"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {user.role === "admin" ? (
                      <>
                        <ShieldCheck className="w-3 h-3" />
                        مدير
                      </>
                    ) : (
                      <>
                        <User2 className="w-3 h-3" />
                        وكيل
                      </>
                    )}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {user.ticketCount} تذكرة
                </p>
                <p className="text-sm text-blue-600">
                  رصيد المحفظة:{" "}
                  {getFormattedBalance(
                    (user as any).userBalance || 0,
                    (user as any).preferredCurrency || "USD",
                  )}
                </p>
              </div>
            </div>

            {/* القسم الأيمن: المستحقات والأزرار */}
            <div className="flex flex-col sm:items-end gap-2">
              <p
                className={`text-sm font-bold ${
                  user.balance > 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                المستحق النهائي:{" "}
                {(() => {
                  const totalPartialPayments =
                    user.tickets?.reduce((sum: number, ticket: any) => {
                      return sum + (ticket.partialPayment || 0);
                    }, 0) || 0;
                  const remainingBalance = user.balance - totalPartialPayments;
                  return remainingBalance > 0
                    ? getFormattedBalance(
                        remainingBalance,
                        (user as any).preferredCurrency || "USD",
                      )
                    : "مسدد بالكامل";
                })()}
              </p>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedUser(user)}
                >
                  تفاصيل
                </Button>
                <button
                  onClick={() => openBalanceModal(user)}
                  className="p-2 rounded-full bg-green-50 hover:bg-green-100 text-green-600 transition"
                  title="إدارة الرصيد"
                >
                  <Wallet className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openPayDebtModal(user)}
                  className="p-2 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-600 transition"
                  title="دفع من الرصيد"
                >
                  <CreditCard className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openEditModal(user)}
                  className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition"
                  title="تعديل المستخدم"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setUserToDelete(user.id)}
                  className="p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition"
                  title="حذف المستخدم"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* مودال تفاصيل المستخدم */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="تفاصيل المستخد��"
      >
        {selectedUser && (
          <div className="space-y-2 text-sm">
            <p>الاسم: {selectedUser.name}</p>
            <p>المرف: {selectedUser.id}</p>
            <p>البريد الإلكتروني: {selectedUser.email}</p>
            <p>الدور: {selectedUser.role === "admin" ? "مدير" : "وكيل"}</p>
            <p>عدد التذاكر: {selectedUser.ticketCount}</p>
            <p>
              إجمالي الدين: {getFormattedBalance(selectedUser.balance, "USD")}
            </p>
            <p>
              الدفعات الجزئية:{" "}
              {getFormattedBalance(
                selectedUser.tickets?.reduce(
                  (sum: number, ticket: any) =>
                    sum + (ticket.partialPayment || 0),
                  0,
                ) || 0,
                "USD",
              )}
            </p>
            <p
              className={`font-semibold ${
                selectedUser.balance -
                  (selectedUser.tickets?.reduce(
                    (sum: number, ticket: any) =>
                      sum + (ticket.partialPayment || 0),
                    0,
                  ) || 0) >
                0
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              المستحق النهائي:{" "}
              {selectedUser.balance -
                (selectedUser.tickets?.reduce(
                  (sum: number, ticket: any) =>
                    sum + (ticket.partialPayment || 0),
                  0,
                ) || 0) >
              0
                ? getFormattedBalance(
                    selectedUser.balance -
                      (selectedUser.tickets?.reduce(
                        (sum: number, ticket: any) =>
                          sum + (ticket.partialPayment || 0),
                        0,
                      ) || 0),
                    "USD",
                  )
                : "مسدد بالكامل"}
            </p>
            <p>
              رصيد المستخدم:{" "}
              {getFormattedBalance(
                (selectedUser as any).userBalance || 0,
                (selectedUser as any).preferredCurrency || "USD",
              )}
            </p>
          </div>
        )}
      </Modal>

      {/* مودال إضافة مستخدم */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setError("");
          setNewUserData({ name: "", email: "", password: "", role: "agent" });
        }}
        title="إضافة مستخدم جديد"
      >
        <div className="space-y-3">
          <input
            type="text"
            placeholder="اسم المستخدم"
            className="input bg-slate-100 input-bordered w-full"
            value={newUserData.name}
            onChange={(e) =>
              setNewUserData((prev) => ({ ...prev, name: e.target.value }))
            }
          />

          <input
            type="email"
            placeholder="البريد الإلكتروني"
            className="input bg-slate-100 input-bordered w-full"
            value={newUserData.email}
            onChange={(e) =>
              setNewUserData((prev) => ({ ...prev, email: e.target.value }))
            }
          />

          <input
            type="password"
            placeholder="كلمة المرور (6 أحرف على الأقل)"
            className="input bg-slate-100 input-bordered w-full"
            value={newUserData.password}
            onChange={(e) =>
              setNewUserData((prev) => ({ ...prev, password: e.target.value }))
            }
          />

          <select
            className="select bg-slate-100 select-bordered w-full"
            value={newUserData.role}
            onChange={(e) =>
              setNewUserData((prev) => ({ ...prev, role: e.target.value }))
            }
          >
            <option value="agent">وكيل</option>
            <option value="admin">مدير</option>
          </select>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAddModalOpen(false);
                setError("");
                setNewUserData({
                  name: "",
                  email: "",
                  password: "",
                  role: "agent",
                });
              }}
            >
              إلغاء
            </Button>
            <Button onClick={handleCreateUser} disabled={loading}>
              {loading ? "جاري الإضافة..." : "إضافة المستخدم"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* مودال تعديل المستخدم */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setError("");
        }}
        title="تعديل بيانات المستخدم"
      >
        <div className="space-y-3">
          <input
            type="text"
            placeholder="اسم المستخدم"
            className="input bg-slate-100 input-bordered w-full"
            value={editUserData.name}
            onChange={(e) =>
              setEditUserData((prev) => ({ ...prev, name: e.target.value }))
            }
          />

          <select
            className="select bg-slate-100 select-bordered w-full"
            value={editUserData.role}
            onChange={(e) =>
              setEditUserData((prev) => ({ ...prev, role: e.target.value }))
            }
          >
            <option value="agent">وكيل</option>
            <option value="admin">مدير</option>
          </select>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditModalOpen(false);
                setError("");
              }}
            >
              إلغاء
            </Button>
            <Button onClick={handleEditUser} disabled={loading}>
              {loading ? "جاري التحديث..." : "حفظ التعديلات"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* مودال تأكيد الحذف */}
      <Modal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        title="تأكيد الحذف"
      >
        <p className="text-sm text-gray-700 mb-4">
          هل أنت متأكد أنك تريد حذف هذا المستخدم؟ هذا الإجراء لا يمكن التر��جع
          عنه.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setUserToDelete(null)}>
            إلغاء
          </Button>
          <Button
            onClick={handleDeleteUser}
            className="bg-red-600 hover:bg-red-700"
          >
            حذف المستخدم
          </Button>
        </div>
      </Modal>

      {/* مودال إدارة الرصيد */}
      <Modal
        isOpen={isBalanceModalOpen}
        onClose={() => {
          setBalanceModalOpen(false);
          setBalanceUser(null);
          setBalanceData({ amount: "", currency: "USD", operation: "set" });
          setError("");
        }}
        title="إدارة رصيد المستخدم"
      >
        {balanceUser && (
          <div className="space-y-3">
            <div className="text-sm text-gray-700 mb-4">
              <p>المستخدم: {balanceUser.name}</p>
              <p>
                الرصيد الحالي:{" "}
                {getFormattedBalance(
                  (balanceUser as any).userBalance || 0,
                  (balanceUser as any).preferredCurrency || "USD",
                )}
              </p>
            </div>

            <select
              className="select bg-slate-100 select-bordered w-full"
              value={balanceData.operation}
              onChange={(e) =>
                setBalanceData({
                  ...balanceData,
                  operation: e.target.value as "set" | "add" | "subtract",
                })
              }
            >
              <option value="set">تعيين رصيد جديد</option>
              <option value="add">إضافة للرصيد</option>
              <option value="subtract">خصم م�� الرصيد</option>
            </select>

            <select
              className="select bg-slate-100 select-bordered w-full"
              value={balanceData.currency}
              onChange={(e) =>
                setBalanceData({ ...balanceData, currency: e.target.value })
              }
            >
              {currencies?.map((currency) => (
                <option key={currency.id} value={currency.code}>
                  {currency.name} ({currency.symbol})
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="المبلغ"
              className="input bg-slate-100 input-bordered w-full"
              value={
                balanceData.amount === ""
                  ? ""
                  : Number(balanceData.amount).toLocaleString("en-US")
              }
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, "");
                if (/^\d*\.?\d*$/.test(raw)) {
                  setBalanceData({ ...balanceData, amount: raw });
                }
              }}
            />

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setBalanceModalOpen(false);
                  setBalanceUser(null);
                  setBalanceData({
                    amount: "",
                    currency: "USD",
                    operation: "set",
                  });
                  setError("");
                }}
              >
                إلغاء
              </Button>
              <Button onClick={handleUpdateUserBalance} disabled={loading}>
                {loading ? "جاري التحديث..." : "تحديث الرصيد"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ��ودال دفع الدين من الرصيد */}
      <Modal
        isOpen={isPayDebtModalOpen}
        onClose={() => {
          setPayDebtModalOpen(false);
          setBalanceUser(null);
          setPayDebtData({
            paymentType: "general",
            ticketId: "",
            amount: "",
            currency: "USD",
            comment: "",
            closeTicket: false,
          });
          setError("");
        }}
        title="دفع دين من رصيد المستخدم"
      >
        {balanceUser && (
          <div className="space-y-3">
            <div className="text-sm text-gray-700 mb-4">
              <p>المستخدم: {balanceUser.name}</p>
              <p>
                الرصيد المتاح:{" "}
                {getFormattedBalance(
                  (balanceUser as any).userBalance || 0,
                  (balanceUser as any).preferredCurrency || "USD",
                )}
              </p>
              <p>
                الدين المستحق:{" "}
                {getFormattedBalance(balanceUser.balance || 0, "USD")}
              </p>
            </div>

            {/* نوع العملية */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                نوع العملية
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="general"
                    checked={payDebtData.paymentType === "general"}
                    onChange={(e) =>
                      setPayDebtData({
                        ...payDebtData,
                        paymentType: e.target.value as "general" | "ticket",
                        ticketId: "",
                      })
                    }
                    className="radio radio-primary"
                  />
                  <span className="text-sm">خصم عام</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="ticket"
                    checked={payDebtData.paymentType === "ticket"}
                    onChange={(e) =>
                      setPayDebtData({
                        ...payDebtData,
                        paymentType: e.target.value as "general" | "ticket",
                        comment: "",
                      })
                    }
                    className="radio radio-primary"
                  />
                  <span className="text-sm">دفع تذكرة محددة</span>
                </label>
              </div>
            </div>

            <PaymentInputs
              balanceUser={balanceUser}
              payDebtData={payDebtData}
              setPayDebtData={setPayDebtData}
              currencies={currencies}
            />

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setPayDebtModalOpen(false);
                  setBalanceUser(null);
                  setPayDebtData({
                    paymentType: "general",
                    ticketId: "",
                    amount: "",
                    currency: "USD",
                    comment: "",
                    closeTicket: false,
                  });
                  setError("");
                }}
              >
                إلغاء
              </Button>
              <Button onClick={handlePayDebtFromBalance} disabled={loading}>
                {loading
                  ? "جاري العملية..."
                  : payDebtData.paymentType === "general"
                    ? "خصم من الرصيد"
                    : "دفع التذكرة"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
