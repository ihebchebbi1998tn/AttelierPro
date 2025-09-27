import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Clock, Calendar, Coffee, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { shiftTemplateService, Employee, CreateShiftTemplateData } from "@/utils/rhService";

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

  const weekdays = [
    { id: 1, name: "Lundi", short: "L" },
    { id: 2, name: "Mardi", short: "M" },
    { id: 3, name: "Mercredi", short: "M" },
    { id: 4, name: "Jeudi", short: "J" },
    { id: 5, name: "Vendredi", short: "V" },
    { id: 6, name: "Samedi", short: "S" },
    { id: 0, name: "Dimanche", short: "D" }
  ];

  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]); // Default Mon-Fri
  const [workStart, setWorkStart] = useState("08:00");
  const [workEnd, setWorkEnd] = useState("17:00");
  const [lunchStart, setLunchStart] = useState("12:00");
  const [lunchEnd, setLunchEnd] = useState("14:00");
  const [hasLunch, setHasLunch] = useState(true);

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
      
      // Create templates for each working day
      for (const dayId of workingDays) {
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
        description: `Planning hebdomadaire créé pour ${employee.prenom} ${employee.nom}`,
      });

      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création du planning",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Planning pour {employee.prenom} {employee.nom}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Working Days Selection */}
        <div>
          <h3 className="text-sm font-medium mb-3">Jours de travail</h3>
          <div className="grid grid-cols-7 gap-2">
            {weekdays.map((day) => (
              <div key={day.id} className="text-center">
                <Button
                  variant={workingDays.includes(day.id) ? "default" : "outline"}
                  size="sm"
                  className="w-12 h-12 p-0"
                  onClick={() => toggleWorkingDay(day.id)}
                >
                  {day.short}
                </Button>
                <p className="text-xs mt-1 text-muted-foreground">{day.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Work Hours */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Heure de début</label>
            <Input
              type="time"
              value={workStart}
              onChange={(e) => setWorkStart(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Heure de fin</label>
            <Input
              type="time"
              value={workEnd}
              onChange={(e) => setWorkEnd(e.target.value)}
            />
          </div>
        </div>

        {/* Lunch Break */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Checkbox
              id="hasLunch"
              checked={hasLunch}
              onCheckedChange={(checked) => setHasLunch(checked as boolean)}
            />
            <label htmlFor="hasLunch" className="text-sm font-medium">
              Pause déjeuner
            </label>
          </div>
          
          {hasLunch && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Début pause</label>
                <Input
                  type="time"
                  value={lunchStart}
                  onChange={(e) => setLunchStart(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Fin pause</label>
                <Input
                  type="time"
                  value={lunchEnd}
                  onChange={(e) => setLunchEnd(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Résumé du planning</span>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Jours de travail: {workingDays.length} jours/semaine</p>
            <p>Heures quotidiennes: {calculateWorkHours()}h</p>
            <p>Heures hebdomadaires: {(parseFloat(calculateWorkHours()) * workingDays.length).toFixed(1)}h</p>
            {hasLunch && (
              <div className="flex items-center gap-1">
                <Coffee className="h-3 w-3" />
                <span>Pause: {lunchStart} - {lunchEnd}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || workingDays.length === 0}
            className="flex-1"
          >
            {submitting ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Créer le Planning
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyPlanningCreator;