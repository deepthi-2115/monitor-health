import React from 'react';

// Helper: extract unique sorted values from a field
function unique(data, field) {
  return [...new Set(data.map((r) => r[field]).filter(Boolean))].sort();
}

export default function Filters({ data, filters, setFilters }) {
  const packages = unique(data, 'package');
  const stations = unique(data, 'station');
  const subsystems = unique(data, 'subsystem_type');
  const results = unique(data, 'result');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      package: '',
      station: '',
      subsystem_type: '',
      result: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  return (
    <div className="filters-grid">
      <div className="filter-group">
        <label className="filter-label">Package</label>
        <select
          name="package"
          className="filter-select"
          value={filters.package}
          onChange={handleChange}
        >
          <option value="">All Packages</option>
          {packages.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Station</label>
        <select
          name="station"
          className="filter-select"
          value={filters.station}
          onChange={handleChange}
        >
          <option value="">All Stations</option>
          {stations.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Subsystem</label>
        <select
          name="subsystem_type"
          className="filter-select"
          value={filters.subsystem_type}
          onChange={handleChange}
        >
          <option value="">All Subsystems</option>
          {subsystems.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Result</label>
        <select
          name="result"
          className="filter-select"
          value={filters.result}
          onChange={handleChange}
        >
          <option value="">All Results</option>
          {results.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Date From</label>
        <input
          type="date"
          name="dateFrom"
          className="filter-input"
          value={filters.dateFrom}
          onChange={handleChange}
        />
      </div>

      <div className="filter-group">
        <label className="filter-label">Date To</label>
        <input
          type="date"
          name="dateTo"
          className="filter-input"
          value={filters.dateTo}
          onChange={handleChange}
        />
      </div>

      <div className="filter-group" style={{ justifyContent: 'flex-end' }}>
        <button onClick={resetFilters} className="filter-reset-btn" style={{ width: '100%', height: '42px' }}>
          ✕ Clear All
        </button>
      </div>
    </div>
  );
}
