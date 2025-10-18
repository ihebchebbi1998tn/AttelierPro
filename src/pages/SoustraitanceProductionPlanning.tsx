import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Play, AlertTriangle, CheckCircle, Info, Package, Image as ImageIcon, Settings } from 'lucide-react';

// Helper function to format numbers without unnecessary decimals
const formatNumber = (num: number): string => {
  return num % 1 === 0 ? num.toString() : num.toFixed(1);
};

interface SoustraitanceProduct {
  id: number;
  nom_product: string;
  reference_product: string;
  client_name: string;
  img_product?: string;
  price_product?: string;
  category_product?: string;
}

interface MaterialRequirement {
  material_name: string;
  material_color: string;
  quantity_unit: string;
  total_needed: number;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  stock_status: 'critical' | 'warning' | 'good';
  stock_percentage: number;
  is_sufficient: boolean;
  size_breakdown: {
    size: string;
    planned_pieces: number;
    material_per_piece: number;
    total_material_needed: number;
  }[];
}

interface ValidationResult {
  has_sufficient_stock: boolean;
  material_requirements: { [key: string]: MaterialRequirement };
  insufficient_materials: Array<{
    material_id: string;
    material_name: string;
    material_color: string;
    needed: number;
    available: number;
    missing: number;
    unit: string;
  }>;
  suggested_quantities: { [size: string]: number };
  planned_quantities: { [size: string]: number };
  can_produce_any: boolean;
  validation_warnings?: Array<{
    type: string;
    material: string;
    quantity: number;
    unit: string;
    message: string;
  }>;
}

const SoustraitanceProductionPlanning = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<SoustraitanceProduct | null>(null);
  const [configuredSizes, setConfiguredSizes] = useState<{ [type: string]: string[] }>({});
  const [hasNoSizes, setHasNoSizes] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [plannedQuantities, setPlannedQuantities] = useState<{ [size: string]: number }>({});
  const [productionNotes, setProductionNotes] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [validating, setValidating] = useState(false);

  const loadProductData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`https://luccibyey.com.tn/production/api/soustraitance_production_planning.php?product_id=${id}`);
      const data = await response.json();
      
      if (data.success) {
        setProduct(data.data.product);
        setConfiguredSizes(data.data.configured_sizes || {});
        const apiNoSizes = !!data.data.has_no_sizes || !!(data.data.configured_sizes?.no_sizes?.includes('none'));
        setHasNoSizes(apiNoSizes);
        
        // Initialize planned quantities
        const initialQuantities: { [size: string]: number } = {};
        if (apiNoSizes) {
          initialQuantities['none'] = 0; // UI key for no sizes
        } else {
          Object.values(data.data.configured_sizes || {}).flat().forEach((size: string) => {
            initialQuantities[String(size)] = 0;
          });
        }
        setPlannedQuantities(initialQuantities);
      } else {
        throw new Error(data.message || 'Erreur lors du chargement');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du produit",
        variant: "destructive",
      });
      navigate(`/soustraitance-products/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const validateProduction = async () => {
    if (!id) return;
    
    // Check if any quantities are set
    const totalPlanned = Object.values(plannedQuantities).reduce((sum, qty) => sum + qty, 0);
    if (totalPlanned === 0) {
      toast({
        title: "Attention",
        description: "Veuillez saisir au moins une quantité à produire",
        variant: "destructive",
      });
      return;
    }
    
    setValidating(true);
    try {
      // Prepare the planned quantities based on product configuration
      let quantities = plannedQuantities;
      
      // For products with no sizes, convert 'none' key to match material configuration
      if (hasNoSizes && plannedQuantities['none']) {
        quantities = { 'none': plannedQuantities['none'] };
      }
      
      console.log('Sending planned quantities:', quantities);
      
      const response = await fetch('https://luccibyey.com.tn/production/api/soustraitance_production_planning.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: parseInt(id),
          planned_quantities: quantities
        })
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Response text that failed to parse:', responseText);
        throw new Error('Server returned invalid JSON response');
      }
      
      console.log('Parsed response:', data);
      
      if (data.success) {
        setValidationResult(data.data);
        setShowValidationModal(true);
      } else {
        throw new Error(data.message || 'Erreur lors de la validation');
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de valider la production",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  const handleQuantityChange = (size: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setPlannedQuantities(prev => ({ ...prev, [size]: numValue }));
  };

  const applySuggestedQuantities = () => {
    if (validationResult?.suggested_quantities) {
      setPlannedQuantities(validationResult.suggested_quantities);
      setShowValidationModal(false);
      toast({
        title: "Quantités ajustées",
        description: "Les quantités ont été ajustées selon les stocks disponibles",
      });
    }
  };

  const startProduction = async () => {
    if (validationResult?.has_sufficient_stock) {
      try {
        setValidating(true);
        
        // Calculate total quantity to produce
        const totalQuantity = Object.values(plannedQuantities).reduce(
          (sum, qty) => sum + (typeof qty === 'string' ? parseInt(qty) || 0 : Number(qty) || 0), 
          0
        );
        
        if (totalQuantity === 0) {
          toast({
            title: "Erreur",
            description: "Veuillez saisir au moins une quantité à produire",
            variant: "destructive",
          });
          return;
        }
        
        // Create the production batch for soustraitance (stock deduction is now handled internally)
        const sizesBreakdown = JSON.stringify(plannedQuantities);
        
        const requestData = {
          action: 'start_soustraitance_production',
          product_id: typeof product?.id === 'string' ? parseInt(product.id) : Number(product?.id),
          quantity_to_produce: totalQuantity,
          sizes_breakdown: sizesBreakdown,
          user_id: 1,
          notes: productionNotes || `Production sous-traitance lancée pour ${product?.nom_product} - Client: ${product?.client_name}`,
          client_name: product?.client_name
        };
        
        console.log('Sending soustraitance production request:', requestData);
        
        const response = await fetch('https://luccibyey.com.tn/production/api/production_batches.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error response:', errorText);
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Production result:', result);
        
        if (result.success) {
          toast({
            title: "Production démarrée !",
            description: `Batch ${result.batch_reference} créé avec succès. Coût total: ${result.total_cost?.toFixed(2) || 0} TND`,
          });
          
          // Navigate to productions page to see the created batch
          navigate('/productions');
        } else {
          toast({
            title: "Erreur",
            description: result.message || "Erreur lors du démarrage de la production",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Erreur lors du démarrage de la production:', error);
        toast({
          title: "Erreur",
          description: error instanceof Error ? error.message : "Erreur de connexion lors du démarrage de la production",
          variant: "destructive",
        });
      } finally {
        setValidating(false);
      }
    }
  };

  useEffect(() => {
    loadProductData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Produit non trouvé</p>
          <Button onClick={() => navigate(`/soustraitance-products/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au produit
          </Button>
        </div>
      </div>
    );
  }

  const totalPlanned = Object.values(plannedQuantities).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      {/* Professional Header */}
      <div className="bg-card/95 backdrop-blur-md border-b shadow-sm sticky top-0 z-50">
        <div className="container-responsive py-4 lg:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/soustraitance-products/${id}`)}
              className="hover:bg-accent shadow-sm shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Retour au Produit</span>
              <span className="sm:hidden">Retour</span>
            </Button>
            <Separator orientation="vertical" className="hidden sm:block h-8" />
            <div className="page-header flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg shrink-0">
                  <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-foreground tracking-tight truncate">
                    Planification Production
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    Configurez les quantités et validez les matériaux
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-responsive py-8 lg:py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Enhanced Product Info Card */}
          <Card className="modern-card overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                Produit Sous-traitance à Produire
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Product Image */}
                <div className="lg:col-span-1">
                  <div className="aspect-square rounded-xl overflow-hidden bg-accent/20 border-2 border-dashed border-border flex items-center justify-center">
                    {product.img_product ? (
                      <img 
                        src={`https://luccibyey.com.tn/production/api/${product.img_product}`}
                        alt={product.nom_product}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={product.img_product ? 'hidden' : 'text-center p-4'}>
                      <ImageIcon className="h-8 sm:h-12 w-8 sm:w-12 mx-auto text-muted-foreground/40 mb-2 sm:mb-3" />
                      <p className="text-xs sm:text-sm text-muted-foreground">Image non disponible</p>
                    </div>
                  </div>
                </div>
                
                {/* Product Details */}
                <div className="lg:col-span-3 space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Nom du Produit
                      </Label>
                      <p className="text-base sm:text-lg font-medium text-foreground break-words">{product.nom_product}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Référence
                      </Label>
                      <p className="text-sm sm:text-base font-mono font-medium text-foreground bg-accent/30 px-2 sm:px-3 py-1 rounded-md inline-block break-all">
                        {product.reference_product}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Client Sous-traitance
                      </Label>
                      <Badge 
                        className="text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 bg-secondary/50 text-secondary-foreground border-secondary inline-block"
                      >
                        {product.client_name}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Production Planning Section */}
          <Card className="modern-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <Settings className="h-5 w-5 text-accent-foreground" />
                </div>
                Configuration des Quantités à Produire
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {hasNoSizes ? (
                /* No sizes - single quantity input */
                <div className="space-y-4">
                  <div className="text-center p-4 sm:p-6 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <Package className="h-6 sm:h-8 w-6 sm:w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2 sm:mb-3" />
                    <h3 className="text-base sm:text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">Produit sans tailles spécifiques</h3>
                    <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-300 mb-4">
                      Ce produit ne nécessite pas de tailles particulières (accessoire, bijou, etc.)
                    </p>
                    <div className="max-w-xs mx-auto">
                      <Label htmlFor="none-quantity" className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">
                        Quantité à produire
                      </Label>
                      <Input
                        id="none-quantity"
                        type="number"
                        min="0"
                        value={plannedQuantities['none'] || 0}
                        onChange={(e) => handleQuantityChange('none', e.target.value)}
                        className="mt-2 text-center font-semibold text-base sm:text-lg border-blue-300 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-400"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Size-specific inputs */
                <div className="space-y-4 sm:space-y-6">
                  <div className="text-center p-3 sm:p-4 bg-accent/10 rounded-lg border border-accent/20">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">Configuration par Tailles</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Définissez combien de pièces produire pour chaque taille configurée
                    </p>
                  </div>
                  
                  {Object.entries(configuredSizes).map(([sizeType, sizes]) => (
                    <div key={sizeType} className="space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary shrink-0"></div>
                        <h4 className="text-sm sm:text-base font-semibold text-foreground capitalize">
                          {sizeType === 'clothing' ? 'Vêtements' : 
                           sizeType === 'numeric_pants' ? 'Pantalons (Tailles numériques)' :
                           sizeType === 'shoes' ? 'Chaussures' :
                           sizeType === 'belts' ? 'Ceintures' : sizeType}
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4 pl-3 sm:pl-5">
                        {sizes.map((size) => (
                          <div key={size} className="space-y-1.5 sm:space-y-2">
                            <Label htmlFor={`size-${size}`} className="text-xs sm:text-sm font-medium text-muted-foreground">
                              Taille {size}
                            </Label>
                            <Input
                              id={`size-${size}`}
                              type="number"
                              min="0"
                              value={plannedQuantities[size] || 0}
                              onChange={(e) => handleQuantityChange(size, e.target.value)}
                              className="text-center font-medium text-sm sm:text-base h-9 sm:h-10"
                              placeholder="0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Production Notes */}
              <div className="mt-6 pt-6 border-t border-border">
                <Label htmlFor="production-notes" className="text-sm sm:text-base font-medium mb-2 block">
                  Notes de production (optionnel)
                </Label>
                <textarea
                  id="production-notes"
                  value={productionNotes}
                  onChange={(e) => setProductionNotes(e.target.value)}
                  className="w-full min-h-[100px] p-3 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ajoutez des instructions ou notes spécifiques pour cette production..."
                />
              </div>

              {/* Summary */}
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3 sm:p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg shrink-0">
                      <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total à produire</p>
                      <p className="text-xl sm:text-2xl font-bold text-foreground">{totalPlanned} pièces</p>
                    </div>
                  </div>
                  <Button
                    onClick={validateProduction}
                    disabled={totalPlanned === 0 || validating}
                    size="lg"
                    className="flex items-center justify-center gap-2 shadow-lg w-full sm:w-auto"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">{validating ? 'Validation...' : 'Valider la Production'}</span>
                    <span className="sm:hidden">{validating ? 'Validation...' : 'Valider'}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Validation Results Modal */}
      <Dialog open={showValidationModal} onOpenChange={setShowValidationModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl lg:max-w-6xl max-h-[90vh] overflow-hidden p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg lg:text-xl">
              {validationResult?.has_sufficient_stock ? (
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 shrink-0" />
              )}
              <span className="truncate">Résultats de la Validation</span>
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[70vh] space-y-4 sm:space-y-6">
            {validationResult && (
              <div className="space-y-4 sm:space-y-6">
                {/* Stock Status Overview */}
                <Card className={validationResult.has_sufficient_stock ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                      {validationResult.has_sufficient_stock ? (
                        <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 shrink-0 mt-0.5 sm:mt-0" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base lg:text-lg">
                          {validationResult.has_sufficient_stock ? 'Stock Suffisant ✓' : 'Stock Insuffisant ⚠️'}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {validationResult.has_sufficient_stock 
                            ? 'Tous les matériaux nécessaires sont disponibles en stock'
                            : `${validationResult.insufficient_materials.length} matériau(x) en quantité insuffisante`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Material Requirements Details */}
                {Object.entries(validationResult.material_requirements).map(([materialId, requirement]) => (
                  <Card key={materialId} className={requirement.is_sufficient ? "border-green-200" : "border-red-200"}>
                    <CardHeader className="pb-3 p-3 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm sm:text-base lg:text-lg truncate">{requirement.material_name}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{requirement.material_color}</p>
                        </div>
                        <Badge variant={requirement.is_sufficient ? "default" : "destructive"} className="text-xs sm:text-sm self-start sm:self-auto shrink-0">
                          {requirement.is_sufficient ? "✓ Suffisant" : "⚠️ Insuffisant"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Stock Actuel</Label>
                          <p className="font-semibold text-sm sm:text-base">{formatNumber(requirement.current_stock)} {requirement.quantity_unit}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Quantité Nécessaire</Label>
                          <p className="font-semibold text-sm sm:text-base">{formatNumber(requirement.total_needed)} {requirement.quantity_unit}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Statut Stock</Label>
                          <Badge variant={
                            requirement.stock_status === 'good' ? 'default' : 
                            requirement.stock_status === 'warning' ? 'secondary' : 'destructive'
                          } className="text-xs">
                            {requirement.stock_status === 'good' ? 'Bon' : 
                             requirement.stock_status === 'warning' ? 'Faible' : 'Critique'}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <Label className="text-xs sm:text-sm font-medium">Progression du stock utilisé</Label>
                        <Progress value={Math.min(100, requirement.stock_percentage)} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(requirement.stock_percentage)}% du stock actuel sera utilisé
                        </p>
                      </div>

                      {requirement.size_breakdown.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs sm:text-sm font-medium">Détail par taille</Label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {requirement.size_breakdown.map((sizeDetail, idx) => (
                              <div key={idx} className="p-2 bg-muted rounded text-center">
                                <p className="text-xs sm:text-sm font-medium">{sizeDetail.size}</p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
                                  {sizeDetail.planned_pieces} × {formatNumber(sizeDetail.material_per_piece)} = {formatNumber(sizeDetail.total_material_needed)} {requirement.quantity_unit}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {/* Suggested Quantities if stock insufficient */}
                {!validationResult.has_sufficient_stock && validationResult.can_produce_any && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader className="p-3 sm:p-6">
                      <CardTitle className="flex items-center gap-2 text-blue-800 text-sm sm:text-base">
                        <Info className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                        <span>Quantités Suggérées</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6">
                      <p className="text-xs sm:text-sm text-blue-600 mb-3 sm:mb-4">
                        Quantités maximales réalisables avec le stock actuel:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                        {Object.entries(validationResult.suggested_quantities).map(([size, quantity]) => (
                          <div key={size} className="p-2 sm:p-3 bg-white rounded border text-center">
                            <p className="text-xs sm:text-sm font-medium text-blue-800 truncate">Taille {size}</p>
                            <p className="text-base sm:text-lg font-bold text-blue-600">{quantity} pièces</p>
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={applySuggestedQuantities}
                        variant="outline"
                        size="sm"
                        className="mt-3 sm:mt-4 border-blue-300 text-blue-700 hover:bg-blue-100 w-full sm:w-auto text-xs sm:text-sm"
                      >
                        Appliquer ces quantités
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Warnings */}
                {validationResult.validation_warnings && validationResult.validation_warnings.length > 0 && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-amber-800">
                        <AlertTriangle className="h-5 w-5" />
                        Avertissements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {validationResult.validation_warnings.map((warning, idx) => (
                          <div key={idx} className="p-3 bg-amber-100 rounded border border-amber-200">
                            <p className="text-sm text-amber-800">{warning.message}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowValidationModal(false)}
              size="lg"
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              <span className="hidden sm:inline">Modifier les Quantités</span>
              <span className="sm:hidden">Modifier</span>
            </Button>
            {validationResult?.has_sufficient_stock && (
              <Button 
                onClick={() => setShowConfirmationModal(true)} 
                size="lg"
                className="w-full sm:w-auto bg-success hover:bg-success/90 text-success-foreground flex items-center justify-center gap-2 shadow-lg order-1 sm:order-2"
              >
                <Play className="h-4 w-4" />
                <span className="hidden sm:inline">Démarrer la Production</span>
                <span className="sm:hidden">Démarrer</span>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmationModal} onOpenChange={setShowConfirmationModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg lg:text-xl text-foreground">
              <div className="p-1.5 sm:p-2 bg-warning/20 rounded-lg shrink-0">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
              </div>
              <span className="truncate">Confirmation de Production</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              Le démarrage de la production va déduire les matériaux suivants du stock :
            </p>
            
            <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-60 overflow-y-auto">
              {validationResult && validationResult.material_requirements && 
                Object.entries(validationResult.material_requirements).map(([materialId, material]: [string, any]) => (
                  <div key={materialId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 sm:p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs sm:text-sm truncate">{material.material_name}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground truncate">{material.material_color}</div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="font-semibold text-warning text-xs sm:text-sm">
                        -{material.total_needed} {material.quantity_unit}
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">
                        Stock restant: {(material.current_stock - material.total_needed).toFixed(1)} {material.quantity_unit}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>

            <div className="text-center text-xs sm:text-sm text-muted-foreground border-t pt-3">
              Cette action est irréversible. Êtes-vous sûr de vouloir continuer ?
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmationModal(false)}
              size="lg"
              className="w-full sm:flex-1 order-2 sm:order-1"
            >
              Annuler
            </Button>
            <Button 
              onClick={() => {
                setShowConfirmationModal(false);
                startProduction();
              }} 
              size="lg"
              className="w-full sm:flex-1 bg-success hover:bg-success/90 text-success-foreground flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              <Play className="h-4 w-4" />
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SoustraitanceProductionPlanning;
