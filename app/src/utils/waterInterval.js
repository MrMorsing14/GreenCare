export function parseWaterInterval(waterText) {
  
  if (!waterText) return 14;

  const text = waterText.toLowerCase();

  // "moist", "daily", "every day", water every 3 days
  if (text.includes('moist') || text.includes('daily') || text.match(/every\s+day/)) return 3;

  // Captures the two numbers, averages them, converts to days (×7)
  const weekRange = text.match(/(\d+)\s*[-–]\s*(\d+)\s*week/);
  if (weekRange) {
    const avg = (parseInt(weekRange[1]) + parseInt(weekRange[2])) / 2;
    return Math.round(avg * 7);
  }

  // Single week number: matches "every 2 weeks", "every 3 weeks", etc.
  const singleWeek = text.match(/(\d+)\s*week/);
  if (singleWeek) return parseInt(singleWeek[1]) * 7;

  // Plain "once a week" / "every week" / "weekly" phrases with no number → 7 days
  if (text.includes('once a week') || text.includes('every week') || text.includes('weekly')) return 7;

  // Day range (same as week range): matches "every 2-3 days", average and convert to days
  const dayRange = text.match(/(\d+)\s*[-–]\s*(\d+)\s*day/);
  if (dayRange) return Math.round((parseInt(dayRange[1]) + parseInt(dayRange[2])) / 2);

  // Single day number: matches "every 10 days", "every 5 days", etc.
  const singleDay = text.match(/(\d+)\s*day/);
  if (singleDay) return parseInt(singleDay[1]);

  // Nothing matched — default to 14 days (2 weeks)
  return 14;
}

// Calculates how many of the 5 drops should be filled based on last watered date and water interval
export function calcDropsFilled(lastWatered, waterIntervalDays) {
  // If we have no data, show a full meter (assume the plant is fine)
  if (!lastWatered || !waterIntervalDays) return 5;

  // How many days have passed since the last watering
  const daysSince = (Date.now() - new Date(lastWatered).getTime()) / (1000 * 60 * 60 * 24);

  // fillRatio goes from 1.0 (just watered) down to 0.0 (overdue)
  // Math.max(0, ...) clamps it so it never goes negative
  const fillRatio = Math.max(0, 1 - daysSince / waterIntervalDays);

  // Scale to 0-5 drops and round to the nearest whole drop
  return Math.round(fillRatio * 5);
}
