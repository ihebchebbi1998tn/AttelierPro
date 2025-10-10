import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package2, Lock, User, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/authService";
import SignupModal from "@/components/SignupModal";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    // Check if signup mode is requested via URL parameter
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setShowSignupModal(true);
      // Clear the URL parameter after opening modal
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authService.login(username, password);
      
      if (response.success && response.user) {
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${response.user.nom}`,
        });
        
        navigate("/dashboard");
      } else {
        toast({
          title: "Erreur de connexion",
          description: response.message || "Identifiants incorrects",
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

  const handleSignupSuccess = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg">
            <Package2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Stock & Production</h1>
          <p className="text-muted-foreground text-sm">
            Système de gestion professionnel
          </p>
        </div>

        {/* Login Card */}
        <Card className="modern-card shadow-xl border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center font-semibold">Connexion</CardTitle>
            <p className="text-center text-muted-foreground text-sm">
              Saisissez vos identifiants pour accéder à l'application
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Nom d'utilisateur
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin, production ou stock"
                    className="pl-10 h-11 border-border/50 focus:border-primary transition-colors"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Votre mot de passe"
                    className="pl-10 h-11 border-border/50 focus:border-primary transition-colors"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-primary hover:bg-primary-dark text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                    Connexion...
                  </div>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>

            {/* Signup link */}
            {/* <div className="mt-6 text-center">
              <Button
                type="button"
                variant="ghost"
                className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setShowSignupModal(true)}
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Pas de compte ? S'inscrire
              </Button>
            </div> */}

          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            Application sécurisée.
          </p>
        </div>
      </div>

      {/* Signup Modal */}
      <SignupModal
        open={showSignupModal}
        onOpenChange={setShowSignupModal}
        onSuccess={handleSignupSuccess}
      />
    </div>
  );
};

export default Login;