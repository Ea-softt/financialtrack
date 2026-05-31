/**
 * Shared date utilities for ISO Week calculations
 */

export function getISOWeekInfo(dateStr: string): { weekNumber: number; year: number } {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { weekNumber: 1, year: new Date().getFullYear() };
  }
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { weekNumber: weekNo, year: d.getUTCFullYear() };
}

export function getISOWeekRange(weekNo: number, year: number): { startDate: string; endDate: string } {
  const jan4 = new Date(year, 0, 4);
  const dayNum = jan4.getDay() || 7;
  const thurs1 = new Date(jan4);
  thurs1.setDate(jan4.getDate() + 4 - dayNum);
  
  const targetThurs = new Date(thurs1);
  targetThurs.setDate(thurs1.getDate() + (weekNo - 1) * 7);
  
  const mon = new Date(targetThurs);
  mon.setDate(targetThurs.getDate() - 3);
  
  const sun = new Date(targetThurs);
  sun.setDate(targetThurs.getDate() + 3);
  
  return {
    startDate: mon.toISOString().split("T")[0],
    endDate: sun.toISOString().split("T")[0]
  };
}