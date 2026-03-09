"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AssignTechnicianDialog } from "@/src/components/tickets/AssignTechnicianDialog";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  type TicketPriority,
  type TicketStatus,
  type UserRole,
} from "@/src/components/tickets/types";

type TechnicianOption = {
  email?: string;
  id: number | string;
  name?: string;
};

type TicketActionsPanelProps = {
  assignedToId?: number | string;
  currentUserId: number | string;
  priority: TicketPriority;
  role: UserRole;
  status: TicketStatus;
  technicians: TechnicianOption[];
  ticketId: number | string;
};

const NEXT_STATUS: Record<TicketStatus, TicketStatus[]> = {
  assigned: ["in-progress"],
  done: [],
  "in-progress": ["done"],
  open: ["assigned", "done"],
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
    // ignore parsing errors and use fallback
  }

  return "Unable to update ticket.";
};

export const TicketActionsPanel = ({
  assignedToId,
  currentUserId,
  priority,
  role,
  status,
  technicians,
  ticketId,
}: TicketActionsPanelProps) => {
  const router = useRouter();
  const [currentAssignedToId, setCurrentAssignedToId] = useState<string>(assignedToId ? String(assignedToId) : "");
  const [currentStatus, setCurrentStatus] = useState<TicketStatus>(status);
  const [currentPriority, setCurrentPriority] = useState<TicketPriority>(priority);

  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>(status);
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority>(priority);

  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);
  const [isUpdatingTechnicianStatus, setIsUpdatingTechnicianStatus] = useState(false);
  const hasAssignment = Boolean(currentAssignedToId);

  const managerStatusOptions = useMemo(() => {
    const options = [currentStatus, ...NEXT_STATUS[currentStatus]];

    return Array.from(new Set(options)).filter((option) => {
      if (option === currentStatus) {
        return true;
      }

      if (!hasAssignment && option === "in-progress") {
        return false;
      }

      return true;
    });
  }, [currentStatus, hasAssignment]);

  const canTechnicianUpdate =
    role === "technician" &&
    Boolean(currentAssignedToId) &&
    String(currentAssignedToId) === String(currentUserId) &&
    (currentStatus === "assigned" || currentStatus === "in-progress");

  const patchTicket = async (data: Record<string, unknown>) => {
    const response = await fetch(`/api/tickets/${ticketId}`, {
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response));
    }
  };

  const onManagerStatusSave = async () => {
    if (selectedStatus === currentStatus) {
      return;
    }

    if (selectedStatus === "assigned" && !currentAssignedToId) {
      setError("Assign a technician before moving status to Assigned.");
      return;
    }

    if (selectedStatus === "in-progress" && !currentAssignedToId) {
      setError("Assign a technician before moving status to In Progress.");
      return;
    }

    setError(null);
    setIsUpdatingStatus(true);

    try {
      await patchTicket({ status: selectedStatus });
      setCurrentStatus(selectedStatus);
      router.refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const onManagerPrioritySave = async () => {
    if (selectedPriority === currentPriority) {
      return;
    }

    setError(null);
    setIsUpdatingPriority(true);

    try {
      await patchTicket({ priority: selectedPriority });
      setCurrentPriority(selectedPriority);
      router.refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update priority.");
    } finally {
      setIsUpdatingPriority(false);
    }
  };

  const onTechnicianStatusUpdate = async (nextStatus: TicketStatus) => {
    setError(null);
    setIsUpdatingTechnicianStatus(true);

    try {
      await patchTicket({ status: nextStatus });
      setCurrentStatus(nextStatus);
      setSelectedStatus(nextStatus);
      router.refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update status.");
    } finally {
      setIsUpdatingTechnicianStatus(false);
    }
  };

  const onAssigned = (technicianId: number | string) => {
    const nextTechnicianId = String(technicianId);
    setCurrentAssignedToId(nextTechnicianId);
    if (currentStatus === "open") {
      setCurrentStatus("assigned");
      setSelectedStatus("assigned");
    }
    setError(null);
    router.refresh();
  };

  if (role === "manager") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manager Actions</CardTitle>
          <CardDescription>Assign technician and keep workflow status up to date.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="manager-status">Status</Label>
              <Select
                items={[]}
                onValueChange={(value) => {
                  if (value) {
                    setSelectedStatus(value as TicketStatus);
                  }
                }}
                value={selectedStatus}
              >
                <SelectTrigger className="w-full" id="manager-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {managerStatusOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {STATUS_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button
                disabled={isUpdatingStatus || selectedStatus === currentStatus}
                onClick={onManagerStatusSave}
                size="sm"
                type="button"
                variant="outline"
              >
                {isUpdatingStatus ? "Saving..." : "Update Status"}
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager-priority">Priority</Label>
              <Select
                items={[]}
                onValueChange={(value) => {
                  if (value) {
                    setSelectedPriority(value as TicketPriority);
                  }
                }}
                value={selectedPriority}
              >
                <SelectTrigger className="w-full" id="manager-priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {(Object.keys(PRIORITY_LABELS) as TicketPriority[]).map((option) => (
                      <SelectItem key={option} value={option}>
                        {PRIORITY_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button
                disabled={isUpdatingPriority || selectedPriority === currentPriority}
                onClick={onManagerPrioritySave}
                size="sm"
                type="button"
                variant="outline"
              >
                {isUpdatingPriority ? "Saving..." : "Update Priority"}
              </Button>
            </div>
          </div>

          <AssignTechnicianDialog
            assignedToId={currentAssignedToId}
            disabled={technicians.length === 0}
            onAssigned={onAssigned}
            technicians={technicians}
            ticketId={ticketId}
          />

          {technicians.length === 0 ? (
            <p className="text-sm text-muted-foreground">No technicians available to assign.</p>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
    );
  }

  if (role === "technician" && canTechnicianUpdate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Technician Actions</CardTitle>
          <CardDescription>Update your progress for this assigned ticket.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentStatus === "assigned" ? (
            <Button
              disabled={isUpdatingTechnicianStatus}
              onClick={() => onTechnicianStatusUpdate("in-progress")}
              type="button"
            >
              {isUpdatingTechnicianStatus ? "Updating..." : "Start In Progress"}
            </Button>
          ) : null}

          {currentStatus === "in-progress" ? (
            <Button
              disabled={isUpdatingTechnicianStatus}
              onClick={() => onTechnicianStatusUpdate("done")}
              type="button"
            >
              {isUpdatingTechnicianStatus ? "Updating..." : "Mark Done"}
            </Button>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
    );
  }

  return null;
};
