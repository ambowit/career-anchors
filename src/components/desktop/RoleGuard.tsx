import { useMemo, useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import type { RoleType } from "@/lib/permissions";

interface RoleGuardProps {
  allowedRoles: RoleType[];
  children: React.ReactNode;
  fallbackPath?: string;
}

const PROFILE_LOAD_TIMEOUT_MS = 5000;

export default function RoleGuard({
  allowedRoles,
  children,
  fallbackPath = "/auth",
}: RoleGuardProps) {
  const { user, loading, profile, refreshProfile } = useAuth();
  const { roleType, consolePath } = usePermissions();
  const [profileTimedOut, setProfileTimedOut] = useState(false);
  const [roleRetried, setRoleRetried] = useState(false);
  const retryingRef = useRef(false);

  // ALL hooks MUST be called before any conditional returns (Rules of Hooks)

  // Collect ALL user roles (primary + additional) for access check
  const userHasAllowedRole = useMemo(() => {
    if (!roleType) return false;
    if (allowedRoles.includes(roleType)) return true;
    if (profile?.additional_roles && Array.isArray(profile.additional_roles)) {
      return profile.additional_roles.some(
        (roleEntry) =>
          allowedRoles.includes(roleEntry.role_type as RoleType),
      );
    }
    return false;
  }, [roleType, profile?.additional_roles, allowedRoles]);

  // When user exists but profile hasn't loaded yet, try refreshing
  useEffect(() => {
    if (user && !profile && !loading) {
      refreshProfile();
      const timer = setTimeout(
        () => setProfileTimedOut(true),
        PROFILE_LOAD_TIMEOUT_MS,
      );
      return () => clearTimeout(timer);
    }
    if (profile) {
      setProfileTimedOut(false);
    }
  }, [user, profile, loading, refreshProfile]);

  // If profile is loaded but role doesn't match allowed roles,
  // try refreshing once — the profile might be stale from a previous login
  useEffect(() => {
    if (
      user &&
      profile &&
      !loading &&
      !userHasAllowedRole &&
      !roleRetried &&
      !retryingRef.current
    ) {
      retryingRef.current = true;
      refreshProfile().then(() => {
        setRoleRetried(true);
        retryingRef.current = false;
      });
    }
  }, [user, profile, loading, userHasAllowedRole, roleRetried, refreshProfile]);

  // Reset retry flag when allowed roles change (navigating to different guard)
  useEffect(() => {
    setRoleRetried(false);
    retryingRef.current = false;
  }, [allowedRoles.join(",")]);

  // --- Conditional returns (after all hooks) ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">加载中...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Wait for profile to load before checking role
  if (!profile && !profileTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">
            加载用户信息...
          </span>
        </div>
      </div>
    );
  }

  // If role doesn't match and we haven't retried yet, show loading while retrying
  if (!userHasAllowedRole && !roleRetried && profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">验证权限...</span>
        </div>
      </div>
    );
  }

  if (!userHasAllowedRole) {
    return <Navigate to={consolePath} replace />;
  }

  return <>{children}</>;
}
