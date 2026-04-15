/**
 * Dashboard.jsx
 * Orchestrates all sections: stats, filters, table, charts, alerts, extras.
 * Includes tab navigation so users can jump between sections easily,
 * especially on mobile devices.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Filters from './Filters';
import Table from './Table';
import Charts from './Charts';
import Alerts from './Alerts';
import { runRuleEngine } from '../utils/ruleEngine';

/** Parse date string safely */
function parseDate(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/** Apply all active filters to the dataset */
function applyFilters(data, filters) {
  return data.filter((row) => {
    if (filters.package && row.package !== filters.package) return false;
    if (filters.station && row.station !== filters.station) return false;
    if (filters.subsystem_type && row.subsystem_type !== filters.subsystem_type) return false;
    if (filters.result && row.result !== filters.result) return false;

    // Date range filter (on submitted_date)
    if (filters.dateFrom) {
      const d = parseDate(row.submitted_date);
      if (!d || d < new Date(filters.dateFrom)) return false;
    }
    if (filters.dateTo) {
      const d = parseDate(row.submitted_date);
      if (!d || d > new Date(filters.dateTo + 'T23:59:59')) return false;
    }
    return true;
  });
}

/** Compute summary stats from data */
function computeStats(data) {
  let total = data.length;
  let closed = 0;
  let approved = 0;
  let rejected = 0;
  let slaBreach = 0;
  const today = new Date();

  data.forEach((r) => {
    const status = (r.status || '').toLowerCase();
    const result = (r.result || '').toLowerCase();
    if (status === 'closed') closed++;
    if (result === 'approved') approved++;
    if (result === 'rejected') rejected++;

    const sla = parseDate(r.sla_deadline);
    const closedDate = parseDate(r.closed_date);
    if (sla) {
      if ((status !== 'closed' && sla < today) || (closedDate && closedDate > sla)) {
        slaBreach++;
      }
    }
  });

  return {
    total,
    closed,
    closureRate: total > 0 ? ((closed / total) * 100).toFixed(1) : '0.0',
    approved,
    rejected,
    rejectionRate: total > 0 ? ((rejected / total) * 100).toFixed(1) : '0.0',
    slaBreach,
  };
}

/** Extract keyword frequency from the remarks field */
function analyzeRemarks(data) {
  const freq = {};
  const stopWords = new Set([
    'the','a','an','is','was','are','were','be','has','have','had','do','does',
    'did','will','would','shall','should','may','might','can','could','to','of',
    'in','for','on','with','at','by','from','as','or','and','not','no','but',
    'it','its','this','that','these','those','i','we','you','he','she','they',
    'me','us','him','her','them','my','our','your','his','their','what','which',
    'who','whom','where','when','why','how','all','each','every','both','few',
    'more','most','other','some','such','than','too','very','just','also','into',
    'over','after','before','between','under','about','up','out','off','then',
    'been','being','so','if','there','here','only','own','same','during','while',
    '','-','&','n/a','na','nil','ok','done','yes','no','work','site','date',
  ]);

  data.forEach((r) => {
    const text = (r.remarks || r.defect_details || '').toLowerCase().replace(/[^a-z0-9\s]/g, '');
    text.split(/\s+/).forEach((w) => {
      if (w.length < 3 || stopWords.has(w)) return;
      freq[w] = (freq[w] || 0) + 1;
    });
  });

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));
}

/** Compute top defect types */
function topDefects(data) {
  // Try defect_type first, fall back to activity_type
  const defectField = data.length > 0
    ? (data[0].defect_type !== undefined ? 'defect_type' : 'activity_type')
    : null;

  if (!defectField) return [];

  const map = {};
  data.forEach((r) => {
    const val = r[defectField];
    if (val) map[val] = (map[val] || 0) + 1;
  });

  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([type, count]) => ({ type, count }));
}

