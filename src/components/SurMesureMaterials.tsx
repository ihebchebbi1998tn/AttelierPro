import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Package, Plus, Search, Settings, AlertCircle, Check, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { 
  getSurMesureMaterials, 
  configureSurMesureMaterials,
  type SurMesureMaterial 
} from '@/utils/surMesureService';

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

interface SurMesureMaterialConfig {
  material_id: number;
  quantity_needed: number;
  quantity_type_id: number;
  commentaire: string;
}

interface SurMesureMaterialsProps {
  commandeId: number;
  orderStatus?: string;
  onMaterialsChange?: () => void;
}

export const SurMesureMaterials: React.FC<SurMesureMaterialsProps> = ({ 
  commandeId, 
  orderStatus,
  onMaterialsChange 
}) => {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [quantityTypes, setQuantityTypes] = useState<QuantityType[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<SurMesureMaterialConfig[]>([]);
  const [existingMaterials, setExistingMaterials] = useState<SurMesureMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [tempConfig, setTempConfig] = useState<{
    quantity_type_id: number;
    quantity_needed: number;
    commentaire: string;
  }>({
    quantity_type_id: 1,
    quantity_needed: 1,
    commentaire: ''
  });

  const formatQuantityDisplay = (quantity: number | string): string => {
    const num = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
    if (isNaN(num)) return '0';
    
    // Check if it's a whole number
    if (num % 1 === 0) {
      return num.toString();
    }
    
    // For decimals, use comma as separator
    return num.toLocaleString('fr-FR', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 3 
    });
  };

  const handleStockDeduction = async () => {
    try {
      const apiUrl = 'https://luccibyey.com.tn/production/api/stock_transactions.php';
      const requestPayload = {
        action: 'deduct_stock_sur_mesure',
        commande_id: commandeId,
        user_id: 1 // TODO: Use actual user ID from auth
      };
      
      console.log('🚀 Auto-deducting stock for new materials...', requestPayload);
      
      const stockResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });
      
      const stockData = await stockResponse.json();
      console.log('📥 Stock deduction response:', stockData);
      
      if (stockData.success) {
        console.log('✅ Auto stock deduction successful!');
        
        if (stockData.transactions && stockData.transactions.length > 0) {
          toast({
            title: "Stock mis à jour",
            description: `Stock déduit automatiquement pour ${stockData.transactions.length} matière(s)`,
          });
        }
        
        // Refresh materials data to show updated stock quantities
        loadData();
      } else {
        console.warn('⚠️ Stock deduction warning:', stockData.message);
        toast({
          title: "Avertissement",
          description: `Erreur de stock: ${stockData.message}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error in auto stock deduction:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la déduction automatique du stock",
        variant: "destructive"
      });
    }
  };

  const parseQuantityInput = (value: string): number => {
    // Replace comma with dot for parsing
    const normalizedValue = value.replace(',', '.');
    const parsed = parseFloat(normalizedValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatQuantityForInput = (quantity: number): string => {
    // For input fields, use comma as decimal separator
    if (quantity % 1 === 0) {
      return quantity.toString();
    }
    return quantity.toString().replace('.', ',');
  };

  useEffect(() => {
    loadData();
  }, [commandeId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load materials first
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

      // Load existing surmesure materials LAST to ensure we have materials and quantity types loaded
      const existingMaterialsData = await getSurMesureMaterials(commandeId);
      setExistingMaterials(existingMaterialsData);
      
      if (existingMaterialsData.length > 0) {
        const existingConfigs = existingMaterialsData.map((sm: SurMesureMaterial) => ({
          material_id: sm.material_id,
          quantity_needed: sm.quantity_needed,
          quantity_type_id: sm.quantity_type_id,
          commentaire: sm.commentaire || ''
        }));
        setSelectedMaterials(existingConfigs);
      } else {
        // Clear selected materials if none exist
        setSelectedMaterials([]);
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
    const existingMaterial = selectedMaterials.find(sm => sm.material_id === material.id);
    if (existingMaterial) {
      setTempConfig({
        quantity_type_id: existingMaterial.quantity_type_id,
        quantity_needed: existingMaterial.quantity_needed,
        commentaire: existingMaterial.commentaire || ''
      });
    } else {
      setTempConfig({
        quantity_type_id: material.quantity_type_id || quantityTypes[0]?.id || 1,
        quantity_needed: 1,
        commentaire: ''
      });
    }
    setShowConfigModal(true);
  };

  const saveMaterialConfig = async () => {
    if (!selectedMaterial) return;

    const newMaterial: SurMesureMaterialConfig = {
      material_id: selectedMaterial.id,
      quantity_needed: tempConfig.quantity_needed,
      quantity_type_id: tempConfig.quantity_type_id,
      commentaire: tempConfig.commentaire || ''
    };

    // Replace any existing configuration for this material
    const withoutCurrent = selectedMaterials.filter(sm => sm.material_id !== selectedMaterial.id);
    const updatedMaterials = [...withoutCurrent, newMaterial];
    setSelectedMaterials(updatedMaterials);
    setShowConfigModal(false);
    setSelectedMaterial(null);

    // Auto-save the configuration
    setSaving(true);
    try {
      await configureSurMesureMaterials(commandeId, updatedMaterials);
      toast({
        title: "Succès",
        description: "Matériau ajouté et configuration sauvegardée automatiquement"
      });
      loadData(); // Reload to get fresh data
      
      // If order status is not "nouveau", automatically deduct stock for new materials
      if (orderStatus && orderStatus !== 'nouveau') {
        await handleStockDeduction();
      }
      
      // Notify parent component of changes
      onMaterialsChange?.();
    } catch (error) {
      console.error('Error auto-saving configuration:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de sauvegarder automatiquement",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStockRestoration = async (materialId: number) => {
    try {
      const apiUrl = 'https://luccibyey.com.tn/production/api/stock_transactions.php';
      const requestPayload = {
        action: 'restore_stock_sur_mesure',
        material_id: materialId,
        commande_id: commandeId,
        user_id: 1 // TODO: Use actual user ID from auth
      };
      
      console.log('🔄 Restoring stock for removed material...', requestPayload);
      
      const stockResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });
      
      const stockData = await stockResponse.json();
      console.log('📥 Stock restoration response:', stockData);
      
      if (stockData.success) {
        console.log('✅ Stock restoration successful!');
        
        if (stockData.restoration) {
          toast({
            title: "Stock restauré",
            description: `${stockData.restoration.quantity_restored} unités de ${stockData.restoration.material_name} restaurées`,
          });
        }
        
        // Refresh materials data to show updated stock quantities
        loadData();
      } else {
        console.warn('⚠️ Stock restoration warning:', stockData.message);
        // Don't show error toast for "no deduction found" as it's expected for non-deducted materials
        if (!stockData.message.includes('Aucune déduction de stock trouvée')) {
          toast({
            title: "Avertissement",
            description: `Erreur de restauration: ${stockData.message}`,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('❌ Error in stock restoration:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la restauration du stock",
        variant: "destructive"
      });
    }
  };

  const removeSelectedMaterial = async (materialId: number) => {
    // First, try to restore stock if it was deducted (only for non-nouveau orders)
    if (orderStatus && orderStatus !== 'nouveau') {
      await handleStockRestoration(materialId);
    }
    
    const updated = selectedMaterials.filter(sm => sm.material_id !== materialId);
    setSelectedMaterials(updated);
    
    // Auto-save the updated configuration
    setSaving(true);
    try {
      await configureSurMesureMaterials(commandeId, updated);
      toast({
        title: "Succès",
        description: "Matériau retiré et configuration sauvegardée automatiquement"
      });
      loadData(); // Reload to get fresh data
      onMaterialsChange?.();
    } catch (error) {
      console.error('Error auto-saving after removal:', error);
      toast({
        title: "Erreur",
        description: "Matériau retiré mais erreur lors de la sauvegarde",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
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
      // Use the batch configuration function that handles everything in a transaction
      await configureSurMesureMaterials(commandeId, selectedMaterials);

      toast({
        title: "Succès",
        description: "Configuration des matériaux sauvegardée avec succès"
      });
      loadData();
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
    // First try to find in existing materials (with full details from API)
    const existingMaterial = existingMaterials.find(em => em.material_id === materialId);
    if (existingMaterial?.material_name) {
      return existingMaterial.material_name;
    }
    
    // Fallback to materials array
    const material = materials.find(m => m.id === materialId);
    return material ? `${material.nom} (${material.reference})` : 'Matériau inconnu';
  };

  const getQuantityTypeName = (quantityTypeId: number) => {
    const qType = quantityTypes.find(qt => qt.id === quantityTypeId);
    return qType ? `${qType.nom} (${qType.unite})` : 'Unité';
  };

  const getConfiguredQuantity = (materialId: number) => {
    const materialConfig = selectedMaterials.find(sm => sm.material_id === materialId);
    if (!materialConfig) return null;
    const quantityType = quantityTypes.find(qt => qt.id === materialConfig.quantity_type_id);
    return {
      quantity: materialConfig.quantity_needed,
      unit: quantityType?.unite || '',
      commentaire: materialConfig.commentaire
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

  const distinctSelectedCount = selectedMaterials.length;

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
      {/* Current Configuration Table - moved to top */}
      {distinctSelectedCount > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Configuration Actuelle ({distinctSelectedCount} matériau{distinctSelectedCount > 1 ? 'x' : ''})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left font-medium">Matériau</th>
                    <th className="border border-gray-200 px-4 py-2 text-left font-medium">Couleur</th>
                    <th className="border border-gray-200 px-4 py-2 text-left font-medium">Catégorie</th>
                    <th className="border border-gray-200 px-4 py-2 text-left font-medium">Quantité</th>
                    <th className="border border-gray-200 px-4 py-2 text-left font-medium">Commentaire</th>
                    <th className="border border-gray-200 px-4 py-2 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMaterials.map((sm, index) => {
                    const material = materials.find(m => m.id === sm.material_id);
                    const existingMaterial = existingMaterials.find(em => em.material_id === sm.material_id);
                    return (
                      <tr key={`config-row-${sm.material_id}-${index}`} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-2">
                          <div className="font-medium">{getMaterialName(sm.material_id)}</div>
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          <div className="flex items-center gap-2">
                            {(material?.couleur || existingMaterial?.material_color) ? (
                              <span className="text-sm">{material?.couleur || existingMaterial?.material_color}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          <Badge variant="outline" className="text-xs">
                            {material?.category_name || existingMaterial?.category_name || '-'}
                          </Badge>
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          <div className="font-medium">
                            {formatQuantityDisplay(sm.quantity_needed)} {getQuantityTypeName(sm.quantity_type_id)}
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          <div className="text-sm max-w-32 truncate" title={sm.commentaire || '-'}>
                            {sm.commentaire || '-'}
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeSelectedMaterial(sm.material_id)}
                            className="h-8 w-8 p-0 hover:bg-red-100"
                            title="Retirer le matériau"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

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
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-10" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredMaterials.map(material => (
              <Card 
                key={`material-${material.id}`}
                className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                  isSelected(material.id) 
                    ? 'ring-2 ring-green-600 bg-green-50 border-green-600 shadow-lg' 
                    : getStockStatus(material.quantite_stock, material.quantite_min || 0, material.quantite_max || 100).status === 'critical'
                      ? 'hover:bg-destructive-light/20 border-l-4 border-l-destructive bg-destructive-light/10 border-destructive/20'
                      : 'hover:bg-muted/30 border-border'
                }`}
                onClick={() => openMaterialConfig(material)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm mb-1 truncate">{material.nom}</h3>
                      <p className="text-xs text-muted-foreground mb-1">{material.reference}</p>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{material.description}</p>
                    </div>
                    {isSelected(material.id) && (
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSelectedMaterial(material.id);
                          }}
                          className="h-6 w-6 p-0 hover:bg-red-100"
                        >
                          <X className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Material Details */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Stock:</span>
                      <Badge 
                        variant={getStockStatus(material.quantite_stock, material.quantite_min || 0, material.quantite_max || 100).badgeVariant as any}
                        className="text-xs px-1 py-0"
                      >
                        {formatQuantityDisplay(material.quantite_stock)}
                      </Badge>
                    </div>

                    {material.couleur && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Couleur:</span>
                        <span className="font-medium">{material.couleur}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Catégorie:</span>
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {material.category_name}
                      </Badge>
                    </div>

                    {/* Show configured quantity and comments if selected */}
                    {isSelected(material.id) && (
                      <div className="mt-2 p-3 bg-green-100 rounded-lg border-2 border-green-300">
                        {(() => {
                          const config = getConfiguredQuantity(material.id);
                          return config ? (
                            <div className="text-green-900">
                              <div className="font-semibold text-sm mb-1">
                                ✓ Sélectionné: {formatQuantityDisplay(config.quantity)} {config.unit}
                              </div>
                              <div className="text-xs">
                                <strong>Commentaire:</strong> {config.commentaire || '-'}
                              </div>
                            </div>
                          ) : (
                            <div className="text-green-900 text-sm font-semibold">
                              ✓ Matériau sélectionné
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Material Configuration Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurer le Matériau</DialogTitle>
          </DialogHeader>

          {selectedMaterial && (
            <div className="space-y-4">
              {/* Material Info */}
              <div className="p-3 bg-muted/50 rounded-md">
                <h4 className="font-medium">{selectedMaterial.nom}</h4>
                <p className="text-sm text-muted-foreground">{selectedMaterial.reference}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{selectedMaterial.category_name}</Badge>
                  {(() => {
                    const stockStatus = getStockStatus(selectedMaterial.quantite_stock, selectedMaterial.quantite_min || 0, selectedMaterial.quantite_max || 100);
                    return (
                      <Badge variant={stockStatus.badgeVariant as any}>
                        Stock: {formatQuantityDisplay(selectedMaterial.quantite_stock)}
                      </Badge>
                    );
                  })()}
                </div>
              </div>

              {/* Quantity Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantité nécessaire</Label>
                  <Input
                    type="text"
                    value={formatQuantityForInput(tempConfig.quantity_needed)}
                    onChange={(e) => setTempConfig({
                      ...tempConfig,
                      quantity_needed: parseQuantityInput(e.target.value)
                    })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Unité</Label>
                  <Select 
                    value={tempConfig.quantity_type_id.toString()} 
                    onValueChange={(value) => setTempConfig({
                      ...tempConfig,
                      quantity_type_id: parseInt(value)
                    })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {quantityTypes.map((qt) => (
                        <SelectItem key={qt.id} value={qt.id.toString()}>
                          {qt.nom} ({qt.unite})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Comment */}
              <div>
                <Label>Commentaire (optionnel)</Label>
                <Textarea
                  value={tempConfig.commentaire}
                  onChange={(e) => setTempConfig({
                    ...tempConfig,
                    commentaire: e.target.value
                  })}
                  placeholder="Notes spéciales pour ce matériau..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfigModal(false)}
            >
              Annuler
            </Button>
            <Button onClick={saveMaterialConfig}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};