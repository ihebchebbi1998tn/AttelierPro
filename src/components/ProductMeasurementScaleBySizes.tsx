import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, X, Plus, Trash2, Ruler } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface MeasurementData {
  measurement_name: string;
  tolerance: number;
  unit: string;
  notes?: string;
  sizes: { [size: string]: number };
}

interface ProductMeasurementScaleBySizesProps {
  productId: string;
  productType: 'regular' | 'soustraitance';
  productName?: string;
  configuredSizes?: any;
}

const ProductMeasurementScaleBySizes: React.FC<ProductMeasurementScaleBySizesProps> = ({
  productId,
  productType,
  productName = 'Produit',
  configuredSizes
}) => {
  const { toast } = useToast();
  const [measurements, setMeasurements] = useState<MeasurementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMeasurements, setEditingMeasurements] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newMeasurementType, setNewMeasurementType] = useState('');

  const API_ENDPOINTS = {
    regular: 'production_ready_products_mesure_by_size.php',
    soustraitance: 'production_soustraitance_products_mesure_by_size.php'
  };

  const apiUrl = `https://luccibyey.com.tn/production/api/${API_ENDPOINTS[productType]}`;

  // Get available sizes from configured sizes
  const getAvailableSizes = (): string[] => {
    const sizes: string[] = [];
    
    if (configuredSizes && Object.keys(configuredSizes).length > 0) {
      Object.keys(configuredSizes).forEach(sizeType => {
        if (Array.isArray(configuredSizes[sizeType])) {
          configuredSizes[sizeType].forEach((sizeItem: any) => {
            if (sizeItem.is_active === '1' || sizeItem.is_active === 1) {
              sizes.push(sizeItem.size_value);
            }
          });
        }
      });
      
      if (sizes.length > 0) {
        return sizes.sort((a, b) => {
          const aIsNumeric = !isNaN(Number(a));
          const bIsNumeric = !isNaN(Number(b));
          
          if (aIsNumeric && bIsNumeric) {
            return Number(a) - Number(b);
          } else if (!aIsNumeric && !bIsNumeric) {
            const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
            const aIndex = order.indexOf(a.toUpperCase());
            const bIndex = order.indexOf(b.toUpperCase());
            if (aIndex !== -1 && bIndex !== -1) {
              return aIndex - bIndex;
            }
            return a.localeCompare(b);
          } else {
            return aIsNumeric ? 1 : -1;
          }
        });
      }
    }
    
    // Fallback sizes
    return productType === 'soustraitance' 
      ? ['XS', 'S', 'M', 'L', 'XL', 'XXL']
      : ['S', 'M', 'L', 'XL', 'XXL'];
  };

  const availableSizes = getAvailableSizes();

  useEffect(() => {
    if (productId && availableSizes.length > 0) {
      loadMeasurements();
    }
  }, [productId, availableSizes.length]);

  const loadMeasurements = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}?product_id=${productId}`);
      const data = await response.json();
      
      if (data.success) {
        setMeasurements(data.data || []);
      } else {
        console.error('Failed to load measurements:', data.message);
      }
    } catch (error) {
      console.error('Error loading measurements:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les mesures",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartEditing = () => {
    setEditingMeasurements(true);
  };

  const handleCancelEditing = () => {
    setEditingMeasurements(false);
    loadMeasurements();
  };

  const addMeasurementType = () => {
    if (!newMeasurementType.trim()) return;

    const newMeasurement: MeasurementData = {
      measurement_name: newMeasurementType.trim(),
      tolerance: 0.5,
      unit: 'cm',
      notes: '',
      sizes: {}
    };

    // Initialize all sizes with 0
    availableSizes.forEach(size => {
      newMeasurement.sizes[size] = 0;
    });

    setMeasurements([...measurements, newMeasurement]);
    setNewMeasurementType('');
  };

  const removeMeasurementType = async (measurementName: string) => {
    try {
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: parseInt(productId),
          measurement_name: measurementName
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Succès",
          description: "Type de mesure supprimé",
        });
        setMeasurements(measurements.filter(m => m.measurement_name !== measurementName));
      } else {
        throw new Error(data.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting measurement:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive",
      });
    }
  };

  const updateTolerance = (measurementName: string, value: string) => {
    const floatValue = value === '' ? 0 : parseFloat(value);
    setMeasurements(measurements.map(m => 
      m.measurement_name === measurementName 
        ? { ...m, tolerance: isNaN(floatValue) ? 0 : floatValue }
        : m
    ));
  };

  const updateMeasurement = (measurementName: string, size: string, value: string) => {
    const floatValue = parseFloat(value) || 0;
    setMeasurements(measurements.map(m => 
      m.measurement_name === measurementName 
        ? { ...m, sizes: { ...m.sizes, [size]: floatValue } }
        : m
    ));
  };

  const saveMeasurements = async () => {
    setSaving(true);
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: parseInt(productId),
          measurements: measurements
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Succès",
          description: "Barème de mesure sauvegardé",
        });
        setEditingMeasurements(false);
        loadMeasurements();
      } else {
        throw new Error(data.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving measurements:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le barème de mesure",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Ruler className="w-5 h-5 mr-2" />
            Barème de Mesure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't render if no sizes are configured
  if (availableSizes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Ruler className="w-5 h-5 mr-2" />
            Barème de Mesure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Aucune taille configurée pour ce produit</p>
            <p className="text-sm">Configurez d'abord les tailles dans les paramètres du produit</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Ruler className="w-5 h-5 mr-2" />
            Barème de mesure - {productName}
          </CardTitle>
          {!editingMeasurements ? (
            <Button onClick={handleStartEditing} size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          ) : (
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={handleCancelEditing}>
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button size="sm" onClick={saveMeasurements} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editingMeasurements ? (
          <div className="space-y-4">
            {/* Add new measurement type */}
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Tour de poitrine, Longueur dos..."
                value={newMeasurementType}
                onChange={(e) => setNewMeasurementType(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addMeasurementType()}
                className="flex-1"
              />
              <Button 
                onClick={addMeasurementType}
                size="sm"
                variant="outline"
                disabled={!newMeasurementType.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Measurement table */}
            {measurements.length > 0 && (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-48">Type de mesure</TableHead>
                      <TableHead className="w-20 text-center">+/- (cm)</TableHead>
                      {availableSizes.map(size => (
                        <TableHead key={size} className="text-center min-w-20">
                          <Badge variant="outline" className="text-xs">
                            {size}
                          </Badge>
                        </TableHead>
                      ))}
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {measurements.map((measurement, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {measurement.measurement_name}
                        </TableCell>
                        <TableCell className="p-2">
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="0.5"
                            value={measurement.tolerance || ''}
                            onChange={(e) => updateTolerance(measurement.measurement_name, e.target.value)}
                            className="text-center text-sm h-8 w-16"
                          />
                        </TableCell>
                        {availableSizes.map(size => (
                          <TableCell key={size} className="p-2">
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="0"
                              value={measurement.sizes[size] || ''}
                              onChange={(e) => updateMeasurement(measurement.measurement_name, size, e.target.value)}
                              className="text-center text-sm h-8"
                            />
                          </TableCell>
                        ))}
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMeasurementType(measurement.measurement_name)}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {measurements.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Ruler className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun type de mesure configuré</p>
                <p className="text-sm">Ajoutez un type de mesure pour commencer</p>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {measurements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Ruler className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune mesure configurée pour ce produit</p>
                <p className="text-sm">Cliquez sur "Modifier" pour ajouter des mesures</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-48">Type de mesure</TableHead>
                      <TableHead className="w-20 text-center">+/- (cm)</TableHead>
                      {availableSizes.map(size => (
                        <TableHead key={size} className="text-center min-w-20">
                          <Badge variant="outline" className="text-xs">
                            {size}
                          </Badge>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {measurements.map((measurement, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {measurement.measurement_name}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-xs">
                            ±{measurement.tolerance}
                          </Badge>
                        </TableCell>
                        {availableSizes.map(size => (
                          <TableCell key={size} className="text-center">
                            <span className="font-mono text-sm">
                              {measurement.sizes[size] || '-'}
                            </span>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductMeasurementScaleBySizes;