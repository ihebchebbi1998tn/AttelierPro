import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Users, 
  Calendar, 
  Plane, 
  Banknote, 
  BarChart3,
  Clock,
  UserPlus,
  RefreshCw
} from "lucide-react";
import axios from 'axios';

const GestionRH = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    onLeave: 0,
    totalHoursThisWeek: 0,
    totalSalaryThisMonth: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const modules = [
    {
      title: "Employés",
      description: "Gérer la liste des employés, leurs informations personnelles et statuts",
      icon: Users,
      link: "/rh/employes",
      color: "bg-blue-500"
    },
    {
      title: "Planning & Horaires",
      description: "Définir les horaires de travail, templates hebdomadaires et plannings spécifiques",
      icon: Calendar,
      link: "/rh/planning",
      color: "bg-green-500"
    },
    {
      title: "Congés & Absences",
      description: "Gérer les demandes de congés, demi-journées et absences",
      icon: Plane,
      link: "/rh/conges",
      color: "bg-orange-500"
    },
    {
      title: "Salaires",
      description: "Enregistrer et suivre les salaires nets, bruts et taxes",
      icon: Banknote,
      link: "/rh/salaires",
      color: "bg-purple-500"
    },
    {
      title: "Pointage",
      description: "Enregistrer les heures d'entrée et sortie des employés",
      icon: Clock,
      link: "/rh/pointage",
      color: "bg-indigo-500"
    },
    {
      title: "Statistiques RH",
      description: "Visualiser les heures travaillées, coûts salariaux et indicateurs RH",
      icon: BarChart3,
      link: "/rh/statistiques",
      color: "bg-red-500"
    }
  ];

  // Fetch real statistics from the API
  const fetchStats = async () => {
    try {
      setIsLoading(true);
      
      // Fetch basic employee statistics
      const overviewResponse = await axios.get('https://luccibyey.com.tn/production/api/rh_statistics.php?type=overview');
      
      // Fetch hours for current week
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      
      const hoursResponse = await axios.get(`https://luccibyey.com.tn/production/api/rh_statistics.php?type=hours&period=week`);
      
      // Fetch salary statistics  
      const salaryResponse = await axios.get('https://luccibyey.com.tn/production/api/rh_statistics.php?type=salaries');
      
      if (overviewResponse.data.success) {
        const overviewData = overviewResponse.data.data;
        let totalHoursThisWeek = 0;
        let totalSalaryThisMonth = 0;
        
        // Calculate total hours this week
        if (hoursResponse.data.success && hoursResponse.data.data) {
          totalHoursThisWeek = hoursResponse.data.data.reduce((sum: number, emp: any) => sum + (parseFloat(emp.total_hours) || 0), 0);
        }
        
        // Calculate total salaries for this month
        if (salaryResponse.data.success && salaryResponse.data.data?.totals) {
          totalSalaryThisMonth = parseFloat(salaryResponse.data.data.totals.net_total) || 0;
        }
        
        setStats({
          totalEmployees: parseInt(overviewData.total_employees) || 0,
          activeEmployees: parseInt(overviewData.active_employees) || 0,
          onLeave: parseInt(overviewData.pending_holidays) || 0,
          totalHoursThisWeek: Math.round(totalHoursThisWeek),
          totalSalaryThisMonth: Math.round(totalSalaryThisMonth)
        });
      }
    } catch (error) {
      console.error('Error fetching RH statistics:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques RH",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="container mx-auto p-2 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
            {isMobile ? "Gestion RH" : "Gestion RH"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
            Système de gestion des ressources humaines
          </p>
        </div>
        <Button asChild size={isMobile ? "sm" : "default"} className="w-full sm:w-auto">
          <Link to="/rh/employes/nouveau">
            <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">{isMobile ? "Employé" : "Nouvel Employé"}</span>
          </Link>
        </Button>
      </div>

      {/* Statistiques rapides */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 sm:mb-4 gap-2">
        <h2 className="text-sm sm:text-lg md:text-xl font-semibold">
          {isMobile ? "Stats RH" : "Statistiques RH"}
        </h2>
        <Button onClick={fetchStats} variant="outline" size="sm" disabled={isLoading}>
          <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="text-xs sm:text-sm">Actualiser</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
        <Card className="modern-card bg-primary text-primary-foreground">
          <CardHeader className="p-2 sm:p-3 md:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground">
              {isMobile ? "Total" : "Total Employés"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary-foreground">
              {isLoading ? '...' : stats.totalEmployees}
            </div>
          </CardContent>
        </Card>
        
        <Card className="modern-card bg-primary text-primary-foreground">
          <CardHeader className="p-2 sm:p-3 md:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground">
              Actifs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary-foreground">
              {isLoading ? '...' : stats.activeEmployees}
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card bg-primary text-primary-foreground">
          <CardHeader className="p-2 sm:p-3 md:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground">
              {isMobile ? "Congé" : "En Congé"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary-foreground">
              {isLoading ? '...' : stats.onLeave}
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card bg-primary text-primary-foreground">
          <CardHeader className="p-2 sm:p-3 md:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground">
              {isMobile ? "H/Sem" : "Heures Semaine"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary-foreground">
              {isLoading ? '...' : `${stats.totalHoursThisWeek}h`}
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card bg-primary text-primary-foreground col-span-2 sm:col-span-1">
          <CardHeader className="p-2 sm:p-3 md:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground">
              {isMobile ? "Sal/Mois" : "Salaires Mois"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary-foreground">
              {isLoading ? '...' : `${stats.totalSalaryThisMonth.toLocaleString()} TND`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modules RH */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {modules.map((module) => (
          <Card key={module.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className={`p-1.5 sm:p-2 rounded-lg ${module.color} text-white`}>
                  <module.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base md:text-lg">
                    {isMobile ? module.title.split(' ')[0] : module.title}
                  </CardTitle>
                </div>
              </div>
              <CardDescription className="mt-1 sm:mt-2 text-xs sm:text-sm">
                {isMobile ? module.title : module.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <Button asChild className="w-full" size={isMobile ? "sm" : "default"}>
                <Link to={module.link}>
                  <span className="text-xs sm:text-sm">
                    {isMobile ? "Accéder" : "Accéder au module"}
                  </span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GestionRH;