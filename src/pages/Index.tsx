import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Login from "./Login";
import { authService } from "@/lib/authService";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Check URL parameter for signup mode
      const mode = searchParams.get('mode');
      
      // Check if user is already authenticated
      if (authService.isAuthenticated()) {
        // Verify token with server
        const response = await authService.verifyToken();
        if (response.success) {
          navigate("/dashboard");
          return;
        } else {
          // Token invalid, clear storage
          authService.logout();
        }
      }
      
      // Show login page
      setShowLogin(true);
      setIsLoading(false);
      
      // If mode=signup, we'll handle this in the Login component
    };

    checkAuth();
  }, [navigate, searchParams]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showLogin) {
    return <Login />;
  }

  return null;
};

export default Index;
