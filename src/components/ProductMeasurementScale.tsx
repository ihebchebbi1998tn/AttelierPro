import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Save, X, Plus, Trash2, Ruler } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Measurement {
  id?: number;
  measurement_name: string;
  measurement_value: number | null;
  tolerance: number;
  unit: string;
  notes?: string;
}

interface ProductMeasurementScaleProps {
  productId: string;
  productType: 'regular' | 'soustraitance'; // To determine which API to use
  productName?: string;
  configuredSizes?: any; // Configured sizes for the product
}

const ProductMeasurementScale: React.FC<ProductMeasurementScaleProps> = ({
  productId,
  productType,
  productName = 'Produit',
  configuredSizes
}) => {
  const { toast } = useToast();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMeasurements, setEditingMeasurements] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // New measurement form
  const [newMeasurement, setNewMeasurement] = useState<Measurement>({
    measurement_name: '',
    measurement_value: null,
    tolerance: 0.5,
    unit: 'cm',
    notes: ''
  });

  const API_ENDPOINTS = {
    regular: 'production_ready_products_mesure.php',
    soustraitance: 'production_soustraitance_products_mesure.php'
  };

  const apiUrl = `https://luccibyey.com.tn/production/api/${API_ENDPOINTS[productType]}`;

  // Helper function to get configured sizes
  const getConfiguredSizesArray = () => {
    // If configuredSizes prop is provided, use it
    if (configuredSizes && Object.keys(configuredSizes).length > 0) {
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
      if (sizes.length > 0) {
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
      }
    }
    
    // Fallback to default sizes based on product type
    if (productType === 'soustraitance') {
      return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    } else {
      return ['S', 'M', 'L', 'XL', 'XXL'];
    }
  };

  useEffect(() => {
    loadMeasurements();
  }, [productId, productType]);

  const loadMeasurements = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}?product_id=${parseInt(productId)}`);
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
    loadMeasurements(); // Reload original data
  };

  const handleMeasurementChange = (index: number, field: keyof Measurement, value: any) => {
    const updatedMeasurements = [...measurements];
    updatedMeasurements[index] = {
      ...updatedMeasurements[index],
      [field]: value
    };
    setMeasurements(updatedMeasurements);
  };

  const handleAddNewMeasurement = async () => {
    if (!newMeasurement.measurement_name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de la mesure est requis",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: parseInt(productId),
          ...newMeasurement
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Succès",
          description: "Mesure ajoutée avec succès",
        });
        
        // Reset form
        setNewMeasurement({
          measurement_name: '',
          measurement_value: null,
          tolerance: 0.5,
          unit: 'cm',
          notes: ''
        });
        
        // Reload measurements
        await loadMeasurements();
      } else {
        throw new Error(data.message || 'Erreur lors de l\'ajout');
      }
    } catch (error) {
      console.error('Error adding measurement:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout de la mesure",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMeasurement = async (measurementId: number) => {
    try {
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: measurementId })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Succès",
          description: "Mesure supprimée avec succès",
        });
        
        // Reload measurements
        await loadMeasurements();
      } else {
        throw new Error(data.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting measurement:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de la mesure",
        variant: "destructive",
      });
    }
  };

  const handleSaveMeasurements = async () => {
    setSaving(true);
    try {
      // Update all existing measurements
      const updatePromises = measurements
        .filter(m => m.id) // Only update existing measurements
        .map(measurement => 
          fetch(apiUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(measurement)
          })
        );

      const results = await Promise.all(updatePromises);
      const allSuccessful = results.every(async (response) => {
        const data = await response.json();
        return data.success;
      });

      if (allSuccessful) {
        toast({
          title: "Succès",
          description: "Mesures mises à jour avec succès",
        });
        setEditingMeasurements(false);
        await loadMeasurements();
      } else {
        throw new Error('Certaines mesures n\'ont pas pu être sauvegardées');
      }
    } catch (error) {
      console.error('Error saving measurements:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde des mesures",
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

  const configuredSizesArray = getConfiguredSizesArray();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center">
            <Ruler className="w-5 h-5 mr-2" />
            Barème de Mesure - {productName}
          </div>
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
              <Button size="sm" onClick={handleSaveMeasurements} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {editingMeasurements ? (
          <div className="space-y-6">
            {/* Add new measurement type */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Ex: Tour de poitrine, Longueur dos..."
                value={newMeasurement.measurement_name}
                onChange={(e) => setNewMeasurement(prev => ({ ...prev, measurement_name: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && handleAddNewMeasurement()}
                className="flex-1"
              />
              <Button 
                onClick={handleAddNewMeasurement}
                size="sm"
                variant="outline"
                disabled={!newMeasurement.measurement_name.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter Type
              </Button>
            </div>

            {/* Measurements per size table */}
            {measurements.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold border-r">Type de mesure</th>
                      <th className="text-center py-3 px-2 font-semibold border-r">+/-</th>
                      {configuredSizesArray.map(size => (
                        <th key={size} className="text-center py-3 px-2 font-semibold border-r min-w-20">
                          <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                            {size}
                          </span>
                        </th>
                      ))}
                      <th className="text-center py-3 px-2 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Group measurements by measurement_name
                      const groupedMeasurements = measurements.reduce((acc: any, measurement) => {
                        const key = measurement.measurement_name;
                        if (!acc[key]) {
                          acc[key] = {
                            measurement_name: key,
                            tolerance: measurement.tolerance,
                            values: {},
                            notes: measurement.notes || ''
                          };
                        }
                        // Since we're using individual measurements, we'll show the same value for all sizes
                        configuredSizesArray.forEach(size => {
                          acc[key].values[size] = measurement.measurement_value || '';
                        });
                        return acc;
                      }, {});

                      return Object.values(groupedMeasurements).map((measurementGroup: any, groupIndex) => (
                        <tr key={groupIndex} className={`${groupIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="py-3 px-4 font-medium border-r">
                            {measurementGroup.measurement_name}
                          </td>
                          <td className="py-3 px-2 border-r">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              placeholder="0.5"
                              value={measurementGroup.tolerance || ''}
                              onChange={(e) => {
                                // Update tolerance for this measurement type
                                const updatedMeasurements = measurements.map(m => 
                                  m.measurement_name === measurementGroup.measurement_name 
                                    ? { ...m, tolerance: parseFloat(e.target.value) || 0.5 }
                                    : m
                                );
                                setMeasurements(updatedMeasurements);
                              }}
                              className="text-center text-sm h-8 w-16"
                            />
                          </td>
                          {configuredSizesArray.map(size => (
                            <td key={size} className="py-3 px-2 border-r">
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="0"
                                value={measurementGroup.values[size] || ''}
                                onChange={(e) => {
                                  // Update measurement value for this size and measurement type
                                  const value = parseFloat(e.target.value) || null;
                                  const updatedMeasurements = measurements.map(m => 
                                    m.measurement_name === measurementGroup.measurement_name 
                                      ? { ...m, measurement_value: value }
                                      : m
                                  );
                                  setMeasurements(updatedMeasurements);
                                }}
                                className="text-center text-sm h-8"
                              />
                            </td>
                          ))}
                          <td className="py-3 px-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Delete all measurements of this type
                                const measurementToDelete = measurements.find(m => m.measurement_name === measurementGroup.measurement_name);
                                if (measurementToDelete?.id) {
                                  handleDeleteMeasurement(measurementToDelete.id);
                                }
                              }}
                              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
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
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold border-r">Type de mesure</th>
                      <th className="text-center py-3 px-2 font-semibold border-r">+/-</th>
                      {configuredSizesArray.map(size => (
                        <th key={size} className="text-center py-3 px-2 font-semibold border-r min-w-20">
                          <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                            {size}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Group measurements by measurement_name
                      const groupedMeasurements = measurements.reduce((acc: any, measurement) => {
                        const key = measurement.measurement_name;
                        if (!acc[key]) {
                          acc[key] = {
                            measurement_name: key,
                            tolerance: measurement.tolerance,
                            values: {},
                            notes: measurement.notes || ''
                          };
                        }
                        // Since we're using individual measurements, we'll show the same value for all sizes
                        configuredSizesArray.forEach(size => {
                          acc[key].values[size] = measurement.measurement_value || '';
                        });
                        return acc;
                      }, {});

                      return Object.values(groupedMeasurements).map((measurementGroup: any, groupIndex) => (
                        <tr key={groupIndex} className={`${groupIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="py-3 px-4 font-medium border-r">
                            {measurementGroup.measurement_name}
                          </td>
                          <td className="py-3 px-2 text-center text-muted-foreground border-r">
                            ±{measurementGroup.tolerance} cm
                          </td>
                          {configuredSizesArray.map(size => (
                            <td key={size} className="py-3 px-2 text-center border-r">
                              <span className="font-semibold text-primary">
                                {measurementGroup.values[size] ? `${measurementGroup.values[size]} cm` : '-'}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductMeasurementScale;