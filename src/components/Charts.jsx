import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];

const TIP = {
  backgroundColor: 'rgba(5, 8, 16, 0.95)',
  padding: 12,
  cornerRadius: 8,
  bodyFont: { family: 'Inter', size: 12 },
  titleFont: { family: 'Inter', size: 13, weight: '600' },
  borderColor: 'rgba(59,130,246,0.25)',
  borderWidth: 1,
};

const LEG = {
  position: 'bottom',
  labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, padding: 14, usePointStyle: true },
};

function parseDate(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/* Wrapper with a FIXED height — the only reliable way for Chart.js */
function ChartCard({ title, children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.035)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 18,
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      <div style={{
        fontSize: 12,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: '#64748b',
      }}>{title}</div>
      {/* explicit height so Chart.js always has a definite dimension */}
      <div style={{ position: 'relative', height: 300 }}>
        {children}
      </div>
    </div>
  );
}

export default function Charts({ data }) {

  // ── 1. Closure Rate by Package (Doughnut) ──────────────
  const closureData = useMemo(() => {
    const map = {};
    data.forEach(r => {
      const p = r.package || 'Other';
      map[p] = map[p] || { t: 0, c: 0 };
      map[p].t++;
      if ((r.status || '').toLowerCase() === 'closed') map[p].c++;
    });
    const labels = Object.keys(map);
    return {
      labels,
      datasets: [{
        data: labels.map(p => Number(((map[p].c / map[p].t) * 100).toFixed(1))),
        backgroundColor: COLORS.slice(0, labels.length),
        borderWidth: 0,
        hoverOffset: 10,
      }]
    };
  }, [data]);

  // ── 2. SLA Breaches by Station (Horizontal Bar) ─────────
  const slaData = useMemo(() => {
    const today = new Date();
    const map = {};
    data.forEach(r => {
      const station = r.station || 'Unknown';
      const sla = parseDate(r.sla_deadline);
      const closed = parseDate(r.closed_date);
      const status = (r.status || '').toLowerCase();
      const breached = (status !== 'closed' && sla && sla < today)
        || (closed && sla && closed > sla);
      if (breached) map[station] = (map[station] || 0) + 1;
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return {
      labels: sorted.map(s => s[0]),
      datasets: [{
        label: 'Breaches',
        data: sorted.map(s => s[1]),
        backgroundColor: sorted.map((_, i) => `rgba(239,68,68,${0.9 - i * 0.08})`),
        borderRadius: 5,
        barThickness: 20,
      }]
    };
  }, [data]);

  // ── 3. Monthly Approval vs Rejection Trend (Line) ───────
  const trendData = useMemo(() => {
    const map = {};
    data.forEach(r => {
      const d = parseDate(r.submitted_date);
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = map[key] || { app: 0, rej: 0 };
      const res = (r.result || '').toLowerCase();
      if (res === 'approved') map[key].app++;
      else if (res === 'rejected') map[key].rej++;
    });
    const keys = Object.keys(map).sort();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return {
      labels: keys.map(k => {
        const [y, m] = k.split('-');
        return `${months[parseInt(m) - 1]} ${y}`;
      }),
      datasets: [
        {
          label: 'Approved',
          data: keys.map(k => map[k].app),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.12)',
          fill: true, tension: 0.4,
          pointRadius: 5, pointBackgroundColor: '#10b981',
          pointBorderColor: '#0a0f1e', pointBorderWidth: 2, pointHoverRadius: 8,
        },
        {
          label: 'Rejected',
          data: keys.map(k => map[k].rej),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.08)',
          fill: true, tension: 0.4,
          pointRadius: 5, pointBackgroundColor: '#ef4444',
          pointBorderColor: '#0a0f1e', pointBorderWidth: 2, pointHoverRadius: 8,
        },
      ]
    };
  }, [data]);

  // ── 4. Contractor Performance (Stacked Bar) ─────────────
  const contractorData = useMemo(() => {
    const map = {};
    data.forEach(r => {
      const c = r.contractor || 'Unknown';
      map[c] = map[c] || { a: 0, r: 0 };
      const res = (r.result || '').toLowerCase();
      if (res === 'approved') map[c].a++;
      else if (res === 'rejected') map[c].r++;
    });
    const sorted = Object.entries(map).sort((a, b) => (b[1].a + b[1].r) - (a[1].a + a[1].r)).slice(0, 8);
    return {
      labels: sorted.map(s => s[0]),
      datasets: [
        {
          label: 'Approved', data: sorted.map(s => s[1].a),
          backgroundColor: 'rgba(16,185,129,0.75)', borderRadius: 4, barThickness: 26,
        },
        {
          label: 'Rejected', data: sorted.map(s => s[1].r),
          backgroundColor: 'rgba(239,68,68,0.75)', borderRadius: 4, barThickness: 26,
        },
      ]
    };
  }, [data]);

  const axisStyle = {
    x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { display: false } },
    y: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true },
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>

      <ChartCard title="📦 Closure Rate by Package (%)">
        <Doughnut data={closureData} options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: { legend: LEG, tooltip: { ...TIP, callbacks: { label: c => ` ${c.label}: ${c.parsed}%` } } },
        }} />
      </ChartCard>

      <ChartCard title="🚨 SLA Breaches by Station">
        <Bar data={slaData} options={{
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: { legend: { display: false }, tooltip: TIP },
          scales: axisStyle,
        }} />
      </ChartCard>

      <ChartCard title="📈 Monthly Approval vs Rejection Trends">
        <Line data={trendData} options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: LEG, tooltip: TIP },
          scales: {
            x: { ...axisStyle.x, ticks: { ...axisStyle.x.ticks, maxRotation: 45 } },
            y: axisStyle.y,
          },
        }} />
      </ChartCard>

      <ChartCard title="🏗️ Contractor Performance">
        <Bar data={contractorData} options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: LEG, tooltip: TIP },
          scales: {
            x: { ...axisStyle.x, stacked: true },
            y: { ...axisStyle.y, stacked: true },
          },
        }} />
      </ChartCard>

    </div>
  );
}
