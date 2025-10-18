import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface MeasurementScaleTableProps {
  productId: string;
  configuredSizes: any;
}

interface MeasurementScale {
  id?: number;
  product_id: string;
  measurement_types: string[];
  measurements_data: { [measurementType: string]: { [size: string]: number } };
  tolerance_data: { [measurementType: string]: number };
}

const MeasurementScaleTable = ({ productId, configuredSizes }: MeasurementScaleTableProps) => {
  const { toast } = useToast();
  const [measurementScale, setMeasurementScale] = useState<MeasurementScale>({
    product_id: productId,
    measurement_types: [],
    measurements_data: {},
    tolerance_data: {}
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newMeasurementType, setNewMeasurementType] = useState('');

  // Get available sizes from configured sizes
  const getAvailableSizes = (): string[] => {
    const sizes: string[] = [];
    
    Object.keys(configuredSizes).forEach(sizeType => {
      if (Array.isArray(configuredSizes[sizeType])) {
        configuredSizes[sizeType].forEach((sizeItem: any) => {
          if (sizeItem.is_active === '1' || sizeItem.is_active === 1) {
            sizes.push(sizeItem.size_value);
          }
        });
      }
    });
    
    return sizes.sort((a, b) => {
      // Sort sizes: alphabetical sizes first, then numeric
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
  };

  const availableSizes = getAvailableSizes();

  const loadMeasurementScale = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://luccibyey.com.tn/production/api/product_measurement_scales.php?product_id=${productId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setMeasurementScale({
          id: data.data.id,
          product_id: productId,
          measurement_types: data.data.measurement_types || [],
          measurements_data: data.data.measurements_data || {},
          tolerance_data: data.data.tolerance_data || {}
        });
      }
    } catch (error) {
      console.error('Error loading measurement scale:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveMeasurementScale = async () => {
    setSaving(true);
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/product_measurement_scales.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(measurementScale)
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Succès",
          description: "Barème de mesure sauvegardé",
        });
        loadMeasurementScale(); // Reload to get updated data
      } else {
        throw new Error(data.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving measurement scale:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le barème de mesure",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addMeasurementType = () => {
    if (!newMeasurementType.trim()) return;

    const updatedTypes = [...measurementScale.measurement_types, newMeasurementType.trim()];
    const updatedData = { ...measurementScale.measurements_data };
    const updatedTolerance = { ...measurementScale.tolerance_data };
    
    // Initialize measurements for the new type
    updatedData[newMeasurementType.trim()] = {};
    availableSizes.forEach(size => {
      updatedData[newMeasurementType.trim()][size] = 0;
    });
    
    // Initialize tolerance for the new type
    updatedTolerance[newMeasurementType.trim()] = 0;

    setMeasurementScale({
      ...measurementScale,
      measurement_types: updatedTypes,
      measurements_data: updatedData,
      tolerance_data: updatedTolerance
    });
    
    setNewMeasurementType('');
  };

  const removeMeasurementType = (typeToRemove: string) => {
    const updatedTypes = measurementScale.measurement_types.filter(type => type !== typeToRemove);
    const updatedData = { ...measurementScale.measurements_data };
    const updatedTolerance = { ...measurementScale.tolerance_data };
    delete updatedData[typeToRemove];
    delete updatedTolerance[typeToRemove];

    setMeasurementScale({
      ...measurementScale,
      measurement_types: updatedTypes,
      measurements_data: updatedData,
      tolerance_data: updatedTolerance
    });
  };

  const updateTolerance = (measurementType: string, value: string) => {
    // Allow empty string and preserve decimal values
    const floatValue = value === '' ? 0 : parseFloat(value);
    const updatedTolerance = { ...measurementScale.tolerance_data };
    updatedTolerance[measurementType] = isNaN(floatValue) ? 0 : floatValue;

    setMeasurementScale({
      ...measurementScale,
      tolerance_data: updatedTolerance
    });
  };

  const updateMeasurement = (measurementType: string, size: string, value: string) => {
    const floatValue = parseFloat(value) || 0;
    const updatedData = { ...measurementScale.measurements_data };
    
    if (!updatedData[measurementType]) {
      updatedData[measurementType] = {};
    }
    
    updatedData[measurementType][size] = floatValue;

    setMeasurementScale({
      ...measurementScale,
      measurements_data: updatedData
    });
  };

  useEffect(() => {
    if (productId && availableSizes.length > 0) {
      loadMeasurementScale();
    }
  }, [productId, availableSizes.length]);

  // Don't render if no sizes are configured
  if (availableSizes.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Barème de mesure
          </CardTitle>
          <Button 
            onClick={saveMeasurementScale} 
            disabled={saving}
            size="sm"
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Add new measurement type */}
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Largeur dos, Tour de poitrine..."
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
            {measurementScale.measurement_types.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                  <TableRow>
                    <TableHead className="w-48">Type de mesure</TableHead>
                    <TableHead className="w-20 text-center">+/-</TableHead>
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
                    {measurementScale.measurement_types.map(measurementType => (
                      <TableRow key={measurementType}>
                        <TableCell className="font-medium">
                          {measurementType}
                        </TableCell>
                        <TableCell className="p-2">
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="0"
                            value={measurementScale.tolerance_data[measurementType] || ''}
                            onChange={(e) => updateTolerance(measurementType, e.target.value)}
                            className="text-center text-sm h-8 w-16"
                          />
                        </TableCell>
                        {availableSizes.map(size => (
                          <TableCell key={size} className="p-2">
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="0"
                              value={measurementScale.measurements_data[measurementType]?.[size] || ''}
                              onChange={(e) => updateMeasurement(measurementType, size, e.target.value)}
                              className="text-center text-sm h-8"
                            />
                          </TableCell>
                        ))}
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMeasurementType(measurementType)}
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

            {measurementScale.measurement_types.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucun type de mesure configuré</p>
                <p className="text-sm">Ajoutez un type de mesure pour commencer</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MeasurementScaleTable;