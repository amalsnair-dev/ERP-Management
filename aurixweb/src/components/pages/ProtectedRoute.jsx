import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  getPreferredModulePath,
  hasFrameAccess,
  isAuthenticated,
  setCurrentModule,
} from "../../utils/session";

/**
 * ProtectedRoute
 * Restricts access to authenticated users only.
 * Redirects to /signin if user is not logged in.
 */
const ProtectedRoute = ({ children, routePath, requiredFrame }) => {
  const location = useLocation();

  useEffect(() => {
    setCurrentModule(routePath || location.pathname);
  }, [location.pathname, routePath]);

  if (!isAuthenticated()) {
    return <Navigate to="/signin" replace />;
  }

  if (!hasFrameAccess(requiredFrame)) {
    const fallbackPath = getPreferredModulePath();
    return <Navigate to={fallbackPath || "/signin"} replace />;
  }

  return children;
};

export default ProtectedRoute;
