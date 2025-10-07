import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Employee, Salary, salaryService } from "@/utils/rhService";
import { PaySlipModal } from "./PaySlipModal";
import { format, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface PaySlipButtonProps {
  employee: Employee;
}

export const PaySlipButton = ({ employee }: PaySlipButtonProps) => {
  const { toast } = useToast();
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPaySlip, setSelectedPaySlip] = useState<{
    salary: Salary;
    month: string;
  } | null>(null);

  const currentMonth = format(new Date(), "yyyy-MM");
  const lastMonth = format(subMonths(new Date(), 1), "yyyy-MM");

  useEffect(() => {
    loadSalaries();
  }, [employee.id]);

  const loadSalaries = async () => {
    setLoading(true);
    try {
      const data = await salaryService.getAll({ employee_id: employee.id });
      setSalaries(data);
    } catch (error) {
      console.error("Error loading salaries:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les salaires",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSalaryForMonth = (month: string): Salary | null => {
    // Find salary that was effective during this month
    return salaries.find(salary => {
      const effectiveFrom = new Date(salary.effective_from);
      const effectiveTo = salary.effective_to ? new Date(salary.effective_to) : new Date();
      const monthDate = new Date(month + "-01");
      
      return monthDate >= effectiveFrom && monthDate <= effectiveTo;
    }) || null;
  };

  const currentMonthSalary = getSalaryForMonth(currentMonth);
  const lastMonthSalary = getSalaryForMonth(lastMonth);

  const handleViewPaySlip = (month: string, salary: Salary) => {
    setSelectedPaySlip({ salary, month });
  };

  const currentMonthLabel = format(new Date(), "MMMM yyyy", { locale: fr });
  const lastMonthLabel = format(subMonths(new Date(), 1), "MMMM yyyy", { locale: fr });

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <FileText className="h-4 w-4 animate-pulse" />
      </Button>
    );
  }

  if (!currentMonthSalary && !lastMonthSalary) {
    return (
      <Button variant="ghost" size="sm" disabled title="Aucun salaire défini">
        <FileText className="h-4 w-4 opacity-50" />
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => e.stopPropagation()}
            title="Voir fiche de paie"
          >
            <FileText className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {currentMonthSalary && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleViewPaySlip(currentMonth, currentMonthSalary);
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              {currentMonthLabel}
            </DropdownMenuItem>
          )}
          {lastMonthSalary && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleViewPaySlip(lastMonth, lastMonthSalary);
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              {lastMonthLabel}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedPaySlip && (
        <PaySlipModal
          open={!!selectedPaySlip}
          onOpenChange={(open) => !open && setSelectedPaySlip(null)}
          employee={employee}
          salary={selectedPaySlip.salary}
          month={selectedPaySlip.month}
        />
      )}
    </>
  );
};
