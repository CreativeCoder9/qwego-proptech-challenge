import { redirect } from "next/navigation";
import { UsersManagementPanel } from "@/src/components/users/UsersManagementPanel";
import { getCurrentUser } from "@/src/lib/auth";

export default async function UsersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.id || !currentUser.role) {
    redirect("/login");
  }

  if (currentUser.role !== "manager" && currentUser.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">People</h1>
        <p className="text-sm text-muted-foreground">Manage tenant and technician accounts for your properties.</p>
      </section>

      <UsersManagementPanel />
    </div>
  );
}
