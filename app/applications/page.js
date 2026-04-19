import Table from '../../components/Table';
import { applications } from '../../lib/data';

export default function ApplicationsPage() {
  return (
    <main className="stack">
      <section className="hero">
        <h1>Applications</h1>
        <p>Track what has been sent, what needs a follow-up, and what is moving toward interview.</p>
      </section>
      <Table
        columns={[
          { key: 'company', label: 'Company' },
          { key: 'role', label: 'Role' },
          { key: 'status', label: 'Status' },
          { key: 'appliedAt', label: 'Applied' },
          { key: 'followUpDueAt', label: 'Follow-up due' }
        ]}
        rows={applications}
      />
    </main>
  );
}
