import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Trash2, Download, Plus, Paperclip } from "lucide-react";

interface SoustraitanceProductFile {
  file_id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  full_url: string;
  file_type: string;
  file_size: number;
  description?: string;
  upload_date: string;
}

interface SoustraitanceProductFilesUploadProps {
  productId: number;
  files: SoustraitanceProductFile[];
  onFilesUpdate: () => void;
}

const SoustraitanceProductFilesUpload = ({ productId, files, onFilesUpdate }: SoustraitanceProductFilesUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<number | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [selectedImageName, setSelectedImageName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (PNG, JPG, PDF only)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Type de fichier non autorisé",
        description: "Seuls les fichiers PNG, JPG et PDF sont autorisés",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "Le fichier doit faire moins de 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('product_id', productId.toString());
      formData.append('description', description);
      formData.append('uploaded_user', '1'); // TODO: Get from auth context

      const response = await fetch('https://luccibyey.com.tn/production/api/soustraitance_product_files.php', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Succès",
          description: "Fichier ajouté avec succès",
        });
        
        // Reset form
        setSelectedFile(null);
        setDescription('');
        setShowUploadDialog(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Refresh files list
        onFilesUpdate();
      } else {
        throw new Error(result.message || 'Erreur lors de l\'upload');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout du fichier",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/soustraitance_product_files.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_id: fileId }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Succès",
          description: "Fichier supprimé avec succès",
        });
        onFilesUpdate();
      } else {
        throw new Error(result.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du fichier",
        variant: "destructive",
      });
    } finally {
      setFileToDelete(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return '📄';
    return '📎';
  };

  const isImageFile = (fileType: string, filename: string) => {
    const type = fileType.toLowerCase();
    const ext = filename.toLowerCase();
    return type.includes('image') || ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg');
  };

  const getCorrectFileUrl = (file: SoustraitanceProductFile) => {
    // Use the full_url directly from API response  
    console.log('File URL requested:', file.full_url, 'for file:', file.original_filename);
    return file.full_url;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Fichiers Produit</CardTitle>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter Fichier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Ajouter un Fichier
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="file" className="text-sm font-medium">
                  Fichier (PNG, JPG, PDF - Max 10MB)
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                  <Input
                    id="file"
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                  {selectedFile ? (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {isImageFile(selectedFile.type, selectedFile.name) ? '🖼️' : getFileIcon(selectedFile.type)}
                        </span>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 mt-4">
                      <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Cliquez pour sélectionner un fichier</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  placeholder="Ajoutez une description pour ce fichier..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setShowUploadDialog(false)}
                  disabled={isUploading}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleFileUpload} 
                  disabled={!selectedFile || isUploading}
                  className="min-w-[100px]"
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                      Upload...
                    </div>
                  ) : (
                    'Ajouter'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Paperclip className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Aucun fichier ajouté</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto pr-2">
            <div className="space-y-3">
              {files.map((file) => (
              <div key={file.file_id} className="border rounded-lg hover:bg-gray-50/50 transition-colors">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {isImageFile(file.file_type, file.original_filename) ? (
                        <div className="flex-shrink-0">
                          <img 
                            src={getCorrectFileUrl(file)} 
                            alt={file.original_filename}
                            className="w-16 h-16 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              setSelectedImageUrl(getCorrectFileUrl(file));
                              setSelectedImageName(file.original_filename);
                              setShowImageModal(true);
                            }}
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+CjxjaXJjbGUgY3g9IjI2IiBjeT0iMjYiIHI9IjIiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTIwIDM2TDI2IDMwTDMwIDM0TDM4IDI2TDQ0IDMyVjQ0SDIwVjM2WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-3xl">{getFileIcon(file.file_type)}</span>
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{file.original_filename}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatFileSize(file.file_size)} • {file.file_type.toUpperCase()}
                        </p>
                        {file.description && (
                          <p className="text-xs text-gray-600 mt-2 line-clamp-2">{file.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(getCorrectFileUrl(file), '_blank')}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setFileToDelete(file.file_id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!fileToDelete} onOpenChange={() => setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce fichier ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => fileToDelete && handleDeleteFile(fileToDelete)}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Preview Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="truncate">{selectedImageName}</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            <div className="relative w-full">
              <img 
                src={selectedImageUrl} 
                alt={selectedImageName}
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjggMTI4SDM4NFYzODRIMTI4VjEyOFoiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSI4IiBmaWxsPSJub25lIi8+CjxjaXJjbGUgY3g9IjE5MiIgY3k9IjE5MiIgcj0iMTYiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTEyOCAyODhMMTkyIDIyNEwyNTYgMjg4TDMyMCAyMjRMMzg0IDI4OFYzODRIMTI4VjI4OFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg==';
                }}
              />
            </div>
            <div className="mt-4 flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => window.open(selectedImageUrl, '_blank')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Télécharger
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowImageModal(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SoustraitanceProductFilesUpload;