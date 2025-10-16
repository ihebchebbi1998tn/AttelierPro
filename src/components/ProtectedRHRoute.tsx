import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { RHPasswordProtection } from "./RHPasswordProtection";

interface ProtectedRHRouteProps {
  children: React.ReactNode;
}

export const ProtectedRHRoute = ({ children }: ProtectedRHRouteProps) => {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user has RH access permission
    const rhAccess = sessionStorage.getItem("rh_access");
    if (rhAccess === "granted") {
      setHasAccess(true);
    } else {
      setShowPasswordDialog(true);
    }
  }, [location.pathname]);

  const handlePasswordSuccess = () => {
    setHasAccess(true);
    setShowPasswordDialog(false);
  };

  const handlePasswordCancel = () => {
    setShowPasswordDialog(false);
    navigate("/dashboard");
  };

  if (!hasAccess) {
    return (
      <RHPasswordProtection
        isOpen={showPasswordDialog}
        onSuccess={handlePasswordSuccess}
        onCancel={handlePasswordCancel}
      />
    );
  }

  return <>{children}</>;
};