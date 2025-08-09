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
  Ship,
  Trash2,
  Settings,
  BarChart3,
  Calendar,
  Eye,
  EyeOff,
} from "lucide-react";

import { useAppData } from "../../api/useAppData";
import { getServiceTickets } from "../../api/serviceService";
import { useQuery } from "@tanstack/react-query";
import { Modal, ConfirmationModal } from "../ui/modal";
import { Button } from "../ui/botom";
import { toast } from "react-toastify";
import AddTicketForm from "../Agent/Addtick";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrencies, useCurrencyUtils } from "../../api/useCurrency";
import { convertToUSD } from "../../api/currencyService";
import type { TransportType, ServiceTicket } from "../../types";
import { LoadingSpinner, ErrorDisplay } from "../ui/LoadingSpinner";
import { ResponsiveGrid, StatCard, SectionHeader } from "../ui/ResponsiveGrid";
import {
  FloatingActionButton,
  getDefaultFABActions,
} from "../ui/FloatingActionButton";
import { useTranslation } from "react-i18next";

const Dashboard = () => {
  const { t } = useTranslation();
  const {
    usersWithStatsQuery,
    ticketsQuery,
    agentsQuery,
    createAgent,
    deleteAgent,
  } = useAppData();

  // جلب الخدمات
  const serviceTicketsQuery = useQuery<ServiceTicket[]>({
    queryKey: ["serviceTickets"],
    queryFn: getServiceTickets,
  });

  const [name, setName] = useState("");
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const { updateAgentBalance } = useAppData();
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState("");
  const [currenid, setcurrentid] = useState("");
  const [isAddModalOpen2, setAddModalOpen2] = useState(false);
  const [isTicketFormOpen, setTicketFormOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    stats: true,
    monthly: true,
    agents: true,
  });

  const [balance, setBalance] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [agentCurrency, setAgentCurrency] = useState("USD");
  const [transportType, setTransportType] = useState<TransportType>("air");
  const { data: currencies } = useCurrencies();
  const { getCurrencyByCode, getFormattedBalance } = useCurrencyUtils();

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleDeleteAgent = () => {
    if (!agentToDelete) return;
    deleteAgent.mutate(agentToDelete, {
      onSuccess: () => {
        toast.success(t("agentDeleted"));
        setAgentToDelete(null);
      },
      onError: () => {
        toast.error(t("errorDeletingAgent"));
      },
    });
  };

  const handleUpdate = async (type: "set" | "add") => {
    const agent = agentsQuery.data?.find((a) => a.id === currenid);
    if (!agent || !newBalance) return;

    const currency = getCurrencyByCode(selectedCurrency);
    if (!currency) return;

    const amountInUSD = convertToUSD(Number(newBalance), currency);
    const updatedBalance =
      type === "set" ? amountInUSD : agent.balance + amountInUSD;

    updateAgentBalance.mutate(
      { id: currenid, newBalance: updatedBalance, updateType: type },
      {
        onSuccess: () => {
          toast.success(t("balanceUpdated"));
          setNewBalance("");
        },
      },
    );
  };

  if (
    usersWithStatsQuery.isLoading ||
    ticketsQuery.isLoading ||
    agentsQuery.isLoading ||
    serviceTicketsQuery.isLoading
  ) {
    return (
      <LoadingSpinner fullScreen size="lg" text={t("loadingDashboard")} />
    );
  }

  if (
    usersWithStatsQuery.isError ||
    ticketsQuery.isError ||
    agentsQuery.isError ||
    serviceTicketsQuery.isError
  ) {
    return (
      <ErrorDisplay
        title={t("errorLoadingData")}
        message={t("retryLoadingData")}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const totalTickets =
    (ticketsQuery.data?.length || 0) + (serviceTicketsQuery.data?.length || 0);
  const totalUsers = usersWithStatsQuery.data?.length || 0;

  const handleAddagent = async () => {
    if (!name) return toast.error(t("enterAgentName"));

    const numericBalance = Number(balance.replace(/,/g, ""));

    if (isNaN(numericBalance)) {
      return toast.error(t("enterValidBalance"));
    }

    const currency = getCurrencyByCode(selectedCurrency);
    if (!currency) {
      return toast.error(t("selectValidCurrency"));
    }

    const balanceInUSD = convertToUSD(numericBalance, currency);

    createAgent.mutate(
      {
        name,
        balance: balanceInUSD,
        preferredCurrency: agentCurrency,
        transportType,
      },
      {
        onSuccess: () => {
          toast.success(t("agentAdded"));
          setName("");
          setBalance("");
          setSelectedCurrency("USD");
          setAgentCurrency("USD");
          setTransportType("air");
        },
      },
    );
  };

  const allTickets = ticketsQuery.data || [];
  const allServiceTickets = serviceTicketsQuery.data || [];

  // حساب المبالغ المالية مع مراعاة الدفع الجزئي (تذاكر + خدمات)
  // استثناء التذاكر التي agentId = "f2r8ApzPMwpNglkFcghz" من المدفوع
  const ticketsPayed = allTickets
    .filter(t => t.agentId !== "f2r8ApzPMwpNglkFcghz")
    .reduce((sum, t) => sum + Number(t.paidAmount), 0);
  const servicesPayed = allServiceTickets
    .filter(s => s.agentId !== "f2r8ApzPMwpNglkFcghz")
    .reduce((sum, s) => sum + Number(s.paidAmount), 0);
  const payed = ticketsPayed + servicesPayed;

  const ticketsTotalDue = allTickets.reduce((sum, t) => {
    const partialPayment = t.partialPayment || 0;
    const remaining = Number(t.amountDue) - partialPayment;
    return sum + (t.isPaid ? 0 : remaining);
  }, 0);

  const servicesTotalDue = allServiceTickets.reduce((sum, s) => {
    const partialPayment = s.partialPayment || 0;
    const remaining = Number(s.amountDue) - partialPayment;
    return sum + (s.isPaid ? 0 : remaining);
  }, 0);

  const totalDue = ticketsTotalDue + servicesTotalDue;

  // حساب ��لربح: للتذاكر = المستحق - المدفوع من المح��ظة
  // للخدمات = المستحق - سعر الخدمة
  // استثناء التذاكر التي agentId = "f2r8ApzPMwpNglkFcghz" من الربح
  const ticketsProfit = allTickets
    .filter(t => t.agentId !== "f2r8ApzPMwpNglkFcghz")
    .reduce((sum, t) => sum + (Number(t.amountDue) - Number(t.paidAmount)), 0);

  const servicesProfit = allServiceTickets
    .filter(s => s.agentId !== "f2r8ApzPMwpNglkFcghz")
    .reduce((sum, s) => {
      const quantity = s.quantity || 1;
      const totalServiceCost = Number(s.serviceBasePrice) * quantity;
      return sum + (Number(s.amountDue) - totalServiceCost);
    }, 0);

  const totalProfit = ticketsProfit + servicesProfit;

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonthTickets = allTickets.filter((t) => {
    const createdAt =
      typeof t.createdAt === "string" ? new Date(t.createdAt) : "0";
    return createdAt >= firstDayOfMonth && createdAt <= now;
  });

  const thisMonthServiceTickets = allServiceTickets.filter((s) => {
    const createdAt =
      typeof s.createdAt === "string" ? new Date(s.createdAt) : "0";
    return createdAt >= firstDayOfMonth && createdAt <= now;
  });

  const thisMonthTicketsTotalDue = thisMonthTickets.reduce((sum, t) => {
    const partialPayment = t.partialPayment || 0;
    const remaining = Number(t.amountDue) - partialPayment;
    return sum + (t.isPaid ? 0 : remaining);
  }, 0);

  const thisMonthServicesTotalDue = thisMonthServiceTickets.reduce((sum, s) => {
    const partialPayment = s.partialPayment || 0;
    const remaining = Number(s.amountDue) - partialPayment;
    return sum + (s.isPaid ? 0 : remaining);
  }, 0);

  const thisMonthTotalDue =
    thisMonthTicketsTotalDue + thisMonthServicesTotalDue;

  const thisMonthTicketsProfit = thisMonthTickets
    .filter(t => t.agentId !== "f2r8ApzPMwpNglkFcghz")
    .reduce((sum, t) => sum + (Number(t.amountDue) - Number(t.paidAmount)), 0);

  const thisMonthServicesProfit = thisMonthServiceTickets
    .filter(s => s.agentId !== "f2r8ApzPMwpNglkFcghz")
    .reduce((sum, s) => {
      const quantity = s.quantity || 1;
      const totalServiceCost = Number(s.serviceBasePrice) * quantity;
      return sum + (Number(s.amountDue) - totalServiceCost);
    }, 0);

  const thisMonthProfit = thisMonthTicketsProfit + thisMonthServicesProfit;

  const thisMonthTicketsPayed = thisMonthTickets
    .filter(t => t.agentId !== "f2r8ApzPMwpNglkFcghz")
    .reduce((sum, t) => sum + Number(t.paidAmount), 0);

  const thisMonthServicesPayed = thisMonthServiceTickets
    .filter(s => s.agentId !== "f2r8ApzPMwpNglkFcghz")
    .reduce((sum, s) => sum + Number(s.paidAmount), 0);

  const thisMonthpayed = thisMonthTicketsPayed + thisMonthServicesPayed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky  top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">
                    {t("dashboard")}
                  </h1>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => setTicketFormOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 text-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t("newTicket")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Main Statistics Grid */}
        <div className="mb-8 gap-2">
          <SectionHeader
            title={t("generalStatistics")}
            icon={<BarChart3 className="w-5 h-5 text-blue-600 m-2" />}
            isExpanded={expandedSections.stats}
            onToggle={() => toggleSection("stats")}
          />

          <AnimatePresence>
            {expandedSections.stats && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ResponsiveGrid columns={{ base: 1, sm: 2, lg: 4 }}>
                  <StatCard
                    title={t("totalUsers")}
                    value={totalUsers}
                    subtitle={`${t("delivered")} ${totalTickets} ${t("ticket")} `}
                    icon={<Users className="w-6 h-6 text-white" />}
                    gradient="bg-gradient-to-r from-blue-500 to-blue-600"
                    textColor="text-blue-600"
                    delay={0}
                  />
                  <StatCard
                    title={t("totalDue")}
                    value={getFormattedBalance(totalDue, "USD")}
                    subtitle=""
                    icon={<AlertCircle className="w-6 h-6 text-white" />}
                    gradient="bg-gradient-to-r from-red-500 to-red-600"
                    textColor="text-red-600"
                    delay={0.1}
                  />
                  <StatCard
                    title={t("totalPaid")}
                    value={getFormattedBalance(payed, "USD")}
                    subtitle=""
                    icon={<Wallet className="w-6 h-6 text-white" />}
                    gradient="bg-gradient-to-r from-blue-500 to-blue-600"
                    textColor="text-blue-600"
                    delay={0.2}
                  />
                  <StatCard
                    title={t("totalProfit")}
                    value={getFormattedBalance(totalProfit, "USD")}
                    subtitle=""
                    icon={<CheckCircle className="w-6 h-6 text-white" />}
                    gradient="bg-gradient-to-r from-green-500 to-green-600"
                    textColor="text-green-600"
                    delay={0.3}
                  />
                </ResponsiveGrid>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Monthly Statistics */}
        <div className="mb-8">
          <SectionHeader
            title={t("monthlyStatistics")}
            icon={<Calendar className="w-5 h-5 text-indigo-600 m-2" />}
            isExpanded={expandedSections.monthly}
            onToggle={() => toggleSection("monthly")}
          />

          <AnimatePresence>
            {expandedSections.monthly && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ResponsiveGrid columns={{ base: 1, md: 3 }}>
                  <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        {t("monthlyProfit")}
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {getFormattedBalance(thisMonthProfit, "USD")}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        {t("monthlyTotalDue")}
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        {getFormattedBalance(thisMonthTotalDue, "USD")}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Wallet className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        {t("monthlyTotalPaid")}
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {getFormattedBalance(thisMonthpayed, "USD")}
                      </p>
                    </div>
                  </div>
                </ResponsiveGrid>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Agents Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Users className="w-5 h-5 text-purple-600 m-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                {t("agents")}
              </h2>
            </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <button
                onClick={() => setAddModalOpen(true)}
                className="hidden md:flex bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 items-center space-x-2 rtl:space-x-reverse text-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t("newAgent")}</span>
              </button>
              <button
                onClick={() => toggleSection("agents")}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {expandedSections.agents ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {expandedSections.agents && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {agentsQuery.data?.filter(agent => agent.id !== "f2r8ApzPMwpNglkFcghz").map((agent, index) => (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3 space-x-3 rtl:space-x-reverse">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            agent.transportType === "sea"
                              ? "bg-gradient-to-r from-blue-500 to-cyan-600"
                              : "bg-gradient-to-r from-indigo-500 to-purple-600"
                          }`}
                        >
                          {agent.transportType === "sea" ? (
                            <Ship className="w-6 h-6 text-white" />
                          ) : (
                            <Plane className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {agent.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {agent.transportType === "sea"
                              ? `🚢 ${t("seaTransport")}`
                              : `✈️ ${t("airTransport")}`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6 -translate-x-2">
                      <p className="text-sm text-gray-600 mb-1">
                        {t("currentBalance")}
                      </p>
                      <p
                        className={`text-xl font-bold ${
                          agent.balance >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {getFormattedBalance(
                          agent.balance,
                          agent.preferredCurrency || "USD",
                        )}
                      </p>
                    </div>

                    <div className="flex justify-between space-x-2 rtl:space-x-reverse">
                      <button
                        onClick={() => {
                          setAddModalOpen2(true);
                          setcurrentid(agent.id);
                        }}
                        className=" bg-blue-500 hover:bg-blue-600  text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1 rtl:space-x-reverse"
                      >
                        <Settings className="w-4 h-4" />
                        <span>{t("update")}</span>
                      </button>
                      <button
                        onClick={() => setAgentToDelete(agent.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Floating Action Button for Mobile */}
      <FloatingActionButton
        actions={getDefaultFABActions(
          () => setTicketFormOpen(true),
          () => setAddModalOpen(true),
        )}
      />

      {/* Modals */}
      <Modal
        isOpen={isTicketFormOpen}
        onClose={() => setTicketFormOpen(false)}
        title={t("newTicket")}
      >
        <AddTicketForm />
      </Modal>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={t("newAgent")}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("agentName")}
            </label>
            <input
              type="text"
              placeholder={t("enterAgentName")}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-blue-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("transportType")}
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-blue-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={transportType}
              onChange={(e) =>
                setTransportType(e.target.value as TransportType)
              }
            >
              <option value="air">✈️ {t("air")}</option>
              <option value="sea">🚢 {t("sea")}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("agentCurrency")}
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 text-blue-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
            >
              <option disabled value="">
                {t("selectAgentCurrency")}
              </option>
              {currencies?.map((currency) => (
                <option key={currency.id} value={currency.code}>
                  {currency.name} ({currency.symbol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("initialBalance")}
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder={t("enterInitialBalance")}
              className="w-full px-4 py-3 border text-blue-600 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={
                balance === "" ? "" : Number(balance).toLocaleString("en-US")
              }
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, "");
                // دعم الأرقام العشرية مع الأرقام السالبة
                if (/^-?\d*\.?\d*$/.test(raw)) {
                  setBalance(raw);
                }
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("agentCurrency")}
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 text-blue-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={agentCurrency}
              onChange={(e) => setAgentCurrency(e.target.value)}
            >
              <option disabled value="">
                {t("selectAgentCurrency")}
              </option>
              {currencies?.map((currency) => (
                <option key={currency.id} value={currency.code}>
                  {currency.name} ({currency.symbol})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4">
            <Button
              onClick={() => {
                setAddModalOpen(false);
                handleAddagent();
              }}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 rounded-xl font-medium transition-all duration-200"
            >
              {t("addAgent")}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isAddModalOpen2}
        onClose={() => {
          setAddModalOpen2(false);
          setNewBalance("");
        }}
        title={t("updateAgentBalance")}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("currency")}
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 text-blue-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("amount")}
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder={t("enterAmount")}
              value={
                newBalance === ""
                  ? ""
                  : Number(newBalance).toLocaleString("en-US")
              }
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, "");
                // دعم الأرقام العشرية مع الأرقام السالبة
                if (/^-?\d*\.?\d*$/.test(raw)) {
                  setNewBalance(raw);
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-blue-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="flex space-x-3 rtl:space-x-reverse pt-4">
            <Button
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition-colors"
              onClick={() => {
                handleUpdate("set");
                setAddModalOpen2(false);
              }}
            >
              {t("set")}
            </Button>
            <Button
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition-colors"
              onClick={() => {
                handleUpdate("add");
                setAddModalOpen2(false);
              }}
            >
              {t("addBalance")}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={!!agentToDelete}
        onClose={() => setAgentToDelete(null)}
        onConfirm={handleDeleteAgent}
        title={t("deleteAgent")}
        message={t("deleteAgentMessage")}
        confirmText={t("deleteAgentConfirm")}
        cancelText={t("cancel")}
        confirmColor="bg-red-500 hover:bg-red-600"
      />
    </div>
  );
};

export default Dashboard;
