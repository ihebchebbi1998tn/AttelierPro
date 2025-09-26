import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface QuantityType {
  quantity_type_id: number;
  value: string;
  label: string;
  is_active: boolean;
  created_date: string;
  modified_date: string;
}

interface NewQuantityType {
  value: string;
  label: string;
  is_active: boolean;
}

interface QuantityTypesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuantityTypesUpdate: () => void;
}

const QuantityTypesModal = ({ open, onOpenChange, onQuantityTypesUpdate }: QuantityTypesModalProps) => {
  const [quantityTypes, setQuantityTypes] = useState<QuantityType[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<QuantityType>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newType, setNewType] = useState<NewQuantityType>({
    value: '',
    label: '',
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchQuantityTypes();
    }
  }, [open]);

  const fetchQuantityTypes = async () => {
    try {
      setIsLoading(true);
      console.log("🔄 Fetching quantity types...");

      const response = await fetch('https://luccibyey.com.tn/production/api/quantity_types.php');
      if (response.ok) {
        const data = await response.json();
        console.log("📦 Quantity types API response:", data);

        let rawArray: any[] = [];
        if (Array.isArray(data)) {
          rawArray = data;
        } else if (data && Array.isArray(data.data)) {
          rawArray = data.data;
        } else {
          console.warn("⚠️ Unexpected API response format:", data);
          rawArray = [];
        }

        const mapped = rawArray.map((row: any) => ({
          quantity_type_id: Number(row.id ?? row.quantity_type_id ?? 0),
          value: row.unite ?? row.value ?? "",
          label: row.nom ?? row.label ?? "",
          is_active:
            row.active === 1 ||
            row.active === "1" ||
            row.active === true ||
            row.is_active === true,
          created_date: row.created_at ?? row.created_date ?? "",
          modified_date:
            row.updated_at ?? row.modified_date ?? row.created_at ?? "",
        }));

        console.log("✅ Setting mapped quantity types:", mapped);
        setQuantityTypes(mapped);
      } else {
        console.error("❌ API request failed:", response.status);
        setQuantityTypes([]);
        toast({
          title: "Erreur",
          description: "Impossible de charger les types de quantité",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("💥 Error loading quantity types:", error);
      setQuantityTypes([]);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newType.value.trim() || !newType.label.trim()) {
      toast({
        title: "Erreur",
        description: "La valeur et le label sont obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        nom: newType.label,
        unite: newType.value,
        description: null,
        active: newType.is_active ? 1 : 0,
      };

      const response = await fetch('https://luccibyey.com.tn/production/api/quantity_types.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchQuantityTypes();
        onQuantityTypesUpdate();
        setNewType({ value: '', label: '', is_active: true });
        setIsAdding(false);
        toast({
          title: "Succès",
          description: "Type de quantité ajouté avec succès",
        });
      } else {
        const error = await response.json().catch(() => null);
        toast({
          title: "Erreur",
          description: (error && (error.message || error.error)) || "Erreur lors de l'ajout",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (quantityType: QuantityType) => {
    setEditingId(quantityType.quantity_type_id);
    setEditingData({ ...quantityType });
  };

  const handleSave = async (id: number) => {
    try {
      const payload = {
        id,
        nom: (editingData.label ?? '').toString(),
        unite: (editingData.value ?? '').toString(),
        description: null,
        active: (editingData.is_active ?? false) ? 1 : 0,
      };

      const response = await fetch(`https://luccibyey.com.tn/production/api/quantity_types.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchQuantityTypes();
        onQuantityTypesUpdate();
        setEditingId(null);
        setEditingData({});
        toast({
          title: "Succès",
          description: "Type de quantité modifié avec succès",
        });
      } else {
        const error = await response.json().catch(() => null);
        toast({
          title: "Erreur",
          description: (error && (error.message || error.error)) || "Erreur lors de la modification",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      console.log("🗑️ Deleting quantity type id:", id);
      const response = await fetch(`https://luccibyey.com.tn/production/api/quantity_types.php`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      let body: any = null;
      try {
        body = await response.json();
      } catch (e) {
        console.warn("⚠️ No JSON body in delete response");
      }

      if (!response.ok) {
        console.error("❌ Delete request failed:", response.status, body);
        toast({
          title: "Erreur",
          description: (body && (body.message || body.error)) || "Erreur lors de la suppression",
          variant: "destructive",
        });
        return;
      }

      if (body && body.success === false) {
        console.warn("⚠️ Delete prevented:", body);
        toast({
          title: "Impossible de supprimer",
          description: body.message || "Ce type est utilisé et ne peut pas être supprimé",
          variant: "destructive",
        });
        return;
      }

      await fetchQuantityTypes();
      onQuantityTypesUpdate();
      toast({
        title: "Succès",
        description: "Type de quantité supprimé avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({});
    setIsAdding(false);
    setNewType({ value: '', label: '', is_active: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[800px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span>Types de Quantité</span>
            <Button 
              onClick={() => setIsAdding(true)}
              disabled={isAdding}
              size="sm"
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {/* Add new type form */}
            {isAdding && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="new-value">Valeur *</Label>
                      <Input
                        id="new-value"
                        value={newType.value}
                        onChange={(e) => setNewType(prev => ({ ...prev, value: e.target.value }))}
                        placeholder="ex: kg, mètres"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-label">Label *</Label>
                      <Input
                        id="new-label"
                        value={newType.label}
                        onChange={(e) => setNewType(prev => ({ ...prev, label: e.target.value }))}
                        placeholder="ex: Kilogrammes, Mètres"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="new-active"
                        checked={newType.is_active}
                        onCheckedChange={(checked) => setNewType(prev => ({ ...prev, is_active: checked }))}
                      />
                      <Label htmlFor="new-active">Actif</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAdd} size="sm" className="flex-1 sm:flex-none">
                        <Save className="h-4 w-4 mr-2" />
                        Enregistrer
                      </Button>
                      <Button onClick={handleCancel} variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <X className="h-4 w-4 mr-2" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Types list */}
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Chargement des types de quantité...</p>
                </div>
              ) : Array.isArray(quantityTypes) && quantityTypes.length > 0 ? (
                quantityTypes.map((type) => (
                  <div
                    key={type.quantity_type_id}
                    className="border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {editingId === type.quantity_type_id ? (
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Valeur</Label>
                            <Input
                              value={editingData.value || ''}
                              onChange={(e) => setEditingData(prev => ({ ...prev, value: e.target.value }))}
                              placeholder="Valeur"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Label</Label>
                            <Input
                              value={editingData.label || ''}
                              onChange={(e) => setEditingData(prev => ({ ...prev, label: e.target.value }))}
                              placeholder="Label"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={editingData.is_active || false}
                              onCheckedChange={(checked) => setEditingData(prev => ({ ...prev, is_active: checked }))}
                            />
                            <Label>Actif</Label>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => handleSave(type.quantity_type_id)} size="sm" className="flex-1 sm:flex-none">
                              <Save className="h-4 w-4 mr-2" />
                              Sauvegarder
                            </Button>
                            <Button onClick={handleCancel} variant="outline" size="sm" className="flex-1 sm:flex-none">
                              <X className="h-4 w-4 mr-2" />
                              Annuler
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1 space-y-2 sm:space-y-0">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                              <div>
                                <div className="text-sm text-muted-foreground sm:hidden">Valeur</div>
                                <span className="font-medium">{type.value}</span>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground sm:hidden">Label</div>
                                <span className="text-muted-foreground">{type.label}</span>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground sm:hidden">Statut</div>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  type.is_active 
                                    ? 'bg-success/20 text-success'
                                    : 'bg-destructive/20 text-destructive'
                                }`}>
                                  {type.is_active ? 'Actif' : 'Inactif'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              onClick={() => handleEdit(type)}
                              variant="outline"
                              size="sm"
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="ml-2 sm:hidden">Modifier</span>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                  <span className="ml-2 sm:hidden">Supprimer</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="w-[90vw] max-w-md">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action supprimera définitivement le type de quantité "{type.label}".
                                    Cette action ne peut pas être annulée.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                  <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(type.quantity_type_id)}
                                    className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Aucun type de quantité trouvé</p>
                </div>
              )}
            </div>

            {!isLoading && Array.isArray(quantityTypes) && quantityTypes.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Aucun type de quantité configuré</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuantityTypesModal;