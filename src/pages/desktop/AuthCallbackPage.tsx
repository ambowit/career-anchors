import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getConsolePath } from "@/lib/permissions";
import type { RoleType } from "@/lib/permissions";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Auth callback error:", error);
        navigate("/auth?error=callback_failed");
        return;
      }

      if (data.session) {
        // On mobile, always land on user home — admin consoles are desktop-only
        const isMobileView = window.innerWidth < 768;
        if (isMobileView) {
          navigate("/");
        } else {
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("role_type")
            .eq("id", data.session.user.id)
            .single();
          const consolePath = getConsolePath((userProfile?.role_type || "individual") as RoleType);
          navigate(consolePath !== "/" ? consolePath : "/");
        }
      } else {
        navigate("/auth");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">正在验证登录状态...</p>
      </div>
    </div>
  );
}
