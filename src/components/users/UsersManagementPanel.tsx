"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ManagedRole = "tenant" | "technician";

type ManagedUser = {
  id: number | string;
  email: string;
  name: string;
  phone?: string;
  role: ManagedRole;
  unit?: string;
};

type UsersResponse = {
  docs?: Array<{
    id: number | string;
    email?: string;
    name?: string;
    phone?: string;
    role?: string;
    unit?: string;
  }>;
};

type CreateUserForm = {
  email: string;
  name: string;
  password: string;
  phone: string;
  role: ManagedRole;
  unit: string;
};

const EMPTY_FORM: CreateUserForm = {
  email: "",
  name: "",
  password: "",
  phone: "",
  role: "tenant",
  unit: "",
};

const extractErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as { errors?: Array<{ message?: string }>; message?: string };
    const firstError = body.errors?.[0]?.message;
    if (firstError) {
      return firstError;
    }
    if (body.message) {
      return body.message;
    }
  } catch {
    // fallback below
  }

  return "Request failed.";
};

export const UsersManagementPanel = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ManagedUser>>({});
  const [createForm, setCreateForm] = useState<CreateUserForm>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const hasUsers = users.length > 0;

  const fetchUsers = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/users?depth=0&limit=200&sort=name", {
        credentials: "include",
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }

      const payload = (await response.json()) as UsersResponse;
      const docs = payload.docs ?? [];
      const managedUsers: ManagedUser[] = docs
        .filter((doc) => doc.role === "tenant" || doc.role === "technician")
        .map((doc) => ({
          email: doc.email ?? "",
          id: doc.id,
          name: doc.name ?? "",
          phone: doc.phone ?? "",
          role: doc.role as ManagedRole,
          unit: doc.unit ?? "",
        }));

      const nextDrafts: Record<string, ManagedUser> = {};
      for (const user of managedUsers) {
        nextDrafts[String(user.id)] = { ...user };
      }

      setUsers(managedUsers);
      setDrafts(nextDrafts);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load users.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.name.localeCompare(b.name)),
    [users],
  );

  const onCreateUser = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      setError("Name, email, and password are required.");
      return;
    }

    setError(null);
    setIsCreating(true);

    try {
      const response = await fetch("/api/users", {
        body: JSON.stringify({
          email: createForm.email,
          name: createForm.name,
          password: createForm.password,
          phone: createForm.phone || undefined,
          role: createForm.role,
          unit: createForm.unit || undefined,
        }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }

      setCreateForm(EMPTY_FORM);
      await fetchUsers();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create user.");
    } finally {
      setIsCreating(false);
    }
  };

  const onSaveUser = async (userId: number | string) => {
    const id = String(userId);
    const draft = drafts[id];

    if (!draft) {
      return;
    }

    setError(null);
    setSavingId(id);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        body: JSON.stringify({
          email: draft.email,
          name: draft.name,
          phone: draft.phone || undefined,
          role: draft.role,
          unit: draft.unit || undefined,
        }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }

      await fetchUsers();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update user.");
    } finally {
      setSavingId(null);
    }
  };

  const onDeleteUser = async (userId: number | string) => {
    const id = String(userId);
    const shouldDelete = window.confirm("Delete this user?");

    if (!shouldDelete) {
      return;
    }

    setError(null);
    setDeletingId(id);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        credentials: "include",
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }

      await fetchUsers();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete user.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Tenant or Technician</CardTitle>
          <CardDescription>Create accounts for residents and field staff.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="new-name">Full name</Label>
            <Input
              id="new-name"
              onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
              value={createForm.name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-email">Email</Label>
            <Input
              id="new-email"
              onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
              type="email"
              value={createForm.email}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Temporary password</Label>
            <Input
              id="new-password"
              minLength={8}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
              type="password"
              value={createForm.password}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-role">Role</Label>
            <Select
              items={[]}
              onValueChange={(value) => {
                if (value === "tenant" || value === "technician") {
                  setCreateForm((prev) => ({ ...prev, role: value }));
                }
              }}
              value={createForm.role}
            >
              <SelectTrigger id="new-role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tenant">Tenant</SelectItem>
                <SelectItem value="technician">Technician</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-phone">Phone</Label>
            <Input
              id="new-phone"
              onChange={(event) => setCreateForm((prev) => ({ ...prev, phone: event.target.value }))}
              value={createForm.phone}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-unit">Apartment / Unit No.</Label>
            <Input
              id="new-unit"
              onChange={(event) => setCreateForm((prev) => ({ ...prev, unit: event.target.value }))}
              value={createForm.unit}
            />
          </div>
          <div className="sm:col-span-2">
            <Button disabled={isCreating} onClick={() => void onCreateUser()} type="button">
              {isCreating ? "Creating..." : "Create User"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Tenants and Technicians</CardTitle>
          <CardDescription>Update profile details, role, and remove accounts when needed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? <p className="text-sm text-muted-foreground">Loading users...</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {!isLoading && !hasUsers ? (
            <p className="text-sm text-muted-foreground">No tenants or technicians found.</p>
          ) : null}

          {sortedUsers.map((user) => {
            const id = String(user.id);
            const draft = drafts[id] ?? user;
            const isSaving = savingId === id;
            const isDeleting = deletingId === id;

            return (
              <article className="rounded-xl border p-4" key={id}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor={`name-${id}`}>Name</Label>
                    <Input
                      id={`name-${id}`}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [id]: { ...draft, name: event.target.value },
                        }))
                      }
                      value={draft.name}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`email-${id}`}>Email</Label>
                    <Input
                      id={`email-${id}`}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [id]: { ...draft, email: event.target.value },
                        }))
                      }
                      type="email"
                      value={draft.email}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`role-${id}`}>Role</Label>
                    <Select
                      items={[]}
                      onValueChange={(value) => {
                        if (value === "tenant" || value === "technician") {
                          setDrafts((prev) => ({
                            ...prev,
                            [id]: { ...draft, role: value },
                          }));
                        }
                      }}
                      value={draft.role}
                    >
                      <SelectTrigger id={`role-${id}`}>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tenant">Tenant</SelectItem>
                        <SelectItem value="technician">Technician</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`phone-${id}`}>Phone</Label>
                    <Input
                      id={`phone-${id}`}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [id]: { ...draft, phone: event.target.value },
                        }))
                      }
                      value={draft.phone ?? ""}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`unit-${id}`}>Apartment / Unit No.</Label>
                    <Input
                      id={`unit-${id}`}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [id]: { ...draft, unit: event.target.value },
                        }))
                      }
                      value={draft.unit ?? ""}
                    />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button disabled={isSaving || isDeleting} onClick={() => void onSaveUser(user.id)} type="button">
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    disabled={isSaving || isDeleting}
                    onClick={() => void onDeleteUser(user.id)}
                    type="button"
                    variant="destructive"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </article>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};
