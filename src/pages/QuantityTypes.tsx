import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const QuantityTypes = () => {
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
    fetchQuantityTypes();
  }, []);

  const fetchQuantityTypes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/production/api/quantity_types.php?include_inactive=true');
      if (response.ok) {
        const data = await response.json();
        setQuantityTypes(data);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les types de quantité",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des types de quantité:', error);
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
      const response = await fetch('/production/api/quantity_types.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newType),
      });

      if (response.ok) {
        await fetchQuantityTypes();
        setNewType({ value: '', label: '', is_active: true });
        setIsAdding(false);
        toast({
          title: "Succès",
          description: "Type de quantité ajouté avec succès",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Erreur lors de l'ajout",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
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
      const response = await fetch(`/production/api/quantity_types.php/quantity_types/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingData),
      });

      if (response.ok) {
        await fetchQuantityTypes();
        setEditingId(null);
        setEditingData({});
        toast({
          title: "Succès",
          description: "Type de quantité modifié avec succès",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Erreur lors de la modification",
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
      const response = await fetch(`/production/api/quantity_types.php/quantity_types/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchQuantityTypes();
        toast({
          title: "Succès",
          description: "Type de quantité supprimé avec succès",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Erreur lors de la suppression",
          variant: "destructive",
        });
      }
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

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Chargement des types de quantité...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Types de Quantité</h1>
          <p className="text-muted-foreground">
            Gérez les unités de mesure pour vos matières
          </p>
        </div>
        <Button 
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Ajouter un type
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Types de Quantité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add new type form */}
            {isAdding && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="new-active"
                      checked={newType.is_active}
                      onCheckedChange={(checked) => setNewType(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="new-active">Actif</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAdd} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer
                    </Button>
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Types list */}
            <div className="space-y-2">
              {quantityTypes.map((type) => (
                <div
                  key={type.quantity_type_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  {editingId === type.quantity_type_id ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center flex-1">
                      <div>
                        <Input
                          value={editingData.value || ''}
                          onChange={(e) => setEditingData(prev => ({ ...prev, value: e.target.value }))}
                          placeholder="Valeur"
                        />
                      </div>
                      <div>
                        <Input
                          value={editingData.label || ''}
                          onChange={(e) => setEditingData(prev => ({ ...prev, label: e.target.value }))}
                          placeholder="Label"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editingData.is_active || false}
                          onCheckedChange={(checked) => setEditingData(prev => ({ ...prev, is_active: checked }))}
                        />
                        <Label>Actif</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleSave(type.quantity_type_id)} size="sm">
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button onClick={handleCancel} variant="outline" size="sm">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <span className="font-medium">{type.value}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{type.label}</span>
                        </div>
                        <div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            type.is_active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {type.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(type)}
                          variant="outline"
                          size="sm"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action supprimera définitivement le type de quantité "{type.label}".
                                Cette action ne peut pas être annulée.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(type.quantity_type_id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {quantityTypes.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Aucun type de quantité trouvé</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuantityTypes;