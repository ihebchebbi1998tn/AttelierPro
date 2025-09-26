import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  UserCheck, 
  Search,
  Phone,
  Mail,
  MapPin,
  ExternalLink
} from "lucide-react";

interface ClientSurMesure {
  order_id: number;
  client_name: string;
  client_vorname: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  client_region: string;
}

const ClientsExternes = () => {
  const [clients, setClients] = useState<ClientSurMesure[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientSurMesure[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch clients data
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('https://luccibyey.com.tn/production/api/clients_surmesure.php');
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

    fetchClients();
  }, [toast]);

  // Filtrage
  useEffect(() => {
    const filtered = clients.filter(client =>
      client.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.client_vorname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.client_email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const handleOrderClick = (orderId: number) => {
    navigate(`/commandes/${orderId}`);
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
          <h1 className="page-title">Clients Sur Mesure</h1>
          <p className="page-description">
            Clients avec commandes sur mesure
          </p>
        </div>
        <Button 
          onClick={() => {/* Add client functionality */}}
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
            Clients avec leurs informations de contact et numéros de commande
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
                    <TableHead className="w-[120px] min-w-[120px]">Nom</TableHead>
                    <TableHead className="w-[100px] min-w-[100px]">Prénom</TableHead>
                    <TableHead className="w-[200px] min-w-[200px] hidden sm:table-cell">Email</TableHead>
                    <TableHead className="w-[140px] min-w-[140px]">Téléphone</TableHead>
                    <TableHead className="w-[160px] min-w-[160px] hidden md:table-cell">Adresse</TableHead>
                    <TableHead className="w-[100px] min-w-[100px] hidden lg:table-cell">Région</TableHead>
                    <TableHead className="w-[120px] min-w-[120px]">N° Commande</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.order_id} className="hover:bg-muted/50">
                      <TableCell className="font-medium py-3">
                        <div className="truncate max-w-[110px]" title={client.client_name}>
                          {client.client_name}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="truncate max-w-[90px]" title={client.client_vorname}>
                          {client.client_vorname}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell py-3">
                        <div className="flex items-center gap-2 max-w-[180px]">
                          <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate text-sm" title={client.client_email}>
                            {client.client_email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2 max-w-[120px]">
                          <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0 sm:h-4 sm:w-4" />
                          <span className="truncate text-xs sm:text-sm" title={client.client_phone}>
                            {client.client_phone}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-3">
                        <div className="flex items-center gap-2 max-w-[140px]">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate text-sm" title={client.client_address}>
                            {client.client_address}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-3">
                        <div className="truncate max-w-[80px]" title={client.client_region}>
                          {client.client_region}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOrderClick(client.order_id)}
                          className="font-mono text-primary hover:text-primary-foreground text-xs px-2 py-1 h-8"
                        >
                          #{client.order_id}
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
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
              <div key={`mobile-${client.order_id}`} className="border rounded-lg p-3 mb-2 bg-muted/20">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium text-sm truncate">
                    {client.client_name} {client.client_vorname}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOrderClick(client.order_id)}
                    className="font-mono text-primary text-xs px-2 py-1 h-6 ml-2"
                  >
                    #{client.order_id}
                  </Button>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{client.client_email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{client.client_address}</span>
                  </div>
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
              : "Aucun client sur mesure trouvé."
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientsExternes;