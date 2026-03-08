import { Activity, CheckCircle2, CircleDot, UserCheck } from "lucide-react";
import type { ComponentType } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StatsCounts = {
  assigned: number;
  done: number;
  inProgress: number;
  open: number;
};

type StatsCardItem = {
  key: keyof StatsCounts;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const CARDS: StatsCardItem[] = [
  { key: "open", label: "Open", icon: CircleDot },
  { key: "assigned", label: "Assigned", icon: UserCheck },
  { key: "inProgress", label: "In Progress", icon: Activity },
  { key: "done", label: "Done", icon: CheckCircle2 },
];

export const StatsCards = ({ counts }: { counts: StatsCounts }) => {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map((item) => (
        <Card key={item.key}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
            <item.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold leading-none tracking-tight">{counts[item.key]}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
};

export type { StatsCounts };