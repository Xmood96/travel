import { useUserTickets } from "../../api/ticketbuid";
import { useCurrencyUtils } from "../../api/useCurrency";
import type { UserWithStats } from "../../api/getusers";
import type { Currency } from "../../types";

interface PaymentInputsProps {
  balanceUser: UserWithStats;
  payDebtData: {
    paymentType: "general" | "ticket";
    ticketId: string;
    amount: string;
    currency: string;
    comment: string;
    closeTicket?: boolean;
  };
  setPayDebtData: (data: any) => void;
  currencies: Currency[] | undefined;
}

export default function PaymentInputs({
  balanceUser,
  payDebtData,
  setPayDebtData,
  currencies,
}: PaymentInputsProps) {
  const { data: userTickets } = useUserTickets(balanceUser.id);
  const { getFormattedBalance } = useCurrencyUtils();

  // فلترة التذاكر غير المدفوعة
  const unpaidTickets = userTickets?.filter((ticket) => !ticket.isPaid) || [];

  return (
    <div className="space-y-3">
      {payDebtData.paymentType === "general" ? (
        <>
          {/* خصم عام */}
          <textarea
            placeholder="تعليق اختياري (سبب الخصم)"
            className="textarea bg-slate-100 textarea-bordered w-full text-sm"
            rows={2}
            value={payDebtData.comment}
            onChange={(e) =>
              setPayDebtData({ ...payDebtData, comment: e.target.value })
            }
          />
        </>
      ) : (
        <>
          {/* دفع تذكرة محددة */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اختر التذكرة
            </label>
            <select
              className="select bg-slate-100 select-bordered w-full"
              value={payDebtData.ticketId}
              onChange={(e) =>
                setPayDebtData({ ...payDebtData, ticketId: e.target.value })
              }
            >
              <option value="">اختر تذكرة...</option>
              {unpaidTickets.map((ticket) => {
                const partialPayment = (ticket as any).partialPayment || 0;
                const remaining = ticket.amountDue - partialPayment;
                return (
                  <option key={ticket.id} value={ticket.id}>
                    تذكرة #{ticket.ticketNumber} - متبقي:{" "}
                    {getFormattedBalance(remaining, "USD")}
                  </option>
                );
              })}
            </select>
            {unpaidTickets.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                لا توجد تذاكر غير مدفوعة لهذا المستخدم
              </p>
            )}
          </div>
        </>
      )}

      {/* العملة */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          العملة
        </label>
        <select
          className="select bg-slate-100 select-bordered w-full"
          value={payDebtData.currency}
          onChange={(e) =>
            setPayDebtData({ ...payDebtData, currency: e.target.value })
          }
        >
          {currencies?.map((currency) => (
            <option key={currency.id} value={currency.code}>
              {currency.name} ({currency.symbol})
            </option>
          ))}
        </select>
      </div>

      {/* المبلغ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          المبلغ
        </label>
        <input
          type="text"
          placeholder={
            payDebtData.paymentType === "general"
              ? "المبلغ المراد خصمه"
              : "المبلغ المراد دفعه للتذكرة"
          }
          className="input bg-slate-100 input-bordered w-full"
          value={
            payDebtData.amount === ""
              ? ""
              : Number(payDebtData.amount).toLocaleString("en-US")
          }
          onChange={(e) => {
            const raw = e.target.value.replace(/,/g, "");
            if (/^\d*\.?\d*$/.test(raw)) {
              setPayDebtData({ ...payDebtData, amount: raw });
            }
          }}
        />
      </div>

      {/* خيار إغلاق التذكرة */}
      {payDebtData.paymentType === "ticket" && payDebtData.ticketId && (
        <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
          <input
            type="checkbox"
            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
            checked={payDebtData.closeTicket || false}
            onChange={(e) =>
              setPayDebtData({ ...payDebtData, closeTicket: e.target.checked })
            }
          />
          <label className="text-sm font-medium text-gray-700">
            إغلاق التذكرة بعد الدفع (منع التعديل من قبل المستخدمين)
          </label>
        </div>
      )}

      {/* معلومات إضافية للتذكرة المحددة */}
      {payDebtData.paymentType === "ticket" && payDebtData.ticketId && (
        <div className="bg-blue-50 p-3 rounded-lg text-sm">
          {(() => {
            const selectedTicket = unpaidTickets.find(
              (t) => t.id === payDebtData.ticketId,
            );
            if (!selectedTicket) return null;

            const partialPayment = (selectedTicket as any).partialPayment || 0;
            const remaining = selectedTicket.amountDue - partialPayment;

            return (
              <div className="space-y-1">
                <p>
                  <strong>رقم التذكرة:</strong> #{selectedTicket.ticketNumber}
                </p>
                <p>
                  <strong>إجمالي التذكرة:</strong>{" "}
                  {getFormattedBalance(selectedTicket.amountDue, "USD")}
                </p>
                <p>
                  <strong>المدفوع جزئياً:</strong>{" "}
                  {getFormattedBalance(partialPayment, "USD")}
                </p>
                <p>
                  <strong>المتبقي:</strong>{" "}
                  {getFormattedBalance(remaining, "USD")}
                </p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
