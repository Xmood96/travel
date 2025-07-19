import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { registerSW } from "virtual:pwa-register";
import LoadingSpinner from "./components/LoadingSpinner.tsx";
import "./i18n"; // Initialize i18n

const App = lazy(() => import("./App.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 5 * 60 * 1000, // 5 دقائق
      staleTime: 2 * 60 * 1000, // 2 دقائق
      refetchOnWindowFocus: false,
      retry: 1, // عدد محاولات إعادة المحاولة
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // تأخير إعادة المحاولة
    },
  },
});

registerSW({
  onNeedRefresh() {
    console.log("تحديث جديد متاح");
  },
  onOfflineReady() {
    console.log("جاهز للعمل بدون إنترنت");
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-b from-gray-100 via-gray-200 to-gray-300">
          <Suspense fallback={<LoadingSpinner />}>
            {" "}
            {/* تحميل تدريجي */}
            <div className="relative min-h-screen">
              <App />
              <ToastContainer
                position="top-center"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
                limit={3}
              />
            </div>
          </Suspense>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
