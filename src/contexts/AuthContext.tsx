import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { cacheUserPhone } from "../lib/firebaseApi";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
  gender?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, name: string, phone: string, gender: string, avatar: string) => Promise<void>;
  loginWithGoogle: () => Promise<{ needsPhone: boolean; user: User }>;
  completeGoogleRegistration: (phone: string, gender: string, avatar: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

const googleProvider = new GoogleAuthProvider();

function getDiceBearUrl(name: string, gender: string): string {
  const seed = encodeURIComponent(name || "User");
  const bgColor = gender === "female" ? "f9a8d4,fbcfe8,fce7f3" : "7dd3fc,bae6fd,e0f2fe";
  return `https://api.dicebear.com/9.x/lorelei/svg?seed=${seed}&backgroundColor=${bgColor}&backgroundType=gradientLinear`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(u: User) {
    const snap = await getDoc(doc(db, "users", u.uid));
    if (snap.exists()) {
      setProfile(snap.data() as UserProfile);
    } else {
      const p: UserProfile = {
        name: u.displayName || "User",
        email: u.email || "",
        phone: "",
        avatar: u.photoURL || getDiceBearUrl(u.displayName || "User", "female"),
        role: "user",
      };
      setProfile(p);
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await fetchProfile(u);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function loginWithEmail(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await fetchProfile(cred.user);
    const snap2 = await getDoc(doc(db, "users", cred.user.uid));
    const profileData = snap2.exists() ? snap2.data() : {};
    if (profileData.phone) cacheUserPhone(profileData.phone);
    await setDoc(doc(db, "activities", `login_${Date.now()}`), {
      userId: cred.user.uid,
      userName: cred.user.displayName || profileData.name || "",
      userEmail: cred.user.email || email,
      userPhone: profileData.phone || "",
      actionType: "login",
      page: "auth",
      createdAt: serverTimestamp(),
    });
  }

  async function registerWithEmail(email: string, password: string, name: string, phone: string, gender: string, avatar: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name, photoURL: avatar });
    const p: UserProfile = { name, email, phone, avatar, role: "user", gender };
    await setDoc(doc(db, "users", cred.user.uid), {
      ...p,
      createdAt: serverTimestamp(),
      status: "active",
    });
    cacheUserPhone(phone);
    setProfile(p);
    await setDoc(doc(db, "activities", `${Date.now()}`), {
      userId: cred.user.uid,
      userName: name,
      userEmail: email,
      userPhone: phone,
      actionType: "register",
      page: "auth",
      createdAt: serverTimestamp(),
    });
  }

  async function loginWithGoogle(): Promise<{ needsPhone: boolean; user: User }> {
    const result = await signInWithPopup(auth, googleProvider);
    const u = result.user;
    const snap = await getDoc(doc(db, "users", u.uid));
    if (snap.exists()) {
      setProfile(snap.data() as UserProfile);
      return { needsPhone: false, user: u };
    }
    return { needsPhone: true, user: u };
  }

  async function completeGoogleRegistration(phone: string, gender: string, avatar: string) {
    if (!user) return;
    const p: UserProfile = {
      name: user.displayName || "User",
      email: user.email || "",
      phone,
      avatar,
      role: "user",
      gender,
    };
    await setDoc(doc(db, "users", user.uid), {
      ...p,
      createdAt: serverTimestamp(),
      status: "active",
    });
    cacheUserPhone(phone);
    setProfile(p);
    await setDoc(doc(db, "activities", `${Date.now()}`), {
      userId: user.uid,
      userName: p.name,
      userEmail: p.email,
      userPhone: phone,
      actionType: "register",
      page: "auth",
      createdAt: serverTimestamp(),
    });
  }

  async function logout() {
    await signOut(auth);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithEmail, registerWithEmail, loginWithGoogle, completeGoogleRegistration, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
