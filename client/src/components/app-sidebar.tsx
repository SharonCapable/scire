import { Home, BookOpen, Heart, LayoutDashboard, Library, GraduationCap, BarChart3, Plus, Users, User, Bell } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
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
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const studentItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Interests",
    url: "/interests",
    icon: Heart,
  },
  {
    title: "Browse Courses",
    url: "/courses",
    icon: Library,
  },
];

const educatorItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Manage Courses",
    url: "/admin/courses",
    icon: BookOpen,
  },
  {
    title: "Create Course",
    url: "/admin/course/new",
    icon: Plus,
  },
];

const sharedItems = [
  {
    title: "All Courses",
    url: "/courses",
    icon: Library,
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const isEducator = user?.role === "educator" || user?.isAdmin;
  const primaryItems = isEducator ? educatorItems : studentItems;

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.username?.[0]?.toUpperCase() || 'U';

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-lg font-bold text-primary-foreground">S</span>
          </div>
          <div>
            <h2 className="font-bold font-heading text-lg">SCIRE</h2>
            <p className="text-xs text-sidebar-foreground/60">
              {isEducator ? "Educator Portal" : "Learning Platform"}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {isEducator ? "Management" : "Learning"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isEducator && (
          <SidebarGroup>
            <SidebarGroupLabel>Analytics</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/admin/analytics"}>
                    <Link href="/admin/analytics">
                      <BarChart3 />
                      <span>Student Analytics</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/admin/students"}>
                    <Link href="/admin/students">
                      <Users />
                      <span>Students</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Explore</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sharedItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <Link href="/profile">
          <div className="flex items-center gap-3 cursor-pointer hover:bg-sidebar-accent rounded-lg p-2 -m-2 transition-colors">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.picture} alt={user?.name || user?.username} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.name || user?.username}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {isEducator ? (
                    <>
                      <BookOpen className="w-3 h-3 mr-1" />
                      Educator
                    </>
                  ) : (
                    <>
                      <GraduationCap className="w-3 h-3 mr-1" />
                      Student
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </div>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
