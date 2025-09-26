import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, Camera, Trash2, Eye, Plus } from "lucide-react";
import ImageCapture from "@/components/ImageCapture";

interface BatchImage {
  id?: number;
  image_id?: number;
  batch_id?: number;
  image_path?: string;
  file_path?: string;
  original_filename?: string;
  file_size?: number;
  full_url: string;
  description?: string;
  upload_date?: string;
  created_at?: string;
  uploaded_by?: string;
}

interface BatchImageUploadProps {
  batchId: number;
  images: BatchImage[];
  productImages?: string[];
  soustraitanceProductImages?: string[];
  onImagesUpdate: () => void;
}

const BatchImageUpload = ({ batchId, images, productImages = [], soustraitanceProductImages = [], onImagesUpdate }: BatchImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [selectedImageData, setSelectedImageData] = useState<any>(null);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);
  const { toast } = useToast();

  const handleImageUpload = async () => {
    if (!selectedImage) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une image",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('batch_id', batchId.toString());
      formData.append('description', description);
      formData.append('uploaded_by', '1'); // TODO: Get from auth context

      const response = await fetch('https://luccibyey.com.tn/production/api/batch_images.php', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Succès",
          description: "Image ajoutée avec succès",
        });
        
        // Reset form
        setSelectedImage(null);
        setImagePreview(null);
        setDescription('');
        setShowUploadDialog(false);
        
        // Refresh images list
        onImagesUpdate();
      } else {
        throw new Error(result.message || 'Erreur lors de l\'upload');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout de l'image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/batch_images.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_id: imageId }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Succès",
          description: "Image supprimée avec succès",
        });
        onImagesUpdate();
      } else {
        throw new Error(result.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de l'image",
        variant: "destructive",
      });
    } finally {
      setImageToDelete(null);
    }
  };

  const viewImage = (imageUrl: string, imageData?: any) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageData(imageData);
    setShowImageDialog(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Image Production</CardTitle>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter Image
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Ajouter une Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <ImageCapture
                onImageSelect={(file) => {
                  setSelectedImage(file);
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    setImagePreview(e.target?.result as string);
                  };
                  reader.readAsDataURL(file);
                }}
                currentImage={imagePreview}
                onRemoveImage={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                maxSize={5}
              />
              
              <div>
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  placeholder="Description de l'image..."
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
                  onClick={handleImageUpload} 
                  disabled={!selectedImage || isUploading}
                >
                  {isUploading ? 'Upload...' : 'Ajouter'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {productImages.length === 0 && soustraitanceProductImages.length === 0 && images.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Aucune image ajoutée</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto pr-2">
            <div className="space-y-6">
              {/* Product Images Section */}
              {productImages.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">Images Produit</Badge>
                    <span className="text-xs text-muted-foreground">({productImages.length})</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {productImages.map((imageUrl, index) => (
                      <div key={`product-${index}`} className="relative group">
                        <div className="aspect-[16/10] rounded-lg overflow-hidden bg-gray-100 border shadow-sm hover:shadow-md transition-shadow">
                          <img
                            src={imageUrl}
                            alt={`Image produit ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-image.png';
                            }}
                          />
                          
                          {/* Product image badge */}
                          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                            Produit
                          </div>
                        </div>
                        
                        {/* Action button overlay - only view for product images */}
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            size="default"
                            variant="secondary"
                            onClick={() => viewImage(imageUrl)}
                            className="bg-white text-black hover:bg-gray-100"
                          >
                            <Eye className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Soustraitance Product Images Section */}
              {soustraitanceProductImages.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="default" className="text-xs bg-orange-500 hover:bg-orange-600">Images Sous-traitance</Badge>
                    <span className="text-xs text-muted-foreground">({soustraitanceProductImages.length})</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {soustraitanceProductImages.map((imageUrl, index) => (
                      <div key={`soustraitance-${index}`} className="relative group">
                        <div className="aspect-[16/10] rounded-lg overflow-hidden bg-gray-100 border shadow-sm hover:shadow-md transition-shadow">
                          <img
                            src={imageUrl}
                            alt={`Image sous-traitance ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-image.png';
                            }}
                          />
                          
                          {/* Soustraitance product image badge */}
                          <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                            Sous-traitance
                          </div>
                        </div>
                        
                        {/* Action button overlay - only view for soustraitance product images */}
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            size="default"
                            variant="secondary"
                            onClick={() => viewImage(imageUrl)}
                            className="bg-white text-black hover:bg-gray-100"
                          >
                            <Eye className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Batch Images Section */}
              {images.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">Images Batch</Badge>
                    <span className="text-xs text-muted-foreground">({images.length})</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {images.map((image) => (
                <div key={image.id || image.image_id} className="relative group">
                   <div className="aspect-[16/10] rounded-lg overflow-hidden bg-gray-100 border shadow-sm hover:shadow-md transition-shadow">
                     <img
                       src={image.full_url}
                       alt={image.description || image.original_filename || 'Image du batch'}
                       className="w-full h-full object-cover"
                       onError={(e) => {
                         const target = e.target as HTMLImageElement;
                         target.src = '/placeholder-image.png';
                         console.error('Failed to load image:', {
                           full_url: image.full_url,
                           file_path: image.file_path || image.image_path,
                           original_filename: image.original_filename,
                           image_data: image
                         });
                       }}
                       onLoad={() => {
                         console.log('✅ Image loaded successfully:', image.full_url);
                       }}
                     />
                     
                      {/* Batch image badge */}
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                        Batch
                      </div>
                   </div>
                  
                  {/* Action buttons overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                     <Button
                       size="default"
                       variant="secondary"
                       onClick={() => viewImage(image.full_url, image)}
                       className="bg-white text-black hover:bg-gray-100"
                     >
                       <Eye className="h-5 w-5" />
                     </Button>
                     <Button
                       size="default"
                       variant="destructive"
                       onClick={() => setImageToDelete(image.id || image.image_id)}
                     >
                       <Trash2 className="h-5 w-5" />
                     </Button>
                  </div>
                  
                   {/* Image info overlay */}
                   <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3">
                     {image.description && (
                       <p className="text-white text-xs opacity-90 line-clamp-2">
                         {image.description}
                       </p>
                     )}
                     {image.file_size && (
                       <p className="text-white text-xs opacity-75 mt-1">
                         {Math.round(image.file_size / 1024)} KB
                       </p>
                     )}
                   </div>
                    </div>
                  ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Image viewer dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedImageData?.original_filename ? 
                `Aperçu - ${selectedImageData.original_filename}` : 
                "Aperçu Image"
              }
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src={selectedImageUrl}
              alt="Aperçu"
              className="max-w-full max-h-[70vh] object-contain"
            />
          </div>
          {selectedImageData?.description && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Description:</strong> {selectedImageData.description}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!imageToDelete} onOpenChange={() => setImageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette image ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => imageToDelete && handleDeleteImage(imageToDelete)}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default BatchImageUpload;