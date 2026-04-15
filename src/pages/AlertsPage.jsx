import React, { useMemo } from 'react';
import { runRuleEngine } from '../utils/ruleEngine';

export default function AlertsPage({ data }) {
  const alerts = useMemo(() => runRuleEngine(data), [data]);

  return (
    <div className="section-panel">
      <div className="mb-16">
        <h2 style={{ fontSize: '28px', fontWeight: '800' }}>Health Monitoring System</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Real-time automated rule evaluation based on regional safety and efficiency standards.
        </p>
      </div>

      <div className="alerts-container mt-32">
        {alerts.length === 0 ? (
          <div className="card p-24 text-center">
            <h3 style={{ fontSize: '18px' }}>✅ All Systems Nominal</h3>
            <p className="text-muted">No health breaches detected in the current dataset.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className={`alert-card-premium ${alert.severity.toLowerCase()}`}>
              <div className="alert-title-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>
                    {alert.severity === 'CRITICAL' ? '🛑' : '⚠️'}
                  </span>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{alert.rule}: {alert.severity} Breach</h3>
                    <p style={{ fontSize: '13px', opacity: 0.8 }}>Impact: {alert.totalAffected} RFIs affected</p>
                  </div>
                </div>
                <div className="alert-badge-group">
                  <span className={`alert-badge ${alert.severity.toLowerCase()}`}>
                    {alert.severity}
                  </span>
                </div>
              </div>

              <div className="alert-info-grid">
                <div>
                  <h4 className="mb-16" style={{ fontSize: '14px', color: 'var(--accent-cyan)' }}>📝 Description</h4>
                  <p style={{ fontSize: '15px', lineHeight: '1.6' }}>{alert.description}</p>
                </div>
                <div>
                  <h4 className="mb-16" style={{ fontSize: '14px', color: 'var(--accent-cyan)' }}>⚡ Recommended Action</h4>
                  <div style={{ 
                    padding: '16px', 
                    background: 'rgba(0,0,0,0.3)', 
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}>
                    {alert.action}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-16" style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Affected RFI Identifiers ({alert.totalAffected})
                </h4>
                <div className="id-pill-container">
                  {alert.affectedIds.map(id => (
                    <span key={id} className="id-pill">{id}</span>
                  ))}
                  {alert.totalAffected > alert.affectedIds.length && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                      + {alert.totalAffected - alert.affectedIds.length} more records
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
