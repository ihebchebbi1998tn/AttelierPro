import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ClipboardList } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from '@/hooks/use-mobile';

interface ProductionSpecificationsModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (specifications: Record<string, string>) => void;
  initialSpecifications?: Record<string, string>;
  productName?: string;
}

const ProductionSpecificationsModal: React.FC<ProductionSpecificationsModalProps> = ({
  open,
  onClose,
  onSave,
  initialSpecifications = {},
  productName = 'Produit'
}) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [specs, setSpecs] = useState<Record<string, string>>(initialSpecifications);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const prevOpenRef = useRef(open);

  // Sync specs with initialSpecifications only when modal first opens (not on every render)
  useEffect(() => {
    // Only reset when modal transitions from closed to open
    if (open && !prevOpenRef.current) {
      console.log('[SpecsModal] Resetting specs on open', { initialSpecifications });
      setSpecs(initialSpecifications);
      setNewFieldName('');
      setNewFieldValue('');
    }
    prevOpenRef.current = open;
  }, [open, initialSpecifications]);

  // Lifecycle debug
  useEffect(() => {
    console.log('[SpecsModal] MOUNT');
    return () => console.log('[SpecsModal] UNMOUNT');
  }, []);
  useEffect(() => { console.log('[SpecsModal] open changed', open); }, [open]);
  useEffect(() => { console.log('[SpecsModal] props-open changed (control)', open); }, [open]);

  const handleAddField = () => {
    if (!newFieldName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du champ est requis",
        variant: "destructive",
      });
      return;
    }

    setSpecs(prev => ({
      ...prev,
      [newFieldName.trim()]: newFieldValue.trim()
    }));
    
    setNewFieldName('');
    setNewFieldValue('');
  };

  const handleRemoveField = (fieldName: string) => {
    const updatedSpecs = { ...specs };
    delete updatedSpecs[fieldName];
    setSpecs(updatedSpecs);
  };

  const handleUpdateValue = (fieldName: string, value: string) => {
    console.log('[SpecsModal] Input change', { fieldName, valueLength: value?.length, value });
    setSpecs(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSave = () => {
    // Only save non-empty specs, otherwise send empty object (not array)
    const specsToSave = Object.keys(specs).length > 0 ? specs : {};
    onSave(specsToSave);
    onClose();
  };

  const handleCancel = () => {
    setSpecs(initialSpecifications);
    setNewFieldName('');
    setNewFieldValue('');
    onClose();
  };

  const ModalContent = () => (
    <div className="space-y-4 sm:space-y-6 py-4" onKeyDown={(e) => { console.log('[SpecsModal] keydown stopped', e.key); e.stopPropagation(); }}>
      {/* Add new specification field */}
      <div className="border-2 border-dashed border-border rounded-lg p-3 sm:p-4 bg-muted/30">
        <Label className="text-sm font-semibold mb-3 block">
          Ajouter une spécification
        </Label>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label className="text-xs mb-1">Nom de la spécification</Label>
            <Input
              placeholder="Ex: Matériau principal, Nombre de boutons..."
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newFieldName.trim()) {
                  e.preventDefault();
                  handleAddField();
                }
              }}
              autoComplete="off"
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs mb-1">Valeur</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Coton 100%, 6 boutons..."
                value={newFieldValue}
                onChange={(e) => setNewFieldValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFieldName.trim()) {
                    e.preventDefault();
                    handleAddField();
                  }
                }}
                autoComplete="off"
                className="text-sm"
              />
              <Button 
                onClick={handleAddField}
                size="sm"
                disabled={!newFieldName.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Exemples: Matériau principal, Nombre de boutons, Type de fermeture, Couleur fil, Finitions, etc.
        </p>
      </div>

      {/* Existing specifications */}
      {Object.keys(specs).length > 0 ? (
        <div className="space-y-3">
          {Object.entries(specs).map(([fieldName, fieldValue], index) => (
            <div 
              key={fieldName} 
              className="border rounded-lg p-3 bg-card"
            >
              <div className="flex items-start justify-between mb-2">
                <Label className="font-semibold text-sm">
                  {fieldName}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveField(fieldName)}
                  className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <Input
                value={fieldValue}
                onChange={(e) => handleUpdateValue(fieldName, e.target.value)}
                className="text-sm"
                placeholder="Entrez la valeur..."
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Aucune spécification ajoutée</p>
          <p className="text-xs">Ajoutez des spécifications pour documenter la production</p>
        </div>
      )}
    </div>
  );

  const FooterButtons = () => (
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      <Button type="button" variant="outline" onClick={handleCancel} className="flex-1 sm:flex-none">
        Passer
      </Button>
      <Button type="button" onClick={handleSave} className="flex-1 sm:flex-none">
        Sauvegarder
      </Button>
    </div>
  );

  const handleDialogOpenChange = React.useCallback((o: boolean) => {
    console.log('[SpecsModal] onOpenChange', o);
    if (!o) handleCancel();
  }, [handleCancel]);

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleDialogOpenChange}>
        <DrawerContent className="max-h-[95vh]" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center text-base">
              <ClipboardList className="w-5 h-5 mr-2" />
              Spécifications - {productName}
            </DrawerTitle>
          </DrawerHeader>
          
          <div className="px-4 pb-4 overflow-y-auto flex-1">
            <ModalContent />
          </div>
          
          <DrawerFooter className="mt-auto">
            <FooterButtons />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent 
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        onEscapeKeyDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onOpenAutoFocus={(e) => { e.preventDefault(); }}
        onCloseAutoFocus={(e) => { console.log('[SpecsModal] onCloseAutoFocus'); }}
        onPointerDownOutside={(e) => { console.log('[SpecsModal] onPointerDownOutside'); }}
        onInteractOutside={(e) => { console.log('[SpecsModal] onInteractOutside'); }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <ClipboardList className="w-6 h-6 mr-2" />
            Spécifications de Production - {productName}
          </DialogTitle>
          <DialogDescription id="specs-desc">
            Ajoutez ou modifiez les champs nécessaires pour la production. Appuyez sur Entrée pour ajouter rapidement un champ.
          </DialogDescription>
        </DialogHeader>

        <ModalContent />

        <DialogFooter>
          <FooterButtons />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductionSpecificationsModal;
