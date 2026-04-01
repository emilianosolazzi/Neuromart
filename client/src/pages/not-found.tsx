import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, SearchX } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <AppLayout>
      <div className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 mb-8">
            <SearchX className="w-9 h-9 text-zinc-500" />
          </div>
          <h1 className="text-5xl font-display font-extrabold text-white mb-4">404</h1>
          <p className="text-lg text-zinc-400 mb-8">
            This page doesn't exist or may have been moved.
          </p>
          <Link href="/">
            <Button className="bg-white text-black hover:bg-zinc-200 rounded-full px-6">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Marketplace
            </Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
