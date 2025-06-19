// src/components/UserProfile.tsx
import { useState, useRef } from "react";

import { motion } from "framer-motion";
import { Upload, UserCircle } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../api/Firebase";
import { signOut } from "firebase/auth";

const UserProfile = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("🚪 تم تسجيل الخروج بنجاح");
      // يمكنك التوجيه إلى صفحة تسجيل الدخول
      // مثلا: navigate("/login"); إذا كنت تستخدم react-router
    } catch (error) {
      toast.error("❌ حدث خطأ أثناء تسجيل الخروج");
      console.error(error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "Categories");

    setLoading(true);
    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dvm1red5z/image/upload",
        { method: "POST", body: formData }
      );
      const data = await res.json();
      setPhotoURL(data.secure_url);
      toast.success("تم رفع الصورة بنجاح");
    } catch (err) {
      toast.error("فشل رفع الصورة");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      const ref = doc(db, "users", user.id);
      await updateDoc(ref, { name, photoURL });
      toast.success("تم التحديث بنجاح");
      console.log(5);
    } catch (err) {
      console.log(err);

      toast.error("فشل التحديث");
    }
  };

  return (
    <div dir="rtl" className="min-h-screen p-4 space-y-6 max-w-md mx-auto">
      <motion.div
        className="max-w-md mx-auto p-6 mt-5 bg-white shadow-xl  rounded-2xl "
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <img
              src={photoURL || "https://via.placeholder.com/100"}
              alt="profile"
              className="w-24 h-24 rounded-full object-cover border-2 border-primary"
            />
            <button
              className="absolute bottom-0 right-0 bg-primary p-1 rounded-full text-white"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4" />
            </button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>

          <div className="w-full gap-3 flex flex-col">
            <label className="label">الاسم</label>
            <div className="flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input input-bordered text-slate-500  bg-blue-100 rounded-2xl text-center text-2xl  w-full"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="btn border-0 w-46 mt-4 rounded-lg   bg-blue-300"
          >
            حفظ التعديلات
          </button>
          <button
            onClick={handleLogout}
            className="btn bg-red-500 text-white hover:bg-red-600  border-0 w-46 mt-4 rounded-lg "
          >
            تسجيل الخروج
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default UserProfile;
