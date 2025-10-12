import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { RHPasswordProtection } from "../RHPasswordProtection";
import {
  Package2,
  Home,
  Package,
  ShoppingCart,
  Users,
  Settings,
  FileText,
  TrendingUp,
  LogOut,
  UserCheck,
  BarChart3,
  Factory,
  ExternalLink,
  Globe,
  Building2,
  UsersIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { SurMesureNotifications } from "@/components/SurMesureNotifications";

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Tableau de bord",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Sur Mesure",
    href: "/commandes",
    icon: ShoppingCart,
    roles: ["admin", "production"],
  },
  {
    title: "Boutiques",
    href: "/boutiques",
    icon: ExternalLink,
    roles: ["admin", "production"],
  },
  {
    title: "Produits",
    href: "/produits",
    icon: Package,
    roles: ["admin", "production"],
  },
  {
    title: "Productions",
    href: "/productions",
    icon: Factory,
    roles: ["admin", "production"],
  },
  {
    title: "Stock",
    href: "/stock",
    icon: TrendingUp,
    roles: ["admin", "production", "sous_traitance"],
  },
  {
    title: "Transactions",
    href: "/transactions",
    icon: FileText,
    roles: ["admin", "production"],
  },
  {
    title: "Clients Sur Mesure",
    href: "/clients-externes",
    icon: UserCheck,
    roles: ["admin", "production"],
  },
  {
    title: "Sous Traitance",
    href: "/clients-soustraitance",
    icon: Building2,
    roles: ["admin", "production"],
  },
  {
    title: "Produits Sous-traitance",
    href: "/soustraitance-products",
    icon: Package,
    roles: ["admin", "production", "sous_traitance"],
  },
  {
    title: "Paramètres",
    href: "/soustraitance-settings",
    icon: Settings,
    roles: ["sous_traitance"],
  },
  {
    title: "Gestion RH",
    href: "/rh/employes",
    icon: UsersIcon,
    roles: ["admin", "rh"],
  },
];

interface AppSidebarProps {
  currentUser: any;
  onLogout: () => void;
  isMobile: boolean;
}

export function AppSidebar({ currentUser, onLogout, isMobile }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showRHPassword, setShowRHPassword] = useState(false);
  const { setOpenMobile } = useSidebar();

  const filteredItems = sidebarItems.filter(item => 
    !item.roles || item.roles.includes(currentUser?.role || "")
  );

  const handleRHAccess = () => {
    // Check if user already has RH access
    const rhAccess = sessionStorage.getItem("rh_access");
    if (rhAccess === "granted") {
      navigate("/rh/employes");
      // Close sidebar on mobile after navigation
      if (isMobile) {
        setOpenMobile(false);
      }
    } else {
      setShowRHPassword(true);
    }
  };

  const handleRHPasswordSuccess = () => {
    setShowRHPassword(false);
    navigate("/rh/employes");
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleRHPasswordCancel = () => {
    setShowRHPassword(false);
  };

  const handleNavigation = (href: string) => {
    // Close sidebar on mobile when navigation item is clicked
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const getNavClassName = (href: string) => {
    // Check for exact match or if current path starts with the href (for nested routes)
    const isActive = location.pathname === href || 
                    (href !== '/dashboard' && location.pathname.startsWith(href));
    return cn(
      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all min-h-[48px]",
      isActive
        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    );
  };

  return (
    <Sidebar 
      variant="sidebar" 
      collapsible={isMobile ? "icon" : "none"} 
      className="border-r border-sidebar-border bg-sidebar h-screen flex flex-col w-64 relative"
    >
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0">
            <Package2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col flex-1">
            <span className="font-playfair text-xl font-bold text-sidebar-foreground tracking-wide">
              AttelierPro
            </span>
            <span className="text-xs text-sidebar-foreground/60 font-medium">
              Production System
            </span>
          </div>
          {/* Notifications Bell */}
          <div className="ml-2">
            <SurMesureNotifications />
          </div>
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="px-2 bg-sidebar flex-1 overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-3 text-xs font-medium text-sidebar-foreground/70">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-1">
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild>
                    {item.href === "/rh/employes" ? (
                      <button
                        onClick={handleRHAccess}
                        className={getNavClassName(item.href)}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span className="truncate font-medium">{item.title}</span>
                      </button>
                    ) : (
                      <Link
                        to={item.href}
                        className={getNavClassName(item.href)}
                        onClick={() => handleNavigation(item.href)}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span className="truncate font-medium">{item.title}</span>
                      </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border p-4 bg-sidebar flex-shrink-0">
        <div className="mb-3 space-y-1">
          <div className="text-xs font-medium text-sidebar-foreground">
            Connecté: <strong>{currentUser?.username}</strong>
          </div>
          <div className="text-xs text-sidebar-foreground/70">
            Rôle: {currentUser?.role}
          </div>
        </div>
        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full justify-start h-10 bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border hover:bg-sidebar-accent/80"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="ml-2">Déconnexion</span>
        </Button>
      </SidebarFooter>

      {/* RH Password Protection Dialog */}
      <RHPasswordProtection
        isOpen={showRHPassword}
        onSuccess={handleRHPasswordSuccess}
        onCancel={handleRHPasswordCancel}
      />
    </Sidebar>
  );
}

export default AppSidebar;