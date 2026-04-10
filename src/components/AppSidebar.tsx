import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, ClipboardList, Settings } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/lib/auth';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pos', icon: ShoppingCart, label: 'Billing (POS)' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="gradient-brand p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-foreground/20 flex items-center justify-center text-lg flex-shrink-0">
            🥥
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-sm font-display font-bold text-primary-foreground tracking-tight">
                St.Xavier Oils
              </h1>
              <p className="text-[10px] text-primary-foreground/70">Purity You Can See</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="gradient-brand">
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary-foreground/50 text-[10px] uppercase tracking-widest">
            {!collapsed ? 'Menu' : ''}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={`transition-all ${
                        isActive
                          ? 'bg-sidebar-accent text-primary-foreground'
                          : 'text-primary-foreground/70 hover:bg-sidebar-accent/50 hover:text-primary-foreground'
                      }`}
                    >
                      <RouterNavLink to={item.to}>
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.label}</span>}
                      </RouterNavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gradient-brand p-3 space-y-2">
        {!collapsed && user && (
          <p className="text-[10px] text-primary-foreground/70 truncate">{user.email}</p>
        )}
        <Button
          variant="secondary"
          size="sm"
          className="w-full text-primary-foreground/90 bg-primary-foreground/10 hover:bg-primary-foreground/20"
          onClick={() => signOut()}
        >
          {collapsed ? 'Out' : 'Sign out'}
        </Button>
        {!collapsed && (
          <p className="text-[10px] text-primary-foreground/40">© 2026 St.Xavier Oils</p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
