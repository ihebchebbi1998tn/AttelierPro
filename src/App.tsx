import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { useAutoReload } from "@/hooks/useAutoReload";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ConfigureQuantities from "./pages/ConfigureQuantities";
import ConfigureSpecifications from "./pages/ConfigureSpecifications";

import Produits from "./pages/Produits";
import ProductDetails from "./pages/ProductDetails";
import ProductionPlanning from "./pages/ProductionPlanning";
import Productions from "./pages/Productions";
import ProductionStatistics from "./pages/ProductionStatistics";
import BatchDetails from "./pages/BatchDetails";
import Commandes from "./pages/Commandes";
import CommandeDetails from "./pages/CommandeDetails";
import Transactions from "./pages/Transactions";
import TransactionsAnalytics from "./pages/TransactionsAnalytics";
import Stock from "./pages/Stock";
import GlobalStockView from "./pages/GlobalStockView";
import MaterialDetails from "./pages/MaterialDetails";
import MaterialAudit from "./pages/MaterialAudit";
import AddMaterial from "./pages/AddMaterial";
import EditMaterial from "./pages/EditMaterial";
import Categories from "./pages/Categories";
import ClientsExternes from "./pages/ClientsExternes";
import ClientsSoustraitance from "./pages/ClientsSoustraitance";
import ClientSoustraitanceDetails from "./pages/ClientSoustraitanceDetails";
import SoustraitanceProducts from "./pages/SoustraitanceProducts";
import SoustraitanceProductDetails from "./pages/SoustraitanceProductDetails";
import SoustraitanceProductionPlanning from "./pages/SoustraitanceProductionPlanning";
import AddSoustraitanceProduct from "./pages/AddSoustraitanceProduct";
import SoustraitanceSettings from "./pages/SoustraitanceSettings";
import Utilisateurs from "./pages/Utilisateurs";
import ConfigurerMateriaux from "./pages/ConfigurerMateriaux";
import ConfigurerMateriauxSoustraitance from "./pages/ConfigurerMateriauxSoustraitance";
import Boutiques from "./pages/Boutiques";
import LucciBYEy from "./pages/LucciBYEy";
import Spadadibattaglia from "./pages/Spadadibattaglia";
import LucciProductDetails from "./pages/LucciProductDetails";
import SpadaProductDetails from "./pages/SpadaProductDetails";
import MainLayout from "./components/layout/MainLayout";
import NotFound from "./pages/NotFound";
import GestionRH from "./pages/GestionRH";
import { ProtectedRHRoute } from "./components/ProtectedRHRoute";
import Employes from "./pages/rh/Employes";
import EmployeDetails from "./pages/rh/EmployeDetails";
import EmployeForm from "./pages/rh/EmployeForm";
import Planning from "./pages/rh/Planning";
import TeamPlanning from "./pages/rh/TeamPlanning";
import Conges from "./pages/rh/Conges";
import Salaires from "./pages/rh/Salaires";
import Statistiques from "./pages/rh/Statistiques";
import SalaryConfiguration from "./pages/SalaryConfiguration";
import DefinirSalaire from "./pages/rh/DefinirSalaire";

const queryClient = new QueryClient();

