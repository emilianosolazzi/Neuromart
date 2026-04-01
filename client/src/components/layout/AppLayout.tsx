import { Navbar } from "./Navbar";
import { Link } from "wouter";
import { BrainCircuit } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Skip link for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium">
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1 flex flex-col">
        {children}
      </main>
      <footer className="border-t border-zinc-900 py-10 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white to-zinc-300 flex items-center justify-center">
                <BrainCircuit className="w-4 h-4 text-black" />
              </div>
              <span className="font-display font-bold text-sm text-zinc-400">Neuromart</span>
            </div>
            <nav className="flex items-center gap-6 text-sm text-zinc-600" aria-label="Footer navigation">
              <Link href="/" className="hover:text-zinc-300 transition-colors">Marketplace</Link>
              <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">Creator Desk</Link>
            </nav>
            <p className="text-xs text-zinc-700">© {new Date().getFullYear()} Neuromart. Intelligence on demand.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
