import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { Square, Briefcase } from "lucide-react";
import { useAppData } from "../../api/useAppData";
import { useUsersWithStats } from "../../api/getusers";
import { getActiveServices } from "../../api/serviceService";
import type { Ticket as TicketType, ServiceTicket, Service } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useCurrencies, useCurrencyUtils } from "../../api/useCurrency";
import { convertToUSD } from "../../api/currencyService";
import { logTicketCreated } from "../../api/loggingService";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../api/Firebase";

export default function AddTicketForm() {
  const [formType, setFormType] = useState<"ticket" | "service">("ticket");
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

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
    serviceId: "", // للخدمات
  });

  const [loading, setLoading] = useState(false);

  const { createTicket, agentsQuery, updateAgentBalance } = useAppData();
  const { data: users } = useUsersWithStats(); // جلب قائمة ��لمستخدمين
  const { user } = useAuth();
  const { data: currencies } = useCurrencies();
  const { getCurrencyByCode } = useCurrencyUtils();

  // Load services when component mounts
  useEffect(() => {
    const loadServices = async () => {
      try {
        const servicesData = await getActiveServices();
        setServices(servicesData);
      } catch (error) {
        console.error("Error loading services:", error);
        toast.error("فشل في تحميل الخدمات");
      }
    };
    loadServices();
  }, []);

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

  // Update selected service when service ID changes
  useEffect(() => {
    if (form.serviceId) {
      const service = services.find((s) => s.id === form.serviceId);
      setSelectedService(service || null);
    } else {
      setSelectedService(null);
    }
  }, [form.serviceId, services]);

  // Update service price when currency or service changes
  useEffect(() => {
    if (formType === "service" && selectedService && form.currency) {
      const selectedCurrency = getCurrencyByCode(form.currency);
      if (selectedCurrency) {
        const serviceAmountInCurrency = Math.ceil(
          selectedService.price * selectedCurrency.exchangeRate,
        );
        // Only update if the amount is actually different to prevent loops
        if (form.amountDue !== serviceAmountInCurrency.toString()) {
          setForm((prev) => ({
            ...prev,
            amountDue: serviceAmountInCurrency.toString(),
          }));
        }
      }
    }
  }, [formType, selectedService, form.currency]); // Removed getCurrencyByCode and form.amountDue from deps

  // التحقق من الصلاحيات - يمكن للأدمن والعميل الوصول
  if (!user || (user.role !== "admin" && user.role !== "agent")) {
    return null;
  }

  const createServiceTicket = async (
    serviceTicketData: Omit<ServiceTicket, "id">,
  ) => {
    try {
      const docRef = await addDoc(collection(db, "serviceTickets"), {
        ...serviceTicketData,
        createdAt: new Date().toISOString(),
      });
      return { id: docRef.id, ...serviceTicketData };
    } catch (error) {
      console.error("Error creating service ticket:", error);
      throw error;
    }
  };

  // Set default values for services
  useEffect(() => {
    if (formType === "service" && selectedService && form.currency) {
      const selectedCurrency = getCurrencyByCode(form.currency);
      if (selectedCurrency) {
        const serviceAmountInCurrency = Math.ceil(
          selectedService.price * selectedCurrency.exchangeRate,
        );
        setForm((prev) => ({
          ...prev,
          paidAmount: serviceAmountInCurrency.toString(), // Set paid amount to service price
          agentId: user?.id || "", // Set agent ID to current user for services
        }));
      }
    }
  }, [formType, selectedService, form.currency, user?.id]);

  const handleSubmit = async () => {
    // التحقق من تحميل البيانات المطلوبة
    if (agentsQuery.isLoading) {
      return toast.error("جار تحميل بيانات الوكلاء، يرجى الانتظار...");
    }

    if (!user) {
      return toast.error("يرجى تسجيل الدخول أولاً");
    }

    if (!agentsQuery.data || agentsQuery.data.length === 0) {
      return toast.error("لا توجد بيانات وكلاء متاحة");
    }

    // التحقق من الحقول المطلوبة بناء على نوع المستخدم
    if (!form.ticketNumber) {
      return toast.error("يرجى تعبئة رقم التذكرة/الخدمة");
    }

    // For regular tickets, agent ID is required, for services it's auto-set to current user
    if (formType === "ticket" && !form.agentId) {
      return toast.error("يرجى اختيار البائع");
    }

    // للأدمن، يجب اختيار المستخدم
    if (user?.role === "admin" && !form.selectedUserId) {
      return toast.error("يرجى اختيار المستخدم الذي حرر التذكرة");
    }

    if (!form.paidAmount || !form.amountDue) {
      return toast.error("يرجى إدخال المبالغ المطلو��ة");
    }

    // For services, check if service is selected and amount is valid
    if (formType === "service") {
      if (!form.serviceId || !selectedService) {
        return toast.error("يرجى اختيار الخدمة");
      }

      const selectedCurrency = getCurrencyByCode(form.currency);
      if (selectedCurrency) {
        const amountDueInUSD = convertToUSD(
          Number(form.amountDue),
          selectedCurrency,
        );
        if (amountDueInUSD < selectedService.price) {
          return toast.error(
            `المبلغ المستحق يجب أن يكون أكبر من أو يساوي سعر الخدمة (${selectedService.price} دولار)`,
          );
        }
      }
    }

    setLoading(true);
    try {
      console.log("Form Data: ", form);

      // الحصول عل�� بيانات الوكيل ��لمختار
      // For services, use current user as agent, for tickets use selected agent
      const agentId = formType === "service" ? user.id : form.agentId;
      const agent = agentsQuery.data?.find((a) => a.id === agentId);
      if (!agent) {
        toast.error(
          `لم يتم العثور على ${formType === "service" ? "��يانات المستخدم" : "البائع المحدد"}`,
        );
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
        selectedCurrency,
      );
      const amountDueUSD = convertToUSD(
        Number(form.amountDue),
        selectedCurrency,
      );
      // Calculate partial payment based on payment type
      let partialPaymentUSD = 0;
      if (form.paymentType === "partial" && form.partialPayment) {
        partialPaymentUSD = convertToUSD(
          Number(form.partialPayment),
          selectedCurrency,
        );
      }

      // حساب الرصيد الجديد (يمكن أن يكون سالب)
      const newBalance = agent.balance - paidAmountUSD;

      const commonData = {
        ticketNumber: form.ticketNumber,
        agentId: agentId,
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

      let createdItem;

      if (formType === "service" && selectedService) {
        // إضافة تذكرة خدمة
        const serviceTicketData = {
          ...commonData,
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          serviceBasePrice: selectedService.price,
        };

        createdItem = await createServiceTicket(
          serviceTicketData as unknown as Omit<ServiceTicket, "id">,
        );
      } else {
        // إضافة تذكرة عادية
        createdItem = await createTicket.mutateAsync(
          commonData as unknown as Omit<TicketType, "id">,
        );
      }

      // تحد��ث رصيد الوكيل (حتى لو أصبح سالب)
      await updateAgentBalance.mutateAsync({
        id: agent.id,
        newBalance,
      });

      // Log the ticket creation
      if (user && createdItem) {
        const performedByUserId =
          user.role === "admin" ? form.selectedUserId : user.id;
        const performedByUser =
          user.role === "admin"
            ? users?.find((u) => u.id === form.selectedUserId)
            : user;

        if (performedByUser) {
          await logTicketCreated(
            (createdItem as any).id || "unknown",
            form.ticketNumber,
            performedByUserId || user.id,
            performedByUser.name || user.name,
            agent.name,
          );
        }
      }

      const itemType = formType === "service" ? "الخدمة" : "التذكرة";
      toast.success(`✅ تم إضافة ${itemType} وتحديث الرصيد بنجاح!`);

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
        serviceId: "",
      });
      setSelectedService(null);
    } catch (err) {
      console.error("❌ خطأ في الإضافة:", err);
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
        إضافة {formType === "service" ? "خدمة" : "تذكرة"} جديدة{" "}
        {user?.role === "admin" ? "(الأدمن)" : ""}
      </h2>

      {/* اختيار نوع النموذج */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => {
            setFormType("ticket");
            setForm((prev) => ({ ...prev, serviceId: "", amountDue: "" }));
            setSelectedService(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            formType === "ticket"
              ? "bg-blue-500 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Square className="w-4 h-4" />
          تذكرة
        </button>
        <button
          onClick={() => {
            setFormType("service");
            setForm((prev) => ({ ...prev, amountDue: "" }));
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            formType === "service"
              ? "bg-green-500 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          خدمة
        </button>
      </div>

      {/* رقم التذكرة */}
      <input
        type="text"
        placeholder={`رقم ${formType === "service" ? "الخدمة" : "التذكرة"}`}
        value={form.ticketNumber}
        onChange={(e) => setForm({ ...form, ticketNumber: e.target.value })}
        className="input bg-blue-100 text-black input-bordered w-full text-right"
      />

      {/* اختيار الخدمة - للخدمات فقط */}
      {formType === "service" && (
        <select
          className="select bg-green-100 text-black select-bordered w-full text-right"
          value={form.serviceId}
          onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
        >
          <option disabled value="">
            اختر الخدمة
          </option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} (السع�� الأساسي: ${service.price})
            </option>
          ))}
        </select>
      )}

      {/* عرض معلومات الخدمة المختارة */}
      {formType === "service" && selectedService && (
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-green-700 font-semibold">الخ��مة المختارة:</p>
          <p className="text-green-600">{selectedService.name}</p>
          <p className="text-green-600">
            السعر الأساسي: ${selectedService.price}
          </p>
        </div>
      )}

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
              // إذا كان المستخدم المحدد أد��ن، جعل ��لتذكرة مدفوعة تلقائياً
              isPaid: selectedUser?.role === "admin" ? true : form.isPaid,
            });
          }}
        >
          <option disabled value="">
            اختر المستخدم الذي حرر{" "}
            {formType === "service" ? "��لخدمة" : "التذكرة"}
          </option>
          {users?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.role === "admin" ? "مدير" : "وكيل"})
            </option>
          ))}
        </select>
      )}

      {/* اختيار البائع - للتذاكر فقط */}
      {formType === "ticket" && (
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
      )}

      {/* المبالغ */}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2">
          <h1 className="text-center text-blue-800">
            {formType === "service" ? "سعر الخدمة" : "المدفوع من المحفظة"}
          </h1>
          <input
            type="text"
            placeholder=""
            inputMode="numeric"
            value={
              form.paidAmount === ""
                ? ""
                : Number(form.paidAmount).toLocaleString("en-US")
            }
            onChange={
              formType === "service"
                ? undefined
                : (e) => {
                    const raw = e.target.value.replace(/,/g, "");
                    if (/^\d*$/.test(raw)) {
                      const selectedAgent = agentsQuery.data?.find(
                        (agent) => agent.id === form.agentId,
                      );

                      const selectedCurrency = getCurrencyByCode(form.currency);
                      if (selectedAgent && selectedCurrency) {
                        const amountInUSD = convertToUSD(
                          Number(raw),
                          selectedCurrency,
                        );
                        if (amountInUSD > selectedAgent.balance) {
                          const newBalance =
                            selectedAgent.balance - amountInUSD;
                          toast.warn(
                            `⚠️ سيصبح رصيد البائع: ${newBalance.toLocaleString(
                              "en-US",
                            )} USD`,
                          );
                        }
                      }

                      setForm({ ...form, paidAmount: raw });
                    }
                  }
            }
            readOnly={formType === "service"}
            className={`rounded-lg h-8 border-blue-300 text-black w-full text-center font-bold ${
              formType === "service"
                ? "bg-gray-100 cursor-not-allowed"
                : "bg-blue-100"
            }`}
          />
        </div>

        <div className="grid grid-cols-2">
          <h1 className="text-center text-blue-800">ا��مستحق</h1>
          <input
            type="text"
            placeholder={
              formType === "service" && selectedService
                ? `الحد الأدنى: ${Math.ceil(selectedService.price * (getCurrencyByCode(form.currency)?.exchangeRate || 1))}`
                : ""
            }
            inputMode="numeric"
            value={
              form.amountDue === ""
                ? ""
                : Number(form.amountDue).toLocaleString("en-US")
            }
            onChange={(e) => {
              const raw = e.target.value.replace(/,/g, "");
              if (/^\d*$/.test(raw)) {
                // For services, validate minimum amount
                if (formType === "service" && selectedService) {
                  const selectedCurrency = getCurrencyByCode(form.currency);
                  if (selectedCurrency) {
                    const amountInUSD = convertToUSD(
                      Number(raw),
                      selectedCurrency,
                    );
                    if (amountInUSD < selectedService.price && raw !== "") {
                      toast.warn(
                        `المبلغ يجب أن يكون أكبر من أو يساوي سعر الخدمة (${selectedService.price} دولار)`,
                      );
                    }
                  }
                }
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
                // إذا تم اختيار دفع جزئي، يصبح غير مدفوع تلقائياً
                isPaid: paymentType === "partial" ? false : form.isPaid,
              });
            }}
          >
            <option value="full">سداد كامل</option>
            <option value="partial">سداد جزئي</option>
          </select>
        </div>

        {/* الدفع الجزئي من المستحق - يظهر ��قط عند اختيار السداد الجزئي */}
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
                      "المبلغ المدف��ع لا يمكن أن يتجاوز المبلغ المستحق",
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
              • {formType === "service" ? "الخدمات" : "التذاكر"} ��لمحررة م��
              قبل الأدمن تُعتبر مدفوعة تل��ائياً
            </p>
            <p className="text-blue-600">
              • يمكن تحديد المستخدم الذي حرر{" "}
              {formType === "service" ? "الخدمة" : "التذكرة"}
            </p>
          </>
        )}
        {formType === "service" && (
          <>
            <p className="text-green-600">
              • <strong>للخدمات:</strong> سعر الخدمة يُحدد تلقائياً ولا يمكن
              تعديله
            </p>
            <p className="text-green-600">
              • <strong>للخدمات:</strong> المبلغ المستحق يجب أن يكون أكبر من أو
              يساوي سعر الخدمة الأساسي
            </p>
            <p className="text-green-600">
              • <strong>للخدمات:</strong> يتم تعيين المستخدم الحالي كبائع
              تلقائياً
            </p>
          </>
        )}
        {formType === "ticket" && (
          <p className="text-blue-600">
            • <strong>للتذاكر:</strong> يجب اختيار البائع ومبلغ الدفع من محفظته
          </p>
        )}
        <p className="text-green-600">
          • <strong>السداد الكامل:</strong> يتم دف�� كامل المبلغ المستحق
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
        className={`${
          formType === "service"
            ? "bg-green-500 hover:bg-green-600"
            : "bg-blue-500 hover:bg-blue-600"
        } text-white rounded-xl py-3 w-full font-bold transition-colors`}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <AiOutlineLoading3Quarters className="animate-spin mx-auto" />
        ) : (
          `إضافة ${formType === "service" ? "الخدمة" : "التذكرة"}`
        )}
      </button>
    </motion.div>
  );
}
