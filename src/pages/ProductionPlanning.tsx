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
import { getProductImageUrl } from "@/utils/imageUtils";

// Helper function to format numbers without unnecessary decimals
const formatNumber = (num: number): string => {
  return num % 1 === 0 ? num.toString() : num.toFixed(1);
};

interface Product {
  id: number;
  nom_product: string;
  reference_product: string;
  boutique_origin: string;
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

const ProductionPlanning = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [configuredSizes, setConfiguredSizes] = useState<{ [type: string]: string[] }>({});
  const [hasNoSizes, setHasNoSizes] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [plannedQuantities, setPlannedQuantities] = useState<{ [size: string]: number }>({});
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [validating, setValidating] = useState(false);

  const loadProductData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`https://luccibyey.com.tn/production/api/production_planning.php?product_id=${id}`);
      const data = await response.json();
      
      if (data.success) {
        setProduct(data.data.product);
        setConfiguredSizes(data.data.configured_sizes || {});
        const apiNoSizes = !!data.data.has_no_sizes || !!(data.data.configured_sizes?.no_sizes?.includes('none'));
        setHasNoSizes(apiNoSizes);
        
        // Initialize planned quantities from existing production_quantities
        const initialQuantities: { [size: string]: number } = {};
        
        // Try to parse existing production quantities
        let existingQuantities: { [size: string]: number } = {};
        if (data.data.product.production_quantities) {
          try {
            existingQuantities = JSON.parse(data.data.product.production_quantities);
          } catch (e) {
            console.warn('Failed to parse production_quantities:', e);
          }
        }
        
        if (apiNoSizes) {
          initialQuantities['none'] = existingQuantities['none'] || 0;
        } else {
          Object.values(data.data.configured_sizes || {}).flat().forEach((size: string) => {
            initialQuantities[String(size)] = existingQuantities[String(size)] || 0;
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
      navigate(`/produits/${id}`);
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
        // For no-sizes products, we need to match the actual size_specific from the material configuration
        // Instead of hardcoding 's', we should use 'none' or check what the material config expects
        quantities = { 'none': plannedQuantities['none'] };
      }
      
      console.log('Sending planned quantities:', quantities);
      
      const response = await fetch('https://luccibyey.com.tn/production/api/production_planning.php', {
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
      console.log('Response headers:', response.headers);
      
      // Check if response is OK
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      // Get response text first to debug
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      // Try to parse JSON
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
        
        // First, deduct materials from stock
        const deductionData = {
          action: 'deduct_stock_production',
          product_id: typeof product?.id === 'string' ? parseInt(product.id) : Number(product?.id),
          planned_quantities: plannedQuantities,
          user_id: 1 // Default user ID - should be from auth context
        };
        
        console.log('Deducting materials:', deductionData);
        
        const deductionResponse = await fetch('https://luccibyey.com.tn/production/api/production_stock_deduction.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(deductionData),
        });
        
        if (!deductionResponse.ok) {
          const errorText = await deductionResponse.text();
          throw new Error(`Erreur lors de la déduction des matériaux: ${errorText}`);
        }
        
        const deductionResult = await deductionResponse.json();
        console.log('Deduction result:', deductionResult);
        
        if (!deductionResult.success) {
          throw new Error(deductionResult.message || 'Erreur lors de la déduction des matériaux');
        }
        
        // Now create the production batch
        const sizesBreakdown = JSON.stringify(plannedQuantities);
        
        const requestData = {
          action: 'start_production',
          product_id: typeof product?.id === 'string' ? parseInt(product.id) : Number(product?.id),
          quantity_to_produce: totalQuantity,
          sizes_breakdown: sizesBreakdown,
          user_id: 1, // Default user ID - should be from auth context
          notes: `Production lancée depuis la planification pour ${product?.nom_product}`,
          materials_cost: deductionResult.total_cost || 0
        };
        
        console.log('Sending production request:', requestData);
        
        const response = await fetch('https://luccibyey.com.tn/production/api/production_batches.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });
        
        console.log('Response status:', response.status);
        
        // Check if response is ok
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
            description: `Batch ${result.batch_reference} créé avec succès. Matériaux déduits: ${deductionResult.total_cost?.toFixed(2) || 0} TND`,
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
          <Button onClick={() => navigate(`/produits/${id}`)}>
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
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/produits/${id}`)}
              className="hover:bg-accent shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au Produit
            </Button>
            <Separator orientation="vertical" className="h-8" />
            <div className="page-header">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-semibold text-foreground tracking-tight">
                    Planification de Production
                  </h1>
                  <p className="text-muted-foreground">
                    Configurez les quantités et validez les matériaux disponibles
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
                Produit à Produire
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Product Image */}
                <div className="lg:col-span-1">
                  <div className="aspect-square rounded-xl overflow-hidden bg-accent/20 border-2 border-dashed border-border flex items-center justify-center">
                    {product.img_product ? (
                      <img 
                        src={getProductImageUrl(product.img_product, product.boutique_origin)}
                        alt={product.nom_product}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={product.img_product ? 'hidden' : 'text-center p-4'}>
                      <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                      <p className="text-sm text-muted-foreground">Image non disponible</p>
                    </div>
                  </div>
                </div>
                
                {/* Product Details */}
                <div className="lg:col-span-3 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Nom du Produit
                      </Label>
                      <p className="text-lg font-medium text-foreground">{product.nom_product}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Référence
                      </Label>
                      <p className="text-lg font-mono font-medium text-foreground bg-accent/30 px-3 py-1 rounded-md inline-block">
                        {product.reference_product}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Boutique
                      </Label>
                      <Badge 
                        className={`text-sm font-medium px-3 py-1 ${
                          product.boutique_origin === 'luccibyey' 
                            ? 'bg-primary/10 text-primary border-primary/20' 
                            : 'bg-secondary/50 text-secondary-foreground border-secondary'
                        }`}
                      >
                        {product.boutique_origin === 'luccibyey' ? 'Lucci By Ey' : 'Spada di Battaglia'}
                      </Badge>
                    </div>
                  </div>
                  
                  {(product.price_product || product.category_product) && (
                    <Separator className="my-4" />
                  )}
                  
                  {(product.price_product || product.category_product) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {product.price_product && (
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Prix Unitaire
                          </Label>
                          <p className="text-lg font-semibold text-primary">
                            {product.price_product} TND
                          </p>
                        </div>
                      )}
                      {product.category_product && (
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Catégorie
                          </Label>
                          <p className="text-lg font-medium text-foreground capitalize">
                            {product.category_product}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Quantity Planning */}
          <Card className="modern-card">
            <CardHeader className="bg-gradient-to-r from-accent/20 to-accent/10 border-b">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-accent rounded-lg">
                  <Package className="h-5 w-5 text-accent-foreground" />
                </div>
                Configuration des Quantités
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Définissez précisément les quantités à produire pour optimiser l'utilisation des matériaux
              </p>
            </CardHeader>
            <CardContent className="p-6">
              {hasNoSizes ? (
                <div className="bg-accent/10 border border-accent/20 rounded-xl p-6">
                  <div className="text-center mb-6">
                    <div className="p-3 bg-accent/20 rounded-full inline-block mb-3">
                      <Package className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Production Sans Tailles
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Ce produit ne nécessite pas de configuration par taille
                    </p>
                  </div>
                  <div className="max-w-md mx-auto">
                    <Label htmlFor="total" className="text-sm font-semibold text-foreground block mb-2">
                      Quantité Totale à Produire
                    </Label>
                    <Input
                      id="total"
                      type="number"
                      min="0"
                      value={plannedQuantities['none'] || ''}
                      onChange={(e) => handleQuantityChange('none', e.target.value)}
                      placeholder="Entrez le nombre de pièces"
                      className="text-center text-lg font-medium h-12"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(configuredSizes).map(([sizeType, sizes]) => (
                    <div key={sizeType} className="bg-card border border-border/50 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {sizeType === 'clothing' ? 'Tailles Vêtements' :
                           sizeType === 'numeric_pants' ? 'Tailles Numériques' :
                           sizeType === 'shoes' ? 'Pointures Chaussures' :
                           sizeType === 'belts' ? 'Tailles Ceintures' : 
                           sizeType.charAt(0).toUpperCase() + sizeType.slice(1)}
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {sizes.map((size) => (
                          <div key={size} className="space-y-2">
                            <Label 
                              htmlFor={`size_${size}`} 
                              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block"
                             >
                               {size ? size.toUpperCase() : 'Sans taille'}
                             </Label>
                            <Input
                              id={`size_${size}`}
                              type="number"
                              min="0"
                              value={plannedQuantities[size] || ''}
                              onChange={(e) => handleQuantityChange(size, e.target.value)}
                              placeholder="0"
                              className="text-center font-medium h-10 focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {totalPlanned > 0 && (
                <div className="mt-8 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-primary uppercase tracking-wider">
                        Total des Pièces à Produire
                      </Label>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                          <Package className="h-6 w-6 text-primary" />
                        </div>
                        <p className="text-3xl font-bold text-primary">{totalPlanned}</p>
                        <span className="text-lg text-primary/80 font-medium">pièces</span>
                      </div>
                    </div>
                    <Button 
                      onClick={validateProduction}
                      disabled={validating}
                      size="lg"
                      className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3"
                    >
                      {validating ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      ) : (
                        <CheckCircle className="h-5 w-5" />
                      )}
                      <span className="font-semibold">Valider & Vérifier les Matériaux</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Validation Results Modal */}
      <Dialog open={showValidationModal} onOpenChange={setShowValidationModal}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="flex items-center gap-3 text-xl">
              {validationResult?.has_sufficient_stock ? (
                <div className="p-2 bg-success/20 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
              ) : (
                <div className="p-2 bg-warning/20 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold">Validation des Matériaux</h2>
                <p className="text-sm text-muted-foreground font-normal mt-1">
                  Analyse de la disponibilité des matériaux pour cette production
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
              {validationResult && (
                <div className="space-y-8">
                   {/* Simplified Summary */}
                   <div className="p-6 rounded-lg border bg-card">
                     <div className="flex items-start gap-4">
                       <div className="p-2 rounded-lg bg-muted">
                         {validationResult.has_sufficient_stock ? (
                           <CheckCircle className="h-5 w-5 text-foreground" />
                         ) : (
                           <AlertTriangle className="h-5 w-5 text-foreground" />
                         )}
                       </div>
                       <div className="flex-1">
                         <h3 className="text-lg font-semibold mb-2 text-foreground">
                           {validationResult.has_sufficient_stock 
                             ? 'Stock Suffisant - Production Autorisée'
                             : 'Stock Insuffisant - Ajustement Nécessaire'
                           }
                         </h3>
                         <p className="text-sm leading-relaxed text-muted-foreground">
                           {validationResult.has_sufficient_stock
                             ? 'Tous les matériaux sont disponibles en quantité suffisante. Vous pouvez procéder à la production.'
                             : 'Certains matériaux ne sont pas disponibles en quantité suffisante. Consultez les détails ci-dessous.'
                           }
                         </p>
                       </div>
                     </div>
                   </div>

                   {/* Validation Warnings - Simplified */}
                   {validationResult.validation_warnings && validationResult.validation_warnings.length > 0 && (
                     <div className="border rounded-lg p-6 bg-card">
                       <div className="flex items-center gap-2 mb-4">
                         <AlertTriangle className="h-5 w-5 text-foreground" />
                         <h3 className="text-lg font-semibold text-foreground">
                           {validationResult.can_produce_any ? 'Avertissements de Configuration' : 'Production Impossible'}
                         </h3>
                       </div>
                       <div className="space-y-3">
                         {validationResult.validation_warnings.map((warning, index) => (
                           <div key={index} className="border rounded-lg p-4 bg-muted/30">
                             <p className="text-sm text-foreground font-medium">{warning.message}</p>
                             {warning.type === 'impossible_production' ? (
                               <div className="mt-3 p-3 bg-card rounded-md">
                                 <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                   Actions Recommandées
                                 </p>
                                 <ul className="text-xs text-muted-foreground space-y-1">
                                   <li>• Réapprovisionner les matériaux manquants</li>
                                   <li>• Vérifier la configuration des matériaux du produit</li>
                                   <li>• Contacter le service d'approvisionnement</li>
                                 </ul>
                               </div>
                             ) : (
                               <p className="text-xs text-muted-foreground mt-1">
                                 Vérifiez la configuration des matériaux pour ce produit
                               </p>
                             )}
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

              {/* Enhanced Material Requirements */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Détail des Besoins en Matériaux
                </h3>
                <div className="grid gap-6">
                  {Object.entries(validationResult.material_requirements).map(([materialId, requirement]) => (
                    <Card key={materialId} className="modern-card">
                      <CardContent className="p-6">
                         <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                             <div className="px-2 py-1 bg-muted rounded-md">
                               <span className="text-xs font-medium text-muted-foreground">
                                 {requirement.material_color || 'Non défini'}
                               </span>
                             </div>
                             <div>
                               <h4 className="font-semibold text-foreground">{requirement.material_name}</h4>
                               <p className="text-sm text-muted-foreground">Matériau requis</p>
                             </div>
                           </div>
                           <Badge 
                             variant="outline"
                             className="px-3 py-1 font-medium"
                           >
                             {requirement.stock_percentage.toFixed(0)}% disponible
                           </Badge>
                         </div>
                        
                         <div className="grid grid-cols-3 gap-4 mb-4">
                           <div className="text-center p-3 bg-muted/30 rounded-lg">
                             <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                               Requis
                             </Label>
              <p className="text-lg font-bold text-foreground">
                {formatNumber(requirement.total_needed)}
              </p>
                             <p className="text-xs text-muted-foreground">{requirement.quantity_unit}</p>
                           </div>
                           <div className="text-center p-3 bg-muted/30 rounded-lg">
                             <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                               Disponible
                             </Label>
                             <p className="text-lg font-bold text-foreground">
                               {requirement.current_stock}
                             </p>
                             <p className="text-xs text-muted-foreground">{requirement.quantity_unit}</p>
                           </div>
                           <div className="text-center p-3 bg-muted/30 rounded-lg">
                             <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                               Manquant
                             </Label>
              <p className="text-lg font-bold text-foreground">
                {requirement.is_sufficient ? '0' : formatNumber(requirement.total_needed - requirement.current_stock)}
              </p>
                             <p className="text-xs text-muted-foreground">{requirement.quantity_unit}</p>
                           </div>
                         </div>

                         <div className="mb-4">
                           <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                             Progression du Stock
                           </Label>
                           <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                             <div 
                               className={`h-full transition-all ${
                                 requirement.stock_status === 'critical' ? 'bg-destructive' :
                                 requirement.stock_status === 'warning' ? 'bg-warning' :
                                 'bg-success'
                               }`}
                               style={{ width: `${Math.min(requirement.stock_percentage, 100)}%` }}
                             />
                           </div>
                           <div className="flex justify-between mt-1">
                             <span className="text-xs text-muted-foreground">
                               Seuil critique: {requirement.min_stock} {requirement.quantity_unit}
                             </span>
                             <span className="text-xs text-muted-foreground">
                               Seuil optimal: {requirement.max_stock} {requirement.quantity_unit}
                             </span>
                           </div>
                         </div>

                        {/* Enhanced size breakdown */}
                        <div>
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
                            Répartition par Taille
                          </Label>
                           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                             {requirement.size_breakdown.map((size, index) => (
                               <div key={index} className="bg-muted/20 border rounded-lg p-3 text-center">
                                  <div className="text-sm font-semibold text-foreground mb-1">
                                    {size.size ? size.size.toUpperCase() : 'Sans taille'}
                                  </div>
                                 <div className="text-xs text-muted-foreground">
                                   {size.planned_pieces} × {size.material_per_piece}
                                 </div>
                  <div className="text-xs font-medium text-foreground mt-1">
                    = {formatNumber(size.total_material_needed)}{requirement.quantity_unit}
                  </div>
                               </div>
                             ))}
                           </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Enhanced Suggestions - Only show if production is possible */}
              {!validationResult.has_sufficient_stock && validationResult.can_produce_any && Object.keys(validationResult.suggested_quantities).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    Quantités Suggérées pour Optimiser le Stock
                  </h3>
                  <Card className="modern-card border-warning/20">
                    <CardContent className="p-6">
                      <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 mb-6">
                        <h4 className="font-semibold text-warning mb-2">Ajustement Automatique Proposé</h4>
                        <p className="text-sm text-warning/80">
                          Ces quantités ont été calculées selon vos stocks disponibles pour chaque matériau.
                          C'est le maximum que vous pouvez produire actuellement.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                        {Object.entries(validationResult.suggested_quantities).map(([size, suggestedQty]) => (
                          <div key={size} className="bg-card border border-border rounded-lg p-4 text-center">
                             <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                               {size === 'total' ? 'Total' : `Taille ${size ? size.toUpperCase() : 'Sans taille'}`}
                             </Label>
                            <div className="space-y-2">
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-destructive/70 line-through text-sm">
                                  {validationResult.planned_quantities[size]}
                                </span>
                                <span className={`font-bold text-lg ${suggestedQty > 0 ? 'text-success' : 'text-destructive'}`}>
                                  {suggestedQty}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {suggestedQty > 0 ? 'pièces possibles' : 'impossible'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Button 
                        onClick={applySuggestedQuantities}
                        variant="outline"
                        size="lg"
                        className="w-full border-warning/30 text-warning hover:bg-warning/10 flex items-center gap-2"
                        disabled={Object.values(validationResult.suggested_quantities).every(qty => qty === 0)}
                      >
                        <CheckCircle className="h-4 w-4" />
                        {Object.values(validationResult.suggested_quantities).every(qty => qty === 0) 
                          ? 'Aucune Production Possible' 
                          : 'Appliquer les Quantités Optimisées'
                        }
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-3 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowValidationModal(false)}
              size="lg"
              className="flex-1 sm:flex-none"
            >
              Modifier les Quantités
            </Button>
            {validationResult?.has_sufficient_stock && (
              <Button 
                onClick={() => {
                  setShowValidationModal(false);
                  setShowConfirmationModal(true);
                }} 
                size="lg"
                className="flex-1 sm:flex-none bg-success hover:bg-success/90 text-success-foreground flex items-center gap-2 shadow-lg"
              >
                <Play className="h-4 w-4" />
                Démarrer la Production
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Production Confirmation Dialog */}
      <Dialog open={showConfirmationModal} onOpenChange={setShowConfirmationModal}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-warning/20 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Confirmation de Production</h2>
                <p className="text-sm text-muted-foreground font-normal mt-1">
                  Le démarrage de la production va déduire les matériaux suivants du stock :
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {validationResult && (
            <div className="space-y-4">
              {/* Material List */}
              <div className="border rounded-lg divide-y">
                {Object.entries(validationResult.material_requirements).map(([materialId, requirement]) => (
                  <div key={materialId} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{requirement.material_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {requirement.material_color || 'Couleur non définie'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-foreground">
                          {formatNumber(requirement.total_needed)} {requirement.quantity_unit}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Stock actuel: {formatNumber(requirement.current_stock)} {requirement.quantity_unit}
                        </p>
                      </div>
                    </div>
                    
                    {/* Size Breakdown */}
                    {requirement.size_breakdown && requirement.size_breakdown.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Détail par taille
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {requirement.size_breakdown.map((sizeData, idx) => (
                            <div key={idx} className="text-xs bg-muted/50 rounded px-2 py-1">
                              <span className="font-medium">{sizeData.size}:</span>{' '}
                              <span className="text-muted-foreground">
                                {sizeData.planned_pieces} pcs × {formatNumber(sizeData.material_per_piece)} = {formatNumber(sizeData.total_material_needed)} {requirement.quantity_unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Warning Message */}
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div className="text-sm text-foreground">
                    <p className="font-medium mb-1">Cette action est irréversible</p>
                    <p className="text-muted-foreground">
                      Les quantités de matériaux ci-dessus seront automatiquement déduites du stock. 
                      Assurez-vous que les quantités sont correctes avant de confirmer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowConfirmationModal(false);
                setShowValidationModal(true);
              }}
              size="lg"
              className="flex-1 sm:flex-none"
            >
              Annuler
            </Button>
            <Button 
              onClick={() => {
                setShowConfirmationModal(false);
                startProduction();
              }} 
              size="lg"
              className="flex-1 sm:flex-none bg-success hover:bg-success/90 text-success-foreground flex items-center gap-2 shadow-lg"
            >
              <CheckCircle className="h-4 w-4" />
              Confirmer la Production
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductionPlanning;