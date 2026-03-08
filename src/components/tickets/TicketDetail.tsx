import Image from "next/image";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityBadge } from "@/src/components/tickets/PriorityBadge";
import { StatusBadge } from "@/src/components/tickets/StatusBadge";
import {
  CATEGORY_LABELS,
  formatDate,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
  type UserRole,
} from "@/src/components/tickets/types";

type RelationUser =
  | {
    email?: string;
    id?: number | string;
    name?: string;
    role?: UserRole;
  }
  | number
  | string
  | null
  | undefined;

type RelationMedia =
  | {
    filename?: string;
    id?: number | string;
    url?: string;
  }
  | number
  | string
  | null
  | undefined;

type TicketDetailData = {
  assignedTo?: RelationUser;
  building?: string;
  category: TicketCategory;
  createdAt?: string;
  description: string;
  id: number | string;
  images?: Array<{ id?: number | string; image?: RelationMedia }>;
  priority: TicketPriority;
  resolvedAt?: string;
  status: TicketStatus;
  tenant?: RelationUser;
  title: string;
  unit?: string;
  updatedAt?: string;
};

const resolveUserLabel = (value: RelationUser) => {
  if (!value || typeof value !== "object") {
    return "-";
  }

  return value.name ?? value.email ?? "-";
};

const resolveImage = (value: RelationMedia) => {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (!value.url) {
    return null;
  }

  return {
    alt: value.filename ?? "Ticket image",
    id: value.id,
    url: value.url,
  };
};

export const TicketDetail = ({ ticket }: { ticket: TicketDetailData }) => {
  const images = (ticket.images ?? [])
    .map((item) => resolveImage(item.image))
    .filter((image): image is NonNullable<ReturnType<typeof resolveImage>> => Boolean(image));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="gap-3">
          <CardTitle>{ticket.title}</CardTitle>
          <CardDescription>{ticket.description}</CardDescription>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <span className="rounded-md border bg-muted px-2 py-1 text-xs text-muted-foreground">
              {CATEGORY_LABELS[ticket.category]}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Tenant:</span> {resolveUserLabel(ticket.tenant)}
            </p>
            <p>
              <span className="text-muted-foreground">Technician:</span> {resolveUserLabel(ticket.assignedTo)}
            </p>
            <p>
              <span className="text-muted-foreground">Apt / Unit No.:</span> {ticket.unit || "-"}
            </p>
            <p>
              <span className="text-muted-foreground">Building:</span> {ticket.building || "-"}
            </p>
            <p>
              <span className="text-muted-foreground">Created:</span> {formatDate(ticket.createdAt)}
            </p>
            <p>
              <span className="text-muted-foreground">Updated:</span> {formatDate(ticket.updatedAt)}
            </p>
            <p>
              <span className="text-muted-foreground">Resolved:</span> {formatDate(ticket.resolvedAt)}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Images</p>
            {images.length === 0 ? (
              <p className="text-sm text-muted-foreground">No images uploaded.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {images.map((image, index) => (
                  <div className="overflow-hidden rounded-md border bg-muted" key={String(image.id ?? `${image.url}-${index}`)}>
                    <Image
                      alt={image.alt}
                      className="h-48 w-full object-cover"
                      height={384}
                      src={image.url}
                      width={640}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
