"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "./api";

interface User {
  id: string;
  name: string;
  email: string;
  role: {
    id: string;
    name: string;
    permissions: string[];
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: true } | { success: false; message: string }>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user from localStorage instead of calling checkAuth
    const storedData = localStorage.getItem('auth');
    if (storedData) {
      try {
        const authData = JSON.parse(storedData);
        if (authData.user) {
          setUser(authData.user);
        }
      } catch (error) {
        console.error('Failed to parse auth data from localStorage:', error);
        localStorage.removeItem('auth');
      }
    }
    setLoading(false);
  }, []);

  const checkAuth = async () => {
    try {
      const response = await authApi.me();

      if (!response.data || response.error) {
        setUser(null);
        return;
      }

      // Check if response was successful
      if (response.data.success && response.data.data) {
        setUser(response.data.data.user);
        return;
      }

      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });

      if (response.data && "success" in response.data && response.data.success && response.data.data) {
        setUser(response.data.data.user);
        localStorage.setItem("auth", JSON.stringify(response.data.data));
        return { success: true as const };
      }

      setUser(null);
      localStorage.removeItem("auth");
      const message =
        (response.data && "message" in response.data && response.data.message) ||
        (response.error instanceof Error ? response.error.message : "Login failed. Please try again.");
      return { success: false as const, message };
    } catch {
      localStorage.removeItem("auth");
      return { success: false as const, message: "Login failed. Please try again." };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      localStorage.removeItem('auth');
    }
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    const permissions = user.role?.permissions ?? [];
    return permissions.includes("*") || permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]) => {
    return permissions.some((p) => hasPermission(p));
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, hasPermission, hasAnyPermission }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
