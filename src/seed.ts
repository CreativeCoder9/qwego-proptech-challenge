import { createRequire } from "node:module";

type UserRole = "manager" | "technician" | "tenant";
type TicketStatus = "open" | "assigned" | "in-progress" | "done";
type TicketPriority = "low" | "medium" | "high" | "critical";
type TicketCategory = "plumbing" | "electrical" | "hvac" | "structural" | "other";

type SeedUserInput = {
  email: string;
  name: string;
  password: string;
  phone?: string;
  role: UserRole;
  unit?: string;
};

type SeedTicketInput = {
  assignedTo?: number | string;
  building: string;
  category: TicketCategory;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  tenant: number | string;
  title: string;
  unit: string;
};

type PayloadClient = Awaited<ReturnType<(typeof import("payload"))["getPayload"]>>;

const upsertUser = async (payload: PayloadClient, user: SeedUserInput) => {
  const existing = await payload.find({
    collection: "users",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      email: {
        equals: user.email,
      },
    },
  });

  if (existing.docs[0]) {
    return payload.update({
      id: existing.docs[0].id,
      collection: "users",
      data: {
        name: user.name,
        password: user.password,
        phone: user.phone,
        role: user.role,
        unit: user.unit,
      },
      overrideAccess: true,
    });
  }

  return payload.create({
    collection: "users",
    data: user,
    overrideAccess: true,
  });
};

const upsertTicket = async (payload: PayloadClient, ticket: SeedTicketInput) => {
  const existing = await payload.find({
    collection: "tickets",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        {
          title: {
            equals: ticket.title,
          },
        },
        {
          tenant: {
            equals: ticket.tenant,
          },
        },
        {
          unit: {
            equals: ticket.unit,
          },
        },
      ],
    },
  });

  if (existing.docs[0]) {
    return payload.update({
      id: existing.docs[0].id,
      collection: "tickets",
      data: {
        assignedTo: ticket.assignedTo,
        building: ticket.building,
        category: ticket.category,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        tenant: ticket.tenant,
        title: ticket.title,
        unit: ticket.unit,
      },
      overrideAccess: true,
    });
  }

  return payload.create({
    collection: "tickets",
    data: {
      assignedTo: ticket.assignedTo,
      building: ticket.building,
      category: ticket.category,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      tenant: ticket.tenant,
      title: ticket.title,
      unit: ticket.unit,
    },
    overrideAccess: true,
  });
};

const run = async () => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seed script is blocked in production.");
  }

  const seedPassword = process.env.SEED_PASSWORD;

  if (!seedPassword || seedPassword.length < 12) {
    throw new Error("SEED_PASSWORD must be set and at least 12 characters long.");
  }

  console.log("Seed: preparing environment...");
  // Work around tsx + @next/env CJS interop on Node 24 during payload env loading.
  const require = createRequire(import.meta.url);
  const nextEnv = require("@next/env");
  if (!("default" in nextEnv)) {
    nextEnv.default = nextEnv;
  }

  console.log("Seed: loading Payload modules...");
  const [{ getPayload }, { default: config }] = await Promise.all([
    import("payload"),
    import("../payload.config"),
  ]);

  console.log("Seed: initializing Payload...");
  const payload = await getPayload({ config });
  console.log("Seed: Payload initialized.");

  const manager = await upsertUser(payload, {
    email: "manager@qwego.local",
    name: "Maya Manager",
    password: seedPassword,
    phone: "+1 555-0100",
    role: "manager",
  });

  const technicianA = await upsertUser(payload, {
    email: "tech.ajay@qwego.local",
    name: "Ajay Technician",
    password: seedPassword,
    phone: "+1 555-0101",
    role: "technician",
  });

  const technicianB = await upsertUser(payload, {
    email: "tech.nina@qwego.local",
    name: "Nina Technician",
    password: seedPassword,
    phone: "+1 555-0102",
    role: "technician",
  });

  const tenantA = await upsertUser(payload, {
    email: "tenant.alex@qwego.local",
    name: "Alex Tenant",
    password: seedPassword,
    phone: "+1 555-0103",
    role: "tenant",
    unit: "A-102",
  });

  const tenantB = await upsertUser(payload, {
    email: "tenant.sam@qwego.local",
    name: "Sam Tenant",
    password: seedPassword,
    phone: "+1 555-0104",
    role: "tenant",
    unit: "B-305",
  });

  const tickets: SeedTicketInput[] = [
    {
      building: "Sunset Towers",
      category: "plumbing",
      description: "Kitchen sink is leaking from the P-trap under the basin.",
      priority: "high",
      status: "open",
      tenant: tenantA.id,
      title: "Kitchen sink leak",
      unit: "A-102",
    },
    {
      assignedTo: technicianA.id,
      building: "Sunset Towers",
      category: "electrical",
      description: "Living room ceiling light flickers intermittently.",
      priority: "medium",
      status: "assigned",
      tenant: tenantB.id,
      title: "Flickering ceiling light",
      unit: "B-305",
    },
    {
      assignedTo: technicianB.id,
      building: "Sunset Towers",
      category: "hvac",
      description: "Bedroom AC does not cool even after thermostat reset.",
      priority: "critical",
      status: "in-progress",
      tenant: tenantA.id,
      title: "AC not cooling",
      unit: "A-102",
    },
    {
      assignedTo: technicianA.id,
      building: "Sunset Towers",
      category: "structural",
      description: "Main bathroom ceiling shows damp patch and peeling paint.",
      priority: "high",
      status: "done",
      tenant: tenantB.id,
      title: "Bathroom ceiling damp patch",
      unit: "B-305",
    },
    {
      building: "Sunset Towers",
      category: "other",
      description: "Bedroom window latch is loose and not locking properly.",
      priority: "low",
      status: "open",
      tenant: tenantA.id,
      title: "Window latch repair",
      unit: "A-102",
    },
  ];

  for (const ticket of tickets) {
    await upsertTicket(payload, ticket);
  }

  console.log("Seed complete.");
  console.log(`Seed password source: SEED_PASSWORD (${seedPassword.length} chars)`);
  console.log(`Manager: ${manager.email}`);
  console.log(`Technicians: ${technicianA.email}, ${technicianB.email}`);
  console.log(`Tenants: ${tenantA.email}, ${tenantB.email}`);

  if (typeof payload.db.destroy === "function") {
    await payload.db.destroy();
  }
  process.exit(0);
};

run().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
