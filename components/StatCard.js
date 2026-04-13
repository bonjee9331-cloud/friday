export default function StatCard({ label, value, hint }) {
  return (
    <div className="card">
      <div className="muted">{label}</div>
      <div className="stat">{value}</div>
      {hint ? <div className="small">{hint}</div> : null}
    </div>
  );
}
