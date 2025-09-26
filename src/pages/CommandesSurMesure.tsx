import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingCart, 
  Plus, 
  Search,
  Eye,
  Edit,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  MessageSquare,
  Paperclip
} from "lucide-react";

interface Commande {
  commande_id: number;
  client: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };
  date_commande: string;
  date_livraison_souhaitee: string;
  statut: string;
  commentaires?: string;
  mesures?: Array<{
    nom_mesure: string;
    valeur: string;
  }>;
  fichiers?: Array<{
    type_fichier: string;
    url_fichier: string;
  }>;
}

const CommandesSurMesure = () => {
  const navigate = useNavigate();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [filteredCommandes, setFilteredCommandes] = useState<Commande[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null);
  const [viewMode, setViewMode] = useState<"add" | "edit">("add");
  const { toast } = useToast();

  // Simulation de données
  useEffect(() => {
    const mockCommandes: Commande[] = [
      {
        commande_id: 1,
        client: {
          nom: "Moreau",
          prenom: "Julie",
          email: "julie.moreau@email.com",
          telephone: "06 12 34 56 78"
        },
        date_commande: "2024-01-15",
        date_livraison_souhaitee: "2024-02-15",
        statut: "en_production",
        commentaires: "Robe de soirée, couleur bordeaux demandée",
        mesures: [
          { nom_mesure: "Poitrine", valeur: "90cm" },
          { nom_mesure: "Taille", valeur: "70cm" },
          { nom_mesure: "Hanches", valeur: "95cm" },
          { nom_mesure: "Hauteur", valeur: "165cm" }
        ],
        fichiers: [
          { type_fichier: "image", url_fichier: "/uploads/cmd-001-ref.jpg" },
          { type_fichier: "pdf", url_fichier: "/uploads/cmd-001-specs.pdf" }
        ]
      },
      {
        commande_id: 2,
        client: {
          nom: "Leroy",
          prenom: "Marc",
          email: "marc.leroy@email.com",
          telephone: "06 98 76 54 32"
        },
        date_commande: "2024-01-14",
        date_livraison_souhaitee: "2024-02-10",
        statut: "pret_test1",
        commentaires: "Costume 3 pièces, tissu fourni par le client"
      },
      {
        commande_id: 3,
        client: {
          nom: "Bernard",
          prenom: "Anna",
          email: "anna.bernard@email.com",
          telephone: "06 55 44 33 22"
        },
        date_commande: "2024-01-16",
        date_livraison_souhaitee: "2024-03-01",
        statut: "recu",
        commentaires: "Première commande - robe cocktail"
      }
    ];
    
    setCommandes(mockCommandes);
    setFilteredCommandes(mockCommandes);
  }, []);

  // Filtrage
  useEffect(() => {
    let filtered = commandes.filter(commande =>
      `${commande.client.prenom} ${commande.client.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commande.commande_id.toString().includes(searchTerm)
    );

    if (statusFilter !== "all") {
      filtered = filtered.filter(commande => commande.statut === statusFilter);
    }

    setFilteredCommandes(filtered);
  }, [commandes, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "recu":
        return "secondary";
      case "en_production":
        return "warning";
      case "pret_test1":
      case "pret_test2":
        return "success";
      case "pret_retrait":
        return "default";
      case "retire":
        return "success";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "recu":
        return "Reçu";
      case "en_production":
        return "En production";
      case "pret_test1":
        return "Prêt test 1";
      case "pret_test2":
        return "Prêt test 2";
      case "pret_retrait":
        return "Prêt retrait";
      case "retire":
        return "Retiré";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "recu":
        return <Clock className="h-4 w-4" />;
      case "en_production":
        return <AlertCircle className="h-4 w-4" />;
      case "pret_test1":
      case "pret_test2":
      case "pret_retrait":
        return <CheckCircle className="h-4 w-4" />;
      case "retire":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleView = (commande: Commande) => {
    navigate(`/commandes/${commande.commande_id}`);
  };

  const handleEdit = (commande: Commande) => {
    setSelectedCommande(commande);
    setViewMode("edit");
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedCommande(null);
    setViewMode("add");
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="page-header">
        <div className="actions-container">
          <div>
            <h1 className="page-title">Commandes Sur-Mesure</h1>
            <p className="page-description">
              Gérez vos commandes personnalisées et suivez leur progression
            </p>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Commande
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-container">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par client ou numéro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="recu">Reçu</SelectItem>
            <SelectItem value="en_production">En production</SelectItem>
            <SelectItem value="pret_test1">Prêt test 1</SelectItem>
            <SelectItem value="pret_test2">Prêt test 2</SelectItem>
            <SelectItem value="pret_retrait">Prêt retrait</SelectItem>
            <SelectItem value="retire">Retiré</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste des commandes */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {filteredCommandes.map((commande) => (
          <Card key={commande.commande_id} className="modern-card">
            <CardHeader className="card-header-consistent pb-3 sm:pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      Commande #{commande.commande_id.toString().padStart(3, '0')}
                    </CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <User className="h-4 w-4 mr-1" />
                      {commande.client.prenom} {commande.client.nom}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={getStatusColor(commande.statut) as any} className="flex items-center gap-1">
                  {getStatusIcon(commande.statut)}
                  {getStatusLabel(commande.statut)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="card-content-consistent">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Commande:</span>
                  <span className="ml-1 font-medium">{commande.date_commande}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Livraison:</span>
                  <span className="ml-1 font-medium">{commande.date_livraison_souhaitee}</span>
                </div>
                <div className="flex items-center text-sm">
                  <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Contact:</span>
                  <span className="ml-1 font-medium">{commande.client.telephone}</span>
                </div>
              </div>

              {commande.commentaires && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">{commande.commentaires}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                {commande.fichiers && commande.fichiers.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    <Paperclip className="mr-1 h-3 w-3" />
                    {commande.fichiers.length} fichier(s)
                  </Badge>
                )}
                {commande.mesures && commande.mesures.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    📏 {commande.mesures.length} mesure(s)
                  </Badge>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(commande)}
                  className="flex-1"
                >
                  <Eye className="mr-1 h-3 w-3" />
                  Voir détail
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(commande)}
                  className="flex-1"
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Modifier
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCommandes.length === 0 && (
        <div className="empty-state">
          <ShoppingCart className="empty-state-icon" />
          <h3 className="empty-state-title">Aucune commande trouvée</h3>
          <p className="empty-state-description">
            {searchTerm || statusFilter !== "all" 
              ? "Aucune commande ne correspond à vos critères de recherche."
              : "Commencez par ajouter votre première commande sur-mesure."
            }
          </p>
        </div>
      )}

      {/* Modal de détail/édition */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewMode === "add" && "Nouvelle Commande Sur-Mesure"}
              {viewMode === "edit" && `Modifier Commande #${selectedCommande?.commande_id}`}
            </DialogTitle>
            <DialogDescription>
              Cette fonctionnalité nécessite la connexion à la base de données via Supabase.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prénom *</Label>
                <Input placeholder="Julie" disabled />
              </div>
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input placeholder="Moreau" disabled />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="julie@email.com" disabled />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input placeholder="06 12 34 56 78" disabled />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date de livraison souhaitée</Label>
              <Input type="date" disabled />
            </div>
            <div className="space-y-2">
              <Label>Commentaires</Label>
              <Textarea placeholder="Détails de la commande..." disabled />
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
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommandesSurMesure;