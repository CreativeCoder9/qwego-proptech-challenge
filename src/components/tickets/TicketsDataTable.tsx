"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PriorityBadge } from "@/src/components/tickets/PriorityBadge";
import { StatusBadge } from "@/src/components/tickets/StatusBadge";
import { CATEGORY_LABELS, formatDate, type TicketListItem, type UserRole } from "@/src/components/tickets/types";

type TicketsDataTableProps = {
  role: UserRole;
  tickets: TicketListItem[];
};

export const TicketsDataTable = ({ role, tickets }: TicketsDataTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [titleFilter, setTitleFilter] = useState("");

  const columns = useMemo<ColumnDef<TicketListItem>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            variant="ghost"
          >
            Title
            <ArrowUpDown className="size-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <Link className="font-medium hover:underline" href={`/tickets/${row.original.id}`}>
            {row.original.title}
          </Link>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => CATEGORY_LABELS[row.original.category],
      },
      ...(role === "manager" || role === "admin"
        ? [
            {
              accessorKey: "tenantName",
              header: "Tenant",
              cell: ({ row }) => row.original.tenantName ?? "-",
            } satisfies ColumnDef<TicketListItem>,
          ]
        : []),
      ...(role === "manager" || role === "admin"
        ? [
            {
              accessorKey: "assignedToName",
              header: "Technician",
              cell: ({ row }) => row.original.assignedToName ?? "-",
            } satisfies ColumnDef<TicketListItem>,
          ]
        : []),
      {
        accessorKey: "updatedAt",
        header: "Updated",
        cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.updatedAt)}</span>,
      },
    ],
    [role],
  );

  const table = useReactTable({
    columns,
    data: tickets,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      columnFilters: [
        {
          id: "title",
          value: titleFilter,
        },
      ],
      sorting,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Input
          className="max-w-sm"
          onChange={(event) => setTitleFilter(event.target.value)}
          placeholder="Filter by title..."
          value={titleFilter}
        />
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center text-muted-foreground" colSpan={columns.length}>
                  No tickets found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
          size="sm"
          type="button"
          variant="outline"
        >
          Previous
        </Button>
        <Button
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
          size="sm"
          type="button"
          variant="outline"
        >
          Next
        </Button>
      </div>
    </div>
  );
};
