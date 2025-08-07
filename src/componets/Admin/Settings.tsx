import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Settings as SettingsIcon,
  DollarSign,
  Briefcase,
  Database,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Modal } from "../ui/modal";
import { Button } from "../ui/botom";
import type { Currency, Service } from "../../types";
import { useAuth } from "../../context/AuthContext";
import {
  getAllCurrencies,
  addCurrency,
  updateCurrency,
  deleteCurrency,
  initializeDefaultCurrencies,
} from "../../api/currencyService";
import {
  getAllServices,
  addService,
  updateService,
  deleteService,
  initializeDefaultServices,
} from "../../api/serviceService";
import { useTranslation } from "react-i18next";
import {
  collection,
  getDocs,
  writeBatch
} from "firebase/firestore";
import { db } from "../../api/Firebase";

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"currencies" | "services" | "dataManagement">(
    "currencies",
  );
  const { t } = useTranslation();

  // Currency states
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [currencyLoading, setCurrencyLoading] = useState(true);
  const [isAddCurrencyModalOpen, setAddCurrencyModalOpen] = useState(false);
  const [isEditCurrencyModalOpen, setEditCurrencyModalOpen] = useState(false);
  const [currencyToDelete, setCurrencyToDelete] = useState<string | null>(null);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);

  const [currencyForm, setCurrencyForm] = useState({
    code: "",
    name: "",
    symbol: "",
    exchangeRate: "",
    isActive: true,
  });

  // Service states
  const [services, setServices] = useState<Service[]>([]);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [isAddServiceModalOpen, setAddServiceModalOpen] = useState(false);
  const [isEditServiceModalOpen, setEditServiceModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [serviceForm, setServiceForm] = useState({
    name: "",
    price: "",
    isActive: true,
  });

  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Data management states
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"logs" | "tickets" | "serviceTickets" | "agents" | "chats" | "all" | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadCurrencies();
    loadServices();
  }, []);

  // Currency functions
  const loadCurrencies = async () => {
    try {
      setCurrencyLoading(true);
      await initializeDefaultCurrencies();
      const allCurrencies = await getAllCurrencies();
      setCurrencies(allCurrencies);
    } catch (error) {
      console.error("Error loading currencies:", error);
      toast.error(t("failedToLoadCurrencies"));
    } finally {
      setCurrencyLoading(false);
    }
  };

  const handleAddCurrency = async () => {
    setError("");
    setFormLoading(true);

    // Validation
    if (
      !currencyForm.code.trim() ||
      !currencyForm.name.trim() ||
      !currencyForm.symbol.trim()
    ) {
      setError(t("fillAllRequiredFields"));
      setFormLoading(false);
      return;
    }

    if (!currencyForm.exchangeRate || Number(currencyForm.exchangeRate) <= 0) {
      setError(t("enterValidExchangeRate"));
      setFormLoading(false);
      return;
    }

    // Check if currency code already exists
    if (
      currencies.some(
        (c) => c.code.toUpperCase() === currencyForm.code.toUpperCase(),
      )
    ) {
      setError(t("currencyCodeAlreadyExists"));
      setFormLoading(false);
      return;
    }

    try {
      await addCurrency(
        {
          code: currencyForm.code.toUpperCase(),
          name: currencyForm.name.trim(),
          symbol: currencyForm.symbol.trim(),
          exchangeRate: Number(currencyForm.exchangeRate),
          isActive: currencyForm.isActive,
        },
        user?.id,
        user?.name,
      );

      toast.success(t("currencyAddedSuccessfully"));
      setAddCurrencyModalOpen(false);
      resetCurrencyForm();
      loadCurrencies();
    } catch (error) {
      console.error("Error adding currency:", error);
      setError(t("errorAddingCurrency"));
      toast.error(t("failedToAddCurrency"));
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditCurrency = async () => {
    if (!editingCurrency) return;

    setError("");
    setFormLoading(true);

    // Validation
    if (
      !currencyForm.code.trim() ||
      !currencyForm.name.trim() ||
      !currencyForm.symbol.trim()
    ) {
      setError(t("fillAllRequiredFields"));
      setFormLoading(false);
      return;
    }

    if (!currencyForm.exchangeRate || Number(currencyForm.exchangeRate) <= 0) {
      setError(t("enterValidExchangeRate"));
      setFormLoading(false);
      return;
    }

    // Prevent editing USD exchange rate
    if (
      editingCurrency.code === "USD" &&
      Number(currencyForm.exchangeRate) !== 1.0
    ) {
      setError(t("cannotChangeExchangeRateOfUSD"));
      setFormLoading(false);
      return;
    }

    try {
      await updateCurrency(
        editingCurrency.id,
        {
          code: currencyForm.code.toUpperCase(),
          name: currencyForm.name.trim(),
          symbol: currencyForm.symbol.trim(),
          exchangeRate: Number(currencyForm.exchangeRate),
          isActive: currencyForm.isActive,
        },
        user?.id,
        user?.name,
        editingCurrency.name,
        editingCurrency.code,
      );

      toast.success(t("currencyUpdatedSuccessfully"));
      setEditCurrencyModalOpen(false);
      setEditingCurrency(null);
      resetCurrencyForm();
      loadCurrencies();
    } catch (error) {
      console.error("Error updating currency:", error);
      setError(t("errorUpdatingCurrency"));
      toast.error(t("failedToUpdateCurrency"));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCurrency = async () => {
    if (!currencyToDelete) return;

    const currency = currencies.find((c) => c.id === currencyToDelete);
    if (currency?.code === "USD") {
      toast.error(t("cannotDeleteUSD"));
      setCurrencyToDelete(null);
      return;
    }

    try {
      await deleteCurrency(
        currencyToDelete,
        user?.id,
        user?.name,
        currency?.name,
        currency?.code,
      );
      toast.success(t("currencyDeletedSuccessfully"));
      setCurrencyToDelete(null);
      loadCurrencies();
    } catch (error) {
      console.error("Error deleting currency:", error);
      toast.error(t("failedToDeleteCurrency"));
    }
  };

  const openEditCurrencyModal = (currency: Currency) => {
    setEditingCurrency(currency);
    setCurrencyForm({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      exchangeRate: currency.exchangeRate.toString(),
      isActive: currency.isActive,
    });
    setEditCurrencyModalOpen(true);
  };

  const resetCurrencyForm = () => {
    setCurrencyForm({
      code: "",
      name: "",
      symbol: "",
      exchangeRate: "",
      isActive: true,
    });
    setError("");
  };

  // Service functions
  const loadServices = async () => {
    try {
      setServiceLoading(true);
      await initializeDefaultServices();
      const allServices = await getAllServices();
      setServices(allServices);
    } catch (error) {
      console.error("Error loading services:", error);
      toast.error(t("failedToLoadServices"));
    } finally {
      setServiceLoading(false);
    }
  };

  const handleAddService = async () => {
    setError("");
    setFormLoading(true);

    // Validation
    if (!serviceForm.name.trim()) {
      setError(t("fillAllRequiredFields"));
      setFormLoading(false);
      return;
    }

    if (!serviceForm.price || Number(serviceForm.price) <= 0) {
      setError(t("enterValidServicePrice"));
      setFormLoading(false);
      return;
    }

    // Check if service name already exists
    if (
      services.some(
        (s) => s.name.toLowerCase() === serviceForm.name.trim().toLowerCase(),
      )
    ) {
      setError(t("serviceAlreadyExists"));
      setFormLoading(false);
      return;
    }

    try {
      await addService(
        {
          name: serviceForm.name.trim(),
          price: Number(serviceForm.price),
          isActive: serviceForm.isActive,
        },
        user?.id,
        user?.name,
      );

      toast.success(t("serviceAddedSuccessfully"));
      setAddServiceModalOpen(false);
      resetServiceForm();
      loadServices();
    } catch (error) {
      console.error("Error adding service:", error);
      setError(t("errorAddingService"));
      toast.error(t("failedToAddService"));
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditService = async () => {
    if (!editingService) return;

    setError("");
    setFormLoading(true);

    // Validation
    if (!serviceForm.name.trim()) {
      setError(t("fillAllRequiredFields"));
      setFormLoading(false);
      return;
    }

    if (!serviceForm.price || Number(serviceForm.price) <= 0) {
      setError(t("enterValidServicePrice"));
      setFormLoading(false);
      return;
    }

    try {
      await updateService(
        editingService.id,
        {
          name: serviceForm.name.trim(),
          price: Number(serviceForm.price),
          isActive: serviceForm.isActive,
        },
        user?.id,
        user?.name,
        editingService.name,
        editingService.price,
      );

      toast.success(t("serviceUpdatedSuccessfully"));
      setEditServiceModalOpen(false);
      setEditingService(null);
      resetServiceForm();
      loadServices();
    } catch (error) {
      console.error("Error updating service:", error);
      setError(t("errorUpdatingService"));
      toast.error(t("failedToUpdateService"));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;

    const service = services.find((s) => s.id === serviceToDelete);

    try {
      await deleteService(serviceToDelete, user?.id, user?.name, service?.name);
      toast.success(t("serviceDeletedSuccessfully"));
      setServiceToDelete(null);
      loadServices();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error(t("failedToDeleteService"));
    }
  };

  const openEditServiceModal = (service: Service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      price: service.price.toString(),
      isActive: service.isActive,
    });
    setEditServiceModalOpen(true);
  };

  const resetServiceForm = () => {
    setServiceForm({
      name: "",
      price: "",
      isActive: true,
    });
    setError("");
  };

  // Data management functions
  const handleDataDeletion = async () => {
    if (!deleteType) return;

    setDeleteLoading(true);
    try {
      const batch = writeBatch(db);

      switch (deleteType) {
        case "logs":
          // Delete all logs
          const logsSnapshot = await getDocs(collection(db, "logs"));
          logsSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });
          break;

        case "tickets":
          // Delete all tickets
          const ticketsSnapshot = await getDocs(collection(db, "tickets"));
          ticketsSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });
          break;

        case "serviceTickets":
          // Delete all service tickets
          const serviceTicketsSnapshot = await getDocs(collection(db, "serviceTickets"));
          serviceTicketsSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });
          break;

        case "chats":
          
          const chatsSnapshot = await getDocs(collection(db, "chat"));
          chatsSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });
          break;

        case "agents":
          // Delete all agents
          const agentsSnapshot = await getDocs(collection(db, "agents"));
          agentsSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });
          break;

        case "all":
          // Delete everything except users
          const collections = ["logs", "tickets", "serviceTickets", "agents"];
          for (const collectionName of collections) {
            const snapshot = await getDocs(collection(db, collectionName));
            snapshot.docs.forEach((doc) => {
              batch.delete(doc.ref);
            });
          }
          break;
      }

      await batch.commit();

      const successMessages = {
        logs: t("logsDeletedSuccess"),
        tickets: t("ticketsDeletedSuccess"),
        serviceTickets: t("serviceTicketsDeletedSuccess"),
        agents: t("agentsDeletedSuccess"),
        all: t("systemDataResetSuccess"),
        chats: t("chatsDeletedSuccess")
      };

      toast.success(successMessages[deleteType]);
      setDeleteConfirmOpen(false);
      setDeleteType(null);

    } catch (error) {
      console.error("Error deleting data:", error);
      toast.error(t("errorDeletingData"));
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDeleteConfirm = (type: "logs" | "tickets" | "serviceTickets" | "agents" | "chats" | "all") => {
    setDeleteType(type);
    setDeleteConfirmOpen(true);
  };

  if (currencyLoading && serviceLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        {t("loading")}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 space-y-4 text-black max-w-screen mx-auto"
    >
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* معلومات القسم */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <SettingsIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {t("settingsTitle")}
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  {t("settingsDescription")}
                </p>
              </div>
            </div>

                {/* Tabs */}
      <div className="flex  rounded-lg p-1 w-full max-w-2xl mx-auto">
        <button
          onClick={() => setActiveTab("currencies")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "currencies"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          {t("currencies")}
        </button>
        <button
          onClick={() => setActiveTab("services")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "services"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          {t("services")}
        </button>
        <button
          onClick={() => setActiveTab("dataManagement")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "dataManagement"
              ? "bg-white text-red-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Database className="w-4 h-4" />
          {t("dataManagement")}
        </button>
      </div>

           
          </div>
        </div>
      </div>


 
      {/* Currency Tab */}
      {activeTab === "currencies" && (
        <div className="p-4 space-y-4 text-black max-w-screen mx-auto">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">{t("currencies")}</h2>
            <Button onClick={() => setAddCurrencyModalOpen(true)}>
              <Plus className="w-5 h-5 ml-1" />
              {t("addCurrency")}
            </Button>
          </div>

          <div className="space-y-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currencies.map((currency) => (
              <div
                key={currency.id}
                className={` rounded-lg h-24 shadow-sm px-4 py-3 flex items-center justify-between ${
                  !currency.isActive ? "opacity-50" : "" 
                } ${currency.code === "USD" ? "bg-blue-300 text-white  " : "bg-white"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                    {currency.code}
                  </div>
                  <div>
                    <p className="font-semibold">{currency.name}</p>
                    <p className="text-sm text-gray-500">
                      {currency.symbol} • {t("exchangeRate")}: {currency.exchangeRate}
                      {!currency.isActive && " • غير نشط"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => openEditCurrencyModal(currency)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {currency.code !== "USD" && (
                    <button
                      onClick={() => setCurrencyToDelete(currency.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {currencies.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              {t("noCurrenciesAdded")}
            </div>
          )}
        </div>
      )}

      {/* Services Tab */}
      {activeTab === "services" && (
        <>
          <div className="p-4 space-y-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold">{t("services")}</h2>
            <Button onClick={() => setAddServiceModalOpen(true)}>
              <Plus className="w-5 h-5 ml-1" />
              {t("addService")}
            </Button>
          </div>

          <div className="space-y-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <div
                key={service.id}
                className={`bg-white h-24 rounded-lg shadow-sm px-4 py-3 flex items-center justify-between ${
                  !service.isActive ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{service.name}</p>
                    <p className="text-sm text-gray-500">
                      {t("price")}: ${service.price}
                      {!service.isActive && " • " + t("inactive")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => openEditServiceModal(service)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setServiceToDelete(service.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {services.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              {t("noServicesAdded")}
            </div>
          )}
        </>
      )}

      {/* Data Management Tab */}
      {activeTab === "dataManagement" && (
        <>
          <div className="p-4 space-y-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Database className="w-5 h-5 text-red-600" />
              {t("dataManagement")}
            </h2>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-800">{t("warning")}</h3>
            </div>
            <p className="text-red-700 text-sm">
              {t("dataDeletionWarning")}
            </p>
          </div>

          <div className="space-y-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Delete Logs */}
            <div className="bg-white rounded-lg shadow-sm px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold">{t("deleteLogs")}</p>
                <p className="text-sm text-gray-500">{t("deleteLogsDescription")}</p>
              </div>
              <Button
                onClick={() => openDeleteConfirm("logs")}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Trash2 className="w-4 h-4 ml-1" />
                {t("deleteLogs")}
              </Button>
            </div>

            {/* Delete Tickets */}
            <div className="bg-white rounded-lg shadow-sm px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold">{t("deleteTickets")}</p>
                <p className="text-sm text-gray-500">{t("deleteTicketsDescription")}</p>
              </div>
              <Button
                onClick={() => openDeleteConfirm("tickets")}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <Trash2 className="w-4 h-4 ml-1" />
                {t("deleteTickets")}
              </Button>
            </div>

            {/* Delete Service Tickets */}
            <div className="bg-white rounded-lg shadow-sm px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold">{t("deleteServiceTickets")}</p>
                <p className="text-sm text-gray-500">{t("deleteServiceTicketsDescription")}</p>
              </div>
              <Button
                onClick={() => openDeleteConfirm("serviceTickets")}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <Trash2 className="w-4 h-4 ml-1" />
                {t("deleteServiceTickets")}
              </Button>
            </div>

            {/* Delete Agents */}
            <div className="bg-white rounded-lg shadow-sm px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold">{t("deleteAgents")}</p>
                <p className="text-sm text-gray-500">{t("deleteAgentsDescription")}</p>
              </div>
              <Button
                onClick={() => openDeleteConfirm("agents")}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <Trash2 className="w-4 h-4 ml-1" />
                {t("deleteAgents")}
              </Button>
            </div>

            {/* Delete chats */}
            <div className="bg-white rounded-lg shadow-sm px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold">{t("deleteChats")}</p>
                <p className="text-sm text-gray-500">{t("deleteChatsDescription")}</p>
              </div>
              <Button
                onClick={() => openDeleteConfirm("chats")}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <Trash2 className="w-4 h-4 ml-1" />
                {t("deleteChats")}
              </Button>
            </div>

            {/* Reset All System Data */}
            <div className="bg-red-100 border border-red-300 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-red-800">{t("resetSystemData")}</p>
                  <p className="text-sm text-red-600">{t("resetSystemDataDescription")}</p>
                </div>
                <Button
                  onClick={() => openDeleteConfirm("all")}
                  className="bg-red-700 hover:bg-red-800 text-white"
                >
                  <AlertTriangle className="w-4 h-4 ml-1" />
                  {t("resetSystemData")}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Currency Modals */}
      {/* Add Currency Modal */}
      <Modal
        isOpen={isAddCurrencyModalOpen}
        onClose={() => {
          setAddCurrencyModalOpen(false);
          resetCurrencyForm();
        }}
        title={t("addCurrency")}
      >
        <div className="space-y-3">
          <input
            type="text"
            placeholder={t("currencyCode")}
            className="input bg-slate-100 input-bordered w-full"
            value={currencyForm.code}
            onChange={(e) =>
              setCurrencyForm((prev) => ({
                ...prev,
                code: e.target.value.toUpperCase(),
              }))
            }
            maxLength={3}
          />

          <input
            type="text"
            placeholder={t("currencyName")}
            className="input bg-slate-100 input-bordered w-full"
            value={currencyForm.name}
            onChange={(e) =>
              setCurrencyForm((prev) => ({ ...prev, name: e.target.value }))
            }
          />

          <input
            type="text"
            placeholder={t("currencySymbol")}
            className="input bg-slate-100 input-bordered w-full"
            value={currencyForm.symbol}
            onChange={(e) =>
              setCurrencyForm((prev) => ({ ...prev, symbol: e.target.value }))
            }
          />

          <input
            type="number"
            step="0.01"
            placeholder={t("exchangeRate")}
            className="input bg-slate-100 input-bordered w-full"
            value={currencyForm.exchangeRate}
            onChange={(e) =>
              setCurrencyForm((prev) => ({
                ...prev,
                exchangeRate: e.target.value,
              }))
            }
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="checkbox"
              checked={currencyForm.isActive}
              onChange={(e) =>
                setCurrencyForm((prev) => ({
                  ...prev,
                  isActive: e.target.checked,
                }))
              }
            />
            <label className="text-sm">{t("active")}</label>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAddCurrencyModalOpen(false);
                resetCurrencyForm();
              }}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleAddCurrency} disabled={formLoading}>
              {formLoading ? t("loading") : t("addCurrency")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Currency Modal */}
      <Modal
        isOpen={isEditCurrencyModalOpen}
        onClose={() => {
          setEditCurrencyModalOpen(false);
          setEditingCurrency(null);
          resetCurrencyForm();
        }}
        title={t("editCurrency")}
      >
        <div className="space-y-3">
          <input
            type="text"
            placeholder={t("currencyCode")}
            className="input bg-slate-100 input-bordered w-full"
            value={currencyForm.code}
            onChange={(e) =>
              setCurrencyForm((prev) => ({
                ...prev,
                code: e.target.value.toUpperCase(),
              }))
            }
            disabled={editingCurrency?.code === "USD"}
            maxLength={3}
          />

          <input
            type="text"
            placeholder={t("currencyName")}
            className="input bg-slate-100 input-bordered w-full"
            value={currencyForm.name}
            onChange={(e) =>
              setCurrencyForm((prev) => ({ ...prev, name: e.target.value }))
            }
          />

          <input
            type="text"
            placeholder={t("currencySymbol")}
            className="input bg-slate-100 input-bordered w-full"
            value={currencyForm.symbol}
            onChange={(e) =>
              setCurrencyForm((prev) => ({ ...prev, symbol: e.target.value }))
            }
          />

          <input
            type="number"
            step="0.01"
            placeholder={t("exchangeRate")}
            className="input bg-slate-100 input-bordered w-full"
            value={currencyForm.exchangeRate}
            onChange={(e) =>
              setCurrencyForm((prev) => ({
                ...prev,
                exchangeRate: e.target.value,
              }))
            }
            disabled={editingCurrency?.code === "USD"}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="checkbox"
              checked={currencyForm.isActive}
              onChange={(e) =>
                setCurrencyForm((prev) => ({
                  ...prev,
                  isActive: e.target.checked,
                }))
              }
              disabled={editingCurrency?.code === "USD"}
            />
            <label className="text-sm">{t("active")}</label>
          </div>

          {editingCurrency?.code === "USD" && (
            <p className="text-sm text-blue-600">
              {t("note3")}
            </p>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditCurrencyModalOpen(false);
                setEditingCurrency(null);
                resetCurrencyForm();
              }}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleEditCurrency} disabled={formLoading}>
              {formLoading ? t("loading") : t("save")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Currency Confirmation Modal */}
      <Modal
        isOpen={!!currencyToDelete}
        onClose={() => setCurrencyToDelete(null)}
        title={t("deleteCurrency")}
      >
        <p className="text-sm text-gray-700 mb-4">
          {t("confirmDeleteCurrency")}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setCurrencyToDelete(null)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleDeleteCurrency}
            className="bg-red-600 hover:bg-red-700"
          >
            {t("deleteCurrency")}
          </Button>
        </div>
      </Modal>

      {/* Service Modals */}
      {/* Add Service Modal */}
      <Modal
        isOpen={isAddServiceModalOpen}
        onClose={() => {
          setAddServiceModalOpen(false);
          resetServiceForm();
        }}
        title={t("addService")}
      >
        <div className="space-y-3">
          <input
            type="text"
            placeholder={t("serviceName")}
            className="input bg-slate-100 input-bordered w-full"
            value={serviceForm.name}
            onChange={(e) =>
              setServiceForm((prev) => ({ ...prev, name: e.target.value }))
            }
          />

          <input
            type="number"
            step="0.01"
            placeholder={t("servicePrice")}
            className="input bg-slate-100 input-bordered w-full"
            value={serviceForm.price}
            onChange={(e) =>
              setServiceForm((prev) => ({ ...prev, price: e.target.value }))
            }
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="checkbox"
              checked={serviceForm.isActive}
              onChange={(e) =>
                setServiceForm((prev) => ({
                  ...prev,
                  isActive: e.target.checked,
                }))
              }
            />
            <label className="text-sm">{t("active")}</label>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAddServiceModalOpen(false);
                resetServiceForm();
              }}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleAddService} disabled={formLoading}>
              {formLoading ? t("loading") : t("addService")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Service Modal */}
      <Modal
        isOpen={isEditServiceModalOpen}
        onClose={() => {
          setEditServiceModalOpen(false);
          setEditingService(null);
          resetServiceForm();
        }}
        title={t("editService")}
      >
        <div className="space-y-3">
          <input
            type="text"
            placeholder={t("serviceName")}
            className="input bg-slate-100 input-bordered w-full"
            value={serviceForm.name}
            onChange={(e) =>
              setServiceForm((prev) => ({ ...prev, name: e.target.value }))
            }
          />

          <input
            type="number"
            step="0.01"
            placeholder={t("servicePrice")}
            className="input bg-slate-100 input-bordered w-full"
            value={serviceForm.price}
            onChange={(e) =>
              setServiceForm((prev) => ({ ...prev, price: e.target.value }))
            }
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="checkbox"
              checked={serviceForm.isActive}
              onChange={(e) =>
                setServiceForm((prev) => ({
                  ...prev,
                  isActive: e.target.checked,
                }))
              }
            />
            <label className="text-sm">{t("active")}</label>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditServiceModalOpen(false);
                setEditingService(null);
                resetServiceForm();
              }}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleEditService} disabled={formLoading}>
              {formLoading ? t("loading") : t("save")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Service Confirmation Modal */}
      <Modal
        isOpen={!!serviceToDelete}
        onClose={() => setServiceToDelete(null)}
        title={t("deleteService")}
      >
        <p className="text-sm text-gray-700 mb-4">
          {t("confirmDeleteService")}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setServiceToDelete(null)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleDeleteService}
            className="bg-red-600 hover:bg-red-700"
          >
            {t("deleteService")}
          </Button>
        </div>
      </Modal>

      {/* Delete Data Confirmation Modal */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeleteType(null);
        }}
        title={t("confirmDataDeletion")}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <p className="font-semibold">{t("deleteWarning")}</p>
          </div>

          <p className="text-gray-700">
            {deleteType === "logs" && "سيتم حذف جميع سجلات النشاطات والعمليات نهائياً."}
            {deleteType === "tickets" && "سيتم حذف جميع التذاكر العادية نهائياً."}
            {deleteType === "serviceTickets" && "سيتم حذف جميع تذاكر الخدمات نهائياً."}
            {deleteType === "agents" && "سيتم حذف جميع بيانات الوكلاء نهائياً."}
            {deleteType === "all" && "سيتم حذف جميع البيانات (التذاكر، الخدمات، الوكلاء، السجلات) نهائياً. المستخدمون سيبقون كما هم."}
          </p>

          <p className="text-sm text-gray-600">
            هل أنت متأكد من رغبتك في المتابعة؟
          </p>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setDeleteType(null);
              }}
              disabled={deleteLoading}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleDataDeletion}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  جاري المسح...
                </div>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 ml-1" />
                  تأكيد المسح
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
