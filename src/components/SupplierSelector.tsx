import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2 } from "lucide-react";

interface Supplier {
  id: number;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  materials_count?: number;
}

interface SupplierSelectorProps {
  value?: number;
  onValueChange: (value: number | undefined) => void;
  placeholder?: string;
}

const SupplierSelector = ({ value, onValueChange, placeholder = "Sélectionner un fournisseur" }: SupplierSelectorProps) => {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New supplier form state
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    address: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/fournisseurs.php');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setSuppliers(data.data);
      } else {
        console.error('Failed to fetch suppliers:', data.message);
        setSuppliers([]);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setSuppliers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSupplier = async () => {
    if (!newSupplier.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du fournisseur est obligatoire",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/fournisseurs.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSupplier),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Succès",
          description: "Fournisseur créé avec succès",
        });
        
        // Refresh suppliers list
        await fetchSuppliers();
        
        // Select the newly created supplier
        if (data.data && data.data.id) {
          onValueChange(data.data.id);
        }
        
        // Reset form and close modal
        setNewSupplier({ name: "", address: "", email: "", phone: "" });
        setIsModalOpen(false);
      } else {
        toast({
          title: "Erreur",
          description: data.message || "Erreur lors de la création du fournisseur",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating supplier:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la création du fournisseur",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValueChange = (selectedValue: string) => {
    if (selectedValue === "none") {
      onValueChange(undefined);
    } else {
      onValueChange(parseInt(selectedValue));
    }
  };

  const getDisplayValue = () => {
    if (value === undefined) return "none";
    return value.toString();
  };

  const selectedSupplier = suppliers.find(s => s.id === value);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Select value={getDisplayValue()} onValueChange={handleValueChange}>
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground">Pas spécifié</span>
              </SelectItem>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id.toString()}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{supplier.name}</span>
                    {supplier.materials_count !== undefined && supplier.materials_count > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({supplier.materials_count} matériaux)
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nouveau fournisseur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  placeholder="Nom du fournisseur"
                />
              </div>
              
              <div>
                <Label htmlFor="address">Adresse</Label>
                <Textarea
                  id="address"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  placeholder="Adresse complète"
                  className="resize-none"
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  placeholder="+216 XX XXX XXX"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleCreateSupplier}
                  disabled={isSubmitting || !newSupplier.name.trim()}
                >
                  {isSubmitting ? "Création..." : "Créer"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Show selected supplier details */}
      {selectedSupplier && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          <div className="font-medium">{selectedSupplier.name}</div>
          {selectedSupplier.email && (
            <div>Email: {selectedSupplier.email}</div>
          )}
          {selectedSupplier.phone && (
            <div>Tél: {selectedSupplier.phone}</div>
          )}
          {selectedSupplier.address && (
            <div>Adresse: {selectedSupplier.address}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SupplierSelector;