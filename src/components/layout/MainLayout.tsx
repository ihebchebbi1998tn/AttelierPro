import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "./Sidebar";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Menu, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/");
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
    } catch (error) {
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès",
    });
    navigate("/");
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="h-screen flex w-full bg-background overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="fixed left-0 top-0 h-full z-40 lg:block hidden">
          <AppSidebar currentUser={currentUser} onLogout={handleLogout} isMobile={false} />
        </div>

        {/* Mobile Sidebar */}
        <div className="lg:hidden">
          <AppSidebar currentUser={currentUser} onLogout={handleLogout} isMobile={true} />
        </div>
        
        <div className="flex-1 flex flex-col lg:ml-64">
          {/* Mobile Header */}
          <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-background/95 backdrop-blur lg:hidden supports-[backdrop-filter]:bg-background/60 flex-shrink-0 relative z-50">
            <SidebarTrigger>
              <Button variant="ghost" size="sm" className="hover:bg-accent">
                <Menu className="h-5 w-5" />
              </Button>
            </SidebarTrigger>
            <h1 className="text-base font-semibold text-foreground">Stock & Production</h1>
            
            {/* User Avatar with Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full p-0 hover:bg-accent">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {currentUser?.nom?.charAt(0)?.toUpperCase() || currentUser?.prenom?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover border border-border shadow-lg z-50">
                <DropdownMenuItem className="flex items-center gap-2 cursor-default">
                  <User className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {currentUser?.prenom} {currentUser?.nom}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {currentUser?.email}
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50">
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main className="flex-1 overflow-y-auto bg-muted/20">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;