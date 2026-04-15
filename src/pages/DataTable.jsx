import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Filters from '../components/Filters';
import Table from '../components/Table';

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

export default function DataTable({ data }) {
  const [filters, setFilters] = useState({
    package: '',
    station: '',
    subsystem_type: '',
    result: '',
    dateFrom: '',
    dateTo: '',
  });

  const filteredData = useMemo(() => applyFilters(data, filters), [data, filters]);

  // Export functions
  const handleExportCSV = () => {
    if (!filteredData.length) return alert('No data to export.');
    const csvStr = Papa.unparse(filteredData);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', 'filtered_rfi_records.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportPDF = () => {
    if (!filteredData.length) return alert('No data to export.');
    const doc = new jsPDF('landscape');
    doc.text('Metro Construction - Active RFI Report', 14, 15);
    
    const tableCols = ['RFI ID', 'Package', 'Station', 'Activity', 'Contractor', 'Status', 'Result'];
    const tableBody = filteredData.map(r => [
      r.rfi_id || 'N/A',
      r.package || 'N/A',
      r.station || 'N/A',
      r.activity_type || 'N/A',
      r.contractor || 'N/A',
      r.status || 'N/A',
      r.result || 'N/A'
    ]);

    doc.autoTable({
      head: [tableCols],
      body: tableBody,
      startY: 22,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save('filtered_rfi_records.pdf');
  };

  return (
    <div className="section-panel">
      <div className="mb-32 page-header" style={{ marginBottom: '32px' }}>
        <div className="page-header-left">
          <h2 style={{ fontSize: '28px', fontWeight: '800' }}>RFI Explorer</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Detailed record-level drill down with multi-layer filtering and sorting capabilities.
          </p>
        </div>
        
        {/* Export Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleExportCSV} 
            style={{
              padding: '10px 18px',
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
          >
             <span>📄</span> Download CSV
          </button>
          
          <button 
            onClick={handleExportPDF} 
            style={{
              padding: '10px 18px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
          >
             <span>📑</span> Download PDF
          </button>
        </div>
      </div>

      <div className="card p-24" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <span style={{ fontSize: '18px' }}>🔍</span>
          <h3 style={{ fontSize: '16px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Global Filter Center</h3>
        </div>
        <Filters data={data} filters={filters} setFilters={setFilters} />
      </div>

      <div className="card">
        <div className="section-header">
          <div className="section-icon cyan">📅</div>
          <h2 className="section-title">Inspection Records</h2>
          <span className="section-badge" style={{ padding: '6px 14px', borderRadius: '100px' }}>
            Showing {filteredData.length} entries
          </span>
        </div>
        
        <div className="mt-16">
          <Table data={filteredData} />
        </div>
      </div>
      
      <div className="mt-32" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
        <p>Use the horizontal scrollbar if columns are not fully visible. Records are sorted by ID by default.</p>
      </div>
    </div>
  );
}
