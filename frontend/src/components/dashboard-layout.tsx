"use client";

import { useAuth } from "@/src/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutBackground } from "./layout-background";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { PageLoading } from "./ui/loading";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <LayoutBackground />
        <div className="relative z-10">
          <PageLoading />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen relative">
      <LayoutBackground />
      <div className="relative z-10">
        <Sidebar isOpen={sidebarOpen} onOpenChange={setSidebarOpen} />
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="lg:ml-64 pt-16 lg:pt-20">
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
