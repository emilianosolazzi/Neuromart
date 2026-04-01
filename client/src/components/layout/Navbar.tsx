import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useUsers } from "@/hooks/use-users";
import { useUser } from "@/lib/user-context";
import { BrainCircuit, ChevronDown, Menu, UserCircle, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function Navbar() {
  const [location] = useLocation();
  const { data: users, isLoading } = useUsers();
  const { userId, setUserId } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentUser = users?.find((u) => u.id === userId);
  const navItems = [
    { href: "/", label: "Marketplace" },
    { href: "/dashboard", label: "Creator Desk" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/55 backdrop-blur-2xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between py-3">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white to-zinc-300 flex items-center justify-center shadow-lg shadow-white/10 group-hover:scale-105 transition-transform">
              <BrainCircuit className="w-5 h-5 text-black" />
            </div>
            <div>
              <span className="font-display font-bold text-xl tracking-tight block leading-none">Neuromart</span>
              <span className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Specialized AI Exchange</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-2 rounded-full border border-white/6 bg-white/[0.03] p-1">
            {navItems.map((item) => {
              const active = location === item.href;

              return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${active ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Mobile hamburger */}
          <button
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="hidden xl:flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/8 px-3 py-1.5 text-xs text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Market-ready listings enabled
          </div>
          {isLoading ? (
            <Skeleton className="h-9 w-32 rounded-full" />
          ) : users && users.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full bg-zinc-950/80 border-white/10 hover:bg-zinc-900 text-zinc-300 h-11 px-4">
                  <UserCircle className="w-4 h-4 mr-2" />
                  {currentUser?.displayName || "Select User"}
                  <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
                <DropdownMenuLabel className="font-display text-zinc-400 text-xs uppercase tracking-wider">
                  Mock Authenticated As
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800" />
                {users.map((user) => (
                  <DropdownMenuItem 
                    key={user.id}
                    onClick={() => setUserId(user.id)}
                    className="cursor-pointer focus:bg-zinc-800 focus:text-white"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{user.displayName}</span>
                      <span className="text-xs text-zinc-500">@{user.username}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="text-sm text-zinc-500">No users found</div>
          )}
        </div>
      </div>

      {/* Mobile navigation panel */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-black/90 backdrop-blur-2xl px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const active = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-4 py-3 text-sm font-medium transition-all ${active ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'}`}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
