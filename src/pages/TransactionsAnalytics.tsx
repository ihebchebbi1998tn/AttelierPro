import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Activity, Package, BarChart3 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts";

interface Transaction {
  transaction_id: number;
  material_id: number;
  material_title: string;
  material_color?: string;
  type_mouvement: "in" | "out";
  quantite: number;
  quantity_type_id: number;
  prix_unitaire: number;
  cout_total: number;
  motif: string;
  reference_commande?: string;
  notes?: string;
  user_id: number;
  date_transaction: string;
  user_name: string;
}

const TransactionsAnalytics = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30"); // days
  const [selectedMaterial, setSelectedMaterial] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      const [inResponse, outResponse] = await Promise.all([
        fetch('https://luccibyey.com.tn/production/api/transactions_stock.php?type=in'),
        fetch('https://luccibyey.com.tn/production/api/transactions_stock.php?type=out')
      ]);
      
      const [inData, outData] = await Promise.all([
        inResponse.json(),
        outResponse.json()
      ]);
      
      const allTransactions = [
        ...(inData.success && Array.isArray(inData.data) ? inData.data : []),
        ...(outData.success && Array.isArray(outData.data) ? outData.data : [])
      ];
      
      const transformedData: Transaction[] = allTransactions.map(item => ({
        transaction_id: item.transaction_id,
        material_id: item.material_id,
        material_title: item.material_title || `Matière #${item.material_id}`,
        material_color: item.material_color,
        type_mouvement: item.type_mouvement as "in" | "out",
        quantite: parseFloat(item.quantite) || 0,
        quantity_type_id: item.quantity_type_id,
        prix_unitaire: parseFloat(item.prix_unitaire) || 0,
        cout_total: parseFloat(item.cout_total) || 0,
        motif: item.motif || '',
        reference_commande: item.reference_commande,
        notes: item.notes,
        user_id: item.user_id,
        date_transaction: item.date_transaction,
        user_name: item.user_name || "Utilisateur inconnu"
      }));
      
      setTransactions(transformedData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions by period
  const getFilteredTransactions = () => {
    const days = parseInt(selectedPeriod);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return transactions.filter(t => {
      const transactionDate = new Date(t.date_transaction);
      const matchesPeriod = transactionDate >= cutoffDate;
      const matchesMaterial = selectedMaterial === "all" || t.material_id.toString() === selectedMaterial;
      return matchesPeriod && matchesMaterial;
    });
  };

  // Daily transactions data for line chart
  const getDailyTransactionsData = () => {
    const filteredTransactions = getFilteredTransactions();
    const dailyData: { [key: string]: { date: string; in: number; out: number; net: number } } = {};
    
    filteredTransactions.forEach(t => {
      const date = new Date(t.date_transaction).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { date, in: 0, out: 0, net: 0 };
      }
      
      if (t.type_mouvement === 'in') {
        dailyData[date].in += t.quantite;
        dailyData[date].net += t.quantite;
      } else {
        dailyData[date].out += t.quantite;
        dailyData[date].net -= t.quantite;
      }
    });
    
    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  };

  // Material usage data for bar chart
  const getMaterialUsageData = () => {
    const filteredTransactions = getFilteredTransactions();
    const materialData: { [key: string]: { material: string; in: number; out: number; net: number; value: number } } = {};
    
    filteredTransactions.forEach(t => {
      const key = `${t.material_title} (${t.material_color || 'N/A'})`;
      if (!materialData[key]) {
        materialData[key] = { material: key, in: 0, out: 0, net: 0, value: 0 };
      }
      
      if (t.type_mouvement === 'in') {
        materialData[key].in += t.quantite;
        materialData[key].net += t.quantite;
        materialData[key].value += t.cout_total;
      } else {
        materialData[key].out += t.quantite;
        materialData[key].net -= t.quantite;
        materialData[key].value += t.cout_total;
      }
    });
    
    return Object.values(materialData).sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  };

  // Transaction types pie chart data
  const getTransactionTypesData = () => {
    const filteredTransactions = getFilteredTransactions();
    const typeData: { [key: string]: number } = {};
    
    filteredTransactions.forEach(t => {
      const motif = t.motif || 'Non spécifié';
      typeData[motif] = (typeData[motif] || 0) + t.quantite;
    });
    
    return Object.entries(typeData).map(([name, value]) => ({ name, value }));
  };

  // Calendar heatmap data
  const getCalendarHeatmapData = () => {
    const filteredTransactions = getFilteredTransactions();
    const dailyActivity: { [key: string]: number } = {};
    
    filteredTransactions.forEach(t => {
      const date = new Date(t.date_transaction).toISOString().split('T')[0];
      dailyActivity[date] = (dailyActivity[date] || 0) + Math.abs(t.quantite);
    });
    
    // Get last 30 days
    const today = new Date();
    const calendarData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const activity = dailyActivity[dateStr] || 0;
      
      let intensity = 'low';
      if (activity > 1000) intensity = 'high';
      else if (activity > 500) intensity = 'medium';
      else if (activity > 100) intensity = 'low-medium';
      
      calendarData.push({
        date: dateStr,
        activity,
        intensity,
        day: date.getDay(),
        week: Math.floor(i / 7)
      });
    }
    
    return calendarData;
  };

  // Get statistics
  const getStatistics = () => {
    const filteredTransactions = getFilteredTransactions();
    const totalIn = filteredTransactions.filter(t => t.type_mouvement === 'in').reduce((sum, t) => sum + t.quantite, 0);
    const totalOut = filteredTransactions.filter(t => t.type_mouvement === 'out').reduce((sum, t) => sum + t.quantite, 0);
    const totalValue = filteredTransactions.reduce((sum, t) => sum + t.cout_total, 0);
    const uniqueMaterials = new Set(filteredTransactions.map(t => t.material_id)).size;
    
    return { totalIn, totalOut, totalValue, uniqueMaterials };
  };

  const statistics = getStatistics();
  const dailyData = getDailyTransactionsData();
  const materialData = getMaterialUsageData();
  const typeData = getTransactionTypesData();
  const calendarData = getCalendarHeatmapData();
  
  const uniqueMaterials = Array.from(new Set(transactions.map(t => ({ id: t.material_id, title: t.material_title }))))
    .sort((a, b) => a.title.localeCompare(b.title));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-400';
      case 'low-medium': return 'bg-yellow-300';
      case 'low': return 'bg-green-200';
      default: return 'bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/transactions')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <h1 className="text-3xl font-bold">Analytics des Transactions</h1>
          </div>
          <p className="text-muted-foreground">Analyse détaillée des mouvements de stock</p>
        </div>
        
        <div className="flex gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 jours</SelectItem>
              <SelectItem value="30">30 jours</SelectItem>
              <SelectItem value="90">90 jours</SelectItem>
              <SelectItem value="365">1 an</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Matériau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les matériaux</SelectItem>
              {uniqueMaterials.map(material => (
                <SelectItem key={material.id} value={material.id.toString()}>
                  {material.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entrées Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{statistics.totalIn.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sorties Totales</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">-{statistics.totalOut.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Nette</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(statistics.totalIn - statistics.totalOut) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(statistics.totalIn - statistics.totalOut) >= 0 ? '+' : ''}{(statistics.totalIn - statistics.totalOut).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matériaux Actifs</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{statistics.uniqueMaterials}</div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Activité Quotidienne (30 derniers jours)
          </CardTitle>
          <CardDescription>
            Intensité des transactions par jour - Rouge: forte activité, Orange: moyenne, Jaune: faible, Vert: très faible
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-1 max-w-2xl">
            {calendarData.map((day, index) => (
              <div
                key={day.date}
                className={`w-6 h-6 rounded ${getIntensityColor(day.intensity)} flex items-center justify-center text-xs font-medium cursor-pointer transition-all hover:scale-110`}
                title={`${day.date}: ${day.activity} transactions`}
              >
                {new Date(day.date).getDate()}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-sm">
            <span>Légende:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Élevé (1000+)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-400 rounded"></div>
              <span>Moyen (500+)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-300 rounded"></div>
              <span>Faible (100+)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-200 rounded"></div>
              <span>Très faible</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Transactions Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution Quotidienne</CardTitle>
            <CardDescription>Transactions d'entrée et sortie par jour</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })} />
                <YAxis />
                <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')} />
                <Legend />
                <Line type="monotone" dataKey="in" stroke="#10B981" strokeWidth={2} name="Entrées" />
                <Line type="monotone" dataKey="out" stroke="#EF4444" strokeWidth={2} name="Sorties" />
                <Line type="monotone" dataKey="net" stroke="#3B82F6" strokeWidth={2} name="Net" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Material Usage Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Matériaux</CardTitle>
            <CardDescription>Matériaux les plus actifs (balance nette)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={materialData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="material" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="in" fill="#10B981" name="Entrées" />
                <Bar dataKey="out" fill="#EF4444" name="Sorties" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Types Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par Type de Transaction</CardTitle>
          <CardDescription>Distribution des transactions par motif</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={typeData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={150}
                fill="#8884d8"
                label
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsAnalytics;