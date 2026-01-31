import { NavLink } from 'react-router';
import { Home, Globe } from 'lucide-react';
import { APP_PATH } from '@/shared/config';
import { cn } from '@/shared/lib/utils';

const navItems = [
  { path: APP_PATH.MAIN, label: 'Home', icon: Home },
  { path: APP_PATH.SITES, label: 'Sites', icon: Globe },
];

export function Sidebar() {
  return (
    <aside className="w-64 h-screen border-r bg-card flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">AI Onboarding</h1>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  )
                }
              >
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
