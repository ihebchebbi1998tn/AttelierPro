import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Package, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface Leftover {
  id: number;
  material_id: number;
  nom_matiere: string;
  code_matiere: string;
  leftover_quantity: number;
  is_reusable: boolean;
  readded_to_stock: boolean;
  notes?: string;
  current_stock: number;
}

interface BatchLeftoversViewProps {
  batchId: number;
  batchStatus: string;
}

export function BatchLeftoversView({ batchId, batchStatus }: BatchLeftoversViewProps) {
  const { toast } = useToast();
  const [leftovers, setLeftovers] = useState<Leftover[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeftovers, setSelectedLeftovers] = useState<number[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [readdingToStock, setReaddingToStock] = useState(false);

  useEffect(() => {
    loadLeftovers();
  }, [batchId]);

  const loadLeftovers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://luccibyey.com.tn/production/api/production_batch_leftovers.php?batch_id=${batchId}`
      );
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const normalized: Leftover[] = data.map((item: any) => ({
          id: Number(item.id),
          material_id: Number(item.material_id),
          nom_matiere: item.nom_matiere ?? "",
          code_matiere: item.code_matiere ?? "",
          leftover_quantity: isNaN(parseFloat(item.leftover_quantity)) ? 0 : parseFloat(item.leftover_quantity),
          is_reusable: item.is_reusable === 1 || item.is_reusable === "1" || item.is_reusable === true,
          readded_to_stock: item.readded_to_stock === 1 || item.readded_to_stock === "1" || item.readded_to_stock === true,
          notes: item.notes ?? "",
          current_stock: isNaN(parseFloat(item.current_stock)) ? 0 : parseFloat(item.current_stock),
        }));
        setLeftovers(normalized);
      }
    } catch (error) {
      console.error("Error loading leftovers:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLeftoverSelection = (leftoverId: number) => {
    setSelectedLeftovers(prev =>
      prev.includes(leftoverId)
        ? prev.filter(id => id !== leftoverId)
        : [...prev, leftoverId]
    );
  };

  const handleReaddToStock = async () => {
    if (selectedLeftovers.length === 0) return;

    setReaddingToStock(true);
    try {
      const response = await fetch(
        "https://luccibyey.com.tn/production/api/production_batch_leftovers.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "readd_to_stock",
            leftover_ids: selectedLeftovers,
            user_id: "Current User", // You can get this from auth context
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Matériaux réintégrés",
          description: result.message,
        });
        setSelectedLeftovers([]);
        setShowConfirmDialog(false);
        loadLeftovers(); // Reload to update status
      } else {
        throw new Error(result.error || "Erreur lors de la réintégration");
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setReaddingToStock(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Surplus de Matériaux
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (leftovers.length === 0) {
    return null;
  }

  const reusableLeftovers = leftovers.filter(l => l.is_reusable && !l.readded_to_stock);
  const canReaddToStock = reusableLeftovers.length > 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Surplus de Matériaux
            </CardTitle>
            {canReaddToStock && (
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={selectedLeftovers.length === 0}
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réintégrer au Stock ({selectedLeftovers.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {canReaddToStock && <TableHead className="w-[50px]"></TableHead>}
                <TableHead>Matériau</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="text-right">Quantité Surplus</TableHead>
                <TableHead>Réutilisable</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leftovers.map((leftover) => (
                <TableRow key={leftover.id}>
                  {canReaddToStock && (
                    <TableCell>
                      {leftover.is_reusable && !leftover.readded_to_stock && (
                        <input
                          type="checkbox"
                          checked={selectedLeftovers.includes(leftover.id)}
                          onChange={() => toggleLeftoverSelection(leftover.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      )}
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{leftover.nom_matiere}</TableCell>
                  <TableCell>{leftover.code_matiere}</TableCell>
                  <TableCell className="text-right">
                    {leftover.leftover_quantity.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {leftover.is_reusable ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Oui
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="h-3 w-3 mr-1" />
                        Non
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {leftover.readded_to_stock ? (
                      <Badge variant="outline" className="bg-blue-50">
                        Réintégré
                      </Badge>
                    ) : leftover.is_reusable ? (
                      <Badge variant="outline">En attente</Badge>
                    ) : (
                      <Badge variant="secondary">Non récupérable</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {leftover.notes || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réintégrer les matériaux au stock?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de réintégrer {selectedLeftovers.length} matériau(x) 
              en surplus au stock principal. Cette action créera des transactions d'entrée 
              et mettra à jour les quantités en stock.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleReaddToStock} disabled={readdingToStock}>
              {readdingToStock ? "Réintégration..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
