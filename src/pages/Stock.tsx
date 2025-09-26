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
  BarChart3,
  Store,
  Building2,
  Globe
} from "lucide-react";


interface MaterialItem {
  material_id: number;
  reference?: string;
  title: string;
  color?: string;
  price?: number;
  quantity_type: string;
  quantity_total: number;
  lowest_quantity_needed: number;
  medium_quantity_needed: number;
  good_quantity_needed: number;
  location?: "spadadibattaglia" | "lucci by ey" | "extern";
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
  const [locationFilter, setLocationFilter] = useState("all");
  const [sortBy, setSortBy] = useState("quantity");
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
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
          price: parseFloat(item.price) || 0,
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
    let filtered = stockItems.filter(item =>
      (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.reference && item.reference.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (statusFilter !== "all") {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (materiereTypeFilter !== "all") {
      filtered = filtered.filter(item => item.materiere_type === materiereTypeFilter);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(item => item.category_id?.toString() === categoryFilter);
    }

    if (locationFilter !== "all") {
      filtered = filtered.filter(item => item.location === locationFilter);
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
        return a.title.localeCompare(b.title);
      } else if (sortBy === "status") {
        const statusOrder = { "critical": 0, "warning": 1, "good": 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return 0;
    });

    setFilteredItems(filtered);
  }, [stockItems, searchTerm, statusFilter, materiereTypeFilter, categoryFilter, locationFilter, sortBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const getProgressColor = (percentage: number, status: string) => {
    if (status === "critical") return "bg-destructive";
    if (status === "warning") return "bg-warning";
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
  const externCount = stockItems.filter(item => item.materiere_type === "extern").length;
  
  // Location counts
  const lucciCount = stockItems.filter(item => item.location === "lucci by ey").length;
  const spadaCount = stockItems.filter(item => item.location === "spadadibattaglia").length;
  const externLocationCount = stockItems.filter(item => item.location === "extern").length;
  
  // Get unique categories for filter
  const categories = Array.from(new Set(stockItems.filter(item => item.category_name).map(item => ({ 
    id: item.category_id, 
    name: item.category_name 
  }))));
  
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
                <p className="text-muted-foreground">Prix</p>
                <p className="font-medium">
                  {item.price ? `${item.price.toFixed(2)} TND` : '-'}
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
                <Badge variant={getStatusColor(item.status) as any} className="flex items-center gap-1 w-fit">
                  {getStatusIcon(item.status)}
                  {getStatusLabel(item.status)}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${item.status === 'critical' ? 'text-destructive' : ''}`}>
                  Niveau: {Math.min(item.progress_percentage, 100).toFixed(1)}%
                </span>
                <span className="text-muted-foreground">Min: {item.lowest_quantity_needed}</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div 
                  className={`h-full transition-all duration-300 ${getProgressColor(item.progress_percentage, item.status)}`}
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
      {/* Header */}
      <div className="actions-container">
        <div className="page-header">
          <h1 className="page-title">Gestion des Matières</h1>
          <p className="page-description">
            Surveillance en temps réel des niveaux de stock avec alertes intelligentes
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => navigate('/global-stock-view')} 
            variant="outline" 
            className="rounded-xl"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Vue Globale</span>
            <span className="sm:hidden">Vue</span>
          </Button>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" className="rounded-xl">
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
            <span className="sm:hidden">Maj</span>
          </Button>
          <Button 
            className="rounded-xl" 
            onClick={() => navigate('/add-material')}
          >
            <Package2 className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Ajouter une matière</span>
            <span className="sm:hidden">Ajouter</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid-stats">
        <Card 
          className={`border-0 shadow-lg bg-primary hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
            statusFilter === "all" ? "ring-2 ring-primary-foreground" : ""
          }`}
          onClick={() => setStatusFilter("all")}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-primary-foreground/70">Total Matières</p>
                <p className="text-2xl font-bold text-primary-foreground">{stockItems.length}</p>
                <p className="text-xs text-primary-foreground/70">Toutes catégories</p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                <Package2 className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`border-0 shadow-lg bg-primary hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
            statusFilter === "critical" ? "ring-2 ring-primary-foreground" : ""
          }`}
          onClick={() => setStatusFilter("critical")}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-primary-foreground/70">Stock Critique</p>
                <p className="text-2xl font-bold text-primary-foreground">{criticalCount}</p>
                <p className="text-xs text-primary-foreground/70">Réapprovisionnement urgent</p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`border-0 shadow-lg bg-primary hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
            statusFilter === "warning" ? "ring-2 ring-primary-foreground" : ""
          }`}
          onClick={() => setStatusFilter("warning")}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-primary-foreground/70">Stock Faible</p>
                <p className="text-2xl font-bold text-primary-foreground">{warningCount}</p>
                <p className="text-xs text-primary-foreground/70">À surveiller</p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
            materiereTypeFilter === "extern" ? "ring-2 ring-orange-300" : ""
          }`}
          onClick={() => setMateriereTypeFilter(materiereTypeFilter === "extern" ? "all" : "extern")}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-white/70">Stock Externe</p>
                <p className="text-2xl font-bold text-white">{externCount}</p>
                <p className="text-xs text-white/70">Matières externes</p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location Filter Cards */}
      <div className="grid-stats">
        <Card 
          className={`border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
            locationFilter === "lucci by ey" ? "ring-2 ring-blue-300" : ""
          }`}
          onClick={() => setLocationFilter(locationFilter === "lucci by ey" ? "all" : "lucci by ey")}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-white/70">Lucci By Ey</p>
                <p className="text-2xl font-bold text-white">{lucciCount}</p>
                <p className="text-xs text-white/70">Matières en boutique</p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Store className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
            locationFilter === "spadadibattaglia" ? "ring-2 ring-purple-300" : ""
          }`}
          onClick={() => setLocationFilter(locationFilter === "spadadibattaglia" ? "all" : "spadadibattaglia")}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-white/70">Spada di Battaglia</p>
                <p className="text-2xl font-bold text-white">{spadaCount}</p>
                <p className="text-xs text-white/70">Matières en boutique</p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
            locationFilter === "extern" ? "ring-2 ring-green-300" : ""
          }`}
          onClick={() => setLocationFilter(locationFilter === "extern" ? "all" : "extern")}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-white/70">Extern</p>
                <p className="text-2xl font-bold text-white">{externLocationCount}</p>
                <p className="text-xs text-white/70">Matières externes</p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une matière..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-auto sm:min-w-[200px] rounded-xl">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quantity">Quantité (Stock critique d'abord)</SelectItem>
              <SelectItem value="name">Nom (A-Z)</SelectItem>
              <SelectItem value="status">Statut</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-auto sm:min-w-[200px] rounded-xl">
              <SelectValue placeholder="Filtrer par catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id?.toString() || ""}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            className="w-full sm:w-auto rounded-xl text-sm"
            onClick={() => navigate('/categories')}
          >
            <Tag className="mr-2 h-3 w-3" />
            <span className="hidden sm:inline text-xs">Gérer catégories</span>
            <span className="sm:hidden text-xs">Cat.</span>
          </Button>
          
          {categoryFilter !== "all" && (
            <Button 
              variant="outline" 
              className="w-full sm:w-auto rounded-xl text-sm"
              onClick={clearCategoryFilter}
            >
              Effacer filtre
            </Button>
          )}
        </div>
      </div>

      {/* Materials List - Responsive */}
      {isMobile ? (
        // Mobile Card Layout
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <MobileCard key={item.material_id} item={item} />
          ))}
        </div>
      ) : (
        // Desktop Table Layout
        <Card className="modern-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="min-w-[200px]">Matière</TableHead>
                  <TableHead className="text-center min-w-[100px]">Référence</TableHead>
                  <TableHead className="text-center min-w-[100px]">Stock Actuel</TableHead>
                  <TableHead className="text-center min-w-[120px]">Niveau</TableHead>
                  <TableHead className="text-center min-w-[100px]">Prix</TableHead>
                  <TableHead className="text-center min-w-[120px]">Emplacement</TableHead>
                  <TableHead className="text-center min-w-[100px]">Statut</TableHead>
                  <TableHead className="text-center min-w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow 
                    key={item.material_id} 
                    className={getRowClassName(item.status, item.materiere_type)}
                    onClick={() => handleViewDetails(item.material_id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
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
                        <div className="space-y-1 min-w-0">
                          <p className="font-medium truncate">{item.title}</p>
                          <div className="flex items-center gap-2">
                            {item.color && (
                              <p className="text-sm text-muted-foreground">{item.color}</p>
                            )}
                            {item.category_name && (
                              <span className="text-xs text-muted-foreground">• {item.category_name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.reference ? (
                        <Badge variant="outline" className="text-xs">
                          {item.reference}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {item.quantity_total} {item.quantity_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Min: {item.lowest_quantity_needed}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-medium ${item.status === 'critical' ? 'text-destructive' : ''}`}>
                            {Math.min(item.progress_percentage, 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div 
                            className={`h-full transition-all duration-300 ${getProgressColor(item.progress_percentage, item.status)}`}
                            style={{ width: `${Math.min(item.progress_percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.price ? (
                        <p className="font-medium">{item.price.toFixed(2)} TND</p>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {item.location || "Non défini"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusColor(item.status) as any} className="flex items-center gap-1 justify-center w-fit mx-auto">
                        {getStatusIcon(item.status)}
                        {getStatusLabel(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-lg h-8 w-8 p-0"
                          onClick={() => handleViewDetails(item.material_id)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-lg h-8 w-8 p-0"
                          onClick={() => handleViewAudit(item.material_id)}
                        >
                          <History className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-lg h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(item.material_id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="empty-state">
          <Package2 className="empty-state-icon" />
          <h3 className="empty-state-title">Aucune matière trouvée</h3>
           <p className="empty-state-description">
             {searchTerm || statusFilter !== "all" || categoryFilter !== "all" || materiereTypeFilter !== "all" || locationFilter !== "all"
               ? "Aucune matière ne correspond à vos critères de recherche."
               : "Aucune matière n'est enregistrée dans le stock."
             }
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Pour confirmer la suppression de la matière, 
              veuillez saisir le mot de passe administrateur.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
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