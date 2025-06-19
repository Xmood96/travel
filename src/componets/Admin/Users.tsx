import { useState } from "react";
import { UserPlusIcon } from "lucide-react";
import { useUsersWithStats, type UserWithStats } from "../../api/getusers";
import { Button } from "../ui/botom";
import { Modal } from "../ui/modal";
// import { type UserRole } from "../../types"; // تعليق الاستيراد غير المستخدم
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { addDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../../api/Firebase";
import { motion } from "framer-motion";

export default function Users() {
  const { data: users, isLoading } = useUsersWithStats();

  const auth = getAuth();

  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [isAddModalOpen, setAddModalOpen] = useState(false);

  // بيانات المستخدم الجديد
  const [newUserData, setNewUserData] = useState({
    email: "",
    password: "",
    name: "",
    role: "agent",
  });

  // مودال طلب كلمة السر الحالي
  const [isConfirmPasswordOpen, setConfirmPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");

  // رسالة خطأ
  const [error, setError] = useState("");

  if (isLoading) return <div>جار التحميل...</div>;

  // دالة إنشاء مستخدم جديد بعد التأكد من كلمة السر الأصلية

  const handleCreateUser = async () => {
    setError("");

    if (!newUserData.email || !newUserData.password || !newUserData.name) {
      setError("يرجى تعبئة كل الحقول.");
      return;
    }

    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserData.email)) {
      setError("البريد الإلكتروني غير صالح.");
      return;
    }

    // التحقق من قوة كلمة المرور (8 أحرف على الأقل)
    if (newUserData.password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
      return;
    }

    try {
      // حفظ معلومات المستخدم الحالي (المسؤول)
      const adminUser = auth.currentUser;
      if (!adminUser) {
        setError("لم يتم العثور على المستخدم الحالي.");
        return;
      }

      // إنشاء مستخدم جديد
      const newUserCredential = await createUserWithEmailAndPassword(
        auth,
        newUserData.email,
        newUserData.password
      );

      const newUser = newUserCredential.user;

      // إضافة بيانات المستخدم إلى Firestore
      await addDoc(collection(db, "users"), {
        uid: newUser.uid,
        name: newUserData.name,
        email: newUserData.email,
        role: newUserData.role,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });

      // إزالة المستخدم الجديد من Firebase Auth
      await newUser.delete();

      // تنظيف البيانات
      setAddModalOpen(false);
      setNewUserData({ email: "", password: "", name: "", role: "agent" });
      
      // تحديث قائمة المستخدمين (بدلاً من إعادة تحميل الصفحة)
      const usersRef = collection(db, "users");
      const querySnapshot = await getDocs(usersRef);
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // تحديث حالة المستخدم الحالي
      await updateProfile(adminUser, {
        displayName: adminUser.displayName
      });

    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("حدث خطأ غير معروف.");
      }
      console.error("خطأ أثناء إنشاء المستخدم:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 space-y-4 text-black  max-w-md mx-auto"
    >
      <div className="flex justify-between flex-row items-center">
        <h1 className="text-xl font-bold">إدارة المستخدمين</h1>
        <Button onClick={() => setAddModalOpen(true)}>
          <UserPlusIcon className="w-6 h-6 ml-1" />
        </Button>
      </div>

      <div className="space-y-3 ">
        {users?.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-lg shadow-sm px-4 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <img
                src={user.photoURL}
                alt={user.name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-gray-500">
                  {user.ticketCount} تذكرة
                </p>
              </div>
            </div>

            <div className="text-right flex gap-2 items-center">
              <p
                className={`font-bold ${
                  user.balance > 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {Number(user.balance).toLocaleString("en-US")} ر.س
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedUser(user)}
              >
                تفاصيل
              </Button>

              {/* زر حذف */}
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
            <p>البريد: {selectedUser.email}</p>
            <p>الدور: {selectedUser.role}</p>
            <p>عدد التذاكر: {selectedUser.ticketCount}</p>
            <p>
              المتبقي: {Number(selectedUser.balance).toLocaleString("en-US")}{" "}
              ر.س
            </p>
          </div>
        )}
      </Modal>

      {/* مودال إضافة مستخدم */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="إضافة مستخدم"
      >
        <div className="space-y-3 ">
          <input
            type="text"
            placeholder="الاسم"
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
            placeholder="كلمة المرور"
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
            <option value="admin">ادمن</option>
            <option value="agent">ايجنت</option>
          </select>

          <Button
            onClick={() => {
              setAddModalOpen(false);
              setConfirmPasswordOpen(true);
            }}
          >
            التالي: تأكيد كلمة السر
          </Button>
        </div>
      </Modal>

      {/* مودال تأكيد كلمة السر للمستخدم الحالي */}
      <Modal
        isOpen={isConfirmPasswordOpen}
        onClose={() => setConfirmPasswordOpen(false)}
        title="تأكيد كلمة السر للمستخدم الحالي"
      >
        <div className="space-y-3">
          <input
            type="password"
            placeholder="أدخل كلمة السر الحالية"
            className="input bg-slate-100 text-black input-bordered w-full"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          {error && <p className="text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmPasswordOpen(false)}
            >
              إلغاء
            </Button>
            <Button onClick={handleCreateUser}>تأكيد وإضافة المستخدم</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
