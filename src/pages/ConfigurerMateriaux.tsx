
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
import { StockInsufficiencyModal } from "@/components/StockInsufficiencyModal";
import { MaterialMergeModal } from "@/components/MaterialMergeModal";

interface Material {
  id: number;
  nom: string;
  reference: string;
  category_id: number;
  category_name: string;
  quantite_stock: number;
  quantite_min: number;
  quantite_max: number;
  prix_unitaire: number;
  couleur?: string;
  description: string;
  quantity_type_id: number;
  laize?: string;
  location?: string;
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
  production_quantities?: string;
  itemgroup_product?: string;
}

interface ProductSize {
  id: number;
  product_id: number;
  size_type: string;
  size_value: string;
  is_active: boolean;
}

// Predefined quantities per item group
const PREDEFINED_QUANTITIES: Record<string, number> = {
  'smoking': 2.7,
  'blazer croise': 1.7,
  'blazers': 1.7,
  'chemise': 1.7,
  'costume': 2.8,
  'blazer': 1.7,
  'pantalon': 1.3,
  'trench': 2.0,
  'short': 1.0,
  'costume-croise': 2.8,
  'manteau': 2.0
};

// Buttons: nested map by itemgroup -> laize -> quantity
const BUTTON_QUANTITIES: Record<string, Record<string, number>> = {
  'smoking': { '40': 2, '22': 2, '32': 2 },
  'blazer croise': { '40': 2, '22': 2, '32': 2 },
  'blazers': { '40': 2, '22': 2, '32': 2 },
  'chemise': { '40': 2, '22': 2, '32': 2 },
  'costume': { '40': 2, '22': 2, '32': 2 },
  'blazer': { '40': 2, '22': 2, '32': 2 },
  'pantalon': { '40': 2, '22': 2, '32': 2 },
  'trench': { '40': 2, '22': 2, '32': 2 },
  'short': { '40': 2, '22': 2, '32': 2 },
  'costume-croise': { '40': 2, '22': 2, '32': 2 },
  'manteau': { '40': 2, '22': 2, '32': 2 }
};

const getDefaultQuantityByItemGroup = (itemGroup: string | undefined, isButton = false, laize?: string) => {
  const ig = (itemGroup || '').toLowerCase().trim();
  if (isButton) {
    const groupMap = BUTTON_QUANTITIES[ig];
    if (groupMap) {
      const la = (laize || '').toString().replace(/[^0-9]/g, '');
      if (la && groupMap[la] !== undefined) return groupMap[la];
      // fallback to first defined
      const first = Object.values(groupMap)[0];
      return first ?? 2;
    }
    return 2;
  }

  return PREDEFINED_QUANTITIES[ig] ?? 1;
};

const ConfigurerMateriaux = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [quantityTypes, setQuantityTypes] = useState<QuantityType[]>([]);
  const [productSizes, setProductSizes] = useState<ProductSize[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<ProductMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [productionQuantities, setProductionQuantities] = useState<Record<string, number>>({});
  const [stockErrors, setStockErrors] = useState<Record<string, string>>({});
  const [tempConfig, setTempConfig] = useState<{
    quantity_type_id: number;
    quantityPerItem: number;
  }>({
    quantity_type_id: 1,
    quantityPerItem: 0
  });
  
  // Step state: 1=tissues (cat=1), 2=buttons (cat=3), 3=epaulette (cat=7), 4=cigarette (cat=6), 5=plastron (cat=5)
  const [currentStep, setCurrentStep] = useState(1);
  
  // Stock insufficiency and merge states
  const [showStockInsufficiencyModal, setShowStockInsufficiencyModal] = useState(false);
  const [showMergeMaterialModal, setShowMergeMaterialModal] = useState(false);
  const [insufficientStockData, setInsufficientStockData] = useState<{
    currentStock: number;
    neededStock: number;
    unit: string;
  } | null>(null);
  const [mergeFirstMaterialData, setMergeFirstMaterialData] = useState<{
    material: Material;
    totalNeeded: number;
    quantityUsed: number;
  } | null>(null);

  // Long-press fusion states
  const [longPressSelectedMaterials, setLongPressSelectedMaterials] = useState<number[]>([]);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showFusionModal, setShowFusionModal] = useState(false);
  const [pressingMaterialId, setPressingMaterialId] = useState<number | null>(null);

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

        // Parse production quantities (Stock à produire)
        if (productData.data.production_quantities) {
          try {
            const prodQty = JSON.parse(productData.data.production_quantities);
            setProductionQuantities(prodQty);
          } catch (e) {
            console.error('Error parsing production quantities:', e);
          }
        }

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
            // Ensure we include category_id because UI filters rely on it (1 = tissus, 3 = boutons)
            category_id: parseInt(m.category_id ?? m.category ?? 0),
            category_name: m.category_name,
          quantite_stock: parseFloat(m.quantite_stock),
          quantite_min: parseFloat(m.quantite_min),
          quantite_max: parseFloat(m.quantite_max),
          prix_unitaire: parseFloat(m.prix_unitaire),
          couleur: m.couleur,
          description: m.description,
          quantity_type_id: parseInt(m.quantity_type_id),
          laize: m.laize,
          location: m.location
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
        // Automatically deduct stock after successful save
        await deductStockForMaterials();
        
        toast({
          title: "Auto-sauvegarde",
          description: "Configuration sauvegardée et stock déduit automatiquement",
        });
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  }, [productId, toast]);

  const deductStockForMaterials = async () => {
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/deduct_materials_stock.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: productId,
          quantities_to_produce: productionQuantities
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        if (data.insufficient_materials) {
          const insufficientList = data.insufficient_materials
            .map((m: any) => `${m.material_name}: ${m.shortage.toFixed(2)} manquant`)
            .join(', ');
          
          console.log('Stock insuffisant:', insufficientList);
        }
      }
    } catch (error) {
      console.error('Error deducting stock:', error);
    }
  };


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
    // Don't open config if in fusion mode
    if (longPressSelectedMaterials.length > 0) {
      return;
    }
    
    setSelectedMaterial(material);
    setStockErrors({}); // Clear previous errors

    // Get predefined quantity based on itemgroup_product
    const itemGroup = product?.itemgroup_product?.toLowerCase().trim() || '';
  const isButtonMaterial = (material as any).category_id === 3 || (material.category_name || '').toLowerCase().includes('bouton');
  const predefinedQty = getDefaultQuantityByItemGroup(product?.itemgroup_product, isButtonMaterial, material.laize) || 1;
    
    console.log('🔍 Material Config Debug:', {
      itemgroup_product: product?.itemgroup_product,
      itemGroup,
      predefinedQty,
      PREDEFINED_QUANTITIES
    });

    // Check if material is already configured and load existing configuration
    const existingMaterials = selectedMaterials.filter(sm => sm.material_id === material.id);
    if (existingMaterials.length > 0) {
      // Load existing quantity per item (should be the same across all entries)
      setTempConfig({
        quantity_type_id: existingMaterials[0].quantity_type_id,
        quantityPerItem: existingMaterials[0].quantity_needed
      });
    } else {
      // Initialize with predefined or default quantity per item
      setTempConfig({
        quantity_type_id: material.quantity_type_id || quantityTypes[0]?.id || 1,
        quantityPerItem: predefinedQty
      });
    }
    setShowConfigModal(true);
  };

  const saveMaterialConfig = () => {
    if (!selectedMaterial) return;

    // Calculate total items to produce
    const totalItemsToProduce = Object.values(productionQuantities).reduce((sum, qty) => sum + qty, 0);
    
    // Calculate total stock needed
    const totalNeeded = tempConfig.quantityPerItem * totalItemsToProduce;

    const currentStock = selectedMaterial.quantite_stock;
    const quantityType = quantityTypes.find(qt => qt.id === tempConfig.quantity_type_id);
    const unit = quantityType?.unite || '';

    // Check if stock is sufficient
    if (totalNeeded > currentStock) {
      // Stock insufficient - show modal
      setInsufficientStockData({
        currentStock,
        neededStock: totalNeeded,
        unit
      });
      setMergeFirstMaterialData({
        material: selectedMaterial,
        totalNeeded,
        quantityUsed: currentStock // Will use all available stock of first material
      });
      setShowStockInsufficiencyModal(true);
      return;
    }

    // Stock sufficient - proceed normally
    // Create one ProductMaterial entry with quantity per item
    const newMaterials: ProductMaterial[] = [{
      material_id: selectedMaterial.id,
      quantity_needed: tempConfig.quantityPerItem,
      quantity_type_id: tempConfig.quantity_type_id,
      size_specific: null, // Not size-specific anymore
      notes: '',
      commentaire: ''
    }];

    // Replace any existing configuration for this material
    const withoutCurrent = selectedMaterials.filter(sm => sm.material_id !== selectedMaterial.id);
    const updated = [...withoutCurrent, ...newMaterials];
    setSelectedMaterials(updated);
    triggerAutoSave(updated);
    setShowConfigModal(false);
    setSelectedMaterial(null);
    setStockErrors({});
    
    toast({
      title: "Matériau configuré",
      description: "La configuration sera sauvegardée automatiquement",
    });
  };

  const handleMergeClick = () => {
    setShowStockInsufficiencyModal(false);
    setShowMergeMaterialModal(true);
  };

  const handleMergeConfirm = async (secondMaterial: Material) => {
    if (!selectedMaterial || !mergeFirstMaterialData || !insufficientStockData) return;

    const remainingNeeded = insufficientStockData.neededStock - mergeFirstMaterialData.quantityUsed;

    // Check if combined stock is sufficient
    if (secondMaterial.quantite_stock < remainingNeeded) {
      toast({
        title: "Stock insuffisant",
        description: `Le stock des deux matériaux n'est pas suffisant pour cette production`,
        variant: "destructive"
      });
      return;
    }

    // Calculate total items to produce
    const totalItemsToProduce = Object.values(productionQuantities).reduce((sum, qty) => sum + qty, 0);
    
    // Calculate quantity per item for each material
    const firstMaterialStock = mergeFirstMaterialData.quantityUsed;
    const firstMaterialQuantityPerItem = firstMaterialStock / totalItemsToProduce;
    const secondMaterialQuantityPerItem = tempConfig.quantityPerItem - firstMaterialQuantityPerItem;

    const newMaterials: ProductMaterial[] = [];

    // Add first material configuration
    if (firstMaterialQuantityPerItem > 0) {
      newMaterials.push({
        material_id: selectedMaterial.id,
        quantity_needed: firstMaterialQuantityPerItem,
        quantity_type_id: tempConfig.quantity_type_id,
        size_specific: null,
        notes: '',
        commentaire: ''
      });
    }

    // Add second material configuration
    if (secondMaterialQuantityPerItem > 0) {
      newMaterials.push({
        material_id: secondMaterial.id,
        quantity_needed: secondMaterialQuantityPerItem,
        quantity_type_id: tempConfig.quantity_type_id,
        size_specific: null,
        notes: '',
        commentaire: ''
      });
    }

    // Replace any existing configuration for these materials
    const withoutCurrent = selectedMaterials.filter(
      sm => sm.material_id !== selectedMaterial.id && sm.material_id !== secondMaterial.id
    );
    const updated = [...withoutCurrent, ...newMaterials];
    
    setSelectedMaterials(updated);
    triggerAutoSave(updated);
    
    // Close all modals and reset state
    setShowMergeMaterialModal(false);
    setShowConfigModal(false);
    setSelectedMaterial(null);
    setStockErrors({});
    setInsufficientStockData(null);
    setMergeFirstMaterialData(null);
    
    toast({
      title: "Matériaux fusionnés",
      description: "Les deux matériaux ont été configurés avec succès",
    });
  };

  const handleCancelMerge = () => {
    setShowStockInsufficiencyModal(false);
    setShowMergeMaterialModal(false);
    setInsufficientStockData(null);
    setMergeFirstMaterialData(null);
  };

  // Long-press fusion handlers
  const handleMouseDown = (materialId: number) => {
    setPressingMaterialId(materialId);
    const timer = setTimeout(() => {
      // Toggle selection
      setLongPressSelectedMaterials(prev => {
        if (prev.includes(materialId)) {
          return prev.filter(id => id !== materialId);
        }
        return [...prev, materialId];
      });
      setPressingMaterialId(null);
      
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    }, 3000); // 3 seconds
    setPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    setPressingMaterialId(null);
  };

  const handleTouchStart = (materialId: number) => {
    setPressingMaterialId(materialId);
    const timer = setTimeout(() => {
      setLongPressSelectedMaterials(prev => {
        if (prev.includes(materialId)) {
          return prev.filter(id => id !== materialId);
        }
        return [...prev, materialId];
      });
      setPressingMaterialId(null);
      
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    }, 3000);
    setPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    setPressingMaterialId(null);
  };

  const handleFusionClick = () => {
    if (longPressSelectedMaterials.length < 2) {
      toast({
        title: "Sélection insuffisante",
        description: "Veuillez sélectionner au moins 2 matériaux pour les fusionner",
        variant: "destructive"
      });
      return;
    }
    setShowFusionModal(true);
  };

  const handleFusionConfirm = () => {
    if (longPressSelectedMaterials.length < 2) return;

    // Calculate combined stock
    const fusionedMaterials = materials.filter(m => longPressSelectedMaterials.includes(m.id));
    const totalStock = fusionedMaterials.reduce((sum, m) => sum + m.quantite_stock, 0);
    
    // Open the configuration modal with combined stock info
    const firstMaterial = fusionedMaterials[0];
    const combinedMaterial: Material = {
      ...firstMaterial,
      quantite_stock: totalStock
    };

    setSelectedMaterial(combinedMaterial);
    setTempConfig({
      quantity_type_id: firstMaterial.quantity_type_id || quantityTypes[0]?.id || 1,
      quantityPerItem: 1
    });
    setShowFusionModal(false);
    setShowConfigModal(true);
  };

  const saveFusionedMaterialConfig = async () => {
    if (!selectedMaterial || longPressSelectedMaterials.length < 2) return;

    console.log('💾 SAVING FUSED MATERIALS');
    console.log('Selected materials for fusion:', longPressSelectedMaterials);
    console.log('Temp config:', tempConfig);

    // Calculate total items to produce
    const totalItemsToProduce = Object.values(productionQuantities).reduce((sum, qty) => sum + qty, 0);
    console.log('Total items to produce:', totalItemsToProduce);
    
    // Calculate total stock needed
    const totalNeeded = tempConfig.quantityPerItem * totalItemsToProduce;
    console.log('Total needed:', totalNeeded);

    const fusionedMaterials = materials.filter(m => longPressSelectedMaterials.includes(m.id));
    const totalStock = fusionedMaterials.reduce((sum, m) => sum + m.quantite_stock, 0);
    console.log('Fused materials:', fusionedMaterials);
    console.log('Total stock available:', totalStock);

    if (totalNeeded > totalStock) {
      toast({
        title: "Stock insuffisant",
        description: `Le stock combiné (${totalStock}) n'est pas suffisant pour cette production (${totalNeeded} nécessaire)`,
        variant: "destructive"
      });
      return;
    }

    // Distribute quantities across materials proportionally
    const newMaterials: ProductMaterial[] = [];
    let remainingNeeded = totalNeeded;

    // Always add ALL fused materials to ensure they all show as configured
    for (let i = 0; i < fusionedMaterials.length; i++) {
      const material = fusionedMaterials[i];
      const materialStock = material.quantite_stock;
      
      // Use stock proportionally
      const quantityToUse = i === fusionedMaterials.length - 1 
        ? remainingNeeded // Use remaining for last material
        : Math.min(materialStock, remainingNeeded);

      // Add entry for every material, even if quantity is 0 (to show as configured)
      const quantityPerItem = quantityToUse > 0 ? quantityToUse / totalItemsToProduce : 0;
      newMaterials.push({
        material_id: material.id,
        quantity_needed: quantityPerItem,
        quantity_type_id: tempConfig.quantity_type_id,
        size_specific: null,
        notes: '',
        commentaire: `Fusionné avec ${fusionedMaterials.filter(m => m.id !== material.id).map(m => m.reference).join(', ')}`
      });
      
      if (quantityToUse > 0) {
        remainingNeeded -= quantityToUse;
      }
    }

    console.log('New materials to save:', newMaterials);

    // Replace any existing configuration for these materials
    const withoutCurrent = selectedMaterials.filter(
      sm => !longPressSelectedMaterials.includes(sm.material_id)
    );
    const updated = [...withoutCurrent, ...newMaterials];
    
    console.log('Updated materials list:', updated);
    
    // IMMEDIATE SAVE - don't wait for auto-save
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
      console.log('Save response:', data);
      
      if (data.success) {
        setSelectedMaterials(updated);
        
        // Clear fusion state
        setLongPressSelectedMaterials([]);
        setShowConfigModal(false);
        setSelectedMaterial(null);
        
        toast({
          title: "Matériaux fusionnés",
          description: `${fusionedMaterials.length} matériaux ont été configurés ensemble avec succès`,
        });
      } else {
        throw new Error(data.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de sauvegarder la configuration",
        variant: "destructive"
      });
    }
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

  const getStockStatus = (currentStock: number, minStock: number, maxStock: number) => {
    // Check if quantity exceeds max - show pink
    if (currentStock > maxStock) {
      return {
        status: 'excess',
        color: 'bg-pink-500',
        badgeVariant: 'default'
      };
    }
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
      case 'excess':
        return 'Excès';
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
      })) : null,
      isFused: materialConfigs[0].commentaire?.includes('Fusionné avec') || false,
      fusionInfo: materialConfigs[0].commentaire || ''
    };
  };

  const isSelected = (materialId: number) => {
    return selectedMaterials.some(sm => sm.material_id === materialId);
  };

  // Get unique locations from materials
  const availableLocations = Array.from(new Set(
    materials
      .map(m => m.location?.trim())
      .filter(loc => loc && loc.length > 0)
  )).sort();

  const filteredMaterials = materials.filter(material => {
    // STEP FILTER: Show only matching category_id per step
    const materialCategoryId = (material as any).category_id;
    if (currentStep === 1 && materialCategoryId !== 1) return false;
    if (currentStep === 2 && materialCategoryId !== 3) return false;
    if (currentStep === 3 && materialCategoryId !== 7) return false; // epaulette
    if (currentStep === 4 && materialCategoryId !== 6) return false; // cigarette
    if (currentStep === 5 && materialCategoryId !== 5) return false; // plastron
    
    // Filter by search term - search across all relevant fields
    const matchesSearch = (material.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (material.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (material.description || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (material.category_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (material.couleur || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (material.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // Filter by location dropdown selection
    if (locationFilter !== 'all') {
      const materialLocation = (material.location || '').trim();
      if (materialLocation !== locationFilter) return false;
    }

    // Filter by location based on product boutique origin
    const location = (material.location || '').toLowerCase().trim();
    
    // "Les deux" materials are available for both boutiques
    if (location === "les deux") return true;
    
    // Filter by boutique - case insensitive comparison
    if (product?.boutique_origin === "luccibyey") {
      return location === "lucci by ey";
    } else if (product?.boutique_origin === "spadadibattaglia") {
      return location === "spada";
    }
    
    // If no boutique origin or unknown boutique, show all materials
    return true;
  });

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
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/produits/${productId}`, { state: { refresh: Date.now() } })}
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

      {/* Step Indicator */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Show all steps on desktop (md and up), only current +/- 1 on mobile */}
              <Badge 
                variant={currentStep === 1 ? "default" : "outline"} 
                className={`text-[11px] md:text-sm px-1 md:px-4 py-0.5 md:py-2 ${
                  currentStep > 2 ? 'hidden md:inline-flex' : ''
                }`}
              >
                Étape 1: Tissus
              </Badge>
              <Badge 
                variant={currentStep === 2 ? "default" : "outline"} 
                className={`text-[11px] md:text-sm px-1 md:px-4 py-0.5 md:py-2 ${
                  currentStep < 1 || currentStep > 3 ? 'hidden md:inline-flex' : ''
                }`}
              >
                Étape 2: Boutons
              </Badge>
              <Badge 
                variant={currentStep === 3 ? "default" : "outline"} 
                className={`text-[11px] md:text-sm px-1 md:px-4 py-0.5 md:py-2 ${
                  currentStep < 2 || currentStep > 4 ? 'hidden md:inline-flex' : ''
                }`}
              >
                Étape 3: Epaulette
              </Badge>
              <Badge 
                variant={currentStep === 4 ? "default" : "outline"} 
                className={`text-[11px] md:text-sm px-1 md:px-4 py-0.5 md:py-2 ${
                  currentStep < 3 || currentStep > 5 ? 'hidden md:inline-flex' : ''
                }`}
              >
                Étape 4: Cigarette
              </Badge>
              <Badge 
                variant={currentStep === 5 ? "default" : "outline"} 
                className={`text-[11px] md:text-sm px-1 md:px-4 py-0.5 md:py-2 ${
                  currentStep < 4 ? 'hidden md:inline-flex' : ''
                }`}
              >
                Étape 5: Plastron
              </Badge>
            </div>
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(currentStep - 1)}
                  size="sm"
                  className="text-xs md:text-sm px-2"
                >
                  ← Retour
                </Button>
              )}
              {currentStep < 5 && (
                <Button 
                  onClick={() => setCurrentStep(currentStep + 1)}
                  size="sm"
                  className="text-xs md:text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Continuer →
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {/* Available Materials */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg md:text-xl">
              {currentStep === 1 && 'Tissus Disponibles'}
              {currentStep === 2 && 'Boutons Disponibles'}
              {currentStep === 3 && 'Epaulette Disponibles'}
              {currentStep === 4 && 'Cigarette Disponibles'}
              {currentStep === 5 && 'Plastron Disponibles'}
            </CardTitle>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-muted-foreground">
                Cliquez sur un matériau pour l'ajouter à la configuration
              </p>
              <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-orange-700">
                  <strong>Astuce:</strong> Maintenez appuyé pendant 3 secondes sur un matériau pour le sélectionner pour une fusion. Vous pouvez sélectionner plusieurs matériaux puis cliquer sur "Fusionner" pour les configurer ensemble.
                </p>
              </div>
            </div>
            
            {/* Search and Filter Controls */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Rechercher (nom, référence, couleur, location...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Location Filter */}
                <div className="w-full sm:w-48">
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les locations</SelectItem>
                      {availableLocations.map((location) => (
                        <SelectItem key={location} value={location || ''}>
                          📍 {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Fusion Buttons - appears when materials are selected */}
              {longPressSelectedMaterials.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLongPressSelectedMaterials([])}
                    className="border-red-500 text-red-600 hover:bg-red-50"
                  >
                    Annuler sélection
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleFusionClick}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                  >
                    Fusionner ({longPressSelectedMaterials.length})
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredMaterials.map((material) => (
                <Card
                  key={material.id}
                  className={`cursor-pointer transition-all hover:shadow-md border relative overflow-hidden ${
                    longPressSelectedMaterials.includes(material.id)
                      ? 'ring-4 ring-red-500 bg-red-50 border-red-500 shadow-lg'
                      : isSelected(material.id)
                      ? 'ring-2 ring-green-500 bg-green-50 border-green-500'
                      : getStockStatus(material.quantite_stock, material.quantite_min || 0, material.quantite_max || 100).status === 'critical'
                      ? 'hover:bg-destructive-light/20 border-l-4 border-l-destructive bg-destructive-light/10 border-destructive/20'
                      : 'hover:bg-muted/30 border-border'
                  }`}
                  onClick={() => {
                    if (longPressSelectedMaterials.length === 0 && pressingMaterialId === null) {
                      openMaterialConfig(material);
                    }
                  }}
                  onMouseDown={() => handleMouseDown(material.id)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={() => handleTouchStart(material.id)}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                >
                  {/* Long-press progress indicator */}
                  {pressingMaterialId === material.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30 pointer-events-none z-10">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-red-600"
                        style={{
                          animation: 'fillProgress 3s linear forwards',
                          width: '0%'
                        }}
                      />
                    </div>
                  )}
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm mb-1 truncate">{material.nom}</h3>
                        <p className="text-xs text-muted-foreground mb-1">{material.reference}</p>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{material.description}</p>
                      </div>
                      {longPressSelectedMaterials.includes(material.id) && (
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <Badge className="bg-red-500 text-white">Sélectionné</Badge>
                        </div>
                      )}
                      {!longPressSelectedMaterials.includes(material.id) && isSelected(material.id) && (
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSelectedMaterial(material.id);
                            }}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            ×
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        {material.category_name}
                      </Badge>
                      {material.couleur && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                          {material.couleur}
                        </Badge>
                      )}
                      {material.location && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                          📍 {material.location}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Stock Progress Bar with Status */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-muted-foreground">Stock</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-medium ${
                              getStockStatus(material.quantite_stock, material.quantite_min || 0, material.quantite_max || 100).status === 'critical'
                                ? 'text-destructive'
                                : ''
                            }`}
                          >
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
                          className={`h-2 rounded-full transition-all ${
                            getStockStatus(material.quantite_stock, material.quantite_min || 0, material.quantite_max || 100).color
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(5, (material.quantite_stock / (material.quantite_max || 100)) * 100))}%`
                          }}
                        />
                      </div>
                      {getStockStatus(material.quantite_stock, material.quantite_min || 0, material.quantite_max || 100).status === 'critical' && (
                        <div className="flex items-center gap-1 text-xs text-destructive font-medium">
                          <AlertCircle className="h-3 w-3" />
                          <span>STOCK CRITIQUE</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-muted-foreground">
                        {isSelected(material.id) ? (() => {
                          const configured = getConfiguredQuantities(material.id);
                          const stockStatus = getStockStatus(material.quantite_stock, material.quantite_min || 0, material.quantite_max || 100);
                          return configured ? (
                            <div className="w-full">
                              {/* Main configured quantity display - using stock status colors */}
                               <div className={`border rounded-lg p-2 mb-2 ${
                                stockStatus.status === 'critical' 
                                  ? 'bg-destructive-light/20 border-destructive/30' 
                                  : stockStatus.status === 'warning' 
                                  ? 'bg-warning-light/20 border-warning/30' 
                                  : 'bg-success-light/20 border-success/30'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    <Settings className={`h-3 w-3 ${
                                      stockStatus.status === 'critical' 
                                        ? 'text-destructive' 
                                        : stockStatus.status === 'warning' 
                                        ? 'text-warning' 
                                        : 'text-success'
                                    }`} />
                                    <span className={`text-sm font-semibold ${
                                      stockStatus.status === 'critical' 
                                        ? 'text-destructive' 
                                        : stockStatus.status === 'warning' 
                                        ? 'text-warning' 
                                        : 'text-success'
                                    }`}>
                                      {configured.isFused ? '🔗 Fusionné' : 'Configuré'}
                                    </span>
                                  </div>
                                  <span className={`text-base font-bold ${
                                    stockStatus.status === 'critical' 
                                      ? 'text-destructive' 
                                      : stockStatus.status === 'warning' 
                                      ? 'text-warning' 
                                      : 'text-success'
                                  }`}>
                                    {configured.total} {configured.unit}
                                  </span>
                                </div>
                                {configured.isFused && (
                                  <div className="mt-1 pt-1 border-t border-orange-200">
                                    <p className="text-xs text-orange-600 italic">
                                      {configured.fusionInfo}
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              {/* Size breakdown - if multiple sizes */}
                              {configured.breakdown && configured.breakdown.length > 1 && (
                                <div className="bg-gray-50 rounded-md p-2">
                                  <div className="text-xs font-medium text-gray-600 mb-1">Répartition par taille:</div>
                                  <div className="space-y-1">
                                    {configured.breakdown.map((item, index) => (
                                      <div key={index} className="flex justify-between text-xs">
                                        <span className="text-gray-600">{item.size}:</span>
                                        <span className="font-medium text-gray-800">
                                          {item.quantity} {configured.unit}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : null;
                        })() : (
                          <>
                            <span>Min: {material.quantite_min || 0}</span>
                            <span>Max: {material.quantite_max || 100}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Auto-save indicator */}
        {distinctSelectedCount > 0 && (
          <div className="flex justify-end">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-green-500" />
              {distinctSelectedCount} matériau{distinctSelectedCount > 1 ? 'x' : ''} configuré{distinctSelectedCount > 1 ? 's' : ''} - Auto-sauvegarde activée
            </div>
          </div>
        )}
      </div>

      {/* Material Configuration Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Configurer le matériau
            </DialogTitle>
            <DialogDescription>
              Définissez l'unité et la quantité à utiliser pour chaque pièce.
            </DialogDescription>
          </DialogHeader>
          
          {/* Stock Insufficiency Modal */}
          {selectedMaterial && insufficientStockData && (
            <StockInsufficiencyModal
              open={showStockInsufficiencyModal}
              onOpenChange={setShowStockInsufficiencyModal}
              materialName={selectedMaterial.nom}
              materialReference={selectedMaterial.reference}
              currentStock={insufficientStockData.currentStock}
              neededStock={insufficientStockData.neededStock}
              unit={insufficientStockData.unit}
              onMerge={handleMergeClick}
              onCancel={handleCancelMerge}
            />
          )}

          {/* Material Merge Modal */}
          {selectedMaterial && insufficientStockData && mergeFirstMaterialData && (
            <MaterialMergeModal
              open={showMergeMaterialModal}
              onOpenChange={setShowMergeMaterialModal}
              firstMaterial={mergeFirstMaterialData.material}
              firstMaterialQuantityNeeded={mergeFirstMaterialData.totalNeeded}
              remainingQuantityNeeded={insufficientStockData.neededStock - mergeFirstMaterialData.quantityUsed}
              unit={insufficientStockData.unit}
              onMergeConfirm={handleMergeConfirm}
              onCancel={handleCancelMerge}
              productBoutiqueOrigin={product?.boutique_origin}
              excludeMaterialId={selectedMaterial.id}
            />
          )}
          
          {selectedMaterial && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                {longPressSelectedMaterials.length > 1 ? (
                  <>
                    <h3 className="font-medium">
                      {materials
                        .filter(m => longPressSelectedMaterials.includes(m.id))
                        .map(m => m.reference)
                        .join(' + ')}
                    </h3>
                    <p className="text-sm text-muted-foreground">Matériaux fusionnés</p>
                  </>
                ) : (
                  <>
                    <h3 className="font-medium">{selectedMaterial.nom}</h3>
                    <p className="text-sm text-muted-foreground">{selectedMaterial.reference}</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedMaterial.description}</p>
                  </>
                )}
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {selectedMaterial.category_name}
                  </Badge>
                  {selectedMaterial.couleur && (
                    <Badge variant="outline" className="text-xs">
                      {selectedMaterial.couleur}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <Label className="text-sm font-medium">Unité</Label>
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Quantité par pièce</Label>
                  {(() => {
                    const itemGroup = product?.itemgroup_product?.toLowerCase().trim() || '';
                    const predefinedQty = PREDEFINED_QUANTITIES[itemGroup];
                    
                    if (predefinedQty) {
                      return (
                        <span className="text-xs text-red-600 font-medium">
                          {product?.itemgroup_product} ({predefinedQty})
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={tempConfig.quantityPerItem}
                  onChange={(e) => {
                    const value = e.target.value.replace(',', '.');
                    setTempConfig({
                      ...tempConfig,
                      quantityPerItem: parseFloat(value) || 0
                    });
                  }}
                  className="w-full"
                  placeholder="Quantité nécessaire pour 1 pièce"
                />
                {(() => {
                  const totalItemsToProduce = Object.values(productionQuantities).reduce((sum, qty) => sum + qty, 0);
                  const totalNeeded = tempConfig.quantityPerItem * totalItemsToProduce;
                  const quantityType = quantityTypes.find((qt) => qt.id === tempConfig.quantity_type_id);
                  
                  return totalItemsToProduce > 0 && tempConfig.quantityPerItem > 0 ? (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pièces à produire:</span>
                        <span className="font-semibold text-primary">{totalItemsToProduce}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total nécessaire:</span>
                        <span className="font-semibold">{totalNeeded.toFixed(2)} {quantityType?.unite}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Stock actuel:</span>
                        <span className={`font-semibold ${totalNeeded > selectedMaterial.quantite_stock ? 'text-destructive' : 'text-success'}`}>
                          {selectedMaterial.quantite_stock.toFixed(2)} {quantityType?.unite}
                        </span>
                      </div>
                      {totalNeeded > selectedMaterial.quantite_stock && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-xs text-destructive font-medium">
                            ⚠️ Stock insuffisant ({(totalNeeded - selectedMaterial.quantite_stock).toFixed(2)} {quantityType?.unite} manquant)
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowConfigModal(false);
              setLongPressSelectedMaterials([]);
            }}>
              Annuler
            </Button>
            <Button 
              onClick={longPressSelectedMaterials.length > 0 ? saveFusionedMaterialConfig : saveMaterialConfig} 
              disabled={tempConfig.quantityPerItem <= 0}
            >
              <Check className="h-4 w-4 mr-2" />
              {longPressSelectedMaterials.length > 0 ? 'Fusionner et Ajouter' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fusion Confirmation Modal */}
      <Dialog open={showFusionModal} onOpenChange={setShowFusionModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
              Fusionner les matériaux
            </DialogTitle>
            <DialogDescription>
              Vous allez fusionner {longPressSelectedMaterials.length} matériaux pour cette production
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Display selected materials */}
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <h4 className="font-semibold text-sm">Matériaux sélectionnés:</h4>
              {materials
                .filter(m => longPressSelectedMaterials.includes(m.id))
                .map((material, index) => (
                  <div key={material.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{material.nom}</p>
                      <p className="text-xs text-muted-foreground">{material.reference}</p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      Stock: {material.quantite_stock}
                    </Badge>
                  </div>
                ))}
            </div>

            {/* Combined stock info */}
            <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-orange-900">Stock combiné total</p>
                  <p className="text-lg font-bold text-orange-700 mt-1">
                    {materials
                      .filter(m => longPressSelectedMaterials.includes(m.id))
                      .reduce((sum, m) => sum + m.quantite_stock, 0)
                      .toFixed(2)}
                    {' '}
                    {(() => {
                      const firstMaterial = materials.find(m => longPressSelectedMaterials.includes(m.id));
                      const qt = quantityTypes.find(qt => qt.id === firstMaterial?.quantity_type_id);
                      return qt?.unite || '';
                    })()}
                  </p>
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-orange-600 font-medium">
                      📦 Les matériaux seront configurés ensemble avec leurs stocks combinés
                    </p>
                    <p className="text-xs text-orange-600">
                      💾 Chaque matériau sera enregistré séparément au backend avec son nom d'origine
                    </p>
                    <p className="text-xs text-orange-600">
                      ✨ Ils apparaîtront comme "Fusionnés" dans la configuration
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowFusionModal(false);
              setLongPressSelectedMaterials([]);
            }}>
              Annuler
            </Button>
            <Button 
              onClick={handleFusionConfirm}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              Continuer la configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConfigurerMateriaux;
