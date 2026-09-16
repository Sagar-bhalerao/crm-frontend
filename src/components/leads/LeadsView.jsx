"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, SearchX } from "lucide-react";
import { DEFAULT_PAGE_SIZE } from "@/config/app";
import { P } from "@/config/permissions";
import { useAuth } from "@/context/AuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useQuery } from "@/hooks/useQuery";
import { leadService, orgService } from "@/services";
import { Button, EmptyState, ErrorState, PageHeader, Pagination, Skeleton } from "@/components/ui";
import LeadCard from "./LeadCard";
import LeadFilters from "./LeadFilters";
import LeadTable from "./LeadTable";

const QUERY_KEYS = ["search", "status", "outletId", "type", "assignedToId", "date", "from", "to", "sort", "page"];
const DEFAULT_SORT = "createdAt:desc";

/** Filters live in the URL so lists are shareable and dashboard links work. */
function readQuery(params) {
  const q = Object.fromEntries(QUERY_KEYS.map((k) => [k, params.get(k) || ""]));
  q.sort = q.sort || DEFAULT_SORT;
  q.page = Number(q.page) || 1;
  q.pageSize = DEFAULT_PAGE_SIZE;
  return q;
}

export default function LeadsView() {
  const { user, can } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const query = useMemo(() => readQuery(params), [params]);

  const [search, setSearch] = useState(query.search);
  const debouncedSearch = useDebounce(search, 300);

  const updateQuery = (patch) => {
    const next = { ...query, page: 1, ...patch };
    const sp = new URLSearchParams();
    QUERY_KEYS.forEach((k) => {
      const v = next[k];
      if (v && !(k === "sort" && v === DEFAULT_SORT) && !(k === "page" && Number(v) === 1)) sp.set(k, v);
    });
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  useEffect(() => {
    if (debouncedSearch !== query.search) updateQuery({ search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const queryKey = JSON.stringify(query);
  const { data, loading, error, reload } = useQuery(() => leadService.listLeads(query), [queryKey, user.id]);
  const { data: outlets } = useQuery(() => orgService.listOutlets(), [user.id], { refreshOn: [] });
  const showTeam = can(P.LEAD_VIEW_OUTLET) || can(P.LEAD_VIEW_ALL);
  const { data: team } = useQuery(() => orgService.listSalesTeam(), [user.id], { refreshOn: [], enabled: showTeam });

  const clear = () => {
    setSearch("");
    router.replace(pathname, { scroll: false });
  };

  const description = !data
    ? "\u00a0"
    : showTeam
    ? `${data.total} ${data.total === 1 ? "lead" : "leads"} across your outlets`
    : `${data.total} ${data.total === 1 ? "lead" : "leads"} assigned to you`;

  return (
    <div className="page">
      <PageHeader
        title="Leads"
        description={description}
        actions={can(P.LEAD_CREATE) && <Button variant="primary" icon={Plus} href="/leads/new">New lead</Button>}
      />

      <section className="panel">
        <LeadFilters
          query={query}
          search={search}
          onSearch={setSearch}
          onChange={updateQuery}
          onClear={clear}
          outlets={outlets || []}
          team={team || []}
          showTeam={showTeam}
        />

        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data ? (
          <ListSkeleton />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No leads match these filters"
            description="Try a different search or clear the filters to see all leads."
            action={<Button size="sm" onClick={clear}>Clear filters</Button>}
          />
        ) : (
          <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
            <div className="hidden lg:block">
              <LeadTable leads={data.items} sort={query.sort} onSort={(sort) => updateQuery({ sort })} canEdit={can(P.LEAD_UPDATE)} />
            </div>
            <ul className="divide-y divide-line lg:hidden">
              {data.items.map((lead) => (
                <li key={lead.id}><LeadCard lead={lead} /></li>
              ))}
            </ul>
            <div className="border-t border-line">
              <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onChange={(page) => updateQuery({ page })} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-3 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12" />
      ))}
    </div>
  );
}
