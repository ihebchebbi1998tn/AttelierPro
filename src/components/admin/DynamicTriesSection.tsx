import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, 
  CalendarDays, 
  Edit, 
  Save, 
  X, 
  Plus, 
  Trash2 
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DateTimePickerModal } from './DateTimePickerModal';
import { 
  DynamicTry, 
  getDynamicTries, 
  addDynamicTry, 
  updateDynamicTry, 
  deleteDynamicTry,
  getOrdinalFrench,
  validateTrySequence
} from '@/utils/dynamicTriesService';

interface DynamicTriesSectionProps {
  orderId: number;
}

export const DynamicTriesSection: React.FC<DynamicTriesSectionProps> = ({ orderId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [tries, setTries] = useState<DynamicTry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTries, setEditingTries] = useState(false);
  const [dateTimeModalOpen, setDateTimeModalOpen] = useState(false);
  const [currentEditingTry, setCurrentEditingTry] = useState<{ tryId: number; field: 'completed' } | null>(null);
  const [editingCompletedDates, setEditingCompletedDates] = useState<Record<number, string>>({});

  // Load tries on mount
  useEffect(() => {
    loadTries();
  }, [orderId]);

  const loadTries = async () => {
    console.log('📥 loadTries called for orderId:', orderId);
    
    try {
      setIsLoading(true);
      const triesData = await getDynamicTries(orderId);
      console.log('📥 loadTries received data:', triesData);
      setTries(triesData);
      
      // Initialize editing state for completed dates
      const completedDates: Record<number, string> = {};
      triesData.forEach(tryData => {
        if (tryData.completed_at) {
          completedDates[tryData.id] = tryData.completed_at;
        }
      });
      console.log('📥 loadTries setting completedDates:', completedDates);
      setEditingCompletedDates(completedDates);
    } catch (error) {
      console.error('❌ Error loading tries:', error);
      // Don't show error toast for CORS issues - just continue with empty state
      setTries([]);
      setEditingCompletedDates({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTry = async () => {
    try {
      setIsLoading(true);
      
      // Calculate suggested date based on the last try + 1 week
      let suggestedDate = new Date();
      if (tries.length > 0) {
        const lastTry = tries[tries.length - 1];
        const lastDate = lastTry.completed_at ? 
          new Date(lastTry.completed_at) : 
          new Date(lastTry.scheduled_date);
        suggestedDate = new Date(lastDate);
        suggestedDate.setDate(suggestedDate.getDate() + 7); // Add 1 week
      }

      const newTry = await addDynamicTry({
        order_id: orderId,
        scheduled_date: format(suggestedDate, 'yyyy-MM-dd'),
        scheduled_time: '14:00'
      });

      await loadTries();
      
      toast({
        title: "Succès",
        description: `${getOrdinalFrench(newTry.try_number)} essai ajouté avec succès`,
      });
    } catch (error) {
      console.error('Error adding try:', error);
      toast({
        title: "Erreur", 
        description: "Impossible d'ajouter un nouvel essai",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTry = async (tryId: number, tryNumber: number) => {
    if (tries.length <= 1) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le dernier essai. Au moins un essai doit exister.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      await deleteDynamicTry(tryId);
      await loadTries();
      
      toast({
        title: "Succès",
        description: `${getOrdinalFrench(tryNumber)} essai supprimé avec succès`,
      });
    } catch (error) {
      console.error('Error deleting try:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'essai", 
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openDateTimePicker = (tryId: number) => {
    setCurrentEditingTry({ tryId, field: 'completed' });
    setDateTimeModalOpen(true);
  };

  const handleDateTimeConfirm = async (dateTime: string) => {
    console.log('🔍 handleDateTimeConfirm called with:', { dateTime, currentEditingTry });
    if (!currentEditingTry) return;

    const { tryId } = currentEditingTry;
    const tryData = tries.find(t => t.id === tryId);
    
    console.log('🔍 Found tryData:', tryData);
    
    if (!tryData) return;

    // Validate sequence if setting a completed date
    if (dateTime) {
      const validationError = validateTrySequence(tries, tryData.try_number, dateTime);
      if (validationError) {
        console.log('❌ Validation error:', validationError);
        toast({
          title: "Date invalide",
          description: validationError,
          variant: "destructive"
        });
        setCurrentEditingTry(null);
        return;
      }
    }

    console.log('🔍 Setting local state for tryId:', tryId, 'with dateTime:', dateTime);
    // Update local state
    setEditingCompletedDates(prev => {
      const newState = {
        ...prev,
        [tryId]: dateTime
      };
      console.log('🔍 New editingCompletedDates state:', newState);
      return newState;
    });
    
    setCurrentEditingTry(null);
  };

  const handleSaveDates = async () => {
    console.log('💾 handleSaveDates called');
    console.log('💾 Current editingCompletedDates:', editingCompletedDates);
    console.log('💾 Current tries:', tries);
    
    try {
      setIsLoading(true);

      // Update all modified completed dates
      for (const [tryIdStr, completedDate] of Object.entries(editingCompletedDates)) {
        const tryId = parseInt(tryIdStr);
        const originalTry = tries.find(t => t.id.toString() === tryIdStr);
        
        console.log('💾 Processing tryId:', tryId, 'completedDate:', completedDate, 'originalTry:', originalTry);
        
        if (originalTry && originalTry.completed_at !== completedDate) {
          console.log('💾 Updating try - original completed_at:', originalTry.completed_at, 'new completed_at:', completedDate);
          
          const updatePayload = {
            try_id: tryId,
            completed_at: completedDate || null
          };
          
          console.log('💾 API update payload:', updatePayload);
          
          const result = await updateDynamicTry(updatePayload);
          console.log('💾 API update result:', result);
        } else {
          console.log('💾 Skipping update - no changes for tryId:', tryId);
        }
      }

      console.log('💾 Reloading tries after updates...');
      await loadTries();
      setEditingTries(false);
      
      // Invalidate queries to refresh parent components
      queryClient.invalidateQueries({ queryKey: ['surMesureOrders'] });
      
      toast({
        title: "Succès",
        description: "Dates d'essayage mises à jour avec succès",
      });
    } catch (error) {
      console.error('💾 Error saving dates:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour des dates",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMinDateForTry = (tryData: DynamicTry): Date | undefined => {
    const previousTry = tries.find(t => t.try_number === tryData.try_number - 1);
    if (!previousTry) return new Date('2024-01-01');
    
    const prevDate = editingCompletedDates[previousTry.id] || 
                     previousTry.completed_at || 
                     previousTry.scheduled_date;
    
    return prevDate ? new Date(prevDate) : new Date('2024-01-01');
  };

  const getCurrentValue = (): string => {
    if (!currentEditingTry) return '';
    const { tryId } = currentEditingTry;
    return editingCompletedDates[tryId] || '';
  };

  const getFieldTitle = (): string => {
    if (!currentEditingTry) return '';
    const { tryId } = currentEditingTry;
    const tryData = tries.find(t => t.id === tryId);
    if (!tryData) return '';
    return `Date réalisée - ${getOrdinalFrench(tryData.try_number)} Essai`;
  };

  if (isLoading && tries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Calendar className="w-5 h-5 mr-2" />
            Dates d'essayage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Dates d'essayage
            </div>
            <div className="flex items-center gap-2">
              {!editingTries && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddTry}
                    disabled={isLoading}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter essai
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingTries(true)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tries.map((tryData) => (
              <div key={tryData.id} className="space-y-2 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-primary">
                    {getOrdinalFrench(tryData.try_number)} Essai
                  </Label>
                  {editingTries && tries.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTry(tryData.id, tryData.try_number)}
                      className="h-6 px-2 text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Date prévue</Label>
                    <p className="text-sm">{format(new Date(tryData.scheduled_date), "PPP", { locale: fr })}</p>
                    {tryData.scheduled_time && (
                      <p className="text-xs text-muted-foreground">à {tryData.scheduled_time}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Date réalisée</Label>
                    {editingTries ? (
                      <Button
                        variant="outline"
                        onClick={() => openDateTimePicker(tryData.id)}
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarDays className="w-4 h-4 mr-2" />
                        {editingCompletedDates[tryData.id] ? 
                          format(new Date(editingCompletedDates[tryData.id]), "PPP à HH:mm", { locale: fr }) :
                          "Sélectionner date et heure"
                        }
                      </Button>
                    ) : (
                      tryData.completed_at ? (
                        <p className="text-sm text-green-600">
                          {format(new Date(tryData.completed_at), "PPP à HH:mm", { locale: fr })}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Non réalisé</p>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {editingTries && (
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingTries(false);
                    loadTries(); // Reset any unsaved changes
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveDates}
                  disabled={isLoading}
                >
                  <Save className="w-4 h-4 mr-1" />
                  {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Date Time Picker Modal */}
      <DateTimePickerModal
        isOpen={dateTimeModalOpen}
        onClose={() => {
          setDateTimeModalOpen(false);
          setCurrentEditingTry(null);
        }}
        onConfirm={handleDateTimeConfirm}
        title={getFieldTitle()}
        initialValue={getCurrentValue()}
        minDate={currentEditingTry ? getMinDateForTry(tries.find(t => t.id === currentEditingTry.tryId)!) : undefined}
      />
    </>
  );
};