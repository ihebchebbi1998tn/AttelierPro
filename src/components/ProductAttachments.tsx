import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, Image, FileText, Download, Trash2, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Attachment {
  id: number;
  product_id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  description: string;
  uploaded_by: string;
  created_date: string;
}

interface ProductAttachmentsProps {
  productId: string;
}

const ProductAttachments: React.FC<ProductAttachmentsProps> = ({ productId }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAttachments();
  }, [productId]);

  const loadAttachments = async () => {
    try {
      const response = await fetch(`https://luccibyey.com.tn/production/api/product_attachments.php?product_id=${productId}`);
      const data = await response.json();
      
      if (data.success) {
        setAttachments(data.data);
      }
    } catch (error) {
      console.error('Error loading attachments:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des pièces jointes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "La taille du fichier ne doit pas dépasser 10MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Erreur",
        description: "Type de fichier non supporté. Utilisez: Images, PDF, DOC, DOCX, TXT",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('product_id', productId);
    formData.append('description', description);
    formData.append('uploaded_by', 'user'); // You can get this from auth context

    try {
      const response = await fetch(`https://luccibyey.com.tn/production/api/product_attachments.php`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Succès",
          description: "Fichier téléchargé avec succès",
        });
        setSelectedFile(null);
        setDescription('');
        setIsUploadDialogOpen(false);
        loadAttachments();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors du téléchargement du fichier",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return;

    try {
      const response = await fetch(`https://luccibyey.com.tn/production/api/product_attachments.php`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: attachmentId }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Succès",
          description: "Fichier supprimé avec succès",
        });
        loadAttachments();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du fichier",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (mimeType === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileUrl = (filePath: string) => {
    return `https://luccibyey.com.tn/production/api/${filePath}`;
  };

  const handlePreview = (attachment: Attachment) => {
    const index = attachments.findIndex(a => a.id === attachment.id);
    setCurrentAttachmentIndex(index);
    setPreviewAttachment(attachment);
  };

  const navigateAttachment = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? (currentAttachmentIndex - 1 + attachments.length) % attachments.length
      : (currentAttachmentIndex + 1) % attachments.length;
    
    setCurrentAttachmentIndex(newIndex);
    setPreviewAttachment(attachments[newIndex]);
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');
  const isPDF = (mimeType: string) => mimeType === 'application/pdf';
  const isDocument = (mimeType: string) => 
    mimeType.includes('document') || 
    mimeType.includes('word') || 
    mimeType.includes('pdf') ||
    mimeType.includes('text');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pièces jointes techniques</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <CardTitle className="text-lg sm:text-xl">Pièces jointes techniques</CardTitle>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Upload className="h-4 w-4 mr-2" />
                Ajouter un fichier
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-4 sm:mx-0 max-w-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Ajouter un fichier technique</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Drag and Drop Upload Area */}
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
                    isDragOver 
                      ? 'border-primary bg-primary/5 scale-[1.02]' 
                      : selectedFile 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    className="hidden"
                  />
                  
                  {selectedFile ? (
                    <div className="space-y-3">
                      <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        {getFileIcon(selectedFile.type)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-700">{selectedFile.name}</p>
                        <p className="text-xs text-green-600">{formatFileSize(selectedFile.size)}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="text-xs"
                      >
                        Changer le fichier
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 bg-accent rounded-full flex items-center justify-center">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          {isDragOver ? 'Déposez votre fichier ici' : 'Glissez-déposez votre fichier ou cliquez pour parcourir'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Formats acceptés: Images (JPG, PNG, GIF, WEBP), PDF, Documents Word, TXT
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Taille maximale: 10MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description Input */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description du fichier
                  </Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez le contenu ou l'usage de ce fichier..."
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optionnel - Ajoutez une description pour faciliter l'identification du fichier
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedFile(null);
                      setDescription('');
                      setIsUploadDialogOpen(false);
                    }}
                    className="flex-1"
                    disabled={uploading}
                  >
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleUpload} 
                    disabled={!selectedFile || uploading}
                    className="flex-1"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                        Téléchargement...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Télécharger
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-6">
          {attachments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucun fichier téléchargé pour ce produit
            </p>
          ) : (
            <div className="w-full overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-full">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="group bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 w-full">
                    {/* Thumbnail/Preview Area */}
                    <div 
                      className="relative overflow-hidden cursor-pointer group"
                      onClick={() => handlePreview(attachment)}
                    >
                      {isImage(attachment.mime_type) ? (
                        <AspectRatio ratio={16 / 10} className="bg-muted">
                          <img
                            src={getFileUrl(attachment.file_path)}
                            alt={attachment.original_filename}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm rounded-full p-2">
                              <Eye className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                        </AspectRatio>
                      ) : (
                        <AspectRatio ratio={16 / 10} className="bg-gradient-to-br from-muted via-muted/80 to-muted/60 flex items-center justify-center group-hover:from-primary/5 group-hover:to-primary/10 transition-colors duration-300">
                          <div className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                              {React.cloneElement(getFileIcon(attachment.mime_type), { 
                                className: "h-8 w-8 text-primary"
                              })}
                            </div>
                            <div className="space-y-2">
                              {isPDF(attachment.mime_type) ? (
                                <Badge variant="secondary" className="text-sm bg-red-50 text-red-700 border-red-200 px-3 py-1">
                                  Cliquer pour ouvrir
                                </Badge>
                              ) : isDocument(attachment.mime_type) ? (
                                <Badge variant="secondary" className="text-sm bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
                                  Cliquer pour ouvrir
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-sm px-3 py-1">
                                  Cliquer pour ouvrir
                                </Badge>
                              )}
                            </div>
                          </div>
                        </AspectRatio>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-base leading-tight flex-1 mr-4 truncate">
                          {attachment.original_filename}
                        </h4>
                        
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = getFileUrl(attachment.file_path);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = attachment.original_filename;
                              a.click();
                            }}
                            className="h-9 w-9 p-0 hover:bg-primary/15 hover:text-primary transition-all duration-200 rounded-lg"
                            title="Télécharger"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(attachment.id);
                            }}
                            className="h-9 w-9 p-0 hover:bg-destructive/15 hover:text-destructive transition-all duration-200 rounded-lg"
                            title="Supprimer"
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
      </Card>

      {/* File Preview Modal */}
      {previewAttachment && (
        <Dialog open={!!previewAttachment} onOpenChange={() => setPreviewAttachment(null)}>
          <DialogContent className="mx-4 sm:mx-0 max-w-6xl max-h-[95vh] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader className="p-4 pb-2 border-b">
              <DialogTitle className="flex items-center justify-between text-sm sm:text-base">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getFileIcon(previewAttachment.mime_type)}
                  <span className="truncate">{previewAttachment.original_filename}</span>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {previewAttachment.file_type.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  {attachments.length > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateAttachment('prev')}
                        className="h-8 w-8 p-0"
                        title="Fichier précédent"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {currentAttachmentIndex + 1} / {attachments.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateAttachment('next')}
                        className="h-8 w-8 p-0"
                        title="Fichier suivant"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewAttachment(null)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden">
              {isImage(previewAttachment.mime_type) ? (
                <div className="flex justify-center items-center p-4 h-full min-h-[60vh]">
                  <img
                    src={getFileUrl(previewAttachment.file_path)}
                    alt={previewAttachment.original_filename}
                    className="max-w-full max-h-full object-contain rounded-md"
                  />
                </div>
              ) : isPDF(previewAttachment.mime_type) || isDocument(previewAttachment.mime_type) ? (
                <div className="h-[70vh] w-full">
                  <iframe
                    src={`${getFileUrl(previewAttachment.file_path)}#toolbar=1&navpanes=1&scrollbar=1`}
                    className="w-full h-full border-0"
                    title={previewAttachment.original_filename}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 h-[60vh] text-center">
                  {getFileIcon(previewAttachment.mime_type)}
                  <h3 className="mt-4 text-lg font-medium">Aperçu non disponible</h3>
                  <p className="text-muted-foreground mt-2">
                    Ce type de fichier ne peut pas être prévisualisé dans le navigateur.
                  </p>
                  <Button
                    onClick={() => {
                      const url = getFileUrl(previewAttachment.file_path);
                      window.open(url, '_blank');
                    }}
                    className="mt-4"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger le fichier
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ProductAttachments;