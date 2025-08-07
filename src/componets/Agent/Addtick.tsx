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
import {
  logTicketCreated,
  logServiceTicketCreated,
} from "../../api/loggingService";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../api/Firebase";
import { useTranslation } from "react-i18next";

export default function AddTicketForm() {
  const [formType, setFormType] = useState<"ticket" | "service">("ticket");
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const [form, setForm] = useState({
    ticketNumber: "",
    agentId: "",
    selectedUserId: "", // المستخدم ��لمختار
    paidAmount: "" as string,
    amountDue: "" as string,
    partialPayment: "" as string, // الدفع الجزئي من المستحق
    isPaid: false,
    currency: "USD", // العملة المختارة
    paymentType: "full" as "full" | "partial", // نوع الدفع
    serviceId: "", // للخدمات
    quantity: "1", // العدد أو الكمية (من 1 إلى 10)
  });

  const [loading, setLoading] = useState(false);

  const { createTicket, agentsQuery, updateAgentBalance } = useAppData();
  const { data: users } = useUsersWithStats(); // جلب قائمة ��لمستخدمين
  const { user } = useAuth();
  const { data: currencies } = useCurrencies();
  const { getCurrencyByCode } = useCurrencyUtils();
  const { t } = useTranslation();

  // Load services when component mounts
  useEffect(() => {
    const loadServices = async () => {
      try {
        const servicesData = await getActiveServices();
        setServices(servicesData);
      } catch (error) {
        console.error("Error loading services:", error);
        toast.error(t("failedToLoadServices"));
      }
    };
    loadServices();
  }, []);

  // للأدمن، يتم تعيين التذاكر كمدفوعة ا��تراضياً
  useEffect(() => {
    if (user?.role === "admin") {
      setForm((prev) => ({ ...prev, isPaid: true }));
    }
  }, [user]);

  // تحديث حالة الدفع عند تغيير المس��خدم المحدد (للأدمن ف��ط)
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

  // Update service price when currency, service, or quantity changes
  useEffect(() => {
    if (formType === "service" && selectedService && form.currency) {
      const selectedCurrency = getCurrencyByCode(form.currency);
      if (selectedCurrency) {
        const quantity = parseFloat(form.quantity) || 1;
        const serviceAmountInCurrency = Math.ceil(
          selectedService.price * selectedCurrency.exchangeRate * quantity,
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
  }, [formType, selectedService, form.currency, form.quantity]); // Added form.quantity to deps

  // Set default values for services
  useEffect(() => {
    if (formType === "service" && selectedService && form.currency) {
      const selectedCurrency = getCurrencyByCode(form.currency);
      if (selectedCurrency) {
        const quantity = parseFloat(form.quantity) || 1;
        const serviceAmountInCurrency = Math.ceil(
          selectedService.price * selectedCurrency.exchangeRate * quantity,
        );
        setForm((prev) => ({
          ...prev,
          paidAmount: serviceAmountInCurrency.toString(), // Set paid amount to service price
          // للخدمات لا نحتاج لوكيل - الخدمات مستقلة
        }));
      }
    }
  }, [formType, selectedService, form.currency, user?.id, form.quantity]);

  // التحقق من الصلاحيات - يمكن للأدمن والعميل الوصول
  if (!user || (user.role !== "admin" && user.role !== "agent")) {
    return null;
  }

  // عر�� التحم��ل إذا كانت البيانا�� الأساسية لم تُحمل بعد
  if (agentsQuery.isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-4 rounded-xl shadow-md flex items-center justify-center"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 mt-2">{t("agents")}...</p>
        </div>
      </motion.div>
    );
  }

  // عرض ��طأ إذا فشل تحميل البيانات
  if (agentsQuery.error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-4 rounded-xl shadow-md"
      >
        <div className="text-center text-red-600">
          <p>{t("failedToLoadAgents")}</p>
          <button
            onClick={() => agentsQuery.refetch()}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
           {t("retry")}
          </button>
        </div>
      </motion.div>
    );
  }

  // التحقق من وجود البيانات
  if (!agentsQuery.data || agentsQuery.data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-4 rounded-xl shadow-md"
      >
        <div className="text-center text-orange-600">
          <p>{t("noAgents")}</p>
          <p className="text-sm text-gray-500 mt-1">
            {t("addAgentsFirst")}
          </p>
        </div>
      </motion.div>
    );
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

  const handleSubmit = async () => {
    console.log("=== بدء معالجة النموذج ===");
    console.log("Form Type:", formType);
    console.log("User:", user);
    console.log("Agents Query Loading:", agentsQuery.isLoading);
    console.log("Agents Query Error:", agentsQuery.error);
    console.log("Agents Query Data:", agentsQuery.data);

    // التحق�� من تحميل البيانات ا��مطلوبة
    if (agentsQuery.isLoading) {
      console.log("خطأ: لا يزال تحميل بيانات الوكلاء");
      return toast.error(t("loadingAgents"));
    }

    if (!user) {
      console.log("خطأ: لا يوجد مستخدم مسجل دخول");
      return toast.error(t("loginFirst"));
    }

    if (agentsQuery.isError) {
      console.log(t("failedToLoadAgents"));
      return toast.error(t("failedToLoadAgents"));
    }

    if (!agentsQuery.data || agentsQuery.data.length === 0) {
      console.log(t("noAgents"));
      return toast.error(t("noAgents"));
    }

    // التحقق ��ن الحقول المطلوبة بناء على نوع المستخدم
    if (!form.ticketNumber) {
      return toast.error(t("fillTicketNumber"));
    }

    // For regular tickets, agent ID is required, for services it's auto-set to current user
    if (formType === "ticket" && !form.agentId) {
      return toast.error(t("selectAgent"));
    }

    // للأدمن، ��جب اختيار المستخدم
    if (user?.role === "admin" && !form.selectedUserId) {
      return toast.error(t("selectUser"));
    }

    if (!form.paidAmount || !form.amountDue) {
      return toast.error(t("fillAmounts"));
    }

    // For services, check if service is selected and amount is valid
    if (formType === "service") {
      if (!form.serviceId || !selectedService) {
        return toast.error(t("selectService"));
      }

      const selectedCurrency = getCurrencyByCode(form.currency);
      if (selectedCurrency) {
        const quantity = parseFloat(form.quantity) || 1;
        const minimumServicePrice = selectedService.price * quantity;
        const amountDueInUSD = convertToUSD(
          Number(form.amountDue) || 0,
          selectedCurrency,
        );
        if (amountDueInUSD < minimumServicePrice) {
          return toast.error(
            t("amountDueMustBeGreaterOrEqualServicePrice"),
          );
        }
      }
    }

    setLoading(true);
    try {
      console.log("Form Data: ", form);

      // For tickets only, get agent data
      let agent = null;
      if (formType === "ticket") {
        const agentId = form.agentId;
        console.log("البحث عن الوكيل بالمعرف:", agentId);
        console.log(
          "جميع الوكلاء المتاحين:",
          agentsQuery.data.map((a) => ({ id: a.id, name: a.name })),
        );

        agent = agentsQuery.data.find((a) => a.id === agentId);
        console.log("الوكيل الموجود:", agent);

        if (!agent) {
          console.log(`${t("userNotFound")}${agentId}`);
          toast.error(
            `${t("userNotFound")}${agentId}`,
          );
          setLoading(false);
          return;
        }
      }

      if (formType === "ticket" && agent) {
        console.log(
          "تم العثور على الوكيل بنجاح:",
          agent.name,
          "(الرصيد:",
          agent.balance,
          "USD)",
        );
      } else if (formType === "service") {
        console.log("إنشاء تذكرة خدمة مستقلة بدون وكيل");
      }

      // Get selected currency
      const selectedCurrency = getCurrencyByCode(form.currency);
      if (!selectedCurrency) {
        toast.error(t("selectValidCurrency"));
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

      // حساب الرصيد الجديد (يمكن أن يكون سالب) - فقط للتذاكر
      const newBalance = agent ? agent.balance - paidAmountUSD : 0;

      const commonData = {
        ticketNumber: form.ticketNumber,
        agentId: formType === "service" ? null : form.agentId, // للخدمات لا نحتاج وكيل
        paidAmount: paidAmountUSD, // Store in USD
        amountDue: amountDueUSD, // Store in USD
        partialPayment: partialPaymentUSD, // Store in USD
        createdAt: new Date().toISOString(),
        createdByUserId:
          user?.role === "admin" ? form.selectedUserId : user?.id,
        // إذا كان المستخدم المحدد أدمن، التذكر�� تصبح مدفو��ة تلقائياً
        isPaid:
          user?.role === "admin"
            ? users?.find((u) => u.id === form.selectedUserId)?.role === "admin"
              ? true
              : form.isPaid
            : form.isPaid,
      };

      let createdItem;

      if (formType === "service" && selectedService) {
        // إضافة تذكرة خد��ة
        const serviceTicketData = {
          ...commonData,
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          serviceBasePrice: selectedService.price,
          quantity: parseFloat(form.quantity) || 1,
        };

        createdItem = await createServiceTicket(
          serviceTicketData as unknown as Omit<ServiceTicket, "id">,
        );
      } else {
        // إضافة تذكر�� عادية
        createdItem = await createTicket.mutateAsync(
          commonData as unknown as Omit<TicketType, "id">,
        );
      }

      // تحديث رصيد الوكيل (فقط لل��ذاكر، ليس للخدمات)
      if (formType === "ticket" && agent) {
        await updateAgentBalance.mutateAsync({
          id: agent.id,
          newBalance,
        });
      }

      // Log the ticket creation
      if (user && createdItem) {
        const performedByUserId =
          user.role === "admin" ? form.selectedUserId : user.id;
        const performedByUser =
          user.role === "admin"
            ? users?.find((u) => u.id === form.selectedUserId)
            : user;

        if (performedByUser) {
          if (formType === "service") {
            await logServiceTicketCreated(
              (createdItem as any).id || "unknown",
              form.ticketNumber,
              performedByUserId || user.id,
              performedByUser.name || user.name,
              selectedService?.name || "خدمة غير محددة",
            );
          } else if (agent) {
            await logTicketCreated(
              (createdItem as any).id || "unknown",
              form.ticketNumber,
              performedByUserId || user.id,
              performedByUser.name || user.name,
              agent.name,
            );
          }
        }
      }

      const itemType = formType === "service" ? t("serviceType") : t("ticketType");
      const successMessage = formType === "service"
        ? `${t("ticketCreatedSuccessfully")} ${itemType}`
        : `${t("ticketCreatedSuccessfully")} ${itemType} و${t("updatedBalanceSuccessfully")}`;
      toast.success(successMessage);

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
        quantity: "1",
      });
      setSelectedService(null);
    } catch (err) {
      console.error("❌ خطأ في الإضافة:", err);
      toast.error(t("errorAdding"));
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
        {t("add")} {formType === "service" ? t("service") : t("ticket")} {t("new")}{" "}
        {user?.role === "admin" ? "("+t("admin")+")" : ""}
      </h2>

      {/* اختيار نوع النموذج */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => {
            setFormType("ticket");
            setForm((prev) => ({ ...prev, serviceId: "", amountDue: "", quantity: "1" }));
            setSelectedService(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            formType === "ticket"
              ? "bg-blue-500 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Square className="w-4 h-4" />
          {t("ticket")}
        </button>
        <button
          onClick={() => {
            setFormType("service");
            setForm((prev) => ({ ...prev, amountDue: "", quantity: "1" }));
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            formType === "service"
              ? "bg-green-500 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          {t("service")}
        </button>
      </div>

      {/* رقم التذكرة */}
      <input
        type="text"
        placeholder={` ${formType === "service" ? t("service") : t("ticket")}`}
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
            {t("selectService")}
          </option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} ({t("serviceBasePrice")}: ${service.price})
            </option>
          ))}
        </select>
      )}

      {/* اخت��ار الكمية - للخدمات فقط */}
      {formType === "service" && selectedService && (
        <div className="grid grid-cols-2 gap-2">
          <h1 className="text-center self-center text-green-800 font-semibold">
            {t("quantity")} :
          </h1>
          <select
            className="select bg-green-100 text-black select-bordered w-full text-center"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num.toString()}>
                {num}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* عرض معلومات الخدمة المختارة */}
      {formType === "service" && selectedService && (
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-green-700 font-semibold">{t("selectedService")}:</p>
          <p className="text-green-600">{selectedService.name}</p>
          <p className="text-green-600">
            {t("serviceBasePrice")}: ${selectedService.price} × {form.quantity} = ${(selectedService.price * parseFloat(form.quantity)).toFixed(2)}
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
          {t("selectCurrency")}
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
              // إذا كان المستخدم المحدد أد����ن، جعل ��لتذكرة مدفوعة تلقائياً
              isPaid: selectedUser?.role === "admin" ? true : form.isPaid,
            });
          }}
        >
          <option disabled value="">
           {t("selectUser")} {" "}
            {/* {formType === "service" ? t("service") : t("ticket")} */}
          </option>
          {users?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.role === "admin" ? t("admin") : t("agent")})
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
            {t("selectAgent")}
          </option>
          {agentsQuery.data?.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name} ({t("balance")}: {agent.balance.toLocaleString("en-US")} USD)
            </option>
          ))}
        </select>
      )}

      {/* المبالغ */}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2">
          <h1 className="text-center text-blue-800">
            {formType === "service" ? t("serviceBasePrice") : t("paidFromWallet")}
          </h1>
          <input
            type="text"
            placeholder=""
            inputMode="decimal"
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
                    // دعم الأرقام العشرية: يسمح بالأرقام والنقطة العشرية
                    if (/^\d*\.?\d*$/.test(raw)) {
                      const selectedAgent = agentsQuery.data?.find(
                        (agent) => agent.id === form.agentId,
                      );

                      const selectedCurrency = getCurrencyByCode(form.currency);
                      if (selectedAgent && selectedCurrency) {
                        const amountInUSD = convertToUSD(
                          Number(raw) || 0,
                          selectedCurrency,
                        );
                        if (amountInUSD > selectedAgent.balance) {
                          const newBalance =
                            selectedAgent.balance - amountInUSD;
                          toast.warn(
                            `${t("agent")} : ${newBalance.toLocaleString(
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
          <h1 className="text-center text-blue-800">{t("amountDue")}</h1>
          <input
            type="text"
            placeholder={
              formType === "service" && selectedService
                ? `${t("minimumAmount")}: ${Math.ceil(selectedService.price * (getCurrencyByCode(form.currency)?.exchangeRate || 1) * parseFloat(form.quantity))}`
                : ""
            }
            inputMode="decimal"
            value={
              form.amountDue === ""
                ? ""
                : Number(form.amountDue).toLocaleString("en-US")
            }
            onChange={(e) => {
              const raw = e.target.value.replace(/,/g, "");
              // دعم الأرقام العشرية: يسمح بالأرقام و��لنقطة العشرية
              if (/^\d*\.?\d*$/.test(raw)) {
                // For services, validate minimum amount
                if (formType === "service" && selectedService) {
                  const selectedCurrency = getCurrencyByCode(form.currency);
                  if (selectedCurrency) {
                    const quantity = parseFloat(form.quantity) || 1;
                    const minimumServicePrice = selectedService.price * quantity;
                    const amountInUSD = convertToUSD(
                      Number(raw) || 0,
                      selectedCurrency,
                    );
                    if (amountInUSD < minimumServicePrice && raw !== "") {
                      toast.warn(
                        `${t("amountshouldbeGreaterOrEqualServicePrice")}(${minimumServicePrice.toFixed(2)} دولار)`,
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

        {/* ن��ع الدفع */}
        <div className="grid grid-cols-2 gap-2">
          <h1 className="text-center self-center text-blue-800">
           {t("paymentType")}
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
            <option value="full"> {t('full')}</option>
            <option value="partial"> {t('partial')}</option>
          </select>
        </div>

        {/* الدفع الجزئي من المستحق - يظ��ر ��قط عند اختيار السداد الجزئي */}
        {form.paymentType === "partial" && (
          <div className="grid grid-cols-2">
            <h1 className="text-center text-blue-800">
             {t('partialPayment')}
            </h1>
            <input
              type="text"

              inputMode="decimal"
              value={
                form.partialPayment === ""
                  ? ""
                  : Number(form.partialPayment).toLocaleString("en-US")
              }
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, "");
                // دعم الأرقام العشرية: يسمح بالأرقام والنقطة العشرية
                if (/^\d*\.?\d*$/.test(raw)) {
                  const amountDue = Number(form.amountDue) || 0;
                  const partialAmount = Number(raw) || 0;
                  if (partialAmount > amountDue && amountDue > 0) {
                    toast.warn(
                      t("partialPaymentCannotExceedAmountDue"),
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
        {user?.role === "admin" ? t("paidForAdmin") : t("paid")}
        <input
          type="checkbox"
          className="checkbox text-blue-400 mx-2"
          checked={form.isPaid}
          disabled={
            form.paymentType === "partial" || // مق��ل إذا ك��ن الدفع جزئي
            (user?.role === "admin" &&
              users?.find((u) => u.id === form.selectedUserId)?.role ===
                "admin")
          }
          onChange={(e) => setForm({ ...form, isPaid: e.target.checked })}
        />
      </label>

      {/* معلومات إضافية */}
      <div className="bg-blue-50 p-3 rounded-lg text-sm">
        <p className="text-blue-700 font-semibold">{t("note")}:</p>
        <p className="text-blue-600">{t("agentCanBecomeNegative")}</p>

     
      
        <p className="text-orange-600">
          • {t("allAmountsAreSavedInDollars")}
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
          `${t('add')} ${formType === "service" ? t('service') : t('ticket')}`
        )}
      </button>
    </motion.div>
  );
}
