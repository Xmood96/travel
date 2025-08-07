import { useState } from "react";
import {
  UserPlus,
  Edit3,
  Trash2,
  Wallet,
  User,
  Mail,
  Shield,
  Search,
  Camera,
} from "lucide-react";
import { useUsersWithStats, type UserWithStats } from "../../api/getusers";
import { deleteDoc, doc, updateDoc, setDoc } from "firebase/firestore";
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
} from "../../api/loggingService";
import { useAuth } from "../../context/AuthContext";

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

export default function ModernUsers() {
  const { data: users, isLoading, refetch } = useUsersWithStats();
  const { data: currencies } = useCurrencies();
  const { getCurrencyByCode, getFormattedBalance } = useCurrencyUtils();
  const { user: currentUser } = useAuth();

  // State management
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isBalanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceUser, setBalanceUser] = useState<UserWithStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Form data
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    role: "agent",
    preferredCurrency: "USD",
    photoURL:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
  });

  const [editUserData, setEditUserData] = useState({
    id: "",
    name: "",
    role: "agent",
    preferredCurrency: "USD",
    photoURL: "",
  });

  const [balanceData, setBalanceData] = useState({
    amount: "",
    currency: "USD",
    operation: "set" as "set" | "add" | "subtract",
  });

  // Filter users based on search and role
  const filteredUsers =
    users?.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    }) || [];

  // Currency options for selects
  const currencyOptions =
    currencies?.map((currency) => ({
      value: currency.code,
      label: `${currency.name} (${currency.symbol})`,
    })) || [];

  const roleOptions = [
    { value: "agent", label: "وكيل" },
    { value: "admin", label: "مدير" },
  ];

  const filterOptions = [
    { value: "all", label: "جميع الم��تخدمين" },
    { value: "admin", label: "المديرين" },
    { value: "agent", label: "الوكلاء" },
  ];

  // User creation
  const handleCreateUser = async () => {
    if (
      !newUserData.name.trim() ||
      !newUserData.email.trim() ||
      !newUserData.password.trim()
    ) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }

    if (newUserData.password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserData.email)) {
      toast.error("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUserData.email.trim(),
        newUserData.password,
      );

      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        name: newUserData.name.trim(),
        email: newUserData.email.trim(),
        role: newUserData.role,
        preferredCurrency: newUserData.preferredCurrency,
        photoURL: newUserData.photoURL,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });

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

      toast.success("تم إضافة المستخدم بنجاح!");
      setAddModalOpen(false);
      setNewUserData({
        name: "",
        email: "",
        password: "",
        role: "agent",
        preferredCurrency: "USD",
        photoURL:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
      });
      refetch();
    } catch (error: any) {
      console.error("خطأ أثناء إضافة المستخدم:", error);
      if (error.code === "auth/email-already-in-use") {
        toast.error("هذا البريد الإلكتروني مستخدم بالفعل");
      } else if (error.code === "auth/weak-password") {
        toast.error("كلمة المرور ضعيفة جداً");
      } else {
        toast.error("حدث خطأ أثناء إضافة المستخدم");
      }
    } finally {
      setLoading(false);
    }
  };

  // User editing
  const handleEditUser = async () => {
    if (!editUserData.name.trim()) {
      toast.error("يرجى إدخال اسم المستخدم");
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, "users", editUserData.id);
      await updateDoc(userRef, {
        name: editUserData.name.trim(),
        role: editUserData.role,
        preferredCurrency: editUserData.preferredCurrency,
        photoURL: editUserData.photoURL,
      });

      if (currentUser) {
        const changes = `الاسم: ${editUserData.name.trim()}، الدور: ${editUserData.role === "admin" ? "مدير" : "وكيل"}، العملة: ${editUserData.preferredCurrency}`;
        await logUserUpdated(
          editUserData.id,
          editUserData.name.trim(),
          currentUser.id,
          currentUser.name,
          changes,
        );
      }

      toast.success("تم تحدي�� بيانات المستخدم بنجاح!");
      setEditModalOpen(false);
      refetch();
    } catch (error) {
      console.error("خطأ أثناء تحديث المستخدم:", error);
      toast.error("حدث خطأ أثناء تحديث المستخدم");
    } finally {
      setLoading(false);
    }
  };

  // User deletion
  const handleDeleteUser = async () => {
    if (!userToDelete || !currentUser) return;

    const userToDeleteData = users?.find((u) => u.id === userToDelete);
    if (!userToDeleteData) return;

    try {
      const userRef = doc(db, "users", userToDelete);
      await deleteDoc(userRef);

      await logUserDeleted(
        userToDelete,
        userToDeleteData.name,
        currentUser.id,
        currentUser.name,
      );

      toast.success("��م حذف المستخدم بنجاح!");
      setUserToDelete(null);
      refetch();
    } catch (error) {
      console.error("خطأ أثناء حذف المستخدم:", error);
      toast.error("فشل في حذف المستخدم");
    }
  };

  // Balance management
  const handleUpdateUserBalance = async () => {
    if (!balanceUser || !currentUser) return;

    if (!balanceData.amount.trim() || Number(balanceData.amount) < 0) {
      toast.error("يرجى إدخال مب��غ صحيح");
      return;
    }

    setLoading(true);
    try {
      const currency = getCurrencyByCode(balanceData.currency);
      if (!currency) {
        toast.error("يرجى اختيار عملة صحيحة");
        return;
      }

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

      const userRef = doc(db, "users", balanceUser.id);
      await updateDoc(userRef, {
        userBalance: newBalance,
        preferredCurrency: balanceData.currency,
      });

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
      toast.error("حدث خطأ أثناء تحديث الرصيد");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user: UserWithStats) => {
    setEditUserData({
      id: user.id,
      name: user.name,
      role: user.role,
      preferredCurrency: user.preferredCurrency || "USD",
      photoURL: user.photoURL || "",
    });
    setEditModalOpen(true);
  };

  const openBalanceModal = (user: UserWithStats) => {
    setBalanceUser(user);
    setBalanceData({
      amount: "",
      currency: user.preferredCurrency || "USD",
      operation: "set",
    });
    setBalanceModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">
            جاري تحميل المستخدمين...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Container>
        <PageHeader
          title="إدارة المستخدمين"
          subtitle={`${filteredUsers.length} مستخدم مسجل في النظام`}
          action={
            <ModernButton
              onClick={() => setAddModalOpen(true)}
              icon={<UserPlus size={16} />}
              size="md"
            >
              إضافة مستخدم جديد
            </ModernButton>
          }
        />

        <div className="py-8">
          {/* Search and Filter Section */}
          <Section className="mb-8">
            <Stack
              direction="horizontal"
              spacing={4}
              align="end"
              className="flex-wrap"
            >
              <div className="flex-1 min-w-64">
                <ModernInput
                  placeholder="البحث عن مستخدم..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search size={16} />}
                  variant="glass"
                />
              </div>
              <div className="min-w-48">
                <ModernSelect
                  options={filterOptions}
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  variant="glass"
                />
              </div>
            </Stack>
          </Section>

          {/* Users Grid */}
          <Grid cols={{ base: 1, md: 2, lg: 3 }} gap={6}>
            {filteredUsers.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <ModernCard variant="glass" hover>
                  <CardHeader
                    title={user.name}
                    subtitle={user.email}
                    icon={
                      <img
                        src={
                          user.photoURL ||
                          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=80"
                        }
                        alt={user.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    }
                    action={
                      <div className="flex items-center gap-1">
                        <IconButton
                          icon={<Edit3 size={14} />}
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(user)}
                          tooltip="تعديل"
                        />
                        <IconButton
                          icon={<Wallet size={14} />}
                          variant="ghost"
                          size="sm"
                          onClick={() => openBalanceModal(user)}
                          tooltip="إدارة الرصيد"
                        />
                        <IconButton
                          icon={<Trash2 size={14} />}
                          variant="danger"
                          size="sm"
                          onClick={() => setUserToDelete(user.id)}
                          tooltip="حذف"
                        />
                      </div>
                    }
                  />

                  <CardContent>
                    <Stack spacing={3}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">الدور:</span>
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {user.role === "admin" ? "مدير" : "وكيل"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">عدد التذاكر:</span>
                        <span className="font-medium">{user.ticketCount}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">الدين المستحق:</span>
                        <span
                          className={`font-medium ${user.balance > 0 ? "text-red-600" : "text-green-600"}`}
                        >
                          {getFormattedBalance(
                            user.balance,
                            user.preferredCurrency || "USD",
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">رصيد المستخدم:</span>
                        <span className="font-medium text-blue-600">
                          {getFormattedBalance(
                            (user as any).userBalance || 0,
                            user.preferredCurrency || "USD",
                          )}
                        </span>
                      </div>
                    </Stack>
                  </CardContent>

                  <CardFooter>
                    <ModernButton
                      variant="outline"
                      size="sm"
                      fullWidth
                      onClick={() => setSelectedUser(user)}
                    >
                      عرض التفاصيل
                    </ModernButton>
                  </CardFooter>
                </ModernCard>
              </motion.div>
            ))}
          </Grid>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا توجد نتائج
              </h3>
              <p className="text-gray-500">
                لم يتم العثور على مستخدمين يطابقون البحث
              </p>
            </div>
          )}
        </div>
      </Container>

      {/* User Details Modal */}
      <ModernModal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="تفاصيل المستخدم"
        size="md"
      >
        {selectedUser && (
          <Stack spacing={4}>
            <div className="flex items-center gap-4">
              <img
                src={
                  selectedUser.photoURL ||
                  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=80"
                }
                alt={selectedUser.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                <p className="text-gray-500">{selectedUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">المعرف:</span>
                <p className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">
                  {selectedUser.id}
                </p>
              </div>
              <div>
                <span className="text-gray-500">الدور:</span>
                <p className="font-medium mt-1">
                  {selectedUser.role === "admin" ? "مدير" : "وكيل"}
                </p>
              </div>
              <div>
                <span className="text-gray-500">عدد التذاكر:</span>
                <p className="font-medium mt-1">{selectedUser.ticketCount}</p>
              </div>
              <div>
                <span className="text-gray-500">العملة المفضلة:</span>
                <p className="font-medium mt-1">
                  {selectedUser.preferredCurrency || "USD"}
                </p>
              </div>
              <div>
                <span className="text-gray-500">الدين المستحق:</span>
                <p
                  className={`font-medium mt-1 ${selectedUser.balance > 0 ? "text-red-600" : "text-green-600"}`}
                >
                  {getFormattedBalance(
                    selectedUser.balance,
                    selectedUser.preferredCurrency || "USD",
                  )}
                </p>
              </div>
              <div>
                <span className="text-gray-500">رصيد المستخدم:</span>
                <p className="font-medium text-blue-600 mt-1">
                  {getFormattedBalance(
                    (selectedUser as any).userBalance || 0,
                    selectedUser.preferredCurrency || "USD",
                  )}
                </p>
              </div>
            </div>
          </Stack>
        )}
      </ModernModal>

      {/* Add User Modal */}
      <ModernModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="إضافة مستخدم جديد"
        size="md"
      >
        <Stack spacing={4}>
          <div className="text-center">
            <div className="relative inline-block">
              <img
                src={newUserData.photoURL}
                alt="صورة المستخدم"
                className="w-20 h-20 rounded-full object-cover mx-auto"
              />
              <IconButton
                icon={<Camera size={14} />}
                variant="primary"
                size="sm"
                className="absolute bottom-0 right-0"
                onClick={() => {
                  const photos = [
                    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
                    "https://images.unsplash.com/photo-1494790108755-2616b5107edb?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
                    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
                  ];
                  const randomPhoto =
                    photos[Math.floor(Math.random() * photos.length)];
                  setNewUserData({ ...newUserData, photoURL: randomPhoto });
                }}
              />
            </div>
          </div>

          <ModernInput
            label="اسم المستخدم"
            placeholder="أدخل الاسم الكامل"
            value={newUserData.name}
            onChange={(e) =>
              setNewUserData({ ...newUserData, name: e.target.value })
            }
            icon={<User size={16} />}
          />

          <ModernInput
            label="البريد الإلكتروني"
            type="email"
            placeholder="user@example.com"
            value={newUserData.email}
            onChange={(e) =>
              setNewUserData({ ...newUserData, email: e.target.value })
            }
            icon={<Mail size={16} />}
          />

          <ModernInput
            label="كلمة المرور"
            type="password"
            placeholder="كلمة مرور قوية (6 أحرف على الأقل)"
            value={newUserData.password}
            onChange={(e) =>
              setNewUserData({ ...newUserData, password: e.target.value })
            }
            icon={<Shield size={16} />}
          />

          <ModernSelect
            label="الدور"
            options={roleOptions}
            value={newUserData.role}
            onChange={(e) =>
              setNewUserData({ ...newUserData, role: e.target.value })
            }
          />

          <ModernSelect
            label="العملة المفضلة"
            options={currencyOptions}
            value={newUserData.preferredCurrency}
            onChange={(e) =>
              setNewUserData({
                ...newUserData,
                preferredCurrency: e.target.value,
              })
            }
          />

          <Stack direction="horizontal" spacing={3}>
            <ModernButton
              variant="outline"
              fullWidth
              onClick={() => setAddModalOpen(false)}
            >
              إلغاء
            </ModernButton>
            <ModernButton
              variant="primary"
              fullWidth
              loading={loading}
              onClick={handleCreateUser}
            >
              إضافة المستخدم
            </ModernButton>
          </Stack>
        </Stack>
      </ModernModal>

      {/* Edit User Modal */}
      <ModernModal
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="تعديل بيانات المستخدم"
        size="md"
      >
        <Stack spacing={4}>
          <div className="text-center">
            <div className="relative inline-block">
              <img
                src={
                  editUserData.photoURL ||
                  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=80"
                }
                alt="صورة المستخدم"
                className="w-20 h-20 rounded-full object-cover mx-auto"
              />
              <IconButton
                icon={<Camera size={14} />}
                variant="primary"
                size="sm"
                className="absolute bottom-0 right-0"
                onClick={() => {
                  const photos = [
                    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
                    "https://images.unsplash.com/photo-1494790108755-2616b5107edb?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
                    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
                  ];
                  const randomPhoto =
                    photos[Math.floor(Math.random() * photos.length)];
                  setEditUserData({ ...editUserData, photoURL: randomPhoto });
                }}
              />
            </div>
          </div>

          <ModernInput
            label="اسم المستخدم"
            placeholder="أدخل الاسم الكامل"
            value={editUserData.name}
            onChange={(e) =>
              setEditUserData({ ...editUserData, name: e.target.value })
            }
            icon={<User size={16} />}
          />

          <ModernSelect
            label="الدور"
            options={roleOptions}
            value={editUserData.role}
            onChange={(e) =>
              setEditUserData({ ...editUserData, role: e.target.value })
            }
          />

          <ModernSelect
            label="العملة المفضلة"
            options={currencyOptions}
            value={editUserData.preferredCurrency}
            onChange={(e) =>
              setEditUserData({
                ...editUserData,
                preferredCurrency: e.target.value,
              })
            }
          />

          <Stack direction="horizontal" spacing={3}>
            <ModernButton
              variant="outline"
              fullWidth
              onClick={() => setEditModalOpen(false)}
            >
              إلغاء
            </ModernButton>
            <ModernButton
              variant="primary"
              fullWidth
              loading={loading}
              onClick={handleEditUser}
            >
              حفظ التغييرات
            </ModernButton>
          </Stack>
        </Stack>
      </ModernModal>

      {/* Balance Management Modal */}
      <ModernModal
        isOpen={isBalanceModalOpen}
        onClose={() => setBalanceModalOpen(false)}
        title="إدارة رصيد المستخدم"
        size="md"
      >
        {balanceUser && (
          <Stack spacing={4}>
            <div className="bg-blue-50 p-4 rounded-xl">
              <h4 className="font-medium text-blue-900 mb-2">
                {balanceUser.name}
              </h4>
              <p className="text-sm text-blue-700">
                الرصيد الحالي:{" "}
                {getFormattedBalance(
                  (balanceUser as any).userBalance || 0,
                  balanceUser.preferredCurrency || "USD",
                )}
              </p>
            </div>

            <ModernSelect
              label="نوع العملية"
              options={[
                { value: "set", label: "تعيين رصيد جديد" },
                { value: "add", label: "إضافة للرصيد" },
                { value: "subtract", label: "خصم من الرصيد" },
              ]}
              value={balanceData.operation}
              onChange={(e) =>
                setBalanceData({
                  ...balanceData,
                  operation: e.target.value as "set" | "add" | "subtract",
                })
              }
            />

            <ModernSelect
              label="العملة"
              options={currencyOptions}
              value={balanceData.currency}
              onChange={(e) =>
                setBalanceData({ ...balanceData, currency: e.target.value })
              }
            />

            <ModernInput
              label="المبلغ"
              type="number"
              placeholder="0"
              value={balanceData.amount}
              onChange={(e) =>
                setBalanceData({ ...balanceData, amount: e.target.value })
              }
              icon={<Wallet size={16} />}
            />

            <Stack direction="horizontal" spacing={3}>
              <ModernButton
                variant="outline"
                fullWidth
                onClick={() => setBalanceModalOpen(false)}
              >
                إلغاء
              </ModernButton>
              <ModernButton
                variant="primary"
                fullWidth
                loading={loading}
                onClick={handleUpdateUserBalance}
              >
                تحديث الرصيد
              </ModernButton>
            </Stack>
          </Stack>
        )}
      </ModernModal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title="تأكيد حذف المستخدم"
        message="هل أنت متأكد أنك تريد حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف المستخدم"
        cancelText="إلغاء"
        variant="danger"
      />
    </div>
  );
}
