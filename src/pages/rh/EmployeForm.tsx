import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Camera, X, User } from 'lucide-react';
import { employeeService } from '@/utils/rhService';

interface Employee {
  id?: number;
  prenom: string;
  nom: string;
  poste: string;
  telephone: string;
  adresse?: string;
  region?: string;
  carte_identite?: string;
  cnss_code?: string;
  statut_civil?: 'celibataire' | 'marie' | 'divorce';
  role?: string;
  age?: number;
  nombre_enfants?: number;
  date_naissance?: string;
  photo_path?: string;
  sexe: 'homme' | 'femme';
  chef_de_famille?: boolean;
}

export default function EmployeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  
  const [formData, setFormData] = useState<Employee>({
    prenom: '',
    nom: '',
    poste: '',
    telephone: '',
    adresse: '',
    region: '',
    carte_identite: '',
    cnss_code: '',
    statut_civil: undefined,
    role: 'employee',
    age: undefined,
    nombre_enfants: undefined,
    date_naissance: '',
    sexe: 'homme',
    chef_de_famille: false
  });

  useEffect(() => {
    if (id) {
      loadEmployee();
    }
  }, [id]);

  const loadEmployee = async () => {
    try {
      const employee = await employeeService.getById(parseInt(id!));
      if (employee) {
        setFormData({
          prenom: employee.prenom,
          nom: employee.nom,
          poste: employee.role || '',
          telephone: employee.telephone || '',
          adresse: employee.adresse || '',
          region: employee.region || '',
          carte_identite: employee.carte_identite || '',
          cnss_code: employee.cnss_code || '',
          statut_civil: employee.statut_civil as 'celibataire' | 'marie' | 'divorce' | undefined,
          role: employee.role,
          age: employee.age,
          nombre_enfants: employee.nombre_enfants || 0,
          date_naissance: employee.date_naissance || '',
          sexe: employee.sexe || 'homme',
          chef_de_famille: employee.chef_de_famille || false
        });
        if (employee.photo) {
          setPhotoPreview(getPhotoUrl(employee.photo));
        }
      }
    } catch (error) {
      console.error('Error loading employee:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de l'employé",
        variant: "destructive"
      });
    }
  };

  const getPhotoUrl = (photoPath?: string) => {
    if (!photoPath) return '';
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
      return photoPath;
    }
    const cleanPath = photoPath.replace(/^\/+/, '');
    return `https://luccibyey.com.tn/${cleanPath}`;
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erreur",
          description: "La photo ne doit pas dépasser 5MB",
          variant: "destructive"
        });
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    setFormData({ ...formData, photo_path: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.prenom || !formData.nom || !formData.carte_identite || !formData.cnss_code || 
        !formData.statut_civil || formData.age === undefined || formData.nombre_enfants === undefined) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const employeeData = {
        prenom: formData.prenom,
        nom: formData.nom,
        telephone: formData.telephone,
        adresse: formData.adresse,
        region: formData.region,
        carte_identite: formData.carte_identite,
        cnss_code: formData.cnss_code,
        statut_civil: formData.statut_civil,
        role: formData.role || formData.poste,
        age: formData.age,
        nombre_enfants: formData.nombre_enfants,
        date_naissance: formData.date_naissance,
        actif: true,
        sexe: formData.sexe,
        chef_de_famille: formData.sexe === 'homme' ? formData.chef_de_famille : false
      };

      if (id) {
        const result = await employeeService.update(parseInt(id), employeeData);
        if (result.success && photoFile) {
          await employeeService.uploadPhoto(parseInt(id), photoFile);
        }
        toast({
          title: "Succès",
          description: "Employé modifié avec succès"
        });
      } else {
        const result = await employeeService.create(employeeData);
        if (result.success && photoFile && result.id) {
          await employeeService.uploadPhoto(result.id, photoFile);
        }
        toast({
          title: "Succès",
          description: "Employé ajouté avec succès"
        });
      }
      navigate('/rh/employes');
    } catch (error) {
      console.error('Error saving employee:', error);
      toast({
        title: "Erreur",
        description: id ? "Erreur lors de la modification" : "Erreur lors de l'ajout",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/rh/employes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{id ? 'Modifier' : 'Ajouter'} un employé</h1>
          <p className="text-muted-foreground">
            {id ? 'Modifiez les informations de l\'employé' : 'Remplissez les informations du nouvel employé'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'employé</CardTitle>
          <CardDescription>Les champs marqués d'un * sont obligatoires</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Upload */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {photoPreview ? (
                  <div className="relative">
                    <img 
                      src={photoPreview} 
                      alt="Photo de profil" 
                      className="w-32 h-32 rounded-full object-cover border-4 border-border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                      onClick={handleRemovePhoto}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-border">
                    <User className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div>
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  required
                  className={!formData.prenom ? 'border-red-500' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                  className={!formData.nom ? 'border-red-500' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="poste">Poste</Label>
                <Input
                  id="poste"
                  value={formData.poste}
                  onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sexe">Sexe</Label>
                <Select
                  value={formData.sexe}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    sexe: value as 'homme' | 'femme',
                    chef_de_famille: value === 'femme' ? false : formData.chef_de_famille
                  })}
                >
                  <SelectTrigger id="sexe">
                    <SelectValue placeholder="Sélectionner le sexe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homme">Homme</SelectItem>
                    <SelectItem value="femme">Femme</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carte_identite">Numéro de carte d'identité *</Label>
                <Input
                  id="carte_identite"
                  value={formData.carte_identite}
                  onChange={(e) => setFormData({ ...formData, carte_identite: e.target.value })}
                  required
                  className={!formData.carte_identite ? 'border-red-500' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnss_code">Numéro CNSS *</Label>
                <Input
                  id="cnss_code"
                  value={formData.cnss_code}
                  onChange={(e) => setFormData({ ...formData, cnss_code: e.target.value })}
                  required
                  className={!formData.cnss_code ? 'border-red-500' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="statut_civil">Situation familiale *</Label>
                <Select
                  value={formData.statut_civil || ''}
                  onValueChange={(value) => setFormData({ ...formData, statut_civil: value as 'celibataire' | 'marie' | 'divorce' })}
                  required
                >
                  <SelectTrigger id="statut_civil" className={!formData.statut_civil ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="celibataire">Célibataire</SelectItem>
                    <SelectItem value="marie">Marié(e)</SelectItem>
                    <SelectItem value="divorce">Divorcé(e)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Âge *</Label>
                <Input
                  id="age"
                  type="number"
                  min="18"
                  max="100"
                  value={formData.age || ''}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value ? parseInt(e.target.value) : undefined })}
                  required
                  className={formData.age === undefined ? 'border-red-500' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_naissance">Date de naissance</Label>
                <Input
                  id="date_naissance"
                  type="date"
                  value={formData.date_naissance}
                  onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre_enfants">Nombre d'enfants *</Label>
                <Input
                  id="nombre_enfants"
                  type="number"
                  min="0"
                  value={formData.nombre_enfants ?? ''}
                  onChange={(e) => setFormData({ ...formData, nombre_enfants: e.target.value ? parseInt(e.target.value) : undefined })}
                  required
                  className={formData.nombre_enfants === undefined ? 'border-red-500' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Région</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employé</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Chef de famille checkbox */}
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="chef_de_famille"
                checked={formData.chef_de_famille || false}
                onChange={(e) => setFormData({ ...formData, chef_de_famille: e.target.checked })}
                disabled={formData.sexe === 'femme'}
                className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Label 
                htmlFor="chef_de_famille" 
                className={formData.sexe === 'femme' ? 'text-muted-foreground' : ''}
              >
                Chef de famille
                {formData.sexe === 'femme' && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (Non disponible pour le sexe féminin)
                  </span>
                )}
              </Label>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/rh/employes')}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !formData.prenom || !formData.nom || !formData.carte_identite || 
                         !formData.cnss_code || !formData.statut_civil || formData.age === undefined || 
                         formData.nombre_enfants === undefined}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  id ? 'Modifier' : 'Ajouter'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
