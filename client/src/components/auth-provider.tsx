import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@shared/schema";
import { useUsers, useCreateUser } from "@/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BrainCircuit } from "lucide-react";

interface AuthContextType {
  user: User | null;
  setUser: (user: User) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  isLoading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: users, isLoading } = useUsers();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const createUserMutation = useCreateUser();
  
  const [newUsername, setNewUsername] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");

  useEffect(() => {
    if (users && users.length > 0 && !currentUser) {
      setCurrentUser(users[0]);
    }
  }, [users, currentUser]);

  const handleCreateInitialUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newDisplayName) return;
    try {
      const user = await createUserMutation.mutateAsync({
        username: newUsername,
        displayName: newDisplayName,
      });
      setCurrentUser(user);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If there are absolutely no users in the DB, show a setup screen
  if (!users?.length && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="z-10"
        >
          <Card className="w-full max-w-md p-8 glass-card border-white/10">
            <div className="flex flex-col items-center mb-8">
              <div className="h-16 w-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4">
                <BrainCircuit className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-display font-bold text-foreground">Welcome to Aether</h1>
              <p className="text-muted-foreground text-center mt-2">Let's set up your profile to start renting and creating AI models.</p>
            </div>

            <form onSubmit={handleCreateInitialUser} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Username</label>
                <Input 
                  value={newUsername} 
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. ai_explorer"
                  className="bg-background/50 border-white/10 focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Display Name</label>
                <Input 
                  value={newDisplayName} 
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="bg-background/50 border-white/10 focus:border-primary transition-colors"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-orange-500 hover:opacity-90 text-white border-0 py-6 mt-4 shadow-lg shadow-primary/25"
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? "Creating..." : "Enter Marketplace"}
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user: currentUser, setUser: setCurrentUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
