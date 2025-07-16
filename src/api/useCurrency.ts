import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Currency } from "../types";
import {
  getActiveCurrencies,
  getCurrencyByCode,
  initializeDefaultCurrencies,
  convertFromUSD,
  formatCurrency,
} from "./currencyService";

export const useCurrencies = () => {
  return useQuery<Currency[]>({
    queryKey: ["currencies"],
    queryFn: async () => {
      await initializeDefaultCurrencies();
      return getActiveCurrencies();
    },
  });
};

export const useCurrency = (currencyCode?: string) => {
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCurrency = async () => {
      if (!currencyCode) {
        setLoading(false);
        return;
      }

      try {
        const curr = await getCurrencyByCode(currencyCode);
        setCurrency(curr);
      } catch (error) {
        console.error("Error loading currency:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCurrency();
  }, [currencyCode]);

  return { currency, loading };
};

// Utility hook for currency conversion and formatting
export const useCurrencyUtils = () => {
  const { data: currencies } = useCurrencies();

  const getDefaultCurrency = (): Currency | null => {
    return currencies?.find((c) => c.code === "USD") || null;
  };

  const getCurrencyByCode = (code: string): Currency | null => {
    return currencies?.find((c) => c.code === code) || null;
  };

  const convertAndFormat = (
    amountUSD: number,
    targetCurrencyCode: string,
  ): string => {
    const targetCurrency = getCurrencyByCode(targetCurrencyCode);
    if (!targetCurrency) {
      return `${amountUSD.toFixed(2)} USD`;
    }

    const convertedAmount = convertFromUSD(amountUSD, targetCurrency);
    return formatCurrency(convertedAmount, targetCurrency);
  };

  const getFormattedBalance = (
    balance: number,
    currencyCode: string,
  ): string => {
    const currency = getCurrencyByCode(currencyCode);
    if (!currency) {
      return `${balance.toFixed(2)} USD`;
    }

    const convertedBalance = convertFromUSD(balance, currency);
    return formatCurrency(convertedBalance, currency);
  };

  return {
    currencies: currencies || [],
    getDefaultCurrency,
    getCurrencyByCode,
    convertAndFormat,
    getFormattedBalance,
  };
};
