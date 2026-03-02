import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronsUpDown, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  type RoleType,
  getRoleLabel,
  getConsolePath,
} from "@/lib/permissions";
import type { AdditionalRole } from "@/hooks/useAdminData";

interface RoleSwitcherProps {
  collapsed?: boolean;
}

export default function RoleSwitcher({ collapsed = false }: RoleSwitcherProps) {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { profile, refreshProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentRoleType = (profile?.role_type as RoleType) || "individual";
  const additionalRoles: AdditionalRole[] = Array.isArray((profile as any)?.additional_roles)
    ? ((profile as any).additional_roles as AdditionalRole[])
    : [];

  // No additional roles — don't render
  if (additionalRoles.length === 0) return null;

  const allRoles = [
    {
      roleType: currentRoleType,
      organizationId: profile?.organization_id || null,
      organizationName: null as string | null,
      isCurrent: true,
    },
    ...additionalRoles.map((additionalRole) => ({
      roleType: additionalRole.role_type as RoleType,
      organizationId: additionalRole.organization_id,
      organizationName: additionalRole.organization_name || null,
      isCurrent: false,
    })),
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitchRole = async (targetRole: typeof allRoles[0]) => {
    if (targetRole.isCurrent || isSwitching) return;

    setIsSwitching(true);
    try {
      // Swap: current primary → additional, target additional → primary
      const newAdditionalRoles: AdditionalRole[] = additionalRoles
        .filter(
          (additionalRole) =>
            !(additionalRole.role_type === targetRole.roleType && additionalRole.organization_id === targetRole.organizationId)
        )
        .concat({
          role_type: currentRoleType,
          organization_id: profile?.organization_id || null,
          organization_name: null,
          department_id: profile?.department_id || null,
        });

      const { error } = await supabase
        .from("profiles")
        .update({
          role_type: targetRole.roleType,
          organization_id: targetRole.organizationId,
          additional_roles: newAdditionalRoles,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile!.id);

      if (error) throw error;

      await refreshProfile();

      const targetConsolePath = getConsolePath(targetRole.roleType as RoleType);
      toast.success(
        language === "en"
          ? `Switched to ${getRoleLabel(targetRole.roleType as RoleType, language)}`
          : language === "zh-TW"
            ? `已切換至${getRoleLabel(targetRole.roleType as RoleType, language)}`
            : `已切换至${getRoleLabel(targetRole.roleType as RoleType, language)}`
      );

      setIsOpen(false);
      navigate(targetConsolePath);
    } catch {
      toast.error(language === "en" ? "Failed to switch role" : language === "zh-TW" ? "切換角色失敗" : "切换角色失败");
    } finally {
      setIsSwitching(false);
    }
  };

  const roleColorMap: Record<string, string> = {
    super_admin: "bg-red-500/20 text-red-400",
    org_admin: "bg-blue-500/20 text-blue-400",
    hr: "bg-sky-500/20 text-sky-400",
    department_manager: "bg-indigo-500/20 text-indigo-400",
    employee: "bg-slate-500/20 text-slate-400",
    consultant: "bg-emerald-500/20 text-emerald-400",
    client: "bg-teal-500/20 text-teal-400",
    individual: "bg-gray-500/20 text-gray-400",
  };

  if (collapsed) {
    return (
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          title={language === "en" ? "Switch Role" : language === "zh-TW" ? "切換角色" : "切换角色"}
        >
          <ChevronsUpDown className="w-[18px] h-[18px]" />
        </button>

        {isOpen && (
          <div className="absolute left-full bottom-0 ml-2 w-56 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50">
            <div className="px-3 py-1.5 text-[10px] text-slate-500 uppercase tracking-wider">
              {language === "en" ? "Switch Role" : language === "zh-TW" ? "切換角色" : "切换角色"}
            </div>
            {allRoles.map((roleItem, index) => (
              <button
                key={`${roleItem.roleType}-${roleItem.organizationId}-${index}`}
                onClick={() => handleSwitchRole(roleItem)}
                disabled={isSwitching}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                  roleItem.isCurrent
                    ? "text-white bg-white/5"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", roleColorMap[roleItem.roleType] || "bg-gray-500/20 text-gray-400")}>
                  {getRoleLabel(roleItem.roleType as RoleType, language)}
                </span>
                {roleItem.organizationName && (
                  <span className="text-[11px] text-slate-500 truncate">
                    {roleItem.organizationName}
                  </span>
                )}
                {roleItem.isCurrent && <Check className="w-3.5 h-3.5 ml-auto text-emerald-400 flex-shrink-0" />}
              </button>
            ))}
            {isSwitching && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap", roleColorMap[currentRoleType] || "bg-gray-500/20 text-gray-400")}>
            {getRoleLabel(currentRoleType, language)}
          </span>
          <span className="text-xs text-slate-400 truncate">
            {language === "en" ? "Current" : language === "zh-TW" ? "目前" : "当前"}
          </span>
        </div>
        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 w-full mb-1 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50">
          <div className="px-3 py-1.5 text-[10px] text-slate-500 uppercase tracking-wider">
            {language === "en" ? "Switch Role" : language === "zh-TW" ? "切換角色" : "切换角色"}
          </div>
          {allRoles.map((roleItem, index) => (
            <button
              key={`${roleItem.roleType}-${roleItem.organizationId}-${index}`}
              onClick={() => handleSwitchRole(roleItem)}
              disabled={isSwitching}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors",
                roleItem.isCurrent
                  ? "text-white bg-white/5"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap", roleColorMap[roleItem.roleType] || "bg-gray-500/20 text-gray-400")}>
                {getRoleLabel(roleItem.roleType as RoleType, language)}
              </span>
              {roleItem.organizationName && (
                <span className="text-[11px] text-slate-500 truncate">
                  {roleItem.organizationName}
                </span>
              )}
              {roleItem.isCurrent && <Check className="w-3.5 h-3.5 ml-auto text-emerald-400 flex-shrink-0" />}
            </button>
          ))}
          {isSwitching && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
