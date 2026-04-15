import React, { useMemo } from 'react';

const TAG_COLORS = [
  { bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.25)' },
  { bg: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.25)' },
  { bg: 'rgba(6, 182, 212, 0.12)',  color: '#06b6d4', border: 'rgba(6, 182, 212, 0.25)' },
  { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: 'rgba(16, 185, 129, 0.25)' },
  { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.25)' },
];

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

/** Extract keyword frequency */
function analyzeRemarks(data) {
  const freq = {};
  const stopWords = new Set(['the','a','an','is','was','are','were','be','to','of','in','for','and','on','with','at','by','from','this','that','it','as','rfi','done','nil','n/a','check','checked']);

  data.forEach((r) => {
    const text = (r.remarks || '').toLowerCase().replace(/[^a-z0-9\s]/g, '');
    text.split(/\s+/).forEach((w) => {
      if (w.length < 4 || stopWords.has(w)) return;
      freq[w] = (freq[w] || 0) + 1;
    });
  });

  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([word, count]) => ({ word, count }));
}

/** Compute top defect types */
function topDefects(data) {
  const map = {};
  data.forEach((r) => {
    const val = r.defect_type || r.activity_type || 'General Inspection';
    if (val) map[val] = (map[val] || 0) + 1;
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([type, count]) => ({ type, count }));
}

export default function Insights({ data }) {
  const keywords = useMemo(() => analyzeRemarks(data), [data]);
  const defects = useMemo(() => topDefects(data), [data]);

  return (
    <div className="section-panel">
      <div className="mb-32">
        <h2 style={{ fontSize: '28px', fontWeight: '800' }}>Smart Insights</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Leveraging qualitative data analysis to identify recurring themes and operational bottlenecks.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div className="card p-24">
          <div className="section-header">
            <div className="section-icon amber">💡</div>
            <h2 className="section-title">Keyword Analysis Cloud</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
            Common terminology extracted from field remarks and inspection logs.
          </p>
          <div className="insight-pills-row">
            {keywords.map((kw, i) => {
              const c = TAG_COLORS[i % TAG_COLORS.length];
              return (
                <span key={kw.word} className="insight-pill" style={{ color: c.color, borderColor: c.border }}>
                  {kw.word} <strong>{kw.count}</strong>
                </span>
              );
            })}
          </div>
        </div>

        <div className="card p-24">
          <div className="section-header">
            <div className="section-icon red">🔧</div>
            <h2 className="section-title">Activity Frequency Distribution</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
            Distribution of the most common inspection activities.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {defects.map((d, i) => {
              const max = defects[0].count;
              const pct = (d.count / max) * 100;
              return (
                <div key={d.type}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                    <span style={{ fontWeight: 600 }}>{d.type}</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>{d.count} units</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div className="defect-bar-fill" style={{ 
                      width: `${pct}%`, 
                      height: '100%', 
                      background: `linear-gradient(90deg, ${CHART_COLORS[i % CHART_COLORS.length]}dd, ${CHART_COLORS[i % CHART_COLORS.length]}66)` 
                    }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
