import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Settings as SettingsIcon } from "lucide-react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Modal } from "../ui/modal";
import { Button } from "../ui/botom";
import type { Currency } from "../../types";
import {
  getAllCurrencies,
  addCurrency,
  updateCurrency,
  deleteCurrency,
  initializeDefaultCurrencies,
} from "../../api/currencyService";

export default function Settings() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [currencyToDelete, setCurrencyToDelete] = useState<string | null>(null);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);

  const [currencyForm, setCurrencyForm] = useState({
    code: "",
    name: "",
    symbol: "",
    exchangeRate: "",
    isActive: true,
  });

  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Load currencies on component mount
  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    try {
      setLoading(true);
      // Initialize default currencies if needed
      await initializeDefaultCurrencies();
      const allCurrencies = await getAllCurrencies();
      setCurrencies(allCurrencies);
    } catch (error) {
      console.error("Error loading currencies:", error);
      toast.error("فشل في تحميل العملات");
    } finally {
      setLoading(false);
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
      await addCurrency({
        code: currencyForm.code.toUpperCase(),
        name: currencyForm.name.trim(),
        symbol: currencyForm.symbol.trim(),
        exchangeRate: Number(currencyForm.exchangeRate),
        isActive: currencyForm.isActive,
      });

      toast.success("تم إضافة العملة بنجاح!");
      setAddModalOpen(false);
      resetForm();
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
      setError("لا يم��ن تغيير قيمة صرف الدولار (العملة الأساسية)");
      setFormLoading(false);
      return;
    }

    try {
      await updateCurrency(editingCurrency.id, {
        code: currencyForm.code.toUpperCase(),
        name: currencyForm.name.trim(),
        symbol: currencyForm.symbol.trim(),
        exchangeRate: Number(currencyForm.exchangeRate),
        isActive: currencyForm.isActive,
      });

      toast.success("تم تحديث العملة بنجاح!");
      setEditModalOpen(false);
      setEditingCurrency(null);
      resetForm();
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
      await deleteCurrency(currencyToDelete);
      toast.success("تم حذف العملة بنجاح!");
      setCurrencyToDelete(null);
      loadCurrencies();
    } catch (error) {
      console.error("Error deleting currency:", error);
      toast.error("فشل في حذف العملة");
    }
  };

  const openEditModal = (currency: Currency) => {
    setEditingCurrency(currency);
    setCurrencyForm({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      exchangeRate: currency.exchangeRate.toString(),
      isActive: currency.isActive,
    });
    setEditModalOpen(true);
  };

  const resetForm = () => {
    setCurrencyForm({
      code: "",
      name: "",
      symbol: "",
      exchangeRate: "",
      isActive: true,
    });
    setError("");
  };

  if (loading) {
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
          إعدادات العملات
        </h1>
        <Button onClick={() => setAddModalOpen(true)}>
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
                onClick={() => openEditModal(currency)}
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

      {/* Add Currency Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          resetForm();
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
                setAddModalOpen(false);
                resetForm();
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
        isOpen={isEditModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingCurrency(null);
          resetForm();
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
              ملاحظة: الدولار هو العملة الأساسية ولا يمكن تعديل قيمته أو تعطيله
            </p>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditModalOpen(false);
                setEditingCurrency(null);
                resetForm();
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

      {/* Delete Confirmation Modal */}
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
    </motion.div>
  );
}
