import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { getCheckIns, type CheckInData, getRiskLevel } from "@/lib/burnout";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AlertTriangle, UserPlus, CheckCircle2 } from "lucide-react";

interface TrustedContact {
  name: string;
  emailOrPhone: string;
}

interface SafetyAlertProps {
  refreshKey: number;
}

function detectRiskCondition(checkIns: CheckInData[]): boolean {
  if (checkIns.length < 5) return false;
  const last5 = checkIns.slice(-5);
  const allHigh = last5.every((c) => getRiskLevel(c.burnoutScore) === "high");
  const allHighStress = last5.every((c) => c.workStress >= 4);
  return allHigh || allHighStress;
}

export function SafetyAlert({ refreshKey }: SafetyAlertProps) {
  const { user } = useAuth();
  const [triggered, setTriggered] = useState(false);
  const [contact, setContact] = useState<TrustedContact | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [name, setName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [notified, setNotified] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Load check-ins and contact in parallel
    Promise.all([
      getCheckIns(user.uid),
      getDoc(doc(db, "trusted_contacts", user.uid)),
    ]).then(([checkIns, contactSnap]) => {
      setTriggered(detectRiskCondition(checkIns));
      if (contactSnap.exists()) {
        setContact(contactSnap.data() as TrustedContact);
      }
    });
  }, [user, refreshKey]);

  if (!triggered || dismissed) return null;

  const handleSaveContact = async () => {
    if (!user || !name.trim() || !emailOrPhone.trim()) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "trusted_contacts", user.uid), {
        name: name.trim(),
        emailOrPhone: emailOrPhone.trim(),
      });
      setContact({ name: name.trim(), emailOrPhone: emailOrPhone.trim() });
      setShowSetup(false);
    } catch (e) {
      console.error("Failed to save trusted contact:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleNotify = () => {
    // Simulated notification
    setNotified(true);
  };

  if (notified) {
    return (
      <Card className="border-0 shadow-sm border-l-4 border-l-primary">
        <CardContent className="pt-6 pb-6 text-center space-y-2">
          <CheckCircle2 className="h-8 w-8 text-primary mx-auto" />
          <p className="font-semibold text-foreground">
            Message sent to {contact?.name}
          </p>
          <p className="text-sm text-muted-foreground">
            Your trusted contact has been notified (simulated).
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="mt-2"
          >
            Dismiss
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-sm border-l-4 border-l-destructive">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            High stress detected over multiple days
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Your recent entries show sustained high stress or burnout. Would you
            like to notify a trusted contact?
          </p>
          {contact ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleNotify}>
                Notify {contact.name}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDismissed(true)}
              >
                Not Now
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setShowSetup(true)}>
                <UserPlus className="h-4 w-4 mr-1" />
                Add Trusted Contact
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDismissed(true)}
              >
                Not Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showSetup} onOpenChange={setShowSetup}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Trusted Contact</AlertDialogTitle>
            <AlertDialogDescription>
              This person will be notified when you choose to send an alert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="contact-name">Name</Label>
              <Input
                id="contact-name"
                placeholder="e.g. Mom"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-info">Email or Phone</Label>
              <Input
                id="contact-info"
                placeholder="e.g. mom@email.com"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveContact}
              disabled={saving || !name.trim() || !emailOrPhone.trim()}
            >
              {saving ? "Saving…" : "Save Contact"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
