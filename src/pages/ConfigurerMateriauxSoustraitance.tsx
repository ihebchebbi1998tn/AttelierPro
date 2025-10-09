import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Package, Save, Check, Search, Settings, AlertCircle, Edit2 } from 'lucide-react';

interface Material {
  id: number;
  nom: string;
  reference: string;
  category_name: string;
  quantite_stock: number;
  quantite_min: number;
  quantite_max: number;
  prix_unitaire: number;
  couleur?: string;
  description: string;
  quantity_type_id: number;
}

interface QuantityType {
  id: number;
  nom: string;
  unite: string;
}

interface ProductMaterial {
  material_id: number;
  quantity_needed: number;
  quantity_type_id: number;
  size_specific: string | null;
  notes: string;
  commentaire?: string;
}

interface SoustraitanceProduct {
  id: number;
  nom_product: string;
  reference_product: string;
  type_product: string;
  color_product: string;
  boutique_origin: string;
}

const ConfigurerMateriauxSoustraitance = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [product, setProduct] = useState<SoustraitanceProduct | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [quantityTypes, setQuantityTypes] = useState<QuantityType[]>([]);
  const [productSizes, setProductSizes] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<ProductMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [tempConfig, setTempConfig] = useState<{
    quantity_type_id: number;
    sizeQuantities: { [sizeValue: string]: number };
    commentaire: string;
  }>({
    quantity_type_id: 1,
    sizeQuantities: {},
    commentaire: ''
  });

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load soustraitance product details
      const productResponse = await fetch(`https://luccibyey.com.tn/production/api/soustraitance_products.php?id=${productId}`);
      const productData = await productResponse.json();
      
      if (productData.success && productData.data) {
        // Handle both single product and array response structures
        const productInfo = productData.data.products ? productData.data.products[0] : productData.data;
        
        setProduct({
          id: parseInt(productInfo.id),
          nom_product: productInfo.nom_product,
          reference_product: productInfo.reference_product,
          type_product: productInfo.type_product,
          color_product: productInfo.color_product,
          boutique_origin: productInfo.boutique_origin
        });

        // Extract configured sizes from product data
        const sizeFields = [
          'size_xs', 'size_s', 'size_m', 'size_l', 'size_xl', 'size_xxl', 'size_3xl', 'size_4xl',
          'size_30', 'size_31', 'size_32', 'size_33', 'size_34', 'size_36', 'size_38', 'size_39',
          'size_40', 'size_41', 'size_42', 'size_43', 'size_44', 'size_45', 'size_46', 'size_47',
          'size_48', 'size_50', 'size_52', 'size_54', 'size_56', 'size_58', 'size_60', 'size_62',
          'size_64', 'size_66', 'size_85', 'size_90', 'size_95', 'size_100', 'size_105', 'size_110',
          'size_115', 'size_120', 'size_125'
        ];

        const configuredSizes: string[] = [];
        sizeFields.forEach(field => {
          if (productInfo[field] === '1' || productInfo[field] === 1) {
            const sizeValue = field.replace('size_', '');
            configuredSizes.push(sizeValue.toUpperCase());
          }
        });

        setProductSizes(configuredSizes.length > 0 ? configuredSizes : ['OS']); // Default to One Size if no sizes
        
        console.log('Configured sizes found:', configuredSizes);
      }

      // Load existing materials configuration
      const materialsConfigResponse = await fetch(`https://luccibyey.com.tn/production/api/soustraitance_product_materials.php?product_id=${productId}`);
      const materialsConfigData = await materialsConfigResponse.json();
      
      if (materialsConfigData.success && materialsConfigData.data && materialsConfigData.data.length > 0) {
        const existingMaterials = materialsConfigData.data.map((pm: any) => ({
          material_id: parseInt(pm.material_id),
          quantity_needed: parseFloat(pm.quantity_needed),
          quantity_type_id: parseInt(pm.quantity_type_id),
          size_specific: pm.size_specific ? pm.size_specific : null,
          notes: pm.notes || '',
          commentaire: pm.commentaire || ''
        }));
        setSelectedMaterials(existingMaterials);
      }

      // Load materials
      const materialsResponse = await fetch('https://luccibyey.com.tn/production/api/matieres.php');
      const materialsData = await materialsResponse.json();
      if (materialsData.success) {
        const normalizedMaterials: Material[] = (materialsData.data || []).map((m: any) => ({
          id: parseInt(m.id),
          nom: m.nom,
          reference: m.reference,
          category_name: m.category_name,
          quantite_stock: parseFloat(m.quantite_stock),
          quantite_min: parseFloat(m.quantite_min),
          quantite_max: parseFloat(m.quantite_max),
          prix_unitaire: parseFloat(m.prix_unitaire),
          couleur: m.couleur,
          description: m.description,
          quantity_type_id: parseInt(m.quantity_type_id)
        }));
        setMaterials(normalizedMaterials);
      }

      // Load quantity types
      const quantityTypesResponse = await fetch('https://luccibyey.com.tn/production/api/quantity_types.php');
      const quantityTypesData = await quantityTypesResponse.json();
      if (quantityTypesData.success) {
        const normalizedQT: QuantityType[] = (quantityTypesData.data || []).map((qt: any) => ({
          id: parseInt(qt.id),
          nom: qt.nom,
          unite: qt.unite
        }));
        setQuantityTypes(normalizedQT);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openMaterialConfig = (material: Material) => {
    setSelectedMaterial(material);

    // Check if material is already configured and load existing configuration
    const existingMaterials = selectedMaterials.filter(sm => sm.material_id === material.id);
    if (existingMaterials.length > 0) {
      // Load existing configuration with actual values
      const existingSizeQuantities: { [sizeValue: string]: number } = {};
      let existingQuantityTypeId = existingMaterials[0].quantity_type_id;
      
      // Check if this is a "one size" product or has actual sizes
      const isOneSize = productSizes.length === 1 && productSizes[0] === 'OS';
      
      console.log('Opening material config for:', material.nom);
      console.log('Product sizes:', productSizes);
      console.log('Is one size:', isOneSize);
      
      existingMaterials.forEach(mat => {
        if (mat.size_specific) {
          existingSizeQuantities[mat.size_specific] = mat.quantity_needed;
        } else {
          if (isOneSize) {
            existingSizeQuantities['OS'] = mat.quantity_needed;
          } else {
            productSizes.forEach(size => {
              existingSizeQuantities[size] = mat.quantity_needed;
            });
          }
        }
      });

      // Fill missing sizes with 0 to show all size inputs
      productSizes.forEach(size => {
        if (!(size in existingSizeQuantities)) {
          existingSizeQuantities[size] = 0;
        }
      });

      setTempConfig({
        quantity_type_id: existingQuantityTypeId,
        sizeQuantities: existingSizeQuantities,
        commentaire: existingMaterials[0]?.commentaire || ''
      });
    } else {
      // Initialize with default quantities for each size (new material)
      const initialSizeQuantities: { [sizeValue: string]: number } = {};
      productSizes.forEach(size => {
        initialSizeQuantities[size] = 1;
      });
      setTempConfig({
        quantity_type_id: material.quantity_type_id || quantityTypes[0]?.id || 1,
        sizeQuantities: initialSizeQuantities,
        commentaire: ''
      });
    }
    setShowConfigModal(true);
  };

  const saveMaterialConfig = async () => {
    if (!selectedMaterial) return;
    const isOneSize = productSizes.length === 1 && productSizes[0] === 'OS';

    // Create one ProductMaterial entry for each size (or null for one size)
    const newMaterials: ProductMaterial[] = Object.entries(tempConfig.sizeQuantities)
      .filter(([size, quantity]) => quantity > 0) // Only save sizes with quantity > 0
      .map(([size, quantity]) => ({
        material_id: selectedMaterial.id,
        quantity_needed: quantity,
        quantity_type_id: tempConfig.quantity_type_id,
        size_specific: isOneSize ? null : size,
        notes: '',
        commentaire: tempConfig.commentaire || ''
      }));

    // Replace any existing configuration for this material
    const withoutCurrent = selectedMaterials.filter(sm => sm.material_id !== selectedMaterial.id);
    const updatedMaterials = [...withoutCurrent, ...newMaterials];
    setSelectedMaterials(updatedMaterials);
    
    // Auto-save to API
    await autoSaveConfiguration(updatedMaterials);
    
    setShowConfigModal(false);
    setSelectedMaterial(null);
    
    console.log('Saved material config for:', selectedMaterial.nom);
    console.log('New materials:', newMaterials);
  };

  const applyToAllSizes = () => {
    const firstSize = Object.keys(tempConfig.sizeQuantities)[0];
    const firstQuantity = tempConfig.sizeQuantities[firstSize] || 1;
    const updatedQuantities: { [sizeValue: string]: number } = {};
    productSizes.forEach(size => {
      updatedQuantities[size] = firstQuantity;
    });
    setTempConfig({
      ...tempConfig,
      sizeQuantities: updatedQuantities
    });
  };

  const updateSizeQuantity = (sizeValue: string, quantity: number) => {
    setTempConfig({
      ...tempConfig,
      sizeQuantities: {
        ...tempConfig.sizeQuantities,
        [sizeValue]: quantity
      }
    });
  };

  const removeSelectedMaterial = async (materialId: number) => {
    const updated = selectedMaterials.filter(sm => sm.material_id !== materialId);
    setSelectedMaterials(updated);
    
    // Auto-save to API
    await autoSaveConfiguration(updated);
    
    toast({
      title: "Succès",
      description: "Matériau retiré de la configuration"
    });
  };

  // Auto-save configuration to API
  const autoSaveConfiguration = async (materials: ProductMaterial[]) => {
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/soustraitance_product_materials.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'configure_product_materials',
          product_id: productId,
          materials: materials
        })
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Sauvegardé",
          description: "Configuration automatiquement sauvegardée",
        });
      } else {
        throw new Error(data.message || 'Erreur lors de la sauvegarde automatique');
      }
    } catch (error) {
      console.error('Error auto-saving configuration:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder automatiquement",
        variant: "destructive"
      });
    }
  };

  const saveConfiguration = async () => {
    if (selectedMaterials.length === 0) {
      toast({
        title: "Validation",
        description: "Veuillez sélectionner au moins un matériau",
        variant: "destructive"
      });
      return;
    }

    // Validate quantities
    const invalidMaterials = selectedMaterials.filter(sm => sm.quantity_needed <= 0);
    if (invalidMaterials.length > 0) {
      toast({
        title: "Validation",
        description: "Toutes les quantités doivent être supérieures à 0",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/soustraitance_product_materials.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'configure_product_materials',
          product_id: productId,
          materials: selectedMaterials
        })
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Succès",
          description: "Configuration des matériaux sauvegardée avec succès"
        });
        navigate(`/soustraitance-products/${productId}`, {
          state: { refresh: true }
        });
      } else {
        throw new Error(data.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de sauvegarder la configuration",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getStockStatus = (currentStock: number, minStock: number, maxStock: number) => {
    // Check if quantity exceeds max - show pink
    if (currentStock > maxStock) {
      return { status: 'excess', color: 'bg-pink-500', badgeVariant: 'default' };
    }
    if (currentStock <= minStock) {
      return { status: 'critical', color: 'bg-destructive', badgeVariant: 'destructive' };
    } else if (currentStock < maxStock) {
      return { status: 'warning', color: 'bg-warning', badgeVariant: 'warning' };
    } else {
      return { status: 'good', color: 'bg-success', badgeVariant: 'success' };
    }
  };

  const getStockStatusLabel = (status: string) => {
    switch (status) {
      case 'excess': return 'Excès';
      case 'critical': return 'Critique';
      case 'warning': return 'Faible';
      case 'good': return 'Bon';
      default: return '';
    }
  };

  const getMaterialName = (materialId: number) => {
    const material = materials.find(m => m.id === materialId);
    return material ? `${material.nom} (${material.reference})` : 'Matériau inconnu';
  };

  const getQuantityTypeName = (quantityTypeId: number) => {
    const qType = quantityTypes.find(qt => qt.id === quantityTypeId);
    return qType ? `${qType.nom} (${qType.unite})` : 'Unité';
  };

  const getConfiguredQuantities = (materialId: number) => {
    const materialConfigs = selectedMaterials.filter(sm => sm.material_id === materialId);
    if (materialConfigs.length === 0) return null;
    const totalQuantity = materialConfigs.reduce((sum, config) => sum + config.quantity_needed, 0);
    const quantityType = quantityTypes.find(qt => qt.id === materialConfigs[0].quantity_type_id);
    return {
      total: totalQuantity,
      unit: quantityType?.unite || '',
      breakdown: materialConfigs.length > 1 ? materialConfigs.map(config => ({
        size: config.size_specific || 'Taille unique',
        quantity: config.quantity_needed
      })) : null
    };
  };

  const isSelected = (materialId: number) => {
    return selectedMaterials.some(sm => sm.material_id === materialId);
  };

  const filteredMaterials = materials.filter(material =>
    material.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.category_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const distinctSelectedCount = new Set(selectedMaterials.map(sm => sm.material_id)).size;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/soustraitance-products/${productId}`)} 
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{product?.nom_product}</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Référence: {product?.reference_product}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Available Materials */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg md:text-xl">Matériaux Disponibles</CardTitle>
            <p className="text-sm text-muted-foreground mb-4">
              Cliquez sur un matériau pour l'ajouter à la configuration
            </p>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher un matériau..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredMaterials.map(material => (
                <Card
                  key={material.id}
                  className={`cursor-pointer transition-all hover:shadow-md border ${
                    isSelected(material.id)
                      ? 'ring-2 ring-green-500 bg-green-50 border-green-500'
                      : getStockStatus(material.quantite_stock, material.quantite_min || 0, material.quantite_max || 100).status === 'critical'
                      ? 'hover:bg-destructive-light/20 border-l-4 border-l-destructive bg-destructive-light/10 border-destructive/20'
                      : 'hover:bg-muted/30 border-border'
                  }`}
                  onClick={() => openMaterialConfig(material)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate mb-1">{material.nom}</h3>
                        <p className="text-xs text-muted-foreground truncate mb-1">{material.reference}</p>
                        <p className="text-xs text-muted-foreground mb-2">{material.category_name}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isSelected(material.id) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openMaterialConfig(material);
                            }}
                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        )}
                        {isSelected(material.id) && (
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {/* Stock Progress Bar with Status */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-muted-foreground">Stock</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${getStockStatus(material.quantite_stock, material.quantite_min || 0, material.quantite_max || 100).status === 'critical' ? 'text-destructive' : ''}`}>
                              {material.quantite_stock}
                            </span>
                            <Badge 
                              variant={getStockStatus(material.quantite_stock, material.quantite_min || 0, material.quantite_max || 100).badgeVariant as any}
                              className="text-xs px-1.5 py-0.5"
                            >
                              {getStockStatusLabel(getStockStatus(material.quantite_stock, material.quantite_min || 0, material.quantite_max || 100).status)}
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${getStockStatus(material.quantite_stock, material.quantite_min || 0, material.quantite_max || 100).color}`}
                            style={{
                              width: `${Math.min(100, Math.max(5, material.quantite_stock / (material.quantite_max || 100) * 100))}%`
                            }}
                          />
                        </div>
                      </div>
                      
                      {material.couleur && (
                        <div className="flex items-center justify-between text-xs">
                          <span>Couleur:</span>
                          <span className="truncate max-w-[80px]">{material.couleur}</span>
                        </div>
                      )}

                      {/* Show configured quantities if material is selected */}
                      {isSelected(material.id) && (() => {
                        const config = getConfiguredQuantities(material.id);
                        return config && (
                          <div className="bg-green-50 p-2 rounded text-xs border border-green-200">
                            <p className="font-medium text-green-800">
                              Configuré: {config.total} {config.unit}
                            </p>
                            {config.breakdown && (
                              <div className="mt-1 space-y-1">
                                {config.breakdown.map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-green-700">
                                    <span>{item.size}:</span>
                                    <span>{item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected Materials Summary */}
        {selectedMaterials.length > 0 && (
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Matériaux Configurés ({distinctSelectedCount})</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-600" />
                  Sauvegarde automatique activée
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from(new Set(selectedMaterials.map(sm => sm.material_id))).map(materialId => {
                  const config = getConfiguredQuantities(materialId);
                  const material = materials.find(m => m.id === materialId);
                  return (
                    <div key={materialId} className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/70 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-medium">{getMaterialName(materialId)}</h4>
                        {config && (
                          <div className="mt-1">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">{config.total} {config.unit}</span>
                              {config.breakdown && config.breakdown.length > 1 && 
                                ` • Par taille: ${config.breakdown.map(b => `${b.size}: ${b.quantity}`).join(', ')}`
                              }
                            </p>
                          </div>
                        )}
                        {material && (
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Stock: {material.quantite_stock}</span>
                            <span>Prix: {material.prix_unitaire.toFixed(2)} €</span>
                            {material.couleur && <span>Couleur: {material.couleur}</span>}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeSelectedMaterial(materialId)}
                          className="text-destructive hover:text-destructive"
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Material Configuration Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configuration - {selectedMaterial?.nom}</DialogTitle>
            <DialogDescription>
              Configurez les quantités nécessaires pour chaque taille
            </DialogDescription>
          </DialogHeader>

          {selectedMaterial && (
            <div className="space-y-6">
              {/* Material Info */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Référence:</span> {selectedMaterial.reference}
                  </div>
                  <div>
                    <span className="font-medium">Catégorie:</span> {selectedMaterial.category_name}
                  </div>
                  <div>
                    <span className="font-medium">Stock actuel:</span> {selectedMaterial.quantite_stock}
                  </div>
                </div>
              </div>

              {/* Quantity Type Selection */}
              <div>
                <Label>Type de quantité</Label>
                <Select 
                  value={tempConfig.quantity_type_id.toString()} 
                  onValueChange={(value) => setTempConfig({...tempConfig, quantity_type_id: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {quantityTypes.map(qt => (
                      <SelectItem key={qt.id} value={qt.id.toString()}>
                        {qt.nom} ({qt.unite})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Size-specific quantities */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Quantités par taille</Label>
                  {productSizes.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={applyToAllSizes}
                      className="text-xs"
                    >
                      Appliquer à toutes les tailles
                    </Button>
                  )}
                </div>
                
                {productSizes.length === 1 && productSizes[0] === 'OS' ? (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Quantité (Taille unique)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.001"
                      value={tempConfig.sizeQuantities['OS'] || 1}
                      onChange={e => updateSizeQuantity('OS', parseFloat(e.target.value) || 1)}
                      className="text-sm"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {productSizes.map(size => (
                      <div key={size}>
                        <Label className="text-xs font-medium">{size}</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.001"
                          value={tempConfig.sizeQuantities[size] || 0}
                          onChange={(e) => updateSizeQuantity(size, parseFloat(e.target.value) || 0)}
                          className="mt-1"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground mt-2">
                  Tailles configurées pour ce produit: {productSizes.join(', ')}
                </div>
              </div>

              {/* Comments */}
              <div>
                <Label>Commentaire (optionnel)</Label>
                <textarea
                  value={tempConfig.commentaire}
                  onChange={(e) => setTempConfig({...tempConfig, commentaire: e.target.value})}
                  className="w-full p-2 border rounded-md mt-1 resize-none"
                  rows={3}
                  placeholder="Ajoutez un commentaire sur cette configuration..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigModal(false)}>
              Annuler
            </Button>
            <Button onClick={saveMaterialConfig}>
              <Settings className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConfigurerMateriauxSoustraitance;