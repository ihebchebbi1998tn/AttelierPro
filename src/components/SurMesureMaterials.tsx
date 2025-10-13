import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Save, Loader2, Plus, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Material {
  id: number;
  nom: string;
  reference: string;
  quantite_stock: number;
  quantity_type_id: number;
}

interface QuantityType {
  id: number;
  nom: string;
  unite: string;
}

interface MaterialUsage {
  material_id: number;
  quantity_used: number;
  quantity_type_id: number;
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
  const navigate = useNavigate();
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [quantityTypes, setQuantityTypes] = useState<QuantityType[]>([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [materialUsages, setMaterialUsages] = useState<Record<string, MaterialUsage>>({});
  const [savedMaterialIds, setSavedMaterialIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [newMaterialId, setNewMaterialId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const formatQuantity = (value: number): string => {
    if (value % 1 === 0) return value.toString();
    return value.toString().replace('.', ',');
  };

  const parseQuantity = (value: string): number => {
    const normalized = value.replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  useEffect(() => {
    loadData();
  }, [commandeId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all materials and filter by location
      const materialsResponse = await fetch('https://luccibyey.com.tn/production/api/matieres.php');
      const materialsData = await materialsResponse.json();
      if (materialsData.success) {
        const normalizedMaterials: Material[] = (materialsData.data || [])
          .filter((m: any) => m.location === 'Lucci By Ey' || m.location === 'Les Deux')
          .map((m: any) => ({
            id: parseInt(m.id),
            nom: m.nom,
            reference: m.reference,
            quantite_stock: parseFloat(m.quantite_stock),
            quantity_type_id: parseInt(m.quantity_type_id)
          }));
        setAllMaterials(normalizedMaterials);
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

      // Load order data to get selected_matieres
      const orderResponse = await fetch('https://luccibyey.com.tn/api/get_sur_mesure_orders.php');
      const orderData = await orderResponse.json();
      if (orderData.success) {
        const order = orderData.data.find((o: any) => o.id.toString() === commandeId.toString());
        if (order && order.selected_matieres) {
          setSelectedMaterialIds(order.selected_matieres);
        }
      }

      // Load saved material quantities from surmesure_matieres table
      const savedMaterialsResponse = await fetch(`https://luccibyey.com.tn/production/api/surmesure_matieres.php?commande_id=${commandeId}`);
      const savedMaterialsData = await savedMaterialsResponse.json();
      if (savedMaterialsData.success && savedMaterialsData.data.length > 0) {
        const loadedUsages: Record<string, MaterialUsage> = {};
        const savedIds = new Set<string>();
        savedMaterialsData.data.forEach((item: any) => {
          const materialId = item.material_id.toString();
          loadedUsages[materialId] = {
            material_id: parseInt(item.material_id),
            quantity_used: parseFloat(item.quantity_needed),
            quantity_type_id: parseInt(item.quantity_type_id)
          };
          savedIds.add(materialId);
        });
        setMaterialUsages(loadedUsages);
        setSavedMaterialIds(savedIds);
      }


      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des données",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const getMaterialById = (id: string): Material | undefined => {
    return allMaterials.find(m => m.id.toString() === id);
  };

  const getQuantityTypeName = (typeId: number): string => {
    const qt = quantityTypes.find(qt => qt.id === typeId);
    return qt ? `${qt.nom} (${qt.unite})` : '';
  };

  const handleQuantityChange = (materialId: string, value: string) => {
    const quantity = parseQuantity(value);
    const material = getMaterialById(materialId);
    
    setMaterialUsages(prev => ({
      ...prev,
      [materialId]: {
        material_id: parseInt(materialId),
        quantity_used: quantity,
        quantity_type_id: material?.quantity_type_id || 1
      }
    }));
  };

  const handleQuantityTypeChange = (materialId: string, typeId: string) => {
    setMaterialUsages(prev => ({
      ...prev,
      [materialId]: {
        ...prev[materialId],
        material_id: parseInt(materialId),
        quantity_used: prev[materialId]?.quantity_used || 0,
        quantity_type_id: parseInt(typeId)
      }
    }));
  };

  const handleSaveClick = () => {
    // Check if there are any unsaved materials with quantities
    const hasUnsavedMaterials = Object.entries(materialUsages).some(
      ([materialId, usage]) => !savedMaterialIds.has(materialId) && usage.quantity_used > 0
    );
    
    if (!hasUnsavedMaterials) {
      toast({
        title: "Attention",
        description: "Aucune nouvelle quantité à enregistrer",
        variant: "destructive"
      });
      return;
    }
    
    setShowConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmDialog(false);
    setSaving(true);
    try {
      // Prepare only NEW materials (not already saved) to save
      const materialsToSave = Object.entries(materialUsages)
        .filter(([materialId, usage]) => !savedMaterialIds.has(materialId) && usage.quantity_used > 0)
        .map(([materialId, usage]) => ({
          material_id: usage.material_id,
          quantity_needed: usage.quantity_used, // API expects quantity_needed
          quantity_type_id: usage.quantity_type_id
        }));

      if (materialsToSave.length === 0) {
        toast({
          title: "Attention",
          description: "Aucune quantité à enregistrer",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }

      // Save material usages using configure action (append mode)
      // We need to get existing materials first and append new ones
      const existingMaterialsResponse = await fetch(`https://luccibyey.com.tn/production/api/surmesure_matieres.php?commande_id=${commandeId}`);
      const existingMaterialsData = await existingMaterialsResponse.json();
      
      let allMaterials = materialsToSave;
      if (existingMaterialsData.success && existingMaterialsData.data.length > 0) {
        // Combine existing saved materials with new ones
        const existingMaterials = existingMaterialsData.data.map((item: any) => ({
          material_id: parseInt(item.material_id),
          quantity_needed: parseFloat(item.quantity_needed),
          quantity_type_id: parseInt(item.quantity_type_id)
        }));
        allMaterials = [...existingMaterials, ...materialsToSave];
      }

      const response = await fetch('https://luccibyey.com.tn/production/api/surmesure_matieres.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'configure_surmesure_materials',
          commande_id: commandeId,
          materials: allMaterials
        })
      });

      const data = await response.json();

      if (data.success) {
        // Now deduct the stock using stock_transactions API
        const deductResponse = await fetch('https://luccibyey.com.tn/production/api/stock_transactions.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'deduct_stock_sur_mesure',
            commande_id: commandeId
          })
        });

        const deductData = await deductResponse.json();

        if (deductData.success) {
          toast({
            title: "Succès",
            description: "Quantités enregistrées et stock ajusté automatiquement",
          });

          if (onMaterialsChange) {
            onMaterialsChange();
          }

          // Reload data to show updated stock
          loadData();
        } else {
          throw new Error(deductData.message || 'Erreur lors de la déduction du stock');
        }
      } else {
        throw new Error(data.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Error saving materials:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'enregistrement des quantités",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddMaterial = async () => {
    if (!newMaterialId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un matériau",
        variant: "destructive"
      });
      return;
    }

    if (selectedMaterialIds.includes(newMaterialId)) {
      toast({
        title: "Erreur",
        description: "Ce matériau est déjà sélectionné",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const updatedMaterialIds = [...selectedMaterialIds, newMaterialId];
      
      const response = await fetch('https://luccibyey.com.tn/production/api/update_surmesure_materials.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commande_id: commandeId,
          selected_matieres: updatedMaterialIds
        })
      });

      const data = await response.json();

      if (data.success) {
        setSelectedMaterialIds(updatedMaterialIds);
        setNewMaterialId('');
        setIsAddingMaterial(false);
        
        toast({
          title: "Succès",
          description: "Matériau ajouté avec succès",
        });

        if (onMaterialsChange) {
          onMaterialsChange();
        }
      } else {
        throw new Error(data.message || 'Erreur lors de l\'ajout du matériau');
      }
    } catch (error) {
      console.error('Error adding material:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'ajout du matériau",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMaterial = async (materialId: string) => {
    // Don't allow removing if already saved with quantities
    if (savedMaterialIds.has(materialId)) {
      toast({
        title: "Impossible",
        description: "Impossible de retirer un matériau déjà enregistré avec des quantités",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const updatedMaterialIds = selectedMaterialIds.filter(id => id !== materialId);
      
      const response = await fetch('https://luccibyey.com.tn/production/api/update_surmesure_materials.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commande_id: commandeId,
          selected_matieres: updatedMaterialIds
        })
      });

      const data = await response.json();

      if (data.success) {
        setSelectedMaterialIds(updatedMaterialIds);
        
        // Remove from material usages as well
        setMaterialUsages(prev => {
          const updated = { ...prev };
          delete updated[materialId];
          return updated;
        });
        
        toast({
          title: "Succès",
          description: "Matériau retiré avec succès",
        });

        if (onMaterialsChange) {
          onMaterialsChange();
        }
      } else {
        throw new Error(data.message || 'Erreur lors du retrait du matériau');
      }
    } catch (error) {
      console.error('Error removing material:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors du retrait du matériau",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getStockStatus = (material: Material) => {
    const usedQuantity = materialUsages[material.id.toString()]?.quantity_used || 0;
    const remaining = material.quantite_stock - usedQuantity;
    
    // If used quantity exceeds stock - show pink (overstocked logic from stock page)
    if (remaining < 0 || usedQuantity > material.quantite_stock) {
      return { variant: 'default' as const, text: 'Dépasse stock', className: 'bg-pink-500 text-white hover:bg-pink-600' };
    } else if (remaining === 0) {
      return { variant: 'destructive' as const, text: 'Stock épuisé', className: 'bg-destructive text-white' };
    } else if (remaining < material.quantite_stock * 0.2) {
      return { variant: 'destructive' as const, text: 'Stock critique', className: 'bg-destructive text-white' };
    } else if (remaining < material.quantite_stock * 0.5) {
      return { variant: 'warning' as const, text: 'Stock faible', className: 'bg-warning text-white' };
    }
    return { variant: 'success' as const, text: 'Stock suffisant', className: 'bg-success text-white' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Chargement des matériaux...</span>
      </div>
    );
  }


  const selectedMaterials = selectedMaterialIds
    .map(id => getMaterialById(id))
    .filter((m): m is Material => m !== undefined);

  const availableMaterials = allMaterials.filter(
    m => !selectedMaterialIds.includes(m.id.toString())
  );

  const filteredAvailableMaterials = availableMaterials.filter(
    m => m.nom.toLowerCase().includes(searchQuery.toLowerCase()) || 
         m.reference.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">
            {selectedMaterials.length === 0 ? 'Aucun matériau configuré coté Lucci' : 'Matériaux configurés'}
          </h3>
          <p className="text-sm text-destructive mt-1">
            L'ajout de matériau ici est temporaire
          </p>
        </div>
        {!isAddingMaterial && availableMaterials.length > 0 && (
          <Button 
            onClick={() => setIsAddingMaterial(true)} 
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un matériau
          </Button>
        )}
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Matériau</TableHead>
              <TableHead>Référence</TableHead>
              <TableHead>Stock Actuel</TableHead>
              <TableHead>Quantité Utilisée</TableHead>
              <TableHead>Unité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Add Material Row */}
            {isAddingMaterial && (
              <TableRow className="bg-muted/30">
                <TableCell colSpan={2}>
                  <div className="space-y-2 relative">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Rechercher et sélectionner un matériau..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                        onFocus={() => setSearchQuery('')}
                      />
                      {searchQuery && filteredAvailableMaterials.length > 0 && (
                        <div className="fixed z-[100] mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto" style={{
                          width: 'calc(100% - 2rem)',
                          maxWidth: '600px'
                        }}>
                          {filteredAvailableMaterials.map((material) => (
                            <div
                              key={material.id}
                              onClick={() => {
                                setNewMaterialId(material.id.toString());
                                setSearchQuery(material.nom + ' (' + material.reference + ')');
                              }}
                              className="px-3 py-2 hover:bg-accent cursor-pointer border-b last:border-b-0 text-popover-foreground"
                            >
                              <div className="font-medium">{material.nom}</div>
                              <div className="text-sm text-muted-foreground">{material.reference}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {searchQuery && filteredAvailableMaterials.length === 0 && (
                        <div className="fixed z-[100] mt-1 bg-popover border rounded-md shadow-lg p-3" style={{
                          width: 'calc(100% - 2rem)',
                          maxWidth: '600px'
                        }}>
                          <p className="text-sm text-muted-foreground">Aucun matériau trouvé</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {newMaterialId && (
                    <Badge variant="outline">
                      {formatQuantity(getMaterialById(newMaterialId)?.quantite_stock || 0)} {getQuantityTypeName(getMaterialById(newMaterialId)?.quantity_type_id || 1)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    placeholder="0"
                    className="w-24"
                    inputMode="decimal"
                    disabled={!newMaterialId}
                  />
                </TableCell>
                <TableCell>
                  <Select disabled={!newMaterialId}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Unité" />
                    </SelectTrigger>
                    <SelectContent>
                      {quantityTypes.map((qt) => (
                        <SelectItem key={qt.id} value={qt.id.toString()}>
                          {qt.nom} ({qt.unite})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">-</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleAddMaterial}
                      disabled={!newMaterialId || saving}
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsAddingMaterial(false);
                        setNewMaterialId('');
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Existing Materials */}
            {selectedMaterials.map((material) => {
              const stockStatus = getStockStatus(material);
              const usedQuantity = materialUsages[material.id.toString()]?.quantity_used || 0;
              const isSaved = savedMaterialIds.has(material.id.toString());
              
              
              return (
                <TableRow key={material.id} className={isSaved ? 'bg-muted/50' : ''}>
                  <TableCell className="font-medium">
                    <button 
                      onClick={() => navigate(`/material-details/${material.id}`)}
                      className="text-primary hover:underline cursor-pointer"
                    >
                      {material.nom}
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{material.reference}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {formatQuantity(material.quantite_stock)} {getQuantityTypeName(material.quantity_type_id)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      value={usedQuantity > 0 ? formatQuantity(usedQuantity) : ''}
                      onChange={(e) => handleQuantityChange(material.id.toString(), e.target.value)}
                      placeholder="0"
                      className="w-24"
                      inputMode="decimal"
                      disabled={isSaved}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={materialUsages[material.id.toString()]?.quantity_type_id?.toString() || material.quantity_type_id.toString()}
                      onValueChange={(value) => handleQuantityTypeChange(material.id.toString(), value)}
                      disabled={isSaved}
                    >
                      <SelectTrigger className="w-32">
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
                  </TableCell>
                  <TableCell>
                    <Badge variant={stockStatus.variant} className={stockStatus.className}>
                      {stockStatus.text}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {!isSaved && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMaterial(material.id.toString())}
                        disabled={saving}
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}

            {selectedMaterials.length === 0 && !isAddingMaterial && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun matériau sélectionné. Cliquez sur "Ajouter un matériau" pour commencer.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSaveClick} 
          disabled={saving || Object.entries(materialUsages).every(([id, usage]) => savedMaterialIds.has(id) || usage.quantity_used === 0)}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </>
          )}
        </Button>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'enregistrement</AlertDialogTitle>
            <AlertDialogDescription>
              En enregistrant, le stock des matériaux sera automatiquement ajusté selon les quantités utilisées. Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
