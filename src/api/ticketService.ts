import { collection, addDoc } from "firebase/firestore";
import { db } from "./Firebase";
import type { Ticket } from "../types";

const ticketsCollection = collection(db, "tickets");

export const createTicket = async (ticket: Omit<Ticket, "id">) => {
  const docRef = await addDoc(ticketsCollection, ticket);
  return docRef.id;
};
