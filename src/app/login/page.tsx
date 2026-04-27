"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState<string>("");
  const router = useRouter();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "admin@demo.com", password: "Demo1234!" },
  });

  async function onSubmit(values: LoginValues) {
    setError("");
    const result = await signIn("credentials", { ...values, redirect: false });
    if (result?.error) {
      setError("Invalid credentials");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Horizon Sustainability Platform</CardTitle>
          <CardDescription>IFRS S1/S2 and TSRS 1/2 aligned workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-1">
              <label className="text-sm" htmlFor="email">
                Email
              </label>
              <Input id="email" {...form.register("email")} />
            </div>
            <div className="space-y-1">
              <label className="text-sm" htmlFor="password">
                Password
              </label>
              <Input id="password" type="password" {...form.register("password")} />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
          <p className="mt-3 text-xs text-slate-500">Demo credentials are prefilled from seed data.</p>
        </CardContent>
      </Card>
    </div>
  );
}
