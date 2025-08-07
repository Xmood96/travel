import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getUserData } from "../api/authService";
import { auth } from "../api/Firebase";
import type { AppUser } from "../types";

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userData = await getUserData(firebaseUser);

          if (!mounted) return;

          if ("code" in userData) {
            setError(userData.message);
            setUser(null);
          } else {
            setError(null);
            setUser(userData);
          }
        } else {
          if (!mounted) return;
          setError(null);
          setUser(null);
        }
      } catch (error) {
        if (!mounted) return;
        console.error("Auth error:", error);
        setError("حدث خطأ في تحميل بيانات المستخدم");
        setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    // Timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Auth timeout - forcing loading to false");
        setLoading(false);
        setError("انتهت مهلة تحميل بيانات المستخدم");
      }
    }, 8000); // 8 second timeout

    return () => {
      mounted = false;
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {loading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري تحميل بيانات المستخدم...</p>
          </div>
        </div>
      ) : error ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-50 bg-opacity-75">
          <div className="text-center bg-white p-6 rounded-lg shadow-lg">
            <div className="text-red-600 text-lg font-semibold mb-2">
              خطأ في المصادقة
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
