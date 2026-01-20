import { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { 
  Home, 
  TrendingUp, 
  Layers, 
  MessageCircle, 
  Grid3X3, 
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserCircle,
  Settings2,
  Workflow,
  CalendarDays
} from "lucide-react";
import { useTeamRole } from "@/hooks/useTeamRole";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TeamSidebarProps {
  teamName: string;
  teamLogo?: string | null;
}

// Main navigation items (visible to all)
const mainNavItems = [
  { id: "home", label: "Team Hub", icon: Home, path: "" },
  { id: "crm", label: "Sales CRM", icon: TrendingUp, path: "/crm" },
  { id: "funnels", label: "Funnels", icon: Layers, path: "/funnels" },
  { id: "automations", label: "Workflows", icon: Workflow, path: "/automations" },
  { id: "schedule", label: "Schedule", icon: CalendarDays, path: "/schedule" },
  { id: "chat", label: "Team Chat", icon: MessageCircle, path: "/chat" },
  { id: "apps", label: "Apps", icon: Grid3X3, path: "/apps" },
];

export function TeamSidebar({ teamName, teamLogo }: TeamSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { teamId } = useParams();
  const { isAdmin } = useTeamRole(teamId);
  
  const basePath = `/team/${teamId}`;
  
  const isActive = (path: string) => {
    const fullPath = `${basePath}${path}`;
    if (path === "") {
      return location.pathname === basePath || location.pathname === `${basePath}/`;
    }
    return location.pathname.startsWith(fullPath);
  };

  const handleNavigation = (path: string) => {
    navigate(`${basePath}${path}`);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderNavButton = (item: typeof mainNavItems[0], active: boolean) => {
    const NavButton = (
      <Button
        key={item.id}
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3 h-11 transition-all",
          collapsed && "justify-center px-0",
          active 
            ? "bg-primary/10 text-primary font-medium" 
            : "text-sidebar-foreground/70 hover:text-primary hover:bg-primary/10"
        )}
        onClick={() => handleNavigation(item.path)}
      >
        <item.icon className={cn("h-5 w-5 shrink-0", active && "text-primary")} />
        {!collapsed && <span>{item.label}</span>}
      </Button>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.id} delayDuration={0}>
          <TooltipTrigger asChild>
            {NavButton}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return NavButton;
  };

  return (
    <aside 
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Team Header */}
      <div className={cn(
        "p-4 border-b border-sidebar-border flex items-center gap-3",
        collapsed && "justify-center"
      )}>
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={teamLogo || undefined} alt={teamName} />
          <AvatarFallback className="bg-gradient-brand text-white text-sm font-semibold">
            {getInitials(teamName)}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sidebar-foreground truncate">{teamName}</h2>
            <p className="text-xs text-sidebar-foreground/60">Team Workspace</p>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => renderNavButton(item, isActive(item.path)))}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-sidebar-border space-y-1">

        {/* Profile Settings */}
        {renderNavButton(
          { id: "settings", label: "Profile Settings", icon: UserCircle, path: "/settings" },
          isActive("/settings")
        )}

        {/* Admin-only links */}
        {isAdmin && (
          renderNavButton(
            { id: "team-settings", label: "Team Settings", icon: Settings2, path: "/team-settings" },
            isActive("/team-settings")
          )
        )}

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-10 text-sidebar-foreground/60 hover:text-sidebar-foreground",
            collapsed && "justify-center px-0"
          )}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span>Collapse</span>
            </>
          )}
        </Button>

        {/* Exit Team */}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-10 text-destructive hover:text-destructive hover:bg-destructive/10",
            collapsed && "justify-center px-0"
          )}
          onClick={() => navigate("/login")}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Exit Team</span>}
        </Button>
      </div>
    </aside>
  );
}
