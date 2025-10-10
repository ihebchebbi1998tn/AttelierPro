import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  location?: string;
}

interface MaterialMergeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firstMaterial: Material;
  firstMaterialQuantityNeeded: number;
  remainingQuantityNeeded: number;
  unit: string;
  onMergeConfirm: (secondMaterial: Material) => void;
  onCancel: () => void;
  productBoutiqueOrigin?: string;
  excludeMaterialId: number;
}

export const MaterialMergeModal = ({
  open,
  onOpenChange,
  firstMaterial,
  firstMaterialQuantityNeeded,
  remainingQuantityNeeded,
  unit,
  onMergeConfirm,
  onCancel,
  productBoutiqueOrigin,
  excludeMaterialId
}: MaterialMergeModalProps) => {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadMaterials();
    }
  }, [open]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/matieres.php');
      const data = await response.json();
      if (data.success) {
        const normalizedMaterials: Material[] = (data.data || []).map((m: any) => ({
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
          quantity_type_id: parseInt(m.quantity_type_id),
          location: m.location
        }));
        setMaterials(normalizedMaterials);
      }
    } catch (error) {
      console.error('Error loading materials:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les matériaux",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (currentStock: number, minStock: number, maxStock: number) => {
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

  const availableLocations = Array.from(new Set(
    materials
      .map(m => m.location?.trim())
      .filter(loc => loc && loc.length > 0)
  )).sort();

  const filteredMaterials = materials.filter(material => {
    // Exclude the first material
    if (material.id === excludeMaterialId) return false;

    // Filter by search term
    const matchesSearch = 
      (material.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (material.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (material.description || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (material.category_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (material.couleur || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (material.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // Filter by location dropdown
    if (locationFilter !== 'all') {
      const materialLocation = (material.location || '').trim();
      if (materialLocation !== locationFilter) return false;
    }

    // Filter by boutique origin
    const location = (material.location || '').toLowerCase().trim();
    if (location === "les deux") return true;
    
    if (productBoutiqueOrigin === "luccibyey") {
      return location === "lucci by ey";
    } else if (productBoutiqueOrigin === "spadadibattaglia") {
      return location === "spada";
    }
    
    return true;
  });

  const handleConfirm = () => {
    if (!selectedMaterial) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un matériau",
        variant: "destructive"
      });
      return;
    }

    // Check if selected material has enough stock for the remaining quantity
    if (selectedMaterial.quantite_stock < remainingQuantityNeeded) {
      toast({
        title: "Stock insuffisant",
        description: `Le stock des deux matériaux n'est pas suffisant. Stock disponible du deuxième matériau: ${selectedMaterial.quantite_stock.toFixed(2)} ${unit}, besoin: ${remainingQuantityNeeded.toFixed(2)} ${unit}`,
        variant: "destructive"
      });
      return;
    }

    onMergeConfirm(selectedMaterial);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Fusionner avec un autre matériau</DialogTitle>
          <DialogDescription>
            Sélectionnez un matériau pour compléter le stock manquant
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 px-1">
          {/* Summary of first material */}
          <div className="bg-muted/30 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">Premier matériau (stock complet utilisé)</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">{firstMaterial.nom}</p>
                <p className="text-xs text-muted-foreground">{firstMaterial.reference}</p>
              </div>
              <Badge variant="secondary">
                {firstMaterial.quantite_stock.toFixed(2)} {unit}
              </Badge>
            </div>
          </div>

          {/* Remaining quantity needed */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">Quantité restante nécessaire</span>
              <Badge className="bg-blue-600">
                {remainingQuantityNeeded.toFixed(2)} {unit}
              </Badge>
            </div>
          </div>

          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Rechercher (nom, référence, couleur, location...)" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="pl-10" 
              />
            </div>
            
            <div className="w-full sm:w-48">
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les locations</SelectItem>
                  {availableLocations.map(location => (
                    <SelectItem key={location} value={location || ''}>
                      📍 {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected material display */}
          {selectedMaterial && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-900">{selectedMaterial.nom}</p>
                    <p className="text-xs text-green-700">{selectedMaterial.reference}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-900">
                    Stock: {selectedMaterial.quantite_stock.toFixed(2)} {unit}
                  </p>
                  <p className="text-xs text-green-700">
                    Utilisé: {remainingQuantityNeeded.toFixed(2)} {unit}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Materials grid */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Chargement...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredMaterials.map(material => {
                const stockStatus = getStockStatus(material.quantite_stock, material.quantite_min || 0, material.quantite_max || 100);
                const isSelected = selectedMaterial?.id === material.id;
                const isSufficient = material.quantite_stock >= remainingQuantityNeeded;

                return (
                  <Card 
                    key={material.id}
                    className={`cursor-pointer transition-all hover:shadow-md border ${
                      isSelected 
                        ? 'ring-2 ring-green-500 bg-green-50 border-green-500' 
                        : !isSufficient
                        ? 'opacity-50 cursor-not-allowed border-destructive/20'
                        : 'hover:bg-muted/30 border-border'
                    }`}
                    onClick={() => {
                      if (isSufficient) {
                        setSelectedMaterial(material);
                      } else {
                        toast({
                          title: "Stock insuffisant",
                          description: `Ce matériau n'a que ${material.quantite_stock.toFixed(2)} ${unit} en stock`,
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm mb-1 truncate">{material.nom}</h3>
                          <p className="text-xs text-muted-foreground">{material.reference}</p>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1 mb-2">
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

                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-muted-foreground">Stock</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${!isSufficient ? 'text-destructive' : ''}`}>
                              {material.quantite_stock.toFixed(2)}
                            </span>
                            <Badge variant={stockStatus.badgeVariant as any} className="text-xs px-1.5 py-0.5">
                              {getStockStatusLabel(stockStatus.status)}
                            </Badge>
                          </div>
                        </div>
                        {!isSufficient && (
                          <div className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            <span>Insuffisant pour le besoin</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {!loading && filteredMaterials.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucun matériau trouvé</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Annuler
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedMaterial}
            className="w-full sm:w-auto"
          >
            <Check className="h-4 w-4 mr-2" />
            Confirmer la fusion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
