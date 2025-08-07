import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./Firebase";
import type { AppUser, UserRole } from "../types";
import type { User } from "firebase/auth";

export interface AuthError {
  code: string;
  message: string;
}

export const getUserData = async (
  firebaseUser: User,
): Promise<AppUser | AuthError> => {
  try {
    const uid = firebaseUser.uid;
    const userRef = doc(db, "users", uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      // التحقق من صحة البيانات قبل الإنشاء
      if (!firebaseUser.email) {
        return {
          code: "invalid-email",
          message: "البريد الإلكتروني مطلوب",
        };
      }

      // إنشاء مستخدم جديد
      const defaultUser: AppUser = {
        id: uid,
        name: firebaseUser.displayName || "مستخدم جديد",
        email: firebaseUser.email,
        role: "agent" as UserRole, // الدور الافتراضي هو agent
        photoURL: firebaseUser.photoURL || "",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      await setDoc(userRef, defaultUser);
      return defaultUser;
    }

    return docSnap.data() as AppUser;
  } catch (error) {
    console.error("خطأ في جلب بيا��ات المستخدم:", error);
    return {
      code: "unknown-error",
      message: "حدث خطأ أثناء إنشاء حساب المستخدم",
    };
  }
};
