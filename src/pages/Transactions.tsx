import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
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
  BarChart3
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
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Transactions de Stock</h1>
            <p className="text-muted-foreground">
              Chargement des transactions depuis l'API...
            </p>
          </div>
        </div>
        <div className="border rounded-lg overflow-hidden bg-white">
          <div className="flex items-center justify-center p-12">
            <div className="text-center space-y-4">
              <ArrowUpCircle className="h-8 w-8 animate-pulse mx-auto text-primary" />
              <p className="text-lg font-medium">Chargement des transactions</p>
              <p className="text-muted-foreground">Récupération des données depuis https://luccibyey.com.tn/</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Journal des Transactions</h1>
        <p className="page-description">
          Aperçu des événements et activités de stock de l'équipe
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        <div className="flex gap-2">
          <Button 
            variant={typeFilter === "in" ? "default" : "outline"} 
            size="sm" 
            className={`flex items-center gap-2 ${
              typeFilter === "in" 
                ? "bg-green-600 text-white hover:bg-green-700" 
                : "text-green-600 border-green-600 hover:bg-green-50"
            }`}
            onClick={() => setTypeFilter(typeFilter === "in" ? "all" : "in")}
          >
            <ArrowUpCircle className="h-4 w-4" />
            Entrée
          </Button>
          <Button 
            variant={typeFilter === "out" ? "default" : "outline"} 
            size="sm" 
            className={`flex items-center gap-2 ${
              typeFilter === "out" 
                ? "bg-red-600 text-white hover:bg-red-700" 
                : "text-red-600 border-red-600 hover:bg-red-50"
            }`}
            onClick={() => setTypeFilter(typeFilter === "out" ? "all" : "out")}
          >
            <ArrowDownCircle className="h-4 w-4" />
            Sortie
          </Button>
        </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => navigate('/transactions-analytics')} 
            size="sm" 
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={handleExport} size="sm" className="bg-primary text-primary-foreground">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="border rounded-lg overflow-hidden">
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
            {(() => {
              console.log('Rendering table with filteredTransactions:', filteredTransactions.length);
              return filteredTransactions.map((transaction) => (
                <TableRow 
                  key={transaction.transaction_id} 
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
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
                        <div className="text-sm font-medium">
                          {getEventDescription(transaction)}
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
                  </TableCell>
                </TableRow>
              ));
            })()}
          </TableBody>
        </Table>
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Aucune transaction trouvée</h3>
          <p className="text-muted-foreground">
            {searchTerm || typeFilter !== "all"
              ? "Aucune transaction ne correspond à vos critères de recherche."
              : "Les transactions système apparaîtront ici automatiquement."}
          </p>
        </div>
      )}

      {/* Transaction Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Détails de la transaction #{selectedTransaction?.transaction_id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={
                        selectedTransaction.type === "in" 
                          ? "bg-green-500/10 text-green-600 border-green-500/20" 
                          : "bg-red-500/10 text-red-600 border-red-500/20"
                      }
                    >
                      {getTypeLabel(selectedTransaction.type)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(selectedTransaction.transaction_date)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold">
                    {getEventDescription(selectedTransaction)}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {selectedTransaction.type === "in" ? "+" : "-"}{selectedTransaction.quantity}
                  </div>
                  <div className="text-sm text-muted-foreground">unités</div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Material Info */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Matériau
                  </h4>
                  <div className="pl-6 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nom:</span>
                      <span className="font-medium">{selectedTransaction.material_title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID:</span>
                      <span className="font-mono">#{selectedTransaction.material_id}</span>
                    </div>
                    {selectedTransaction.material_color && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Couleur:</span>
                        <span>{selectedTransaction.material_color}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Info */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Utilisateur
                  </h4>
                  <div className="pl-6 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nom:</span>
                      <span className="font-medium">{selectedTransaction.user_name}</span>
                    </div>
                  </div>
                </div>

                {/* Transaction Info */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Transaction
                  </h4>
                  <div className="pl-6 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID:</span>
                      <span className="font-mono">#{selectedTransaction.transaction_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Source:</span>
                      <span>{getSourceInfo(selectedTransaction)}</span>
                    </div>
                  </div>
                </div>

                {/* Additional Info if available */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Références
                  </h4>
                  <div className="pl-6 space-y-2">
                    {selectedTransaction.related_order_id && (
                      <div className="flex justify-between">
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
                      <div className="flex justify-between">
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
                      <div className="text-muted-foreground text-sm">
                        Transaction manuelle
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes if available */}
              {selectedTransaction.note && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes
                  </h4>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-sm">{selectedTransaction.note}</p>
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