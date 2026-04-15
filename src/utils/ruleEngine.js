/**
 * ruleEngine.js
 * Evaluates business rules on the RFI dataset and returns alert objects.
 *
 * Rules:
 *  Rule 1 - RFI open beyond SLA deadline                 → CRITICAL
 *  Rule 2 - Same activity rejected 3+ times at a station → WARNING
 *  Rule 3 - Station with >30% rejection rate             → WARNING
 */

const today = new Date();

/**
 * Parse a date string into a Date object.
 * Returns null for invalid / empty strings.
 */
function parseDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/** 
 * RULE 1: RFI open beyond SLA deadline
 * Conditions:
 *   - Status is NOT "Closed" (still open)
 *   - sla_deadline exists and < today
 *   OR closed_date > sla_deadline
 */
function checkRule1(data) {
  const affected = data.filter((row) => {
    const sla = parseDate(row.sla_deadline);
    const closed = parseDate(row.closed_date);
    const status = (row.status || '').toLowerCase();

    if (!sla) return false;

    // Still open after deadline
    if (status !== 'closed' && sla < today) return true;

    // Closed late
    if (closed && closed > sla) return true;

    return false;
  });

  if (affected.length === 0) return null;

  return {
    id: 'rule-1',
    severity: 'CRITICAL',
    rule: 'Rule 1',
    description: `${affected.length} RFI(s) breached SLA deadline (still open or closed late).`,
    affectedIds: affected.map((r) => r.rfi_id || r.id || 'N/A').slice(0, 10),
    totalAffected: affected.length,
    action:
      'Immediately escalate to project manager. Assign additional resources and set up a daily review until all SLA-breached RFIs are closed.',
  };
}

/**
 * RULE 2: Same activity rejected 3+ times at same station
 * Groups by (station, activity_type) and counts rows with result = "Rejected"
 */
function checkRule2(data) {
  const groups = {};

  data.forEach((row) => {
    const station = row.station || 'Unknown';
    const activity = row.activity_type || row.subsystem_type || 'Unknown';
    const result = (row.result || '').toLowerCase();
    if (result !== 'rejected') return;
    const key = `${station}||${activity}`;
    groups[key] = groups[key] || { station, activity, count: 0, ids: [] };
    groups[key].count += 1;
    groups[key].ids.push(row.rfi_id || row.id || 'N/A');
  });

  const triggers = Object.values(groups).filter((g) => g.count >= 3);

  if (triggers.length === 0) return null;

  return {
    id: 'rule-2',
    severity: 'WARNING',
    rule: 'Rule 2',
    description: `${triggers.length} activity–station combination(s) have 3+ rejections: ${triggers
      .map((t) => `${t.activity} @ ${t.station} (${t.count}×)`)
      .slice(0, 3)
      .join('; ')}.`,
    affectedIds: triggers.flatMap((t) => t.ids).slice(0, 10),
    totalAffected: triggers.flatMap((t) => t.ids).length,
    action:
      'Conduct root-cause analysis for repeatedly rejected activities. Arrange pre-inspection meetings with contractor before resubmission.',
  };
}

/**
 * RULE 3: Station with >30% rejection rate
 * Rejection rate = (rejected RFIs at station) / (total RFIs at station)
 */
function checkRule3(data) {
  const stationMap = {};

  data.forEach((row) => {
    const station = row.station || 'Unknown';
    const result = (row.result || '').toLowerCase();
    stationMap[station] = stationMap[station] || { total: 0, rejected: 0, ids: [] };
    stationMap[station].total += 1;
    if (result === 'rejected') {
      stationMap[station].rejected += 1;
      stationMap[station].ids.push(row.rfi_id || row.id || 'N/A');
    }
  });

  const overThreshold = Object.entries(stationMap)
    .filter(([, v]) => v.total > 0 && v.rejected / v.total > 0.3)
    .map(([station, v]) => ({
      station,
      rate: ((v.rejected / v.total) * 100).toFixed(1),
      ids: v.ids,
    }));

  if (overThreshold.length === 0) return null;

  return {
    id: 'rule-3',
    severity: 'WARNING',
    rule: 'Rule 3',
    description: `${overThreshold.length} station(s) exceed 30% rejection rate: ${overThreshold
      .map((s) => `${s.station} (${s.rate}%)`)
      .slice(0, 5)
      .join(', ')}.`,
    affectedIds: overThreshold.flatMap((s) => s.ids).slice(0, 10),
    totalAffected: overThreshold.flatMap((s) => s.ids).length,
    action:
      'Review quality control processes at high-rejection stations. Consider additional inspector training or contractor performance reviews.',
  };
}

/**
 * Main entry: run all rules and return non-null alerts.
 */
export function runRuleEngine(data) {
  if (!data || data.length === 0) return [];
  const results = [checkRule1(data), checkRule2(data), checkRule3(data)];
  return results.filter(Boolean);
}
