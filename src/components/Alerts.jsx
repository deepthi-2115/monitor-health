/**
 * Alerts.jsx
 * Displays the list of triggered rule engine alerts.
 */

import React from 'react';

export default function Alerts({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="card">
        <div className="section-header">
          <div className="section-icon green">✓</div>
          <h2 className="section-title">System Alerts</h2>
        </div>
        <div className="no-alerts">
          <div className="no-alerts-icon">🎉</div>
          <div className="no-alerts-text">No active alerts!</div>
          <div style={{ fontSize: '13px', marginTop: '6px' }}>All systems nominal.</div>
        </div>
      </div>
    );
  }

  // Group by severity to show criticals first
  const sorted = [...alerts].sort((a, b) => {
    const s = { CRITICAL: 0, WARNING: 1, INFO: 2 };
    return (s[a.severity] ?? 3) - (s[b.severity] ?? 3);
  });

  return (
    <div className="card">
      <div className="section-header">
        <div className="section-icon red">🚨</div>
        <h2 className="section-title">System Alerts</h2>
        <span className="section-badge" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)', borderColor: 'rgba(239,68,68,0.3)' }}>
          {alerts.length} Detected
        </span>
      </div>

      <div className="alerts-list">
        {sorted.map((alert) => (
          <div key={alert.id} className={`alert-card ${alert.severity.toLowerCase()}`}>
            <div className="alert-header">
              <span className={`severity-badge ${alert.severity.toLowerCase()}`}>
                {alert.severity === 'CRITICAL' ? '⚠️ ' : (alert.severity === 'WARNING' ? '⚡ ' : 'ℹ️ ')}
                {alert.severity}
              </span>
              <span className="alert-rule-tag">{alert.rule}</span>
            </div>
            
            <div className="alert-description">{alert.description}</div>
            
            <div className="alert-ids">
              Affected: {alert.affectedIds.map(id => <span key={id}>{id}</span>)}
              {alert.totalAffected > alert.affectedIds.length && (
                <span>+{alert.totalAffected - alert.affectedIds.length} more</span>
              )}
            </div>
            
            <div className="alert-action">
              <div className="alert-action-label">Action:</div>
              <div>{alert.action}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
