import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CategoryManagement from "@/components/CategoryManagement";
import { ArrowLeft, Tag } from "lucide-react";

const Categories = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/stock')}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au stock
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Catégories de matériaux</h1>
          <p className="text-muted-foreground">
            Gérez les catégories pour organizer vos matériaux
          </p>
        </div>
      </div>

      {/* Category Management Component */}
      <CategoryManagement />
    </div>
  );
};

export default Categories;