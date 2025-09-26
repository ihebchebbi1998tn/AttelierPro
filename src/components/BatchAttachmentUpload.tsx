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

interface BatchAttachment {
  id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  full_url: string;
  file_type: string;
  file_size: number;
  description?: string;
  created_date: string;
}

interface BatchAttachmentUploadProps {
  batchId: number;
  attachments: BatchAttachment[];
  onAttachmentsUpdate: () => void;
}

const BatchAttachmentUpload = ({ batchId, attachments, onAttachmentsUpdate }: BatchAttachmentUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
      formData.append('batch_id', batchId.toString());
      formData.append('description', description);
      formData.append('uploaded_by', '1'); // TODO: Get from auth context

      const response = await fetch('https://luccibyey.com.tn/production/api/batch_attachments.php', {
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
        
        // Refresh attachments list
        onAttachmentsUpdate();
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

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/batch_attachments.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: attachmentId }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Succès",
          description: "Fichier supprimé avec succès",
        });
        onAttachmentsUpdate();
      } else {
        throw new Error(result.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du fichier",
        variant: "destructive",
      });
    } finally {
      setAttachmentToDelete(null);
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
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('document') || type.includes('word')) return '📝';
    if (type.includes('spreadsheet') || type.includes('excel')) return '📊';
    if (type.includes('video')) return '🎥';
    if (type.includes('audio')) return '🎵';
    return '📎';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Pièces Jointes</CardTitle>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter Fichier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Ajouter une Pièce Jointe</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">Fichier (Max 10MB)</Label>
                <Input
                  id="file"
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Fichier sélectionné: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  placeholder="Description du fichier..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end gap-2">
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
                >
                  {isUploading ? 'Upload...' : 'Ajouter'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {attachments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Paperclip className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Aucune pièce jointe ajoutée</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto pr-2">
            <div className="space-y-2">
              {attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getFileIcon(attachment.file_type)}</span>
                  <div>
                    <p className="font-medium text-sm">{attachment.original_filename}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(attachment.file_size)} • {attachment.file_type}
                    </p>
                    {attachment.description && (
                      <p className="text-xs text-gray-600 mt-1">{attachment.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(attachment.full_url, '_blank')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setAttachmentToDelete(attachment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!attachmentToDelete} onOpenChange={() => setAttachmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce fichier ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => attachmentToDelete && handleDeleteAttachment(attachmentToDelete)}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default BatchAttachmentUpload;