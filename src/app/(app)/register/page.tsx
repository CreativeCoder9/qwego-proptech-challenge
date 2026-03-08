"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const { login, registerTenant } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [unit, setUnit] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await registerTenant({
        email,
        name,
        password,
        phone: phone || undefined,
        unit: unit || undefined,
      });

      await login({ email, password });
      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unable to register.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <div className="w-full space-y-6 rounded-lg border bg-card p-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Create tenant account</h1>
          <p className="text-sm text-muted-foreground">Register to submit and track maintenance requests.</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" onChange={(event) => setName(event.target.value)} required value={name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              autoComplete="email"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              autoComplete="new-password"
              id="password"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unit (optional)</Label>
            <Input id="unit" onChange={(event) => setUnit(event.target.value)} value={unit} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" onChange={(event) => setPhone(event.target.value)} type="tel" value={phone} />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link className="font-medium text-foreground underline underline-offset-4" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
