import { DEMO_ACCOUNTS, DEMO_PASSWORD, USERS, ROLES } from "@/mock/organization";
import { Avatar } from "@/components/ui";

/** Prototype only: quick sign-in as each role. Remove with mock auth. */
export default function DemoAccounts({ onPick }) {
  return (
    <div className="mt-8 border-t border-line pt-5">
      <p className="text-[13px] font-medium text-ink">Sample accounts</p>
      <p className="meta mb-3">Password for all: {DEMO_PASSWORD}</p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {DEMO_ACCOUNTS.map(({ userId, hint }) => {
          const u = USERS.find((x) => x.id === userId);
          const role = ROLES.find((r) => r.id === u.roleId);
          return (
            <li key={userId}>
              <button
                type="button"
                onClick={() => onPick(u.email, DEMO_PASSWORD)}
                className="flex w-full items-center gap-2.5 rounded-md border border-line bg-surface px-3 py-2 text-left hover:border-line-strong hover:bg-subtle cursor-pointer"
              >
                <Avatar name={u.name} size="xs" />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-ink">{role.label}</span>
                  <span className="block truncate text-xs text-muted">{hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
