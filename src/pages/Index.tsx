import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckInForm } from "@/components/CheckInForm";
import { Dashboard } from "@/components/Dashboard";
import { AiChat } from "@/components/AiChat";
import { SafetyAlert } from "@/components/SafetyAlert";
import { useAuth } from "@/contexts/AuthContext";
import { LoginScreen } from "@/components/LoginScreen";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ShieldCheck, ClipboardCheck, BarChart3, MessageCircle, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { user, loading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold tracking-tight">Burnout Guard</h1>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8"
            onClick={() => signOut(auth)}
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <SafetyAlert refreshKey={refreshKey} />
        <Tabs defaultValue="checkin" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="checkin" className="gap-1.5 text-xs sm:text-sm">
              <ClipboardCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Check-in</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-1.5 text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1.5 text-xs sm:text-sm">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checkin">
            <CheckInForm onCheckIn={() => setRefreshKey((k) => k + 1)} />
          </TabsContent>
          <TabsContent value="dashboard">
            <Dashboard refreshKey={refreshKey} />
          </TabsContent>
          <TabsContent value="chat">
            <AiChat />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="text-center py-4 text-xs text-muted-foreground">
        Signed in as {user.email}
      </footer>
    </div>
  );
};

export default Index;
