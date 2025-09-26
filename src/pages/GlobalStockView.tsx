import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, RefreshCw, Search } from "lucide-react";

interface MaterialItem {
  material_id: number;
  title: string;
  color?: string;
  quantity_total: number;
  lowest_quantity_needed: number;
  medium_quantity_needed: number;
  good_quantity_needed: number;
  status: "critical" | "warning" | "good";
  progress_percentage: number;
  materiere_type?: "intern" | "extern";
  extern_customer_id?: number;
}

const GlobalStockView = () => {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<MaterialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [materiereTypeFilter, setMateriereTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchMaterials();
  }, []);

  // Filter materials when statusFilter, materiereTypeFilter or searchTerm changes
  useEffect(() => {
    let filtered = materials;
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(material => material.status === statusFilter);
    }
    
    // Filter by materiere type
    if (materiereTypeFilter !== "all") {
      filtered = filtered.filter(material => material.materiere_type === materiereTypeFilter);
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(material => 
        (material.title && material.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (material.color && material.color.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Sort by name first (numeric sorting for numbers), then by status priority
    filtered.sort((a, b) => {
      // Check if both titles are numbers for numeric sorting
      const aIsNumber = /^\d+$/.test(a.title.trim());
      const bIsNumber = /^\d+$/.test(b.title.trim());
      
      if (aIsNumber && bIsNumber) {
        return parseInt(a.title) - parseInt(b.title);
      }
      
      return a.title.localeCompare(b.title);
    });
    
    setFilteredMaterials(filtered);
  }, [materials, statusFilter, materiereTypeFilter, searchTerm]);

  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://luccibyey.com.tn/production/api/matieres.php?stock_levels');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        const transformedData: MaterialItem[] = data.data.map(item => ({
          material_id: item.material_id,
          title: item.title,
          color: item.color,
          quantity_total: parseFloat(item.quantity_total) || 0,
          lowest_quantity_needed: parseFloat(item.lowest_quantity_needed) || 0,
          medium_quantity_needed: parseFloat(item.medium_quantity_needed) || 0,
          good_quantity_needed: parseFloat(item.good_quantity_needed) || 0,
          status: item.status || "good",
          progress_percentage: item.progress_percentage || 0,
          materiere_type: item.materiere_type || "intern",
          extern_customer_id: item.extern_customer_id,
        }));
        
        setMaterials(transformedData);
        setFilteredMaterials(transformedData);
        
        toast({
          title: "Données chargées",
          description: `${transformedData.length} matières chargées`,
        });
      } else {
        throw new Error('Invalid data format received from API');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des matières:', error);
      setMaterials([]);
      setFilteredMaterials([]);
      
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les données depuis l'API",
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

  const handleRefresh = async () => {
    await fetchMaterials();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="actions-container">
          <div className="page-header">
            <h1 className="page-title">Vue Globale</h1>
            <p className="page-description">Chargement des données...</p>
          </div>
        </div>
        <Card className="modern-card">
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-lg font-medium">Chargement des matières</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="actions-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Vue Globale</h1>
            <p className="page-description">
              Aperçu visuel de tous les niveaux de stock
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className="rounded-xl text-xs sm:text-sm px-2 sm:px-3"
            >
              Tous ({materials.length})
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setStatusFilter("critical")}
              className="rounded-xl text-xs sm:text-sm px-2 sm:px-3"
            >
              Critique ({materials.filter(m => m.status === "critical").length})
            </Button>
            <Button
              variant={statusFilter === "warning" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("warning")}
              className={`rounded-xl text-xs sm:text-sm px-2 sm:px-3 ${statusFilter === "warning" ? "bg-yellow-600 text-white" : "text-yellow-600 border-yellow-200 hover:bg-yellow-50"}`}
            >
              Faible ({materials.filter(m => m.status === "warning").length})
            </Button>
            <Button
              variant={statusFilter === "good" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("good")}
              className={`rounded-xl text-xs sm:text-sm px-2 sm:px-3 ${statusFilter === "good" ? "bg-green-600 text-white" : "text-green-600 border-green-200 hover:bg-green-50"}`}
            >
              Bon ({materials.filter(m => m.status === "good").length})
            </Button>
          </div>
          <Button 
            onClick={() => setMateriereTypeFilter(materiereTypeFilter === "extern" ? "all" : "extern")}
            variant="outline" 
            size="sm" 
            className={`rounded-xl ${
              materiereTypeFilter === "extern" 
                ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white border-orange-500 hover:bg-orange-600" 
                : "text-orange-600 border-orange-200 hover:bg-orange-50"
            }`}
          >
            Stock Extern ({materials.filter(m => m.materiere_type === "extern").length})
          </Button>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="rounded-xl">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher une matière ou couleur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>
      
      {/* Materials Grid - Mobile Optimized: 2 cols on mobile, more on larger screens */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
        {filteredMaterials.map((material) => (
          <Card 
            key={material.material_id} 
            className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02] flex flex-col min-h-[140px] sm:min-h-[160px] md:min-h-[180px]"
            onClick={() => navigate(`/material-details/${material.material_id}`)}
          >
            <CardContent className="p-2 sm:p-3 text-center flex flex-col h-full">
              {/* Material Name - compact on mobile */}
              <div className="mb-2 min-h-[2.5rem] sm:min-h-[3rem] flex flex-col justify-start">
                <h4 className="font-medium text-xs sm:text-sm leading-tight line-clamp-2 text-center mb-1" title={material.title}>
                  {material.title}
                </h4>
                {material.color && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1 text-center mt-auto">
                    {material.color}
                  </p>
                )}
              </div>
              
              {/* Progress Bar Container - smaller on mobile */}
              <div className="flex-1 flex flex-col items-center justify-center mb-2 relative">
                {/* Percentage floating above - moved down to center on progress bar */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                  <span className="text-[10px] sm:text-xs font-semibold text-foreground bg-background border border-border px-1.5 py-0.5 rounded-md shadow-sm">
                    {Math.round(material.progress_percentage)}%
                  </span>
                </div>
                
                {/* Progress bar - reduced width */}
                <div className="relative h-12 sm:h-16 md:h-20 w-4 sm:w-5 md:w-6 bg-muted rounded-lg overflow-hidden">
                  {/* Background bar */}
                  <div className="absolute bottom-0 w-full bg-secondary rounded-lg" style={{ height: '100%' }} />
                  
                  {/* Progress fill */}
                  <div 
                    className={`absolute bottom-0 w-full transition-all duration-500 rounded-lg ${getStatusColor(material.status)}`}
                    style={{ height: `${getProgressHeight(material.progress_percentage)}%` }}
                  />
                  
                  {/* Centered percentage text on the progress bar */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[8px] sm:text-[10px] font-medium text-white drop-shadow-sm">
                      {Math.round(material.progress_percentage)}%
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Stock Info - compact on mobile */}
              <div className="space-y-1 mt-auto">
                <p className="text-[10px] sm:text-xs font-medium">
                  {material.quantity_total}
                </p>
                <Badge 
                  variant={
                    material.status === "critical" ? "destructive" : 
                    material.status === "warning" ? "secondary" : "default"
                  } 
                  className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0"
                >
                  {material.status === "critical" ? "Critique" : 
                   material.status === "warning" ? "Faible" : "Bon"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredMaterials.length === 0 && materials.length > 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucune matière trouvée pour ce filtre</p>
          <Button 
            variant="outline" 
            onClick={() => setStatusFilter("all")} 
            className="mt-4"
          >
            Réinitialiser le filtre
          </Button>
        </div>
      )}
      
      {materials.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucune matière disponible</p>
        </div>
      )}
    </div>
  );
};

export default GlobalStockView;