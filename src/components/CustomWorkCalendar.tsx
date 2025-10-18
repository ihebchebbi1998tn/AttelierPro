import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addMonths, 
  subMonths, 
  isSameMonth, 
  isSameDay,
  isToday 
} from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CustomWorkCalendarProps {
  isWorkDay: (date: Date) => boolean;
  isHoliday: (date: Date) => boolean;
  isWeekend: (date: Date) => boolean;
  getWorkPercentage?: (date: Date) => number; // 0-100, where 100 is full day
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
}

export const CustomWorkCalendar = ({
  isWorkDay,
  isHoliday,
  isWeekend,
  getWorkPercentage,
  selectedDate,
  onSelectDate
}: CustomWorkCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-4 px-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: fr })}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const renderDays = () => {
    const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    return (
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isTodayDate = isToday(day);
        const isWork = isWorkDay(day);
        const isHol = isHoliday(day);
        const isWknd = isWeekend(day);
        const workPercentage = getWorkPercentage ? getWorkPercentage(day) : 100;

        days.push(
          <button
            key={day.toString()}
            onClick={() => onSelectDate && onSelectDate(currentDay)}
            disabled={!isCurrentMonth}
            style={
              isWork && isCurrentMonth && workPercentage < 100
                ? {
                    background: `linear-gradient(to right, rgb(34, 197, 94) ${workPercentage}%, rgb(251, 146, 60) ${workPercentage}%)`,
                  }
                : undefined
            }
            className={cn(
              "relative h-12 w-full rounded-lg text-sm font-medium transition-all",
              "disabled:opacity-30 disabled:cursor-not-allowed",
              !isCurrentMonth && "text-muted-foreground bg-transparent",
              // Holidays - red (highest priority)
              isHol && isCurrentMonth && "bg-red-500 dark:bg-red-600 text-white font-bold hover:opacity-80",
              // Working days - full green background (only if 100% or no percentage function)
              !isHol && isWork && isCurrentMonth && workPercentage === 100 && "bg-green-500 dark:bg-green-600 text-white font-semibold hover:opacity-80",
              // Partial work days - gradient applied via inline style above
              !isHol && isWork && isCurrentMonth && workPercentage < 100 && "text-white font-semibold hover:opacity-80",
              // Weekends - amber/yellow
              !isHol && !isWork && isWknd && isCurrentMonth && "bg-amber-500 dark:bg-amber-600 text-white font-semibold hover:opacity-80",
              // Default for other days in current month
              !isHol && !isWork && !isWknd && isCurrentMonth && "bg-muted/30 hover:bg-accent hover:text-accent-foreground",
              isSelected && "ring-2 ring-primary ring-offset-2",
              isTodayDate && "ring-2 ring-blue-500"
            )}
          >
            <span className="relative z-10">{format(day, "d")}</span>
            {isTodayDate && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
            )}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-1">
          {days}
        </div>
      );
      days = [];
    }

    return <div className="space-y-1">{rows}</div>;
  };

  return (
    <div className="p-4 rounded-lg border bg-card">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      
      {/* Legend */}
      <div className="mt-6 pt-4 border-t space-y-2">
        <h3 className="text-sm font-semibold mb-3">Légende</h3>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-green-500 dark:bg-green-600" />
            <span>Jour complet</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded" style={{ background: 'linear-gradient(to right, rgb(34, 197, 94) 50%, rgb(251, 146, 60) 50%)' }} />
            <span>Jour partiel</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-red-500 dark:bg-red-600" />
            <span>Congé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-amber-500 dark:bg-amber-600" />
            <span>Weekend</span>
          </div>
        </div>
      </div>
    </div>
  );
};
