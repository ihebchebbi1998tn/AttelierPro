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
      <div className="flex items-center justify-center min-h-[300px] md:min-h-[400px] p-3 md:p-0">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-primary mx-auto mb-3 md:mb-4"></div>
          <p className="text-sm md:text-base text-muted-foreground">Chargement des clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8 p-3 md:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Clients Sous-traitance</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Clients et partenaires de sous-traitance
          </p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 md:px-6 py-2 rounded-lg shadow-sm text-sm md:text-base h-9 md:h-10 w-full sm:w-auto"
        >
          Ajouter Client
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-3 md:gap-4">
        <Card className="bg-primary text-primary-foreground shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
            <CardTitle className="text-sm md:text-base font-medium text-primary-foreground">Total Clients</CardTitle>
            <UserCheck className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground/80" />
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="text-xl md:text-2xl font-bold text-primary-foreground">{clients.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table des clients */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 md:p-6 pb-3 md:pb-4">
          <CardTitle className="text-base md:text-lg lg:text-xl">Liste des clients</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Clients avec leurs informations de contact
          </CardDescription>
        </CardHeader>
        
        {/* Recherche */}
        <div className="px-4 md:px-6 pb-3 md:pb-4">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 md:pl-10 rounded-xl h-9 md:h-10 text-sm md:text-base"
            />
          </div>
        </div>
        
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <div className="min-w-[800px] px-4 md:px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px] min-w-[150px]">Nom</TableHead>
                    <TableHead className="w-[200px] min-w-[200px]">Email</TableHead>
                    <TableHead className="w-[140px] min-w-[140px]">Téléphone</TableHead>
                    <TableHead className="w-[160px] min-w-[160px] hidden lg:table-cell">Adresse</TableHead>
                    <TableHead className="w-[150px] min-w-[150px] hidden lg:table-cell">Site Web</TableHead>
                    <TableHead className="w-[120px] min-w-[120px] hidden lg:table-cell">Date Création</TableHead>
                    <TableHead className="w-[180px] min-w-[180px]">Actions</TableHead>
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
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2 max-w-[180px]">
                          <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate text-sm" title={client.email}>
                            {client.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2 max-w-[120px]">
                          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate text-sm" title={client.phone}>
                            {client.phone}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-3">
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
          
          {/* Mobile Cards */}
          <div className="md:hidden px-4 pb-4 space-y-3">
            {filteredClients.map((client) => (
              <div 
                key={`mobile-${client.id}`} 
                className="border rounded-lg p-3 bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/clients-soustraitance/${client.id}`)}
              >
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="font-semibold text-sm mb-0.5 break-words">
                      {client.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{client.phone}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingClient(client)}
                      className="text-xs px-2 py-1 h-7"
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClient(client.id)}
                      className="text-xs px-2 py-1 h-7 text-destructive"
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-1.5 text-xs overflow-hidden">
                  <div className="flex items-start gap-2 text-muted-foreground min-w-0">
                    <Mail className="h-3 w-3 flex-shrink-0 mt-0.5" />
                    <span className="break-all">{client.email}</span>
                  </div>
                  <div className="flex items-start gap-2 text-muted-foreground min-w-0">
                    <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                    <span className="break-words">{client.address}</span>
                  </div>
                  {client.website && (
                    <div className="flex items-start gap-2 min-w-0">
                      <ExternalLink className="h-3 w-3 flex-shrink-0 mt-0.5 text-muted-foreground" />
                      <a 
                        href={client.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="break-all text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {client.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-xs">
                      Créé le {new Date(client.created_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {filteredClients.length === 0 && (
        <div className="text-center py-8 md:py-12 px-4">
          <UserCheck className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
          <h3 className="text-base md:text-lg font-medium mb-2">Aucun client trouvé</h3>
          <p className="text-sm md:text-base text-muted-foreground">
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