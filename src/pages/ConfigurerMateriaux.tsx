import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Package, Save, Check, Search, Settings, AlertCircle } from 'lucide-react';
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
interface Product {
  id: number;
  nom_product: string;
  reference_product: string;
  type_product: string;
  color_product: string;
  boutique_origin: string;
}
interface ProductSize {
  id: number;
  product_id: number;
  size_type: string;
  size_value: string;
  is_active: boolean;
}
const ConfigurerMateriaux = () => {
  const {
    productId
  } = useParams();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [quantityTypes, setQuantityTypes] = useState<QuantityType[]>([]);
  const [productSizes, setProductSizes] = useState<ProductSize[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<ProductMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [tempConfig, setTempConfig] = useState<{
    quantity_type_id: number;
    sizeQuantities: {
      [sizeValue: string]: number;
    };
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
      // Load product details
      const productResponse = await fetch(`https://luccibyey.com.tn/production/api/production_ready_products.php?id=${productId}`);
      const productData = await productResponse.json();
      if (productData.success && productData.data) {
        setProduct(productData.data);

        // If product already has materials configured, load them
        if (productData.data.materials && productData.data.materials.length > 0) {
          const existingMaterials = productData.data.materials.map((pm: any) => ({
            material_id: parseInt(pm.material_id),
            quantity_needed: parseFloat(pm.quantity_needed),
            quantity_type_id: parseInt(pm.quantity_type_id),
            size_specific: pm.size_specific ? pm.size_specific : null,
            notes: pm.notes || '',
            commentaire: pm.commentaire || ''
          }));
          setSelectedMaterials(existingMaterials);
        }
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

      // Load product sizes
      const sizesResponse = await fetch(`https://luccibyey.com.tn/production/api/product_sizes.php?product_id=${productId}`);
      const sizesData = await sizesResponse.json();
      if (sizesData.success) {
        if (sizesData.no_sizes) {
          // Product has no sizes - create a default "one size" option
          setProductSizes([{
            id: 1,
            product_id: parseInt(productId as string),
            size_type: 'one_size',
            size_value: 'OS',
            is_active: true
          }]);
        } else {
          // Get all active sizes and flatten them
          const activeSizes: ProductSize[] = [];
          Object.keys(sizesData.data || {}).forEach(sizeType => {
            sizesData.data[sizeType].forEach((size: any) => {
              if (size.is_active === '1' || size.is_active === 1) {
                activeSizes.push({
                  id: size.id,
                  product_id: size.product_id,
                  size_type: sizeType,
                  size_value: size.size_value,
                  is_active: true
                });
              }
            });
          });
          setProductSizes(activeSizes);
        }
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

  // Auto-save function with debouncing
  const autoSave = useCallback(async (materialsToSave: ProductMaterial[]) => {
    if (materialsToSave.length === 0) return;

    // Validate quantities
    const invalidMaterials = materialsToSave.filter(sm => sm.quantity_needed <= 0);
    if (invalidMaterials.length > 0) return;

    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/production_product_materials.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'configure_product_materials',
          product_id: productId,
          materials: materialsToSave
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Auto-sauvegarde",
          description: "Configuration sauvegardée automatiquement",
        });
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  }, [productId, toast]);

  // Debounced auto-save trigger
  const triggerAutoSave = useCallback((materials: ProductMaterial[]) => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    const timeout = setTimeout(() => {
      autoSave(materials);
    }, 1500); // Auto-save after 1.5 seconds of inactivity
    
    setAutoSaveTimeout(timeout);
  }, [autoSave, autoSaveTimeout]);
  const openMaterialConfig = (material: Material) => {
    setSelectedMaterial(material);

    // Check if material is already configured and load existing configuration
    const existingMaterials = selectedMaterials.filter(sm => sm.material_id === material.id);
    if (existingMaterials.length > 0) {
      // Load existing configuration with actual values
      const existingSizeQuantities: {
        [sizeValue: string]: number;
      } = {};
      let existingQuantityTypeId = existingMaterials[0].quantity_type_id;
      
      // Check if this is a "one size" product or has actual sizes
      const isOneSize = productSizes.length === 1 && productSizes[0].size_type === 'one_size';
      
      existingMaterials.forEach(mat => {
        if (mat.size_specific) {
          // Material configured for specific size
          existingSizeQuantities[mat.size_specific] = mat.quantity_needed;
        } else {
          // Material was configured without size specificity
          if (isOneSize) {
            // Product has no sizes, use OS
            existingSizeQuantities['OS'] = mat.quantity_needed;
          } else {
            // Product has sizes, apply the same quantity to all sizes
            productSizes.forEach(size => {
              existingSizeQuantities[size.size_value] = mat.quantity_needed;
            });
          }
        }
      });

      // Fill missing sizes with 0 to show all size inputs
      productSizes.forEach(size => {
        if (!(size.size_value in existingSizeQuantities)) {
          existingSizeQuantities[size.size_value] = 0;
        }
      });

      setTempConfig({
        quantity_type_id: existingQuantityTypeId,
        sizeQuantities: existingSizeQuantities,
        commentaire: existingMaterials[0]?.commentaire || ''
      });
    } else {
      // Initialize with default quantities for each size (new material)
      const initialSizeQuantities: {
        [sizeValue: string]: number;
      } = {};
      productSizes.forEach(size => {
        initialSizeQuantities[size.size_value] = 1;
      });
      setTempConfig({
        quantity_type_id: material.quantity_type_id || quantityTypes[0]?.id || 1,
        sizeQuantities: initialSizeQuantities,
        commentaire: ''
      });
    }
    setShowConfigModal(true);
  };
  const saveMaterialConfig = () => {
    if (!selectedMaterial) return;
    const isOneSize = productSizes.length === 1 && productSizes[0].size_type === 'one_size';

    // Create one ProductMaterial entry for each size (or null for one size)
    const newMaterials: ProductMaterial[] = Object.entries(tempConfig.sizeQuantities).map(([size, quantity]) => ({
      material_id: selectedMaterial.id,
      quantity_needed: quantity,
      quantity_type_id: tempConfig.quantity_type_id,
      size_specific: isOneSize ? null : size,
      notes: '',
      commentaire: tempConfig.commentaire || ''
    }));

    // Replace any existing configuration for this material
    const withoutCurrent = selectedMaterials.filter(sm => sm.material_id !== selectedMaterial.id);
    const updated = [...withoutCurrent, ...newMaterials];
    setSelectedMaterials(updated);
    triggerAutoSave(updated);
    setShowConfigModal(false);
    setSelectedMaterial(null);
    
    toast({
      title: "Matériau configuré",
      description: "La configuration sera sauvegardée automatiquement",
    });
  };
  const applyToAllSizes = () => {
    const firstSize = Object.keys(tempConfig.sizeQuantities)[0];
    const firstQuantity = tempConfig.sizeQuantities[firstSize] || 1;
    const updatedQuantities: {
      [sizeValue: string]: number;
    } = {};
    productSizes.forEach(size => {
      updatedQuantities[size.size_value] = firstQuantity;
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
    
    // Immediate save for deletions instead of waiting for auto-save
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/production_product_materials.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'configure_product_materials',
          product_id: productId,
          materials: updated
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Matériau supprimé",
          description: "Le matériau a été retiré et sauvegardé avec succès"
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error removing material:', error);
      // Revert the state if the API call failed
      setSelectedMaterials(selectedMaterials);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le matériau",
        variant: "destructive"
      });
    }
  };
  // Remove the manual save function since we have auto-save
  const getStockStatus = (currentStock: number, minStock: number, maxStock: number) => {
    // Align with backend logic in production/api/matieres.php
    // critical: qty <= min, warning: qty < max, good: qty >= max
    if (currentStock <= minStock) {
      return {
        status: 'critical',
        color: 'bg-destructive',
        badgeVariant: 'destructive'
      };
    } else if (currentStock < maxStock) {
      return {
        status: 'warning',
        color: 'bg-warning',
        badgeVariant: 'warning'
      };
    } else {
      return {
        status: 'good',
        color: 'bg-success',
        badgeVariant: 'success'
      };
    }
  };
  const getStockStatusLabel = (status: string) => {
    switch (status) {
      case 'critical':
        return 'Critique';
      case 'warning':
        return 'Faible';
      case 'good':
        return 'Bon';
      default:
        return '';
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
        size: config.size_specific || 'Toutes tailles',
        quantity: config.quantity_needed
      })) : null
    };
  };
  const isSelected = (materialId: number) => {
    return selectedMaterials.some(sm => sm.material_id === materialId);
  };
  const filteredMaterials = materials.filter(material => material.nom.toLowerCase().includes(searchTerm.toLowerCase()) || material.reference.toLowerCase().includes(searchTerm.toLowerCase()) || material.description.toLowerCase().includes(searchTerm.toLowerCase()) || material.category_name.toLowerCase().includes(searchTerm.toLowerCase()));
  const distinctSelectedCount = new Set(selectedMaterials.map(sm => sm.material_id)).size;
  if (loading) {
    return <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Chargement...</p>
        </div>
      </div>;
  }
  return <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate(`/produits/${productId}`)} className="flex items-center gap-2">
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
                <Input placeholder="Rechercher un matériau..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredMaterials.map(material => <Card key={material.id} className={`cursor-pointer transition-all hover:shadow-md border ${isSelected(material.id) ? 'ring-2 ring-green-500 bg-green-50 border-green-500' : getStockStatus(material.quantite_stock, material.quantite_min || 0, material.quantite_max || 100).status === 'critical' ? 'hover:bg-destructive-light/20 border-l-4 border-l-destructive bg-destructive-light/10 border-destructive/20' : 'hover:bg-muted/30 border-border'}`} onClick={() => openMaterialConfig(material)}>
                       <CardContent className="p-3">
                         <div className="flex items-start justify-between mb-3">
                           <div className="flex-1 min-w-0">
                             <h3 className="font-medium text-sm mb-1 truncate">{material.nom}</h3>
                             <p className="text-xs text-muted-foreground mb-1">{material.reference}</p>
                             <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{material.description}</p>
                           </div>
                           {isSelected(material.id) && <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                               <Check className="h-4 w-4 text-green-600" />
                               <Button variant="ghost" size="sm" onClick={e => {
                      e.stopPropagation();
                      removeSelectedMaterial(material.id);
                    }} className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                                 ×
                               </Button>
                             </div>}
                         </div>
                         
                         <div className="flex flex-wrap gap-1 mb-3">
                           <Badge variant="secondary" className="text-xs px-2 py-0.5">
                             {material.category_name}
                           </Badge>
                           {material.couleur && <Badge variant="outline" className="text-xs px-2 py-0.5">
                               {material.couleur}
                             </Badge>}
                         </div>
                         
                          {/* Stock Progress Bar with Status */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-muted-foreground">Stock</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-medium ${getStockStatus(material.quantite_stock, material.quantite_min || 0, material.quantite_max || 100).status === 'critical' ? 'text-destructive' : ''}`}>
                                  {material.quantite_stock}
                                </span>
                                <Badge variant={getStockStatus(material.quantite_stock, material.quantite_min || 0, material.quantite_max || 100).badgeVariant as any} className="text-xs px-1.5 py-0.5">
                                  {getStockStatusLabel(getStockStatus(material.quantite_stock, material.quantite_min || 0, material.quantite_max || 100).status)}
                                </Badge>
                              </div>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div className={`h-2 rounded-full transition-all ${getStockStatus(material.quantite_stock, material.quantite_min || 0, material.quantite_max || 100).color}`} style={{
                      width: `${Math.min(100, Math.max(5, material.quantite_stock / (material.quantite_max || 100) * 100))}%`
                    }} />
                            </div>
                            {getStockStatus(material.quantite_stock, material.quantite_min || 0, material.quantite_max || 100).status === 'critical' && <div className="flex items-center gap-1 text-xs text-destructive font-medium">
                                <AlertCircle className="h-3 w-3" />
                                <span>STOCK CRITIQUE</span>
                              </div>}
                            <div className="flex justify-between text-xs text-muted-foreground">
                              {isSelected(material.id) ? (() => {
                      const configured = getConfiguredQuantities(material.id);
                      const stockStatus = getStockStatus(material.quantite_stock, material.quantite_min || 0, material.quantite_max || 100);
                      return configured ? <div className="w-full">
                                     {/* Main configured quantity display - using stock status colors */}
                                     <div className={`border rounded-lg p-2 mb-2 ${stockStatus.status === 'critical' ? 'bg-destructive-light/20 border-destructive/30' : stockStatus.status === 'warning' ? 'bg-warning-light/20 border-warning/30' : 'bg-success-light/20 border-success/30'}`}>
                                       <div className="flex items-center justify-between">
                                         <div className="flex items-center gap-1">
                                           <Settings className={`h-3 w-3 ${stockStatus.status === 'critical' ? 'text-destructive' : stockStatus.status === 'warning' ? 'text-warning' : 'text-success'}`} />
                                           <span className={`text-sm font-semibold ${stockStatus.status === 'critical' ? 'text-destructive' : stockStatus.status === 'warning' ? 'text-warning' : 'text-success'}`}>
                                             Configuré
                                           </span>
                                         </div>
                                         <span className={`text-base font-bold ${stockStatus.status === 'critical' ? 'text-destructive' : stockStatus.status === 'warning' ? 'text-warning' : 'text-success'}`}>
                                           {configured.total} {configured.unit}
                                         </span>
                                       </div>
                                     </div>
                                    
                                    {/* Size breakdown - if multiple sizes */}
                                    {configured.breakdown && configured.breakdown.length > 1 && <div className="bg-gray-50 rounded-md p-2">
                                        <div className="text-xs font-medium text-gray-600 mb-1">Répartition par taille:</div>
                                        <div className="space-y-1">
                                          {configured.breakdown.map((item, index) => <div key={index} className="flex justify-between text-xs">
                                              <span className="text-gray-600">{item.size}:</span>
                                              <span className="font-medium text-gray-800">
                                                {item.quantity} {configured.unit}
                                              </span>
                                            </div>)}
                                        </div>
                                      </div>}
                                  </div> : null;
                    })() : <>
                                  <span>Min: {material.quantite_min || 0}</span>
                                  <span>Max: {material.quantite_max || 100}</span>
                                </>}
                            </div>
                          </div>
                      </CardContent>
                    </Card>)}
                </div>
              </CardContent>
            </Card>
            
            {/* Auto-save indicator */}
            {distinctSelectedCount > 0 && <div className="flex justify-end">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  {distinctSelectedCount} matériau{distinctSelectedCount > 1 ? 'x' : ''} configuré{distinctSelectedCount > 1 ? 's' : ''} - Auto-sauvegarde activée
                </div>
              </div>}
          </div>

          {/* Material Configuration Modal */}
          <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Configurer le matériau
                </DialogTitle>
                <DialogDescription>
                  Définissez l’unité et les quantités à utiliser pour chaque taille.
                </DialogDescription>
              </DialogHeader>
              
              {selectedMaterial && <div className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-medium">{selectedMaterial.nom}</h3>
                    <p className="text-sm text-muted-foreground">{selectedMaterial.reference}</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedMaterial.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {selectedMaterial.category_name}
                      </Badge>
                      {selectedMaterial.couleur && <Badge variant="outline" className="text-xs">
                          {selectedMaterial.couleur}
                        </Badge>}
                    </div>
                   </div>

                   {/* Commentaire Field */}
                   <div className="mb-4">
                     <Label className="text-sm font-medium">Commentaire ( facultatif )</Label>
                     <Input type="text" placeholder="Commentaire optionnel..." value={tempConfig.commentaire || ''} onChange={e => setTempConfig({
              ...tempConfig,
              commentaire: e.target.value
            })} className="mt-1" />
                   </div>

                   <div className="mb-4">
                     <Label className="text-sm font-medium">Unité</Label>
                     <Select value={tempConfig.quantity_type_id.toString()} onValueChange={value => setTempConfig({
              ...tempConfig,
              quantity_type_id: parseInt(value)
            })}>
                       <SelectTrigger className="mt-1">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         {quantityTypes.map(qt => <SelectItem key={qt.id} value={qt.id.toString()}>
                             {qt.nom} ({qt.unite})
                           </SelectItem>)}
                       </SelectContent>
                     </Select>
                   </div>

                   {productSizes.length > 0 ? <div>
                       <div className="flex items-center justify-between mb-3">
                         <Label className="text-sm font-medium">Quantité par taille</Label>
                         <Button type="button" variant="outline" size="sm" onClick={applyToAllSizes} className="text-xs">
                           Appliquer à toutes
                         </Button>
                       </div>
                       <div className="space-y-3 max-h-40 overflow-y-auto">
                         {productSizes.map(size => <div key={size.id} className="flex items-center justify-between gap-3">
                             <Label className="text-sm font-medium min-w-0 flex-shrink-0">
                               {size.size_value}
                             </Label>
                             <Input type="number" step="0.1" min="0" value={tempConfig.sizeQuantities[size.size_value] || 0} onChange={e => updateSizeQuantity(size.size_value, parseFloat(e.target.value) || 0)} className="w-24" />
                           </div>)}
                       </div>
                     </div> : <div className="text-center py-4 text-muted-foreground text-sm">
                       Aucune taille configurée pour ce produit
                     </div>}
                </div>}

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowConfigModal(false)}>
                  Annuler
                </Button>
                 <Button onClick={saveMaterialConfig} disabled={productSizes.length === 0 || Object.values(tempConfig.sizeQuantities).every(q => q <= 0)}>
                   <Check className="h-4 w-4 mr-2" />
                   Ajouter
                 </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>;
};
export default ConfigurerMateriaux;