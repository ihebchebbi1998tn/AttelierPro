import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Package, TrendingUp, TrendingDown, AlertTriangle, History } from 'lucide-react';

interface StockEntry {
  id: number;
  product_id: number;
  size_name: string;
  stock_quantity: number;
  available_quantity: number;
  minimum_threshold: number;
  maximum_capacity: number;
  stock_status: 'AVAILABLE' | 'LOW' | 'OUT_OF_STOCK';
  last_updated: string;
  updated_by: string;
  notes?: string;
}

interface StockSummary {
  total_sizes: number;
  total_stock: number;
  total_available: number;
  sizes_low_stock: number;
  sizes_out_of_stock: number;
}

interface StockManagerProps {
  productId: number;
  productName: string;
}

const SoustraitanceStockManager: React.FC<StockManagerProps> = ({ productId, productName }) => {
  const [stocks, setStocks] = useState<StockEntry[]>([]);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockEntry | null>(null);
  const [formData, setFormData] = useState({
    size_name: '',
    stock_quantity: 0,
    minimum_threshold: 5,
    maximum_capacity: 1000,
    notes: '',
    change_reason: ''
  });
  
  const { toast } = useToast();
  const API_BASE_URL = 'https://luccibyey.com.tn/production/api';

  const commonSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];

  useEffect(() => {
    loadStocks();
  }, [productId]);

  const loadStocks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/soustraitance_stock.php?product_id=${productId}`);
      const data = await response.json();
      
      if (data.success) {
        setStocks(data.data || []);
        setSummary(data.summary || null);
      } else {
        toast({
          title: "Erreur",
          description: data.message || "Erreur lors du chargement du stock",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading stocks:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion lors du chargement du stock",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/soustraitance_stock.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          size_name: formData.size_name.toUpperCase(),
          stock_quantity: formData.stock_quantity,
          minimum_threshold: formData.minimum_threshold,
          maximum_capacity: formData.maximum_capacity,
          updated_by: 'Admin',
          notes: formData.notes
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Succès",
          description: "Stock ajouté avec succès",
        });
        setShowAddDialog(false);
        resetForm();
        loadStocks();
      } else {
        toast({
          title: "Erreur",
          description: data.message || "Erreur lors de l'ajout du stock",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStock = async () => {
    if (!selectedStock) return;

    try {
      const response = await fetch(`${API_BASE_URL}/soustraitance_stock.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedStock.id,
          stock_quantity: formData.stock_quantity,
          minimum_threshold: formData.minimum_threshold,
          maximum_capacity: formData.maximum_capacity,
          updated_by: 'Admin',
          notes: formData.notes,
          change_reason: formData.change_reason
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Succès",
          description: "Stock mis à jour avec succès",
        });
        setShowEditDialog(false);
        setSelectedStock(null);
        resetForm();
        loadStocks();
      } else {
        toast({
          title: "Erreur",
          description: data.message || "Erreur lors de la mise à jour du stock",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStock = async () => {
    if (!selectedStock) return;

    try {
      const response = await fetch(`${API_BASE_URL}/soustraitance_stock.php`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedStock.id,
          deleted_by: 'Admin'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Succès",
          description: "Stock supprimé avec succès",
        });
        setShowDeleteDialog(false);
        setSelectedStock(null);
        loadStocks();
      } else {
        toast({
          title: "Erreur",
          description: data.message || "Erreur lors de la suppression du stock",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting stock:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      size_name: '',
      stock_quantity: 0,
      minimum_threshold: 5,
      maximum_capacity: 1000,
      notes: '',
      change_reason: ''
    });
  };

  const openEditDialog = (stock: StockEntry) => {
    setSelectedStock(stock);
    setFormData({
      size_name: stock.size_name,
      stock_quantity: stock.stock_quantity,
      minimum_threshold: stock.minimum_threshold,
      maximum_capacity: stock.maximum_capacity,
      notes: stock.notes || '',
      change_reason: ''
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (stock: StockEntry) => {
    setSelectedStock(stock);
    setShowDeleteDialog(true);
  };

  const getStatusBadge = (status: string, availableQuantity: number) => {
    switch (status) {
      case 'OUT_OF_STOCK':
        return <Badge variant="destructive" className="text-xs">Rupture</Badge>;
      case 'LOW':
        return <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-200">Stock Faible</Badge>;
      case 'AVAILABLE':
        return <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">Disponible</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Inconnu</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Stock</p>
                  <p className="text-2xl font-bold">{summary.total_stock}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Disponible</p>
                  <p className="text-2xl font-bold text-green-600">{summary.total_available}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Stock Faible</p>
                  <p className="text-2xl font-bold text-red-600">{summary.sizes_low_stock}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stock Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gestion du Stock - {productName}</CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter Taille
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter Stock pour une Taille</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="size_name" className="text-right">
                    Taille
                  </Label>
                  <div className="col-span-3">
                    <select
                      id="size_name"
                      value={formData.size_name}
                      onChange={(e) => setFormData({...formData, size_name: e.target.value})}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Sélectionner une taille</option>
                      {commonSizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stock_quantity" className="text-right">
                    Quantité
                  </Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({...formData, stock_quantity: parseInt(e.target.value) || 0})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="minimum_threshold" className="text-right">
                    Seuil Min
                  </Label>
                  <Input
                    id="minimum_threshold"
                    type="number"
                    min="0"
                    value={formData.minimum_threshold}
                    onChange={(e) => setFormData({...formData, minimum_threshold: parseInt(e.target.value) || 0})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAddStock} disabled={!formData.size_name}>
                  Ajouter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {stocks.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun stock configuré pour ce produit</p>
              <p className="text-sm text-muted-foreground">Cliquez sur "Ajouter Taille" pour commencer</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Taille</TableHead>
                  <TableHead className="text-right">Stock Disponible</TableHead>
                  <TableHead className="text-right">Seuil Min</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière MAJ</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((stock) => (
                  <TableRow key={stock.id}>
                    <TableCell className="font-medium">{stock.size_name}</TableCell>
                    <TableCell className="text-right font-medium">
                      {stock.stock_quantity}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {stock.minimum_threshold}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(stock.stock_status, stock.available_quantity)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(stock.last_updated).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(stock)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(stock)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier Stock - Taille {selectedStock?.size_name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_stock_quantity" className="text-right">
                Quantité
              </Label>
              <Input
                id="edit_stock_quantity"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({...formData, stock_quantity: parseInt(e.target.value) || 0})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_minimum_threshold" className="text-right">
                Seuil Min
              </Label>
              <Input
                id="edit_minimum_threshold"
                type="number"
                min="0"
                value={formData.minimum_threshold}
                onChange={(e) => setFormData({...formData, minimum_threshold: parseInt(e.target.value) || 0})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_change_reason" className="text-right">
                Raison
              </Label>
              <Input
                id="edit_change_reason"
                value={formData.change_reason}
                onChange={(e) => setFormData({...formData, change_reason: e.target.value})}
                placeholder="Raison de la modification"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="edit_notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateStock}>
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le stock pour la taille {selectedStock?.size_name} ?
              Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStock} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SoustraitanceStockManager;