import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Mail, Lock } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../api/Firebase";

type FormData = {
  email: string;
  password: string;
};

const Login: React.FC = () => {
  const { register, handleSubmit } = useForm<FormData>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      console.log("تم تسجيل الدخول بنجاح!");
      // يمكنك التوجيه هنا باستخدام useNavigate من react-router-dom
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <motion.div
        className="bg-white p-8 rounded shadow-md w-full max-w-md"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-sky-600 mb-6 text-center">
          تسجيل الدخول
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 mb-4 rounded text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              البريد الإلكتروني
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-2.5 text-gray-400"
                size={20}
              />
              <input
                id="email"
                type="email"
                {...register("email")}
                className="pl-10 mt-1 block w-full px-3 py-2 border text-slate-600 border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              كلمة المرور
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-2.5 text-gray-400"
                size={20}
              />
              <input
                id="password"
                type="password"
                {...register("password")}
                className="pl-10 mt-1 block w-full px-3 py-2 text-slate-600 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md text-white ${
              loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {loading ? "...جاري الدخول" : "دخول"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
