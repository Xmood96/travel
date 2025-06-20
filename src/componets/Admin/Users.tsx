import { useState } from "react";
import { UserPlusIcon, Edit, Trash2 } from "lucide-react";
import { useUsersWithStats, type UserWithStats } from "../../api/getusers";
import { Button } from "../ui/botom";
import { Modal } from "../ui/modal";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../api/Firebase";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

export default function Users() {
  const { data: users, isLoading, refetch } = useUsersWithStats();

  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // بيانات المستخدم الجديد
  const [newUserData, setNewUserData] = useState({
    name: "",
    role: "agent",
  });

  // بيانات المستخدم للتعديل
  const [editUserData, setEditUserData] = useState({
    id: "",
    name: "",
    role: "agent",
  });

  // رسالة خطأ
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isLoading) return <div>جار التحميل...</div>;

  // دالة إضافة مستخدم جديد
  const handleCreateUser = async () => {
    setError("");
    setLoading(true);

    if (!newUserData.name.trim()) {
      setError("يرجى إدخال اسم المستخدم.");
      setLoading(false);
      return;
    }

    try {
      // إنشاء ID فريد للمستخدم
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // إضافة المستخدم إلى Firestore
      await addDoc(collection(db, "users"), {
        id: userId,
        name: newUserData.name.trim(),
        email: "", // بريد فارغ
        role: newUserData.role,
        photoURL: "https://via.placeholder.com/100", // صورة افتراضية
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });

      toast.success("تم إضافة المستخدم بنجاح!");
      
      // تنظيف البيانات وإغلاق المودال
      setAddModalOpen(false);
      setNewUserData({ name: "", role: "agent" });
      
      // إعادة تحميل قائمة المستخدمين
      refetch();
    } catch (error) {
      console.error("خطأ أثناء إضافة المستخدم:", error);
      setError("حدث خطأ أثناء إضافة المستخدم.");
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
      // العثور على المستخدم في القائمة للحصول على document ID
      const userDoc = users?.find(u => u.id === editUserData.id);
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
      // حذف المستخدم من Firestore
      const userRef = doc(db, "users", userToDelete);
      await deleteDoc(userRef);

      toast.success("تم حذف المستخدم بنجاح!");
      
      // إغلاق المودال وإعادة تحميل البيانات
      setUserToDelete(null);
      refetch();
    } catch (error) {
      console.error("خطأ أثناء حذف المستخدم:", error);
      toast.error("فشل في حذف المستخدم");
    }
  };

  // دالة فتح مودال التعديل
  const openEditModal = (user: UserWithStats) => {
    setEditUserData({
      id: user.id,
      name: user.name,
      role: user.role,
    });
    setEditModalOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 space-y-4 text-black max-w-md mx-auto"
    >
      <div className="flex justify-between flex-row items-center">
        <h1 className="text-xl font-bold">إدارة المستخدمين</h1>
        <Button onClick={() => setAddModalOpen(true)}>
          <UserPlusIcon className="w-6 h-6 ml-1" />
        </Button>
      </div>

      <div className="space-y-3">
        {users?.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-lg shadow-sm px-4 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <img
                src={user.photoURL || "https://via.placeholder.com/100"}
                alt={user.name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-gray-500">
                  {user.role === "admin" ? "مدير" : "وكيل"} • {user.ticketCount} تذكرة
                </p>
              </div>
            </div>

            <div className="text-right flex gap-2 items-center">
              <p
                className={`font-bold text-sm ${
                  user.balance > 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {Number(user.balance).toLocaleString("en-US")} ر.س
              </p>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedUser(user)}
                >
                  تفاصيل
                </Button>
                <button
                  onClick={() => openEditModal(user)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setUserToDelete(user.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
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
        title="تفاصيل المستخدم"
      >
        {selectedUser && (
          <div className="space-y-2 text-sm">
            <p>الاسم: {selectedUser.name}</p>
            <p>المعرف: {selectedUser.id}</p>
            <p>الدور: {selectedUser.role === "admin" ? "مدير" : "وكيل"}</p>
            <p>عدد التذاكر: {selectedUser.ticketCount}</p>
            <p>
              المتبقي: {Number(selectedUser.balance).toLocaleString("en-US")} ر.س
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
          setNewUserData({ name: "", role: "agent" });
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
                setNewUserData({ name: "", role: "agent" });
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
          هل أنت متأكد أنك تريد حذف هذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setUserToDelete(null)}
          >
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
    </motion.div>
  );
}