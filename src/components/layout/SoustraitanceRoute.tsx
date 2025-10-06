import { Navigate } from "react-router-dom";
import { authService } from "@/lib/authService";

interface SoustraitanceRouteProps {
  children: React.ReactNode;
}

const SoustraitanceRoute = ({ children }: SoustraitanceRouteProps) => {
  const user = authService.getCurrentUser();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  // Only allow sous_traitance users
  if (user.role !== 'sous_traitance' && user.user_type !== 'sous_traitance') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

export default SoustraitanceRoute;
