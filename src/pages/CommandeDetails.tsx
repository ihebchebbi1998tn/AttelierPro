import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Package, 
  Image as ImageIcon, 
  MessageSquare,
  Edit,
  Save,
  X,
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Edit3,
  Check,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  fetchSurMesureOrders, 
  addSurMesureComment, 
  updateSurMesureOrderStatus, 
  uploadSurMesureImage, 
  uploadSurMesureVideoChunked, 
  updateSurMesureOrderComplete, 
  getSurMesureMediaUrl, 
  deleteSurMesureMedia,
  getOptionsFinitions,
  createOptionFinition,
  updateOptionFinition,
  deleteOptionFinition,
  uploadOptionFinitionImage,
  OptionFinition,
  getSurMesureMaterials,
  markSurMesureOrderAsSeen
} from '@/utils/surMesureService';
import { SurMesureOrder } from './Commandes';
import { DynamicTriesSection } from '@/components/admin/DynamicTriesSection';
import { SurMesureMaterials } from '@/components/SurMesureMaterials';
import { SurMesureReportModal } from '@/components/admin/SurMesureReportModal';
import { measurementService } from '@/utils/measurementService';
import { useIsMobile } from '@/hooks/use-mobile';

const statusColors = {
  new: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  ready_for_pickup: 'bg-green-500',
  first_try: 'bg-purple-500',
  needs_revision: 'bg-orange-500',
  ready_for_second_try: 'bg-green-600',
  completed: 'bg-gray-500'
};

const statusLabels = {
  new: 'Nouveau',
  in_progress: 'En cours',
  ready_for_pickup: 'Prét pour magasin',
  first_try: 'Premier essai',
  needs_revision: 'Révision nécessaire',
  ready_for_second_try: 'Prêt 2ème essai',
  completed: 'Terminé'
};

const statusOptions = [
  { value: 'new', label: 'Nouveau' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'ready_for_pickup', label: 'Prét pour magasin' }
];


const CommandeDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [isEditing, setIsEditing] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingMeasurements, setEditingMeasurements] = useState(false);
  const [measurements, setMeasurements] = useState<Record<string, number>>({});
  const [tolerance, setTolerance] = useState<Record<string, number>>({});
  const [newMeasureName, setNewMeasureName] = useState('');
  const [newMeasureValue, setNewMeasureValue] = useState('');
  const [newMeasureTolerance, setNewMeasureTolerance] = useState('0.5');
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Editable fields state
  const [editableClientInfo, setEditableClientInfo] = useState({
    client_name: '',
    client_vorname: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    client_region: ''
  });
  const [editableProductInfo, setEditableProductInfo] = useState({
    product_name: '',
    ready_date: ''
  });
  
  // Options & Finitions state
  const [options, setOptions] = useState<OptionFinition[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [editingOption, setEditingOption] = useState<OptionFinition | null>(null);
  const [optionForm, setOptionForm] = useState({
    title: '',
    description: '',
    image_url: ''
  });
  const [uploadingOptionImage, setUploadingOptionImage] = useState(false);
  const [deleteOptionModal, setDeleteOptionModal] = useState<{ isOpen: boolean; optionId: number | null; optionTitle: string }>({
    isOpen: false,
    optionId: null,
    optionTitle: ''
  });

  const { data: orders = [], isLoading: ordersLoading, refetch } = useQuery({
    queryKey: ['surMesureOrders'],
    queryFn: fetchSurMesureOrders,
  });

  const order = orders.find((o: SurMesureOrder) => o.id.toString() === id);

  // Initialize measurements and tolerance when order is loaded
  React.useEffect(() => {
    if (order) {
      setMeasurements(order.measurements || {});
      setTolerance(order.tolerance || {});
      // Initialize editable fields
      setEditableClientInfo({
        client_name: order.client_name || '',
        client_vorname: order.client_vorname || '',
        client_email: order.client_email || '',
        client_phone: order.client_phone || '',
        client_address: order.client_address || '',
        client_region: order.client_region || ''
      });
      setEditableProductInfo({
        product_name: order.product_name || '',
        ready_date: order.ready_date || ''
      });
      
      // Mark order as seen when it's loaded
      if (order.is_seen === '0') {
        markSurMesureOrderAsSeen(order.id)
          .then(() => {
            // Refetch to update the order status
            queryClient.invalidateQueries({ queryKey: ['surMesureOrders'] });
          })
          .catch((error) => {
            console.error('Error marking order as seen:', error);
          });
      }
    }
  }, [order, queryClient]);


  // Load options when order is loaded
  React.useEffect(() => {
    if (order) {
      loadOptions();
    }
  }, [order]);

  const loadOptions = async () => {
    if (!order) return;
    
    setOptionsLoading(true);
    try {
      const optionsData = await getOptionsFinitions(order.id);
      setOptions(optionsData);
    } catch (error) {
      console.error('Error loading options:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des options",
        variant: "destructive"
      });
    } finally {
      setOptionsLoading(false);
    }
  };

  const handleCreateOption = async () => {
    if (!order || !optionForm.title.trim()) return;
    
    setIsLoading(true);
    try {
      await createOptionFinition({
        commande_id: order.id,
        title: optionForm.title.trim(),
        description: optionForm.description.trim()
      });
      
      toast({
        title: "Succès",
        description: "Option créée avec succès",
      });
      
      setOptionForm({ title: '', description: '', image_url: '' });
      setIsAddingOption(false);
      await loadOptions();
    } catch (error) {
      console.error('Error creating option:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de l'option",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOption = async () => {
    if (!editingOption || !optionForm.title.trim()) return;
    
    setIsLoading(true);
    try {
      await updateOptionFinition({
        id: editingOption.id,
        title: optionForm.title.trim(),
        description: optionForm.description.trim()
      });
      
      toast({
        title: "Succès",
        description: "Option modifiée avec succès",
      });
      
      setOptionForm({ title: '', description: '', image_url: '' });
      setEditingOption(null);
      await loadOptions();
    } catch (error) {
      console.error('Error updating option:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification de l'option",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOption = async (optionId: number) => {
    setIsLoading(true);
    try {
      await deleteOptionFinition(optionId);
      
      toast({
        title: "Succès",
        description: "Option supprimée avec succès",
      });
      
      setDeleteOptionModal({ isOpen: false, optionId: null, optionTitle: '' });
      await loadOptions();
    } catch (error) {
      console.error('Error deleting option:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de l'option",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startEditOption = (option: OptionFinition) => {
    setEditingOption(option);
    setOptionForm({
      title: option.title,
      description: option.description || '',
      image_url: option.image_url || ''
    });
    setIsAddingOption(false);
  };

  const cancelEditOption = () => {
    setEditingOption(null);
    setIsAddingOption(false);
    setOptionForm({ title: '', description: '', image_url: '' });
  };

  const openDeleteOptionModal = (option: OptionFinition) => {
    setDeleteOptionModal({
      isOpen: true,
      optionId: option.id,
      optionTitle: option.title
    });
  };

  const handleOptionImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, optionId: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingOptionImage(true);
    try {
      await uploadOptionFinitionImage(optionId, file);
      
      toast({
        title: "Succès",
        description: "Image de l'option téléchargée avec succès",
      });
      
      // Clear the input
      event.target.value = '';
      
      await loadOptions();
    } catch (error) {
      console.error('Error uploading option image:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du téléchargement de l'image",
        variant: "destructive"
      });
    } finally {
      setUploadingOptionImage(false);
    }
  };

  const handleStatusChange = async (selectedStatus: string) => {
    if (selectedStatus && selectedStatus !== order?.status) {
      // Validation: Can't set status back to "nouveau" if currently "en cours"
      if (order?.status === 'in_progress' && selectedStatus === 'new') {
        toast({
          title: "Action non autorisée",
          description: "Impossible de repasser le statut à 'Nouveau' depuis 'En cours'",
          variant: "destructive"
        });
        return;
      }

      // Validation: Can't set to "en cours" without materials configured
      if (selectedStatus === 'in_progress') {
        try {
          // Force refetch orders to ensure we have latest data
          await refetch();
          
          // Small delay to ensure database has committed the transaction
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Now check materials with fresh data
          const materials = await getSurMesureMaterials(order!.id);
          if (!materials || materials.length === 0) {
            toast({
              title: "Matières manquantes",
              description: "Vous devez configurer au moins une matière avant de passer le statut à 'En cours'",
              variant: "destructive"
            });
            return;
          }
        } catch (error) {
          console.error('Error checking materials:', error);
          toast({
            title: "Erreur",
            description: "Erreur lors de la vérification des matières",
            variant: "destructive"
          });
          return;
        }
      }

      setPendingStatus(selectedStatus);
      setShowStatusConfirmModal(true);
    }
  };

  const confirmStatusUpdate = async () => {
    if (!pendingStatus || !order) return;
    
    setIsLoading(true);
    try {
      await updateSurMesureOrderStatus(order.id, pendingStatus);
      
      // Deduct stock when status changes to "en cours" (in_progress)
      if (pendingStatus === 'in_progress') {
        try {
          const apiUrl = 'https://luccibyey.com.tn/production/api/stock_transactions.php';
          const requestPayload = {
            action: 'deduct_stock_sur_mesure',
            commande_id: order.id,
            user_id: 1 // TODO: Use actual user ID from auth
          };
          
          console.log('🚀 Calling stock deduction API:', apiUrl);
          console.log('📤 Request payload:', requestPayload);
          
          const stockResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestPayload)
          });
          
          console.log('📡 API Response status:', stockResponse.status, stockResponse.statusText);
          
          const stockData = await stockResponse.json();
          console.log('📥 API Response data:', stockData);
          
          if (stockData.success) {
            console.log('✅ Stock deduction successful!');
            console.log('📊 Transactions created:', stockData.transactions);
            
            if (stockData.transactions && stockData.transactions.length > 0) {
              stockData.transactions.forEach((transaction: any, index: number) => {
                console.log(`📋 Transaction ${index + 1}:`, {
                  material: transaction.material_name,
                  quantity_deducted: transaction.quantity_deducted,
                  new_stock: transaction.new_stock,
                  total_cost: transaction.total_cost
                });
              });
            }
            
            toast({
              title: "Stock mis à jour",
              description: `Stock déduit automatiquement pour ${stockData.transactions?.length || 0} matière(s)`,
            });
          } else {
            console.error('❌ Stock deduction failed:', stockData.message);
            toast({
              title: "Avertissement",
              description: `Statut mis à jour mais erreur de stock: ${stockData.message}`,
              variant: "destructive"
            });
          }
        } catch (stockError) {
          console.error('Error deducting stock:', stockError);
          toast({
            title: "Avertissement",
            description: "Statut mis à jour mais erreur lors de la déduction du stock",
            variant: "destructive"
          });
        }
        
        // Send status update notification
        try {
          const response = await fetch('https://luccibyey.com.tn/api/send_sur_mesure_status_update.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              order: {
                id: order.id.toString(),
                client_email: order.client_email || '',
                client_name: `${order.client_vorname || ''} ${order.client_name || ''}`.trim(),
                item_type: order.product_name || '',
                fabric_type: '', // Not available in the interface
                delivery_date: order.ready_date || ''
              },
              new_status: 'en cours',
              language: 'fr'
            })
          });
          
          if (response.ok) {
            console.log('Status update notification sent successfully');
          } else {
            console.warn('Failed to send status update notification');
          }
        } catch (notificationError) {
          console.error('Error sending status update notification:', notificationError);
          // Don't show error to user as this is a secondary operation
        }
      }
      
      toast({
        title: "Succès",
        description: "Statut mis à jour avec succès",
      });
      
      setShowStatusConfirmModal(false);
      setPendingStatus('');
      
      queryClient.invalidateQueries({ queryKey: ['surMesureOrders'] });
      // Force refetch to get updated stock and material information
      await refetch();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du statut",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || !order) return;
    
    setIsLoading(true);
    try {
      await updateSurMesureOrderStatus(order.id, newStatus);
      
      toast({
        title: "Succès",
        description: "Statut mis à jour avec succès",
      });
      
      setIsEditing(false);
      setNewStatus('');
      
      queryClient.invalidateQueries({ queryKey: ['surMesureOrders'] });
      refetch();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du statut",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !order) return;
    
    setIsLoading(true);
    try {
      await addSurMesureComment(order.id, newComment.trim(), 'Usine production');
      
      toast({
        title: "Succès",
        description: "Commentaire ajouté avec succès",
      });
      
      setNewComment('');
      
      queryClient.invalidateQueries({ queryKey: ['surMesureOrders'] });
      refetch();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout du commentaire",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !order) return;

    setUploadingImage(true);
    try {
      await uploadSurMesureImage(order.id, file);
      
      toast({
        title: "Succès",
        description: "Image téléchargée avec succès",
      });
      
      event.target.value = '';
      
      queryClient.invalidateQueries({ queryKey: ['surMesureOrders'] });
      refetch();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du téléchargement de l'image",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };


  const handleStartEditingMeasurements = () => {
    setEditingMeasurements(true);
  };

  const handleCancelEditingMeasurements = () => {
    setEditingMeasurements(false);
    if (order) {
      setMeasurements(order.measurements || {});
      setTolerance(order.tolerance || {});
    }
    setNewMeasureName('');
    setNewMeasureValue('');
    setNewMeasureTolerance('0.5');
  };

  const handleSaveClientAndProductInfo = async () => {
    if (!order) return;
    
    setIsLoading(true);
    try {
      const updatedOrderData = {
        id: order.id,
        client_info: {
          client_name: editableClientInfo.client_name,
          client_vorname: editableClientInfo.client_vorname,
          client_email: editableClientInfo.client_email,
          client_phone: editableClientInfo.client_phone,
          client_address: editableClientInfo.client_address,
          client_region: editableClientInfo.client_region,
        },
        product_name: editableProductInfo.product_name,
        ready_date: editableProductInfo.ready_date
      };

      await updateSurMesureOrderComplete(updatedOrderData);
      
      toast({
        title: "Succès",
        description: "Informations mises à jour avec succès",
      });
      
      setIsEditing(false);
      
      queryClient.invalidateQueries({ queryKey: ['surMesureOrders'] });
      refetch();
    } catch (error) {
      console.error('Error updating order info:', error);
      
      let errorMessage = "Erreur lors de la mise à jour des informations";
      
      if (error instanceof Error) {
        if (error.message.includes('email')) {
          errorMessage = "Erreur lors de la mise à jour de l'email";
        } else if (error.message.includes('validation')) {
          errorMessage = "Données invalides. Vérifiez les champs obligatoires.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Erreur de connexion. Vérifiez votre connexion internet.";
        }
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMeasurements = async () => {
    if (!order) return;
    
    setIsLoading(true);
    try {
      // Update measurements one by one since updateMeasurements doesn't exist
      for (const [name, value] of Object.entries(measurements)) {
        await measurementService.updateMeasurement(order.id, name, name, value, tolerance[name] || 0.5);
      }
      
      toast({
        title: "Succès",
        description: "Mesures mises à jour avec succès",
      });
      
      setEditingMeasurements(false);
      setNewMeasureName('');
      setNewMeasureValue('');
      setNewMeasureTolerance('0.5');
      
      queryClient.invalidateQueries({ queryKey: ['surMesureOrders'] });
      refetch();
    } catch (error) {
      console.error('Error updating measurements:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour des mesures",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMeasurementChange = (measureName: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setMeasurements(prev => ({
      ...prev,
      [measureName]: numValue
    }));
  };

  const handleToleranceChange = (measureName: string, value: string) => {
    const numValue = parseFloat(value) || 0.5;
    setTolerance(prev => ({
      ...prev,
      [measureName]: numValue
    }));
  };

  const handleAddNewMeasurement = () => {
    if (!newMeasureName.trim() || !newMeasureValue.trim()) return;
    
    const measureName = newMeasureName.trim();
    const measureValue = parseFloat(newMeasureValue) || 0;
    const toleranceValue = parseFloat(newMeasureTolerance) || 0.5;
    
    setMeasurements(prev => ({
      ...prev,
      [measureName]: measureValue
    }));
    
    setTolerance(prev => ({
      ...prev,
      [measureName]: toleranceValue
    }));
    
    setNewMeasureName('');
    setNewMeasureValue('');
    setNewMeasureTolerance('0.5');
  };

  const handleDeleteMeasurement = (measureName: string) => {
    setMeasurements(prev => {
      const newMeasurements = { ...prev };
      delete newMeasurements[measureName];
      return newMeasurements;
    });
    
    setTolerance(prev => {
      const newTolerance = { ...prev };
      delete newTolerance[measureName];
      return newTolerance;
    });
  };

  const handleDeleteMedia = async (mediaId: number, mediaType: 'image' | 'video') => {
    if (!order) return;
    
    setIsLoading(true);
    try {
      await deleteSurMesureMedia(mediaId, mediaType);
      
      toast({
        title: "Succès",
        description: `${mediaType === 'image' ? 'Image' : 'Vidéo'} supprimée avec succès`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['surMesureOrders'] });
      refetch();
    } catch (error) {
      console.error(`Error deleting ${mediaType}:`, error);
      toast({
        title: "Erreur",
        description: `Erreur lors de la suppression de ${mediaType === 'image' ? "l'image" : 'la vidéo'}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setImageModalOpen(true);
  };

  const handleNextImage = () => {
    if (order?.images && currentImageIndex < order.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const formatVideoUploadTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  if (ordersLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/commandes')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Commande sur mesure non trouvée</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto p-2 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => navigate('/commandes')}
              size={isMobile ? "sm" : "default"}
              className="flex-shrink-0"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              {isMobile ? "Retour" : "Retour aux commandes"}
            </Button>
            {!isMobile && (
              <Button 
                onClick={() => setShowReportModal(true)}
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
              >
                <FileText className="w-4 h-4 mr-2" />
                Rapport
              </Button>
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
              Commande #{order.id}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Créée le {format(new Date(order.created_at), isMobile ? "dd/MM/yyyy" : "PPP", { locale: fr })}
            </p>
          </div>
          {isMobile && (
            <Button 
              onClick={() => setShowReportModal(true)}
              variant="outline"
              size="sm"
              className="border-primary text-primary hover:bg-primary/10 w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              Générer le rapport
            </Button>
          )}
        </div>

        {/* Status Card */}
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <CardTitle className="text-sm sm:text-base md:text-lg font-semibold">
                {isMobile ? "Statut" : "Changer le statut"}
              </CardTitle>
              <Select onValueChange={handleStatusChange} value={order.status}>
                <SelectTrigger className="w-full sm:w-48 text-sm">
                  <SelectValue>
                    {statusLabels[order.status] || "Sélectionner un statut"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <Badge className={`${statusColors[order.status]} text-white text-xs px-2 py-1`}>
                {statusLabels[order.status]}
              </Badge>
              {!isMobile && (
                <span className="text-xs sm:text-sm text-muted-foreground">Statut actuel</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Confirmation Modal */}
        <Dialog open={showStatusConfirmModal} onOpenChange={setShowStatusConfirmModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer le changement de statut</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Êtes-vous sûr de vouloir changer le statut de la commande #{order.id} de{' '}
                <span className="font-medium">{statusLabels[order.status]}</span> vers{' '}
                <span className="font-medium">{statusLabels[pendingStatus]}</span> ?
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowStatusConfirmModal(false);
                    setPendingStatus('');
                  }}
                  disabled={isLoading}
                >
                  Annuler
                </Button>
                <Button
                  onClick={confirmStatusUpdate}
                  disabled={isLoading}
                >
                  {isLoading ? 'Mise à jour...' : 'Confirmer'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-3 lg:grid-cols-7'} gap-1 mb-3 sm:mb-4 md:mb-6 bg-muted p-1 rounded-md overflow-x-auto`}>
            <TabsTrigger value="overview" className="text-xs whitespace-nowrap px-2 py-1">
              {isMobile ? "Info" : "Aperçu"}
            </TabsTrigger>
            <TabsTrigger value="dates" className="text-xs whitespace-nowrap px-2 py-1">
              {isMobile ? "Dates" : "Dates d'essayage"}
            </TabsTrigger>
            {!isMobile && (
              <>
                <TabsTrigger value="measurements" className="text-xs whitespace-nowrap px-2 py-1">Mesures</TabsTrigger>
                <TabsTrigger value="options" className="text-xs whitespace-nowrap px-2 py-1">Finitions</TabsTrigger>
                <TabsTrigger value="matiere" className="text-xs whitespace-nowrap px-2 py-1">Matiere</TabsTrigger>
                <TabsTrigger value="media" className="text-xs whitespace-nowrap px-2 py-1">Médias</TabsTrigger>
                <TabsTrigger value="comments" className="text-xs whitespace-nowrap px-2 py-1">Commentaires</TabsTrigger>
              </>
            )}
          </TabsList>
          
          {/* Mobile additional tabs - shown as a second row */}
          {isMobile && (
            <TabsList className="grid w-full grid-cols-5 gap-1 mb-3 bg-muted p-1 rounded-md">
              <TabsTrigger value="measurements" className="text-xs whitespace-nowrap px-1 py-1">Mesures</TabsTrigger>
              <TabsTrigger value="options" className="text-xs whitespace-nowrap px-1 py-1">Finitions</TabsTrigger>
              <TabsTrigger value="matiere" className="text-xs whitespace-nowrap px-1 py-1">Matiere</TabsTrigger>
              <TabsTrigger value="media" className="text-xs whitespace-nowrap px-1 py-1">Médias</TabsTrigger>
              <TabsTrigger value="comments" className="text-xs whitespace-nowrap px-1 py-1">Messages</TabsTrigger>
            </TabsList>
          )}

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-3 sm:space-y-4 md:space-y-6 mt-3 sm:mt-4 md:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
              {/* Client Information */}
              <Card className="shadow-sm">
                <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                  <CardTitle className="flex items-center text-sm sm:text-base md:text-lg font-semibold">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" />
                    {isMobile ? "Client" : "Informations Client"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="client_name">Nom</Label>
                          <Input
                            id="client_name"
                            value={editableClientInfo.client_name}
                            onChange={(e) => setEditableClientInfo(prev => ({ ...prev, client_name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="client_vorname">Prénom</Label>
                          <Input
                            id="client_vorname"
                            value={editableClientInfo.client_vorname}
                            onChange={(e) => setEditableClientInfo(prev => ({ ...prev, client_vorname: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="client_email">Email</Label>
                        <Input
                          id="client_email"
                          type="email"
                          value={editableClientInfo.client_email}
                          onChange={(e) => setEditableClientInfo(prev => ({ ...prev, client_email: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="client_phone">Téléphone</Label>
                        <Input
                          id="client_phone"
                          value={editableClientInfo.client_phone}
                          onChange={(e) => setEditableClientInfo(prev => ({ ...prev, client_phone: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="client_address">Adresse</Label>
                        <Input
                          id="client_address"
                          value={editableClientInfo.client_address}
                          onChange={(e) => setEditableClientInfo(prev => ({ ...prev, client_address: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="client_region">Région</Label>
                        <Input
                          id="client_region"
                          value={editableClientInfo.client_region}
                          onChange={(e) => setEditableClientInfo(prev => ({ ...prev, client_region: e.target.value }))}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{order.client_name || 'Non renseigné'} {order.client_vorname || ''}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span>{order.client_email || 'Non renseigné'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{order.client_phone || 'Non renseigné'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{order.client_address || 'Non renseigné'}</span>
                      </div>
                      {order.client_region && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{order.client_region}</span>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Product Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Package className="w-5 h-5 mr-2" />
                    Informations Produit
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="product_name">Nom du produit</Label>
                        <Input
                          id="product_name"
                          value={editableProductInfo.product_name}
                          onChange={(e) => setEditableProductInfo(prev => ({ ...prev, product_name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="ready_date">Date de prêt</Label>
                        <Input
                          id="ready_date"
                          type="date"
                          value={editableProductInfo.ready_date}
                          onChange={(e) => setEditableProductInfo(prev => ({ ...prev, ready_date: e.target.value }))}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{order.product_name || 'Non renseigné'}</span>
                      </div>
                      {order.ready_date && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>Date de prêt: {format(new Date(order.ready_date), "PPP", { locale: fr })}</span>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Edit Actions */}
            <div className="flex justify-end space-x-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                  <Button onClick={handleSaveClientAndProductInfo} disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
              )}
            </div>
          </TabsContent>

          {/* Dates d'essayage Tab */}
          <TabsContent value="dates" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <CalendarDays className="w-5 h-5 mr-2" />
                  Gestion des dates d'essayage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DynamicTriesSection orderId={order.id} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Measurements Tab */}
          <TabsContent value="measurements" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center">
                    <Edit3 className="w-5 h-5 mr-2" />
                    Mesures
                  </div>
                  {!editingMeasurements ? (
                    <Button onClick={handleStartEditingMeasurements} size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                  ) : (
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" onClick={handleCancelEditingMeasurements}>
                        <X className="w-4 h-4 mr-2" />
                        Annuler
                      </Button>
                      <Button size="sm" onClick={handleSaveMeasurements} disabled={isLoading}>
                        <Save className="w-4 h-4 mr-2" />
                        {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editingMeasurements ? (
                  <div className="space-y-6">
                    {/* Editable measurements table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-200 rounded-lg">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-semibold">Mesure</th>
                            <th className="text-right py-3 px-4 font-semibold">Valeur (cm)</th>
                            <th className="text-right py-3 px-4 font-semibold">Tolérance (cm)</th>
                            <th className="text-right py-3 px-4 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(measurements).map(([name, value], index) => (
                            <tr key={name} className={`border-b ${index % 2 === 0 ? 'bg-muted/30' : 'bg-background'}`}>
                              <td className="py-3 px-4 font-medium">{name}</td>
                              <td className="text-right py-3 px-4">
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={value}
                                  onChange={(e) => handleMeasurementChange(name, e.target.value)}
                                  className="w-20 text-right"
                                />
                              </td>
                              <td className="text-right py-3 px-4">
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={tolerance[name] || 0.5}
                                  onChange={(e) => handleToleranceChange(name, e.target.value)}
                                  className="w-20 text-right"
                                />
                              </td>
                              <td className="text-right py-3 px-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteMeasurement(name)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Add new measurement */}
                    <Card className="border-dashed">
                      <CardHeader>
                        <CardTitle className="text-lg">Ajouter une nouvelle mesure</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                          <div>
                            <Label htmlFor="newMeasureName">Nom de la mesure</Label>
                            <Input
                              id="newMeasureName"
                              value={newMeasureName}
                              onChange={(e) => setNewMeasureName(e.target.value)}
                              placeholder="Ex: Tour de poitrine"
                            />
                          </div>
                          <div>
                            <Label htmlFor="newMeasureValue">Valeur (cm)</Label>
                            <Input
                              id="newMeasureValue"
                              type="number"
                              step="0.1"
                              value={newMeasureValue}
                              onChange={(e) => setNewMeasureValue(e.target.value)}
                              placeholder="Ex: 95.5"
                            />
                          </div>
                          <div>
                            <Label htmlFor="newMeasureTolerance">Tolérance (cm)</Label>
                            <Input
                              id="newMeasureTolerance"
                              type="number"
                              step="0.1"
                              value={newMeasureTolerance}
                              onChange={(e) => setNewMeasureTolerance(e.target.value)}
                              placeholder="0.5"
                            />
                          </div>
                          <Button onClick={handleAddNewMeasurement} disabled={!newMeasureName || !newMeasureValue}>
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200 rounded-lg">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Mesure</th>
                          <th className="text-right py-3 px-4 font-semibold">Valeur</th>
                          <th className="text-right py-3 px-4 font-semibold">Tolérance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(order?.measurements || {}).map(([name, value], index) => (
                          <tr key={name} className={`border-b ${index % 2 === 0 ? 'bg-muted/30' : 'bg-background'}`}>
                            <td className="py-3 px-4 font-medium">{name}</td>
                            <td className="text-right py-3 px-4">
                              <span className="font-semibold text-primary">{value} cm</span>
                            </td>
                            <td className="text-right py-3 px-4 text-muted-foreground">
                              ±{order?.tolerance?.[name] || 0.5} cm
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Options & finitions Tab */}
          <TabsContent value="options" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Options & finitions
                  </div>
                  <Button 
                    onClick={() => setIsAddingOption(true)} 
                    size="sm"
                    disabled={optionsLoading}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter option
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {optionsLoading ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Chargement des options...</p>
                  </div>
                ) : (
                  <>
                    {/* Add/Edit Form */}
                    {(isAddingOption || editingOption) && (
                      <Card className="border-dashed">
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {editingOption ? 'Modifier l\'option' : 'Nouvelle option'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label htmlFor="option-title">Titre *</Label>
                            <Input
                              id="option-title"
                              value={optionForm.title}
                              onChange={(e) => setOptionForm(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="Ex: Poches"
                            />
                          </div>
                          <div>
                            <Label htmlFor="option-description">Description</Label>
                            <Textarea
                              id="option-description"
                              value={optionForm.description}
                              onChange={(e) => setOptionForm(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Ex: Poche smartphone doit être insérée sous emmanchure cran..."
                              className="min-h-[80px]"
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={cancelEditOption}>
                              Annuler
                            </Button>
                            <Button 
                              onClick={editingOption ? handleUpdateOption : handleCreateOption}
                              disabled={!optionForm.title.trim() || isLoading}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              {isLoading ? 'Sauvegarde...' : (editingOption ? 'Modifier' : 'Créer')}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Options List */}
                    {options.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-muted-foreground">Aucune option ajoutée pour cette commande</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-200 rounded-lg">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="text-left py-3 px-4 font-semibold border-b">Image</th>
                              <th className="text-left py-3 px-4 font-semibold border-b">Titre</th>
                              <th className="text-left py-3 px-4 font-semibold border-b">Description</th>
                              <th className="text-center py-3 px-4 font-semibold border-b">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {options.map((option, index) => (
                              <tr key={option.id} className={`border-b hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                                <td className="py-4 px-4 w-20">
                                  <div className="relative">
                                    {option.image_url ? (
                                      <div className="relative">
                                        <img
                                          src={getSurMesureMediaUrl(option.image_url)}
                                          alt={option.title}
                                          className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
                                        />
                                        <Input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => handleOptionImageUpload(e, option.id)}
                                          className="absolute inset-0 opacity-0 cursor-pointer"
                                          disabled={uploadingOptionImage}
                                        />
                                      </div>
                                    ) : (
                                      <div className="relative">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                                          <Upload className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <Input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => handleOptionImageUpload(e, option.id)}
                                          className="absolute inset-0 opacity-0 cursor-pointer"
                                          disabled={uploadingOptionImage}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <h4 className="font-semibold text-gray-900">{option.title}</h4>
                                </td>
                                <td className="py-4 px-4">
                                  <p className="text-gray-600 text-sm leading-relaxed max-w-md">
                                    {option.description || '-'}
                                  </p>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center justify-center space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => startEditOption(option)}
                                      disabled={isLoading || uploadingOptionImage}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openDeleteOptionModal(option)}
                                      disabled={isLoading || uploadingOptionImage}
                                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Matiere Tab */}
          <TabsContent value="matiere" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Package className="w-5 h-5 mr-2" />
                  Matière
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SurMesureMaterials 
                  commandeId={parseInt(id!)} 
                  orderStatus={order?.status}
                  onMaterialsChange={() => {
                    // Refetch data to get latest stock information
                    refetch();
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center">
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Médias
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploadingImage}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={uploadingImage}
                        className="flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        {uploadingImage ? 'Upload...' : 'Photo'}
                      </Button>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Images */}
                {order.images && order.images.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Photos ({order.images.length})</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {order.images.map((image, index) => (
                        <div key={image.id} className="relative aspect-square group">
                          <img
                            src={getSurMesureMediaUrl(image.path)}
                            alt="Produit"
                            className="w-full h-full object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => handleImageClick(index)}
                          />
                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMedia(image.id, 'image');
                            }}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-md transition-colors"
                            title="Supprimer l'image"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          {image.commentaire && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="line-clamp-2">{image.commentaire}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}


                {(!order.images || order.images.length === 0) && (
                  <div className="text-center py-12">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun média disponible</p>
                    <p className="text-sm text-muted-foreground mt-1">Utilisez le bouton ci-dessus pour ajouter des photos</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Commentaires
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Existing Comments */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {order.commentaires && order.commentaires.length > 0 ? (
                    order.commentaires
                      .sort((a, b) => new Date(a.date_creation).getTime() - new Date(b.date_creation).getTime())
                      .map((comment) => (
                      <div 
                        key={comment.id} 
                        className={`p-4 rounded-lg ${
                          comment.created_by === 'Usine production' 
                            ? 'bg-muted' 
                            : 'bg-red-50 border border-red-100'
                        }`}
                      >
                        <p className="text-sm break-words mb-2">{comment.commentaire}</p>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span className="font-medium">Par: {comment.created_by}</span>
                          <span>
                            {format(new Date(comment.date_creation), "PPp", { locale: fr })}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucun commentaire</p>
                    </div>
                  )}
                </div>

                {/* Add New Comment */}
                <div className="space-y-3 border-t pt-4">
                  <Label>Ajouter un commentaire</Label>
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Saisir un commentaire..."
                    className="min-h-[100px] resize-none"
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isLoading}
                    className="w-full sm:w-auto"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {isLoading ? 'Ajout...' : 'Ajouter commentaire'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Image Modal */}
        <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
          <DialogContent className={`${isMobile ? 'max-w-[95vw] h-[90vh]' : 'max-w-4xl'} p-2 sm:p-4`}>
            <DialogHeader className="pb-2">
              <DialogTitle className="text-sm sm:text-base">
                Image {currentImageIndex + 1} sur {order?.images?.length || 0}
              </DialogTitle>
            </DialogHeader>
            {order?.images && order.images[currentImageIndex] && (
              <div className="relative flex-1 min-h-0">
                <img
                  src={getSurMesureMediaUrl(order.images[currentImageIndex].path)}
                  alt="Image de la commande"
                  className={`w-full h-auto ${isMobile ? 'max-h-[75vh]' : 'max-h-[70vh]'} object-contain rounded-lg`}
                />
                {order.images.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size={isMobile ? "sm" : "sm"}
                      className={`absolute ${isMobile ? 'left-1 w-8 h-8' : 'left-2'} top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm`}
                      onClick={handlePrevImage}
                    >
                      <ChevronLeft className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    </Button>
                    <Button
                      variant="outline"
                      size={isMobile ? "sm" : "sm"}
                      className={`absolute ${isMobile ? 'right-1 w-8 h-8' : 'right-2'} top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm`}
                      onClick={handleNextImage}
                    >
                      <ChevronRight className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    </Button>
                  </>
                )}
                {order.images[currentImageIndex].commentaire && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white p-2 sm:p-3 rounded-b-lg">
                    <p className="text-xs sm:text-sm">{order.images[currentImageIndex].commentaire}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Report Modal */}
        <SurMesureReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          order={order}
        />

        {/* Delete Option Confirmation Modal */}
        <AlertDialog 
          open={deleteOptionModal.isOpen} 
          onOpenChange={(open) => !open && setDeleteOptionModal({ isOpen: false, optionId: null, optionTitle: '' })}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer l'option</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer l'option "{deleteOptionModal.optionTitle}" ?
                Cette action ne peut pas être annulée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteOptionModal.optionId && handleDeleteOption(deleteOptionModal.optionId)}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? 'Suppression...' : 'Supprimer'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default CommandeDetails;