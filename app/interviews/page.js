import Table from '../../components/Table';
import { interviews } from '../../lib/data';

export default function InterviewsPage() {
  return (
    <main className="stack">
      <section className="hero">
        <h1>Interviews</h1>
        <p>Upcoming interviews, prep blocks, and role-specific briefing notes.</p>
      </section>
      <Table
        columns={[
          { key: 'role', label: 'Role' },
          { key: 'company', label: 'Company' },
          { key: 'interviewAt', label: 'Interview time' },
          { key: 'prepSummary', label: 'Prep summary' }
        ]}
        rows={interviews}
      />
    </main>
  );
}
