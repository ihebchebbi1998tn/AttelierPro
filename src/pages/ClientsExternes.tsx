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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Clients Sur Mesure</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Clients avec commandes sur mesure
        </p>
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
            Clients avec leurs informations de contact et numéros de commande
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
                    <TableHead className="w-[120px] min-w-[120px]">Nom</TableHead>
                    <TableHead className="w-[100px] min-w-[100px]">Prénom</TableHead>
                    <TableHead className="w-[200px] min-w-[200px]">Email</TableHead>
                    <TableHead className="w-[140px] min-w-[140px]">Téléphone</TableHead>
                    <TableHead className="w-[160px] min-w-[160px] hidden lg:table-cell">Adresse</TableHead>
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
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2 max-w-[180px]">
                          <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate text-sm" title={client.client_email}>
                            {client.client_email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2 max-w-[120px]">
                          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate text-sm" title={client.client_phone}>
                            {client.client_phone}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-3">
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
          
          {/* Mobile Cards */}
          <div className="md:hidden px-4 pb-4 space-y-3">
            {filteredClients.map((client) => (
              <div key={`mobile-${client.order_id}`} className="border rounded-lg p-3 bg-card hover:bg-muted/30 transition-colors">
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="font-semibold text-sm mb-0.5 break-words">
                      {client.client_name} {client.client_vorname}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{client.client_phone}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOrderClick(client.order_id)}
                    className="font-mono text-primary text-xs px-2 py-1 h-7 shrink-0"
                  >
                    #{client.order_id}
                  </Button>
                </div>
                
                <div className="space-y-1.5 text-xs overflow-hidden">
                  <div className="flex items-start gap-2 text-muted-foreground min-w-0">
                    <Mail className="h-3 w-3 flex-shrink-0 mt-0.5" />
                    <span className="break-all">{client.client_email}</span>
                  </div>
                  <div className="flex items-start gap-2 text-muted-foreground min-w-0">
                    <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                    <span className="break-words">{client.client_address}, {client.client_region}</span>
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
              : "Aucun client sur mesure trouvé."
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientsExternes;