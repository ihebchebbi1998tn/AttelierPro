import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StockInsufficiencyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialName: string;
  materialReference: string;
  currentStock: number;
  neededStock: number;
  unit: string;
  onMerge: () => void;
  onCancel: () => void;
}

export const StockInsufficiencyModal = ({
  open,
  onOpenChange,
  materialName,
  materialReference,
  currentStock,
  neededStock,
  unit,
  onMerge,
  onCancel
}: StockInsufficiencyModalProps) => {
  const shortage = neededStock - currentStock;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Quantité insuffisante pour cette production
          </DialogTitle>
          <DialogDescription>
            Le stock disponible n'est pas suffisant pour cette production
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/30 p-4 rounded-lg space-y-3">
            <div>
              <p className="text-sm font-medium mb-1">{materialName}</p>
              <p className="text-xs text-muted-foreground">{materialReference}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Stock actuel</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-destructive">{currentStock.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground">{unit}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Stock nécessaire</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary">{neededStock.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground">{unit}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Manque</span>
                <Badge variant="destructive" className="text-sm px-3 py-1">
                  {shortage.toFixed(2)} {unit}
                </Badge>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Vous pouvez fusionner les matériaux</strong>
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Sélectionnez un autre matériau pour compléter le stock manquant et continuer la production.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Annuler
          </Button>
          <Button onClick={onMerge} className="w-full sm:w-auto">
            Fusionner les matériaux
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
