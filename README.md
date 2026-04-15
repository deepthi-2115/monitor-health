# Metro Construction Health Monitor Dashboard

A complete, single-page React application built for a hackathon. The dashboard ingests Request for Inspection (RFI) data via CSV and provides real-time analytics, filtering, charts, and rule-based alerts to monitor metro construction health.

## 🚀 Features
- **Data Ingestion**: Upload a `.csv` file via drag-and-drop or file picker. Parsed client-side using `PapaParse`.
- **Advanced Filtering**: Filter data dynamically by Package, Station, Subsystem, Result, and Date Range.
- **Interactive Data Table**: Sortable columns, pagination (15 items/page), and colored status badges.
- **Analytics Charts**: Powered by `Chart.js` (`react-chartjs-2`).
  - RFI Closure Rate by Package (Doughnut Chart)
  - SLA Breach Count by Station (Horizontal Bar Chart)
  - Approval vs Rejection Monthly Trend (Line Chart)
  - Contractor Performance (Stacked Bar Chart)
- **Rule Engine**: Evaluates business logic to generate real-time alerts.
  - **Rule 1 (CRITICAL)**: RFI open beyond SLA deadline.
  - **Rule 2 (WARNING)**: Same activity rejected 3+ times at the same station.
  - **Rule 3 (WARNING)**: Station exceeds a 30% rejection rate.
- **Insights**: Natural language processing on remarks for keyword frequencies and top defect lists.
- **Dynamic & Responsive UI**: Premium "dark mode" aesthetic, glassmorphism elements, CSS animations, and full mobile optimization (with scrollable tables, touch-friendly pagination, and mobile navigation tabs).

## 🛠️ Tech Stack
- **Framework**: `React` (Functional Components & Hooks)
- **Tooling**: `Vite` (Fast and lightweight)
- **Charting**: `Chart.js` & `react-chartjs-2`
- **Data Parsing**: `PapaParse`
- **Styling**: `Vanilla CSS` with custom variables and flex/grid layouts.

## 📦 Project Structure
```
src/
├── App.jsx                  # Main wrapper, handles CSV upload & PapaParse logic
├── index.css                # Global and responsive CSS styles (Design system)
├── main.jsx                 # Entry point
├── components/
│   ├── Alerts.jsx           # Renders Critical / Warning / Info alert cards
│   ├── Charts.jsx           # Grid of 4 analytical charts (Chart.js)
│   ├── Dashboard.jsx        # Orchestrator integrating stats, filters, tables & alerts
│   ├── Filters.jsx          # Dropdown and date-range inputs
│   └── Table.jsx            # Horizontally scrollable, paginated & sortable data table
└── utils/
    └── ruleEngine.js        # Logic for evaluating RFI breach and failure rules
```

## ⚙️ Installation & Setup

1. **Clone or Download** this directory.
2. Ensure you have [Node.js](https://nodejs.org/) installed.
3. Open a terminal in the project root (`e:\Railway` or wherever it relies).

Run the following commands:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

4. Open `http://localhost:5173` in your browser.
5. Upload the provided `hackathon_rfi_dataset.csv` (located in the `public/` directory) to view the dashboard in action.

## 📝 Key Logic & Algorithms
- **SLA Breach**: Calculated by checking if the `closed_date` > `sla_deadline` OR if the RFI is still `Open` past the `sla_deadline`.
- **Closure Rate**: `(Closed RFIs / Total RFIs) * 100`
- **Rejection Rate**: `(Rejected RFIs / Total RFIs) * 100`
- **Keyword Analysis**: Extracts stop-word-filtered keyword frequencies from the "remarks" or "defect_details" column using regex.
