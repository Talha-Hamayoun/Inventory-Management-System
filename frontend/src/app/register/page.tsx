"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { authApi } from "@/src/lib/api";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/src/components/ui/card";
import { LayoutBackground } from "@/src/components/layout-background";
import { Loader2 } from "lucide-react";
import Image from "next/image";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      if (response.data && response.data.success === true) {
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        return;
      }

      if (response.data && response.data.success === false) {
        setError(response.data.message || "Registration failed. Please try again.");
        return;
      }

      if (response.error instanceof Error) {
        setError(response.error.message);
        return;
      }

      setError("Registration failed. Please try again.");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center p-4">
      <LayoutBackground overlay="dark" />
      <Card className="relative z-10 w-full max-w-md bg-white/95 dark:bg-slate-900/90 backdrop-blur-sm shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/Logo2.png"
              alt="AutoLine"
              width={2172}
              height={724}
              className="h-14 w-auto max-w-60 object-contain"
              style={{ width: "auto", height: "3.5rem" }}
              priority
              unoptimized
            />
          </div>
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>Get started with Inventory Management</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                type="text"
                placeholder="John Doe"
                {...register("name")}
                error={errors.name?.message}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                placeholder="john@example.com"
                {...register("email")}
                error={errors.email?.message}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                {...register("password")}
                error={errors.password?.message}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                error={errors.confirmPassword?.message}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Account
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline cursor-pointer">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
