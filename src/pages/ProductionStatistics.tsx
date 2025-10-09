import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Clock, Package, TrendingUp, Box } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval, startOfYear, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface StatusHistoryEntry {
  id: number;
  batch_id: number;
  old_status: string;
  new_status: string;
  changed_at: string;
  changed_by: string;
  notes?: string;
}

interface BatchWithHistory {
  id: number;
  batch_reference: string;
  nom_product: string;
  status: string;
  created_at: string;
  quantity_to_produce: number;
  status_history: StatusHistoryEntry[];
  materials_used?: {
    nom_matiere: string;
    quantity_used: number;
    quantity_type_name: string;
  }[];
}

interface DurationStats {
  batchReference: string;
  productName: string;
  planToCollect: number | null;
  planToCollectHours: number | null;
  collectToStore: number | null;
  collectToStoreHours: number | null;
  totalDuration: number | null;
  totalDurationHours: number | null;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const ProductionStatistics = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<BatchWithHistory[]>([]);
  const [timeRange, setTimeRange] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    fetchBatchesWithHistory();
  }, []);

  const fetchBatchesWithHistory = async () => {
    setLoading(true);
    try {
      // Fetch all batches
      const batchesResponse = await fetch('https://luccibyey.com.tn/production/api/production_batches.php');
      const batchesData = await batchesResponse.json();
      
      if (!batchesData.success) {
        throw new Error('Failed to fetch batches');
      }

      // Fetch status history for each batch
      const batchesWithHistory = await Promise.all(
        batchesData.data.map(async (batch: any) => {
          try {
            const historyResponse = await fetch(
              `https://luccibyey.com.tn/production/api/batch_status_history.php?batch_id=${batch.id}`
            );
            const historyData = await historyResponse.json();
            
            return {
              ...batch,
              status_history: historyData.success ? historyData.data : []
            };
          } catch (error) {
            console.error(`Error fetching history for batch ${batch.id}:`, error);
            return { ...batch, status_history: [] };
          }
        })
      );

      setBatches(batchesWithHistory);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate production counts by day
  const getProductionsByDay = () => {
    const startDate = startOfMonth(parseISO(selectedMonth + '-01'));
    const endDate = endOfMonth(startDate);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const count = batches.filter(batch => 
        format(parseISO(batch.created_at), 'yyyy-MM-dd') === dayStr
      ).length;

      return {
        date: format(day, 'dd MMM', { locale: fr }),
        count,
        fullDate: dayStr
      };
    });
  };

  // Calculate production counts by month
  const getProductionsByMonth = () => {
    const startDate = startOfYear(new Date());
    const endDate = new Date();
    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    return months.map(month => {
      const monthStr = format(month, 'yyyy-MM');
      const count = batches.filter(batch => 
        format(parseISO(batch.created_at), 'yyyy-MM') === monthStr
      ).length;

      return {
        month: format(month, 'MMM yyyy', { locale: fr }),
        count,
        monthValue: monthStr
      };
    });
  };

  // Helper function to format duration (show hours if < 1 day)
  const formatDuration = (days: number | null, hours: number | null): string => {
    if (days === null || hours === null) return '-';
    if (days === 0) {
      return `${hours}h`;
    }
    return `${days}j`;
  };

  // Calculate duration statistics
  const getDurationStats = (): DurationStats[] => {
    return batches.map(batch => {
      const history = batch.status_history || [];
      
      // Find timestamps for key status changes
      const plannedTime = parseISO(batch.created_at);
      const toCollectEntry = history.find(h => h.new_status === 'en_a_collecter');
      const toStoreEntry = history.find(h => h.new_status === 'en_magasin');

      let planToCollect = null;
      let planToCollectHours = null;
      let collectToStore = null;
      let collectToStoreHours = null;
      let totalDuration = null;
      let totalDurationHours = null;

      if (toCollectEntry) {
        const collectTime = parseISO(toCollectEntry.changed_at);
        const diffMs = collectTime.getTime() - plannedTime.getTime();
        planToCollect = Math.floor(diffMs / (1000 * 60 * 60 * 24)); // days
        planToCollectHours = Math.round(diffMs / (1000 * 60 * 60)); // hours
      }

      if (toCollectEntry && toStoreEntry) {
        const collectTime = parseISO(toCollectEntry.changed_at);
        const storeTime = parseISO(toStoreEntry.changed_at);
        const diffMs = storeTime.getTime() - collectTime.getTime();
        collectToStore = Math.floor(diffMs / (1000 * 60 * 60 * 24)); // days
        collectToStoreHours = Math.round(diffMs / (1000 * 60 * 60)); // hours
      }

      if (toStoreEntry) {
        const storeTime = parseISO(toStoreEntry.changed_at);
        const diffMs = storeTime.getTime() - plannedTime.getTime();
        totalDuration = Math.floor(diffMs / (1000 * 60 * 60 * 24)); // days
        totalDurationHours = Math.round(diffMs / (1000 * 60 * 60)); // hours
      }

      return {
        batchReference: batch.batch_reference,
        productName: batch.nom_product,
        planToCollect,
        planToCollectHours,
        collectToStore,
        collectToStoreHours,
        totalDuration,
        totalDurationHours
      };
    }).filter(stat => stat.planToCollect !== null || stat.collectToStore !== null);
  };

  // Calculate average durations
  const getAverageDurations = () => {
    const stats = getDurationStats();
    
    const planToCollectDurations = stats.filter(s => s.planToCollect !== null).map(s => s.planToCollect!);
    const planToCollectHoursDurations = stats.filter(s => s.planToCollectHours !== null).map(s => s.planToCollectHours!);
    const collectToStoreDurations = stats.filter(s => s.collectToStore !== null).map(s => s.collectToStore!);
    const collectToStoreHoursDurations = stats.filter(s => s.collectToStoreHours !== null).map(s => s.collectToStoreHours!);
    const totalDurations = stats.filter(s => s.totalDuration !== null).map(s => s.totalDuration!);
    const totalHoursDurations = stats.filter(s => s.totalDurationHours !== null).map(s => s.totalDurationHours!);

    const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

    return {
      planToCollect: avg(planToCollectDurations),
      planToCollectHours: avg(planToCollectHoursDurations),
      collectToStore: avg(collectToStoreDurations),
      collectToStoreHours: avg(collectToStoreHoursDurations),
      total: avg(totalDurations),
      totalHours: avg(totalHoursDurations)
    };
  };

  // Calculate status distribution
  const getStatusDistribution = () => {
    const statusCounts: Record<string, number> = {};
    
    batches.forEach(batch => {
      statusCounts[batch.status] = (statusCounts[batch.status] || 0) + 1;
    });

    const statusLabels: Record<string, string> = {
      'planifie': 'Planifié',
      'en_cours': 'En Cours',
      'termine': 'Terminé',
      'en_a_collecter': 'À Collecter',
      'en_magasin': 'En Magasin',
      'cancelled': 'Annulé'
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: statusLabels[status] || status,
      value: count,
      status
    }));
  };

  // Calculate material usage statistics
  const getMaterialUsageStats = () => {
    const materialUsage: Record<string, { quantity: number; unit: string; count: number }> = {};

    batches.forEach(batch => {
      if (batch.materials_used) {
        batch.materials_used.forEach(material => {
          if (!materialUsage[material.nom_matiere]) {
            materialUsage[material.nom_matiere] = {
              quantity: 0,
              unit: material.quantity_type_name,
              count: 0
            };
          }
          materialUsage[material.nom_matiere].quantity += material.quantity_used;
          materialUsage[material.nom_matiere].count += 1;
        });
      }
    });

    return Object.entries(materialUsage)
      .map(([name, data]) => ({
        name,
        quantity: Math.round(data.quantity * 100) / 100,
        unit: data.unit,
        count: data.count
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10); // Top 10 materials
  };

  const dailyData = getProductionsByDay();
  const monthlyData = getProductionsByMonth();
  const durationStats = getDurationStats();
  const averageDurations = getAverageDurations();
  const statusDistribution = getStatusDistribution();
  const materialStats = getMaterialUsageStats();

  const totalProductions = batches.length;
  const totalQuantityProduced = batches.reduce((sum, b) => sum + b.quantity_to_produce, 0);
  const completedBatches = batches.filter(b => b.status === 'en_magasin').length;
  const completionRate = totalProductions > 0 ? Math.round((completedBatches / totalProductions) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-3 sm:p-4 md:p-6">
      <div className="mb-4 md:mb-6">
        <Button 
          variant="outline"
          size="sm"
          onClick={() => navigate('/productions')}
          className="mb-3 md:mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Statistiques de Production
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Analyse détaillée des performances de production</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-xl hover:shadow-2xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/90 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Productions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-bold mb-1">{totalProductions}</div>
            <p className="text-xs text-primary-foreground/80">batches créés</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-xl hover:shadow-2xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/90 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Taux de Complétion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-bold mb-1">{completionRate}%</div>
            <p className="text-xs text-primary-foreground/80">{completedBatches} en magasin</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-xl hover:shadow-2xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/90 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Durée Moyenne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-bold mb-1">
              {averageDurations.total === 0 ? averageDurations.totalHours : averageDurations.total}
            </div>
            <p className="text-xs text-primary-foreground/80">
              {averageDurations.total === 0 ? 'heures total' : 'jours total'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline" className="space-y-3 md:space-y-4">
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 h-auto gap-1">
          <TabsTrigger value="timeline" className="text-xs sm:text-sm">Chronologie</TabsTrigger>
          <TabsTrigger value="durations" className="text-xs sm:text-sm">Durées</TabsTrigger>
          <TabsTrigger value="materials" className="text-xs sm:text-sm">Matériaux</TabsTrigger>
          <TabsTrigger value="status" className="text-xs sm:text-sm">Statuts</TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-3 md:space-y-4">
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base md:text-lg">Productions par Période</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Analyse des volumes de production</CardDescription>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Par Jour</SelectItem>
                    <SelectItem value="month">Par Mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {timeRange === 'day' && (
                <>
                  <div className="mb-3 md:mb-4">
                    <Input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full sm:w-48"
                    />
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="count" name="Productions" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
              {timeRange === 'month' && (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="count" name="Productions" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Durations Tab */}
        <TabsContent value="durations" className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm">Planifié → À Collecter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-primary">
                  {averageDurations.planToCollect === 0 ? averageDurations.planToCollectHours : averageDurations.planToCollect}
                </div>
                <p className="text-xs text-muted-foreground">
                  {averageDurations.planToCollect === 0 ? 'heures en moyenne' : 'jours en moyenne'}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm">À Collecter → En Magasin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-primary">
                  {averageDurations.collectToStore === 0 ? averageDurations.collectToStoreHours : averageDurations.collectToStore}
                </div>
                <p className="text-xs text-muted-foreground">
                  {averageDurations.collectToStore === 0 ? 'heures en moyenne' : 'jours en moyenne'}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 shadow-lg sm:col-span-2 md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm">Durée Totale</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-primary">
                  {averageDurations.total === 0 ? averageDurations.totalHours : averageDurations.total}
                </div>
                <p className="text-xs text-muted-foreground">
                  {averageDurations.total === 0 ? 'heures en moyenne' : 'jours en moyenne'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">Détail des Durées par Batch</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Temps de traitement pour chaque étape</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Mobile View - Cards */}
              <div className="block md:hidden space-y-3">
                {durationStats.slice(0, 20).map((stat, idx) => (
                  <Card key={idx} className="border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Référence</p>
                          <p className="font-semibold text-sm">{stat.batchReference}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Produit</p>
                          <p className="text-sm truncate">{stat.productName}</p>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground mb-1">Planifié → Collecter</p>
                            <Badge variant="outline" className="text-xs">
                              {formatDuration(stat.planToCollect, stat.planToCollectHours)}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Collecter → Magasin</p>
                            <Badge variant="outline" className="text-xs">
                              {formatDuration(stat.collectToStore, stat.collectToStoreHours)}
                            </Badge>
                          </div>
                        </div>
                        <div className="pt-1">
                          <p className="text-xs text-muted-foreground mb-1">Durée Totale</p>
                          <Badge variant="default" className="bg-primary text-xs">
                            {stat.totalDuration !== null ? formatDuration(stat.totalDuration, stat.totalDurationHours) : '-'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium text-sm">Référence</th>
                      <th className="text-left p-2 font-medium text-sm">Produit</th>
                      <th className="text-right p-2 font-medium text-sm">Planifié → Collecter</th>
                      <th className="text-right p-2 font-medium text-sm">Collecter → Magasin</th>
                      <th className="text-right p-2 font-medium text-sm">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {durationStats.slice(0, 20).map((stat, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-2 text-sm font-medium">{stat.batchReference}</td>
                        <td className="p-2 text-sm">{stat.productName}</td>
                        <td className="p-2 text-sm text-right">
                          {formatDuration(stat.planToCollect, stat.planToCollectHours)}
                        </td>
                        <td className="p-2 text-sm text-right">
                          {formatDuration(stat.collectToStore, stat.collectToStoreHours)}
                        </td>
                        <td className="p-2 text-sm text-right font-medium text-primary">
                          {formatDuration(stat.totalDuration, stat.totalDurationHours)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-3 md:space-y-4">
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">Utilisation des Matériaux</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Top 10 des matériaux les plus utilisés</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={materialStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg p-2 shadow-lg">
                          <p className="font-medium text-sm">{payload[0].payload.name}</p>
                          <p className="text-xs">Quantité: {payload[0].value} {payload[0].payload.unit}</p>
                          <p className="text-xs text-muted-foreground">Utilisé dans {payload[0].payload.count} batches</p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="quantity" name="Quantité utilisée" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Tab */}
        <TabsContent value="status" className="space-y-3 md:space-y-4">
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">Distribution des Statuts</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Répartition actuelle des productions par statut</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => {
                        const shortName = name.length > 12 ? name.substring(0, 10) + '...' : name;
                        return `${shortName} ${(percent * 100).toFixed(0)}%`;
                      }}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 md:space-y-3">
                  {statusDistribution.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 md:p-3 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/10 hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div 
                          className="w-3 h-3 md:w-4 md:h-4 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="font-medium text-xs sm:text-sm">{item.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">{item.value}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductionStatistics;
