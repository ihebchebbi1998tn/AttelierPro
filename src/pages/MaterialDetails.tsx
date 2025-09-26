import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import materialPlaceholder from "@/assets/material-placeholder.png";
import { 
  ArrowLeft,
  Package2,
  Calendar,
  User,
  Clock,
  Edit,
  History,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Trash2
} from "lucide-react";
import StockAdjustment from "@/components/StockAdjustment";

interface MaterialDetails {
  material_id: number;
  reference?: string;
  title: string;
  color?: string;
  laize?: string;
  price?: number;
  quantity_type: string;
  quantity_total: number;
  lowest_quantity_needed: number;
  medium_quantity_needed: number;
  good_quantity_needed: number;
  location?: "Usine" | "Lucci By Ey";
  category_name?: string;
  supplier_name?: string;
  materiere_type?: "intern" | "extern";
  extern_customer_id?: number;
  customer_name?: string;
  status: "critical" | "warning" | "good";
  progress_percentage: number;
  is_replacable: boolean;
  replacable_material_id?: number;
  replacement_material?: {
    title: string;
    reference?: string;
    color?: string;
  };
  other_attributes?: any;
  image_url?: string;
  created_user: number;
  modified_user: number;
  created_date: string;
  modified_date: string;
  total_entries: number;
  total_exits: number;
  last_entry_date?: string;
  last_exit_date?: string;
}

const MaterialDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [material, setMaterial] = useState<MaterialDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchMaterialDetails(parseInt(id));
    }
  }, [id]);

  const handleStockUpdated = () => {
    // Refresh material details when stock is updated
    if (id) {
      fetchMaterialDetails(parseInt(id));
    }
  };

  const fetchMaterialDetails = async (materialId: number) => {
    try {
      setLoading(true);
      console.log("🔍 Fetching material details for ID:", materialId);
      
      const response = await fetch(`https://luccibyey.com.tn/production/api/matieres.php?id=${materialId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("📦 Material Details API Response:", data);
      
      if (data.success && data.data) {
        // Transform API data to match our interface
        const materialData = data.data;
        console.log("🔧 Raw material data:", materialData);
        
        // Fetch replacement material if exists
        let replacementMaterial = null;
        if (materialData.is_replacable === "1" && materialData.replacable_material_id) {
          try {
            console.log("🔍 Fetching replacement material ID:", materialData.replacable_material_id);
            const replacementResponse = await fetch(`https://luccibyey.com.tn/production/api/matieres.php?id=${materialData.replacable_material_id}`);
            if (replacementResponse.ok) {
              const replacementData = await replacementResponse.json();
              if (replacementData.success && replacementData.data) {
                replacementMaterial = {
                  title: replacementData.data.title,
                  reference: replacementData.data.reference,
                  color: replacementData.data.color
                };
                console.log("✅ Replacement material loaded:", replacementMaterial);
              }
            }
          } catch (error) {
            console.warn("⚠️ Failed to fetch replacement material:", error);
          }
        }
        
        const transformedMaterial: MaterialDetails = {
          material_id: parseInt(materialData.material_id),
          reference: materialData.reference,
          title: materialData.title,
          color: materialData.couleur,
          laize: materialData.laize,
          price: parseFloat(materialData.price) || 0,
          quantity_type: materialData.quantity_type,
          quantity_total: parseFloat(materialData.quantity_total) || 0,
          lowest_quantity_needed: parseFloat(materialData.lowest_quantity_needed) || 0,
          medium_quantity_needed: parseFloat(materialData.medium_quantity_needed) || 0,
          good_quantity_needed: parseFloat(materialData.good_quantity_needed) || 0,
          location: materialData.location || "Usine",
          category_name: materialData.category_name,
          supplier_name: materialData.supplier_name,
          materiere_type: materialData.materiere_type,
          extern_customer_id: materialData.extern_customer_id ? parseInt(materialData.extern_customer_id) : undefined,
          customer_name: materialData.customer_name,
          status: materialData.status || "good",
          progress_percentage: materialData.progress_percentage || 0,
          is_replacable: materialData.is_replacable === "1",
          replacable_material_id: materialData.replacable_material_id ? parseInt(materialData.replacable_material_id) : undefined,
          replacement_material: replacementMaterial,
          other_attributes: materialData.other_attributes ? 
            (typeof materialData.other_attributes === 'string' ? 
              JSON.parse(materialData.other_attributes) : 
              materialData.other_attributes) : null,
          image_url: materialData.images && Array.isArray(materialData.images) && materialData.images.length > 0 
            ? `https://luccibyey.com.tn/production/api/${materialData.images[0].file_path}` 
            : undefined,
          created_user: 1, // Default user since API doesn't provide this field
          modified_user: 1, // Default user since API doesn't provide this field  
          created_date: materialData.created_at,
          modified_date: materialData.updated_at,
          total_entries: parseInt(materialData.total_entries) || 0,
          total_exits: parseInt(materialData.total_exits) || 0,
          last_entry_date: materialData.last_entry_date,
          last_exit_date: materialData.last_exit_date
        };
        
        console.log("✅ Transformed material data:", transformedMaterial);
        setMaterial(transformedMaterial);
        
        toast({
          title: "Matériau chargé",
          description: `Détails du matériau "${transformedMaterial.title}" chargés avec succès`,
        });
      } else {
        throw new Error('Material not found or invalid response');
      }
    } catch (error) {
      console.error("💥 Error fetching material details:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails du matériau",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case "good":
        return <CheckCircle className="h-5 w-5 text-success" />;
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
        return "Suffisant";
      default:
        return "";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Non disponible';
    try {
      return new Date(dateString).toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date invalide';
    }
  };

  const handleDelete = () => {
    toast({
      title: "Suppression",
      description: "Fonctionnalité de suppression à implémenter",
    });
  };

  const handleEdit = () => {
    toast({
      title: "Modification",
      description: "Fonctionnalité de modification à implémenter",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4"></div>
          <div className="grid gap-6">
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-48 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="text-center py-12">
        <Package2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold">Matériau non trouvé</h3>
        <p className="text-muted-foreground mb-4">
          Le matériau demandé n'existe pas ou a été supprimé.
        </p>
        <Button onClick={() => navigate('/stock')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au stock
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/stock')}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au stock
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{material.title}</h1>
          <p className="text-muted-foreground">
            Détails complets du matériau #{material.material_id}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/material-audit/${material.material_id}`)}>
            <History className="mr-2 h-4 w-4" />
            Journal des transactions
          </Button>
          <Button variant="outline" onClick={() => navigate(`/edit-material/${material.material_id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          <Button variant="outline" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Material Information */}
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package2 className="h-5 w-5" />
              Informations du matériau
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                <img 
                  src={material.image_url || materialPlaceholder}
                  alt={material.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    (e.target as HTMLImageElement).src = materialPlaceholder;
                  }}
                />
              </div>
              <Badge variant={getStatusBadgeVariant(material.status) as any} className="flex items-center gap-1">
                {getStatusIcon(material.status)}
                {getStatusLabel(material.status)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Référence</p>
                <p className="font-medium">{material.reference || "Non définie"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Couleur</p>
                <div className="flex items-center gap-2">
                  {material.color && material.color !== "Non spécifiée" ? (
                    <>
                      <div 
                        className="w-4 h-4 rounded-full border border-border shadow-sm"
                        style={{ backgroundColor: material.color }}
                        title={material.color}
                      />
                      <p className="font-medium">{material.color}</p>
                    </>
                  ) : (
                    <p className="font-medium text-muted-foreground">Non spécifiée</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Laize</p>
                <p className="font-medium">{material.laize || "Non spécifiée"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prix unitaire</p>
                <p className="font-medium">{material.price ? `${material.price.toFixed(2)} TND` : "Non défini"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emplacement</p>
                <Badge variant="outline" className="text-xs">
                  {material.location || "Non défini"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Type de quantité</p>
                <p className="font-medium">{material.quantity_type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fournisseur</p>
                <p className="font-medium">{material.supplier_name || "Non spécifié"}</p>
              </div>
              
              {material.materiere_type === "extern" && material.extern_customer_id && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Client Sous-traitance</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/clients-soustraitance/${material.extern_customer_id}`)}
                    className="h-auto py-2 px-3 text-sm font-medium"
                  >
                    <User className="mr-2 h-3 w-3" />
                    {material.customer_name || "Client externe"}
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">Niveaux de stock</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 rounded-lg bg-destructive/10">
                  <p className="font-medium text-destructive">Critique</p>
                  <p className="text-lg font-bold">{material.lowest_quantity_needed}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-warning/10">
                  <p className="font-medium text-warning">Moyen</p>
                  <p className="text-lg font-bold">{material.medium_quantity_needed}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-success/10">
                  <p className="font-medium text-success">Optimal</p>
                  <p className="text-lg font-bold">{material.good_quantity_needed}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Stock actuel</span>
                <span className="font-medium">{material.quantity_total} {material.quantity_type}</span>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                <div 
                  className={`h-full transition-all duration-300 ${
                    material.status === 'critical' ? 'bg-destructive' :
                    material.status === 'warning' ? 'bg-warning' :
                    'bg-success'
                  }`}
                  style={{ width: `${Math.min(material.progress_percentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {material.progress_percentage.toFixed(1)}% du niveau optimal
              </p>
            </div>

            {/* Stock Adjustment */}
            <div className="pt-4">
              <StockAdjustment
                materialId={material.material_id}
                currentStock={material.quantity_total}
                materialName={material.title}
                quantityType={material.quantity_type}
                onStockUpdated={handleStockUpdated}
              />
            </div>

            {material.is_replacable && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Package2 className="h-4 w-4" />
                    Matériau remplaçable
                  </h4>
                  {material.replacement_material ? (
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                        Ce matériau peut être substitué en cas de rupture de stock par:
                      </p>
                       <div className="flex items-center gap-2 flex-wrap">
                         <Badge variant="secondary" className="font-medium">
                           {material.replacement_material.title}
                         </Badge>
                         {material.replacement_material.reference && (
                           <span className="text-xs text-muted-foreground">
                             Réf: {material.replacement_material.reference}
                           </span>
                         )}
                         {material.replacement_material.color && (
                           <div className="flex items-center gap-1">
                             <div 
                               className="w-3 h-3 rounded-full border border-border shadow-sm"
                               style={{ backgroundColor: material.replacement_material.color }}
                               title={material.replacement_material.color}
                             />
                             <span className="text-xs text-muted-foreground">
                               {material.replacement_material.color}
                             </span>
                           </div>
                         )}
                       </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Ce matériau est marqué comme remplaçable mais aucun matériau de substitution n'est défini.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {material.other_attributes && Object.keys(material.other_attributes).length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium">Attributs supplémentaires</h4>
                  <div className="space-y-2">
                    {Object.entries(material.other_attributes).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground capitalize">{key}:</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Activity & Metadata */}
        <div className="space-y-6">
          {/* Transaction Summary */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Résumé des transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-success/10">
                  <p className="text-sm font-medium text-success">Entrées</p>
                  <p className="text-2xl font-bold">{material.total_entries}</p>
                  {material.last_entry_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Dernière: {formatDate(material.last_entry_date)}
                    </p>
                  )}
                </div>
                <div className="text-center p-4 rounded-lg bg-destructive/10">
                  <p className="text-sm font-medium text-destructive">Sorties</p>
                  <p className="text-2xl font-bold">{material.total_exits}</p>
                  {material.last_exit_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Dernière: {formatDate(material.last_exit_date)}
                    </p>
                  )}
                </div>
              </div>
              
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate(`/material-audit/${material.material_id}`)}
              >
                <History className="mr-2 h-4 w-4" />
                Voir toutes les transactions
              </Button>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Informations système
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Date de création</p>
                    <p className="text-sm text-muted-foreground">
                      {material.created_date ? formatDate(material.created_date) : 'Non disponible'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Créé par</p>
                    <p className="text-sm text-muted-foreground">Administrateur</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Dernière modification</p>
                    <p className="text-sm text-muted-foreground">
                      {material.modified_date ? formatDate(material.modified_date) : 'Non disponible'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Modifié par</p>
                    <p className="text-sm text-muted-foreground">Administrateur</p>
                  </div>
                </div>
              </div>

              {material.is_replacable && (
                <>
                  <Separator />
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Matériau remplaçable
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Ce matériau peut être substitué en cas de rupture de stock
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MaterialDetails;