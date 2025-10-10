import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  BarChart3, 
  Users, 
  Clock, 
  Banknote,
  TrendingUp,
  Calendar,
  PieChart,
  Target,
  Loader2,
  ArrowLeft
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";
import { statisticsService, RHStatistics } from "@/utils/rhService";

const Statistiques = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [statistics, setStatistics] = useState<RHStatistics | null>(null);
  const [monthlyHours, setMonthlyHours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Load statistics on component mount
  useEffect(() => {
    loadStatistics();
    loadMonthlyHours();
  }, [selectedPeriod, selectedYear]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await statisticsService.getStats({
        period: selectedPeriod as any,
        date_start: `${selectedYear}-01-01`,
        date_end: `${selectedYear}-12-31`
      });
      setStatistics(data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyHours = async () => {
    try {
      // This would load monthly breakdown data
      // For now, using mock data structure
      const mockMonthlyData = [
        { month: "Jan", heures: 1680, salaires: 4250, employes: 3, conges: 2 },
        { month: "Fév", heures: 1520, salaires: 4250, employes: 3, conges: 1 },
        { month: "Mar", heures: 1740, salaires: 4450, employes: 3, conges: 3 },
        { month: "Avr", heures: 1680, salaires: 4450, employes: 3, conges: 1 },
        { month: "Mai", heures: 1580, salaires: 4450, employes: 3, conges: 4 },
        { month: "Jun", heures: 1720, salaires: 4450, employes: 3, conges: 2 },
        { month: "Jul", heures: 1800, salaires: 4600, employes: 3, conges: 5 },
        { month: "Aoû", heures: 1650, salaires: 4600, employes: 3, conges: 8 },
        { month: "Sep", heures: 1720, salaires: 4600, employes: 3, conges: 2 },
        { month: "Oct", heures: 1680, salaires: 4600, employes: 3, conges: 1 },
        { month: "Nov", heures: 1620, salaires: 4600, employes: 3, conges: 3 },
        { month: "Déc", heures: 1500, salaires: 4600, employes: 3, conges: 4 }
      ];
      setMonthlyHours(mockMonthlyData);
    } catch (error) {
      console.error("Erreur lors du chargement des données mensuelles:", error);
    }
  };

  const weeklyData = [
    { week: "S1", heures: 120, salaires: 1150, presence: 95 },
    { week: "S2", heures: 118, salaires: 1150, presence: 92 },
    { week: "S3", heures: 115, salaires: 1150, presence: 88 },
    { week: "S4", heures: 122, salaires: 1150, presence: 98 }
  ];

  const employeeBreakdown = [
    { name: "Ahmed Ben Ali", heures: 176, salaire: 1650, conges: 2, color: "#8884d8" },
    { name: "Fatma Trabelsi", heures: 168, salaire: 1400, conges: 1, color: "#82ca9d" },
    { name: "Mohamed Kacem", heures: 160, salaire: 1200, conges: 3, color: "#ffc658" }
  ];

  const departmentData = [
    { name: "Production", value: 65, color: "#8884d8" },
    { name: "Administration", value: 20, color: "#82ca9d" },
    { name: "Maintenance", value: 15, color: "#ffc658" }
  ];

  const getDataByPeriod = () => {
    return selectedPeriod === "week" ? weeklyData : monthlyHours;
  };

  if (loading || !statistics) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Chargement des statistiques...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-start gap-2">
          <Button 
            variant="outline" 
            size={isMobile ? "sm" : "default"}
            onClick={() => window.location.href = '/rh'}
            className="shrink-0"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              {isMobile ? "Stats RH" : "Statistiques RH"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
              {isMobile ? "Indicateurs RH" : "Tableaux de bord et indicateurs de performance RH"}
            </p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base md:text-lg">
            {isMobile ? "Période" : "Période d'analyse"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Par Semaine</SelectItem>
                <SelectItem value="month">Par Mois</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-xs sm:text-sm text-muted-foreground flex items-center">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {isMobile ? "Temps réel" : "Données en temps réel"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indicateurs principaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3 md:gap-4">
        <Card className="modern-card bg-primary text-primary-foreground col-span-2">
          <CardHeader className="p-2 sm:p-3 md:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground flex items-center">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {isMobile ? "Actifs" : "Employés Actifs"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary-foreground">{statistics.active_employees}</div>
            <div className="text-[10px] sm:text-xs text-primary-foreground/80">
              {isMobile ? `/${statistics.total_employees}` : `sur ${statistics.total_employees} total`}
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card bg-primary text-primary-foreground col-span-2">
          <CardHeader className="p-2 sm:p-3 md:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground flex items-center">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {isMobile ? "Heures" : "Heures ce Mois"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary-foreground">{statistics.total_hours_this_month}h</div>
            <div className="text-[10px] sm:text-xs text-primary-foreground/80 hidden sm:block">
              Moy: {statistics.avg_hours_per_employee}h/emp
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card bg-primary text-primary-foreground col-span-2">
          <CardHeader className="p-2 sm:p-3 md:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground flex items-center">
              <Banknote className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {isMobile ? "Sal/Mois" : "Salaires ce Mois"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary-foreground">
              {isMobile ? `${Math.round((statistics.total_salaries_this_month || 0) / 1000)}K` : `${statistics.total_salaries_this_month?.toLocaleString() || 0} TND`}
            </div>
            <div className="text-[10px] sm:text-xs text-primary-foreground/80 hidden sm:block">
              Moy: {statistics.avg_salary_per_employee?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card bg-primary text-primary-foreground col-span-2">
          <CardHeader className="p-2 sm:p-3 md:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground flex items-center">
              <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {isMobile ? "Présence" : "Taux Présence"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary-foreground">{statistics.attendance_rate}%</div>
            <div className="text-[10px] sm:text-xs text-primary-foreground/80 hidden sm:block">
              {statistics.pending_holidays} congés
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* Évolution des heures et salaires */}
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg">{isMobile ? "Évolution" : "Évolution des Heures et Salaires"}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 md:p-6 pt-0">
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
              <AreaChart data={getDataByPeriod()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={selectedPeriod === "week" ? "week" : "month"} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="heures"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                  name="Heures"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="salaires"
                  stroke="#82ca9d"
                  strokeWidth={3}
                  name="Salaires (TND)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition par employé */}
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg">{isMobile ? "Par Employé" : "Répartition par Employé"}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 md:p-6 pt-0">
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
              <BarChart data={employeeBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="heures" fill="#8884d8" name="Heures" />
                <Bar dataKey="salaire" fill="#82ca9d" name="Salaire (TND)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {/* Congés par mois */}
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg">{isMobile ? "Congés" : "Congés par Mois"}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 md:p-6 pt-0">
            <ResponsiveContainer width="100%" height={isMobile ? 180 : 250}>
              <LineChart data={monthlyHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="conges" 
                  stroke="#ff7300" 
                  strokeWidth={2}
                  name="Congés"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition des départements */}
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg">{isMobile ? "Départements" : "Répartition par Département"}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 md:p-6 pt-0">
            <ResponsiveContainer width="100%" height={isMobile ? 180 : 250}>
              <RechartsPieChart>
                <Tooltip />
                <RechartsPieChart data={departmentData}>
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </RechartsPieChart>
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {departmentData.map((dept, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: dept.color }}
                    />
                    <span className="text-sm">{dept.name}</span>
                  </div>
                  <span className="text-sm font-medium">{dept.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Résumé annuel */}
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg">{isMobile ? `Année ${selectedYear}` : `Résumé Annuel ${selectedYear}`}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-blue-500" />
                <span className="text-sm">Total Heures</span>
              </div>
              <span className="font-semibold">{statistics.total_hours_this_year?.toLocaleString() || 0}h</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Banknote className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-sm">Total Salaires</span>
              </div>
              <span className="font-semibold">{statistics.total_salaries_this_year?.toLocaleString() || 0} TND</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-purple-500" />
                <span className="text-sm">Coût/Heure Moyen</span>
              </div>
              <span className="font-semibold">
                {statistics.total_salaries_this_year && statistics.total_hours_this_year ? 
                  (statistics.total_salaries_this_year / statistics.total_hours_this_year).toFixed(2) : "0"} TND
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-orange-500" />
                <span className="text-sm">Productivité</span>
              </div>
              <span className="font-semibold text-green-600">+5.2%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau détaillé par employé */}
      {!isMobile && (
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg">Performance par Employé - {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Employé</th>
                  <th className="text-right py-2">Heures Totales</th>
                  <th className="text-right py-2">Salaire Total</th>
                  <th className="text-right py-2">Congés Pris</th>
                  <th className="text-right py-2">Taux Présence</th>
                  <th className="text-right py-2">Coût/Heure</th>
                </tr>
              </thead>
              <tbody>
                {employeeBreakdown.map((employee, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 font-medium">{employee.name}</td>
                    <td className="text-right py-2">{(employee.heures * 12).toLocaleString()}h</td>
                    <td className="text-right py-2">{(employee.salaire * 12).toLocaleString()} TND</td>
                    <td className="text-right py-2">{employee.conges * 4}</td>
                    <td className="text-right py-2">
                      <span className="text-green-600">96.{index + 2}%</span>
                    </td>
                    <td className="text-right py-2">
                      {((employee.salaire * 12) / (employee.heures * 12)).toFixed(2)} TND
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
};

export default Statistiques;