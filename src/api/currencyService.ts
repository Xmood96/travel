import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "./Firebase";
import type { Currency } from "../types";

// Default currencies
export const DEFAULT_CURRENCIES: Omit<Currency, "id" | "createdAt">[] = [
  {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    exchangeRate: 1.0,
    isActive: true,
  },
  {
    code: "SAR",
    name: "Saudi Riyal",
    symbol: "ر.س",
    exchangeRate: 3.75, // Default SAR to USD rate
    isActive: true,
  },
];

// Get all active currencies
export const getActiveCurrencies = async (): Promise<Currency[]> => {
  try {
    const q = query(
      collection(db, "currencies"),
      where("isActive", "==", true),
    );
    const snapshot = await getDocs(q);
    const currencies = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Currency,
    );

    // Sort by code client-side to avoid compound index requirement
    return currencies.sort((a, b) => a.code.localeCompare(b.code));
  } catch (error) {
    console.error("Error fetching currencies:", error);
    return [];
  }
};

// Get all currencies (including inactive)
export const getAllCurrencies = async (): Promise<Currency[]> => {
  try {
    const snapshot = await getDocs(collection(db, "currencies"));
    const currencies = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Currency,
    );

    // Sort by code client-side to avoid index requirements
    return currencies.sort((a, b) => a.code.localeCompare(b.code));
  } catch (error) {
    console.error("Error fetching all currencies:", error);
    return [];
  }
};

// Add new currency
export const addCurrency = async (
  currency: Omit<Currency, "id" | "createdAt">,
): Promise<void> => {
  try {
    await addDoc(collection(db, "currencies"), {
      ...currency,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error adding currency:", error);
    throw error;
  }
};

// Update currency
export const updateCurrency = async (
  id: string,
  updates: Partial<Currency>,
): Promise<void> => {
  try {
    const currencyRef = doc(db, "currencies", id);
    await updateDoc(currencyRef, updates);
  } catch (error) {
    console.error("Error updating currency:", error);
    throw error;
  }
};

// Delete currency
export const deleteCurrency = async (id: string): Promise<void> => {
  try {
    const currencyRef = doc(db, "currencies", id);
    await deleteDoc(currencyRef);
  } catch (error) {
    console.error("Error deleting currency:", error);
    throw error;
  }
};

// Initialize default currencies if none exist
export const initializeDefaultCurrencies = async (): Promise<void> => {
  try {
    const existingCurrencies = await getAllCurrencies();
    if (existingCurrencies.length === 0) {
      for (const currency of DEFAULT_CURRENCIES) {
        await addCurrency(currency);
      }
    }
  } catch (error) {
    console.error("Error initializing default currencies:", error);
  }
};

// Currency conversion utilities
export const convertCurrency = (
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
): number => {
  // Convert to USD first, then to target currency
  const amountInUSD = amount / fromCurrency.exchangeRate;
  return amountInUSD * toCurrency.exchangeRate;
};

// Convert any currency amount to USD
export const convertToUSD = (
  amount: number,
  fromCurrency: Currency,
): number => {
  return amount / fromCurrency.exchangeRate;
};

// Convert USD amount to any currency
export const convertFromUSD = (
  amountUSD: number,
  toCurrency: Currency,
): number => {
  return amountUSD * toCurrency.exchangeRate;
};

// Format currency amount with symbol
export const formatCurrency = (amount: number, currency: Currency): string => {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  const sign = amount < 0 ? "-" : "";
  return `${sign}${formattedAmount} ${currency.symbol}`;
};

// Get currency by code
export const getCurrencyByCode = async (
  code: string,
): Promise<Currency | null> => {
  try {
    const currencies = await getActiveCurrencies();
    return currencies.find((c) => c.code === code) || null;
  } catch (error) {
    console.error("Error getting currency by code:", error);
    return null;
  }
};
