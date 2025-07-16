import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./Firebase";
import type { Ticket } from "../types";

export const useUserTickets = (userId: string) => {
  return useQuery<Ticket[]>({
    queryKey: ["userTickets", userId],
    queryFn: async () => {
      const q = query(
        collection(db, "tickets"),
        where("createdByUserId", "==", userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Ticket[];
    },
  });
};
