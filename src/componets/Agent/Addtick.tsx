import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useAppData } from "../../api/useAppData";
import { useUsersWithStats } from "../../api/getusers";
import type { Ticket } from "../../types";
import { useAuth } from "../../context/AuthContext";

export default function AddTicketForm({
  userId,
}: {
  userId: string | undefined;
}) {
  const [form, setForm] = useState({
    ticketNumber: "",
    agentId: "",
    selectedUserId: "", // المستخدم المختار
    paidAmount: "" as string,
    amountDue: "" as string,
    isPaid: false,
  });

  const [loading, setLoading] = useState(false);

  const { createTicket, agentsQuery, updateAgentBalance } = useAppData();
  const { data: users } = useUsersWithStats(); // جلب قائمة المستخدمين
  const { user } = useAuth();

  // التحقق من أن المستخدم هو أدمن
  if (user?.role !== "admin") {
    return null; // لا يظهر المكون إذا لم يكن أدمن
  }

  const handleSubmit = async () => {
    if (!form.ticketNumber || !form.agentId || !form.selectedUserId) {
      return toast.error("يرجى تعبئة جميع الحقول المطلوبة");
    }

    if (!form.paidAmount || !form.amountDue) {
      return toast.error("يرجى إدخال المبالغ المطلوبة");
    }

    setLoading(true);
    try {
      console.log("Form Data: ", form);

      // ✅ الحصول على بيانات الوكيل المختار
      const agent = agentsQuery.data?.find((a) => a.id === form.agentId);
      if (!agent) {
        toast.error("لم يتم العثور على البائع المحدد");
        setLoading(false);
        return;
      }

      // ✅ حساب الرصيد الجديد (يمكن أن يكون سالب)
      const newBalance = agent.balance - Number(form.paidAmount);

      // ✅ إضافة التذكرة مع معرف المستخدم المختار
      await createTicket.mutateAsync({
        ...form,
        createdAt: new Date().toISOString(),
        createdByUserId: form.selectedUserId, // استخدام المستخدم المختار
      } as unknown as Omit<Ticket, "id">);

      // ✅ تحديث رصيد الوكيل (حتى لو أصبح سالب)
      await updateAgentBalance.mutateAsync({
        id: agent.id,
        newBalance,
      });

      toast.success("✅ تم إضافة التذكرة وتحديث الرصيد بنجاح!");

      // ✅ إعادة تعيين النموذج
      setForm({
        ticketNumber: "",
        agentId: "",
        selectedUserId: "",
        paidAmount: "",
        amountDue: "",
        isPaid: false,
      });
    } catch (err) {
      console.error("❌ خطأ في إضافة التذكرة:", err);
      toast.error("حدث خطأ أثناء الإضافة");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // الأدمن دائماً يضع التذاكر كمدفوعة للإدارة
    setForm((prev) => ({ ...prev, isPaid: true }));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-4 rounded-xl shadow-md space-y-3"
    >
      <h2 className="text-lg font-bold text-right text-blue-600">
        إضافة تذكرة جديدة (الأدمن فقط)
      </h2>

      {/* رقم التذكرة */}
      <input
        type="text"
        placeholder="رقم التذكرة"
        value={form.ticketNumber}
        onChange={(e) => setForm({ ...form, ticketNumber: e.target.value })}
        className="input bg-blue-100 input-bordered w-full text-right"
      />

      {/* اختيار المستخدم */}
      <select
        className="select bg-blue-100 select-bordered w-full text-right"
        value={form.selectedUserId}
        onChange={(e) => setForm({ ...form, selectedUserId: e.target.value })}
      >
        <option disabled value="">
          اختر المستخدم
        </option>
        {users?.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.role === "admin" ? "مدير" : "وكيل"})
          </option>
        ))}
      </select>

      {/* اختيار البائع */}
      <select
        className="select bg-blue-100 select-bordered w-full text-right"
        value={form.agentId}
        onChange={(e) => setForm({ ...form, agentId: e.target.value })}
      >
        <option disabled value="">
          اختر البائع
        </option>
        {agentsQuery.data?.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name} (الرصيد: {agent.balance.toLocaleString("en-US")} ر.س)
          </option>
        ))}
      </select>

      {/* المبالغ */}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2">
          <h1 className="text-center">المدفوع من المحفظة</h1>
          <input
            type="text"
            placeholder=""
            inputMode="numeric"
            value={
              form.paidAmount === ""
                ? ""
                : Number(form.paidAmount).toLocaleString("en-US")
            }
            onChange={(e) => {
              const raw = e.target.value.replace(/,/g, "");
              if (/^\d*$/.test(raw)) {
                const selectedAgent = agentsQuery.data?.find(
                  (agent) => agent.id === form.agentId
                );
                
                // إظهار تحذير إذا كان المبلغ سيجعل الرصيد سالب
                if (selectedAgent && Number(raw) > selectedAgent.balance) {
                  const newBalance = selectedAgent.balance - Number(raw);
                  toast.warn(
                    `⚠️ سيصبح رصيد البائع: ${newBalance.toLocaleString("en-US")} ر.س`
                  );
                }

                setForm({ ...form, paidAmount: raw });
              }
            }}
            className="rounded-lg h-8 border-blue-300 bg-blue-100 w-full text-center font-bold"
          />
        </div>
        
        <div className="grid grid-cols-2">
          <h1 className="text-center">المستحق</h1>
          <input
            type="text"
            placeholder=""
            inputMode="numeric"
            value={
              form.amountDue === ""
                ? ""
                : Number(form.amountDue).toLocaleString("en-US")
            }
            onChange={(e) => {
              const raw = e.target.value.replace(/,/g, "");
              if (/^\d*$/.test(raw)) {
                setForm({ ...form, amountDue: raw });
              }
            }}
            className="rounded-lg h-8 border-blue-300 bg-blue-100 w-full text-center font-bold"
          />
        </div>
      </div>

      {/* حالة الدفع - مقفلة للأدمن */}
      <label className="label cursor-pointer justify-end gap-4">
        تم التسديد للإدارة
        <input
          type="checkbox"
          className="checkbox text-blue-400 mx-2"
          checked={true} // دائماً true للأدمن
          disabled={true} // مقفل للأدمن
        />
      </label>

      {/* معلومات إضافية */}
      <div className="bg-blue-50 p-3 rounded-lg text-sm">
        <p className="text-blue-700 font-semibold">ملاحظة:</p>
        <p className="text-blue-600">
          • يمكن للبائع أن يصبح رصيده بالسالب
        </p>
        <p className="text-blue-600">
          • التذاكر المضافة من الأدمن تعتبر مدفوعة تلقائياً
        </p>
      </div>

      <button
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-3 w-full font-bold transition-colors"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <AiOutlineLoading3Quarters className="animate-spin mx-auto" />
        ) : (
          "إضافة التذكرة"
        )}
      </button>
    </motion.div>
  );
}