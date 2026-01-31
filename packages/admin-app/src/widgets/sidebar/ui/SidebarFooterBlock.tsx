import { useGetCurrentUserQuery } from '@/entities/user';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/ui';

export const SidebarFooterBlock = () => {
  const { data: user } = useGetCurrentUserQuery();

  const userInitials = user?.displayName
    ?.split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .join('');

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            className="group-data-[collapsible=icon]:justify-center transition-all duration-300 ease-in-out"
          >
            {/* Avatar slot (behaves like menu icon) */}
            <span className="flex size-6 shrink-0 items-center justify-center">
              <Avatar className="size-6">
                <AvatarImage src={user?.avatarUrl || ''} />
                <AvatarFallback className="text-[11px] font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </span>

            {/* User name */}
            <span className="font-bold truncate group-data-[collapsible=icon]:hidden">
              {user?.displayName}
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
};
