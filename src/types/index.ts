export type UserRole = "admin" | "agent";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  photoURL: string;
  role: UserRole;
  createdAt?: string;
  lastLogin?: string;
}

export interface Agent {
  id: string;
  name: string;
  balance: number;
}

export interface Ticket {
  id: string;
  agentId: string;
  createdByUserId: string;
  amountDue: number;
  isPaid: boolean;
  paidAmount: number;
  ticketNumber: string;
  createdAt: string;
}
