"use client";

import { Check, Minus } from "lucide-react";
import { PERMISSION_GROUPS } from "@/config/permissions";
import { useQuery } from "@/hooks/useQuery";
import { orgService } from "@/services";
import { ErrorState, PageHeader, Skeleton } from "@/components/ui";

/** Permission matrix. The UI checks these permissions, never role names. */
export default function RolesView() {
  const { data: roles, loading, error, reload } = useQuery(() => orgService.listRoles(), [], { refreshOn: [] });
  const has = (role, key) => role.permissions.includes("*") || role.permissions.includes(key);

  return (
    <div className="page">
      <PageHeader title="Roles & permissions" description="Access is decided by permissions, then narrowed by the brands and outlets assigned to each user." />
      <section className="panel overflow-hidden">
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading && !roles ? (
          <div className="p-4"><Skeleton className="h-96" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table min-w-[720px]">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-72">Permission</th>
                  {roles.map((r) => (
                    <th key={r.id} className="text-center">
                      <span className="block text-ink">{r.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_GROUPS.map((group) => (
                  <PermissionGroup key={group.label} group={group} roles={roles} has={has} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function PermissionGroup({ group, roles, has }) {
  return (
    <>
      <tr className="hover:bg-transparent">
        <td colSpan={roles.length + 1} className="bg-subtle py-2 text-xs font-semibold text-ink">{group.label}</td>
      </tr>
      {group.items.map((p) => (
        <tr key={p.key}>
          <td className="sticky left-0 bg-surface">
            <p className="text-ink">{p.label}</p>
            <p className="meta">{p.key}</p>
          </td>
          {roles.map((r) => (
            <td key={r.id} className="text-center">
              {has(r, p.key) ? (
                <Check size={16} className="mx-auto text-success" aria-label="Allowed" />
              ) : (
                <Minus size={16} className="mx-auto text-line-strong" aria-label="Not allowed" />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
