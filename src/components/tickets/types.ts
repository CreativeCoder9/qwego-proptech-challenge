export type TicketStatus = "open" | "assigned" | "in-progress" | "done";
export type TicketPriority = "low" | "medium" | "high" | "critical";
export type TicketCategory = "plumbing" | "electrical" | "hvac" | "structural" | "other";
export type UserRole = "tenant" | "manager" | "technician";

export type TicketListItem = {
  id: number | string;
  assignedToName?: string;
  category: TicketCategory;
  createdAt?: string;
  description: string;
  imageCount: number;
  priority: TicketPriority;
  status: TicketStatus;
  tenantName?: string;
  title: string;
  updatedAt?: string;
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  assigned: "Assigned",
  done: "Done",
  "in-progress": "In Progress",
  open: "Open",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  critical: "Critical",
  high: "High",
  low: "Low",
  medium: "Medium",
};

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  electrical: "Electrical",
  hvac: "HVAC",
  other: "Other",
  plumbing: "Plumbing",
  structural: "Structural",
};

export const formatDate = (value?: string) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};
