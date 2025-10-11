import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { 
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  Package,
  User,
  Download,
  Filter,
  ShoppingCart,
  Calendar,
  FileText,
  Hash,
  Tag,
  BarChart3,
  XCircle
} from "lucide-react";

interface Transaction {
  transaction_id: number;
  material_id: number;
  material_title: string;
  material_color?: string;
  type: "in" | "out";
  quantity: number;
  related_order_id?: number;
  related_product_id?: number;
  user_name: string;
  transaction_date: string;
  note?: string;
  is_cancelled?: boolean;
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Fetch transactions from API
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching transactions...');
      
      // Fetch both 'in' and 'out' transactions separately to ensure we get all data
      const [inResponse, outResponse] = await Promise.all([
        fetch('https://luccibyey.com.tn/production/api/transactions_stock.php?type=in'),
        fetch('https://luccibyey.com.tn/production/api/transactions_stock.php?type=out')
      ]);
      
      if (!inResponse.ok || !outResponse.ok) {
        throw new Error(`HTTP error! in: ${inResponse.status}, out: ${outResponse.status}`);
      }
      
      const [inData, outData] = await Promise.all([
        inResponse.json(),
        outResponse.json()
      ]);
      
      console.log('IN transactions from API:', inData);
      console.log('OUT transactions from API:', outData);
      
      // Combine both datasets
      const allTransactions = [
        ...(inData.success && Array.isArray(inData.data) ? inData.data : []),
        ...(outData.success && Array.isArray(outData.data) ? outData.data : [])
      ];
      
      console.log('Combined transactions:', allTransactions.length);
      
