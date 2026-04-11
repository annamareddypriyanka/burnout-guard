export interface CheckInData {
  mood: number;
  sleepHours: number;
  workStress: number;
  timestamp: string;
  burnoutScore: number;
}

export type RiskLevel = 'low' | 'medium' | 'high';

export function calculateBurnoutScore(mood: number, sleepHours: number, workStress: number): number {
  let score = 0;
  if (sleepHours < 5) score += 2;
  else if (sleepHours <= 6) score += 1;
  if (mood <= 2) score += 2;
  else if (mood === 3) score += 1;
  if (workStress >= 4) score += 2;
  else if (workStress === 3) score += 1;
  return score;
}

export function getRiskLevel(score: number): RiskLevel {
  if (score <= 2) return 'low';
  if (score <= 4) return 'medium';
  return 'high';
}

export function getRiskLabel(level: RiskLevel): string {
  return level === 'low' ? 'Low Risk' : level === 'medium' ? 'Medium Risk' : 'High Risk';
}

const STORAGE_KEY = 'burnout-guard-checkins';

export function saveCheckIn(data: CheckInData): void {
  const existing = getCheckIns();
  existing.push(data);
  // Keep only last 30 entries for privacy
  const trimmed = existing.slice(-30);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function getCheckIns(): CheckInData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearCheckIns(): void {
  localStorage.removeItem(STORAGE_KEY);
}
