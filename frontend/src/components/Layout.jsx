import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart, Package, BarChart3,
  Sparkles, FileText, Store, LogOut, Menu, X
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, testid: "nav-dashboard" },
  { to: "/transaksi", label: "Transaksi", icon: ShoppingCart, testid: "nav-transaksi" },
  { to: "/produk", label: "Produk & Stok", icon: Package, testid: "nav-produk" },
  { to: "/analitik", label: "Analitik", icon: BarChart3, testid: "nav-analitik" },
  { to: "/insight", label: "NADI Insight", icon: Sparkles, testid: "nav-insight", badge: "AI" },
  { to: "/laporan", label: "Laporan", icon: FileText, testid: "nav-laporan" },
  { to: "/profil", label: "Profil", icon: Store, testid: "nav-profil" },
];

const Brand = () => (
  <div className="flex items-center gap-2.5">
    <div className="h-10 w-10 rounded-xl bg-emerald-800 text-white grid place-items-center font-bold text-lg shadow-sm">
      N
    </div>
    <div>
      <div className="font-bold text-stone-900 leading-tight">NADI</div>
      <div className="text-[10px] uppercase tracking-widest text-stone-500 font-medium">Navigasi Data Bisnis</div>
    </div>
  </div>
);

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-stone-200 bg-white flex-col sticky top-0 h-screen">
        <div className="p-5 border-b border-stone-200"><Brand /></div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              data-testid={n.testid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-800 text-white shadow-sm"
                    : "text-stone-700 hover:bg-stone-100"
                }`
              }
            >
              <n.icon size={18} />
              <span>{n.label}</span>
              {n.badge && (
                <span className="ml-auto text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-semibold">
                  {n.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-stone-200">
          <div className="px-3 py-2 rounded-lg bg-stone-50">
            <div className="text-xs text-stone-500">Masuk sebagai</div>
            <div className="text-sm font-semibold text-stone-900 truncate" data-testid="sidebar-owner-name">{user?.owner_name}</div>
            <div className="text-xs text-stone-500 truncate">{user?.business_name}</div>
          </div>
          <button
            onClick={handleLogout}
            data-testid="logout-btn"
            className="mt-2 w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200 px-4 py-3 flex items-center justify-between">
        <Brand />
        <button onClick={() => setMobileOpen(true)} data-testid="mobile-menu-open" className="p-2 rounded-lg hover:bg-stone-100">
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setMobileOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-72 bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <Brand />
              <button onClick={() => setMobileOpen(false)} data-testid="mobile-menu-close"><X size={20} /></button>
            </div>
            <nav className="space-y-1">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.to === "/"}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive ? "bg-emerald-800 text-white" : "text-stone-700 hover:bg-stone-100"
                    }`
                  }
                >
                  <n.icon size={18} />
                  <span>{n.label}</span>
                </NavLink>
              ))}
            </nav>
            <button onClick={handleLogout} className="mt-4 w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
              <LogOut size={16} /> Keluar
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
