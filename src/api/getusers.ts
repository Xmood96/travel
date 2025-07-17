import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./Firebase";
import type { AppUser, Ticket } from "../types";
import { withRetry, handleFirebaseError } from "./firebaseErrorHandler";

export interface UserWithStats extends AppUser {
  ticketCount: number;
  balance: number; // debt from tickets
  userBalance?: number; // credit balance
  tickets?: Ticket[]; // user's tickets
}

export const useUsersWithStats = () => {
  return useQuery<UserWithStats[]>({
    queryKey: ["usersWithStats"],
    queryFn: async () => {
      return withRetry(async () => {
        const [usersSnapshot, ticketsSnapshot] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "tickets")),
        ]);

        const users = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as AppUser[];

        const tickets = ticketsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Ticket[];

        return users.map((user) => {
          const userTickets = tickets.filter(
            (t) => t.createdByUserId === user.id,
          );

          // Calculate debt considering partial payments
          const unpaidAmount = userTickets
            .filter((t) => !t.isPaid)
            .reduce((sum, t) => {
              const amountDue = t.amountDue || 0;
              const partialPayment = t.partialPayment || 0;
              return sum + (amountDue - partialPayment);
            }, 0);

          return {
            ...user,
            ticketCount: userTickets.length,
            balance: unpaidAmount, // debt from tickets
            userBalance: user.userBalance || 0, // user credit balance
            tickets: userTickets, // include user's tickets
          };
        });
      });
    },
    retry: (failureCount, error) => {
      const errorInfo = handleFirebaseError(error, "users with stats query");
      return errorInfo.shouldRetry && failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
