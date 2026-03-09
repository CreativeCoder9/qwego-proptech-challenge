import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, ShieldCheck, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FirstRunAdminPopup } from "@/src/components/dashboard/FirstRunAdminPopup";
import { WelcomeSection } from "@/src/components/dashboard/WelcomeSection";
import { getCurrentUser } from "@/src/lib/auth";
import { getPayloadClient } from "@/src/lib/payload";

const highlights = [
  {
    description: "Track requests, statuses, and priorities from one dashboard.",
    icon: Building2,
    title: "Property Operations",
  },
  {
    description: "Assign technicians and keep all activity changes auditable.",
    icon: Wrench,
    title: "Maintenance Workflow",
  },
  {
    description: "Role-based access keeps tenant, technician, and admin paths secure.",
    icon: ShieldCheck,
    title: "Access Control",
  },
];

export default async function HomePage() {
  const currentUser = await getCurrentUser();

  if (currentUser?.id) {
    redirect("/dashboard");
  }

  const payload = await getPayloadClient();
  const usersResult = await payload.find({
    collection: "users",
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  const hasNoUsers = usersResult.totalDocs === 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-cyan-50 px-6 py-10 text-slate-900">
      {hasNoUsers ? <FirstRunAdminPopup /> : null}

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <WelcomeSection />

        <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Welcome</p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Log in to your account and manage your properties with confidence.
              </h1>
              <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
                Review tickets, coordinate technicians, and keep tenants updated through one centralized portal.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button render={<Link href="/login" />} nativeButton={false}>
                  Log In
                </Button>
                <Button render={<Link href="/register" />} nativeButton={false} variant="outline">
                  Create Tenant Account
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {highlights.map((item) => (
                <article
                  key={item.title}
                  className="rounded-xl border border-slate-200 bg-slate-50/80 p-4"
                >
                  <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <item.icon className="size-4 text-cyan-700" />
                    {item.title}
                  </p>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
