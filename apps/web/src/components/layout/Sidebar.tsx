import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Building2,
  HardHat,
  ShoppingCart,
  ClipboardList,
  Truck,
  Boxes,
  PackageMinus,
  Wallet,
  Banknote,
  HandCoins,
  Receipt,
  Landmark,
  BarChart3,
  Settings,
  Sparkles,
  ChevronRight,
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
    path: "/vendors",
    icon: Building2,
  },
  {
    name: "Employees",
    path: "#",
    icon: HardHat,
  },
  {
    name: "Requisitions",
    path: "/purchase-requisitions",
    icon: ShoppingCart,
  },
  {
    name: "Purchase Orders",
    path: "/purchase-orders",
    icon: ClipboardList,
  },
  {
    name: "Material Receipts",
    path: "/material-receipts",
    icon: Truck,
  },
  {
    name: "Inventory",
    path: "/inventory",
    icon: Boxes,
  },
  {
    name: "Material Issues",
    path: "/material-issues",
    icon: PackageMinus,
  },
  {
    name: "Vendor Bills",
    path: "/vendor-bills",
    icon: Wallet,
  },
  {
    name: "Vendor Payments",
    path: "/vendor-payments",
    icon: Banknote,
  },
  {
    name: "Site Expenses",
    path: "/expenses",
    icon: HandCoins,
  },
  {
    name: "Billing",
    path: "#",
    icon: Receipt,
  },
  {
    name: "Bank Accounts",
    path: "/company-bank-accounts",
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
    <aside className="m-4 flex h-[calc(100vh-32px)] w-[280px] flex-col rounded-[30px] border border-white/70 bg-white/70 backdrop-blur-3xl shadow-[0_12px_35px_rgba(15,23,42,.05)]">

      {/* ---------------------------------------------------------------- */}
      {/* Logo */}
      {/* ---------------------------------------------------------------- */}

      <div className="p-5">

        <div className="rounded-[24px] border border-[#F1E2B0] bg-[#FCFAF4] p-4">

          <div className="flex items-center gap-3">

            {/* Reserved Logo */}

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D8B44A] text-lg font-bold text-white shadow-sm">

              AP

            </div>

            <div>

              <h1 className="text-[22px] font-bold leading-tight text-slate-900">
                AP Construction
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Operating System
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Workspace */}
      {/* ---------------------------------------------------------------- */}

      <div className="px-5">

        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">
          Workspace
        </p>

      </div>

      <nav className="flex-1 px-4">

        {menus.map((menu) => {
          const Icon = menu.icon;

          return (
            <NavLink
              key={menu.name}
              to={menu.path}
              className={({ isActive }) =>
                `group mb-2 flex items-center justify-between rounded-2xl px-3 py-2.5 transition-all duration-200 ${
                  isActive
                    ? "border border-[#F2DFAB] bg-[#FCF8EC] shadow-sm"
                    : "hover:bg-white hover:shadow-sm"
                }`
              }
            >
              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">

                  <Icon
                    size={18}
                    className="text-[#B98A1F]"
                  />

                </div>

                <span className="text-[15px] font-medium text-slate-700">
                  {menu.name}
                </span>

              </div>

              <ChevronRight
                size={15}
                className="text-slate-300 transition group-hover:text-[#B98A1F]"
              />

            </NavLink>
          );
        })}

      </nav>

      {/* ---------------------------------------------------------------- */}
      {/* APCI */}
      {/* ---------------------------------------------------------------- */}

      <div className="p-4">

        <div className="rounded-[24px] bg-[#243247] p-5 text-white shadow-lg">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D8B44A]">

              <Sparkles
                size={18}
                className="text-white"
              />

            </div>

            <div>

              <h3 className="font-semibold">
                APCI
              </h3>

              <p className="text-xs text-slate-300">
                Construction Intelligence
              </p>

            </div>

          </div>

          <div className="mt-4 rounded-xl bg-white/10 p-3">

            <p className="text-sm">
              Good Afternoon, Abhijit.
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-300">
              • 2 approvals pending
              <br />
              • ₹2.60 Cr receivable
              <br />
              • 1 meeting today
            </p>

          </div>

        </div>

      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Footer */}
      {/* ---------------------------------------------------------------- */}

      <div className="pb-5 text-center">

        <p className="text-[11px] tracking-[0.2em] text-slate-400">
          AP CONSTRUCTION OS
        </p>

        <p className="mt-1 text-[11px] text-slate-400">
          Version 1.0
        </p>

      </div>

    </aside>
  );
}