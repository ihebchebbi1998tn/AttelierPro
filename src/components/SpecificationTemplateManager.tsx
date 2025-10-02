import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, GripVertical, X } from "lucide-react";

interface SpecTemplate {
  id?: number;
  name: string;
  input_type: "input" | "select" | "checkbox";
  options?: string[];
  display_order?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SpecificationTemplateManager({ open, onClose }: Props) {
  const [templates, setTemplates] = useState<SpecTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<SpecTemplate | null>(null);
  const [newOption, setNewOption] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    try {
      const resp = await fetch("https://luccibyey.com.tn/production/api/specification_templates.php");
      if (!resp.ok) {
        throw new Error("API non disponible");
      }
      const data = await resp.json();
      if (data.success) {
        setTemplates(data.templates || []);
      } else {
        throw new Error(data.message || "Erreur de chargement");
      }
    } catch (e) {
      toast({ 
        title: "Configuration requise", 
        description: "Veuillez uploader specification_templates.php sur le serveur et exécuter run_create_specification_templates.php", 
        variant: "destructive" 
      });
    }
  };

  const handleSaveTemplate = async (template: SpecTemplate) => {
    try {
      const url = "https://luccibyey.com.tn/production/api/specification_templates.php";
      const method = template.id ? "PUT" : "POST";
      
      const resp = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });
      
      const data = await resp.json();
      if (data.success) {
        toast({ title: "Succès", description: template.id ? "Modèle mis à jour" : "Modèle créé" });
        fetchTemplates();
        setEditingTemplate(null);
      } else {
        toast({ title: "Erreur", description: data.message, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Erreur", description: "Erreur lors de la sauvegarde", variant: "destructive" });
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm("Supprimer ce modèle ?")) return;
    
    try {
      const resp = await fetch("https://luccibyey.com.tn/production/api/specification_templates.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      
      const data = await resp.json();
      if (data.success) {
        toast({ title: "Succès", description: "Modèle supprimé" });
        fetchTemplates();
      }
    } catch (e) {
      toast({ title: "Erreur", description: "Erreur lors de la suppression", variant: "destructive" });
    }
  };

  const handleAddOption = () => {
    if (!newOption.trim() || !editingTemplate) return;
    
    const options = editingTemplate.options || [];
    setEditingTemplate({
      ...editingTemplate,
      options: [...options, newOption.trim()],
    });
    setNewOption("");
  };

  const handleRemoveOption = (index: number) => {
    if (!editingTemplate) return;
    const options = [...(editingTemplate.options || [])];
    options.splice(index, 1);
    setEditingTemplate({ ...editingTemplate, options });
  };

  const startNewTemplate = () => {
    setEditingTemplate({
      name: "",
      input_type: "input",
      options: [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gérer les modèles de spécifications</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!editingTemplate ? (
            <>
              <Button onClick={startNewTemplate} size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau modèle
              </Button>

              <div className="space-y-2">
                {templates.map((template) => (
                  <Card key={template.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{template.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {template.input_type === "input" ? "Texte libre" : 
                             template.input_type === "select" ? "Liste déroulante" : "Cases à cocher"}
                          </Badge>
                        </div>
                        {template.options && template.options.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {template.options.map((opt, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{opt}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTemplate(template)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id!)}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card className="p-4">
              <div className="space-y-4">
                <div>
                  <Label>Nom de la spécification</Label>
                  <Input
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    placeholder="Ex: Matériaux, Boutons..."
                  />
                </div>

                <div>
                  <Label>Type d'entrée</Label>
                  <Select
                    value={editingTemplate.input_type}
                    onValueChange={(value: any) => setEditingTemplate({ ...editingTemplate, input_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="input">Texte libre</SelectItem>
                      <SelectItem value="select">Liste déroulante</SelectItem>
                      <SelectItem value="checkbox">Cases à cocher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(editingTemplate.input_type === "select" || editingTemplate.input_type === "checkbox") && (
                  <div>
                    <Label>Options</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        placeholder="Ajouter une option..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddOption();
                          }
                        }}
                      />
                      <Button onClick={handleAddOption} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {(editingTemplate.options || []).map((opt, i) => (
                        <div key={i} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{opt}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveOption(i)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingTemplate(null)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={() => handleSaveTemplate(editingTemplate)}
                    className="flex-1"
                    disabled={!editingTemplate.name.trim()}
                  >
                    Enregistrer
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
