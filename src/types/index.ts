export type UserRole = "admin" | "agent";

export interface Currency {
  id: string;
  code: string; // e.g., "USD", "SAR", "EUR"
  name: string; // e.g., "US Dollar", "Saudi Riyal"
  symbol: string; // e.g., "$", "ر.س"
  exchangeRate: number; // Rate to USD (USD = 1.0)
  isActive: boolean;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string; // e.g., "تأشيرة سياحية", "حجز طيران"
  price: number; // Base price in USD
  isActive: boolean;
  createdAt: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  photoURL: string;
  role: UserRole;
  balance?: number; // User debt (calculated from tickets - stored in USD)
  userBalance?: number; // User credit/balance (stored in USD)
  preferredCurrency?: string; // Currency for balance display
  createdAt?: string;
  lastLogin?: string;
}

export type TransportType = "air" | "sea";

export interface Agent {
  id: string;
  name: string;
  balance: number; // Always stored in USD
  preferredCurrency: string; // Currency code for display
  transportType?: TransportType; // Air or Sea transport
}

export interface Ticket {
  id: string;
  agentId: string;
  createdByUserId: string;
  amountDue: number;
  isPaid: boolean;
  paidAmount: number;
  partialPayment?: number;
  ticketNumber: string;
  createdAt: string;
  isClosed?: boolean;
}

export interface ServiceTicket {
  id: string;
  serviceId: string;
  serviceName: string;
  serviceBasePrice: number; // Base price of the service
  agentId: string;
  createdByUserId: string;
  amountDue: number; // Amount due (must be >= serviceBasePrice)
  isPaid: boolean;
  paidAmount: number;
  partialPayment?: number;
  ticketNumber: string;
  createdAt: string;
  isClosed?: boolean;
}

// Logging Types
export type LogActionType =
  | "ticket_created"
  | "ticket_updated"
  | "ticket_deleted"
  | "ticket_payment_updated"
  | "agent_created"
  | "agent_updated"
  | "agent_deleted"
  | "agent_balance_updated"
  | "user_created"
  | "user_updated"
  | "user_deleted"
  | "user_balance_updated"
  | "user_debt_paid_from_balance"
  | "currency_created"
  | "currency_updated"
  | "currency_deleted"
  | "service_created"
  | "service_updated"
  | "service_deleted";

export interface LogEntry {
  id: string;
  action: LogActionType;
  performedBy: string; // User ID who performed the action
  performedByName: string; // User name for display
  targetId: string; // ID of the entity being acted upon (ticket, agent, user, etc.)
  targetType: "ticket" | "agent" | "user" | "currency";
  description: string; // Human-readable description of what changed
  oldValue?: any; // Previous value (for updates)
  newValue?: any; // New value (for updates)
  metadata?: Record<string, any>; // Additional context data
  timestamp: string;
}

export interface TicketLog {
  id: string;
  ticketId: string;
  action: LogActionType;
  performedBy: string;
  performedByName: string;
  description: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  timestamp: string;
}
