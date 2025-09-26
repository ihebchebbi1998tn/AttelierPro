import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, X, RotateCcw, Check } from "lucide-react";
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';

interface ImageCaptureProps {
  onImageSelect: (file: File) => void;
  currentImage?: string;
  onRemoveImage: () => void;
  maxSize?: number; // in MB
  className?: string;
}

const ImageCapture = ({ 
  onImageSelect, 
  currentImage, 
  onRemoveImage, 
  maxSize = 5,
  className = "" 
}: ImageCaptureProps) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    try {
      setIsCapturing(true);
      
      // Try to use Capacitor Camera first (native mobile)
      try {
        const image = await CapacitorCamera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
        });

        if (image.dataUrl) {
          // Convert data URL to blob and then to File
          const response = await fetch(image.dataUrl);
          const blob = await response.blob();
          const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
            type: 'image/jpeg'
          });

          // Check file size
          if (file.size > maxSize * 1024 * 1024) {
            toast({
              title: "Fichier trop volumineux",
              description: `L'image doit faire moins de ${maxSize}MB`,
              variant: "destructive",
            });
            return;
          }

          onImageSelect(file);
          
          toast({
            title: "Photo capturée",
            description: "La photo a été ajoutée avec succès",
          });
          return;
        }
      } catch (capacitorError) {
        console.log('Capacitor camera not available, falling back to web API');
      }
      
      // Fallback to web API
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Prefer back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      setIsCameraOpen(true);
      
      // Set video stream
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Erreur caméra",
        description: "Impossible d'accéder à la caméra. Vérifiez les permissions.",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  }, [toast, maxSize, onImageSelect]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
    setCapturedImage(null);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob and create preview
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setCapturedImage(url);
      }
    }, 'image/jpeg', 0.8);
  }, []);

  const confirmCapture = useCallback(() => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        
        // Check file size
        if (file.size > maxSize * 1024 * 1024) {
          toast({
            title: "Fichier trop volumineux",
            description: `L'image doit faire moins de ${maxSize}MB`,
            variant: "destructive",
          });
          return;
        }
        
        onImageSelect(file);
        stopCamera();
        
        toast({
          title: "Photo capturée",
          description: "La photo a été ajoutée avec succès",
        });
      }
    }, 'image/jpeg', 0.8);
  }, [maxSize, onImageSelect, stopCamera, toast]);

  const handleGallerySelect = useCallback(async () => {
    try {
      // Try Capacitor Photos first (native mobile)
      try {
        const image = await CapacitorCamera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos,
        });

        if (image.dataUrl) {
          // Convert data URL to blob and then to File
          const response = await fetch(image.dataUrl);
          const blob = await response.blob();
          const file = new File([blob], `gallery-image-${Date.now()}.jpg`, {
            type: 'image/jpeg'
          });

          // Check file size
          if (file.size > maxSize * 1024 * 1024) {
            toast({
              title: "Fichier trop volumineux",
              description: `L'image doit faire moins de ${maxSize}MB`,
              variant: "destructive",
            });
            return;
          }

          onImageSelect(file);
          
          toast({
            title: "Image sélectionnée",
            description: "L'image a été ajoutée avec succès",
          });
          return;
        }
      } catch (capacitorError) {
        console.log('Capacitor photos not available, falling back to file input');
        // Trigger file input click
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      }
    } catch (error) {
      console.error('Error accessing gallery:', error);
      toast({
        title: "Erreur galerie",
        description: "Impossible d'accéder à la galerie.",
        variant: "destructive",
      });
    }
  }, [maxSize, onImageSelect, toast]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Format invalide",
        description: "Veuillez sélectionner une image (JPG, PNG, WEBP)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: `L'image doit faire moins de ${maxSize}MB`,
        variant: "destructive",
      });
      return;
    }

    onImageSelect(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
  };

  // Check if camera is available
  const isCameraAvailable = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;

  return (
    <div className={className}>
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Image du matériau
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center space-y-4">
            {/* Image Preview */}
            <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted border-2 border-dashed border-muted-foreground/25">
              {currentImage ? (
                <img 
                  src={currentImage} 
                  alt="Aperçu du matériau"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              {/* Camera Button */}
              {isCameraAvailable && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={startCamera}
                  disabled={isCapturing}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {isCapturing ? "Ouverture..." : "Prendre une photo"}
                </Button>
              )}
              
              {/* Gallery Button */}
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleGallerySelect}
              >
                <Upload className="mr-2 h-4 w-4" />
                Galerie
              </Button>
              
              {/* Remove Button */}
              {currentImage && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRemoveImage}
                >
                  <X className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              {isCameraAvailable ? "Prenez une photo ou " : ""}Choisissez une image
              <br />
              Formats: JPG, PNG, WEBP • Max: {maxSize}MB
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input for web fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Camera Modal */}
      <Dialog open={isCameraOpen} onOpenChange={() => stopCamera()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Prendre une photo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {capturedImage ? (
              // Preview captured image
              <div className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  <img 
                    src={capturedImage} 
                    alt="Photo capturée"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={retakePhoto}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reprendre
                  </Button>
                  <Button onClick={confirmCapture}>
                    <Check className="mr-2 h-4 w-4" />
                    Utiliser cette photo
                  </Button>
                </div>
              </div>
            ) : (
              // Camera view
              <div className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex justify-center">
                  <Button onClick={capturePhoto} size="lg">
                    <Camera className="mr-2 h-4 w-4" />
                    Capturer
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Hidden canvas for image processing */}
          <canvas ref={canvasRef} className="hidden" />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageCapture;