import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, RefreshCw, CheckCircle, AlertOctagon, ShieldAlert, Lock, ShieldCheck } from 'lucide-react';
import { api, setApiRole } from '../api';
import { ValidationReportCard } from '../components/ValidationReportCard';

interface ValidationPageProps {
  role: 'editor' | 'admin';
  setRole: (role: 'editor' | 'admin') => void;
}

export const ValidationPage: React.FC<ValidationPageProps> = ({ role, setRole }) => {
  const queryClient = useQueryClient();
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const isEditor = role === 'editor';

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['validation-report'],
    queryFn: () => api.getValidationReport()
  });

  const handlePublish = async () => {
    if (isEditor) return;
    setPublishing(true);
    setPublishError(null);
    setPublishResult(null);

    try {
      const res = await api.publishCatalog();
      setPublishResult(res);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['publish-history'] });
    } catch (err: any) {
      setPublishError(err.message || 'Publishing failed');
    } finally {
      setPublishing(false);
    }
  };

  const isPublishDisabled = isLoading || !report?.is_publishable || publishing || isEditor;

  return (
    <div className="page-content">
      {/* Role Banner Header */}
      {isEditor ? (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          padding: '14px 20px',
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '8px', borderRadius: '8px', display: 'flex' }}>
              <ShieldAlert size={20} color="#ef4444" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#f87171', fontSize: '0.92rem' }}>
                EDITOR ROLE RESTRICTION — Publish Access Locked 🔒
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
                You are currently in <strong>EDITOR</strong> mode. Editors can inspect validation reports, but publishing catalogue updates to storage requires <strong>ADMIN</strong> role permissions.
              </div>
            </div>
          </div>
          <button
            className="btn-secondary"
            style={{ whiteSpace: 'nowrap', borderColor: '#ef4444', color: '#f87171', background: 'rgba(239, 68, 68, 0.1)' }}
            onClick={() => {
              setApiRole('admin');
              setRole('admin');
            }}
          >
            Switch to Admin Role 🔓
          </button>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          padding: '12px 18px',
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.88rem',
          color: 'var(--text-main)'
        }}>
          <ShieldCheck size={20} color="#6366f1" />
          <span>
            <strong>ADMIN PRIVILEGES ACTIVE:</strong> You have full authorization to execute atomic catalogue publishing once pre-flight validation rules pass.
          </span>
        </div>
      )}

      <div className="page-title-bar">
        <div>
          <h1>Publish Catalogue Control Center</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Run pre-flight validation checks and trigger atomic catalogue updates.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn-secondary" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
            Re-run Validation
          </button>

          <button
            className="btn-primary"
            disabled={isPublishDisabled}
            onClick={handlePublish}
            style={{
              backgroundColor: isPublishDisabled ? 'var(--bg-input)' : 'var(--accent-success)',
              color: isPublishDisabled ? 'var(--text-muted)' : '#fff',
              padding: '12px 24px',
              fontSize: '0.95rem',
              cursor: isPublishDisabled ? 'not-allowed' : 'pointer'
            }}
            title={isEditor ? "Publishing requires Admin role" : ""}
          >
            {isEditor ? (
              <>
                <Lock size={16} />
                Publish Restricted (Admin Only)
              </>
            ) : publishing ? (
              <>
                <Play size={18} />
                Publishing Catalogue...
              </>
            ) : (
              <>
                <Play size={18} />
                Publish Catalogue Now
              </>
            )}
          </button>
        </div>
      </div>

      {/* Disabled Reason Callout */}
      {!report?.is_publishable && !isLoading && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '14px 18px', borderRadius: '10px', marginBottom: '24px', color: '#fca5a5', fontSize: '0.88rem' }}>
          <strong>⛔ Publish Button Disabled:</strong> Catalogue publishing is blocked because {report?.total_issues} issue(s) exist in your content. Please review and fix the issues listed below.
        </div>
      )}

      {/* Publish Success Banner */}
      {publishResult && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '18px 24px', borderRadius: '12px', marginBottom: '24px', color: '#6ee7b7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px' }}>
            <CheckCircle size={22} color="var(--accent-success)" />
            Catalogue Published Successfully!
          </div>
          <div style={{ fontSize: '0.88rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '12px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
            <div>Shows Published: <strong>{publishResult.shows_published}</strong></div>
            <div>Episodes Published: <strong>{publishResult.episodes_published}</strong></div>
            <div>Collapsed Groups: <strong>{publishResult.collapsed_episodes}</strong></div>
            <div>Run ID: <strong>#{publishResult.publish_run_id}</strong></div>
          </div>
        </div>
      )}

      {/* Publish Error Banner */}
      {publishError && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', color: '#fca5a5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, fontSize: '1rem' }}>
            <AlertOctagon size={20} />
            Publish Rejected
          </div>
          <div style={{ marginTop: '6px', fontSize: '0.88rem' }}>{publishError}</div>
        </div>
      )}

      {/* Live Validation Report Card */}
      <ValidationReportCard report={report || null} loading={isLoading} />
    </div>
  );
};
