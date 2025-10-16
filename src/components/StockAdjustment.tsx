import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Settings, Plus, Minus, ArrowUp, ArrowDown, Save } from "lucide-react";

interface StockAdjustmentProps {
  materialId: number;
  currentStock: number;
  materialName: string;
  quantityType: string;
  onStockUpdated?: () => void;
}

const StockAdjustment = ({ 
  materialId, 
  currentStock, 
  materialName, 
  quantityType,
  onStockUpdated 
}: StockAdjustmentProps) => {
  const [open, setOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'in' | 'out'>('in');
  const [quantity, setQuantity] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const getNewStock = () => {
    const qty = parseFloat(quantity) || 0;
    if (adjustmentType === 'in') {
      return currentStock + qty;
    } else {
      return Math.max(0, currentStock - qty); // Prevent negative stock
    }
  };

  const handleSubmit = async () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une quantité valide",
        variant: "destructive",
      });
      return;
    }

    const qty = parseFloat(quantity);
    if (adjustmentType === 'out' && qty > currentStock) {
      toast({
        title: "Erreur",
        description: "La quantité à retirer ne peut pas dépasser le stock actuel",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/matieres.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'stock_transaction',
          material_id: materialId,
          type: adjustmentType,
          quantity: qty,
          note: note || `Ajustement de stock ${adjustmentType === 'in' ? 'entrée' : 'sortie'}`,
          user_id: 1 // Default user ID
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        toast({
          title: "Succès",
          description: `Stock ajusté avec succès. ${adjustmentType === 'in' ? 'Ajouté' : 'Retiré'}: ${qty} ${quantityType}`,
        });
        
        // Reset form
        setQuantity('');
        setNote('');
        setAdjustmentType('in');
        setOpen(false);
        
        // Notify parent component to refresh
        if (onStockUpdated) {
          onStockUpdated();
        }
      } else {
        toast({
          title: "Erreur",
          description: result.message || "Une erreur est survenue lors de l'ajustement du stock",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adjusting stock:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajustement du stock",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Settings className="mr-2 h-4 w-4" />
          Ajuster Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Ajuster le stock
          </DialogTitle>
          <DialogDescription>
            Ajustez le stock du matériau "{materialName}". Cette action sera enregistrée dans le journal des transactions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Stock Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Stock actuel</p>
                <p className="text-2xl font-bold">{currentStock} {quantityType}</p>
              </div>
            </CardContent>
          </Card>

          {/* Adjustment Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Type d'ajustement</Label>
            <Select value={adjustmentType} onValueChange={(value: 'in' | 'out') => setAdjustmentType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in" className="flex items-center">
                  <div className="flex items-center">
                    <Plus className="mr-2 h-4 w-4 text-green-600" />
                    Entrée de stock (+)
                  </div>
                </SelectItem>
                <SelectItem value="out" className="flex items-center">
                  <div className="flex items-center">
                    <Minus className="mr-2 h-4 w-4 text-red-600" />
                    Sortie de stock (-)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantité {adjustmentType === 'in' ? 'à ajouter' : 'à retirer'} ({quantityType})
            </Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              min="0"
              max={adjustmentType === 'out' ? currentStock : undefined}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Preview */}
          {quantity && parseFloat(quantity) > 0 && (
            <Card className="border-dashed">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {adjustmentType === 'in' ? (
                      <ArrowUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">Nouveau stock:</span>
                  </div>
                  <div className="font-bold">
                    <span className="text-lg">{getNewStock()}</span>
                    <span className="text-sm text-muted-foreground ml-1">{quantityType}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note (optionnel)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Motif de l'ajustement de stock..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !quantity || parseFloat(quantity) <= 0}>
            {isSubmitting ? (
              <>Enregistrement...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StockAdjustment;