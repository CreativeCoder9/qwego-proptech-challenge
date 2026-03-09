import React from "react";

type BusinessItem = {
  label: string;
  value: string;
};

const normalizePortalURL = (value?: string): string | null => {
  if (!value) {
    return null;
  }

  if (value.startsWith("/")) {
    return value;
  }

  try {
    return new URL(value).toString();
  } catch {
    return null;
  }
};

const getPortalURL = (): string => {
  const explicitURL = normalizePortalURL(process.env.MANAGEMENT_PORTAL_URL);

  if (explicitURL) {
    return explicitURL;
  }

  const baseURL = normalizePortalURL(process.env.APP_BASE_URL);
  if (baseURL) {
    return `${baseURL.replace(/\/$/, "")}/dashboard`;
  }

  return "/dashboard";
};

export default function AdminDashboardOverview() {
  const businessName = "Property Manager Admin Portal";
  const businessTagline = "This portal is only accessible to admin users. Please click the button below to open the management portal";

  const businessInfo: BusinessItem[] = [
    {
      label: "Head Office",
      value: process.env.BUSINESS_ADDRESS || "221B Baker Street, London NW1",
    },
    {
      label: "Support Email",
      value: process.env.BUSINESS_EMAIL || "support@qwego.com",
    },
    {
      label: "Support Phone",
      value: process.env.BUSINESS_PHONE || "+1 (800) 555-0114",
    },
    {
      label: "Operating Hours",
      value: process.env.BUSINESS_HOURS || "Mon-Fri, 8:00 AM - 6:00 PM",
    },
  ];

  const managementPortalURL = getPortalURL();

  return (
    <section
      style={{
        background:
          "radial-gradient(circle at 85% -10%, #f0f9ff 0%, rgba(240, 249, 255, 0) 45%), linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0b3b4f 100%)",
        borderRadius: 18,
        color: "#e2e8f0",
        marginBottom: 20,
        overflow: "hidden",
        padding: "1.75rem",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div style={{ display: "grid", gap: "0.625rem" }}>
          <span
            style={{
              background: "rgba(56, 189, 248, 0.2)",
              border: "1px solid rgba(125, 211, 252, 0.35)",
              borderRadius: 999,
              color: "#7dd3fc",
              display: "inline-flex",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.6,
              maxWidth: "fit-content",
              padding: "0.25rem 0.625rem",
              textTransform: "uppercase",
            }}
          >
            Admin Command Center
          </span>
          <h1 style={{ color: "#f8fafc", fontSize: "2rem", fontWeight: 700, lineHeight: 1.15, margin: 0 }}>
            Welcome to {businessName}
          </h1>
          <p style={{ color: "#cbd5e1", fontSize: "1rem", margin: 0, maxWidth: 760 }}>{businessTagline}</p>
        </div>

        <a
          href={managementPortalURL}
          style={{
            alignItems: "center",
            background: "linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)",
            borderRadius: 10,
            color: "#06222b",
            display: "inline-flex",
            fontWeight: 700,
            maxWidth: "fit-content",
            padding: "0.75rem 1rem",
            textDecoration: "none",
          }}
        >
          Open Management Portal
        </a>

        <div
          style={{
            columnGap: "0.75rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            rowGap: "0.75rem",
          }}
        >
          {businessInfo.map((item) => (
            <article
              key={item.label}
              style={{
                background: "rgba(15, 23, 42, 0.52)",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: 12,
                minHeight: 98,
                padding: "0.875rem",
              }}
            >
              <p
                style={{
                  color: "#7dd3fc",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0.45,
                  margin: 0,
                  textTransform: "uppercase",
                }}
              >
                {item.label}
              </p>
              <p style={{ color: "#e2e8f0", fontSize: "0.95rem", fontWeight: 600, lineHeight: 1.5, margin: "0.5rem 0 0" }}>
                {item.value}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
