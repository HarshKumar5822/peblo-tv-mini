import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, CheckCircle2, XCircle, User, Shield } from 'lucide-react';
import { api } from '../api';

interface HistoryPageProps {
  role: 'editor' | 'admin';
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ role }) => {
  const { data: runs, isLoading } = useQuery({
    queryKey: ['publish-history'],
    queryFn: () => api.getPublishHistory()
  });

  return (
    <div className="page-content">
      {/* Role Context Banner */}
      {role === 'editor' ? (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '10px 16px',
          borderRadius: '10px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.86rem',
          color: 'var(--text-main)'
        }}>
          <User size={16} color="#10b981" />
          <span>
            <strong>READ-ONLY AUDIT LOG (EDITOR MODE):</strong> Viewing historical record of publish runs executed by system administrators.
          </span>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          padding: '10px 16px',
          borderRadius: '10px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.86rem',
          color: 'var(--text-main)'
        }}>
          <Shield size={16} color="#6366f1" />
          <span>
            <strong>ADMIN AUDIT TRAIL:</strong> Complete operational record of atomic catalogue publish runs, execution hash metrics, and error logs.
          </span>
        </div>
      )}

      <div className="page-title-bar">
        <div>
          <h1>Publish Run Audit Logs</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Historical record of all catalogue publish attempts, execution metrics, and outcomes.
          </p>
        </div>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Run ID</th>
              <th>Timestamp (UTC)</th>
              <th>Triggered By</th>
              <th>Status</th>
              <th>Shows Count</th>
              <th>Episodes Count</th>
              <th>Catalogue Hash</th>
              <th>Details / Error Log</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px' }}>Loading publish history...</td>
              </tr>
            ) : !runs || runs.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No publish runs executed yet.
                </td>
              </tr>
            ) : (
              runs.map(r => (
                <tr key={r.id}>
                  <td><strong>#{r.id}</strong></td>
                  <td>{new Date(r.run_at).toLocaleString()}</td>
                  <td><span style={{ fontWeight: 600 }}>{r.triggered_by}</span></td>
                  <td>
                    <span className={`badge ${r.status === 'success' ? 'badge-published' : 'badge-draft'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {r.status === 'success' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {r.status.toUpperCase()}
                    </span>
                  </td>
                  <td>{r.shows_count} shows</td>
                  <td>{r.episodes_count} episodes</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {r.catalogue_hash ? `${r.catalogue_hash.substring(0, 12)}...` : 'N/A'}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: r.error_log ? 'var(--accent-danger)' : 'var(--text-muted)' }}>
                    {r.error_log || 'Clean atomic update'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
