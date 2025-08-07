import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getUserData } from "../api/authService";
import { auth } from "../api/Firebase";
import { initializeConnection } from "../api/firebaseConnection";
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
    // Initialize Firebase connection monitoring
    initializeConnection().catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userData = await getUserData(firebaseUser);

          if ('code' in userData) {
            setError(userData.message);
            setUser(null);
          } else {
            setError(null);
            setUser(userData);
          }
        } else {
          setError(null);
          setUser(null);
        }
      } catch (authError) {
        console.error("Auth state change error:", authError);
        setError("Authentication error occurred. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {loading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
