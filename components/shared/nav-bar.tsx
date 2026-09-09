"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarBlank, ForkKnife, Gear, ShoppingCart } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const LINKS = [
  { href: "/plan", label: "Plan", icon: CalendarBlank },
  { href: "/shopping-list", label: "Shopping list", icon: ShoppingCart },
  { href: "/settings", label: "Settings", icon: Gear },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
        <Link href="/plan" className="flex items-center gap-2 font-heading text-xl italic text-foreground">
          <ForkKnife className="size-5 text-primary" weight="fill" />
          Sofra
        </Link>

        <nav className="flex items-center gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-muted",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-4" weight={active ? "fill" : "regular"} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
