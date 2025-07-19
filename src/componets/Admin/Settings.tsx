import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Settings as SettingsIcon,
  DollarSign,
  Briefcase,
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

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"currencies" | "services">(
    "currencies",
  );

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
      toast.error("فشل في تحميل العملات");
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
      setError("يرجى تعبئة جميع الحقول المطلوبة");
      setFormLoading(false);
      return;
    }

    if (!currencyForm.exchangeRate || Number(currencyForm.exchangeRate) <= 0) {
      setError("يرجى إدخال قيمة صرف صحيحة");
      setFormLoading(false);
      return;
    }

    // Check if currency code already exists
    if (
      currencies.some(
        (c) => c.code.toUpperCase() === currencyForm.code.toUpperCase(),
      )
    ) {
      setError("رمز العملة موجود بالفعل");
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

      toast.success("تم إضافة العملة بنجاح!");
      setAddCurrencyModalOpen(false);
      resetCurrencyForm();
      loadCurrencies();
    } catch (error) {
      console.error("Error adding currency:", error);
      setError("حدث خطأ أثناء إضافة العملة");
      toast.error("فشل في إضافة العملة");
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
      setError("يرجى تعبئة جميع الحقول المطلوبة");
      setFormLoading(false);
      return;
    }

    if (!currencyForm.exchangeRate || Number(currencyForm.exchangeRate) <= 0) {
      setError("يرجى إدخال قيمة صرف صحيحة");
      setFormLoading(false);
      return;
    }

    // Prevent editing USD exchange rate
    if (
      editingCurrency.code === "USD" &&
      Number(currencyForm.exchangeRate) !== 1.0
    ) {
      setError("لا يمكن تغيير قيمة صرف الدولار (العملة الأساسية)");
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

      toast.success("تم تحديث العملة بنجاح!");
      setEditCurrencyModalOpen(false);
      setEditingCurrency(null);
      resetCurrencyForm();
      loadCurrencies();
    } catch (error) {
      console.error("Error updating currency:", error);
      setError("حدث خطأ أثناء تحديث العملة");
      toast.error("فشل في تحديث العملة");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCurrency = async () => {
    if (!currencyToDelete) return;

    const currency = currencies.find((c) => c.id === currencyToDelete);
    if (currency?.code === "USD") {
      toast.error("لا يمكن حذف الدولار (العملة الأساسية)");
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
      toast.success("تم حذف العملة بنجاح!");
      setCurrencyToDelete(null);
      loadCurrencies();
    } catch (error) {
      console.error("Error deleting currency:", error);
      toast.error("فشل في حذف العملة");
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
      toast.error("فشل في تحميل الخدمات");
    } finally {
      setServiceLoading(false);
    }
  };

  const handleAddService = async () => {
    setError("");
    setFormLoading(true);

    // Validation
    if (!serviceForm.name.trim()) {
      setError("يرجى إدخال اسم الخدمة");
      setFormLoading(false);
      return;
    }

    if (!serviceForm.price || Number(serviceForm.price) <= 0) {
      setError("يرجى إدخال سعر صحيح للخدمة");
      setFormLoading(false);
      return;
    }

    // Check if service name already exists
    if (
      services.some(
        (s) => s.name.toLowerCase() === serviceForm.name.trim().toLowerCase(),
      )
    ) {
      setError("اسم الخدمة موجود بالفعل");
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

      toast.success("تم إضافة الخدمة بنجاح!");
      setAddServiceModalOpen(false);
      resetServiceForm();
      loadServices();
    } catch (error) {
      console.error("Error adding service:", error);
      setError("حدث خطأ أثناء إضافة الخدمة");
      toast.error("فشل في إضافة الخدمة");
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
      setError("يرجى إدخال اسم الخدمة");
      setFormLoading(false);
      return;
    }

    if (!serviceForm.price || Number(serviceForm.price) <= 0) {
      setError("يرجى إدخال سعر صحيح للخدمة");
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

      toast.success("تم تحديث الخدمة بنجاح!");
      setEditServiceModalOpen(false);
      setEditingService(null);
      resetServiceForm();
      loadServices();
    } catch (error) {
      console.error("Error updating service:", error);
      setError("حدث خطأ أثناء تحديث الخدمة");
      toast.error("فشل في تحديث الخدمة");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;

    const service = services.find((s) => s.id === serviceToDelete);

    try {
      await deleteService(serviceToDelete, user?.id, user?.name, service?.name);
      toast.success("تم حذف الخدمة بنجاح!");
      setServiceToDelete(null);
      loadServices();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("فشل في حذف الخدمة");
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

  if (currencyLoading && serviceLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        جار التحميل...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 space-y-4 text-black max-w-md mx-auto"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" />
          الإعدادات
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab("currencies")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "currencies"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          العملات
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
          الخدمات
        </button>
      </div>

      {/* Currency Tab */}
      {activeTab === "currencies" && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">إدارة العملات</h2>
            <Button onClick={() => setAddCurrencyModalOpen(true)}>
              <Plus className="w-5 h-5 ml-1" />
              إضافة عملة
            </Button>
          </div>

          <div className="space-y-3">
            {currencies.map((currency) => (
              <div
                key={currency.id}
                className={`bg-white rounded-lg shadow-sm px-4 py-3 flex items-center justify-between ${
                  !currency.isActive ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                    {currency.code}
                  </div>
                  <div>
                    <p className="font-semibold">{currency.name}</p>
                    <p className="text-sm text-gray-500">
                      {currency.symbol} • معدل الصرف: {currency.exchangeRate}
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
              لا توجد عملات مضافة بعد
            </div>
          )}
        </>
      )}

      {/* Services Tab */}
      {activeTab === "services" && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">إدارة الخدمات</h2>
            <Button onClick={() => setAddServiceModalOpen(true)}>
              <Plus className="w-5 h-5 ml-1" />
              إضافة خدمة
            </Button>
          </div>

          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.id}
                className={`bg-white rounded-lg shadow-sm px-4 py-3 flex items-center justify-between ${
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
                      السعر: ${service.price}
                      {!service.isActive && " • غير نشط"}
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
              لا توجد خدمات مضافة بعد
            </div>
          )}
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
        title="إضافة عملة جديدة"
      >
        <div className="space-y-3">
          <input
            type="text"
            placeholder="رمز العملة (مثل: SAR)"
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
            placeholder="اسم العملة (مثل: الريال السعودي)"
            className="input bg-slate-100 input-bordered w-full"
            value={currencyForm.name}
            onChange={(e) =>
              setCurrencyForm((prev) => ({ ...prev, name: e.target.value }))
            }
          />

          <input
            type="text"
            placeholder="رمز العملة (مثل: ر.س)"
            className="input bg-slate-100 input-bordered w-full"
            value={currencyForm.symbol}
            onChange={(e) =>
              setCurrencyForm((prev) => ({ ...prev, symbol: e.target.value }))
            }
          />

          <input
            type="number"
            step="0.01"
            placeholder="قيمة الصرف مقابل الدولار (مثل: 3.75)"
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
            <label className="text-sm">نشط</label>
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
              إلغاء
            </Button>
            <Button onClick={handleAddCurrency} disabled={formLoading}>
              {formLoading ? "جاري الإضافة..." : "إضافة العملة"}
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
        title="تعديل العملة"
      >
        <div className="space-y-3">
          <input
            type="text"
            placeholder="رمز العملة"
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
            placeholder="اسم العملة"
            className="input bg-slate-100 input-bordered w-full"
            value={currencyForm.name}
            onChange={(e) =>
              setCurrencyForm((prev) => ({ ...prev, name: e.target.value }))
            }
          />

          <input
            type="text"
            placeholder="رمز العملة"
            className="input bg-slate-100 input-bordered w-full"
            value={currencyForm.symbol}
            onChange={(e) =>
              setCurrencyForm((prev) => ({ ...prev, symbol: e.target.value }))
            }
          />

          <input
            type="number"
            step="0.01"
            placeholder="قيمة الصرف مقابل الدولار"
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
            <label className="text-sm">نشط</label>
          </div>

          {editingCurrency?.code === "USD" && (
            <p className="text-sm text-blue-600">
              ملاحظة: الد��لار هو العملة الأساسية ولا يمكن تعديل قيمته أو تعطيله
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
              إلغاء
            </Button>
            <Button onClick={handleEditCurrency} disabled={formLoading}>
              {formLoading ? "جاري التحديث..." : "حفظ التعديلات"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Currency Confirmation Modal */}
      <Modal
        isOpen={!!currencyToDelete}
        onClose={() => setCurrencyToDelete(null)}
        title="تأكيد الحذف"
      >
        <p className="text-sm text-gray-700 mb-4">
          هل أنت متأكد أنك تريد حذف هذه العملة؟ هذا الإجراء لا يمكن التراجع عنه.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setCurrencyToDelete(null)}>
            إلغاء
          </Button>
          <Button
            onClick={handleDeleteCurrency}
            className="bg-red-600 hover:bg-red-700"
          >
            حذف العملة
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
        title="إضافة خدمة جديدة"
      >
        <div className="space-y-3">
          <input
            type="text"
            placeholder="اسم الخدمة (مثل: تأشيرة سياحية)"
            className="input bg-slate-100 input-bordered w-full"
            value={serviceForm.name}
            onChange={(e) =>
              setServiceForm((prev) => ({ ...prev, name: e.target.value }))
            }
          />

          <input
            type="number"
            step="0.01"
            placeholder="سعر الخدمة بالدولار (مثل: 100)"
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
            <label className="text-sm">نشط</label>
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
              إلغاء
            </Button>
            <Button onClick={handleAddService} disabled={formLoading}>
              {formLoading ? "جاري الإضافة..." : "إضافة الخدمة"}
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
        title="تعديل الخدمة"
      >
        <div className="space-y-3">
          <input
            type="text"
            placeholder="اسم الخدمة"
            className="input bg-slate-100 input-bordered w-full"
            value={serviceForm.name}
            onChange={(e) =>
              setServiceForm((prev) => ({ ...prev, name: e.target.value }))
            }
          />

          <input
            type="number"
            step="0.01"
            placeholder="سعر الخدمة بالدولار"
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
            <label className="text-sm">نشط</label>
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
              إلغاء
            </Button>
            <Button onClick={handleEditService} disabled={formLoading}>
              {formLoading ? "جاري التحديث..." : "حفظ التعديلات"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Service Confirmation Modal */}
      <Modal
        isOpen={!!serviceToDelete}
        onClose={() => setServiceToDelete(null)}
        title="تأكيد الحذف"
      >
        <p className="text-sm text-gray-700 mb-4">
          هل أنت متأكد أنك تريد حذف هذه الخدمة؟ هذا الإجراء لا يمكن التراجع عنه.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setServiceToDelete(null)}>
            إلغاء
          </Button>
          <Button
            onClick={handleDeleteService}
            className="bg-red-600 hover:bg-red-700"
          >
            ��ذف الخدمة
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}
