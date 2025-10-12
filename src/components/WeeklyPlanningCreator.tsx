import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Clock, Calendar, Coffee, Check, X, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { shiftTemplateService, Employee, CreateShiftTemplateData, ShiftTemplate } from "@/utils/rhService";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface WeeklyPlanningCreatorProps {
  employee: Employee;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const WeeklyPlanningCreator: React.FC<WeeklyPlanningCreatorProps> = ({
  employee,
  onSuccess,
  onCancel
}) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingTemplates, setExistingTemplates] = useState<ShiftTemplate[]>([]);
  const [templateToDelete, setTemplateToDelete] = useState<ShiftTemplate | null>(null);

  const weekdays = [
    { id: 1, name: "Lundi", short: "L" },
    { id: 2, name: "Mardi", short: "M" },
    { id: 3, name: "Mercredi", short: "M" },
    { id: 4, name: "Jeudi", short: "J" },
    { id: 5, name: "Vendredi", short: "V" },
    { id: 6, name: "Samedi", short: "S" },
    { id: 0, name: "Dimanche", short: "D" }
  ];

  const [workingDays, setWorkingDays] = useState<number[]>([]);
  const [workStart, setWorkStart] = useState("08:00");
  const [workEnd, setWorkEnd] = useState("17:00");
  const [lunchStart, setLunchStart] = useState("12:00");
  const [lunchEnd, setLunchEnd] = useState("14:00");
  const [hasLunch, setHasLunch] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  // Load existing templates
  useEffect(() => {
    loadExistingTemplates();
  }, [employee.id]);

  const loadExistingTemplates = async () => {
    try {
      setLoading(true);
      const templates = await shiftTemplateService.getAll(employee.id);
      setExistingTemplates(templates);
      
      // If templates exist, set the working days and times from first template
      if (templates.length > 0) {
        const workDays = templates.map(t => t.weekday);
        setWorkingDays(workDays);
        
        // Use first template's times as default
        const firstTemplate = templates[0];
        setWorkStart(firstTemplate.start_time);
        setWorkEnd(firstTemplate.end_time);
        if (firstTemplate.lunch_start && firstTemplate.lunch_end) {
          setLunchStart(firstTemplate.lunch_start);
          setLunchEnd(firstTemplate.lunch_end);
          setHasLunch(true);
        } else {
          setHasLunch(false);
        }
      } else {
        // Default to Mon-Fri if no templates
        setWorkingDays([1, 2, 3, 4, 5]);
        setIsEditMode(true); // Start in edit mode if no templates
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le planning existant",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkingDay = (dayId: number) => {
    if (workingDays.includes(dayId)) {
      setWorkingDays(workingDays.filter(d => d !== dayId));
    } else {
      setWorkingDays([...workingDays, dayId]);
    }
  };

  const calculateWorkHours = () => {
    const start = new Date(`2000-01-01 ${workStart}`);
    const end = new Date(`2000-01-01 ${workEnd}`);
    let totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    
    if (hasLunch && lunchStart && lunchEnd) {
      const lunchStartTime = new Date(`2000-01-01 ${lunchStart}`);
      const lunchEndTime = new Date(`2000-01-01 ${lunchEnd}`);
      const lunchMinutes = (lunchEndTime.getTime() - lunchStartTime.getTime()) / (1000 * 60);
      totalMinutes -= lunchMinutes;
    }
    
    return (totalMinutes / 60).toFixed(1);
  };

  const handleDeleteTemplate = async (template: ShiftTemplate) => {
    try {
      await shiftTemplateService.delete(template.id);
      toast({
        title: "Succès",
        description: `Template du ${template.weekday_name} supprimé`,
      });
      await loadExistingTemplates();
      setTemplateToDelete(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    if (workingDays.length === 0) {
      toast({
        title: "Erreur",
        description: "Sélectionnez au moins un jour de travail",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Determine which days need to be created/updated
      const existingDays = existingTemplates.map(t => t.weekday);
      const daysToCreate = workingDays.filter(d => !existingDays.includes(d));
      const daysToUpdate = workingDays.filter(d => existingDays.includes(d));
      const daysToDelete = existingDays.filter(d => !workingDays.includes(d));
      
      // Delete templates for unselected days
      for (const dayId of daysToDelete) {
        const template = existingTemplates.find(t => t.weekday === dayId);
        if (template) {
          await shiftTemplateService.delete(template.id);
        }
      }
      
      // Update existing templates
      for (const dayId of daysToUpdate) {
        const template = existingTemplates.find(t => t.weekday === dayId);
        if (template) {
          await shiftTemplateService.update(template.id, {
            start_time: workStart,
            end_time: workEnd,
            lunch_start: hasLunch ? lunchStart : undefined,
            lunch_end: hasLunch ? lunchEnd : undefined,
            active: true
          });
        }
      }
      
      // Create new templates
      for (const dayId of daysToCreate) {
        const templateData: CreateShiftTemplateData = {
          employee_id: employee.id,
          weekday: dayId,
          start_time: workStart,
          end_time: workEnd,
          lunch_start: hasLunch ? lunchStart : undefined,
          lunch_end: hasLunch ? lunchEnd : undefined,
          active: true
        };

        await shiftTemplateService.create(templateData);
      }

      toast({
        title: "Succès",
        description: `Planning mis à jour pour ${employee.prenom} ${employee.nom}`,
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error saving planning:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde du planning",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Chargement du planning...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full border-0 shadow-none">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="truncate">Planning - {employee.prenom} {employee.nom}</span>
            </div>
            {existingTemplates.length > 0 && (
              <Badge variant="secondary" className="text-xs w-fit">
                {existingTemplates.length} jour{existingTemplates.length > 1 ? 's' : ''} configuré{existingTemplates.length > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-5">
          {/* Existing Templates Info - View Mode */}
          {existingTemplates.length > 0 && !isEditMode && (
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4">
                {/* Weekly Schedule Grid */}
                <div className="space-y-2">
                  {existingTemplates.map((template) => {
                    const startTime = new Date(`2000-01-01 ${template.start_time}`);
                    const endTime = new Date(`2000-01-01 ${template.end_time}`);
                    let totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
                    
                    let lunchDuration = 0;
                    if (template.lunch_start && template.lunch_end) {
                      const lunchStartTime = new Date(`2000-01-01 ${template.lunch_start}`);
                      const lunchEndTime = new Date(`2000-01-01 ${template.lunch_end}`);
                      lunchDuration = (lunchEndTime.getTime() - lunchStartTime.getTime()) / (1000 * 60);
                      totalMinutes -= lunchDuration;
                    }
                    
                    const workHours = (totalMinutes / 60).toFixed(1);

                    return (
                      <div key={template.id} className="bg-card border rounded-lg p-3 sm:p-4 hover:border-primary/50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-base sm:text-lg">{template.weekday_name}</p>
                              <Badge variant="outline" className="text-xs">
                                {workHours}h
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3.5 w-3.5 shrink-0" />
                              <span>{template.start_time} - {template.end_time}</span>
                            </div>
                            {template.lunch_start && template.lunch_end && (
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                <Coffee className="h-3.5 w-3.5 shrink-0" />
                                <span>Pause: {template.lunch_start} - {template.lunch_end}</span>
                                <span className="text-xs opacity-70">({(lunchDuration / 60).toFixed(1)}h)</span>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTemplateToDelete(template)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Weekly Summary */}
                <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm">Heures/semaine</p>
                      <p className="text-xl sm:text-2xl font-bold text-primary">
                        {existingTemplates.reduce((acc, t) => {
                          const start = new Date(`2000-01-01 ${t.start_time}`);
                          const end = new Date(`2000-01-01 ${t.end_time}`);
                          let minutes = (end.getTime() - start.getTime()) / (1000 * 60);
                          if (t.lunch_start && t.lunch_end) {
                            const lunchStart = new Date(`2000-01-01 ${t.lunch_start}`);
                            const lunchEnd = new Date(`2000-01-01 ${t.lunch_end}`);
                            minutes -= (lunchEnd.getTime() - lunchStart.getTime()) / (1000 * 60);
                          }
                          return acc + minutes / 60;
                        }, 0).toFixed(1)}h
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm">Jours travaillés</p>
                      <p className="text-xl sm:text-2xl font-bold text-primary">
                        {existingTemplates.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={() => setIsEditMode(true)}
                  className="flex-1"
                  size="default"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Modifier le planning</span>
                  <span className="sm:hidden">Modifier</span>
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (confirm('Voulez-vous supprimer tout le planning existant ?')) {
                      try {
                        for (const template of existingTemplates) {
                          await shiftTemplateService.delete(template.id);
                        }
                        toast({
                          title: "Succès",
                          description: "Planning supprimé avec succès",
                        });
                        await loadExistingTemplates();
                      } catch (error) {
                        toast({
                          title: "Erreur",
                          description: "Erreur lors de la suppression",
                          variant: "destructive"
                        });
                      }
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Edit Mode Form */}
          {(isEditMode || existingTemplates.length === 0) && (
            <div className="space-y-4 sm:space-y-5">
              {existingTemplates.length > 0 && (
                <div className="flex items-center justify-between pb-3 border-b">
                  <h3 className="text-sm sm:text-base font-semibold">Modifier le planning</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditMode(false)}
                  >
                    <X className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Annuler</span>
                  </Button>
                </div>
              )}

          {/* Working Days Selection */}
          <div>
            <h3 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3">Jours de travail</h3>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {weekdays.map((day) => {
                const hasTemplate = existingTemplates.some(t => t.weekday === day.id);
                return (
                  <div key={day.id} className="text-center">
                    <Button
                      variant={workingDays.includes(day.id) ? "default" : "outline"}
                      size="sm"
                      className="w-9 h-9 sm:w-11 sm:h-11 p-0 relative text-xs sm:text-sm"
                      onClick={() => toggleWorkingDay(day.id)}
                    >
                      {day.short}
                      {hasTemplate && (
                        <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full" />
                      )}
                    </Button>
                    <p className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 text-muted-foreground truncate">{day.name}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2 hidden sm:block">
              Les jours avec un point vert ont déjà un planning configuré
            </p>
          </div>

        {/* Work Hours */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
          <div>
            <label className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 block">Début</label>
            <Input
              type="time"
              value={workStart}
              onChange={(e) => setWorkStart(e.target.value)}
              className="text-sm sm:text-base"
            />
          </div>
          <div>
            <label className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 block">Fin</label>
            <Input
              type="time"
              value={workEnd}
              onChange={(e) => setWorkEnd(e.target.value)}
              className="text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Lunch Break */}
        <div>
          <div className="flex items-center space-x-2 mb-2 sm:mb-3">
            <Checkbox
              id="hasLunch"
              checked={hasLunch}
              onCheckedChange={(checked) => setHasLunch(checked as boolean)}
            />
            <label htmlFor="hasLunch" className="text-xs sm:text-sm font-medium">
              Pause déjeuner
            </label>
          </div>
          
          {hasLunch && (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
              <div>
                <label className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 block">Début pause</label>
                <Input
                  type="time"
                  value={lunchStart}
                  onChange={(e) => setLunchStart(e.target.value)}
                  className="text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 block">Fin pause</label>
                <Input
                  type="time"
                  value={lunchEnd}
                  onChange={(e) => setLunchEnd(e.target.value)}
                  className="text-sm sm:text-base"
                />
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-muted p-3 sm:p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm font-medium">Résumé</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs sm:text-sm text-muted-foreground">
            <div>
              <p className="text-muted-foreground/70 text-[10px] sm:text-xs">Jours</p>
              <p className="font-semibold text-foreground">{workingDays.length}j/sem</p>
            </div>
            <div>
              <p className="text-muted-foreground/70 text-[10px] sm:text-xs">Quotidien</p>
              <p className="font-semibold text-foreground">{calculateWorkHours()}h</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-muted-foreground/70 text-[10px] sm:text-xs">Hebdo</p>
              <p className="font-semibold text-foreground">{(parseFloat(calculateWorkHours()) * workingDays.length).toFixed(1)}h</p>
            </div>
            {hasLunch && (
              <div className="col-span-2 sm:col-span-3 flex items-center gap-1 pt-1 border-t">
                <Coffee className="h-3 w-3" />
                <span className="text-[10px] sm:text-xs">Pause: {lunchStart} - {lunchEnd}</span>
              </div>
            )}
          </div>
        </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 sm:pt-3">
                <Button 
                  onClick={async () => {
                    await handleSubmit();
                    if (existingTemplates.length > 0) {
                      setIsEditMode(false);
                    }
                  }} 
                  disabled={submitting || workingDays.length === 0}
                  className="flex-1 text-xs sm:text-sm"
                  size="default"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      <span className="hidden sm:inline">Sauvegarde...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <Check className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">{existingTemplates.length > 0 ? 'Mettre à jour' : 'Créer le Planning'}</span>
                      <span className="sm:hidden">{existingTemplates.length > 0 ? 'Mettre à jour' : 'Créer'}</span>
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (existingTemplates.length > 0) {
                      setIsEditMode(false);
                    } else {
                      onCancel?.();
                    }
                  }}
                  className="text-xs sm:text-sm"
                  size="default"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Annuler</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce jour ?</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous supprimer le template du {templateToDelete?.weekday_name} ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => templateToDelete && handleDeleteTemplate(templateToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default WeeklyPlanningCreator;