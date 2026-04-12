import {
  collection, addDoc, query, where, orderBy, getDocs, deleteDoc, doc,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface CheckInData {
  mood: number;
  sleepHours: number;
  workStress: number;
  timestamp: string;
  burnoutScore: number;
  user_id?: string;
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

export function getScoreExplanation(mood: number, sleepHours: number, workStress: number): string[] {
  const reasons: string[] = [];
  if (sleepHours < 5) reasons.push(`Sleep was only ${sleepHours}h (under 5h adds +2)`);
  else if (sleepHours <= 6) reasons.push(`Sleep was ${sleepHours}h (5–6h adds +1)`);
  else reasons.push(`Sleep was ${sleepHours}h (good, no penalty)`);

  if (mood <= 2) reasons.push(`Mood rated ${mood}/5 (low mood adds +2)`);
  else if (mood === 3) reasons.push(`Mood rated ${mood}/5 (neutral adds +1)`);
  else reasons.push(`Mood rated ${mood}/5 (good, no penalty)`);

  if (workStress >= 4) reasons.push(`Work stress rated ${workStress}/5 (high stress adds +2)`);
  else if (workStress === 3) reasons.push(`Work stress rated ${workStress}/5 (moderate adds +1)`);
  else reasons.push(`Work stress rated ${workStress}/5 (low, no penalty)`);

  return reasons;
}

export function getInsights(current: CheckInData, previous: CheckInData | null): string[] {
  if (!previous) return ["This is your first check-in. Keep tracking to see trends!"];
  const insights: string[] = [];
  if (current.sleepHours < previous.sleepHours)
    insights.push(`Your sleep decreased from ${previous.sleepHours}h to ${current.sleepHours}h. Try to get more rest tonight.`);
  if (current.workStress > previous.workStress)
    insights.push(`Stress increased from ${previous.workStress}/5 to ${current.workStress}/5. Consider taking breaks.`);
  if (current.mood > previous.mood)
    insights.push(`Your mood improved from ${previous.mood}/5 to ${current.mood}/5. Great progress!`);
  if (current.mood < previous.mood)
    insights.push(`Your mood dropped from ${previous.mood}/5 to ${current.mood}/5. Be gentle with yourself.`);
  if (current.sleepHours > previous.sleepHours)
    insights.push(`Sleep improved from ${previous.sleepHours}h to ${current.sleepHours}h. Nice job!`);
  if (current.workStress < previous.workStress)
    insights.push(`Stress decreased from ${previous.workStress}/5 to ${current.workStress}/5. Keep it up!`);
  if (insights.length === 0) insights.push("Your metrics are stable compared to last check-in.");
  return insights;
}

export function getRecommendedActions(level: RiskLevel): string[] {
  switch (level) {
    case 'low':
      return [
        "Keep up your current routine — it's working!",
        "Consider a short mindfulness session to maintain balance.",
        "Stay hydrated and take regular screen breaks.",
      ];
    case 'medium':
      return [
        "Take a 15-minute walk or stretch break soon.",
        "Try a breathing exercise: 4 seconds in, 7 hold, 8 out.",
        "Consider delegating or postponing non-urgent tasks.",
        "Aim for an earlier bedtime tonight.",
      ];
    case 'high':
      return [
        "Step away from work as soon as possible.",
        "Talk to someone you trust about how you're feeling.",
        "Prioritize sleep — cancel evening commitments if needed.",
        "Consider reaching out to a mental health professional.",
        "Do only essential tasks today. Everything else can wait.",
      ];
  }
}

export function getChatKeywordResponse(message: string): string | null {
  const lower = message.toLowerCase();
  if (/exhausted|tired|fatigue|drained/.test(lower))
    return "It sounds like your body is telling you to rest. Try to take a short nap, go to bed earlier tonight, or just sit quietly for 10 minutes. Rest isn't laziness — it's recovery.";
  if (/stress|pressure|tense|anxious/.test(lower))
    return "When stress builds up, your body holds tension. Try this: breathe in for 4 counts, hold for 4, breathe out for 6. Repeat 5 times. Even a few minutes of deep breathing can lower your cortisol levels.";
  if (/overwhelm|too much|can't cope|drowning/.test(lower))
    return "When everything feels like too much, try breaking it down. Pick just ONE small task you can finish in 5 minutes. Completing it can give you momentum. You don't have to solve everything at once.";
  if (/sad|unhappy|down|depressed|hopeless/.test(lower))
    return "I hear you. Feeling down is tough, but it's okay to not be okay. Consider talking to someone you trust. If these feelings persist, please reach out to a mental health professional — they can help.";
  if (/happy|great|good|amazing|wonderful/.test(lower))
    return "That's wonderful to hear! Take a moment to appreciate what's going well. Savoring positive moments helps build resilience for tougher times. Keep doing what's working for you!";
  return null;
}

// ── Firestore persistence ──

const COLLECTION = "checkins";

export async function saveCheckIn(data: CheckInData, userId: string): Promise<void> {
  try {
    await addDoc(collection(db, COLLECTION), {
      user_id: userId,
      mood: data.mood,
      sleep: data.sleepHours,
      stress: data.workStress,
      burnout_score: data.burnoutScore,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to save check-in to Firestore:", error);
    throw error;
  }
}

export async function getCheckIns(userId: string): Promise<CheckInData[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where("user_id", "==", userId),
      orderBy("created_at", "asc"),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data() as DocumentData;
      return {
        mood: data.mood,
        sleepHours: data.sleep,
        workStress: data.stress,
        timestamp: data.created_at,
        burnoutScore: data.burnout_score,
      } as CheckInData;
    });
  } catch (error) {
    console.error("Failed to fetch check-ins from Firestore:", error);
    return [];
  }
}

export async function clearCheckIns(userId: string): Promise<void> {
  try {
    const q = query(collection(db, COLLECTION), where("user_id", "==", userId));
    const snap = await getDocs(q);
    const promises = snap.docs.map((d) => deleteDoc(doc(db, COLLECTION, d.id)));
    await Promise.all(promises);
  } catch (error) {
    console.error("Failed to clear check-ins from Firestore:", error);
    throw error;
  }
}
