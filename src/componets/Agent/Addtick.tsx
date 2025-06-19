import { useEffect, useState } from "react";

import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useAppData } from "../../api/useAppData";
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
    paidAmount: "" as string,
    amountDue: "" as string,
    isPaid: false,
  });

  const [loading, setLoading] = useState(false);

  const { createTicket, agentsQuery, updateAgentBalance } = useAppData();

  const handleSubmit = async () => {
    if (!form.ticketNumber || !form.agentId)
      return toast.error("يرجى تعبئة جميع الحقول");

    setLoading(true);
    try {
      console.log("Form Data: ", form);
      console.log("User ID: ", userId);

      // ✅ الحصول على بيانات الوكيل المختار
      const agent = agentsQuery.data?.find((a) => a.id === form.agentId);
      if (!agent) {
        toast.error("لم يتم العثور على البائع المحدد");
        setLoading(false);
        return;
      }

      const newBalance = agent.balance - Number(form.paidAmount);
      if (newBalance < 0) {
        toast.error("رصيد البائع غير كافٍ");
        setLoading(false);
        return;
      }

      // ✅ إضافة التذكرة
      await createTicket.mutateAsync({
        ...form,
        createdAt: new Date().toISOString(),
        createdByUserId: userId,
      } as unknown as Omit<Ticket, "id">);

      // ✅ خصم الرصيد من الوكيل
      await updateAgentBalance.mutateAsync({
        id: agent.id,
        newBalance,
      });

      toast.success("✅ تم إضافة التذكرة وخصم الرصيد بنجاح!");

      // ✅ إعادة تعيين النموذج
      setForm({
        ticketNumber: "",
        agentId: "",
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
  const { user } = useAuth();
  useEffect(() => {
    if (user?.role === "admin") {
      setForm((prev) => ({ ...prev, isPaid: true }));
    }
  }, [user]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-4 rounded-xl shadow-md space-y-3"
    >
      <h2 className="text-lg font-bold text-right">إضافة تذكرة جديدة</h2>

      <input
        type="text"
        placeholder="رقم التذكرة"
        value={form.ticketNumber}
        onChange={(e) => setForm({ ...form, ticketNumber: e.target.value })}
        className="input bg-blue-100 input-bordered w-full text-right"
      />

      <select
        className="select bg-blue-100  select-bordered w-full text-right"
        value={form.agentId}
        onChange={(e) => setForm({ ...form, agentId: e.target.value })}
      >
        <option disabled value="">
          اختر البائع
        </option>
        {agentsQuery.data?.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name}
          </option>
        ))}
      </select>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 ">
          <h1 className=" text-center">المدفوع من المحفظة</h1>
          <input
            type="text"
            placeholder=""
            inputMode="numeric"
            value={
              form.paidAmount === ""
                ? ""
                : Number(form.paidAmount).toLocaleString("en-US") // عرض مع فاصلة
            }
            onChange={(e) => {
              const raw = e.target.value.replace(/,/g, ""); // إزالة الفواصل
              // فقط أرقام أو فراغ
              if (/^\d*$/.test(raw)) {
                const selectedAgent = agentsQuery.data?.find(
                  (agent) => agent.id === form.agentId
                );
                if (selectedAgent && Number(raw) > selectedAgent.balance) {
                  toast.warn(
                    `⚠️ الرصيد المتاح: ${selectedAgent.balance.toLocaleString(
                      "en-US"
                    )}`
                  );
                }

                setForm({ ...form, paidAmount: raw });
              }
            }}
            className="rounded-lg h-8 border-blue-300 bg-blue-100 w-full text-center font-bold"
          />
        </div>
        <div className="grid grid-cols-2 ">
          <h1 className=" text-center"> المستحق </h1>
          <input
            type="text"
            placeholder=" "
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

      <label className="label cursor-pointer justify-end gap-4">
        تم التسديد للإدارة
        <input
          type="checkbox"
          className="checkbox text-blue-400 mx-2"
          checked={user?.role === "admin" ? true : form.isPaid}
          disabled={user?.role === "admin"} // منع التغيير إذا كان admin
          onChange={(e) =>
            !user?.role || user?.role !== "admin" // السماح بالتعديل فقط لغير الـ admin
              ? setForm({ ...form, isPaid: e.target.checked })
              : null
          }
        />
      </label>

      <button
        className="bg-blue-500 rounded-xl my-3 w-full"
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
