/**
 * Pure Attendance Calculator Engine
 * Implements exact calculation logic from student dashboard:
 * - Bunk mode: canBunk = Math.floor((100 * attended) / t - totalClasses)
 * - Attend mode: needAttend = Math.ceil((ratio * totalClasses - attended) / (1 - ratio))
 * - Cap total: 16 for ECA, 450 for Regular, 400 default
 * - Unreachable mode if needAttend > maxRemaining
 */

export function computeAttendanceResult({ category, totalClasses, attended, target }) {
  if (target === "" || target === null || target === undefined || !totalClasses) {
    return null;
  }
  const t = Number(target);
  if (isNaN(t) || t <= 0) return null;

  const current = totalClasses > 0 ? (attended / totalClasses) * 100 : 0;

  if (current >= t) {
    const canBunk = Math.floor((100 * attended) / t - totalClasses);
    return { mode: "bunk", count: canBunk >= 0 ? canBunk : 0 };
  }

  const ratio = t / 100;
  if (ratio >= 1) {
    return { mode: "unreachable", count: Infinity, maxRemaining: 0 };
  }

  const rawNeed = (ratio * totalClasses - attended) / (1 - ratio);
  const needAttend = Math.ceil(rawNeed);
  const catLower = String(category || "").toLowerCase();
  let capTotal;
  if (catLower.includes("eca")) {
    capTotal = 16;
  } else if (catLower.includes("regular")) {
    capTotal = 450;
  } else {
    capTotal = 400;
  }
  const maxRemaining = capTotal - totalClasses;

  if (!isFinite(rawNeed) || needAttend > maxRemaining) {
    return { mode: "unreachable", count: needAttend, maxRemaining };
  }

  return { mode: "attend", count: needAttend >= 0 ? needAttend : 0 };
}

// Backward-compatible wrapper
export function calculateAttendance(categoryRecord, target = 75) {
  if (!categoryRecord || typeof categoryRecord !== 'object') {
    return {
      isValid: false,
      totalClasses: 0,
      totalAttended: 0,
      currentPercentage: 0,
      targetPercentage: target,
      status: 'unavailable',
      canMiss: 0,
      neededToAttend: 0,
      message: 'Attendance data unavailable',
    };
  }

  const totalClasses = Number(categoryRecord['Total Classes'] ?? categoryRecord.totalClasses ?? 0);
  const presentees = Number(categoryRecord['Presentees'] ?? categoryRecord.presentees ?? 0);
  const extraClasses = Number(categoryRecord['Extra Classes'] ?? categoryRecord.extraClasses ?? 0);
  const attended = Number(categoryRecord['Total Attendance'] ?? (presentees + extraClasses));

  const result = computeAttendanceResult({
    category: 'regular',
    totalClasses,
    attended,
    target,
  });

  const currentPercentage = totalClasses > 0 ? parseFloat(((attended / totalClasses) * 100).toFixed(2)) : 0;

  return {
    isValid: true,
    totalClasses,
    totalAttended: attended,
    currentPercentage,
    targetPercentage: target,
    status: result?.mode === 'bunk' ? 'on_track' : 'below_target',
    canMiss: result?.mode === 'bunk' ? result.count : 0,
    neededToAttend: result?.mode === 'attend' ? result.count : result?.mode === 'unreachable' ? -1 : 0,
    message: result?.mode === 'bunk'
      ? `You can bunk ${result.count} classes`
      : result?.mode === 'unreachable'
      ? `Target not attainable`
      : `Need ${result?.count || 0} more classes`,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { computeAttendanceResult, calculateAttendance };
}
