import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useAppData } from "../../api/useAppData";
import { useUsersWithStats } from "../../api/getusers";
import type { Ticket } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useCurrencies, useCurrencyUtils } from "../../api/useCurrency";
import { convertToUSD } from "../../api/currencyService";
import { logTicketCreated } from "../../api/loggingService";

export default function AddTicketForm() {
  const [form, setForm] = useState({
    ticketNumber: "",
    agentId: "",
    selectedUserId: "", // المستخدم المختار
    paidAmount: "" as string,
    amountDue: "" as string,
    partialPayment: "" as string, // الدفع الجزئي من المستحق
    isPaid: false,
    currency: "USD", // العملة المختارة
    paymentType: "full" as "full" | "partial", // نوع الدفع
  });

  const [loading, setLoading] = useState(false);

  const { createTicket, agentsQuery, updateAgentBalance } = useAppData();
  const { data: users } = useUsersWithStats(); // جلب قائمة المستخدمين
  const { user } = useAuth();
  const { data: currencies } = useCurrencies();
  const { getCurrencyByCode } = useCurrencyUtils();

  // للأدمن، يتم تعيين التذاكر كمدفوعة افتراضياً
  useEffect(() => {
    if (user?.role === "admin") {
      setForm((prev) => ({ ...prev, isPaid: true }));
    }
  }, [user]);

  // تحديث حالة الدفع عند تغيير المستخدم المحدد (للأدمن فقط)
  useEffect(() => {
    if (user?.role === "admin" && form.selectedUserId) {
      const selectedUser = users?.find((u) => u.id === form.selectedUserId);
      if (selectedUser?.role === "admin") {
        setForm((prev) => ({ ...prev, isPaid: true }));
      }
    }
  }, [form.selectedUserId, users, user]);

  // التحقق من الصلاحيات - يمكن للأدمن والعميل الوصول
  if (!user || (user.role !== "admin" && user.role !== "agent")) {
    return null;
  }

  const handleSubmit = async () => {
    // التحقق من الحقول المطلوبة بناء على نوع المستخدم
    if (!form.ticketNumber || !form.agentId) {
      return toast.error("يرجى تعبئة جميع الحقول المطلوبة");
    }

    // للأدمن، يجب اختيار المستخدم
    if (user?.role === "admin" && !form.selectedUserId) {
      return toast.error("يرجى اختيار المستخدم الذي حرر التذكرة");
    }

    if (!form.paidAmount || !form.amountDue) {
      return toast.error("يرجى إدخال المبالغ المطلوبة");
    }

    setLoading(true);
    try {
      console.log("Form Data: ", form);

      // الحصول على بيانات الوكيل المختار
      const agent = agentsQuery.data?.find((a) => a.id === form.agentId);
      if (!agent) {
        toast.error("لم يتم العثور على البائع المحدد");
        setLoading(false);
        return;
      }

      // Get selected currency
      const selectedCurrency = getCurrencyByCode(form.currency);
      if (!selectedCurrency) {
        toast.error("يرجى اختيار عملة صحيحة");
        setLoading(false);
        return;
      }

      // Convert amounts to USD for storage
      const paidAmountUSD = convertToUSD(
        Number(form.paidAmount),
        selectedCurrency
      );
      const amountDueUSD = convertToUSD(
        Number(form.amountDue),
        selectedCurrency
      );
      // Calculate partial payment based on payment type
      let partialPaymentUSD = 0;
      if (form.paymentType === "partial" && form.partialPayment) {
        partialPaymentUSD = convertToUSD(
          Number(form.partialPayment),
          selectedCurrency
        );
      }
      // للدفع الكامل، لا نضع قيمة في partialPayment، بل نعتمد على isPaid

      // حساب الرصيد الجديد (يمكن أن يكون سالب)
      const newBalance = agent.balance - paidAmountUSD;

      // إضافة التذكرة مع معرف المستخدم المختار أو المستخدم الحالي
      const ticketData = {
        ticketNumber: form.ticketNumber,
        agentId: form.agentId,
        paidAmount: paidAmountUSD, // Store in USD
        amountDue: amountDueUSD, // Store in USD
        partialPayment: partialPaymentUSD, // Store in USD
        createdAt: new Date().toISOString(),
        createdByUserId:
          user?.role === "admin" ? form.selectedUserId : user?.id,
        // إذا كان المستخدم المحدد أدمن، التذكرة تصبح مدفوعة تلقائياً
        isPaid:
          user?.role === "admin"
            ? users?.find((u) => u.id === form.selectedUserId)?.role === "admin"
              ? true
              : form.isPaid
            : form.isPaid,
      };

      const createdTicket = await createTicket.mutateAsync(
        ticketData as unknown as Omit<Ticket, "id">
      );

      // تحديث رصيد الوكيل (حتى لو أصبح سالب)
      await updateAgentBalance.mutateAsync({
        id: agent.id,
        newBalance,
      });

      // Log the ticket creation
      if (user && createdTicket) {
        const performedByUserId =
          user.role === "admin" ? form.selectedUserId : user.id;
        const performedByUser =
          user.role === "admin"
            ? users?.find((u) => u.id === form.selectedUserId)
            : user;

        if (performedByUser) {
          await logTicketCreated(
            (createdTicket as any).id || "unknown",
            form.ticketNumber,
            performedByUserId || user.id,
            performedByUser.name || user.name,
            agent.name
          );
        }
      }

      toast.success("✅ تم إضافة التذكرة وتحديث الرصيد بنجاح!");

      // إعادة تعيين النموذج
      setForm({
        ticketNumber: "",
        agentId: "",
        selectedUserId: "",
        paidAmount: "",
        amountDue: "",
        partialPayment: "",
        isPaid: user?.role === "admin" ? true : false,
        currency: "USD",
        paymentType: "full",
      });
    } catch (err) {
      console.error("❌ خطأ في إضافة التذكرة:", err);
      toast.error("حدث خطأ أثناء الإضافة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-4 rounded-xl shadow-md space-y-3"
    >
      <h2 className="text-lg font-bold text-right text-blue-600">
        إضافة تذكرة جديدة {user?.role === "admin" ? "(الأدمن)" : ""}
      </h2>

      {/* رقم التذكرة */}
      <input
        type="text"
        placeholder="رقم التذكرة"
        value={form.ticketNumber}
        onChange={(e) => setForm({ ...form, ticketNumber: e.target.value })}
        className="input bg-blue-100 text-black input-bordered w-full text-right"
      />

      {/* اختيار العملة */}
      <select
        className="select bg-blue-100 text-black select-bordered w-full text-right"
        value={form.currency}
        onChange={(e) => setForm({ ...form, currency: e.target.value })}
      >
        <option disabled value="">
          اختر العملة
        </option>
        {currencies?.map((currency) => (
          <option key={currency.id} value={currency.code}>
            {currency.name} ({currency.symbol})
          </option>
        ))}
      </select>

      {/* اختيار المستخدم - للأدمن فقط */}
      {user?.role === "admin" && (
        <select
          className="select bg-blue-100 text-black select-bordered w-full text-right"
          value={form.selectedUserId}
          onChange={(e) => {
            const selectedUser = users?.find((u) => u.id === e.target.value);
            setForm({
              ...form,
              selectedUserId: e.target.value,
              // إذ�� كان المستخدم المحدد أدمن، جعل التذكرة مدفوعة تلقائياً
              isPaid: selectedUser?.role === "admin" ? true : form.isPaid,
            });
          }}
        >
          <option disabled value="">
            اختر المستخدم الذي حرر التذكرة
          </option>
          {users?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.role === "admin" ? "مدير" : "وكيل"})
            </option>
          ))}
        </select>
      )}

      {/* اختيار البائع */}
      <select
        className="select bg-blue-100 text-black select-bordered w-full text-right"
        value={form.agentId}
        onChange={(e) => setForm({ ...form, agentId: e.target.value })}
      >
        <option disabled value="">
          اختر البائع
        </option>
        {agentsQuery.data?.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name} (الرصيد: {agent.balance.toLocaleString("en-US")} USD)
          </option>
        ))}
      </select>

      {/* المبال�� */}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2">
          <h1 className="text-center text-blue-800">المدفوع من المحفظة</h1>
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

                const selectedCurrency = getCurrencyByCode(form.currency);
                if (selectedAgent && selectedCurrency) {
                  const amountInUSD = convertToUSD(
                    Number(raw),
                    selectedCurrency
                  );
                  if (amountInUSD > selectedAgent.balance) {
                    const newBalance = selectedAgent.balance - amountInUSD;
                    toast.warn(
                      `⚠️ سيصبح رصيد البائع: ${newBalance.toLocaleString(
                        "en-US"
                      )} USD`
                    );
                  }
                }

                setForm({ ...form, paidAmount: raw });
              }
            }}
            className="rounded-lg h-8 border-blue-300 text-black bg-blue-100 w-full text-center font-bold"
          />
        </div>

        <div className="grid grid-cols-2">
          <h1 className="text-center text-blue-800">المستحق</h1>
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
            className="rounded-lg h-8 border-blue-300 text-black bg-blue-100 w-full text-center font-bold"
          />
        </div>

        {/* نوع الدفع */}
        <div className="grid grid-cols-2 gap-2">
          <h1 className="text-center self-center text-blue-800">
            نوع دفع المستحق
          </h1>
          <select
            className="select bg-green-100 text-black select-bordered w-full text-center"
            value={form.paymentType}
            onChange={(e) => {
              const paymentType = e.target.value as "full" | "partial";
              setForm({
                ...form,
                paymentType,
                partialPayment:
                  paymentType === "full" ? "" : form.partialPayment,
                // إذا تم اختيار دفع جز��ي، يصب�� غير مدفوع تلقائياً
                isPaid: paymentType === "partial" ? false : form.isPaid,
              });
            }}
          >
            <option value="full">سداد كامل</option>
            <option value="partial">سداد جزئي</option>
          </select>
        </div>

        {/* الدفع الجزئي من المستحق - يظهر فقط عند اختيار السداد الجزئي */}
        {form.paymentType === "partial" && (
          <div className="grid grid-cols-2">
            <h1 className="text-center text-blue-800">
              المبلغ المدفوع من المستحق
            </h1>
            <input
              type="text"
              placeholder="أدخل المبلغ المدفوع"
              inputMode="numeric"
              value={
                form.partialPayment === ""
                  ? ""
                  : Number(form.partialPayment).toLocaleString("en-US")
              }
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, "");
                if (/^\d*$/.test(raw)) {
                  const amountDue = Number(form.amountDue);
                  if (Number(raw) > amountDue && amountDue > 0) {
                    toast.warn(
                      "المبلغ ال��دفوع لا يمكن أن يتجاوز المبلغ المستحق"
                    );
                    return;
                  }
                  setForm({ ...form, partialPayment: raw });
                }
              }}
              className="rounded-lg h-8 border-green-300 text-black bg-green-100 w-full text-center font-bold"
            />
          </div>
        )}
      </div>

      {/* حالة الدفع */}
      <label className="label cursor-pointer justify-end gap-4 text-black">
        {user?.role === "admin" ? "تم التسديد للإدارة" : "تم الدفع"}
        <input
          type="checkbox"
          className="checkbox text-blue-400 mx-2"
          checked={form.isPaid}
          disabled={
            form.paymentType === "partial" || // مقفل إذا كان الدفع جزئي
            (user?.role === "admin" &&
              users?.find((u) => u.id === form.selectedUserId)?.role ===
                "admin")
          }
          onChange={(e) => setForm({ ...form, isPaid: e.target.checked })}
        />
      </label>

      {/* معلومات إضافية */}
      <div className="bg-blue-50 p-3 rounded-lg text-sm">
        <p className="text-blue-700 font-semibold">ملاحظة:</p>
        <p className="text-blue-600">• يمكن للبائع أن يصبح رصيده بالسالب</p>
        {user?.role === "admin" && (
          <>
            <p className="text-blue-600">
              • التذاكر المحررة من قبل الأدمن تُعتبر مدفوعة تلقائياً
            </p>
            <p className="text-blue-600">
              • يمكن تحديد المستخدم الذي حرر التذكرة
            </p>
          </>
        )}
        <p className="text-green-600">
          • <strong>السداد الكامل:</strong> يتم دفع كامل المبلغ المستحق
        </p>
        <p className="text-orange-600">
          • <strong>السداد الجزئي:</strong> يتم دفع جزء من المبلغ المستحق
          والباقي يبقى كدين (لا يمكن وضع علامة "تم الدفع")
        </p>
        <p className="text-orange-600">
          • جميع المبالغ تُحفظ بالدولار كعملة أساسية
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
