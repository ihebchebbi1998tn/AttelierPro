import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Package } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Material {
  id: number;
  nom_matiere: string;
  code_matiere: string;
}

interface LeftoverMaterial {
  material_id: number;
  quantity: number;
  is_reusable: boolean;
  notes: string;
}

interface BatchLeftoversModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: number;
  materials: Material[];
  onComplete: () => void;
}

export function BatchLeftoversModal({
  open,
  onOpenChange,
  batchId,
  materials,
  onComplete,
}: BatchLeftoversModalProps) {
  const { toast } = useToast();
  const [leftovers, setLeftovers] = useState<LeftoverMaterial[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadExistingLeftovers();
    }
  }, [open, batchId]);

  const loadExistingLeftovers = async () => {
    try {
      const response = await fetch(
        `https://beninamode.com/production/api/production_batch_leftovers.php?batch_id=${batchId}`
      );
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        setLeftovers(
          data.map((item: any) => ({
            material_id: item.material_id,
            quantity: parseFloat(item.leftover_quantity),
            is_reusable: item.is_reusable === 1,
            notes: item.notes || "",
          }))
        );
      }
    } catch (error) {
      console.error("Error loading leftovers:", error);
    }
  };

  const addLeftover = () => {
    if (materials.length === 0) {
      toast({
        title: "Aucun matériau disponible",
        description: "Veuillez d'abord configurer les matériaux du lot",
        variant: "destructive",
      });
      return;
    }

    setLeftovers([
      ...leftovers,
      {
        material_id: materials[0].id,
        quantity: 0,
        is_reusable: true,
        notes: "",
      },
    ]);
  };

  const removeLeftover = (index: number) => {
    setLeftovers(leftovers.filter((_, i) => i !== index));
  };

  const updateLeftover = (index: number, field: keyof LeftoverMaterial, value: any) => {
    const updated = [...leftovers];
    updated[index] = { ...updated[index], [field]: value };
    setLeftovers(updated);
  };

  const handleSave = async () => {
    // Validate
    const validLeftovers = leftovers.filter(l => l.quantity > 0);
    
    if (validLeftovers.length === 0) {
      toast({
        title: "Aucun surplus à enregistrer",
        description: "Vous pouvez passer cette étape si vous n'avez pas de surplus",
      });
      onComplete();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        "https://beninamode.com/production/api/production_batch_leftovers.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save",
            batch_id: batchId,
            leftovers: validLeftovers,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Surplus enregistrés",
          description: "Les matériaux en surplus ont été enregistrés avec succès",
        });
        onComplete();
      } else {
        throw new Error(result.error || "Erreur lors de l'enregistrement");
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gestion des Surplus de Matériaux
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Après la production, vous pouvez enregistrer les matériaux en surplus.
            Indiquez les quantités restantes et si elles sont réutilisables.
          </p>

          <div className="flex justify-between items-center">
            <Button onClick={addLeftover} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un surplus
            </Button>
          </div>

          {leftovers.length > 0 && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matériau</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead className="w-[120px]">Réutilisable</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leftovers.map((leftover, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <select
                          className="w-full border rounded px-2 py-1"
                          value={leftover.material_id}
                          onChange={(e) =>
                            updateLeftover(index, "material_id", parseInt(e.target.value))
                          }
                        >
                          {materials.map((material) => (
                            <option key={material.id} value={material.id}>
                              {material.nom_matiere} ({material.code_matiere})
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={leftover.quantity}
                          onChange={(e) =>
                            updateLeftover(index, "quantity", parseFloat(e.target.value) || 0)
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={leftover.is_reusable}
                          onCheckedChange={(checked) =>
                            updateLeftover(index, "is_reusable", checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={leftover.notes}
                          onChange={(e) =>
                            updateLeftover(index, "notes", e.target.value)
                          }
                          placeholder="Notes optionnelles"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLeftover(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {leftovers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun surplus ajouté. Cliquez sur "Ajouter un surplus" ou passez cette étape.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleSkip} disabled={loading}>
              Passer cette étape
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer et terminer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
