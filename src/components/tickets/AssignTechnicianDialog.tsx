"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TechnicianOption = {
  email?: string;
  id: number | string;
  name?: string;
};

type AssignTechnicianDialogProps = {
  assignedToId?: number | string;
  disabled?: boolean;
  onAssigned?: (technicianId: number | string) => void;
  ticketId: number | string;
  technicians: TechnicianOption[];
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

  return "Unable to assign technician.";
};

export const AssignTechnicianDialog = ({
  assignedToId,
  disabled,
  onAssigned,
  ticketId,
  technicians,
}: AssignTechnicianDialogProps) => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>(assignedToId ? String(assignedToId) : "");

  const submitAssignment = async () => {
    if (!selectedTechnicianId) {
      setError("Select a technician.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        body: JSON.stringify({
          assignedTo: selectedTechnicianId,
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

      onAssigned?.(selectedTechnicianId);
      setOpen(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to assign technician.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button disabled={disabled} size="sm" type="button" variant="outline" />}>
        Assign Technician
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Technician</DialogTitle>
          <DialogDescription>Pick a technician to take this request.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="assign-technician">Technician</Label>
          <Select items={[]} onValueChange={(value) => setSelectedTechnicianId(value ?? "")} value={selectedTechnicianId}>
            <SelectTrigger className="w-full" id="assign-technician">
              <SelectValue placeholder="Select technician" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {technicians.map((technician) => (
                  <SelectItem key={String(technician.id)} value={String(technician.id)}>
                    {technician.name ?? technician.email ?? `Technician ${technician.id}`}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button disabled={isSubmitting} onClick={submitAssignment} type="button">
            {isSubmitting ? "Assigning..." : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
