"use client";

import { useQuery } from "@/hooks/useQuery";
import { formatPhone } from "@/lib/format";
import { orgService } from "@/services";
import { Avatar, Badge, ErrorState, PageHeader, Skeleton } from "@/components/ui";

/** Read-only in Phase 1. Invite / edit arrives with the user API. */
export default function UsersView() {
  const { data, loading, error, reload } = useQuery(() => orgService.listUsers(), [], { refreshOn: [] });

  return (
    <div className="page">
      <PageHeader title="Users" description="Who can sign in, their role and the outlets they cover. Editing arrives with the user API." />
      <section className="panel overflow-hidden">
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading && !data ? (
          <div className="p-4"><Skeleton className="h-48" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table min-w-[760px]">
              <thead>
                <tr><th>Name</th><th>Role</th><th>Outlets</th><th>Mailbox</th><th>Status</th></tr>
              </thead>
              <tbody>
                {data.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} />
                        <div>
                          <p className="font-medium text-ink">{u.name}</p>
                          <p className="meta">{u.email}, {formatPhone(u.phone)}</p>
                        </div>
                      </div>
                    </td>
                    <td>{u.roleLabel}</td>
                    <td>{u.outletNames.join(", ")}</td>
                    <td className="text-body">{u.mailbox?.address || <span className="text-muted">Not connected</span>}</td>
                    <td><Badge tone={u.active ? "green" : "gray"}>{u.active ? "Active" : "Disabled"}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
