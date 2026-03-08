import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type UserRole } from "@/src/components/tickets/types";

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

type ActivityLogItem = {
  action: "assigned" | "comment-added" | "created" | "priority-changed" | "status-changed";
  actor?: RelationUser;
  createdAt?: string;
  id: number | string;
  message: string;
};

const ACTION_LABELS: Record<ActivityLogItem["action"], string> = {
  assigned: "Assigned",
  "comment-added": "Comment",
  created: "Created",
  "priority-changed": "Priority",
  "status-changed": "Status",
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const resolveActor = (value: RelationUser) => {
  if (!value || typeof value !== "object") {
    return "System";
  }

  return value.name ?? value.email ?? "System";
};

export const ActivityLog = ({ logs }: { logs: ActivityLogItem[] }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity has been recorded yet.</p>
        ) : (
          <ol className="space-y-4">
            {logs.map((entry) => (
              <li className="relative pl-4" key={String(entry.id)}>
                <span className="absolute top-2 left-0 h-2 w-2 rounded-full bg-primary" />
                <div className="space-y-1 rounded-md border bg-muted/30 px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-foreground">{ACTION_LABELS[entry.action]}</span>
                    <span className="text-muted-foreground">{formatDateTime(entry.createdAt)}</span>
                  </div>
                  <p className="text-sm">{entry.message}</p>
                  <p className="text-xs text-muted-foreground">By: {resolveActor(entry.actor)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
};
