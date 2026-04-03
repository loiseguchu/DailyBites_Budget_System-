import { useState } from "react";
import { Coffee } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type User } from "@/lib/store";

interface Props {
  onLogin: (email: string, password: string) => Promise<User | null>;
}

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const user = await onLogin(email, password);
    if (!user) setError("Invalid email or password. Please try again.");
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-background px-4 bg-cover bg-center"
      style={{ backgroundImage: "url('/cafe_bg.png')" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-4">
            <Coffee className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-serif">Daily Bite Café</h1>
          <p className="text-muted-foreground mt-1">Budget Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-5 bg-background/80 dark:bg-background/90 backdrop-blur-md shadow-xl border border-border/50">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full">
            Sign In
          </Button>

          <div className="text-center text-xs text-muted-foreground space-y-1 pt-2">
            <p>Demo accounts:</p>
            <p><strong>Admin:</strong> manager@dailybite.co.ke / admin123</p>
            <p><strong>Admin 2:</strong> admin@dailybite.co.ke / admin123</p>
            <p><strong>Staff:</strong> james@dailybite.co.ke / staff123</p>
            <p><strong>Staff:</strong> mary@dailybite.co.ke / staff123</p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
