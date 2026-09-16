import { Construction } from "lucide-react";
import { Button, EmptyState, PageHeader } from "@/components/ui";

/** Screens planned for a later phase. */
export default function PlaceholderModule({ title, description, plannedFeatures = [], link }) {
  return (
    <div className="page">
      <PageHeader title={title} description={description} />
      <section className="panel">
        <EmptyState
          icon={Construction}
          title={`${title} arrives in Phase 2`}
          description="The lead workflow already records this data, so this screen will list it once the API is connected."
          action={link && <Button size="sm" href={link.href}>{link.label}</Button>}
        />
        {plannedFeatures.length > 0 && (
          <div className="border-t border-line px-6 py-5">
            <p className="section-title mb-2">Planned</p>
            <ul className="grid gap-1.5 text-sm text-body sm:grid-cols-2">
              {plannedFeatures.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
