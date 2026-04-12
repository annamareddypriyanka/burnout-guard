import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2 } from "lucide-react";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (mode: "login" | "signup") => {
    setError("");
    setIsLoading(true);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (code === "auth/email-already-in-use") {
        setError("Email already in use. Try logging in.");
      } else if (code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else {
        setError(err?.message || "Something went wrong.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm border-0 shadow-sm">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-xl font-semibold">Burnout Guard</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in to track your well-being</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => handleAuth("login")}
              disabled={isLoading || !email || !password}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log In"}
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => handleAuth("signup")}
              disabled={isLoading || !email || !password}
            >
              Sign Up
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
