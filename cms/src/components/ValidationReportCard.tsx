import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, Wrench } from 'lucide-react';
import { ValidationReport, ValidationIssue } from '../types';

interface ValidationReportCardProps {
  report: ValidationReport | null;
  loading: boolean;
  onFixEntity?: (entityType: 'show' | 'episode', entityId: string) => void;
}

export const ValidationReportCard: React.FC<ValidationReportCardProps> = ({
  report,
  loading,
  onFixEntity
}) => {
  if (loading) {
    return (
      <div className="validation-card" style={{ textAlign: 'center', padding: '40px' }}>
        <span style={{ color: 'var(--text-muted)' }}>Running validation check across published catalogue...</span>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="validation-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {report.is_publishable ? (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)', padding: '10px', borderRadius: '12px' }}>
              <CheckCircle2 size={24} />
            </div>
          ) : (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-danger)', padding: '10px', borderRadius: '12px' }}>
              <ShieldAlert size={24} />
            </div>
          )}
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {report.is_publishable ? 'Catalogue Ready for Publishing' : 'Catalogue Has Blocking Validation Issues'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {report.is_publishable
                ? 'All published shows and episodes pass automated quality checks.'
                : `${report.total_issues} issue(s) across ${report.shows_with_issues.length} show(s) must be resolved before publishing.`}
            </p>
          </div>
        </div>

        <div className={`badge ${report.is_publishable ? 'badge-published' : 'badge-draft'}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
          {report.is_publishable ? 'VALIDATED' : `${report.total_issues} BLOCKS`}
        </div>
      </div>

      {!report.is_publishable && (
        <div style={{ marginTop: '16px' }}>
          {Object.entries(report.issues_by_category).map(([category, issues]) => (
            <div key={category} className="issue-category-group">
              <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--accent-warning)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={15} />
                {category.replace(/_/g, ' ')} ({issues.length})
              </h4>

              {issues.map((issue, idx) => (
                <div key={idx} className="issue-item danger" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="issue-title">
                      {issue.show_title} {issue.episode_title ? `→ Episode: ${issue.episode_title} (${issue.entity_id})` : ''}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '2px' }}>{issue.message}</div>
                    <div className="issue-fix">💡 Fix: {issue.actionable_fix}</div>
                  </div>

                  {onFixEntity && (
                    <button
                      className="btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                      onClick={() => onFixEntity(issue.entity_type, issue.entity_id)}
                    >
                      <Wrench size={13} />
                      Fix Issue
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
