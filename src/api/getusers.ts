import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./Firebase";
import type { AppUser, Ticket } from "../types";

export interface UserWithStats extends AppUser {
  ticketCount: number;
  balance: number;
}

export const useUsersWithStats = () => {
  return useQuery<UserWithStats[]>({
    queryKey: ["usersWithStats"],
    queryFn: async () => {
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
          (t) => t.createdByUserId === user.id
        );
        const unpaidAmount = userTickets
          .filter((t) => !t.isPaid)
          .reduce((sum, t) => sum + t.amountDue, 0);

        return {
          ...user,
          ticketCount: userTickets.length,
          balance: unpaidAmount,
        };
      });
    },
  });
};
