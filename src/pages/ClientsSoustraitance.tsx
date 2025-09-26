import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import ClientForm from "@/components/ClientForm";
import { 
  UserCheck, 
  Search,
  Phone,
  Mail,
  MapPin,
  ExternalLink
} from "lucide-react";

interface SoustraitanceClient {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
  created_date: string;
  updated_date: string;
}

const ClientsSoustraitance = () => {
  const [clients, setClients] = useState<SoustraitanceClient[]>([]);
  const [filteredClients, setFilteredClients] = useState<SoustraitanceClient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<SoustraitanceClient | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch clients data
  const fetchClients = async () => {
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/soustraitance_clients.php');
      const result = await response.json();
      
      if (result.success) {
        setClients(result.data);
        setFilteredClients(result.data);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les clients",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion au serveur",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [toast]);

  // Filtrage
  useEffect(() => {
    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const handleAddClient = async (clientData: Omit<SoustraitanceClient, 'id' | 'created_date' | 'updated_date'>) => {
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/soustraitance_clients.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Succès",
          description: "Client ajouté avec succès",
        });
        fetchClients();
        setShowAddModal(false);
      } else {
        toast({
          title: "Erreur",
          description: result.message || "Erreur lors de l'ajout du client",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding client:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion au serveur",
        variant: "destructive",
      });
    }
  };

  const handleEditClient = async (clientData: SoustraitanceClient) => {
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/soustraitance_clients.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Succès",
          description: "Client modifié avec succès",
        });
        fetchClients();
        setEditingClient(null);
      } else {
        toast({
          title: "Erreur",
          description: result.message || "Erreur lors de la modification du client",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error editing client:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion au serveur",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClient = async (clientId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      return;
    }

    try {
      const response = await fetch(`https://luccibyey.com.tn/production/api/soustraitance_clients.php?id=${clientId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Succès",
          description: "Client supprimé avec succès",
        });
        fetchClients();
      } else {
        toast({
          title: "Erreur",
          description: result.message || "Erreur lors de la suppression du client",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion au serveur",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="actions-container">
        <div className="page-header">
          <h1 className="page-title">Clients Sous-traitance</h1>
          <p className="page-description">
            Clients et partenaires de sous-traitance
          </p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2 rounded-lg shadow-sm"
        >
          Ajouter Client
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid-stats">
        <Card className="modern-card bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground">Total Clients</CardTitle>
            <UserCheck className="h-4 w-4 text-primary-foreground/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-foreground">{clients.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table des clients */}
      <Card className="modern-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">Liste des clients</CardTitle>
          <CardDescription className="text-sm">
            Clients avec leurs informations de contact
          </CardDescription>
        </CardHeader>
        
        {/* Recherche */}
        <div className="px-6 pb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
        </div>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <div className="min-w-[800px] px-6 sm:px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px] min-w-[150px]">Nom</TableHead>
                    <TableHead className="w-[200px] min-w-[200px] hidden sm:table-cell">Email</TableHead>
                    <TableHead className="w-[140px] min-w-[140px]">Téléphone</TableHead>
                    <TableHead className="w-[160px] min-w-[160px] hidden md:table-cell">Adresse</TableHead>
                    <TableHead className="w-[150px] min-w-[150px] hidden lg:table-cell">Site Web</TableHead>
                    <TableHead className="w-[120px] min-w-[120px] hidden lg:table-cell">Date Création</TableHead>
                    <TableHead className="w-[120px] min-w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                     <TableRow 
                       key={client.id} 
                       className="hover:bg-muted/50 cursor-pointer" 
                       onClick={() => navigate(`/clients-soustraitance/${client.id}`)}
                     >
                      <TableCell className="font-medium py-3">
                        <div className="truncate max-w-[130px]" title={client.name}>
                          {client.name}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell py-3">
                        <div className="flex items-center gap-2 max-w-[180px]">
                          <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate text-sm" title={client.email}>
                            {client.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2 max-w-[120px]">
                          <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0 sm:h-4 sm:w-4" />
                          <span className="truncate text-xs sm:text-sm" title={client.phone}>
                            {client.phone}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-3">
                        <div className="flex items-center gap-2 max-w-[140px]">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate text-sm" title={client.address}>
                            {client.address}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-3">
                        {client.website ? (
                          <a 
                            href={client.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline truncate block max-w-[130px]"
                            title={client.website}
                          >
                            {client.website}
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-3">
                        <span className="text-sm text-muted-foreground">
                          {new Date(client.created_date).toLocaleDateString('fr-FR')}
                        </span>
                      </TableCell>
                       <TableCell className="py-3">
                         <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => setEditingClient(client)}
                             className="text-xs px-2 py-1 h-8"
                           >
                             Modifier
                           </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleDeleteClient(client.id)}
                             className="text-xs px-2 py-1 h-8 text-destructive hover:text-destructive-foreground"
                           >
                             Supprimer
                           </Button>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          
          {/* Mobile-only info cards for hidden columns */}
          <div className="sm:hidden px-6 pb-6">
            <div className="text-xs text-muted-foreground mb-2">
              Informations supplémentaires disponibles en mode paysage
            </div>
            {filteredClients.slice(0, 3).map((client) => (
              <div key={`mobile-${client.id}`} className="border rounded-lg p-3 mb-2 bg-muted/20">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium text-sm truncate">
                    {client.name}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingClient(client)}
                      className="text-xs px-2 py-1 h-6"
                    >
                      Modifier
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{client.address}</span>
                  </div>
                  {client.website && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-3 w-3" />
                      <a href={client.website} target="_blank" rel="noopener noreferrer" className="truncate text-primary">
                        {client.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filteredClients.length > 3 && (
              <div className="text-xs text-muted-foreground text-center py-2">
                Et {filteredClients.length - 3} autres clients...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {filteredClients.length === 0 && (
        <div className="empty-state">
          <UserCheck className="empty-state-icon" />
          <h3 className="empty-state-title">Aucun client trouvé</h3>
          <p className="empty-state-description">
            {searchTerm 
              ? "Aucun client ne correspond à votre recherche."
              : "Aucun client de sous-traitance trouvé."
            }
          </p>
        </div>
      )}

      {/* Add Client Modal */}
      <ClientForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddClient}
      />

      {/* Edit Client Modal */}
      <ClientForm
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        onSubmit={handleEditClient}
        client={editingClient}
        isEditing={true}
      />
    </div>
  );
};

export default ClientsSoustraitance;