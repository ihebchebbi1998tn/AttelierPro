import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Plus,
  Edit,
  Trash2,
  Tag,
  Save
} from "lucide-react";

const categorySchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire"),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface Category {
  category_id: number;
  name: string;
  description?: string;
  is_active: boolean;
  material_count?: number;
  created_date: string;
  modified_date: string;
}

const CategoryManagement = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      is_active: true,
    },
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockCategories: Category[] = [
        {
          category_id: 1,
          name: "Tissus",
          description: "Matières textiles principales",
          is_active: true,
          material_count: 8,
          created_date: "2024-01-10",
          modified_date: "2024-01-10"
        },
        {
          category_id: 2,
          name: "Fils",
          description: "Fils de couture et broderie",
          is_active: true,
          material_count: 5,
          created_date: "2024-01-10",
          modified_date: "2024-01-10"
        },
        {
          category_id: 3,
          name: "Accessoires",
          description: "Boutons, fermetures, etc.",
          is_active: true,
          material_count: 12,
          created_date: "2024-01-10",
          modified_date: "2024-01-10"
        },
        {
          category_id: 4,
          name: "Doublures",
          description: "Matières de doublure",
          is_active: true,
          material_count: 3,
          created_date: "2024-01-10",
          modified_date: "2024-01-10"
        },
        {
          category_id: 5,
          name: "Matières spéciales",
          description: "Matières techniques et spécialisées",
          is_active: false,
          material_count: 0,
          created_date: "2024-01-10",
          modified_date: "2024-01-15"
        }
      ];
      setCategories(mockCategories);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les catégories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      console.log("Category data:", data);
      console.log("Editing category:", editingCategory);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (editingCategory) {
        toast({
          title: "Catégorie modifiée",
          description: `La catégorie "${data.name}" a été mise à jour.`,
        });
      } else {
        toast({
          title: "Catégorie créée",
          description: `La catégorie "${data.name}" a été ajoutée.`,
        });
      }
      
      setIsAddDialogOpen(false);
      setEditingCategory(null);
      form.reset();
      fetchCategories();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la catégorie",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      description: category.description || "",
      is_active: category.is_active,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (categoryId: number, categoryName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" ?`)) {
      return;
    }

    try {
      console.log("Deleting category:", categoryId);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Catégorie supprimée",
        description: `La catégorie "${categoryName}" a été supprimée.`,
      });
      
      fetchCategories();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la catégorie",
        variant: "destructive",
      });
    }
  };

  const closeDialog = () => {
    setIsAddDialogOpen(false);
    setEditingCategory(null);
    form.reset();
  };

  return (
    <Card className="modern-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Gestion des catégories
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle catégorie
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de la catégorie *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Tissus" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Description de la catégorie..."
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Catégorie active</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Les catégories inactives n'apparaissent pas dans les formulaires
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={closeDialog}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      <Save className="mr-2 h-4 w-4" />
                      {editingCategory ? "Modifier" : "Créer"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Chargement des catégories...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Matériaux</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.category_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ID: {category.category_id}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {category.description || "-"}
                      </p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {category.material_count || 0} matériaux
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={category.is_active ? "success" : "secondary"}>
                        {category.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(category.category_id, category.name)}
                          disabled={category.material_count > 0}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {categories.length === 0 && !loading && (
          <div className="text-center py-8">
            <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Aucune catégorie</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par créer une catégorie pour vos matériaux.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryManagement;