import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Lock, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/authService";

interface SignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const SignupModal = ({ open, onOpenChange, onSuccess }: SignupModalProps) => {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("production");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authService.register(nom, email, password, role);
      
      if (response.success) {
        toast({
          title: "Inscription réussie",
          description: response.message,
        });
        
        // Reset form
        setNom("");
        setEmail("");
        setPassword("");
        setRole("production");
        
        onOpenChange(false);
        onSuccess();
      } else {
        toast({
          title: "Erreur d'inscription",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-semibold">Inscription</DialogTitle>
          <p className="text-center text-muted-foreground text-sm">
            Créez votre compte pour accéder à l'application
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-nom" className="text-sm font-medium">
              Nom d'utilisateur
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="signup-nom"
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Votre nom d'utilisateur"
                className="pl-10 h-11"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email" className="text-sm font-medium">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="pl-10 h-11"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-password" className="text-sm font-medium">
              Mot de passe
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                className="pl-10 h-11"
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-role" className="text-sm font-medium">
              Rôle
            </Label>
            <div className="relative">
              <UserCog className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="pl-10 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 mt-6" 
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                Inscription...
              </div>
            ) : (
              "S'inscrire"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SignupModal;