import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "./Firebase";
import type { Agent } from "../types";

const agentsCollection = collection(db, "agents");

export const createAgent = async (agent: Omit<Agent, "id">) => {
  const docRef = await addDoc(agentsCollection, agent);
  return docRef.id;
};

export const updateAgentBalance = async (id: string, newBalance: number) => {
  const agentRef = doc(db, "agents", id);
  await updateDoc(agentRef, { balance: newBalance });
};
