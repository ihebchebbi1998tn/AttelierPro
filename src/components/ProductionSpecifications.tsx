import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Save, X, Plus, Trash2, ClipboardList } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface ProductionSpecificationsProps {
  specifications?: Record<string, string>;
  onChange?: (specs: Record<string, string>) => void;
  editable?: boolean;
  productName?: string;
}

const ProductionSpecifications: React.FC<ProductionSpecificationsProps> = ({
  specifications = {},
  onChange,
  editable = true,
  productName = 'Produit'
}) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [specs, setSpecs] = useState<Record<string, string>>(specifications);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  const handleAddField = () => {
    if (!newFieldName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du champ est requis",
        variant: "destructive",
      });
      return;
    }

    const updatedSpecs = {
      ...specs,
      [newFieldName.trim()]: newFieldValue.trim()
    };
    
    setSpecs(updatedSpecs);
    setNewFieldName('');
    setNewFieldValue('');

    toast({
      title: "Succès",
      description: "Champ ajouté avec succès",
    });
  };

  const handleRemoveField = (fieldName: string) => {
    const updatedSpecs = { ...specs };
    delete updatedSpecs[fieldName];
    setSpecs(updatedSpecs);
  };

  const handleUpdateField = (oldName: string, newValue: string) => {
    const updatedSpecs = {
      ...specs,
      [oldName]: newValue
    };
    setSpecs(updatedSpecs);
  };

  const handleSave = () => {
    if (onChange) {
      onChange(specs);
    }
    setIsEditing(false);
    toast({
      title: "Succès",
      description: "Spécifications sauvegardées",
    });
  };

  const handleCancel = () => {
    setSpecs(specifications);
    setNewFieldName('');
    setNewFieldValue('');
    setIsEditing(false);
  };

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center">
            <ClipboardList className="w-5 h-5 mr-2" />
            Spécifications de Production
          </div>
          {editable && !isEditing && (
            <Button onClick={handleStartEditing} size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          )}
          {isEditing && (
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-6">
            {/* Add new specification field */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
              <Label className="text-sm font-semibold mb-3 block">
                Ajouter une spécification
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Input
                    placeholder="Ex: Matériau principal, Nombre de boutons..."
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newFieldName.trim()) {
                        handleAddField();
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Valeur..."
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newFieldName.trim()) {
                        handleAddField();
                      }
                    }}
                  />
                  <Button 
                    onClick={handleAddField}
                    size="sm"
                    variant="default"
                    disabled={!newFieldName.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </div>
            </div>

            {/* Existing specifications */}
            {Object.keys(specs).length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold border-r w-1/3">
                        Spécification
                      </th>
                      <th className="text-left py-3 px-4 font-semibold border-r">
                        Valeur
                      </th>
                      <th className="text-center py-3 px-4 font-semibold w-20">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(specs).map(([fieldName, fieldValue], index) => (
                      <tr 
                        key={fieldName} 
                        className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                      >
                        <td className="py-3 px-4 font-medium border-r">
                          {fieldName}
                        </td>
                        <td className="py-3 px-4 border-r">
                          <Input
                            value={fieldValue}
                            onChange={(e) => handleUpdateField(fieldName, e.target.value)}
                            className="text-sm"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveField(fieldName)}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune spécification configurée</p>
                <p className="text-sm">Ajoutez des spécifications pour ce produit</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {Object.keys(specs).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune spécification de production</p>
                {editable && (
                  <p className="text-sm">Cliquez sur "Modifier" pour ajouter des spécifications</p>
                )}
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold border-r w-1/3">
                        Spécification
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Valeur
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(specs).map(([fieldName, fieldValue], index) => (
                      <tr 
                        key={fieldName}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                      >
                        <td className="py-3 px-4 font-medium border-r">
                          {fieldName}
                        </td>
                        <td className="py-3 px-4">
                          {fieldValue || '-'}
                        </td>
                      </tr>
                    ))}
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

export default ProductionSpecifications;
