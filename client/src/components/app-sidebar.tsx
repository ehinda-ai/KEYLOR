import { Link, useLocation } from "wouter";
import {
  Home,
  Key,
  Calendar,
  Mail,
  Settings,
  Phone,
  Euro,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Accueil",
    url: "/",
    icon: Home,
  },
  {
    title: "Vendre",
    url: "/vendre",
    icon: Key,
  },
  {
    title: "Faire gérer",
    url: "/gestion-location",
    icon: Key,
  },
  {
    title: "Nos offres",
    url: "/nos-offres",
    icon: Home,
  },
  {
    title: "Barème",
    url: "/bareme",
    icon: Euro,
  },
  {
    title: "Rendez-vous",
    url: "/rendez-vous",
    icon: Calendar,
  },
  {
    title: "Contact",
    url: "/contact",
    icon: Mail,
  },
  {
    title: "Mon compte",
    url: "/admin",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <Link href="/" onClick={handleLinkClick} className="flex items-center gap-3 hover-elevate rounded-md px-3 py-2">
          <span className="font-serif text-2xl font-light tracking-wider keylor-logo">KEYLOR</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} onClick={handleLinkClick} data-testid={`sidebar-link-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="text-xs text-muted-foreground space-y-2">
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3" />
            <span className="font-medium">06 50 0 2 36 13</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3" />
            <span className="font-medium">contact@keylor.fr</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
