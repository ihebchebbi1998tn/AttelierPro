import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Download, 
  Upload,
  Trash2,
  UserCheck,
  UserX,
  Loader2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Employee, employeeService } from "@/utils/rhService";
import * as XLSX from 'xlsx';

interface BulkEmployeeActionsProps {
  selectedEmployees: Employee[];
  onSelectionChange: (employees: Employee[]) => void;
  onRefresh: () => void;
}

const BulkEmployeeActions: React.FC<BulkEmployeeActionsProps> = ({
  selectedEmployees,
  onSelectionChange,
  onRefresh
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'delete' | ''>('');
  const { toast } = useToast();

  const exportToExcel = async () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: "Aucune sélection",
        description: "Veuillez sélectionner des employés à exporter",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsExporting(true);
      
      const exportData = selectedEmployees.map(emp => ({
        'Nom': emp.nom,
        'Prénom': emp.prenom,
        'Téléphone': emp.telephone || '',
        'Adresse': emp.adresse || '',
        'Région': emp.region || '',
        'Statut Civil': emp.statut_civil,
        'Actif': emp.actif ? 'Oui' : 'Non',
        'Date de création': new Date(emp.created_at).toLocaleDateString('fr-FR')
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const wscols = [
        { wch: 15 }, // Nom
        { wch: 15 }, // Prénom
        { wch: 12 }, // Téléphone
        { wch: 30 }, // Adresse
        { wch: 12 }, // Région
        { wch: 12 }, // Statut Civil
        { wch: 8 },  // Actif
        { wch: 12 }  // Date de création
      ];
      ws['!cols'] = wscols;

      XLSX.utils.book_append_sheet(wb, ws, 'Employés');
      XLSX.writeFile(wb, `employes_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: "Export réussi",
        description: `${selectedEmployees.length} employés exportés avec succès`
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleBulkAction = async () => {
    if (selectedEmployees.length === 0 || !bulkAction) return;

    try {
      setIsBulkUpdating(true);
      const promises = selectedEmployees.map(async (employee) => {
        switch (bulkAction) {
          case 'activate':
            return employeeService.update(employee.id, { actif: true });
          case 'deactivate':
            return employeeService.update(employee.id, { actif: false });
          case 'delete':
            return employeeService.delete(employee.id);
          default:
            return Promise.resolve({ success: false });
        }
      });

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.success).length;

      if (successCount > 0) {
        toast({
          title: "Action réussie",
          description: `${successCount} employé(s) traité(s) avec succès`
        });
        onSelectionChange([]);
        onRefresh();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'action en lot",
        variant: "destructive"
      });
    } finally {
      setIsBulkUpdating(false);
      setBulkAction('');
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          let successCount = 0;
          let errorCount = 0;

          for (const row of jsonData as any[]) {
            try {
              const employeeData = {
                nom: row['Nom'] || '',
                prenom: row['Prénom'] || '',
                telephone: row['Téléphone'] || '',
                adresse: row['Adresse'] || '',
                region: row['Région'] || '',
                statut_civil: row['Statut Civil'] || 'autre',
                actif: row['Actif'] === 'Oui' || row['Actif'] === true
              };

              if (employeeData.nom && employeeData.prenom) {
                const result = await employeeService.create(employeeData);
                if (result.success) {
                  successCount++;
                } else {
                  errorCount++;
                }
              } else {
                errorCount++;
              }
            } catch {
              errorCount++;
            }
          }

          toast({
            title: "Import terminé",
            description: `${successCount} employé(s) importé(s), ${errorCount} erreur(s)`
          });

          if (successCount > 0) {
            onRefresh();
          }
        } catch (error) {
          toast({
            title: "Erreur d'import",
            description: "Format de fichier invalide",
            variant: "destructive"
          });
        } finally {
          setIsImporting(false);
        }
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de lire le fichier",
        variant: "destructive"
      });
      setIsImporting(false);
    }

    // Reset input
    event.target.value = '';
  };

  return (
    <div className="flex items-center space-x-2 flex-wrap gap-2">
      {selectedEmployees.length > 0 && (
        <Badge variant="secondary" className="text-sm">
          <Users className="h-3 w-3 mr-1" />
          {selectedEmployees.length} sélectionné(s)
        </Badge>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={exportToExcel}
        disabled={isExporting || selectedEmployees.length === 0}
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        Exporter
      </Button>

      <Dialog open={isImporting} onOpenChange={setIsImporting}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importer des employés</DialogTitle>
            <DialogDescription>
              Sélectionnez un fichier Excel (.xlsx) contenant les données des employés.
              Colonnes requises: Nom, Prénom. Optionnelles: Téléphone, Adresse, Région, Statut Civil, Actif
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="import-file" className="text-sm font-medium">
              Fichier Excel
            </Label>
            <Input
              id="import-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileImport}
              className="mt-2"
            />
          </div>
        </DialogContent>
      </Dialog>

      {selectedEmployees.length > 0 && (
        <div className="flex items-center space-x-2">
          <Select value={bulkAction} onValueChange={(value) => setBulkAction(value as any)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Action en lot" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activate">
                <div className="flex items-center">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Activer
                </div>
              </SelectItem>
              <SelectItem value="deactivate">
                <div className="flex items-center">
                  <UserX className="h-4 w-4 mr-2" />
                  Désactiver
                </div>
              </SelectItem>
              <SelectItem value="delete">
                <div className="flex items-center">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {bulkAction && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant={bulkAction === 'delete' ? 'destructive' : 'default'} 
                  size="sm"
                  disabled={isBulkUpdating}
                >
                  {isBulkUpdating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    "Appliquer"
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer l'action en lot</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir {
                      bulkAction === 'activate' ? 'activer' :
                      bulkAction === 'deactivate' ? 'désactiver' : 'supprimer'
                    } {selectedEmployees.length} employé(s) ?
                    {bulkAction === 'delete' && " Cette action est irréversible."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkAction}>
                    Confirmer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkEmployeeActions;