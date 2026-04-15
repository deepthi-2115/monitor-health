/**
 * Table.jsx
 * Renders a sortable, paginated data table with fuzzy key mapping.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';

const PAGE_SIZE = 15;

/** Returns a coloured badge for result / status values */
function StatusBadge({ value }) {
  if (!value) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const lower = value.toLowerCase();
  let cls = 'badge ';
  if (lower === 'approved' || lower === 'pass') cls += 'approved';
  else if (lower === 'rejected' || lower === 'fail') cls += 'rejected';
  else if (lower === 'open' || lower === 'pending') cls += 'open';
  else if (lower === 'closed' || lower === 'completed') cls += 'closed';
  else cls += 'pending';
  return <span className={cls}>{value}</span>;
}

export default function Table({ data }) {
  const [sortKey, setSortKey] = useState('rfi_id');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const wrapperRef = useRef(null);

  // Dynamic Column Mapping based on current dataset
  const colMap = useMemo(() => {
    if (!data.length) return {};
    const first = data[0];
    const find = (variants) => {
      return Object.keys(first).find(rk => 
        variants.some(v => rk.toLowerCase().replace(/[^a-z0-9]/g, '') === v.toLowerCase().replace(/[^a-z0-0]/g, ''))
      );
    };

    return [
      { key: find(['rfi_id', 'id', 'ref_no']), label: 'RFI ID' },
      { key: find(['package', 'pkg']), label: 'Package' },
      { key: find(['station', 'site', 'location']), label: 'Station' },
      { key: find(['subsystem_type', 'subsystem']), label: 'Subsystem' },
      { key: find(['activity_name', 'activity_type', 'activity']), label: 'Activity' },
      { key: find(['contractor_id', 'contractor', 'vendor']), label: 'Contractor' },
      { key: find(['raised_date', 'submitted_date', 'date']), label: 'Submitted' },
      { key: find(['sla_deadline', 'deadline']), label: 'SLA' },
      { key: find(['closed_date', 'date_closed']), label: 'Closed' },
      { key: find(['status', 'current_status']), label: 'Status' },
      { key: find(['result', 'outcome']), label: 'Result' },
    ].filter(c => c.key); // Only show columns that exist in the CSV
  }, [data]);

  useEffect(() => { setPage(1); }, [data]);

  const sorted = useMemo(() => {
    if (!sortKey || !data.length) return data;
    return [...data].sort((a, b) => {
      const valA = a[sortKey] ?? '';
      const valB = b[sortKey] ?? '';
      const cmp = String(valA).localeCompare(String(valB), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const saferPage = Math.min(page, totalPages);
  const pageData = sorted.slice((saferPage - 1) * PAGE_SIZE, saferPage * PAGE_SIZE);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const pageNumbers = [];
  for (let i = Math.max(1, saferPage - 2); i <= Math.min(totalPages, saferPage + 2); i++) {
    pageNumbers.push(i);
  }

  if (data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <div className="empty-text">No records match your filters</div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="table-scroll-container" ref={wrapperRef}>
        <table className="table-premium">
          <thead>
            <tr>
              {colMap.map((col) => (
                <th key={col.key} onClick={() => handleSort(col.key)}>
                  {col.label}
                  <span className={`sort-icon ${sortKey === col.key ? 'active' : ''}`}>
                    {sortKey === col.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, idx) => (
              <tr key={idx}>
                {colMap.map((col) => (
                  <td key={col.key}>
                    {col.label === 'Result' || col.label === 'Status' ? (
                      <StatusBadge value={row[col.key]} />
                    ) : (
                      row[col.key] || <span style={{ color: 'var(--text-3)' }}>—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <div className="pagination-info">
          Showing {(saferPage - 1) * PAGE_SIZE + 1}–{Math.min(saferPage * PAGE_SIZE, sorted.length)} of {sorted.length}
        </div>
        <div className="pagination-controls">
          <button className="page-btn" onClick={() => setPage(1)} disabled={saferPage === 1}>«</button>
          <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={saferPage === 1}>‹</button>
          {pageNumbers.map(n => (
            <button key={n} className={`page-btn ${n === saferPage ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
          ))}
          <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={saferPage === totalPages}>›</button>
          <button className="page-btn" onClick={() => setPage(totalPages)} disabled={saferPage === totalPages}>»</button>
        </div>
      </div>
    </div>
  );
}
