export function ApiStatusBanner() {
  return (
    <p className="mb-4 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-4 py-3 text-sm text-[var(--warning)]">
      API offline — start PostgreSQL, then run{" "}
      <code className="text-xs">mvn spring-boot:run</code> in backend/
    </p>
  );
}
