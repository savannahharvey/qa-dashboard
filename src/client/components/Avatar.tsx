export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

export function Avatar({ name, light = false }: { name: string; light?: boolean }) {
  return <span className={light ? "avatar light" : "avatar"}>{getInitials(name)}</span>;
}
