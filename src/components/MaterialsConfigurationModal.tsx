
import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Package, Save, Check } from 'lucide-react';

interface Material {
  id: number;
  nom: string;
  reference: string;
  category_id?: number;
  category_name: string;
  quantite_stock: number;
  prix_unitaire: number;
  quantity_type_id?: number;
  couleur?: string;
  laize?: string;
  location?: string;
}

interface QuantityType {
  id: number;
  nom: string;
  unit: string;
}

interface ProductMaterial {
  material_id: number;
  quantity_needed: number;
  quantity_type_id: number;
  size_specific: string;
  notes: string;
  commentaire?: string;
}

interface MaterialsConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onSave?: () => void;
}

const MaterialsConfigurationModal = ({ isOpen, onClose, product, onSave }: MaterialsConfigurationModalProps) => {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [quantityTypes, setQuantityTypes] = useState<QuantityType[]>([]);
  const [productMaterials, setProductMaterials] = useState<ProductMaterial[]>([]);
  const [existingMaterials, setExistingMaterials] = useState<ProductMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Get default quantity based on item group
  // If isButton is true, return the button-specific quantity depending on laize
  const getDefaultQuantityByItemGroup = (itemGroup: string, isButton = false, laize?: string): number => {
    const itemGroupLower = itemGroup?.toLowerCase() || '';
    console.log('🔍 Item Group Debug:', {
      original: itemGroup,
      lowercase: itemGroupLower,
      productName: product?.nom_product
    });
    const quantityMap: Record<string, number> = {
      'pantalon': 1.3,
      'costume-croise': 2.8,
      'costume': 2.8,
      'blazers': 1.7,
      'chemise': 1.7,
      'trench': 2,
      'blouson': 1.7,
      'manteau': 2,
      'smoking': 2.7
    };

    // Buttons: nested map by itemgroup -> laize -> quantity
    const buttonQuantityMap: Record<string, Record<string, number>> = {
      'pantalon': { '40': 2, '22': 2, '32': 2 },
      'costume-croise': { '40': 2, '22': 2, '32': 2 },
      'costume': { '40': 2, '22': 2, '32': 2 },
      'blazers': { '40': 2, '22': 2, '32': 2 },
      'chemise': { '40': 2, '22': 2, '32': 2 },
      'trench': { '40': 2, '22': 2, '32': 2 },
      'blouson': { '40': 2, '22': 2, '32': 2 },
      'manteau': { '40': 2, '22': 2, '32': 2 },
      'smoking': { '40': 2, '22': 2, '32': 2 }
    };

    if (isButton) {
      // Normalize laize to digits only (e.g., '40"' -> '40')
      const laizeKey = (laize || '').toString().replace(/[^0-9]/g, '') || '';
      const groupMap = buttonQuantityMap[itemGroupLower];
      if (groupMap) {
        if (laizeKey && groupMap[laizeKey] !== undefined) {
          return groupMap[laizeKey];
        }
        // fallback to any defined laize value or default 2
        const firstDefined = Object.values(groupMap)[0];
        return firstDefined ?? 2;
      }
      return 2;
    }

    const defaultQuantity = quantityMap[itemGroupLower] || 1;
    console.log('✅ Default Quantity:', defaultQuantity);
    return defaultQuantity;
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, product?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load materials
      const materialsResponse = await fetch('https://luccibyey.com.tn/production/api/matieres.php');
      const materialsData = await materialsResponse.json();
      if (materialsData.success) {
        setMaterials(materialsData.data || []);
      }

      // Load quantity types
      const quantityTypesResponse = await fetch('https://luccibyey.com.tn/production/api/quantity_types.php');
      const quantityTypesData = await quantityTypesResponse.json();
      if (quantityTypesData.success) {
        setQuantityTypes(quantityTypesData.data || []);
      }

      // Load existing product materials if any
      if (product?.id) {
        const productMaterialsResponse = await fetch(`https://luccibyey.com.tn/production/api/production_product_materials.php?product_id=${product.id}`);
        const productMaterialsData = await productMaterialsResponse.json();
        if (productMaterialsData.success && productMaterialsData.data) {
          const existing = productMaterialsData.data.map((pm: any) => ({
            material_id: parseInt(pm.material_id),
            quantity_needed: parseFloat(pm.quantity_needed),
            quantity_type_id: parseInt(pm.quantity_type_id),
            size_specific: pm.size_specific || 'ALL',
            notes: pm.notes || '',
            commentaire: pm.commentaire || ''
          }));
          setExistingMaterials(existing);
          setProductMaterials(existing);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-save function with debouncing
  const autoSave = useCallback(async (materialsToSave: ProductMaterial[]) => {
    const validMaterials = materialsToSave.filter(pm => 
      pm.material_id > 0 && pm.quantity_needed > 0
    );

    if (validMaterials.length === 0) return;

    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/production_product_materials.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'configure_product_materials',
          product_id: product.id,
          materials: validMaterials
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Auto-sauvegarde",
          description: "Configuration sauvegardée automatiquement",
        });
        onSave?.();
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  }, [product?.id, onSave, toast]);

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

  const addMaterial = () => {
    const defaultQuantity = getDefaultQuantityByItemGroup(product?.itemgroup_product || '');
    const newMaterial: ProductMaterial = {
      material_id: 0,
      quantity_needed: defaultQuantity,
      quantity_type_id: quantityTypes[0]?.id || 1,
      size_specific: 'ALL',
      notes: '',
      commentaire: ''
    };
    const updated = [...productMaterials, newMaterial];
    setProductMaterials(updated);
    triggerAutoSave(updated);
  };

  const updateMaterial = (index: number, field: keyof ProductMaterial, value: any) => {
    const updated = [...productMaterials];
    updated[index] = { ...updated[index], [field]: value };

    // If user selected a material, auto-adjust defaults for buttons
    if (field === 'material_id') {
      const selectedMaterial = materials.find(m => m.id === parseInt(String(value)));
      if (selectedMaterial) {
        const isButton = (selectedMaterial.category_id === 3) || (selectedMaterial.category_name || '').toLowerCase().includes('bouton');

        if (isButton) {
          // For buttons, use the button map per itemgroup and laize when available
          updated[index].quantity_needed = getDefaultQuantityByItemGroup(product?.itemgroup_product || '', true, selectedMaterial.laize);
        } else {
          // For non-buttons, if quantity is empty/zero, use product itemgroup default
          if (!updated[index].quantity_needed || updated[index].quantity_needed === 0) {
            updated[index].quantity_needed = getDefaultQuantityByItemGroup(product?.itemgroup_product || '');
          }
        }

        // Set quantity type default from material if available
        if (selectedMaterial.quantity_type_id) {
          updated[index].quantity_type_id = selectedMaterial.quantity_type_id;
        } else if (!updated[index].quantity_type_id) {
          updated[index].quantity_type_id = quantityTypes[0]?.id || 1;
        }
      }
    }

    setProductMaterials(updated);
    triggerAutoSave(updated);
  };

  const removeMaterial = (index: number) => {
    const updated = productMaterials.filter((_, i) => i !== index);
    setProductMaterials(updated);
    triggerAutoSave(updated);
    toast({
      title: "Matériau supprimé",
      description: "Le matériau a été retiré et la configuration sera sauvegardée automatiquement",
    });
  };

  const saveMaterialsConfiguration = async () => {
    // Validate
    const validMaterials = productMaterials.filter(pm => 
      pm.material_id > 0 && pm.quantity_needed > 0
    );

    if (validMaterials.length === 0) {
      toast({
        title: "Validation",
        description: "Veuillez ajouter au moins un matériau avec une quantité valide",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/production_product_materials.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'configure_product_materials',
          product_id: product.id,
          materials: validMaterials
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Succès",
          description: "Configuration des matériaux sauvegardée avec succès",
        });
        onSave?.();
        onClose();
      } else {
        throw new Error(data.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving materials configuration:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getMaterialName = (materialId: number) => {
    const material = materials.find(m => m.id === materialId);
    return material ? `${material.nom} (${material.reference})` : 'Sélectionner un matériau';
  };

  const getQuantityTypeName = (quantityTypeId: number) => {
    const qType = quantityTypes.find(qt => qt.id === quantityTypeId);
    return qType ? `${qType.nom} (${qType.unit})` : 'Unité';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Configuration Matériaux - {product?.nom_product}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Chargement...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Product Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Informations du Produit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <Label className="font-medium">Référence</Label>
                    <p className="text-muted-foreground">{product?.reference_product}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Type</Label>
                    <p className="text-muted-foreground">{product?.type_product}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Couleur</Label>
                    <p className="text-muted-foreground">{product?.color_product || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Boutique</Label>
                    <Badge variant={product?.boutique_origin === 'luccibyey' ? 'default' : 'secondary'}>
                      {product?.boutique_origin === 'luccibyey' ? 'Lucci By Ey' : 'Spada di Battaglia'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Materials Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Matériaux Requis</CardTitle>
                  <Button 
                    onClick={addMaterial} 
                    size="sm" 
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter Matériau
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {productMaterials.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun matériau configuré</p>
                    <p className="text-sm">Cliquez sur "Ajouter Matériau" pour commencer</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {productMaterials.map((pm, index) => {
                      const selectedMaterial = materials.find(m => m.id === pm.material_id);
                      return (
                        <Card key={index} className="border-l-4 border-l-primary/20">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                              {/* Material Selection */}
                              <div>
                                <Label className="text-sm font-medium">Matériau</Label>
                                <Select 
                                  value={pm.material_id.toString()} 
                                  onValueChange={(value) => updateMaterial(index, 'material_id', parseInt(value))}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Sélectionner" />
                                  </SelectTrigger>
                                  <SelectContent>
                                     {materials.map((material) => (
                                       <SelectItem key={material.id} value={material.id.toString()}>
                                         <div className="flex flex-col">
                                           <span className="font-medium">{material.nom}</span>
                                           <span className="text-xs text-muted-foreground">
                                             {material.reference} • Stock: {material.quantite_stock}
                                             {material.location && ` • 📍 ${material.location}`}
                                           </span>
                                         </div>
                                       </SelectItem>
                                     ))}
                                  </SelectContent>
                                </Select>

                                {/* Laize / Diamètre hint */}
                                {selectedMaterial && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {selectedMaterial.category_id === 1 ? (
                                          `Laize: ${selectedMaterial.laize || 'N/A'} — Quantité par pièce recommandée: ${getDefaultQuantityByItemGroup(product?.itemgroup_product || '', false, selectedMaterial.laize)}`
                                        ) : selectedMaterial.category_id === 3 ? (
                                          `Diamètre: ${selectedMaterial.laize || 'N/A'} — Quantité par pièce recommandée: ${getDefaultQuantityByItemGroup(product?.itemgroup_product || '', true, selectedMaterial.laize)}`
                                        ) : (
                                          `Laize: ${selectedMaterial.laize || 'N/A'} — Quantité par pièce recommandée: ${getDefaultQuantityByItemGroup(product?.itemgroup_product || '', false, selectedMaterial.laize)}`
                                        )}
                                  </p>
                                )}
                              </div>

                               {/* Quantity */}
                               <div>
                                 <Label className="text-sm font-medium">
                                   Quantité par pièce {product?.itemgroup_product && (
                                     <span className="text-red-500">
                                       ({product.itemgroup_product}, {getDefaultQuantityByItemGroup(product.itemgroup_product)} préconfiguré)
                                     </span>
                                   )}
                                 </Label>
                                 <Input
                                   type="number"
                                   step="0.1"
                                   min="0"
                                   value={pm.quantity_needed}
                                   onChange={(e) => updateMaterial(index, 'quantity_needed', parseFloat(e.target.value) || 0)}
                                   className="mt-1"
                                 />
                               </div>

                              {/* Commentaire */}
                              <div>
                                <Label className="text-sm font-medium">Commentaire</Label>
                                <Input
                                  type="text"
                                  value={pm.commentaire || ''}
                                  onChange={(e) => updateMaterial(index, 'commentaire', e.target.value)}
                                  placeholder="Commentaire (optionnel)"
                                  className="mt-1"
                                />
                              </div>

                              {/* Quantity Type */}
                              <div>
                                <Label className="text-sm font-medium">Unité</Label>
                               <Select 
                                 value={pm.quantity_type_id.toString()} 
                                 onValueChange={(value) => updateMaterial(index, 'quantity_type_id', parseInt(value))}
                               >
                                 <SelectTrigger className="mt-1">
                                   <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                   {quantityTypes.map((qt) => (
                                     <SelectItem key={qt.id} value={qt.id.toString()}>
                                       {qt.nom} ({qt.unit})
                                     </SelectItem>
                                   ))}
                                 </SelectContent>
                               </Select>
                             </div>

                             {/* Size Specific */}
                             <div>
                               <Label className="text-sm font-medium">Tailles</Label>
                               <Select 
                                 value={pm.size_specific} 
                                 onValueChange={(value) => updateMaterial(index, 'size_specific', value)}
                               >
                                 <SelectTrigger className="mt-1">
                                   <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                   <SelectItem value="ALL">Toutes les tailles</SelectItem>
                                   <SelectItem value="S">S</SelectItem>
                                   <SelectItem value="M">M</SelectItem>
                                   <SelectItem value="L">L</SelectItem>
                                   <SelectItem value="XL">XL</SelectItem>
                                   <SelectItem value="XXL">XXL</SelectItem>
                                 </SelectContent>
                               </Select>
                             </div>

                              {/* Actions */}
                              <div className="flex items-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeMaterial(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Notes - Full Width */}
                              <div className="md:col-span-6">
                               <Label className="text-sm font-medium">Notes (optionnel)</Label>
                               <Textarea
                                 value={pm.notes}
                                 onChange={(e) => updateMaterial(index, 'notes', e.target.value)}
                                 placeholder="Notes sur l'utilisation de ce matériau..."
                                 className="mt-1"
                                 rows={2}
                               />
                             </div>
                           </div>
                         </CardContent>
                       </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            {productMaterials.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Résumé de la Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {productMaterials
                      .filter(pm => pm.material_id > 0)
                      .map((pm, index) => {
                        const material = materials.find(m => m.id === pm.material_id);
                        return (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{material?.nom || 'N/A'}</span>
                              <Badge variant="outline">{material?.reference}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {pm.quantity_needed} {getQuantityTypeName(pm.quantity_type_id)}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button 
            onClick={saveMaterialsConfiguration} 
            disabled={saving || loading || productMaterials.length === 0}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder Configuration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialsConfigurationModal;
