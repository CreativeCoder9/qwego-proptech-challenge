# Prime Challenges PropTech MVP

A full-stack MVP application built for property management, handling tenants, tickets, and maintenance operations. It's built with modern web technologies:

- **Next.js 15 (App Router)**
- **Payload CMS v3**
- **SQLite**
- **shadcn/ui & Tailwind CSS v4**

## Features

- **Role-based Authentication**: Dashboards and access controls for `admin`, `manager`, `technician`, and `tenant` roles.
- **Ticketing System**: Submit maintenance tickets with images. Managers can assign them and set priorities; technicians can mark them done.
- **Activity & Auditing**: Every status change or key action generates an activity log timeline.
- **Notifications**: Internal notification system for users regarding their tickets.

## Getting Started

Check out the detailed runbook in `docs/runbook.md` for information on setting up and running the application, seeding the database, and understanding the architecture.
