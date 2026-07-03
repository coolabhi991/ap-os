import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Building2,
  HardHat,
  ShoppingCart,
  Receipt,
  Landmark,
  BarChart3,
  Settings,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const menus = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Projects",
    path: "/projects",
    icon: FolderKanban,
  },
  {
    name: "Clients",
    path: "/clients",
    icon: Users,
  },

  {
    name: "Vendors",
    path: "#",
    icon: Building2,
  },
  {
    name: "Employees",
    path: "#",
    icon: HardHat,
  },
  {
    name: "Purchase",
    path: "#",
    icon: ShoppingCart,
  },
  {
    name: "Billing",
    path: "#",
    icon: Receipt,
  },
  {
    name: "Accounts",
    path: "#",
    icon: Landmark,
  },
  {
    name: "Reports",
    path: "#",
    icon: BarChart3,
  },
  {
    name: "Settings",
    path: "#",
    icon: Settings,
  },
];

export default function Sidebar() {
  return (
    <aside className="flex min-h-screen w-64 flex-col bg-slate-900 text-white">

      <div className="border-b border-slate-700 p-6">

        <h1 className="text-3xl font-bold tracking-wide">
          AP OS
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Construction ERP
        </p>

      </div>

      <nav className="mt-6 flex-1 px-3">

        {menus.map((menu) => {
          const Icon = menu.icon;

          return (
            <NavLink
              key={menu.name}
              to={menu.path}
              className={({ isActive }) =>
                `mb-2 flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon size={20} />

              <span className="font-medium">
                {menu.name}
              </span>

            </NavLink>
          );
        })}

      </nav>

      <div className="border-t border-slate-700 p-4 text-center text-xs text-slate-500">
        AP OS v1.0
      </div>

    </aside>
  );
}