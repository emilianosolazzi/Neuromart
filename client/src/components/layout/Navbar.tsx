import { Link, useLocation } from "wouter";
import { useUsers } from "@/hooks/use-users";
import { useUser } from "@/lib/user-context";
import { BrainCircuit, ChevronDown, UserCircle } from "lucide-react";
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

  const currentUser = users?.find((u) => u.id === userId);

  return (
    <header className="sticky top-0 z-50 w-full glass">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center group-hover:scale-105 transition-transform">
              <BrainCircuit className="w-5 h-5 text-black" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">Neuromart</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className={`text-sm font-medium transition-colors hover:text-white ${location === '/' ? 'text-white' : 'text-zinc-400'}`}
            >
              Explore
            </Link>
            <Link 
              href="/dashboard" 
              className={`text-sm font-medium transition-colors hover:text-white ${location === '/dashboard' ? 'text-white' : 'text-zinc-400'}`}
            >
              Dashboard
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isLoading ? (
            <Skeleton className="h-9 w-32 rounded-full" />
          ) : users && users.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300">
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
    </header>
  );
}
