import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { useNavigate } from 'react-router-dom';

/* ── Inline SVG dashboard illustration ─────────────────── */
function DashboardIllustration() {
  return (
    <div className="hero-illustration" aria-hidden="true">
      {/* Glow backdrop */}
      <div className="illus-glow" />

      {/* Floating CSV badge */}
      <div className="csv-float">
        <span style={{ fontSize: 28 }}>📄</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#facc15', letterSpacing: 1 }}>CSV</span>
      </div>

      {/* Main "screen" */}
      <div className="illus-screen">
        {/* Screen topbar */}
        <div className="illus-topbar">
          <div className="illus-dot red" /><div className="illus-dot amber" /><div className="illus-dot green" />
          <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, margin: '0 8px' }} />
        </div>

        {/* Screen body */}
        <div className="illus-body">
          {/* Sidebar */}
          <div className="illus-sidebar">
            {[60, 45, 80, 55, 70].map((w, i) => (
              <div key={i} style={{ height: 6, width: `${w}%`, background: i === 1 ? '#3b82f6' : 'rgba(255,255,255,0.1)', borderRadius: 3, marginBottom: 10 }} />
            ))}
          </div>

          {/* Content area */}
          <div className="illus-content">
            {/* Stat cards row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {['#10b981', '#3b82f6', '#f59e0b', '#ef4444'].map((c, i) => (
                <div key={i} className="illus-stat-card" style={{ borderTop: `2px solid ${c}` }}>
                  <div style={{ height: 5, width: '60%', background: 'rgba(255,255,255,0.15)', borderRadius: 2, marginBottom: 4 }} />
                  <div style={{ height: 10, width: '40%', background: c, borderRadius: 2, opacity: 0.8 }} />
                </div>
              ))}
            </div>

            {/* Chart area */}
            <div style={{ display: 'flex', gap: 8, flex: 1 }}>
              {/* Line chart */}
              <div className="illus-chart-box" style={{ flex: 2 }}>
                <svg width="100%" height="70" viewBox="0 0 160 70" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="lg2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 50 C20 40 40 20 60 30 S100 10 130 20 L160 15 L160 70 L0 70 Z" fill="url(#lg1)" />
                  <path d="M0 50 C20 40 40 20 60 30 S100 10 130 20 L160 15" fill="none" stroke="#3b82f6" strokeWidth="2" />
                  <path d="M0 60 C20 55 40 45 70 50 S110 35 140 40 L160 38 L160 70 L0 70 Z" fill="url(#lg2)" />
                  <path d="M0 60 C20 55 40 45 70 50 S110 35 140 40 L160 38" fill="none" stroke="#10b981" strokeWidth="2" />
                </svg>
              </div>

              {/* Donut chart */}
              <div className="illus-chart-box" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
                <svg width="60" height="60" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="22" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                  <circle cx="30" cy="30" r="22" fill="none" stroke="#3b82f6" strokeWidth="10"
                    strokeDasharray="90 48" strokeLinecap="round" transform="rotate(-90 30 30)" />
                  <circle cx="30" cy="30" r="22" fill="none" stroke="#10b981" strokeWidth="10"
                    strokeDasharray="48 90" strokeDashoffset="-90" strokeLinecap="round" transform="rotate(-90 30 30)" />
                </svg>
              </div>

              {/* Bar chart */}
              <div className="illus-chart-box" style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'space-around', padding: '8px 6px 4px', display: 'flex' }}>
                {[55, 80, 40, 70, 90, 60].map((h, i) => (
                  <div key={i} style={{ width: 8, height: `${h}%`, borderRadius: '3px 3px 0 0',
                    background: i % 2 === 0 ? '#8b5cf6' : '#06b6d4', opacity: 0.8 }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating metric chips */}
      <div className="metric-chip chip-1">
        <span style={{ color: '#10b981', fontWeight: 800, fontSize: 13 }}>↑ 84%</span>
        <span style={{ color: '#94a3b8', fontSize: 10 }}>closure rate</span>
      </div>
      <div className="metric-chip chip-2">
        <span style={{ color: '#ef4444', fontWeight: 800, fontSize: 13 }}>🚨 12</span>
        <span style={{ color: '#94a3b8', fontSize: 10 }}>SLA breaches</span>
      </div>
    </div>
  );
}

/* ── Main Landing Page ─────────────────────────────────── */
export default function Landing({ onDataParsed, data }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const parseFile = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a valid .csv file.');
      return;
    }
    setLoading(true);
    setError('');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data.length) {
          setError('The uploaded file appears to be empty.');
          setLoading(false);
          return;
        }
        onDataParsed(results.data, file.name);
        setLoading(false);
      },
      error: () => {
        setError('Failed to parse CSV. Please check the file format.');
        setLoading(false);
      },
    });
  };

  return (
    <div className="lp-wrapper">
      {/* ── Top Navbar ── */}
      <nav className="lp-nav">
        <div className="lp-nav-logo">
          <div className="lp-nav-logo-icon">⚡</div>
          <span><strong>Metro</strong> Analytics</span>
        </div>
        <div className="lp-nav-links">
          <a href="#" onClick={() => data?.length > 0 && navigate('/overview')}>Dashboard</a>
          <a href="#">Features</a>
          <a href="#">API</a>
        </div>
        <button
          className="lp-nav-cta"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          <span>▲</span> Upload Dataset
        </button>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        {/* Left: text */}
        <div className="lp-hero-left">
          <div className="lp-badge">
            🚉 Hackathon Project — Metro Analytics
          </div>
          <h1 className="lp-hero-title">
            Construction<br />
            <span className="lp-title-accent">Health Monitor</span>
          </h1>
          <p className="lp-hero-sub">
            Upload your RFI dataset and instantly get rule-based alerts,
            SLA compliance charts, and actionable insights — all in your browser.
          </p>

          {/* Upload drop zone */}
          <div
            className={`lp-drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); parseFile(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Click or drag to upload CSV"
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
          >
            {loading ? (
              <span style={{ color: 'var(--text-2)' }}>⚙️ Parsing dataset…</span>
            ) : (
              <>
                <span style={{ fontSize: 22 }}>📁</span>
                <span>Drop <em>hackathon_rfi_dataset.csv</em> here or</span>
                <button className="lp-browse-btn" type="button">Browse file</button>
              </>
            )}
          </div>

          {error && (
            <div className="lp-error">⚠️ {error}</div>
          )}

          {data?.length > 0 && (
            <button className="lp-return-btn" onClick={() => navigate('/overview')}>
              ← Return to active dashboard ({data.length.toLocaleString()} records)
            </button>
          )}

          {/* Feature pills */}
          <div className="lp-feature-pills">
            {['🛑 SLA Breach Alerts', '📊 4 Live Charts', '💡 NLP Insights', '🔍 RFI Explorer'].map(f => (
              <span key={f} className="lp-feature-pill">{f}</span>
            ))}
          </div>
        </div>

        {/* Right: illustration */}
        <div className="lp-hero-right">
          <DashboardIllustration />
        </div>
      </section>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={(e) => { parseFile(e.target.files[0]); e.target.value = ''; }}
      />
    </div>
  );
}
