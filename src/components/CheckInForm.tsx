import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculateBurnoutScore, saveCheckIn, getRiskLevel, getRiskLabel,
  getScoreExplanation, getInsights, getRecommendedActions, getCheckIns,
  type CheckInData,
} from "@/lib/burnout";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, Moon, Brain, Briefcase, Info, Lightbulb, AlertTriangle, Loader2 } from "lucide-react";

interface CheckInFormProps {
  onCheckIn: () => void;
}

const moodLabels = ["", "😞 Very Low", "😔 Low", "😐 Neutral", "🙂 Good", "😊 Great"];
const stressLabels = ["", "😌 Minimal", "🙂 Low", "😐 Moderate", "😰 High", "🔥 Very High"];

export function CheckInForm({ onCheckIn }: CheckInFormProps) {
  const { user } = useAuth();
  const [mood, setMood] = useState(3);
  const [sleepHours, setSleepHours] = useState("7");
  const [workStress, setWorkStress] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    level: string;
    explanations: string[];
    insights: string[];
    actions: string[];
  } | null>(null);

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    const sleep = parseFloat(sleepHours) || 0;
    const score = calculateBurnoutScore(mood, sleep, workStress);
    const level = getRiskLevel(score);
    const explanations = getScoreExplanation(mood, sleep, workStress);
    const actions = getRecommendedActions(level);

    const currentCheckIn: CheckInData = {
      mood,
      sleepHours: sleep,
      workStress,
      timestamp: new Date().toISOString(),
      burnoutScore: score,
    };

    const previousCheckIns = await getCheckIns(user.uid);
    const previous = previousCheckIns.length > 0 ? previousCheckIns[previousCheckIns.length - 1] : null;
    const insights = getInsights(currentCheckIn, previous);

    await saveCheckIn(currentCheckIn, user.uid);
    setResult({ score, level, explanations, insights, actions });
    setSubmitting(false);
    onCheckIn();
  };

  const resetForm = () => {
    setMood(3);
    setSleepHours("7");
    setWorkStress(3);
    setResult(null);
  };

  if (result) {
    const riskLevel = result.level as 'low' | 'medium' | 'high';
    const colorClass = riskLevel === 'low' ? 'risk-low' : riskLevel === 'medium' ? 'risk-medium' : 'risk-high';
    const bgClass = riskLevel === 'low' ? 'bg-risk-low/10' : riskLevel === 'medium' ? 'bg-risk-medium/10' : 'bg-risk-high/10';

    return (
      <div className="space-y-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${bgClass}`}>
              <span className={`text-3xl font-bold ${colorClass}`}>{result.score}</span>
            </div>
            <div>
              <p className={`text-lg font-semibold ${colorClass}`}>{getRiskLabel(riskLevel)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" /> Why this score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {result.explanations.map((e, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                  {e}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-muted-foreground" /> Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {result.insights.map((ins, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                  {ins}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" /> Recommended Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {result.actions.map((a, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Button onClick={resetForm} variant="outline" className="w-full">
          New Check-in
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          Daily Check-in
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Brain className="h-4 w-4 text-muted-foreground" />
            Mood
            <span className="ml-auto text-muted-foreground font-normal">{moodLabels[mood]}</span>
          </Label>
          <Slider value={[mood]} onValueChange={([v]) => setMood(v)} min={1} max={5} step={1} className="py-1" />
        </div>

        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Moon className="h-4 w-4 text-muted-foreground" />
            Sleep Hours
          </Label>
          <Input
            type="number" min={0} max={24} step={0.5}
            value={sleepHours} onChange={(e) => setSleepHours(e.target.value)}
            className="max-w-[120px]"
          />
        </div>

        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            Work Stress
            <span className="ml-auto text-muted-foreground font-normal">{stressLabels[workStress]}</span>
          </Label>
          <Slider value={[workStress]} onValueChange={([v]) => setWorkStress(v)} min={1} max={5} step={1} className="py-1" />
        </div>

        <Button onClick={handleSubmit} className="w-full" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Check-in"}
        </Button>
      </CardContent>
    </Card>
  );
}
