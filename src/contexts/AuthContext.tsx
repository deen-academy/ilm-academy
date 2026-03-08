import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: { name: string | null; email: string | null } | null;
  roles: string[];
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ name: string | null; email: string | null } | null>(null);
  const [roles, setRoles] = useState<string[]>([]);

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("name, email").eq("id", userId).single(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      setProfile(profileRes.data);
      setRoles(rolesRes.data?.map((r) => r.role) || []);
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      setProfile(null);
      setRoles([]);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // 1. Restore session from storage — this is the source of truth for initial load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserData(session.user.id);
      }
      if (mounted) setLoading(false);
    });

    // 2. Listen for subsequent auth changes only (sign-in, sign-out, token refresh)
    //    IMPORTANT: No async/await here — Supabase does not await this callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (!session?.user) {
          setProfile(null);
          setRoles([]);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  // 3. Fetch user data reactively when user changes (handles sign-in/sign-out after initial load)
  useEffect(() => {
    if (loading) return; // Skip during initial load — getSession handles that
    if (user) {
      fetchUserData(user.id);
    } else {
      setProfile(null);
      setRoles([]);
    }
  }, [user, loading, fetchUserData]);

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    toast.success("Check your email to confirm your account!");
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    toast.success("Welcome back!");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, roles, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
