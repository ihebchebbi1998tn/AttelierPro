import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Eye, EyeOff } from "lucide-react";

interface RHPasswordProtectionProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export const RHPasswordProtection = ({ isOpen, onSuccess, onCancel }: RHPasswordProtectionProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === "rh2025") {
      // Store RH access permission in sessionStorage (valid until browser session ends)
      sessionStorage.setItem("rh_access", "granted");
      onSuccess();
      setPassword("");
      setError("");
    } else {
      setError("Mot de passe incorrect");
      setPassword("");
    }
  };

  const handleCancel = () => {
    setPassword("");
    setError("");
    onCancel();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            <Lock className="h-6 w-6 text-primary" />
            Accès RH Protégé
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center text-muted-foreground text-sm">
            Veuillez entrer le mot de passe pour accéder à la section RH
          </div>
          
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe RH"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10 text-center"
              autoFocus
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!password.trim()}
            >
              Accéder
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};