import React, { useMemo } from 'react';

/* ── helpers ────────────────────────────────────────── */
function parseDate(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/** 
 * Robust key finder for different CSV formats
 */
function findKey(row, variants) {
  if (!row) return null;
  const rawKeys = Object.keys(row);
  return rawKeys.find(rk => 
    variants.some(v => rk.toLowerCase().replace(/[^a-z0-9]/g, '') === v.toLowerCase().replace(/[^a-z0-0]/g, ''))
  );
}

function useStats(data) {
  return useMemo(() => {
    if (!data || data.length === 0) {
      return { total: 0, closureRate: '0.0', rejectionRate: '0.0', slaBreach: 0, packages: 0, stations: 0, closed: 0, open: 0 };
    }

    // Detect keys once
    const first = data[0];
    const k = {
      pkg: findKey(first, ['package', 'pkg', 'package_name']),
      stn: findKey(first, ['station', 'site', 'location']),
      status: findKey(first, ['status', 'current_status']),
      res: findKey(first, ['result', 'outcome']),
      sla: findKey(first, ['sla_deadline', 'deadline', 'due_date']),
      cl: findKey(first, ['closed_date', 'date_closed']),
    };

    let closed = 0, approved = 0, rejected = 0, slaBreach = 0, open = 0;
    const today = new Date();
    const packages = new Set();
    const stations = new Set();

    data.forEach((r) => {
      // 1. Geography
      if (k.pkg && r[k.pkg]) packages.add(r[k.pkg]);
      if (k.stn && r[k.stn]) stations.add(r[k.stn]);

      // 2. Status & Closure (Smart Inference)
      const rawStatus = k.status ? String(r[k.status] || '').toLowerCase() : '';
      const hasClosedDate = k.cl && r[k.cl] && r[k.cl] !== '';
      const isClosed = rawStatus === 'closed' || rawStatus === 'completed' || rawStatus === 'approved' || (!k.status && hasClosedDate);
      
      if (isClosed) closed++;
      else open++;

      // 3. Results
      const result = k.res ? String(r[k.res] || '').toLowerCase() : '';
      if (result === 'approved') approved++;
      if (result === 'rejected') rejected++;

      // 4. SLA
      const sla = k.sla ? parseDate(r[k.sla]) : null;
      const clDate = k.cl ? parseDate(r[k.cl]) : null;
      if (sla) {
        const breached = (!isClosed && sla < today) || (clDate && clDate > sla);
        if (breached) slaBreach++;
      }
    });

    return {
      total: data.length,
      closed, open, approved, rejected,
      slaBreach,
      closureRate: data.length > 0 ? ((closed / data.length) * 100).toFixed(1) : '0.0',
      rejectionRate: data.length > 0 ? ((rejected / data.length) * 100).toFixed(1) : '0.0',
      packages: packages.size,
      stations: stations.size,
    };
  }, [data]);
}

const KPI = [
  {
    key: 'total',
    label: 'Total RFIs',
    icon: '📦',
    accent: 'blue',
    format: v => v.toLocaleString(),
    sub: s => `${s.packages} packages · ${s.stations} stations`,
  },
  {
    key: 'closureRate',
    label: 'Closure Rate',
    icon: '✅',
    accent: 'green',
    format: v => `${v}%`,
    sub: s => `${s.closed} of ${s.total} inspections closed`,
  },
  {
    key: 'approved',
    label: 'Approved',
    icon: '🛡️',
    accent: 'orange',
    format: v => v.toLocaleString(),
    sub: s => `${(100 - Number(s.rejectionRate)).toFixed(1)}% pass rate`,
  },
  {
    key: 'rejected',
    label: 'Rejected',
    icon: '❌',
    accent: 'red',
    format: v => v.toLocaleString(),
    sub: s => `${s.rejectionRate}% rejection rate`,
  },
  {
    key: 'slaBreach',
    label: 'SLA Breaches',
    icon: '🚨',
    accent: 'red',
    format: v => v.toLocaleString(),
    sub: s => `${s.open} still open`,
  },
];

export default function Overview({ data }) {
  const stats = useStats(data);

  // Health Rating
  const healthScore = Math.round(
    (Number(stats.closureRate) * 0.4) +
    ((100 - Number(stats.rejectionRate)) * 0.4) +
    (Math.max(0, 100 - (stats.slaBreach / Math.max(stats.total, 1)) * 100) * 0.2)
  );

  const healthColor =
    healthScore >= 80 ? 'var(--green)' :
    healthScore >= 55 ? 'var(--amber)' : 'var(--red)';

  const healthLabel =
    healthScore >= 80 ? 'Good' :
    healthScore >= 55 ? 'Moderate' : 'Critical';

  return (
    <div className="section-panel">
      {/* KPI Grid */}
      <div className="stats-row">
        {KPI.map(({ key, label, icon, accent, format, sub }) => (
          <div className="premium-stat-card" key={key}>
            <div className={`stat-icon ${accent}`}>{icon}</div>
            <div className="stat-val" style={key === 'slaBreach' && stats.slaBreach > 0 ? { color: 'var(--red)' } : {}}>
              {format(stats[key])}
            </div>
            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-2)', marginBottom: '4px' }}>
              {label}
            </div>
            <div className="stat-caption">{sub(stats)}</div>
          </div>
        ))}
      </div>

      {/* Health Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Score Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '32px', padding: '32px' }}>
          <div style={{
            width: '100px', minWidth: '100px', height: '100px',
            borderRadius: '50%',
            background: `conic-gradient(${healthColor} ${healthScore * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <div style={{
              width: '76px', height: '76px', borderRadius: '50%',
              background: 'var(--bg-surface)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '2px',
            }}>
              <span style={{ fontFamily: 'Outfit', fontSize: '22px', fontWeight: '900', color: healthColor }}>
                {healthScore}
              </span>
              <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-3)', textTransform: 'uppercase' }}>
                /100
              </span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '8px', letterSpacing: '1px' }}>
              System Health Score
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'Outfit', color: healthColor, marginBottom: '6px' }}>
              {healthLabel}
            </div>
            <div style={{ color: 'var(--text-2)', fontSize: '13px', lineHeight: '1.6' }}>
              Based on closure rate, rejection rate, and SLA compliance
              across all {stats.packages} packages.
            </div>
          </div>
        </div>

        {/* Quick Stats Breakdown */}
        <div className="card" style={{ padding: '32px' }}>
          <div className="section-header">
            <div className="section-icon cyan">📊</div>
            <h2 className="section-title">Breakdown</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'Closure Progress', val: stats.closureRate, color: 'var(--green)' },
              { label: 'Approval Rate',   val: (100 - Number(stats.rejectionRate)).toFixed(1), color: 'var(--blue)' },
              { label: 'SLA Compliance',  val: Math.max(0, 100 - (stats.slaBreach / Math.max(stats.total, 1) * 100)).toFixed(1), color: 'var(--amber)' },
            ].map(({ label, val, color }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-2)' }}>{label}</span>
                  <span style={{ fontWeight: '700', color }}>{val}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${val}%`, height: '100%', background: color, borderRadius: '10px',
                    transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
