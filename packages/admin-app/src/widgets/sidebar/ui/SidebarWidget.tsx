import { Link, NavLink } from 'react-router';
import { Home, Globe, Plus, User2 } from 'lucide-react';
import { APP_PATH } from '@/shared/config';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/shared/ui';
import { SidebarFooterBlock } from './SidebarFooterBlock';

const navItems = [
  { path: APP_PATH.MAIN, label: 'Home', icon: Home },
  { path: APP_PATH.SITES, label: 'Sites', icon: Globe },
];

export function SidebarWidget() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex w-full">
            <Link to={APP_PATH.MAIN}>
              <h1
                className="text-xl flex-1 font-bold whitespace-nowrap transition-[opacity,width] duration-300 ease-in-out
          group-data-[state=collapsed]:opacity-0
          group-data-[state=collapsed]:w-0
          group-data-[state=collapsed]:overflow-hidden"
              >
                AI Onboarding
              </h1>
            </Link>

            <SidebarTrigger className="ml-auto" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton asChild>
                  <Link to={item.path}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooterBlock />
    </Sidebar>
  );
}
