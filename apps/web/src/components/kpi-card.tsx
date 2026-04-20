type KpiCardProps = {
  label: string;
  value: string;
  tone?: "default" | "good" | "bad";
  helper?: string;
};

export function KpiCard({ helper, label, tone = "default", value }: KpiCardProps) {
  return (
    <article className={`kpi-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {helper ? <p>{helper}</p> : null}
    </article>
  );
}
