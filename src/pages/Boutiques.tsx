import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Boutiques = () => {
  const navigate = useNavigate();

  const boutiques = [
    {
      id: 'lucci-by-ey',
      name: 'Lucci By Ey',
      route: '/lucci-by-ey',
      image: '/lucci-by-ey-logo.png'
    },
    {
      id: 'spadadibattaglia',
      name: 'Spada di Battaglia',
      route: '/spadadibattaglia',
      image: '/spada-di-battaglia-logo.png'
    }
  ];

  const handleBoutiqueClick = (route: string) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Boutiques</h1>
            <p className="text-muted-foreground">Sélectionnez une boutique pour gérer ses produits</p>
          </div>
        </div>
      </div>

      {/* Boutiques Cards */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {boutiques.map((boutique) => (
            <Card 
              key={boutique.id}
              className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] overflow-hidden"
              onClick={() => handleBoutiqueClick(boutique.route)}
            >
              <CardHeader className="p-0">
                <div className="relative h-64 overflow-hidden bg-white flex items-center justify-center">
                  <img 
                    src={boutique.image}
                    alt={boutique.name}
                    className="max-h-48 w-auto object-contain p-8 transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CardTitle className="text-2xl font-bold text-center group-hover:text-primary transition-colors">
                  {boutique.name}
                </CardTitle>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Boutiques;