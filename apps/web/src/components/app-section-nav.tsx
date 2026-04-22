"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/activity", label: "Actividad" },
  { href: "/income-expenses", label: "Ingresos y gastos" },
  { href: "/asset-operations", label: "Activos" },
  { href: "/zen", label: "Zen" },
  { href: "/vt-markets", label: "VT Markets" },
  { href: "/settings", label: "Configuración" }
] as const;

export function AppSectionNav() {
  const pathname = usePathname();

  return (
    <nav className="section-nav" aria-label="Navegación principal de la app">
      {navItems.map((item) => {
        const active =
          item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);

        return (
          <Link
            className={active ? "section-nav-link active" : "section-nav-link"}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
