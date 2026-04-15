/**
 * App.jsx — Metro Construction Health Monitor
 * Manages global data state, routing, and sidebar layout.
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Papa from 'papaparse';

import Landing   from './pages/Landing';
import Overview  from './pages/Overview';
import AlertsPage from './pages/AlertsPage';
import DataTable  from './pages/DataTable';
import Analytics  from './pages/Analytics';
import Insights   from './pages/Insights';

// Nav items config
const NAV = [
  { path: '/overview', icon: '📊', label: 'Overview' },
  { path: '/alerts',   icon: '🚨', label: 'Health Alerts' },
  { path: '/charts',   icon: '📈', label: 'Analytics' },
  { path: '/data',     icon: '📋', label: 'Data Explorer' },
  { path: '/insights', icon: '💡', label: 'Smart Insights' },
];

// Page titles + subtitles
const PAGE_META = {
  '/overview': { title: 'System Overview',     sub: 'Real-time health metrics across all packages and stations.' },
  '/alerts':   { title: 'Health Alerts',       sub: 'Automated rule engine detections and recommended actions.' },
  '/charts':   { title: 'Performance Analytics', sub: 'Closure rates, SLA compliance, and contractor trends.' },
  '/data':     { title: 'Data Explorer',       sub: 'Filter, sort, and inspect all 500 RFI records.' },
  '/insights': { title: 'Smart Insights',      sub: 'NLP-driven keyword analysis and activity distribution.' },
};

export default function App() {
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Restore session from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rfi_data');
      const name  = localStorage.getItem('rfi_filename');
      if (saved && name) {
        // Re-normalize keys in case old data was saved before normalization
        const raw = JSON.parse(saved);
        const renormalized = raw.map(row => {
          const obj = {};
          Object.entries(row).forEach(([k, v]) => {
            const normalKey = k.trim().toLowerCase().replace(/[\s\-]+/g, '_');
            obj[normalKey] = typeof v === 'string' ? v.trim() : v;
          });
          return obj;
        });
        setData(renormalized);
        setFileName(name);
      }
    } catch { /* ignore parse errors */ }
  }, []);

  const handleDataParsed = (parsedData, name) => {
    // Normalize all keys: trim + lowercase + spaces→underscores
    // e.g. "Package" → "package", "Submitted Date" → "submitted_date"
    const cleaned = parsedData.map(row => {
      const obj = {};
      Object.entries(row).forEach(([k, v]) => {
        const normalKey = k.trim().toLowerCase().replace(/[\s\-]+/g, '_');
        obj[normalKey] = typeof v === 'string' ? v.trim() : v;
      });
      return obj;
    });
    setData(cleaned);
    setFileName(name);
    localStorage.setItem('rfi_data', JSON.stringify(cleaned));
    localStorage.setItem('rfi_filename', name);
    navigate('/overview');
  };

  const handleReset = () => {
    setData([]);
    setFileName('');
    localStorage.removeItem('rfi_data');
    localStorage.removeItem('rfi_filename');
    navigate('/');
  };

  const meta = PAGE_META[location.pathname] || {};

  /** Sidebar + content shell for authenticated pages */
  const Layout = ({ children }) => (
    <div className="layout-container">
      {/* ── Sidebar ── */}
      <aside className="sidebar" role="navigation" aria-label="Main navigation">
        <div className="sidebar-logo-container">
          <div className="sidebar-logo">🚇</div>
          <span className="sidebar-title">Metro<br/>Monitor</span>
        </div>

        <nav className="nav-links">
          {NAV.map(({ path, icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`nav-link ${location.pathname === path ? 'active' : ''}`}
              aria-current={location.pathname === path ? 'page' : undefined}
            >
              <span className="nav-icon">{icon}</span>
              <span className="nav-text">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="filter-reset-btn" onClick={handleReset} style={{ width: '100%', justifyContent: 'center' }}>
            ↩&nbsp; Reset Data
          </button>
        </div>
      </aside>

      {/* ── Page content ── */}
      <main className="page-content" role="main">
        <header className="page-header">
          <div className="page-header-left">
            <h2>{meta.title}</h2>
            <p>{meta.sub}</p>
          </div>
          <div className="online-badge">
            <span className="status-dot" aria-hidden="true" />
            Live &bull; {data.length.toLocaleString()} records
          </div>
        </header>

        {children}
      </main>
    </div>
  );

  /** Redirect to landing when data is absent */
  const Guard = ({ children }) =>
    data.length > 0 ? children : <Landing onDataParsed={handleDataParsed} data={data} />;

  return (
    <div className="app-wrapper">
      <Routes>
        <Route path="/" element={<Landing onDataParsed={handleDataParsed} data={data} />} />
        <Route path="/overview" element={<Guard><Layout><Overview  data={data} /></Layout></Guard>} />
        <Route path="/alerts"   element={<Guard><Layout><AlertsPage data={data} /></Layout></Guard>} />
        <Route path="/charts"   element={<Guard><Layout><Analytics  data={data} /></Layout></Guard>} />
        <Route path="/data"     element={<Guard><Layout><DataTable  data={data} /></Layout></Guard>} />
        <Route path="/insights" element={<Guard><Layout><Insights   data={data} /></Layout></Guard>} />
      </Routes>
    </div>
  );
}
