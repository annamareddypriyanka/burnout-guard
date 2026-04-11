import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateBurnoutScore, saveCheckIn, getRiskLevel, getRiskLabel } from "@/lib/burnout";
import { CheckCircle2, Moon, Brain, Briefcase } from "lucide-react";

interface CheckInFormProps {
  onCheckIn: () => void;
}

const moodLabels = ["", "😞 Very Low", "😔 Low", "😐 Neutral", "🙂 Good", "😊 Great"];
const stressLabels = ["", "😌 Minimal", "🙂 Low", "😐 Moderate", "😰 High", "🔥 Very High"];

export function CheckInForm({ onCheckIn }: CheckInFormProps) {
  const [mood, setMood] = useState(3);
  const [sleepHours, setSleepHours] = useState("7");
  const [workStress, setWorkStress] = useState(3);
  const [result, setResult] = useState<{ score: number; level: string } | null>(null);

  const handleSubmit = () => {
    const sleep = parseFloat(sleepHours) || 0;
    const score = calculateBurnoutScore(mood, sleep, workStress);
    const level = getRiskLevel(score);

    saveCheckIn({
      mood,
      sleepHours: sleep,
      workStress,
      timestamp: new Date().toISOString(),
      burnoutScore: score,
    });

    setResult({ score, level });
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
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${bgClass}`}>
            <span className={`text-3xl font-bold ${colorClass}`}>{result.score}</span>
          </div>
          <div>
            <p className={`text-lg font-semibold ${colorClass}`}>{getRiskLabel(riskLevel)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {riskLevel === 'low' && "You're doing well! Keep taking care of yourself."}
              {riskLevel === 'medium' && "Consider taking a break and prioritizing rest."}
              {riskLevel === 'high' && "Your burnout risk is elevated. Please take care of yourself."}
            </p>
          </div>
          <Button onClick={resetForm} variant="outline" className="mt-4">
            New Check-in
          </Button>
        </CardContent>
      </Card>
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
        {/* Mood */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Brain className="h-4 w-4 text-muted-foreground" />
            Mood
            <span className="ml-auto text-muted-foreground font-normal">{moodLabels[mood]}</span>
          </Label>
          <Slider
            value={[mood]}
            onValueChange={([v]) => setMood(v)}
            min={1}
            max={5}
            step={1}
            className="py-1"
          />
        </div>

        {/* Sleep */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Moon className="h-4 w-4 text-muted-foreground" />
            Sleep Hours
          </Label>
          <Input
            type="number"
            min={0}
            max={24}
            step={0.5}
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
            className="max-w-[120px]"
          />
        </div>

        {/* Work Stress */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            Work Stress
            <span className="ml-auto text-muted-foreground font-normal">{stressLabels[workStress]}</span>
          </Label>
          <Slider
            value={[workStress]}
            onValueChange={([v]) => setWorkStress(v)}
            min={1}
            max={5}
            step={1}
            className="py-1"
          />
        </div>

        <Button onClick={handleSubmit} className="w-full">
          Submit Check-in
        </Button>
      </CardContent>
    </Card>
  );
}
