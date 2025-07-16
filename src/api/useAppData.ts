import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../api/Firebase";
import type { AppUser, Ticket, Agent } from "../types";
import type { User } from "firebase/auth";
import { withRetry, handleFirebaseError } from "./firebaseErrorHandler";

const agentsCollection = collection(db, "agents");
const ticketsCollection = collection(db, "tickets");
const usersCollection = collection(db, "users");

export interface UserWithStats extends AppUser {
  ticketCount: number;
  balance: number;
  totalPaid: number;
  totalDue: number;
}

export const useAppData = () => {
  const queryClient = useQueryClient();
  const agentsQuery = useQuery<Agent[]>({
    queryKey: ["agents"],
    queryFn: async () => {
      return withRetry(async () => {
        const snapshot = await getDocs(agentsCollection);
        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Agent[];
      });
    },
    retry: (failureCount, error) => {
      const errorInfo = handleFirebaseError(error, "agents query");
      return errorInfo.shouldRetry && failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // ✅ جلب المستخدمين مع الإحصائيات
  const usersWithStatsQuery = useQuery<UserWithStats[]>({
    queryKey: ["usersWithStats"],
    queryFn: async () => {
      return withRetry(async () => {
        const [usersSnapshot, ticketsSnapshot] = await Promise.all([
          getDocs(usersCollection),
          getDocs(ticketsCollection),
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

          // حساب المبلغ غير المدفوع مع مراعاة الدفع الجزئي
          const unpaidAmount = userTickets
            .filter((t) => !t.isPaid)
            .reduce((sum, t) => {
              const partialPayment = (t as any).partialPayment || 0;
              const remaining = t.amountDue - partialPayment;
              return sum + remaining;
            }, 0);

          // حساب المبلغ المدفوع (للتذاكر المدفوعة بالكامل + الدفع الجزئي للغير مدفوعة)
          const paidAmount = userTickets.reduce((sum, t) => {
            if (t.isPaid) {
              return sum + t.amountDue; // التذاكر المدفوعة بالكامل
            } else {
              const partialPayment = (t as any).partialPayment || 0;
              return sum + partialPayment; // الدفع الجزئي للتذاكر غير المدفوعة
            }
          }, 0);

          const totalDue = userTickets.reduce((sum, t) => sum + t.amountDue, 0);

          return {
            ...user,
            ticketCount: userTickets.length,
            balance: unpaidAmount,
            totalPaid: paidAmount,
            totalDue: totalDue,
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

  // ✅ جلب جميع التذاكر
  const ticketsQuery = useQuery<Ticket[]>({
    queryKey: ["tickets"],
    queryFn: async () => {
      return withRetry(async () => {
        const q = query(ticketsCollection, orderBy("createdAt", "desc")); // ترتيب تنازلي حسب createdAt
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Ticket[];
      });
    },
    retry: (failureCount, error) => {
      const errorInfo = handleFirebaseError(error, "tickets query");
      return errorInfo.shouldRetry && failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // ✅ إنشاء تذكرة
  const createTicket = useMutation({
    mutationFn: async (ticket: Omit<Ticket, "id">) => {
      return withRetry(async () => {
        const docRef = await addDoc(ticketsCollection, ticket);
        return { id: docRef.id, ...ticket };
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["usersWithStats"] });
    },
    onError: (error) => {
      handleFirebaseError(error, "create ticket");
    },
  });

  // ✅ تعديل تذكرة
  const updateTicket = useMutation({
    mutationFn: async (ticket: Ticket) => {
      const ticketRef = doc(ticketsCollection, ticket.id);
      await updateDoc(ticketRef, { ...ticket });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["usersWithStats"] });
    },
  });

  // ✅ حذف تذكرة
  const deleteTicket = useMutation({
    mutationFn: async (id: string) => {
      const ticketRef = doc(ticketsCollection, id);
      await deleteDoc(ticketRef);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["usersWithStats"] });
    },
  });

  // ✅ تعديل مستخدم
  const updateUser = useMutation({
    mutationFn: async (user: AppUser) => {
      const userRef = doc(usersCollection, user.id);
      await updateDoc(userRef, { ...user });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usersWithStats"] });
    },
  });

  // ✅ حذف مستخدم
  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const userRef = doc(usersCollection, id);
      await deleteDoc(userRef);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["usersWithStats"] });
    },
  });

  // ✅ إنشاء وكيل
  const createAgent = useMutation({
    mutationFn: async (agent: Omit<Agent, "id">) => {
      const docRef = await addDoc(agentsCollection, agent);
      return docRef.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
  const deleteAgent = useMutation({
    mutationFn: async (id: string) => {
      const agentRef = doc(agentsCollection, id);
      await deleteDoc(agentRef);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
  // ✅ تحديث رصيد وكيل
  const updateAgentBalance = useMutation({
    mutationFn: async ({
      id,
      newBalance,
    }: {
      id: string;
      newBalance: number;
    }) => {
      const agentRef = doc(agentsCollection, id);
      await updateDoc(agentRef, { balance: newBalance });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });

  // ✅ جلب بيانات مستخدم (وإنشاءه لو غير موجود)
  const getUserData = async (firebaseUser: User): Promise<AppUser> => {
    const uid = firebaseUser.uid;
    const userRef = doc(usersCollection, uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      const defaultUser: AppUser = {
        id: uid,
        name: firebaseUser.displayName || "مستخدم جديد",
        email: firebaseUser.email || "",
        role: "agent",
        photoURL: firebaseUser.photoURL || "",
      };

      await setDoc(userRef, defaultUser);
      return defaultUser;
    }

    return docSnap.data() as AppUser;
  };

  // ✅ جلب المستخدمين فقط
  const getUsers = async (): Promise<AppUser[]> => {
    const snapshot = await getDocs(usersCollection);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AppUser[];
  };

  // ✅ جلب تذاكر مستخدم معين
  const getUserTickets = async (userId: string): Promise<Ticket[]> => {
    const q = query(
      ticketsCollection,
      where("createdByUserId", "==", userId),
      orderBy("createdAt", "desc"),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Ticket[];
  };

  return {
    // 📥 جلب بيانات
    usersWithStatsQuery,
    ticketsQuery,

    // ➕ إنشاء
    createTicket,
    createAgent,

    // ✏️ تعديل
    updateTicket,
    updateUser,
    updateAgentBalance,

    // ❌ حذف
    deleteTicket,
    deleteUser,
    deleteAgent,

    // 📌 إضافي
    getUserData,
    getUsers,
    getUserTickets,
    agentsQuery,
  };
};
