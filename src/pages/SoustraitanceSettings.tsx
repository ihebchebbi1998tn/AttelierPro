import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authService } from '@/lib/authService';
import { Settings, Mail, Lock, Save, Eye, EyeOff } from 'lucide-react';

const SoustraitanceSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Email update state
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  
  // Password update state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    
    // Redirect if not soustraitance user - check both role and user_type with both variations
    if (!user || (user.role !== 'sous_traitance' && user.user_type !== 'sous_traitance' && user.user_type !== 'soustraitance')) {
      navigate('/dashboard');
      toast({
        title: "Accès refusé",
        description: "Cette page est réservée aux clients sous-traitance",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentUser(user);
    setNewEmail(user.email || '');
  }, [navigate, toast]);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail || !newEmail.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une adresse email valide",
        variant: "destructive",
      });
      return;
    }

    if (newEmail === currentUser?.email) {
      toast({
        title: "Information",
        description: "Le nouvel email est identique à l'email actuel",
      });
      return;
    }

    setEmailLoading(true);

    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/soustraitance_clients.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: currentUser.id,
          email: newEmail.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local user data
        const updatedUser = { ...currentUser, email: newEmail.trim() };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);

        toast({
          title: "Succès",
          description: "Votre adresse email a été mise à jour avec succès",
        });
      } else {
        throw new Error(data.message || 'Erreur lors de la mise à jour');
      }
    } catch (error: any) {
      console.error('Error updating email:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour de l'email",
        variant: "destructive",
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les nouveaux mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);

    try {
      // First verify current password by attempting to login
      const loginResponse = await fetch('https://luccibyey.com.tn/production/api/soustraitance_client_details.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          email: currentUser.email,
          password: currentPassword,
        }),
      });

      const loginData = await loginResponse.json();

      if (!loginData.success) {
        toast({
          title: "Erreur",
          description: "Le mot de passe actuel est incorrect",
          variant: "destructive",
        });
        setPasswordLoading(false);
        return;
      }

      // Now update the password
      const response = await fetch('https://luccibyey.com.tn/production/api/soustraitance_clients.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: currentUser.id,
          password: newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Succès",
          description: "Votre mot de passe a été mis à jour avec succès",
        });

        // Clear password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        throw new Error(data.message || 'Erreur lors de la mise à jour');
      }
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour du mot de passe",
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 sm:h-8 sm:w-8" />
          Paramètres du Compte
        </h1>
        <p className="text-muted-foreground mt-2">
          Gérez vos informations de connexion
        </p>
      </div>

      <div className="grid gap-6">
        {/* Email Update Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Adresse Email
            </CardTitle>
            <CardDescription>
              Mettez à jour votre adresse email de connexion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-email">Email actuel</Label>
                <Input
                  id="current-email"
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="bg-muted"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-email">Nouvelle adresse email</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="nouvelle@email.com"
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={emailLoading || newEmail === currentUser.email}
                className="w-full sm:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {emailLoading ? 'Mise à jour...' : 'Mettre à jour l\'email'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Update Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Mot de Passe
            </CardTitle>
            <CardDescription>
              Changez votre mot de passe de connexion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Entrez votre mot de passe actuel"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 caractères"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmez le nouveau mot de passe"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-destructive">
                  Les mots de passe ne correspondent pas
                </p>
              )}

              <Button 
                type="submit" 
                disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="w-full sm:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {passwordLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informations du Compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nom</p>
                <p className="font-medium">{currentUser.name || currentUser.nom}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type de compte</p>
                <p className="font-medium">Sous-traitance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SoustraitanceSettings;
