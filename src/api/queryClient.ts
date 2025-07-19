import { QueryClient } from "@tanstack/react-query";

// Optimized React Query configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep in cache for 10 minutes
      cacheTime: 10 * 60 * 1000,
      // Don't refetch on window focus (better UX)
      refetchOnWindowFocus: false,
      // Retry failed requests 3 times
      retry: 3,
      // Background refetch every 30 seconds for real-time feel
      refetchInterval: 30 * 1000,
      // Don't refetch in background when tab is not active
      refetchIntervalInBackground: false,
      // Use network-only for first load, then cache
      networkMode: "online",
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      // Network mode for mutations
      networkMode: "online",
    },
  },
});

// Query keys for better organization and cache invalidation
export const queryKeys = {
  // User data
  users: ["users"] as const,
  usersWithStats: ["users", "with-stats"] as const,
  user: (id: string) => ["users", id] as const,

  // Tickets
  tickets: ["tickets"] as const,
  userTickets: (userId: string) => ["tickets", "user", userId] as const,

  // Service tickets
  serviceTickets: ["service-tickets"] as const,
  userServiceTickets: (userId: string) =>
    ["service-tickets", "user", userId] as const,

  // Agents
  agents: ["agents"] as const,
  agent: (id: string) => ["agents", id] as const,

  // Services
  services: ["services"] as const,
  activeServices: ["services", "active"] as const,

  // Currencies
  currencies: ["currencies"] as const,

  // Logs
  logs: ["logs"] as const,
  adminLogs: (limit: number) => ["logs", "admin", limit] as const,
  userLogs: (userId: string, limit: number) =>
    ["logs", "user", userId, limit] as const,
} as const;

// Helper function to invalidate related queries
export const invalidateQueries = {
  // Invalidate all user-related queries
  users: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users });
    queryClient.invalidateQueries({ queryKey: queryKeys.usersWithStats });
  },

  // Invalidate all ticket-related queries
  tickets: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tickets });
    queryClient.invalidateQueries({ queryKey: queryKeys.usersWithStats });
  },

  // Invalidate all service ticket-related queries
  serviceTickets: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.serviceTickets });
    queryClient.invalidateQueries({ queryKey: queryKeys.usersWithStats });
  },

  // Invalidate all agent-related queries
  agents: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.agents });
  },

  // Invalidate all service-related queries
  services: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.services });
    queryClient.invalidateQueries({ queryKey: queryKeys.activeServices });
  },
};

// Prefetch strategies for better UX
export const prefetchStrategies = {
  // Prefetch user data when hovering over user links
  prefetchUser: (userId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.user(userId),
      staleTime: 5 * 60 * 1000,
    });
  },

  // Prefetch next page of tickets
  prefetchNextTicketsPage: (page: number) => {
    queryClient.prefetchQuery({
      queryKey: [...queryKeys.tickets, "page", page + 1],
      staleTime: 2 * 60 * 1000,
    });
  },
};

// Background sync for offline actions
export const backgroundSync = {
  // Queue actions for when connection is restored
  queueAction: (action: any) => {
    const queuedActions = JSON.parse(
      localStorage.getItem("queuedActions") || "[]",
    );
    queuedActions.push({
      ...action,
      timestamp: Date.now(),
    });
    localStorage.setItem("queuedActions", JSON.stringify(queuedActions));
  },

  // Process queued actions when online
  processQueue: async () => {
    const queuedActions = JSON.parse(
      localStorage.getItem("queuedActions") || "[]",
    );

    for (const action of queuedActions) {
      try {
        // Process action based on type
        await processQueuedAction(action);
      } catch (error) {
        console.error("Failed to process queued action:", error);
      }
    }

    // Clear queue after processing
    localStorage.removeItem("queuedActions");
  },
};

async function processQueuedAction(action: any) {
  // Implementation would depend on action type
  // This is a placeholder for the actual implementation
  console.log("Processing queued action:", action);
}
