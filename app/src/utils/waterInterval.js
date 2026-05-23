export function parseWaterInterval(waterText) {
  if (!waterText) return 14;
  const text = waterText.toLowerCase();

  if (text.includes('moist') || text.includes('daily') || text.match(/every\s+day/)) return 3;

  const weekRange = text.match(/(\d+)\s*[-–]\s*(\d+)\s*week/);
  if (weekRange) {
    const avg = (parseInt(weekRange[1]) + parseInt(weekRange[2])) / 2;
    return Math.round(avg * 7);
  }

  const singleWeek = text.match(/(\d+)\s*week/);
  if (singleWeek) return parseInt(singleWeek[1]) * 7;

  if (text.includes('once a week') || text.includes('every week') || text.includes('weekly')) return 7;

  const dayRange = text.match(/(\d+)\s*[-–]\s*(\d+)\s*day/);
  if (dayRange) return Math.round((parseInt(dayRange[1]) + parseInt(dayRange[2])) / 2);

  const singleDay = text.match(/(\d+)\s*day/);
  if (singleDay) return parseInt(singleDay[1]);

  return 14;
}

export function calcDropsFilled(lastWatered, waterIntervalDays) {
  if (!lastWatered || !waterIntervalDays) return 5;
  const daysSince = (Date.now() - new Date(lastWatered).getTime()) / (1000 * 60 * 60 * 24);
  const fillRatio = Math.max(0, 1 - daysSince / waterIntervalDays);
  return Math.round(fillRatio * 5);
}
