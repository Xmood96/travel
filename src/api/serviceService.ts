import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./Firebase";
import type { Service } from "../types";
import {
  logServiceCreated,
  logServiceUpdated,
  logServiceDeleted,
} from "./loggingService";

// Collection reference
const servicesCollection = collection(db, "services");

// Get all services
export const getAllServices = async (): Promise<Service[]> => {
  try {
    const q = query(servicesCollection, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Service[];
  } catch (error) {
    console.error("Error getting services:", error);
    throw error;
  }
};

// Get active services only
export const getActiveServices = async (): Promise<Service[]> => {
  try {
    const q = query(servicesCollection, where("isActive", "==", true));
    const snapshot = await getDocs(q);
    const services = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Service[];

    // Sort by createdAt on client side to avoid composite index requirement
    return services.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } catch (error) {
    console.error("Error getting active services:", error);
    throw error;
  }
};

// Add new service
export const addService = async (
  serviceData: Omit<Service, "id" | "createdAt">,
  performedBy?: string,
  performedByName?: string,
): Promise<string> => {
  try {
    const docRef = await addDoc(servicesCollection, {
      ...serviceData,
      createdAt: serverTimestamp(),
    });

    // Log the service creation
    if (performedBy && performedByName) {
      await logServiceCreated(
        docRef.id,
        performedBy,
        performedByName,
        serviceData.name,
      );
    }

    return docRef.id;
  } catch (error) {
    console.error("Error adding service:", error);
    throw error;
  }
};

// Update service
export const updateService = async (
  serviceId: string,
  serviceData: Partial<Omit<Service, "id" | "createdAt">>,
  performedBy?: string,
  performedByName?: string,
  oldServiceName?: string,
  oldPrice?: number,
): Promise<void> => {
  try {
    const serviceRef = doc(db, "services", serviceId);
    await updateDoc(serviceRef, serviceData);

    // Log the service update
    if (performedBy && performedByName) {
      await logServiceUpdated(
        serviceId,
        performedBy,
        performedByName,
        oldServiceName || "خدمة",
        serviceData.name || oldServiceName || "خدمة",
        oldPrice,
        serviceData.price,
      );
    }
  } catch (error) {
    console.error("Error updating service:", error);
    throw error;
  }
};

// Delete service
export const deleteService = async (
  serviceId: string,
  performedBy?: string,
  performedByName?: string,
  serviceName?: string,
): Promise<void> => {
  try {
    const serviceRef = doc(db, "services", serviceId);
    await deleteDoc(serviceRef);

    // Log the service deletion
    if (performedBy && performedByName) {
      await logServiceDeleted(
        serviceId,
        performedBy,
        performedByName,
        serviceName || "خدمة",
      );
    }
  } catch (error) {
    console.error("Error deleting service:", error);
    throw error;
  }
};

// Initialize default services if none exist
export const initializeDefaultServices = async (): Promise<void> => {
  try {
    const snapshot = await getDocs(servicesCollection);

    if (snapshot.empty) {
      const defaultServices = [
        {
          name: "تأشيرة سياحية",
          price: 100,
          isActive: true,
        },
        {
          name: "حجز طيران",
          price: 50,
          isActive: true,
        },
        {
          name: "حجز فندق",
          price: 25,
          isActive: true,
        },
        {
          name: "تأمين سفر",
          price: 30,
          isActive: true,
        },
      ];

      const promises = defaultServices.map((service) =>
        addDoc(servicesCollection, {
          ...service,
          createdAt: serverTimestamp(),
        }),
      );

      await Promise.all(promises);
      console.log("Default services initialized");
    }
  } catch (error) {
    console.error("Error initializing default services:", error);
    throw error;
  }
};

// Get all service tickets
export const getServiceTickets = async () => {
  try {
    const serviceTicketsCollection = collection(db, "serviceTickets");
    const q = query(serviceTicketsCollection, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching service tickets:", error);
    throw error;
  }
};