      if (allTransactions.length > 0) {
        console.log('Combined data is valid with length:', allTransactions.length);
        // Transform API data to match our interface
        const transformedData: Transaction[] = allTransactions.map(item => ({
          transaction_id: item.transaction_id,
          material_id: item.material_id,
          material_title: item.material_title || `Matière #${item.material_id}`,
          material_color: item.material_color,
          type: item.type_mouvement as "in" | "out", // Fixed: was item.type, should be item.type_mouvement
          quantity: parseFloat(item.quantite) || 0, // Fixed: was item.quantity, should be item.quantite
          related_order_id: item.related_order_id,
          related_product_id: item.related_product_id,
          user_name: item.user_name || "Utilisateur inconnu",
          transaction_date: item.date_transaction, // Fixed: was item.transaction_date, should be item.date_transaction
          note: item.notes || item.motif // Added motif as fallback for notes
        }));
        
        console.log('Transformed data:', transformedData);
        console.log('IN transactions count:', transformedData.filter(t => t.type === 'in').length);
        console.log('OUT transactions count:', transformedData.filter(t => t.type === 'out').length);
        console.log('IN transactions:', transformedData.filter(t => t.type === 'in'));
        console.log('Setting transactions and filteredTransactions...');
        setTransactions(transformedData);
        setFilteredTransactions(transformedData);
      } else {
        console.log('No transactions found in either dataset');
        throw new Error('No valid transaction data received from API');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
      
      // Fallback to empty array
      setTransactions([]);
      setFilteredTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrage
  useEffect(() => {
    console.log('Filtering transactions. Current state:');
    console.log('- transactions length:', transactions.length);
    console.log('- searchTerm:', searchTerm);
    console.log('- typeFilter:', typeFilter);
    console.log('- transactions by type breakdown:', {
      in: transactions.filter(t => t.type === 'in').length,
      out: transactions.filter(t => t.type === 'out').length
    });
    
    let filtered = transactions.filter(transaction =>
      transaction.material_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    console.log('- after search filter:', filtered.length);

    if (typeFilter !== "all") {
      console.log('- applying type filter:', typeFilter);
      filtered = filtered.filter(transaction => transaction.type === typeFilter);
      console.log('- after type filter:', filtered.length);
    }

    // Trier par date décroissante
    filtered.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());

    console.log('- final filtered length:', filtered.length);
    console.log('- final filtered transactions:', filtered);
    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, typeFilter]);

  const getTypeColor = (type: string) => {
    return type === "in" ? "success" : "warning";
  };

  const getTypeIcon = (type: string) => {
    return type === "in" ? 
      <ArrowUpCircle className="h-4 w-4 text-green-600" /> : 
      <ArrowDownCircle className="h-4 w-4 text-red-600" />;
  };

  const getTypeLabel = (type: string) => {
    return type === "in" ? "Entrée" : "Sortie";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };


  const handleExport = () => {
    try {
      // Prepare data for export
      const exportData = filteredTransactions.map(transaction => ({
        'ID Transaction': transaction.transaction_id,
        'Date & Heure': formatDate(transaction.transaction_date),
        'Type': getTypeLabel(transaction.type),
        'Matériau': transaction.material_title,
        'Couleur': transaction.material_color || 'N/A',
        'ID Matériau': transaction.material_id,
        'Quantité': `${transaction.type === "in" ? "+" : "-"}${transaction.quantity}`,
        'Utilisateur': transaction.user_name,
        'Note': transaction.note || 'N/A',
        'Commande liée': transaction.related_order_id || 'N/A',
        'Produit lié': transaction.related_product_id || 'N/A'
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const wscols = [
        { wch: 12 }, // ID Transaction
        { wch: 20 }, // Date & Heure
        { wch: 10 }, // Type
        { wch: 25 }, // Matériau
        { wch: 15 }, // Couleur
        { wch: 12 }, // ID Matériau
        { wch: 12 }, // Quantité
        { wch: 20 }, // Utilisateur
        { wch: 30 }, // Note
        { wch: 15 }, // Commande liée
        { wch: 15 }  // Produit lié
      ];
      ws['!cols'] = wscols;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `transactions_${dateStr}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
      
      console.log(`Exported ${exportData.length} transactions to ${filename}`);
    } catch (error) {
      console.error('Error exporting transactions:', error);
      alert('Erreur lors de l\'export. Veuillez réessayer.');
    }
  };

  const getEventDescription = (transaction: Transaction) => {
    const action = transaction.type === "in" ? "Entrée de stock" : "Sortie de stock";
    return `${action} - ${transaction.material_title}`;
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const getSourceInfo = (transaction: Transaction) => {
    if (transaction.related_order_id) {
      return `Commande #${transaction.related_order_id}`;
    }
    if (transaction.related_product_id) {
      return `Produit #${transaction.related_product_id}`;
    }
    return "Manuel";
  };

  const handleCancelTransaction = async (transaction: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`Êtes-vous sûr de vouloir annuler cette transaction?\n\nCela ${transaction.type === 'out' ? 'restaurera' : 'déduira'} ${transaction.quantity} unités de stock pour ${transaction.material_title}.`)) {
      return;
    }

    try {
      setCancellingId(transaction.transaction_id);
      const userId = localStorage.getItem('userId') || '1';
      
      const response = await fetch('https://luccibyey.com.tn/production/api/transactions_stock.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancelTransaction',
          transaction_id: transaction.transaction_id,
          user_id: userId
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Transaction annulée",
          description: `Le stock a été restauré. ${transaction.type === 'out' ? '+' : '-'}${transaction.quantity} pour ${transaction.material_title}`,
        });
        // Reload page to refresh all stock displays
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast({
          title: "Erreur",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'annulation de la transaction",
        variant: "destructive"
      });
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6 p-3 md:p-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Transactions de Stock</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Chargement des transactions depuis l'API...
            </p>
          </div>
        </div>
        <div className="border rounded-lg overflow-hidden bg-white">
          <div className="flex items-center justify-center p-8 md:p-12">
            <div className="text-center space-y-3 md:space-y-4">
              <ArrowUpCircle className="h-6 w-6 md:h-8 md:w-8 animate-pulse mx-auto text-primary" />
              <p className="text-base md:text-lg font-medium">Chargement des transactions</p>
              <p className="text-xs md:text-sm text-muted-foreground">Récupération des données depuis https://luccibyey.com.tn/</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8 p-3 md:p-0">
      {/* Header */}
      <div className="page-header">
        <h1 className="text-2xl md:text-3xl font-bold">Journal des Transactions</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Aperçu des événements et activités de stock de l'équipe
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 md:gap-4">
        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9 md:h-10"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={typeFilter === "in" ? "default" : "outline"} 
            size="sm" 
            className={`flex items-center gap-1.5 text-xs md:text-sm h-8 md:h-9 ${
              typeFilter === "in" 
                ? "bg-green-600 text-white hover:bg-green-700" 
                : "text-green-600 border-green-600 hover:bg-green-50"
            }`}
            onClick={() => setTypeFilter(typeFilter === "in" ? "all" : "in")}
          >
            <ArrowUpCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Entrée
          </Button>
          <Button 
            variant={typeFilter === "out" ? "default" : "outline"} 
            size="sm" 
            className={`flex items-center gap-1.5 text-xs md:text-sm h-8 md:h-9 ${
              typeFilter === "out" 
                ? "bg-red-600 text-white hover:bg-red-700" 
                : "text-red-600 border-red-600 hover:bg-red-50"
            }`}
            onClick={() => setTypeFilter(typeFilter === "out" ? "all" : "out")}
          >
            <ArrowDownCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Sortie
          </Button>
          <Button 
            onClick={() => navigate('/transactions-analytics')} 
            size="sm" 
            variant="outline"
            className="flex items-center gap-1.5 text-xs md:text-sm h-8 md:h-9 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <BarChart3 className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </Button>
          <Button 
            onClick={handleExport} 
            size="sm" 
            className="flex items-center gap-1.5 text-xs md:text-sm h-8 md:h-9 bg-primary text-primary-foreground ml-auto"
          >
            <Download className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Exporter</span>
          </Button>
        </div>
      </div>

      {/* Transactions - Table for desktop, Cards for mobile */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[180px] font-medium">Date & Heure ↓</TableHead>
              <TableHead className="font-medium">Utilisateur</TableHead>
              <TableHead className="font-medium">Événement</TableHead>
              <TableHead className="text-right font-medium">Quantité</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => {
              const isCancelled = transaction.note?.includes('[ANNULÉE]');
              return (
                <TableRow 
                  key={transaction.transaction_id} 
                  className={`hover:bg-muted/30 cursor-pointer transition-colors ${isCancelled ? 'opacity-50' : ''}`}
                  onClick={() => handleTransactionClick(transaction)}
                >
                  <TableCell className="font-medium text-sm">
                    {formatDate(transaction.transaction_date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs font-medium">
                        {transaction.user_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <span className="text-sm">{transaction.user_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md ${
                        transaction.type === "in" ? "bg-green-500/10" : "bg-red-500/10"
                      }`}>
                        {getTypeIcon(transaction.type)}
                      </div>
                      <div>
                        <div className="text-sm font-medium flex items-center gap-2">
                          {getEventDescription(transaction)}
                          {isCancelled && (
                            <Badge variant="destructive" className="text-xs">Annulée</Badge>
                          )}
                        </div>
                        {transaction.material_color && (
                          <div className="text-xs text-muted-foreground">
                            Couleur: {transaction.material_color}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          ID: #{transaction.material_id}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Badge 
                        variant="outline"
                        className={`${
                          transaction.type === "in" 
                            ? "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20" 
                            : "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20"
                        }`}
                      >
                        {transaction.type === "in" ? "+" : "-"}{transaction.quantity}
                      </Badge>
                      {!isCancelled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleCancelTransaction(transaction, e)}
                          disabled={cancellingId === transaction.transaction_id}
                          className="h-8 px-2"
                        >
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredTransactions.map((transaction) => (
          <div
            key={transaction.transaction_id}
            onClick={() => handleTransactionClick(transaction)}
            className="border rounded-lg p-3 bg-card hover:bg-muted/30 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${
                  transaction.type === "in" ? "bg-green-500/10" : "bg-red-500/10"
                }`}>
                  {getTypeIcon(transaction.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {transaction.material_title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ID: #{transaction.material_id}
                  </div>
                </div>
              </div>
              <Badge 
                variant="outline"
                className={`shrink-0 ${
                  transaction.type === "in" 
                    ? "bg-green-500/10 text-green-600 border-green-500/20" 
                    : "bg-red-500/10 text-red-600 border-red-500/20"
                }`}
              >
                {transaction.type === "in" ? "+" : "-"}{transaction.quantity}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 bg-muted rounded-full flex items-center justify-center text-[10px] font-medium">
                  {transaction.user_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <span>{transaction.user_name}</span>
              </div>
              <span>{formatDate(transaction.transaction_date)}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-center py-8 md:py-12">
          <Package className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
          <h3 className="text-base md:text-lg font-medium text-foreground mb-2">Aucune transaction trouvée</h3>
          <p className="text-sm md:text-base text-muted-foreground px-4">
            {searchTerm || typeFilter !== "all"
              ? "Aucune transaction ne correspond à vos critères de recherche."
              : "Les transactions système apparaîtront ici automatiquement."}
          </p>
        </div>
      )}

      {/* Transaction Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
              <FileText className="h-4 w-4 md:h-5 md:w-5" />
              Détails de la transaction #{selectedTransaction?.transaction_id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4 md:space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        selectedTransaction.type === "in" 
                          ? "bg-green-500/10 text-green-600 border-green-500/20" 
                          : "bg-red-500/10 text-red-600 border-red-500/20"
                      }`}
                    >
                      {getTypeLabel(selectedTransaction.type)}
                    </Badge>
                    <span className="text-xs md:text-sm text-muted-foreground">
                      {formatDate(selectedTransaction.transaction_date)}
                    </span>
                  </div>
                  <h3 className="text-base md:text-lg font-semibold">
                    {getEventDescription(selectedTransaction)}
                  </h3>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xl md:text-2xl font-bold">
                    {selectedTransaction.type === "in" ? "+" : "-"}{selectedTransaction.quantity}
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground">unités</div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Material Info */}
                <div className="space-y-2 md:space-y-3">
                  <h4 className="text-sm md:text-base font-medium flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    Matériau
                  </h4>
                  <div className="pl-5 md:pl-6 space-y-1.5 md:space-y-2 text-xs md:text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Nom:</span>
                      <span className="font-medium text-right">{selectedTransaction.material_title}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">ID:</span>
                      <span className="font-mono">#{selectedTransaction.material_id}</span>
                    </div>
                    {selectedTransaction.material_color && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Couleur:</span>
                        <span>{selectedTransaction.material_color}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Info */}
                <div className="space-y-2 md:space-y-3">
                  <h4 className="text-sm md:text-base font-medium flex items-center gap-2">
                    <User className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    Utilisateur
                  </h4>
                  <div className="pl-5 md:pl-6 space-y-1.5 md:space-y-2 text-xs md:text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Nom:</span>
                      <span className="font-medium">{selectedTransaction.user_name}</span>
                    </div>
                  </div>
                </div>

                {/* Transaction Info */}
                <div className="space-y-2 md:space-y-3">
                  <h4 className="text-sm md:text-base font-medium flex items-center gap-2">
                    <Hash className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    Transaction
                  </h4>
                  <div className="pl-5 md:pl-6 space-y-1.5 md:space-y-2 text-xs md:text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">ID:</span>
                      <span className="font-mono">#{selectedTransaction.transaction_id}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Source:</span>
                      <span>{getSourceInfo(selectedTransaction)}</span>
                    </div>
                  </div>
                </div>

                {/* Additional Info if available */}
                <div className="space-y-2 md:space-y-3">
                  <h4 className="text-sm md:text-base font-medium flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    Références
                  </h4>
                  <div className="pl-5 md:pl-6 space-y-1.5 md:space-y-2 text-xs md:text-sm">
                    {selectedTransaction.related_order_id && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Commande:</span>
                        <Link 
                          to={`/commandes/${selectedTransaction.related_order_id}`}
                          className="text-primary hover:underline font-mono"
                        >
                          #{selectedTransaction.related_order_id}
                        </Link>
                      </div>
                    )}
                    {selectedTransaction.related_product_id && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Produit:</span>
                        <Link 
                          to={`/produits/${selectedTransaction.related_product_id}`}
                          className="text-primary hover:underline font-mono"
                        >
                          #{selectedTransaction.related_product_id}
                        </Link>
                      </div>
                    )}
                    {!selectedTransaction.related_order_id && !selectedTransaction.related_product_id && (
                      <div className="text-muted-foreground">
                        Transaction manuelle
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes if available */}
              {selectedTransaction.note && (
                <div className="space-y-2 md:space-y-3">
                  <h4 className="text-sm md:text-base font-medium flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    Notes
                  </h4>
                  <div className="bg-muted/30 rounded-lg p-2.5 md:p-3">
                    <p className="text-xs md:text-sm">{selectedTransaction.note}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transactions;