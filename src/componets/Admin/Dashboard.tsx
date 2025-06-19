import { useState } from "react";
import {
  Users,
  AlertCircle,
  CheckCircle,
  PlusCircle,
  TrendingUp,
  CreditCard,
  Wallet,
  Plane,
  Trash2,
} from "lucide-react";
import { Card } from "../ui/card";
import { useAppData } from "../../api/useAppData";
import { Modal } from "../ui/modal";
import { Button } from "../ui/botom";
import { toast } from "react-toastify";
import AddTicketForm from "../Agent/Addtick";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
const Dashboard = () => {
  const {
    usersWithStatsQuery,
    ticketsQuery,
    agentsQuery,
    createAgent,
    deleteAgent,
  } = useAppData();

  const [name, setName] = useState("");
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const { updateAgentBalance } = useAppData();
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState("");
  const [currenid, setcurrentid] = useState("");
  const [isAddModalOpen2, setAddModalOpen2] = useState(false);
  const { user } = useAuth();
  const [balance, setBalance] = useState("");
  const handleDeleteAgent = () => {
    if (!agentToDelete) return;
    deleteAgent.mutate(agentToDelete, {
      onSuccess: () => {
        toast.success("تم حذف الوكيل بنجاح");
        setAgentToDelete(null);
      },
      onError: () => {
        toast.error("حدث خطأ أثناء الحذف");
      },
    });
  };

  const handleUpdate = (type: "set" | "add") => {
    const agent = agentsQuery.data?.find((a) => a.id === currenid);
    if (!agent || Number(newBalance) < 1) return;

    const updatedBalance =
      type === "set" ? Number(newBalance) : agent.balance + Number(newBalance);

    updateAgentBalance.mutate(
      { id: currenid, newBalance: updatedBalance },
      {
        onSuccess: () => {
          toast.success("✅ تم تحديث الرصيد");
          setNewBalance("");
        },
      }
    );
  };

  if (
    usersWithStatsQuery.isLoading ||
    ticketsQuery.isLoading ||
    agentsQuery.isLoading
  )
    return <p>جاري التحميل...</p>;

  if (
    usersWithStatsQuery.isError ||
    ticketsQuery.isError ||
    agentsQuery.isError
  )
    return <p>حدث خطأ أثناء تحميل البيانات</p>;
  const totalTickets = ticketsQuery.data?.length || 0;
  const totalUsers = usersWithStatsQuery.data?.length || 0;

  const handleAddagent = () => {
    if (!name) return alert("ادخل اسم الوكيل");

    const numericBalance = Number(balance.replace(/,/g, ""));

    if (isNaN(numericBalance) || numericBalance < 0) {
      return alert("الرجاء إدخال رصيد صحيح");
    }

    createAgent.mutate(
      { name, balance: numericBalance },
      {
        onSuccess: () => {
          alert("تم إضافة الوكيل بنجاح");
          setName("");
          setBalance("");
        },
      }
    );
  };

  const allTickets = ticketsQuery.data || [];

  // التذاكر التي لم تُدفع بالكامل
  const unpaidTickets = allTickets.filter((t) => !t.isPaid);
  const payed = allTickets.reduce((sum, t) => sum + Number(t.paidAmount), 0);
  // مجموع المبالغ المستحقة
  const totalDue = unpaidTickets.reduce(
    (sum, t) => sum + Number(t.amountDue),
    0
  );

  // مجموع الربح (الفرق بين المستحق والمدفوع)
  const totalProfit = allTickets.reduce(
    (sum, t) => sum + (Number(t.amountDue) - Number(t.paidAmount)),
    0
  );
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // فلترة التذاكر الخاصة بهذا الشهر
  const thisMonthTickets = allTickets.filter((t) => {
    const createdAt =
      typeof t.createdAt === "string" ? new Date(t.createdAt) : "0";

    return createdAt >= firstDayOfMonth && createdAt <= now;
  });

  // تذاكر هذا الشهر غير المدفوعة
  const thisMonthUnpaid = thisMonthTickets.filter((t) => !t.isPaid);

  // مجموع المبالغ المستحقة لهذا الشهر
  const thisMonthTotalDue = thisMonthUnpaid.reduce(
    (sum, t) => sum + Number(t.amountDue),
    0
  );

  // مجموع الربح لهذا الشهر
  const thisMonthProfit = thisMonthTickets.reduce(
    (sum, t) => sum + (Number(t.amountDue) - Number(t.paidAmount)),
    0
  );
  const thisMonthpayed = thisMonthTickets.reduce(
    (sum, t) => sum + Number(t.paidAmount),
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 space-y-6 text-black max-w-md mx-auto"
    >
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="إضافة وكيل "
      >
        <div className="space-y-3">
          <input
            type="text"
            placeholder="الاسم"
            className="input  bg-blue-100 text-black input-bordered  w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="الرصيد"
            className="input bg-blue-100 text-black input-bordered w-full"
            value={
              balance === "" ? "" : Number(balance).toLocaleString("en-US")
            }
            onChange={(e) => {
              const raw = e.target.value.replace(/,/g, "");
              if (/^\d*$/.test(raw)) {
                setBalance(raw);
              }
            }}
          />

          <Button
            onClick={() => {
              setAddModalOpen(false);
              handleAddagent();
            }}
          >
            اضافة
          </Button>
        </div>
      </Modal>
      <Modal
        isOpen={isAddModalOpen2}
        onClose={() => {
          setAddModalOpen2(false);
          setNewBalance("");
        }}
        title="تحديث رصيد الوكيل"
      >
        <div className="space-y-3">
          <input
            type="text"
            inputMode="numeric"
            placeholder=""
            value={
              newBalance === ""
                ? ""
                : Number(newBalance).toLocaleString("en-US")
            }
            onChange={(e) => {
              const raw = e.target.value.replace(/,/g, ""); // إزالة الفواصل
              if (/^\d*$/.test(raw)) {
                setNewBalance(raw); // نحفظ الرقم بدون فواصل
              }
            }}
            className="input bg-blue-100 text-black input-bordered w-full"
          />

          <div className="flex justify-between gap-4">
            <Button
              className="flex-1"
              onClick={() => {
                handleUpdate("set");
                setAddModalOpen2(false);
              }}
            >
              تعيين رصيد جديد
            </Button>
            <Button
              className="flex-1 bg-green-500 hover:bg-green-600"
              onClick={() => {
                handleUpdate("add");
                setAddModalOpen2(false);
              }}
            >
              إضافة للموجود
            </Button>
          </div>
        </div>
      </Modal>

      <div className="space-y-2">
        <h2 className="text-sm text-gray-600 font-semibold p-2">الإحصائيات</h2>
        <div className="grid gap-3">
          <Card className="flex items-center border-s-2 border-blue-400 justify-between p-4">
            <div>
              <div className="flex gap-2">
                <h2 className="text-lg font-bold text-blue-400">
                  {totalUsers}
                </h2>
                <p className="text-lg text-gray-500">مستخدم</p>
              </div>
              <p className="text-lg text-blue-400">
                اصدرو {totalTickets} تذكرة
              </p>
            </div>
            <Users className="w-6 h-6 text-blue-500" />
          </Card>

          <Card className="flex items-center justify-between p-4 border-s-2 border-red-500">
            <div>
              <p className="text-lg text-gray-500">
                مبالغ مستحقة على المستخدمين
              </p>
              <h2 className="text-lg font-bold text-red-600">
                {" "}
                {Number(totalDue).toLocaleString("en-US")} ر.س
              </h2>
            </div>
            <AlertCircle className="w-6 h-6 text-red-500" />
          </Card>
          <Card className="flex items-center border-s-2 border-blue-400 justify-between p-4">
            <div>
              <div className="flex gap-2">
                <p className="text-lg text-gray-500">المدفوع</p>
              </div>
              <p className="text-lg text-blue-400">
                {" "}
                {Number(payed).toLocaleString("en-US")} ر.س
              </p>
            </div>
            <Wallet className="w-5 h-5 text-blue-500" />
          </Card>
          <Card className="flex items-center border-s-2 border-green-600 justify-between p-4">
            <div>
              <p className="text-lg text-gray-500">صافي الربح</p>
              <h2 className="text-lg font-bold text-green-600">
                {Number(totalProfit).toLocaleString("en-US")} ر.س
              </h2>
            </div>
            <CheckCircle className="w-6 h-6 text-green-500" />
          </Card>
        </div>
      </div>
      {/* المالية */}
      <div className="space-y-2">
        <h3 className="text-sm text-gray-600 font-semibold">خلال هذا الشهر </h3>
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 flex flex-col items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <p className="text-xs text-gray-500">الربح</p>
            <span className="font-bold text-green-600 text-sm">
              {Number(thisMonthProfit).toLocaleString("en-US")} ر.س
            </span>
          </Card>
          <Card className="p-3 flex flex-col items-center justify-center">
            <CreditCard className="w-5 h-5 text-red-500" />
            <p className="text-xs text-gray-500">المستحق</p>
            <span className="font-bold text-red-600 text-sm">
              {Number(thisMonthTotalDue).toLocaleString("en-US")} ر.س
            </span>
          </Card>
          <Card className="p-3 flex flex-col items-center justify-center">
            <Wallet className="w-5 h-5 text-blue-500" />
            <p className="text-xs text-gray-500">المدفوع</p>
            <span className="font-bold text-blue-600 text-sm">
              {Number(thisMonthpayed).toLocaleString("en-US")} ر.س
            </span>
          </Card>
        </div>
      </div>
      {/* الوكلاء */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold p-2">الوكلاء</h3>
          <button
            className="text-blue-500 text-sm flex items-center gap-1 rounded-xl bg-white p-1"
            onClick={() => setAddModalOpen(true)}
          >
            <PlusCircle className="w-4 h-4 items-center" /> جديد
          </button>
        </div>

        {agentsQuery.data?.map((agent) => (
          <>
            <Card className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Plane className="w-6 h-6 text-blue-500" />{" "}
                {/* أيقونة الطائرة */}
                <div>
                  <h4 className="font-bold">{agent.name}</h4>
                  <p className="text-sm text-gray-500">
                    رصيد: {agent.balance} ر.س
                  </p>
                </div>
              </div>
              <div className="gap-4 flex">
                <button
                  className="text-blue-500 text-sm"
                  onClick={() => {
                    setAddModalOpen2(true);
                    setcurrentid(agent.id);
                  }}
                >
                  تحديث الرصيد
                </button>
                <button
                  className="text-red-500 text-sm flex items-center gap-1"
                  onClick={() => setAgentToDelete(agent.id)}
                >
                  <Trash2 className="w-4 h-4" />
                  حذف
                </button>
              </div>
            </Card>
          </>
        ))}
      </div>

      <AddTicketForm userId={user?.id} />
      <Modal
        isOpen={!!agentToDelete}
        onClose={() => setAgentToDelete(null)}
        title="تأكيد الحذف"
      >
        <p className="text-sm text-gray-700">
          هل أنت متأكد أنك تريد حذف هذا الوكيل؟
        </p>
        <div className="mt-4 flex gap-3 justify-end">
          <button
            onClick={handleDeleteAgent}
            className="btn btn-sm btn-error text-white"
          >
            نعم، حذف
          </button>
          <button
            onClick={() => setAgentToDelete(null)}
            className="btn btn-sm btn-ghost"
          >
            إلغاء
          </button>
        </div>
      </Modal>
    </motion.div>
  );
};

export default Dashboard;