const AppContent = () => {
  // Enable auto-reload every 24 hours to ensure users have the latest version
  useAutoReload();

  return (
    <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
          
          <Route path="/produits" element={<MainLayout><Produits /></MainLayout>} />
          <Route path="/produits/:id" element={<MainLayout><ProductDetails /></MainLayout>} />
          <Route path="/produits/:id/production-planning" element={<MainLayout><ProductionPlanning /></MainLayout>} />
          <Route path="/produits/:productId/configurer-materiaux" element={<MainLayout><ConfigurerMateriaux /></MainLayout>} />
          <Route path="/soustraitance-products/:productId/configurer-materiaux" element={<MainLayout><ConfigurerMateriauxSoustraitance /></MainLayout>} />
          <Route path="/productions" element={<MainLayout><Productions /></MainLayout>} />
          <Route path="/productions-statistics" element={<MainLayout><ProductionStatistics /></MainLayout>} />
          <Route path="/productions/:id" element={<MainLayout><BatchDetails /></MainLayout>} />
          <Route path="/commandes" element={<MainLayout><Commandes /></MainLayout>} />
          <Route path="/commandes/:id" element={<MainLayout><CommandeDetails /></MainLayout>} />
          <Route path="/transactions" element={<MainLayout><Transactions /></MainLayout>} />
          <Route path="/transactions-analytics" element={<MainLayout><TransactionsAnalytics /></MainLayout>} />
          <Route path="/stock" element={<MainLayout><Stock /></MainLayout>} />
          <Route path="/global-stock-view" element={<MainLayout><GlobalStockView /></MainLayout>} />
          <Route path="/material-details/:id" element={<MainLayout><MaterialDetails /></MainLayout>} />
          <Route path="/material-audit/:id" element={<MainLayout><MaterialAudit /></MainLayout>} />
          <Route path="/add-material" element={<MainLayout><AddMaterial /></MainLayout>} />
          <Route path="/edit-material/:id" element={<MainLayout><EditMaterial /></MainLayout>} />
          <Route path="/categories" element={<MainLayout><Categories /></MainLayout>} />
          <Route path="/clients-externes" element={<MainLayout><ClientsExternes /></MainLayout>} />
          <Route path="/clients-soustraitance" element={<MainLayout><ClientsSoustraitance /></MainLayout>} />
          <Route path="/clients-soustraitance/:id" element={<MainLayout><ClientSoustraitanceDetails /></MainLayout>} />
          <Route path="/soustraitance-products" element={<MainLayout><SoustraitanceProducts /></MainLayout>} />
          <Route path="/soustraitance-products/:id" element={<MainLayout><SoustraitanceProductDetails /></MainLayout>} />
          <Route path="/soustraitance-products/:id/production-planning" element={<MainLayout><SoustraitanceProductionPlanning /></MainLayout>} />
          <Route path="/soustraitance-products/add" element={<MainLayout><AddSoustraitanceProduct /></MainLayout>} />
          <Route path="/soustraitance-products/edit/:id" element={<MainLayout><AddSoustraitanceProduct /></MainLayout>} />
          <Route path="/soustraitance-settings" element={<MainLayout><SoustraitanceSettings /></MainLayout>} />
          <Route path="/utilisateurs" element={<MainLayout><Utilisateurs /></MainLayout>} />
          <Route path="/boutiques" element={<MainLayout><Boutiques /></MainLayout>} />
          <Route path="/lucci-by-ey" element={<MainLayout><LucciBYEy /></MainLayout>} />
          <Route path="/lucci-by-ey/:id" element={<MainLayout><LucciProductDetails /></MainLayout>} />
          <Route path="/spadadibattaglia" element={<MainLayout><Spadadibattaglia /></MainLayout>} />
          <Route path="/spadadibattaglia/:id" element={<MainLayout><SpadaProductDetails /></MainLayout>} />

          {/* Production transfer wizard */}
          <Route path="/production/transfer/:boutique/:id/quantities" element={<MainLayout><React.Suspense><ConfigureQuantities /></React.Suspense></MainLayout>} />
          <Route path="/production/transfer/:boutique/:id/specifications" element={<MainLayout><React.Suspense><ConfigureSpecifications /></React.Suspense></MainLayout>} />
          
          {/* Routes RH - Protected */}
          <Route path="/rh" element={<MainLayout><ProtectedRHRoute><GestionRH /></ProtectedRHRoute></MainLayout>} />
          <Route path="/rh/employes" element={<MainLayout><ProtectedRHRoute><Employes /></ProtectedRHRoute></MainLayout>} />
          <Route path="/rh/employes/add" element={<MainLayout><ProtectedRHRoute><EmployeForm /></ProtectedRHRoute></MainLayout>} />
          <Route path="/rh/employes/edit/:id" element={<MainLayout><ProtectedRHRoute><EmployeForm /></ProtectedRHRoute></MainLayout>} />
          <Route path="/rh/employes/:id" element={<MainLayout><ProtectedRHRoute><EmployeDetails /></ProtectedRHRoute></MainLayout>} />
          <Route path="/rh/planning" element={<MainLayout><ProtectedRHRoute><Planning /></ProtectedRHRoute></MainLayout>} />
          <Route path="/rh/planning/team" element={<MainLayout><ProtectedRHRoute><TeamPlanning /></ProtectedRHRoute></MainLayout>} />
          <Route path="/rh/conges" element={<MainLayout><ProtectedRHRoute><Conges /></ProtectedRHRoute></MainLayout>} />
          <Route path="/rh/salaires" element={<MainLayout><ProtectedRHRoute><Salaires /></ProtectedRHRoute></MainLayout>} />
          <Route path="/rh/salaires/configuration" element={<MainLayout><ProtectedRHRoute><SalaryConfiguration /></ProtectedRHRoute></MainLayout>} />
          <Route path="/rh/salaires/definir" element={<MainLayout><ProtectedRHRoute><DefinirSalaire /></ProtectedRHRoute></MainLayout>} />
          <Route path="/rh/statistiques" element={<MainLayout><ProtectedRHRoute><Statistiques /></ProtectedRHRoute></MainLayout>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
