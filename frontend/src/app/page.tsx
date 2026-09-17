"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/lib/auth-context";
import { PageLoading } from "@/src/components/ui/loading";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/src/components/ui/button";
import { Package, ArrowRight } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return <PageLoading />;
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center">
            <Image
              src="/Logo2.png"
              alt="AutoLine"
              width={2172}
              height={724}
              className="h-14 w-auto max-w-full object-contain"
              style={{ width: "auto", height: "3.5rem" }}
              priority
              unoptimized
            />
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="cursor-pointer">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/register" className="cursor-pointer">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-8">
            AutoLine Inventory Management
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Track products, manage warehouses, handle purchase orders, and monitor
            stock levels - all in one powerful platform.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register" className="cursor-pointer">
              <Button size="lg" className="gap-2">
                Start Free Trial <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login" className="cursor-pointer">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Product Management</h3>
            <p className="text-gray-600">
              Manage products with, categories, and detailed inventory tracking.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Multi-Warehouse</h3>
            <p className="text-gray-600">
              Support for multiple warehouse locations with real-time stock tracking.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Stock Alerts</h3>
            <p className="text-gray-600">
              Get notified when stock levels are low or items are out of stock.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
