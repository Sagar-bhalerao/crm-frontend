import Badge from "./Badge";

/** Active / inactive state used across the configuration screens. */
export default function StatusBadge({ status }) {
  const active = status === "active";
  return <Badge tone={active ? "green" : "gray"} dot>{active ? "Active" : "Inactive"}</Badge>;
}
