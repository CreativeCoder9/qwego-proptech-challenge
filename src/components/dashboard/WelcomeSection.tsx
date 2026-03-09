import { Building2, Clock3, Mail, Phone } from "lucide-react";
import type { ComponentType } from "react";

type BusinessInfoItem = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
};

const businessName = process.env.BUSINESS_NAME || "Sky Properties";
const businessTagline =
  process.env.BUSINESS_TAGLINE || "Track operations, team performance, and tenant requests in one place.";

const businessInfo: BusinessInfoItem[] = [
  {
    icon: Building2,
    label: "Head Office",
    value: process.env.BUSINESS_ADDRESS || "221B Baker Street, London NW1",
  },
  {
    icon: Mail,
    label: "Support Email",
    value: process.env.BUSINESS_EMAIL || "support@sky-properties.com",
  },
  {
    icon: Phone,
    label: "Support Phone",
    value: process.env.BUSINESS_PHONE || "+1 (800) 555-0114",
  },
  {
    icon: Clock3,
    label: "Operating Hours",
    value: process.env.BUSINESS_HOURS || "Mon-Fri, 8:00 AM - 6:00 PM",
  },
];

export const WelcomeSection = () => {
  return (
    <section className="overflow-hidden rounded-2xl border border-cyan-200/60 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 px-6 py-6 text-slate-100 shadow-sm">
      <div className="space-y-5">
        <div className="space-y-2">
          <span className="inline-flex items-center rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-200">
            Management Portal
          </span>
          <h2 className="text-2xl font-semibold tracking-tight">Welcome to {businessName}</h2>
          <p className="max-w-3xl text-sm text-slate-300">{businessTagline}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {businessInfo.map((item) => (
            <article
              key={item.label}
              className="rounded-lg border border-slate-500/50 bg-slate-950/25 p-3 backdrop-blur-sm"
            >
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-200">
                <item.icon className="size-3.5" />
                {item.label}
              </p>
              <p className="text-sm font-medium text-slate-100">{item.value}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