// Tag colors for keyword cloud
const TAG_COLORS = [
  { bg: 'rgba(79,142,247,0.12)', color: '#4f8ef7', border: 'rgba(79,142,247,0.25)' },
  { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: 'rgba(139,92,246,0.25)' },
  { bg: 'rgba(0,212,255,0.12)',  color: '#00d4ff', border: 'rgba(0,212,255,0.25)' },
  { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.25)' },
  { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
  { bg: 'rgba(236,72,153,0.12)', color: '#ec4899', border: 'rgba(236,72,153,0.25)' },
];

const CHART_COLORS = [
  '#4f8ef7', '#8b5cf6', '#00d4ff', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#06b6d4',
];

// Section definitions for tab navigation
const SECTIONS = [
  { id: 'overview',  label: 'Overview',  icon: '📊' },
  { id: 'alerts',    label: 'Alerts',    icon: '🚨' },
  { id: 'data',      label: 'Data',      icon: '📋' },
  { id: 'charts',    label: 'Charts',    icon: '📈' },
  { id: 'insights',  label: 'Insights',  icon: '💡' },
];

export default function Dashboard({ data }) {
  // Active section tab
  const [activeTab, setActiveTab] = useState('overview');

  // Filter state
  const [filters, setFilters] = useState({
    package: '',
    station: '',
    subsystem_type: '',
    result: '',
    dateFrom: '',
    dateTo: '',
  });

  // Refs for smooth scroll-into-view
  const sectionRefs = {
    overview: useRef(null),
    alerts:   useRef(null),
    data:     useRef(null),
    charts:   useRef(null),
    insights: useRef(null),
  };

  // Filtered data
  const filteredData = useMemo(() => applyFilters(data, filters), [data, filters]);

  // Summary statistics
  const stats = useMemo(() => computeStats(filteredData), [filteredData]);

  // Rule engine alerts (run on full dataset, not filtered)
  const alerts = useMemo(() => runRuleEngine(data), [data]);

  // Keyword analysis & top defects
  const keywords = useMemo(() => analyzeRemarks(data), [data]);
  const defects = useMemo(() => topDefects(data), [data]);

  // Handle tab click → scroll to corresponding section
  const handleTabClick = (sectionId) => {
    setActiveTab(sectionId);
    const ref = sectionRefs[sectionId];
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Update active tab on scroll (intersection observer)
  useEffect(() => {
    const observers = [];
    Object.entries(sectionRefs).forEach(([id, ref]) => {
      if (!ref.current) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveTab(id);
        },
        { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
      );
      observer.observe(ref.current);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <>
      {/* ---- Section Navigation Tabs ---- */}
      <nav className="section-tabs" aria-label="Dashboard sections">
        {SECTIONS.map((sec) => (
          <button
            key={sec.id}
            className={`section-tab ${activeTab === sec.id ? 'active' : ''}`}
            onClick={() => handleTabClick(sec.id)}
            aria-current={activeTab === sec.id ? 'true' : undefined}
          >
            <span className="section-tab-icon">{sec.icon}</span>
            {sec.label}
            {/* Show alert count badge on alerts tab */}
            {sec.id === 'alerts' && alerts.length > 0 && (
              <span className="section-tab-badge">{alerts.length}</span>
            )}
          </button>
        ))}
      </nav>

      {/* ---- SECTION: Overview (KPI Stats) ---- */}
      <div ref={sectionRefs.overview} className="section-panel">
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-label">Total RFIs</div>
            <div className="stat-value blue">{stats.total}</div>
            <div className="stat-sub">All filtered records</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">Closure Rate</div>
            <div className="stat-value green">{stats.closureRate}%</div>
            <div className="stat-sub">{stats.closed} closed of {stats.total}</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-label">Approved</div>
            <div className="stat-value purple">{stats.approved}</div>
            <div className="stat-sub">Inspection passed</div>
          </div>
          <div className="stat-card red">
            <div className="stat-label">Rejected</div>
            <div className="stat-value red">{stats.rejected}</div>
            <div className="stat-sub">{stats.rejectionRate}% rejection rate</div>
          </div>
          <div className="stat-card amber">
            <div className="stat-label">SLA Breaches</div>
            <div className="stat-value amber">{stats.slaBreach}</div>
            <div className="stat-sub">Overdue or late-closed</div>
          </div>
        </div>
      </div>

      {/* ---- SECTION: Alerts ---- */}
      <div ref={sectionRefs.alerts} className="section-panel">
        <Alerts alerts={alerts} />
      </div>

      {/* ---- SECTION: Data (Filters + Table) ---- */}
      <div ref={sectionRefs.data} className="section-panel">
        <Filters data={data} filters={filters} setFilters={setFilters} />

        <div className="card" style={{ marginTop: '16px' }}>
          <div className="section-header">
            <div className="section-icon cyan">📋</div>
            <h2 className="section-title">RFI Data Table</h2>
            <span className="section-badge">{filteredData.length} records</span>
          </div>
          <Table data={filteredData} />
        </div>
      </div>

      {/* ---- SECTION: Charts ---- */}
      <div ref={sectionRefs.charts} className="section-panel">
        <Charts data={filteredData} />
      </div>

      {/* ---- SECTION: Insights (Keywords + Defects) ---- */}
      <div ref={sectionRefs.insights} className="section-panel">
        {/* Keyword Frequency */}
        {keywords.length > 0 && (
          <div className="card">
            <div className="section-header">
              <div className="section-icon amber">💬</div>
              <h2 className="section-title">Remarks – Keyword Frequency</h2>
            </div>
            <div className="keyword-grid">
              {keywords.map((kw, i) => {
                const c = TAG_COLORS[i % TAG_COLORS.length];
                return (
                  <span
                    key={kw.word}
                    className="keyword-tag"
                    style={{ background: c.bg, color: c.color, borderColor: c.border }}
                  >
                    {kw.word}
                    <strong style={{ opacity: 0.7, fontSize: '11px' }}>×{kw.count}</strong>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Defect Types */}
        {defects.length > 0 && (
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="section-header">
              <div className="section-icon red">🔧</div>
              <h2 className="section-title">Top Defect / Activity Types</h2>
            </div>
            <div className="defect-list">
              {defects.map((d, i) => {
                const maxCount = defects[0].count;
                const pct = (d.count / maxCount) * 100;
                return (
                  <div key={d.type} className="defect-item">
                    <div className="defect-rank">{i + 1}.</div>
                    <div className="defect-bar-wrapper">
                      <div className="defect-name">
                        {d.type}
                        <span className="defect-count">({d.count})</span>
                      </div>
                      <div className="defect-bar-track">
                        <div
                          className="defect-bar-fill"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${CHART_COLORS[i % CHART_COLORS.length]}, ${CHART_COLORS[(i + 1) % CHART_COLORS.length]})`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* If no keywords or defects found */}
        {keywords.length === 0 && defects.length === 0 && (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <div className="empty-text">No insight data available</div>
              <div className="empty-sub">
                The dataset may not contain remarks or defect type columns.
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
