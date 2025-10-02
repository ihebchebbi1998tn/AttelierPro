import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import materialPlaceholder from "@/assets/material-placeholder.png";
import { 
  Package2, 
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Eye,
  History,
  Filter,
  Trash2,
  Tag,
  BarChart3
} from "lucide-react";


interface MaterialItem {
  material_id: number;
  reference?: string;
  title: string;
  color?: string;
  laize?: string;
  quantity_type: string;
  quantity_total: number;
  lowest_quantity_needed: number;
  medium_quantity_needed: number;
  good_quantity_needed: number;
  location?: "Usine" | "Lucci By Ey" | "Spada";
  category_id?: number;
  category_name?: string;
  status: "critical" | "warning" | "good";
  progress_percentage: number;
  image_url?: string;
  created_date: string;
  modified_date: string;
  materiere_type?: "intern" | "extern";
  extern_customer_id?: number;
}

const Stock = () => {
  const [stockItems, setStockItems] = useState<MaterialItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MaterialItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [materiereTypeFilter, setMateriereTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize category filter from URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setCategoryFilter(categoryParam);
    }
  }, [searchParams]);
  
  // Fetch materials from API
  useEffect(() => {
    fetchMaterials();
  }, []);

  // Refresh materials when the page becomes visible (e.g., when navigating back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh the data
        fetchMaterials();
      }
    };

    const handleFocus = () => {
      // Window gained focus, refresh the data
      fetchMaterials();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://luccibyey.com.tn/production/api/matieres.php?stock_levels');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        // Transform API data to match our interface
        const transformedData: MaterialItem[] = data.data.map(item => ({
          material_id: item.material_id,
          reference: item.reference,
          title: item.title,
          color: item.color,
          laize: item.laize,
          quantity_type: item.quantity_type,
          quantity_total: parseFloat(item.quantity_total) || 0,
          lowest_quantity_needed: parseFloat(item.lowest_quantity_needed) || 0,
          medium_quantity_needed: parseFloat(item.medium_quantity_needed) || 0,
          good_quantity_needed: parseFloat(item.good_quantity_needed) || 0,
          location: item.location || "Usine",
          category_id: item.category_id,
          category_name: item.category_name || "",
          status: item.status || "good",
          progress_percentage: item.progress_percentage || 0,
          image_url: item.image_url || materialPlaceholder,
          created_date: item.created_date,
          modified_date: item.modified_date,
          materiere_type: item.materiere_type || "intern",
          extern_customer_id: item.extern_customer_id
        }));
        
        setStockItems(transformedData);
        setFilteredItems(transformedData);
        
        // Show success toast
        toast({
          title: "Données chargées",
          description: `${transformedData.length} matières chargées depuis l'API`,
        });
      } else {
        throw new Error('Invalid data format received from API');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des matières:', error);
      
      // Fallback to empty array or show error
      setStockItems([]);
      setFilteredItems([]);
      
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les données depuis l'API. Vérifiez votre connexion.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtering and sorting
  useEffect(() => {
    let filtered = stockItems.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      
      // If search term ends with space, treat it as exact name search
      if (searchTerm.endsWith(' ')) {
        const exactSearch = searchLower.trim();
        return (item.title && item.title.toLowerCase().startsWith(exactSearch)) ||
               (item.reference && item.reference.toLowerCase().startsWith(exactSearch));
      }
      
      // Normal search - contains
      return (item.title && item.title.toLowerCase().includes(searchLower)) ||
             (item.reference && item.reference.toLowerCase().includes(searchLower));
    });

    // Location filtering based on selected location
    if (selectedLocation && selectedLocation !== 'all') {
      if (selectedLocation === 'lucci') {
        filtered = filtered.filter(item => item.location === 'Lucci By Ey');
      } else if (selectedLocation === 'spada') {
        filtered = filtered.filter(item => item.location === 'Spada');
      } else if (selectedLocation === 'extern') {
        filtered = filtered.filter(item => item.materiere_type === 'extern');
      }
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (materiereTypeFilter !== "all") {
      filtered = filtered.filter(item => item.materiere_type === materiereTypeFilter);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(item => item.category_id?.toString() === categoryFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === "quantity") {
        // Priority sort: critical stock first, then by actual quantity (lowest first)
        const statusOrder = { "critical": 0, "warning": 1, "good": 2 };
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        
        if (statusDiff !== 0) {
          return statusDiff; // Sort by status priority first
        }
        
        // If same status, sort by actual quantity (lowest first for urgency)
        return a.quantity_total - b.quantity_total;
      } else if (sortBy === "name") {
        // Check if both titles are numbers for numeric sorting
        const aIsNumber = /^\d+$/.test(a.title.trim());
        const bIsNumber = /^\d+$/.test(b.title.trim());
        
        if (aIsNumber && bIsNumber) {
          return parseInt(a.title) - parseInt(b.title);
        }
        
        return a.title.localeCompare(b.title);
      } else if (sortBy === "status") {
        const statusOrder = { "critical": 0, "warning": 1, "good": 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return 0;
    });

    setFilteredItems(filtered);
  }, [stockItems, searchTerm, statusFilter, materiereTypeFilter, categoryFilter, sortBy, selectedLocation]);

  const getStatusColor = (item: MaterialItem) => {
    // Check if quantity exceeds max
    if (item.quantity_total > item.good_quantity_needed) {
      return "default"; // Will style as pink
    }
    
    switch (item.status) {
      case "critical":
        return "destructive";
      case "warning":
        return "warning";
      case "good":
        return "success";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "critical":
        return <AlertCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "good":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "critical":
        return "Critique";
      case "warning":
        return "Faible";
      case "good":
        return "Bon";
      default:
        return "";
    }
  };

  const getProgressColor = (item: MaterialItem) => {
    // Check if quantity exceeds max - show pink
    if (item.quantity_total > item.good_quantity_needed) return "bg-pink-500";
    
    if (item.status === "critical") return "bg-destructive";
    if (item.status === "warning") return "bg-warning";
    return "bg-success";
  };

  const getRowClassName = (status: string, materiereType?: string) => {
    const baseClass = "cursor-pointer transition-all duration-200";
    if (status === "critical") {
      return `${baseClass} bg-destructive-light/10 hover:bg-destructive-light/20 border-l-4 border-l-destructive`;
    }
    if (materiereType === "extern") {
      return `${baseClass} bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/20 dark:hover:bg-orange-900/30 border-l-4 border-l-orange-400`;
    }
    return `${baseClass} hover:bg-muted/50`;
  };

  const getMobileCardClassName = (status: string, materiereType?: string) => {
    const baseClass = "modern-card cursor-pointer transition-all duration-200";
    if (status === "critical") {
      return `${baseClass} bg-destructive-light/10 hover:bg-destructive-light/20 border-l-4 border-l-destructive shadow-sm hover:shadow-md`;
    }
    if (materiereType === "extern") {
      return `${baseClass} bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/20 dark:hover:bg-orange-900/30 border-l-4 border-l-orange-400 shadow-sm hover:shadow-md`;
    }
    return `${baseClass} hover:bg-muted/20`;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMaterials();
    setRefreshing(false);
    
    toast({
      title: "Données actualisées",
      description: "Le stock a été rechargé depuis l'API",
    });
  };

  const handleViewDetails = (materialId: number) => {
    navigate(`/material-details/${materialId}`);
  };

  const handleViewAudit = (materialId: number) => {
    navigate(`/material-audit/${materialId}`);
  };

  const handleDelete = (materialId: number) => {
    setSelectedMaterialId(materialId);
    setDeleteModalOpen(true);
    setDeletePassword("");
  };

  const confirmDelete = async () => {
    if (deletePassword !== "AdminDelete") {
      toast({
        title: "Mot de passe incorrect",
        description: "Le mot de passe saisi est incorrect.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedMaterialId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`https://luccibyey.com.tn/production/api/matieres.php?id=${selectedMaterialId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Matière supprimée",
          description: "La matière a été supprimée avec succès.",
        });
        
        // Refresh the materials list
        await fetchMaterials();
        
        // Close modal
        setDeleteModalOpen(false);
        setSelectedMaterialId(null);
        setDeletePassword("");
      } else {
        throw new Error(data.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur de suppression",
        description: "Impossible de supprimer la matière. Vérifiez qu'elle n'a pas de transactions associées.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const criticalCount = stockItems.filter(item => item.status === "critical").length;
  const warningCount = stockItems.filter(item => item.status === "warning").length;
  const goodCount = stockItems.filter(item => item.status === "good").length;
  const externCount = stockItems.filter(item => item.materiere_type === 'extern').length;
  
  // Get unique categories for filter
  const categoriesMap = new Map();
  stockItems.forEach(item => {
    if (item.category_id && item.category_name) {
      categoriesMap.set(item.category_id, {
        id: item.category_id,
        name: item.category_name
      });
    }
  });
  const categories = Array.from(categoriesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  
  // Clear category filter
  const clearCategoryFilter = () => {
    setCategoryFilter("all");
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.delete('category');
      return newParams;
    });
  };

  // Mobile Card Component
  const MobileCard = ({ item }: { item: MaterialItem }) => (
    <Card 
      className={getMobileCardClassName(item.status, item.materiere_type)}
      onClick={() => handleViewDetails(item.material_id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            <img 
              src={item.image_url || materialPlaceholder} 
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = materialPlaceholder;
              }}
              loading="lazy"
            />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-base line-clamp-1">{item.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                {item.reference && (
                  <Badge variant="outline" className="text-xs">
                    {item.reference}
                  </Badge>
                )}
                {item.color && (
                  <span className="text-sm text-muted-foreground">{item.color}</span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Stock</p>
                <p className="font-medium">{item.quantity_total} {item.quantity_type}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Laize</p>
                <p className="font-medium">
                  {item.laize || '-'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Lieu</p>
                <Badge variant="outline" className="text-xs w-fit">
                  {item.location || "Non défini"}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Statut</p>
                <Badge 
                  variant={getStatusColor(item) as any} 
                  className={`flex items-center gap-1 w-fit ${item.quantity_total > item.good_quantity_needed ? 'bg-pink-500 text-white hover:bg-pink-600' : ''}`}
                >
                  {getStatusIcon(item.status)}
                  {getStatusLabel(item.status)}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${item.status === 'critical' ? 'text-destructive' : item.quantity_total > item.good_quantity_needed ? 'text-pink-500' : ''}`}>
                  Niveau: {Math.min(item.progress_percentage, 100).toFixed(1)}%
                </span>
                <span className="text-muted-foreground">Min: {item.lowest_quantity_needed}</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div 
                  className={`h-full transition-all duration-300 ${getProgressColor(item)}`}
                  style={{ width: `${Math.min(item.progress_percentage, 100)}%` }}
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 h-8"
                onClick={() => handleViewDetails(item.material_id)}
              >
                <Eye className="mr-1 h-3 w-3" />
                Voir
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 h-8"
                onClick={() => handleViewAudit(item.material_id)}
              >
                <History className="mr-1 h-3 w-3" />
                Audit
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                onClick={() => handleDelete(item.material_id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="actions-container">
          <div className="page-header">
            <h1 className="page-title">Gestion des Matières</h1>
            <p className="page-description">
              Chargement des données depuis l'API...
            </p>
          </div>
        </div>
        <Card className="modern-card">
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-lg font-medium">Chargement du stock</p>
              <p className="text-muted-foreground">Récupération des données depuis https://luccibyey.com.tn/</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!selectedLocation ? (
        // Location Selection Cards
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
          {/* Header */}
          <div className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
            <div className="container mx-auto px-3 md:px-6 py-3 md:py-6">
              <div className="text-center">
                <h1 className="text-xl md:text-3xl font-bold text-foreground mb-1 md:mb-2">Gestion des Matières par Emplacement</h1>
                <p className="text-xs md:text-base text-muted-foreground">Sélectionnez un emplacement pour gérer les matières</p>
              </div>
            </div>
          </div>

          {/* Location Selection Cards */}
          <div className="container mx-auto px-3 md:px-6 py-6 md:py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
              {/* Lucci By Ey */}
              <Card 
                className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] overflow-hidden"
                onClick={() => setSelectedLocation('lucci')}
              >
                <CardHeader className="p-0">
                  <div className="relative h-32 md:h-48 overflow-hidden bg-white flex items-center justify-center">
                    <img 
                      src="/lucci-by-ey-logo.png"
                      alt="Lucci By Ey"
                      className="max-h-20 md:max-h-32 w-auto object-contain p-3 md:p-6 transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-3 md:p-4">
                  <CardTitle className="text-base md:text-lg font-bold text-center group-hover:text-primary transition-colors">
                    Lucci By Ey
                  </CardTitle>
                  <div className="text-center mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {stockItems.filter(item => item.location === 'Lucci By Ey').length} matières
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Spada di Battaglia */}
              <Card 
                className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] overflow-hidden"
                onClick={() => setSelectedLocation('spada')}
              >
                <CardHeader className="p-0">
                  <div className="relative h-32 md:h-48 overflow-hidden bg-white flex items-center justify-center">
                    <img 
                      src="/spada-di-battaglia-logo.png"
                      alt="Spada di Battaglia"
                      className="max-h-20 md:max-h-32 w-auto object-contain p-3 md:p-6 transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-3 md:p-4">
                  <CardTitle className="text-base md:text-lg font-bold text-center group-hover:text-primary transition-colors">
                    Spada di Battaglia
                  </CardTitle>
                   <div className="text-center mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {stockItems.filter(item => item.location === 'Spada').length} matières
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Extern */}
              <Card 
                className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] overflow-hidden"
                onClick={() => setSelectedLocation('extern')}
              >
                <CardHeader className="p-0">
                  <div className="relative h-32 md:h-48 overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                    <div className="text-center">
                      <Package2 className="h-10 w-10 md:h-16 md:w-16 text-white mx-auto mb-1 md:mb-2" />
                      <div className="text-white font-bold text-base md:text-xl">EXTERN</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 md:p-4">
                  <CardTitle className="text-base md:text-lg font-bold text-center group-hover:text-primary transition-colors">
                    Matières Externes
                  </CardTitle>
                  <div className="text-center mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {externCount} matières
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Tout Voir */}
              <Card 
                className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] overflow-hidden border-dashed border-2"
                onClick={() => setSelectedLocation('all')}
              >
                <CardContent className="p-4 md:p-6 flex flex-col items-center justify-center h-full">
                  <div className="text-center space-y-2 md:space-y-3">
                    <div className="h-12 w-12 md:h-16 md:w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Eye className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                    </div>
                    <CardTitle className="text-base md:text-lg font-bold group-hover:text-primary transition-colors">
                      Tout Voir
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {stockItems.length} matières total
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        // Stock Management Interface
        <div className="space-y-4 md:space-y-6 p-3 md:p-0">
          {/* Back Button and Header */}
          <div className="actions-container">
            <div className="page-header">
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedLocation(null)}
                  className="rounded-xl w-full md:w-auto text-xs md:text-sm"
                >
                  ← Retour
                </Button>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg md:text-3xl font-bold truncate">
                    {selectedLocation === 'lucci' ? 'Lucci By Ey' :
                     selectedLocation === 'spada' ? 'Spada di battaglia' :
                     selectedLocation === 'extern' ? 'Matières Externes' :
                     'Toutes les Matières'}
                  </h1>
                  <p className="text-xs md:text-base text-muted-foreground truncate">
                    Surveillance en temps réel des niveaux de stock
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 md:gap-2">
              <Button 
                onClick={() => navigate('/categories')} 
                variant="outline" 
                size="sm"
                className="rounded-xl flex-1 sm:flex-initial text-xs sm:text-sm h-9"
              >
                <Tag className="mr-1 h-4 w-4" />
                <span>Catégories</span>
              </Button>
              <Button 
                onClick={() => navigate('/global-stock-view')} 
                variant="outline" 
                size="sm"
                className="rounded-xl flex-1 sm:flex-initial text-xs sm:text-sm h-9"
              >
                <BarChart3 className="mr-1 h-4 w-4" />
                <span>Vue Globale</span>
              </Button>
              <Button 
                onClick={handleRefresh} 
                disabled={refreshing} 
                variant="outline" 
                size="sm"
                className="hidden sm:flex rounded-xl text-xs sm:text-sm h-9"
              >
                <RefreshCw className={`mr-1 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </Button>
              <Button 
                className="rounded-xl flex-1 sm:flex-initial text-xs sm:text-sm h-9" 
                size="sm"
                onClick={() => navigate('/add-material')}
              >
                <Package2 className="mr-1 h-4 w-4" />
                <span>Ajouter</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid-stats">
            <Card 
              className={`border-0 shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 ${
                statusFilter === "all" 
                  ? "bg-green-600 hover:bg-green-700 ring-2 ring-green-400" 
                  : "bg-primary hover:shadow-xl hover:bg-primary/90"
              }`}
              onClick={() => setStatusFilter("all")}
            >
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-xs sm:text-sm font-medium text-primary-foreground/70">Total Matières</p>
                    <p className="text-xl sm:text-2xl font-bold text-primary-foreground">{filteredItems.length}</p>
                    <p className="text-[10px] sm:text-xs text-primary-foreground/70">Dans cette section</p>
                  </div>
                  <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                    <Package2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`border-0 shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 ${
                statusFilter === "critical" 
                  ? "bg-green-600 hover:bg-green-700 ring-2 ring-green-400" 
                  : "bg-primary hover:shadow-xl hover:bg-primary/90"
              }`}
              onClick={() => setStatusFilter("critical")}
            >
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-xs sm:text-sm font-medium text-primary-foreground/70">Stock Critique</p>
                    <p className="text-xl sm:text-2xl font-bold text-primary-foreground">{filteredItems.filter(item => item.status === "critical").length}</p>
                    <p className="text-[10px] sm:text-xs text-primary-foreground/70">Réapprovisionnement urgent</p>
                  </div>
                  <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`border-0 shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 ${
                statusFilter === "warning" 
                  ? "bg-green-600 hover:bg-green-700 ring-2 ring-green-400" 
                  : "bg-primary hover:shadow-xl hover:bg-primary/90"
              }`}
              onClick={() => setStatusFilter("warning")}
            >
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-xs sm:text-sm font-medium text-primary-foreground/70">Stock Faible</p>
                    <p className="text-xl sm:text-2xl font-bold text-primary-foreground">{filteredItems.filter(item => item.status === "warning").length}</p>
                    <p className="text-[10px] sm:text-xs text-primary-foreground/70">À surveiller</p>
                  </div>
                  <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`border-0 shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 ${
                statusFilter === "good" 
                  ? "bg-green-600 hover:bg-green-700 ring-2 ring-green-400" 
                  : "bg-primary hover:shadow-xl hover:bg-primary/90"
              }`}
              onClick={() => setStatusFilter("good")}
            >
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-xs sm:text-sm font-medium text-primary-foreground/70">Stock Bon</p>
                    <p className="text-xl sm:text-2xl font-bold text-primary-foreground">{filteredItems.filter(item => item.status === "good").length}</p>
                    <p className="text-[10px] sm:text-xs text-primary-foreground/70">Niveau optimal</p>
                  </div>
                  <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="modern-card">
            <CardContent className="p-3 md:p-6">
              <div className="flex flex-col gap-3 md:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 md:h-4 md:w-4" />
                  <Input
                    placeholder="Rechercher une matière..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 md:pl-10 rounded-xl text-xs md:text-sm h-9 md:h-10"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Select value={materiereTypeFilter} onValueChange={setMateriereTypeFilter}>
                    <SelectTrigger className="w-[110px] md:w-[140px] rounded-xl text-xs md:text-sm h-9 md:h-10">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous types</SelectItem>
                      <SelectItem value="intern">Interne</SelectItem>
                      <SelectItem value="extern">Externe</SelectItem>
                    </SelectContent>
                  </Select>

                  {categories.length > 0 && (
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-[120px] md:w-[150px] rounded-xl text-xs md:text-sm h-9 md:h-10">
                        <SelectValue placeholder="Catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id?.toString() || ''}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[100px] md:w-[120px] rounded-xl text-xs md:text-sm h-9 md:h-10">
                      <SelectValue placeholder="Trier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quantity">Stock</SelectItem>
                      <SelectItem value="name">Nom</SelectItem>
                      <SelectItem value="status">Statut</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {(categoryFilter !== "all" || materiereTypeFilter !== "all") && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setCategoryFilter("all");
                        setMateriereTypeFilter("all");
                        clearCategoryFilter();
                      }}
                      className="rounded-xl text-xs h-9"
                    >
                      <Filter className="mr-1 h-3 w-3" />
                      Effacer
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Materials List */}
          {isMobile ? (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <MobileCard key={item.material_id} item={item} />
              ))}
              {filteredItems.length === 0 && (
                <Card className="modern-card">
                  <CardContent className="text-center p-8">
                    <Package2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucune matière trouvée</h3>
                    <p className="text-muted-foreground">
                      Aucune matière ne correspond à vos critères de recherche.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="modern-card">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-0 bg-muted/30">
                      <TableHead className="w-16 rounded-tl-xl">Image</TableHead>
                      <TableHead>Matière</TableHead>
                      <TableHead className="text-center">Stock Actuel</TableHead>
                      <TableHead className="text-center">Statut</TableHead>
                      <TableHead className="text-center">Laize</TableHead>
                      <TableHead className="text-center">Lieu</TableHead>
                      <TableHead className="text-center rounded-tr-xl">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item, index) => (
                      <TableRow 
                        key={item.material_id} 
                        className={getRowClassName(item.status, item.materiere_type)}
                        onClick={() => handleViewDetails(item.material_id)}
                      >
                        <TableCell>
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                            <img 
                              src={item.image_url || materialPlaceholder} 
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = materialPlaceholder;
                              }}
                              loading="lazy"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-semibold text-sm">{item.title}</div>
                            <div className="flex items-center gap-2">
                              {item.reference && (
                                <Badge variant="outline" className="text-xs">
                                  {item.reference}
                                </Badge>
                              )}
                              {item.color && (
                                <span className="text-xs text-muted-foreground">{item.color}</span>
                              )}
                              {item.materiere_type === "extern" && (
                                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                  <Tag className="mr-1 h-3 w-3" />
                                  Externe
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="space-y-2">
                            <div className="font-bold text-sm">
                              {item.quantity_total} {item.quantity_type}
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <div className="relative h-2 w-20 overflow-hidden rounded-full bg-secondary">
                                <div 
                                  className={`h-full transition-all duration-300 ${getProgressColor(item)}`}
                                  style={{ width: `${Math.min(item.progress_percentage, 100)}%` }}
                                />
                              </div>
                              <span className={`text-xs font-medium ${item.status === 'critical' ? 'text-destructive' : item.quantity_total > item.good_quantity_needed ? 'text-pink-500' : ''}`}>
                                {Math.min(item.progress_percentage, 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Min: {item.lowest_quantity_needed}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={getStatusColor(item) as any} 
                            className={`flex items-center gap-1 w-fit mx-auto ${item.quantity_total > item.good_quantity_needed ? 'bg-pink-500 text-white hover:bg-pink-600' : ''}`}
                          >
                            {getStatusIcon(item.status)}
                            {getStatusLabel(item.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {item.laize || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs">
                            {item.location || "Non défini"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => handleViewDetails(item.material_id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => handleViewAudit(item.material_id)}
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(item.material_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center gap-4">
                            <Package2 className="h-12 w-12 text-muted-foreground" />
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold">Aucune matière trouvée</h3>
                              <p className="text-muted-foreground">
                                Aucune matière ne correspond à vos critères de recherche.
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-destructive">Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. La matière sera définitivement supprimée de la base de données.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="deletePassword" className="text-sm font-medium">
                Mot de passe administrateur
              </label>
              <Input
                id="deletePassword"
                type="password"
                placeholder="Saisir le mot de passe..."
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedMaterialId(null);
                  setDeletePassword("");
                }}
                disabled={isDeleting}
                className="rounded-xl"
              >
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
                disabled={isDeleting || !deletePassword}
                className="rounded-xl"
              >
                {isDeleting ? "Suppression..." : "Confirmer la suppression"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Stock;