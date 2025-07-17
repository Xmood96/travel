import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "./Firebase";
import type { LogEntry, TicketLog, LogActionType } from "../types";

// Collections
const LOGS_COLLECTION = "logs";
const TICKET_LOGS_COLLECTION = "ticketLogs";

// Create a general log entry
export const createLogEntry = async (
  logData: Omit<LogEntry, "id" | "timestamp">,
): Promise<void> => {
  try {
    await addDoc(collection(db, LOGS_COLLECTION), {
      ...logData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error creating log entry:", error);
  }
};

// Create a ticket-specific log entry
export const createTicketLog = async (
  logData: Omit<TicketLog, "id" | "timestamp">,
): Promise<void> => {
  try {
    await addDoc(collection(db, TICKET_LOGS_COLLECTION), {
      ...logData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error creating ticket log:", error);
  }
};

// Get all admin logs (general system logs)
export const getAdminLogs = async (
  limitCount: number = 50,
): Promise<LogEntry[]> => {
  try {
    const q = query(
      collection(db, LOGS_COLLECTION),
      orderBy("timestamp", "desc"),
      limit(limitCount),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as LogEntry,
    );
  } catch (error) {
    console.error("Error fetching admin logs:", error);
    return [];
  }
};

// Get logs for a specific ticket
export const getTicketLogs = async (ticketId: string): Promise<TicketLog[]> => {
  try {
    const q = query(
      collection(db, TICKET_LOGS_COLLECTION),
      where("ticketId", "==", ticketId),
      orderBy("timestamp", "desc"),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as TicketLog,
    );
  } catch (error) {
    console.error("Error fetching ticket logs:", error);
    return [];
  }
};

// Get logs by user (who performed the action)
export const getLogsByUser = async (
  userId: string,
  limitCount: number = 20,
): Promise<LogEntry[]> => {
  try {
    const q = query(
      collection(db, LOGS_COLLECTION),
      where("performedBy", "==", userId),
      orderBy("timestamp", "desc"),
      limit(limitCount),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as LogEntry,
    );
  } catch (error) {
    console.error("Error fetching user logs:", error);
    return [];
  }
};

// Utility functions for creating specific log types

// Ticket logging utilities
export const logTicketCreated = async (
  ticketId: string,
  ticketNumber: string,
  performedBy: string,
  performedByName: string,
  agentName: string,
): Promise<void> => {
  await Promise.all([
    createLogEntry({
      action: "ticket_created",
      performedBy,
      performedByName,
      targetId: ticketId,
      targetType: "ticket",
      description: `تم إنشاء تذكرة رقم ${ticketNumber} للبائع ${agentName}`,
      metadata: { ticketNumber, agentName },
    }),
    createTicketLog({
      ticketId,
      action: "ticket_created",
      performedBy,
      performedByName,
      description: `تم إنشاء التذكرة بوا��طة ${performedByName}`,
    }),
  ]);
};

export const logTicketUpdated = async (
  ticketId: string,
  ticketNumber: string,
  performedBy: string,
  performedByName: string,
  changes: { field: string; oldValue: any; newValue: any }[],
): Promise<void> => {
  const changeDescriptions = changes
    .map((change) => {
      const fieldNames: Record<string, string> = {
        amountDue: "المبلغ المستحق",
        partialPayment: "الدفع الجزئي",
        isPaid: "حالة الدفع",
        paidAmount: "المبلغ المدفوع",
      };

      const fieldName = fieldNames[change.field] || change.field;

      if (change.field === "isPaid") {
        return `${fieldName}: ${change.oldValue ? "مدفوع" : "غير مدفوع"} ← ${change.newValue ? "مدفوع" : "غير مدفوع"}`;
      }

      return `${fieldName}: ${change.oldValue} ← ${change.newValue}`;
    })
    .join("، ");

  await Promise.all([
    createLogEntry({
      action: "ticket_updated",
      performedBy,
      performedByName,
      targetId: ticketId,
      targetType: "ticket",
      description: `تم تحديث تذكرة رقم ${ticketNumber} - ${changeDescriptions}`,
      metadata: { ticketNumber, changes },
    }),
    createTicketLog({
      ticketId,
      action: "ticket_updated",
      performedBy,
      performedByName,
      description: `تم تحديث التذكرة بواسطة ${performedByName}`,
      changes,
    }),
  ]);
};

export const logTicketDeleted = async (
  ticketId: string,
  ticketNumber: string,
  performedBy: string,
  performedByName: string,
  agentName: string,
): Promise<void> => {
  await createLogEntry({
    action: "ticket_deleted",
    performedBy,
    performedByName,
    targetId: ticketId,
    targetType: "ticket",
    description: `تم حذف تذكرة رقم ${ticketNumber} للبائع ${agentName}`,
    metadata: { ticketNumber, agentName },
  });
};

// Agent logging utilities
export const logAgentCreated = async (
  agentId: string,
  agentName: string,
  performedBy: string,
  performedByName: string,
  initialBalance: number,
  currency: string,
): Promise<void> => {
  await createLogEntry({
    action: "agent_created",
    performedBy,
    performedByName,
    targetId: agentId,
    targetType: "agent",
    description: `تم إضافة بائع جديد: ${agentName} برصيد ${initialBalance} ${currency}`,
    metadata: { agentName, initialBalance, currency },
  });
};

export const logAgentUpdated = async (
  agentId: string,
  agentName: string,
  performedBy: string,
  performedByName: string,
  changes: string,
): Promise<void> => {
  await createLogEntry({
    action: "agent_updated",
    performedBy,
    performedByName,
    targetId: agentId,
    targetType: "agent",
    description: `تم تحديث بيانات البائع ${agentName} - ${changes}`,
    metadata: { agentName, changes },
  });
};

export const logAgentDeleted = async (
  agentId: string,
  agentName: string,
  performedBy: string,
  performedByName: string,
): Promise<void> => {
  await createLogEntry({
    action: "agent_deleted",
    performedBy,
    performedByName,
    targetId: agentId,
    targetType: "agent",
    description: `تم حذف البائع: ${agentName}`,
    metadata: { agentName },
  });
};

export const logAgentBalanceUpdated = async (
  agentId: string,
  agentName: string,
  performedBy: string,
  performedByName: string,
  oldBalance: number,
  newBalance: number,
  updateType: "set" | "add",
  currency: string,
): Promise<void> => {
  const description =
    updateType === "set"
      ? `تم تعيين رصيد الب��ئع ${agentName} إلى ${newBalance} ${currency} (كان ${oldBalance} ${currency})`
      : `تم إضافة ${newBalance - oldBalance} ${currency} لرصيد البائع ${agentName} (أصبح ${newBalance} ${currency})`;

  await createLogEntry({
    action: "agent_balance_updated",
    performedBy,
    performedByName,
    targetId: agentId,
    targetType: "agent",
    description,
    oldValue: oldBalance,
    newValue: newBalance,
    metadata: { agentName, updateType, currency },
  });
};

// User logging utilities
export const logUserCreated = async (
  userId: string,
  userName: string,
  userEmail: string,
  userRole: string,
  performedBy: string,
  performedByName: string,
): Promise<void> => {
  await createLogEntry({
    action: "user_created",
    performedBy,
    performedByName,
    targetId: userId,
    targetType: "user",
    description: `تم إضافة مستخدم جديد: ${userName} (${userEmail}) كـ${userRole === "admin" ? "مدير" : "وكيل"}`,
    metadata: { userName, userEmail, userRole },
  });
};

export const logUserUpdated = async (
  userId: string,
  userName: string,
  performedBy: string,
  performedByName: string,
  changes: string,
): Promise<void> => {
  await createLogEntry({
    action: "user_updated",
    performedBy,
    performedByName,
    targetId: userId,
    targetType: "user",
    description: `تم تحديث بيانات المستخدم ${userName} - ${changes}`,
    metadata: { userName, changes },
  });
};

export const logUserDeleted = async (
  userId: string,
  userName: string,
  performedBy: string,
  performedByName: string,
): Promise<void> => {
  await createLogEntry({
    action: "user_deleted",
    performedBy,
    performedByName,
    targetId: userId,
    targetType: "user",
    description: `تم حذف المستخدم: ${userName}`,
    metadata: { userName },
  });
};

export const logUserBalanceUpdated = async (
  userId: string,
  userName: string,
  performedBy: string,
  performedByName: string,
  oldBalance: number,
  newBalance: number,
  updateType: "set" | "add" | "subtract",
  currency: string,
): Promise<void> => {
  let description = "";
  if (updateType === "set") {
    description = `تم تعيين رصيد المستخدم ${userName} إلى ${newBalance} ${currency} (كان ${oldBalance} ${currency})`;
  } else if (updateType === "add") {
    description = `تم إضافة ${newBalance - oldBalance} ${currency} لرصيد المستخدم ${userName} (أصبح ${newBalance} ${currency})`;
  } else {
    description = `تم خ��م ${oldBalance - newBalance} ${currency} من رصيد المستخدم ${userName} (أصبح ${newBalance} ${currency})`;
  }

  await createLogEntry({
    action: "user_balance_updated",
    performedBy,
    performedByName,
    targetId: userId,
    targetType: "user",
    description,
    oldValue: oldBalance,
    newValue: newBalance,
    metadata: { userName, updateType, currency },
  });
};

export const logUserDebtPaidFromBalance = async (
  userId: string,
  userName: string,
  ticketId: string,
  ticketNumber: string,
  performedBy: string,
  performedByName: string,
  amountPaid: number,
  remainingDebt: number,
  remainingBalance: number,
  currency: string,
): Promise<void> => {
  const description = `تم دفع ${amountPaid} ${currency} من رصيد المستخدم ${userName} لتذكرة رقم ${ticketNumber}. الدين المتبقي: ${remainingDebt} ${currency}، الرصيد المتبقي: ${remainingBalance} ${currency}`;

  await createLogEntry({
    action: "user_debt_paid_from_balance",
    performedBy,
    performedByName,
    targetId: userId,
    targetType: "user",
    description,
    metadata: {
      userName,
      ticketId,
      ticketNumber,
      amountPaid,
      remainingDebt,
      remainingBalance,
      currency,
    },
  });
};

// Currency logging utilities
export const logCurrencyCreated = async (
  currencyId: string,
  currencyName: string,
  currencyCode: string,
  exchangeRate: number,
  performedBy: string,
  performedByName: string,
): Promise<void> => {
  await createLogEntry({
    action: "currency_created",
    performedBy,
    performedByName,
    targetId: currencyId,
    targetType: "currency",
    description: `تم إضافة عملة جديدة: ${currencyName} (${currencyCode}) بمعدل صرف ${exchangeRate}`,
    metadata: { currencyName, currencyCode, exchangeRate },
  });
};

export const logCurrencyUpdated = async (
  currencyId: string,
  currencyName: string,
  currencyCode: string,
  performedBy: string,
  performedByName: string,
  changes: string,
): Promise<void> => {
  await createLogEntry({
    action: "currency_updated",
    performedBy,
    performedByName,
    targetId: currencyId,
    targetType: "currency",
    description: `تم تحديث العملة ${currencyName} (${currencyCode}) - ${changes}`,
    metadata: { currencyName, currencyCode, changes },
  });
};

export const logCurrencyDeleted = async (
  currencyId: string,
  currencyName: string,
  currencyCode: string,
  performedBy: string,
  performedByName: string,
): Promise<void> => {
  await createLogEntry({
    action: "currency_deleted",
    performedBy,
    performedByName,
    targetId: currencyId,
    targetType: "currency",
    description: `تم حذف العملة: ${currencyName} (${currencyCode})`,
    metadata: { currencyName, currencyCode },
  });
};

// Helper function to format timestamp for display in Gregorian calendar
export const formatLogTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
};

// Helper function to get action icon
export const getActionIcon = (action: LogActionType): string => {
  const icons: Record<LogActionType, string> = {
    ticket_created: "✅",
    ticket_updated: "✏️",
    ticket_deleted: "🗑️",
    ticket_payment_updated: "💰",
    agent_created: "👤➕",
    agent_updated: "👤✏️",
    agent_deleted: "👤🗑️",
    agent_balance_updated: "💱",
    user_created: "👥➕",
    user_updated: "👥✏️",
    user_deleted: "👥🗑️",
    user_balance_updated: "💰",
    user_debt_paid_from_balance: "💳",
    currency_created: "💱➕",
    currency_updated: "💱✏️",
    currency_deleted: "💱🗑️",
    service_created: "🛎️➕",
    service_updated: "🛎️✏️",
    service_deleted: "🛎️🗑️",
  };

  return icons[action] || "📝";
};

// Service logging utilities
export const logServiceCreated = async (
  serviceId: string,
  performedBy: string,
  performedByName: string,
  serviceName: string,
): Promise<void> => {
  await createLogEntry({
    action: "service_created" as LogActionType,
    performedBy,
    performedByName,
    targetId: serviceId,
    targetType: "service" as any,
    description: `تم إضافة خدمة جديدة: ${serviceName}`,
    metadata: { serviceName },
  });
};

export const logServiceUpdated = async (
  serviceId: string,
  performedBy: string,
  performedByName: string,
  oldServiceName: string,
  newServiceName: string,
  oldPrice?: number,
  newPrice?: number,
): Promise<void> => {
  let changes = [];
  if (oldServiceName !== newServiceName) {
    changes.push(`تغيير الاسم من "${oldServiceName}" إلى "${newServiceName}"`);
  }
  if (
    oldPrice !== undefined &&
    newPrice !== undefined &&
    oldPrice !== newPrice
  ) {
    changes.push(`تغيير السعر من ${oldPrice} إلى ${newPrice}`);
  }

  await createLogEntry({
    action: "service_updated" as LogActionType,
    performedBy,
    performedByName,
    targetId: serviceId,
    targetType: "service" as any,
    description: `تم تحديث الخدمة ${newServiceName} - ${changes.join(", ")}`,
    metadata: { oldServiceName, newServiceName, oldPrice, newPrice, changes },
  });
};

export const logServiceDeleted = async (
  serviceId: string,
  performedBy: string,
  performedByName: string,
  serviceName: string,
): Promise<void> => {
  await createLogEntry({
    action: "service_deleted" as LogActionType,
    performedBy,
    performedByName,
    targetId: serviceId,
    targetType: "service" as any,
    description: `تم حذف الخدمة: ${serviceName}`,
    metadata: { serviceName },
  });
};
