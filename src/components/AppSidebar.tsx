import {
  LayoutDashboard, Users, ClipboardCheck, Puzzle, BookOpen, UserCog,
  Library, Wrench, Building2
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const mainItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Studenti', url: '/studenti', icon: Users },
  { title: 'Test', url: '/test', icon: ClipboardCheck },
  { title: 'Class Builder', url: '/class-builder', icon: Puzzle },
  { title: 'Registro', url: '/registro', icon: BookOpen },
  { title: 'Insegnanti', url: '/insegnanti', icon: UserCog },
];

const futureItems = [
  { title: 'Biblioteca', icon: Library },
  { title: 'Laboratori', icon: Wrench },
  { title: 'Ufficio', icon: Building2 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">🌱 SEMI FORESTI</span>
          </div>
        )}
        {collapsed && <span className="text-xl">🌱</span>}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">Moduli</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">Prossimamente</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {futureItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton disabled className="opacity-40 cursor-not-allowed">
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right">Coming soon</TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && <p className="text-xs text-sidebar-foreground/60">v1.0 MVP</p>}
      </SidebarFooter>
    </Sidebar>
  );
}
