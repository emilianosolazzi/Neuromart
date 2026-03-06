import { useState } from "react";
import { useModels } from "@/hooks/use-models";
import { AppLayout } from "@/components/layout/AppLayout";
import { ModelCard } from "@/components/ui/ModelCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";

const CATEGORIES = ["All", "Chat", "Code", "Image", "Voice", "Custom"];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: models, isLoading } = useModels(selectedCategory);

  const filteredModels = models?.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] -z-10 pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[128px] -z-10 pointer-events-none" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300 mb-6">
              <Sparkles className="w-3 h-3 text-primary" /> Discover the new standard of AI
            </span>
            <h1 className="text-5xl md:text-8xl font-display font-extrabold tracking-tight mb-8 leading-[1.1]">
              Intelligence <br className="hidden md:block"/>
              <span className="text-gradient">on Demand</span>
            </h1>
            <p className="text-lg md:text-2xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
              Rent highly specialized, custom-trained AI models from top creators. Integrate expert knowledge directly into your workflow.
            </p>
            
            <div className="relative max-w-2xl mx-auto group">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent/50 to-blue-500/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                  <Search className="h-6 w-6 text-zinc-500 group-focus-within:text-accent transition-colors" />
                </div>
                <Input 
                  className="w-full pl-14 pr-6 py-8 rounded-2xl bg-black/50 border-zinc-800 text-xl focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent placeholder:text-zinc-600 transition-all backdrop-blur-xl"
                  placeholder="Search models, categories, or creators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories & Grid */}
      <section className="py-12 container mx-auto px-4 sm:px-6 lg:px-8 flex-1">
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              className={`rounded-full px-6 transition-all ${
                selectedCategory === cat 
                  ? "bg-white text-black hover:bg-zinc-200" 
                  : "bg-transparent border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600"
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="space-y-4">
                <Skeleton className="w-full aspect-[4/3] rounded-2xl bg-zinc-900" />
                <Skeleton className="h-6 w-2/3 bg-zinc-900" />
                <Skeleton className="h-4 w-1/3 bg-zinc-900" />
              </div>
            ))}
          </div>
        ) : filteredModels?.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-display text-zinc-300">No models found</h3>
            <p className="text-zinc-500 mt-2">Try adjusting your search or category filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredModels?.map((model, idx) => (
              <ModelCard key={model.id} model={model} index={idx} />
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
}
