import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Plus, 
  Search,
  Eye,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  User,
  AlertTriangle,
  Calendar,
  Crown,
  Wrench
} from "lucide-react";

interface Utilisateur {
  utilisateur_id: number;
  nom_utilisateur: string;
  role: "admin" | "production" | "stock";
  date_creation: string;
  date_modification?: string;
  derniere_connexion?: string;
  statut: "actif" | "inactif";
}

const Utilisateurs = () => {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [filteredUtilisateurs, setFilteredUtilisateurs] = useState<Utilisateur[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUtilisateur, setSelectedUtilisateur] = useState<Utilisateur | null>(null);
  const [viewMode, setViewMode] = useState<"add" | "edit" | "view">("add");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  // Vérifier si l'utilisateur actuel est admin
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      
      if (user.role !== "admin") {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les permissions pour accéder à cette page",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  // Simulation de données
  useEffect(() => {
    const mockUtilisateurs: Utilisateur[] = [
      {
        utilisateur_id: 1,
        nom_utilisateur: "admin",
        role: "admin",
        date_creation: "2023-12-01",
        date_modification: "2024-01-15",
        derniere_connexion: "2024-01-16",
        statut: "actif"
      },
      {
        utilisateur_id: 2,
        nom_utilisateur: "marie.dubois",
        role: "production",
        date_creation: "2024-01-05",
        derniere_connexion: "2024-01-15",
        statut: "actif"
      },
      {
        utilisateur_id: 3,
        nom_utilisateur: "pierre.martin",
        role: "production",
        date_creation: "2024-01-08",
        derniere_connexion: "2024-01-14",
        statut: "actif"
      },
      {
        utilisateur_id: 4,
        nom_utilisateur: "sophie.laurent",
        role: "stock",
        date_creation: "2024-01-10",
        derniere_connexion: "2024-01-16",
        statut: "actif"
      },
      {
        utilisateur_id: 5,
        nom_utilisateur: "ancien.user",
        role: "stock",
        date_creation: "2023-11-15",
        date_modification: "2024-01-01",
        statut: "inactif"
      }
    ];
    
    setUtilisateurs(mockUtilisateurs);
    setFilteredUtilisateurs(mockUtilisateurs);
  }, []);

  // Filtrage
  useEffect(() => {
    let filtered = utilisateurs.filter(user =>
      user.nom_utilisateur.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUtilisateurs(filtered);
  }, [utilisateurs, searchTerm, roleFilter]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "production":
        return "warning";
      case "stock":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrateur";
      case "production":
        return "Production";
      case "stock":
        return "Stock";
      default:
        return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-4 w-4" />;
      case "production":
        return <Wrench className="h-4 w-4" />;
      case "stock":
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const handleView = (utilisateur: Utilisateur) => {
    setSelectedUtilisateur(utilisateur);
    setViewMode("view");
    setIsDialogOpen(true);
  };

  const handleEdit = (utilisateur: Utilisateur) => {
    setSelectedUtilisateur(utilisateur);
    setViewMode("edit");
    setIsDialogOpen(true);
  };

  const handleDelete = (utilisateur: Utilisateur) => {
    if (utilisateur.utilisateur_id === currentUser?.id) {
      toast({
        title: "Suppression impossible",
        description: "Vous ne pouvez pas supprimer votre propre compte",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Suppression impossible",
      description: "Cette fonctionnalité nécessite la connexion à la base de données",
      variant: "destructive",
    });
  };

  const handleAddNew = () => {
    setSelectedUtilisateur(null);
    setViewMode("add");
    setIsDialogOpen(true);
  };

  // Vérifier les permissions
  if (currentUser?.role !== "admin") {
    return (
      <div className="space-y-6 lg:space-y-8">
        <Alert className="modern-card">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Vous n'avez pas les permissions nécessaires pour accéder à cette page. 
            Seuls les administrateurs peuvent gérer les utilisateurs.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="actions-container">
        <div className="page-header">
          <h1 className="page-title">Gestion des Utilisateurs</h1>
          <p className="page-description">
            Gérez les comptes utilisateurs et leurs permissions (Admin uniquement)
          </p>
        </div>
        <Button onClick={handleAddNew} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Nouvel Utilisateur</span>
          <span className="sm:hidden">Nouveau</span>
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid-stats">
        <Card className="modern-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{utilisateurs.length}</div>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Crown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-destructive">
              {utilisateurs.filter(u => u.role === "admin").length}
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Production</CardTitle>
            <Wrench className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-warning">
              {utilisateurs.filter(u => u.role === "production").length}
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <ShieldCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-success">
              {utilisateurs.filter(u => u.statut === "actif").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="filters-container">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[200px] rounded-xl">
            <SelectValue placeholder="Filtrer par rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="admin">Administrateur</SelectItem>
            <SelectItem value="production">Production</SelectItem>
            <SelectItem value="stock">Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste des utilisateurs */}
      <div className="grid-content">
        {filteredUtilisateurs.map((utilisateur) => (
          <Card key={utilisateur.utilisateur_id} className="modern-card">
            <CardHeader className="p-4 sm:p-6 pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="bg-primary/10 p-2.5 rounded-xl flex-shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base sm:text-lg truncate">{utilisateur.nom_utilisateur}</CardTitle>
                    <CardDescription className="flex items-center mt-1 text-xs sm:text-sm">
                      <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">Créé le {utilisateur.date_creation}</span>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 ml-3">
                  <Badge 
                    variant={utilisateur.statut === "actif" ? "success" : "secondary"} 
                    className="text-xs"
                  >
                    {utilisateur.statut === "actif" ? "Actif" : "Inactif"}
                  </Badge>
                  <Badge variant={getRoleColor(utilisateur.role) as any} className="flex items-center gap-1 text-xs">
                    {getRoleIcon(utilisateur.role)}
                    <span className="hidden sm:inline">{getRoleLabel(utilisateur.role)}</span>
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
              <div className="space-y-3">
                {utilisateur.derniere_connexion && (
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Dernière connexion:</span>
                    <span className="font-medium">{utilisateur.derniere_connexion}</span>
                  </div>
                )}
                {utilisateur.date_modification && (
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Modifié le:</span>
                    <span className="font-medium">{utilisateur.date_modification}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-medium">#{utilisateur.utilisateur_id}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(utilisateur)}
                  className="flex-1 rounded-lg"
                >
                  <Eye className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">Voir détail</span>
                  <span className="sm:hidden">Voir</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(utilisateur)}
                  className="flex-1 rounded-lg"
                >
                  <Edit className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">Modifier</span>
                  <span className="sm:hidden">Éditer</span>
                </Button>
                {utilisateur.utilisateur_id !== currentUser?.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(utilisateur)}
                    className="text-destructive hover:text-destructive rounded-lg"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUtilisateurs.length === 0 && (
        <div className="empty-state">
          <Users className="empty-state-icon" />
          <h3 className="empty-state-title">Aucun utilisateur trouvé</h3>
          <p className="empty-state-description">
            {searchTerm || roleFilter !== "all" 
              ? "Aucun utilisateur ne correspond à vos critères de recherche."
              : "Commencez par ajouter des utilisateurs."
            }
          </p>
        </div>
      )}

      {/* Modal de détail/édition */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {viewMode === "add" && "Nouvel Utilisateur"}
              {viewMode === "edit" && `Modifier ${selectedUtilisateur?.nom_utilisateur}`}
              {viewMode === "view" && `Détail ${selectedUtilisateur?.nom_utilisateur}`}
            </DialogTitle>
            <DialogDescription>
              {viewMode !== "view" ? 
                "Cette fonctionnalité nécessite la connexion à la base de données via Supabase." :
                "Informations complètes de l'utilisateur"
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedUtilisateur && viewMode === "view" ? (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Nom d'utilisateur:</span>
                  <p className="font-medium">{selectedUtilisateur.nom_utilisateur}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Rôle:</span>
                  <div className="mt-1">
                    <Badge variant={getRoleColor(selectedUtilisateur.role) as any} className="flex items-center gap-1 w-fit">
                      {getRoleIcon(selectedUtilisateur.role)}
                      {getRoleLabel(selectedUtilisateur.role)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Statut:</span>
                  <div className="mt-1">
                    <Badge variant={selectedUtilisateur.statut === "actif" ? "success" : "secondary"}>
                      {selectedUtilisateur.statut === "actif" ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Date de création:</span>
                  <p className="font-medium">{selectedUtilisateur.date_creation}</p>
                </div>
                {selectedUtilisateur.derniere_connexion && (
                  <div>
                    <span className="text-sm text-muted-foreground">Dernière connexion:</span>
                    <p className="font-medium">{selectedUtilisateur.derniere_connexion}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => setViewMode("edit")}
                  className="flex-1"
                >
                  Modifier
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom d'utilisateur *</Label>
                <Input placeholder="nom.utilisateur" disabled />
              </div>
              <div className="space-y-2">
                <Label>Mot de passe *</Label>
                <Input type="password" placeholder="••••••••" disabled />
              </div>
              <div className="space-y-2">
                <Label>Rôle *</Label>
                <Select disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="stock">Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-4 pt-4">
                <Button className="flex-1" disabled>
                  Enregistrer
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Utilisateurs;