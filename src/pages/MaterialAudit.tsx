import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  History,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Package2,
  User,
  Calendar,
  FileText
} from "lucide-react";

interface Transaction {
  transaction_id: number;
  material_id: number;
  type: "in" | "out";
  quantity: number;
  related_product_id?: number;
  related_order_id?: number;
  user_id: number;
  username?: string;
  product_title?: string;
  order_status?: string;
  transaction_date: string;
  note?: string;
}

interface MaterialInfo {
  material_id: number;
  title: string;
  reference?: string;
  quantity_type: string;
}

const MaterialAudit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [material, setMaterial] = useState<MaterialInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    if (id) {
      fetchMaterialAudit(parseInt(id));
    }
  }, [id]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, typeFilter, dateFilter]);

  const fetchMaterialAudit = async (materialId: number) => {
    try {
      setLoading(true);
      
      // Mock material info
      const mockMaterial: MaterialInfo = {
        material_id: materialId,
        title: "Tissu Coton Premium Bleu Marine",
        reference: "TIS-COT-001",
        quantity_type: "mètres"
      };

      // Mock transactions data
      const mockTransactions: Transaction[] = [
        {
          transaction_id: 1,
          material_id: materialId,
          type: "in",
          quantity: 50.0,
          user_id: 3,
          username: "stock1",
          transaction_date: "2024-01-10 14:30:00",
          note: "Réapprovisionnement initial"
        },
        {
          transaction_id: 2,
          material_id: materialId,
          type: "out",
          quantity: 12.5,
          related_product_id: 1,
          user_id: 2,
          username: "production1",
          product_title: "Chemise Classique",
          transaction_date: "2024-01-12 09:15:00",
          note: "Production standard - Lot #001"
        },
        {
          transaction_id: 3,
          material_id: materialId,
          type: "in",
          quantity: 25.0,
          user_id: 3,
          username: "stock1",
          transaction_date: "2024-01-14 16:20:00",
          note: "Réapprovisionnement urgent"
        },
        {
          transaction_id: 4,
          material_id: materialId,
          type: "out",
          quantity: 8.0,
          related_order_id: 1,
          user_id: 2,
          username: "production1",
          order_status: "en_cours",
          transaction_date: "2024-01-15 11:45:00",
          note: "Commande sur-mesure #001"
        },
        {
          transaction_id: 5,
          material_id: materialId,
          type: "out",
          quantity: 15.0,
          related_product_id: 2,
          user_id: 2,
          username: "production1",
          product_title: "Pull Hiver",
          transaction_date: "2024-01-16 13:30:00"
        },
        {
          transaction_id: 6,
          material_id: materialId,
          type: "in",
          quantity: 30.0,
          user_id: 1,
          username: "admin",
          transaction_date: "2024-01-18 10:00:00",
          note: "Correction de stock après inventaire"
        }
      ];

      setMaterial(mockMaterial);
      setTransactions(mockTransactions);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique des transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.product_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.note?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter(transaction => transaction.type === typeFilter);
    }

    // Filter by date
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(transaction => 
            new Date(transaction.transaction_date) >= filterDate
          );
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(transaction => 
            new Date(transaction.transaction_date) >= filterDate
          );
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(transaction => 
            new Date(transaction.transaction_date) >= filterDate
          );
          break;
      }
    }

    setFilteredTransactions(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const getTotalIn = () => {
    return transactions
      .filter(t => t.type === "in")
      .reduce((sum, t) => sum + t.quantity, 0);
  };

  const getTotalOut = () => {
    return transactions
      .filter(t => t.type === "out")
      .reduce((sum, t) => sum + t.quantity, 0);
  };

  const getNetMovement = () => {
    return getTotalIn() - getTotalOut();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4"></div>
          <div className="grid gap-6">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="text-center py-12">
        <Package2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold">Matériau non trouvé</h3>
        <p className="text-muted-foreground mb-4">
          Le matériau demandé n'existe pas ou a été supprimé.
        </p>
        <Button onClick={() => navigate('/stock')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au stock
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Button 
              variant="ghost" 
              onClick={() => navigate(`/material-details/${material.material_id}`)}
              className="-ml-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux détails
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/stock')}
            >
              Stock
            </Button>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Journal des transactions</h1>
          <p className="text-muted-foreground">
            Historique complet pour: <strong>{material.title}</strong>
            {material.reference && <span> ({material.reference})</span>}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="modern-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{transactions.length}</p>
              </div>
              <History className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Entrées</p>
                <p className="text-2xl font-bold text-success">+{getTotalIn()}</p>
                <p className="text-xs text-muted-foreground">{material.quantity_type}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sorties</p>
                <p className="text-2xl font-bold text-destructive">-{getTotalOut()}</p>
                <p className="text-xs text-muted-foreground">{material.quantity_type}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mouvement Net</p>
                <p className={`text-2xl font-bold ${getNetMovement() >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {getNetMovement() >= 0 ? '+' : ''}{getNetMovement()}
                </p>
                <p className="text-xs text-muted-foreground">{material.quantity_type}</p>
              </div>
              <Package2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="modern-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="in">Entrées</SelectItem>
                <SelectItem value="out">Sorties</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes dates</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des transactions ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-center">Quantité</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Lien</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.transaction_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">
                            {formatDate(transaction.transaction_date)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={transaction.type === "in" ? "success" : "destructive"}
                        className="flex items-center gap-1 w-fit mx-auto"
                      >
                        {transaction.type === "in" ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {transaction.type === "in" ? "Entrée" : "Sortie"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-medium ${
                        transaction.type === "in" ? "text-success" : "text-destructive"
                      }`}>
                        {transaction.type === "in" ? "+" : "-"}{transaction.quantity} {material.quantity_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{transaction.username}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {transaction.product_title && (
                        <Badge variant="outline" className="text-xs">
                          Produit: {transaction.product_title}
                        </Badge>
                      )}
                      {transaction.order_status && (
                        <Badge variant="outline" className="text-xs">
                          Commande: {transaction.order_status}
                        </Badge>
                      )}
                      {!transaction.product_title && !transaction.order_status && (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {transaction.note ? (
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <span className="text-sm">{transaction.note}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Aucune transaction trouvée</h3>
              <p className="text-muted-foreground">
                {searchTerm || typeFilter !== "all" || dateFilter !== "all"
                  ? "Aucune transaction ne correspond à vos critères de filtrage."
                  : "Aucune transaction n'a été enregistrée pour ce matériau."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialAudit;