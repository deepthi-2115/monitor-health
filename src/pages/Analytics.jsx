/**
 * Analytics.jsx
 * Super-robust analytics page with fuzzy key detection and pure React/SVG charts.
 */

import React, { useMemo } from 'react';

/* ── helper: Fuzzy key finder ──────────────────────── */
function getVal(row, variants) {
  // variants are lowercase underscore names we prefer, but we check raw keys too
  const rawKeys = Object.keys(row);
  for (const v of variants) {
    // 1. Exact match (already normalized in App.jsx)
    if (row[v] !== undefined) return row[v];
    
    // 2. Fuzzy case-insensitive/space-insensitive match just in case
    const normalizedV = v.toLowerCase().replace(/[^a-z0-0]/g, '');
    for (const rk of rawKeys) {
      if (rk.toLowerCase().replace(/[^a-z0-0]/g, '') === normalizedV) {
        return row[rk];
      }
    }
  }
  return undefined;
}

function parseDate(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

const PALETTE = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6'];

/* ── Card wrapper ───────────────────────────────────── */
function Card({ title, subtitle, children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.035)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 18, padding: 28,
      display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.09em', color: '#64748b', marginBottom: 4 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: '#475569' }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

/* ── Chart 1: Donut (SVG) ────────────────────────────── */
function DonutChart({ data }) {
  const totalVal = data.reduce((s, d) => s + d.value, 0);
  if (data.length === 0) return <div style={{ color: '#475569', textAlign: 'center', padding: 40, border: '1px dashed' }}>No package field detected in CSV</div>;

  const R = 80, cx = 110, cy = 110, stroke = 32;
  const circ = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
      <svg width={220} height={220} style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        {data.map((d, i) => {
          const dash = (1 / data.length) * circ; // Equal slices for visualization if percentages aren't ideal
          const gap  = circ - dash;
          const el = (
            <circle key={i} cx={cx} cy={cy} r={R} fill="none"
              stroke={d.color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
            />
          );
          offset += dash;
          return el;
        })}
        <text x={cx} y={cy + 6} textAnchor="middle" fill="#fff"
          fontSize={22} fontWeight="800" fontFamily="Outfit">
          {data[0]?.value}%
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '180px', overflowY: 'auto', paddingRight: '10px' }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: d.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{d.label}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{d.value}% closure</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Chart 2: Horizontal Bar (pure div) ─────────────── */
function HBarChart({ data, color }) {
  if (!data.length) return <div style={{ color: '#475569', textAlign: 'center', padding: 40 }}>No breaches or missing "station"/"date" fields</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
             <span style={{ color: '#94a3b8', fontWeight: 600 }}>{d.label}</span>
             <span style={{ color: '#ef4444' }}>{d.value} breaches</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 100, height: 8, overflow: 'hidden' }}>
            <div style={{
              width: `${(d.value / max) * 100}%`, height: '100%',
              background: color || `linear-gradient(90deg, #ef4444, #f59e0b)`,
              borderRadius: 100,
              transition: 'width 0.8s ease',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Chart 3: Multi-line (SVG) ──────────────────────── */
function LineChart({ series, labels }) {
  if (!labels.length) return <div style={{ color: '#475569', textAlign: 'center', padding: 40, border: '1px dashed' }}>No "submitted_date" column detected</div>;

  const W = 560, H = 200, PL = 36, PR = 16, PT = 12, PB = 28;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;
  const allVals = series.flatMap(s => s.data);
  const maxV = Math.max(...allVals, 1);

  const toX = i => PL + (i / Math.max(labels.length - 1, 1)) * chartW;
  const toY = v => PT + chartH - (v / maxV) * chartH;

  const step = Math.ceil(labels.length / 6);

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 320 }}>
        {[0, 0.5, 1].map((t, i) => (
          <line key={i} x1={PL} y1={PT + chartH * (1 - t)} x2={W - PR} y2={PT + chartH * (1 - t)}
            stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        ))}
        {series.map((s, si) => {
          if (s.data.length === 0) return null;
          const pts = s.data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
          const fillPts = `${PL},${PT + chartH} ` + s.data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ') + ` ${toX(s.data.length - 1)},${PT + chartH}`;
          return (
            <g key={si}>
              <polygon points={fillPts} fill={s.color} opacity={0.12} />
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            </g>
          );
        })}
        {labels.map((l, i) => i % step === 0 && (
          <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" fill="#475569" fontSize={10}>{l}</text>
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 24, marginTop: 12 }}>
        {series.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#94a3b8' }}>
            <div style={{ width: 12, height: 3, background: s.color, borderRadius: 2 }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Chart 4: Grouped Bar (SVG) ─────────────────────── */
function GroupedBar({ data, labels }) {
  if (!labels.length) return <div style={{ color: '#475569', textAlign: 'center', padding: 40, border: '1px dashed' }}>No "contractor" column detected</div>;

  const maxV = Math.max(...data.flatMap(s => s.data), 1);
  const barW = 12, barGap = 2, groupGap = 15;
  const groupW = data.length * barW + (data.length - 1) * barGap;
  const W = Math.max(560, labels.length * (groupW + groupGap) + 80);
  const H = 220, PL = 36, PB = 50, PT = 12;
  const chartH = H - PT - PB;

  const groupX = i => PL + i * (groupW + groupGap) + 10;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
        {[0, 1].map((t, i) => (
          <line key={i} x1={PL} y1={PT + chartH * (1 - t)} x2={W} y2={PT + chartH * (1 - t)} stroke="rgba(255,255,255,0.05)" />
        ))}
        {labels.map((label, gi) => (
          <g key={gi}>
            {data.map((s, si) => {
              const v = s.data[gi] || 0;
              const bh = (v / maxV) * chartH;
              const bx = groupX(gi) + si * (barW + barGap);
              const by = PT + chartH - bh;
              return <rect key={si} x={bx} y={by} width={barW} height={bh} fill={s.color} rx={2} />;
            })}
            <text x={groupX(gi) + groupW / 2} y={H - PB + 14} textAnchor="middle" fill="#64748b" fontSize={9} transform={`rotate(25, ${groupX(gi) + groupW/2}, ${H-PB+14})`}>{label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ── Main Analytics Page ─────────────────────────────── */
export default function Analytics({ data }) {

  // Auto-detect Keys
  const keysFound = useMemo(() => {
    if (!data.length) return {};
    const first = data[0];
    const find = (variants) => {
      const k = Object.keys(first).find(rk => 
        variants.some(v => rk.toLowerCase().replace(/[^a-z0-9]/g, '') === v.toLowerCase().replace(/[^a-z0-0]/g, ''))
      );
      return k;
    };
    
    return {
      pkg: find(['package', 'package_name', 'pkg', 'package_id']),
      status: find(['status', 'rfi_status', 'current_status']),
      station: find(['station', 'station_name', 'site', 'location']),
      submitted: find(['raised_date', 'submitted_date', 'date', 'rfi_date', 'creation_date', 'submission_date']),
      sla: find(['sla_deadline', 'sla', 'deadline', 'due_date']),
      closed: find(['closed_date', 'date_closed', 'finish_date']),
      result: find(['result', 'outcome', 'inspection_result']),
      contractor: find(['contractor_id', 'contractor', 'contractor_name', 'vendor', 'agency'])
    };
  }, [data]);

  // 1. Closure rate
  const closureItems = useMemo(() => {
    const kPkg = keysFound.pkg;
    const kStatus = keysFound.status;
    const kClosed = keysFound.closed;
    if (!kPkg) return [];
    
    const map = {};
    data.forEach(r => {
      const p = r[kPkg] || 'Other';
      map[p] = map[p] || { t: 0, c: 0 };
      map[p].t++;
      
      // If status column exists, use it. Otherwise, if closed_date is present, it's "Closed"
      const s = kStatus ? String(r[kStatus] || '').toLowerCase() : '';
      const hasClosedDate = kClosed && r[kClosed] && r[kClosed] !== '';
      
      if (s === 'closed' || s === 'completed' || s === 'approved' || (!kStatus && hasClosedDate)) {
        map[p].c++;
      }
    });
    return Object.entries(map)
      .map(([pkg, { t, c }], i) => ({ label: pkg, value: t ? Math.round((c / t) * 100) : 0, color: PALETTE[i % PALETTE.length] }))
      .sort((a, b) => b.value - a.value);
  }, [data, keysFound]);

  // 2. SLA breaches
  const slaItems = useMemo(() => {
    const kStation = keysFound.station;
    const kSla = keysFound.sla;
    const kClosed = keysFound.closed;
    const kStatus = keysFound.status;
    if (!kStation || !kSla) return [];

    const today = new Date();
    const map = {};
    data.forEach(r => {
      const station = r[kStation] || 'Unknown';
      const sla = parseDate(r[kSla]);
      const cl = parseDate(r[kClosed]);
      const status = String(r[kStatus] || '').toLowerCase();
      const breached = (status !== 'closed' && sla && sla < today) || (cl && sla && cl > sla);
      if (breached) map[station] = (map[station] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([label, value]) => ({ label, value }));
  }, [data, keysFound]);

  // 3. Monthly trends
  const trendData = useMemo(() => {
    const kDate = keysFound.submitted;
    const kResult = keysFound.result;
    if (!kDate) return { labels: [], series: [] };

    const map = {};
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    data.forEach(r => {
      const d = parseDate(r[kDate]);
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = map[key] || { app: 0, rej: 0 };
      const res = String(r[kResult] || '').toLowerCase();
      if (res === 'approved') map[key].app++;
      else if (res === 'rejected') map[key].rej++;
    });
    const keys = Object.keys(map).sort();
    return {
      labels: keys.map(k => { const [y, m] = k.split('-'); return `${months[+m - 1]} ${y}`; }),
      series: [
        { label: 'Approved', color: '#10b981', data: keys.map(k => map[k].app) },
        { label: 'Rejected', color: '#ef4444', data: keys.map(k => map[k].rej) },
      ],
    };
  }, [data, keysFound]);

  // 4. Contractor
  const contractorData = useMemo(() => {
    const kCont = keysFound.contractor;
    const kRes = keysFound.result;
    if (!kCont) return { labels: [], series: [] };

    const map = {};
    data.forEach(r => {
      const c = r[kCont] || 'Unknown';
      map[c] = map[c] || { a: 0, r: 0 };
      const res = String(r[kRes] || '').toLowerCase();
      if (res === 'approved') map[c].a++;
      else if (res === 'rejected') map[c].r++;
    });
    const sorted = Object.entries(map).sort((a, b) => (b[1].a + b[1].r) - (a[1].a + a[1].r)).slice(0, 8);
    return {
      labels: sorted.map(s => s[0]),
      series: [
        { label: 'Approved', color: '#10b981', data: sorted.map(s => s[1].a) },
        { label: 'Rejected', color: '#ef4444', data: sorted.map(s => s[1].r) },
      ],
    };
  }, [data, keysFound]);

  return (
    <div className="section-panel">
      {/* Dev Debug Banner - will show if keys are missing */}
      {(!keysFound.pkg || !keysFound.submitted) && (
        <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid var(--amber)', padding: '12px', borderRadius: '10px', marginBottom: '24px', fontSize: '12px', color: 'var(--amber)' }}>
          <strong>⚠️ Column Mapping Warning:</strong> Some expected columns (like "{!keysFound.pkg ? 'Package' : ''}" {!keysFound.pkg && !keysFound.submitted ? 'and' : ''} "{!keysFound.submitted ? 'Date' : ''}") were not found in your CSV. Please ensure your CSV headers match standard RFI fields. Detected columns: {Object.keys(data[0] || {}).join(', ')}
        </div>
      )}

      <div className="mb-32">
        <h2 style={{ fontSize: '28px', fontWeight: '800' }}>Performance Analytics</h2>
        <p style={{ color: 'var(--text-2)' }}>
          Automatic data visualization powered by fuzzy column mapping.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
        <Card title="📦 Closure Rate by Package" subtitle="% completed per package">
          <DonutChart data={closureItems} />
        </Card>
        <Card title="🚨 SLA Breaches by Station" subtitle="Overdue/Late inspections">
          <HBarChart data={slaItems} />
        </Card>
        <Card title="📈 Monthly Outcome Trend" subtitle="Approvals vs Rejections">
          <LineChart series={trendData.series} labels={trendData.labels} />
        </Card>
        <Card title="🏗️ Contractor Scorecard" subtitle="Overall RFI results by vendor">
          <GroupedBar data={contractorData.series} labels={contractorData.labels} />
        </Card>
      </div>
    </div>
  );
}
