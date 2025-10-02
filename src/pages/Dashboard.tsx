import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Package2, 
  ShoppingCart,
  Factory,
  RefreshCw,
  Search,
  TrendingUp
} from "lucide-react";

interface SurMesureOrder {
  id: number;
  client_name: string;
  client_vorname: string;
  product_name: string;
  status: string;
  ready_date: string;
}

interface ProductionBatch {
  batch_id: number;
  batch_number: string;
  status: string;
  production_date: string;
}

interface MaterialItem {
  material_id: number;
  title: string;
  color?: string;
  quantity_total: number;
  status: "critical" | "warning" | "good";
  progress_percentage: number;
}

const Dashboard = () => {
  const [surMesureOrders, setSurMesureOrders] = useState<SurMesureOrder[]>([]);
  const [productionBatches, setProductionBatches] = useState<ProductionBatch[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<MaterialItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filter materials when searchTerm changes
  useEffect(() => {
    let filtered = materials;
    
    if (searchTerm.trim()) {
      filtered = filtered.filter(material => 
        (material.title && material.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (material.color && material.color.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Sort by status priority (critical first, then warning, then good)
    filtered.sort((a, b) => {
      const statusOrder = { "critical": 0, "warning": 1, "good": 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
    
    setFilteredMaterials(filtered);
  }, [materials, searchTerm]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch SurMesure orders
      const surMesureResponse = await fetch('https://luccibyey.com.tn/production/api/commandes_surmesure.php');
      const surMesureData = await surMesureResponse.json();
      
      if (surMesureData.success) {
        setSurMesureOrders(surMesureData.data || []);
      }

      // Fetch Production batches
      const productionResponse = await fetch('https://luccibyey.com.tn/production/api/production_batches.php');
      const productionData = await productionResponse.json();
      
      if (productionData.success) {
        setProductionBatches(productionData.data || []);
      }

      // Fetch Materials for grid view
      const materialsResponse = await fetch('https://luccibyey.com.tn/production/api/matieres.php?stock_levels');
      const materialsData = await materialsResponse.json();
      
      if (materialsData.success && Array.isArray(materialsData.data)) {
        const transformedMaterials: MaterialItem[] = materialsData.data.map(item => ({
          material_id: item.material_id,
          title: item.title,
          color: item.color,
          quantity_total: parseFloat(item.quantity_total) || 0,
          status: item.status || "good",
          progress_percentage: item.progress_percentage || 0,
        }));
        
        setMaterials(transformedMaterials);
        setFilteredMaterials(transformedMaterials);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger certaines données",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "bg-destructive";
      case "warning":
        return "bg-warning";
      case "good":
        return "bg-success";
      default:
        return "bg-muted";
    }
  };

  const getProgressHeight = (percentage: number) => {
    return Math.max(10, Math.min(100, percentage));
  };

  // Calculate stats
  const surMesureEnCours = surMesureOrders.filter(order => 
    order.status === 'in_progress' || order.status === 'en_production'
  ).length;

  const productionsEnCours = productionBatches.filter(batch => 
    batch.status === 'en_cours' || batch.status === 'production'
  ).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-description">Chargement...</p>
        </div>
        <Card className="modern-card">
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-lg font-medium">Chargement des données</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="actions-container">
        <div className="page-header">
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-description">
            Suivez vos commandes sur mesure, productions et stock en temps réel
          </p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" className="rounded-xl">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card 
          className="border-0 shadow-lg bg-primary hover:shadow-xl transition-all duration-300 cursor-pointer"
          onClick={() => navigate('/commandes')}
        >
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-primary-foreground/70">Sur Mesure</p>
                <p className="text-2xl lg:text-3xl font-bold text-primary-foreground">{surMesureEnCours}</p>
                <p className="text-xs text-primary-foreground/70">En cours</p>
              </div>
              <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 lg:h-6 lg:w-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-0 shadow-lg bg-primary hover:shadow-xl transition-all duration-300 cursor-pointer"
          onClick={() => navigate('/productions')}
        >
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-primary-foreground/70">Productions</p>
                <p className="text-2xl lg:text-3xl font-bold text-primary-foreground">{productionsEnCours}</p>
                <p className="text-xs text-primary-foreground/70">En cours</p>
              </div>
              <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                <Factory className="h-5 w-5 lg:h-6 lg:w-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-0 shadow-lg bg-primary hover:shadow-xl transition-all duration-300 cursor-pointer"
          onClick={() => navigate('/stock')}
        >
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-primary-foreground/70">Matières</p>
                <p className="text-2xl lg:text-3xl font-bold text-primary-foreground">{materials.length}</p>
                <p className="text-xs text-primary-foreground/70">Total stock</p>
              </div>
              <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                <Package2 className="h-5 w-5 lg:h-6 lg:w-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-0 shadow-lg bg-primary hover:shadow-xl transition-all duration-300 cursor-pointer"
          onClick={() => navigate('/stock')}
        >
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-primary-foreground/70">Stock Critique</p>
                <p className="text-2xl lg:text-3xl font-bold text-primary-foreground">
                  {materials.filter(m => m.status === "critical").length}
                </p>
                <p className="text-xs text-primary-foreground/70">À réapprovisionner</p>
              </div>
              <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Overview Section */}
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Aperçu du Stock</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/global-stock-view')}
              className="rounded-xl"
            >
              Vue complète
            </Button>
          </CardTitle>
          <CardDescription>
            Niveaux de stock des matières principales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher une matière..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          
          {/* Materials Grid */}
          <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredMaterials.slice(0, 16).map((material) => (
              <Card 
                key={material.material_id} 
                className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02] flex flex-col min-h-[140px]"
                onClick={() => navigate(`/material-details/${material.material_id}`)}
              >
                <CardContent className="p-2 text-center flex flex-col h-full">
                  {/* Material Name */}
                  <div className="mb-2 min-h-[2.5rem] flex flex-col justify-start">
                    <h4 className="font-medium text-xs leading-tight line-clamp-2 text-center mb-1" title={material.title}>
                      {material.title}
                    </h4>
                    {material.color && (
                      <p className="text-[10px] text-muted-foreground line-clamp-1 text-center mt-auto">
                        {material.color}
                      </p>
                    )}
                  </div>
                  
                  {/* Progress Bar Container */}
                  <div className="flex-1 flex flex-col items-center justify-center mb-2 relative">
                    {/* Progress bar */}
                    <div className="relative h-12 w-4 bg-muted rounded-lg overflow-hidden">
                      {/* Background bar */}
                      <div className="absolute bottom-0 w-full bg-secondary rounded-lg" style={{ height: '100%' }} />
                      
                      {/* Progress fill */}
                      <div 
                        className={`absolute bottom-0 w-full transition-all duration-500 rounded-lg ${getStatusColor(material.status)}`}
                        style={{ height: `${getProgressHeight(material.progress_percentage)}%` }}
                      />
                      
                      {/* Percentage text */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[8px] font-medium text-white drop-shadow-sm">
                          {Math.round(material.progress_percentage)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stock Info */}
                  <div className="space-y-1 mt-auto">
                    <p className="text-[10px] font-medium">
                      {material.quantity_total}
                    </p>
                    <Badge 
                      variant={
                        material.status === "critical" ? "destructive" : 
                        material.status === "warning" ? "secondary" : "default"
                      } 
                      className="text-[10px] px-1.5 py-0"
                    >
                      {material.status === "critical" ? "Critique" : 
                       material.status === "warning" ? "Faible" : "Bon"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredMaterials.length > 16 && (
            <div className="text-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/global-stock-view')}
                className="rounded-xl"
              >
                Voir toutes les matières ({filteredMaterials.length})
              </Button>
            </div>
          )}
          
          {filteredMaterials.length === 0 && materials.length > 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucune matière trouvée</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;