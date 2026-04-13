import { candidateProfile } from '../../lib/data';

export default function SettingsPage() {
  return (
    <main className="stack">
      <section className="hero">
        <h1>Candidate settings</h1>
        <p>These values are already loaded from your current preferences.</p>
      </section>

      <section className="card">
        <div className="form-grid">
          <label>
            Target roles
            <textarea readOnly rows="5" defaultValue={candidateProfile.targetRoles.join('\n')} />
          </label>
          <label>
            Locations
            <textarea readOnly rows="5" defaultValue={candidateProfile.locations.join('\n')} />
          </label>
          <label>
            Minimum salary
            <input readOnly defaultValue={candidateProfile.minimumSalary} />
          </label>
          <label>
            Maximum applications per day
            <input readOnly defaultValue={candidateProfile.maxApplicationsPerDay} />
          </label>
          <label>
            Follow up after days
            <input readOnly defaultValue={candidateProfile.followUpAfterDays} />
          </label>
          <label>
            Interview prep minutes
            <input readOnly defaultValue={candidateProfile.prepMinutes} />
          </label>
        </div>
      </section>
    </main>
  );
}
