import { useState, useMemo } from "react";
import { useModels } from "@/hooks/use-models";
import { AppLayout } from "@/components/layout/AppLayout";
import { ModelCard } from "@/components/ui/ModelCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { ArrowUpRight, Cpu, Layers3, Search, Sparkles, X, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MODEL_CATEGORIES } from "@shared/schema";
import { splitModelTags, CATEGORY_ICONS, computeQualityScore, type QualityTier, formatQualityTier } from "@/lib/model-marketplace";
import { useDebounce } from "@/hooks/use-debounce";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [qualityFilter, setQualityFilter] = useState<QualityTier | "all">("all");
  const debouncedSearch = useDebounce(searchQuery, 250);
  const { data: models, isLoading } = useModels({
    category: selectedCategory,
    modelStatus: "published",
    page: 1,
    pageSize: 24,
  });

  const filteredModels = useMemo(() => {
    let result = models;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result?.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        (m.provider ?? "").toLowerCase().includes(q) ||
        (m.specialistNiche ?? "").toLowerCase().includes(q) ||
        splitModelTags(m.tags).some((tag) => tag.toLowerCase().includes(q))
      );
    }
    if (qualityFilter !== "all") {
      result = result?.filter(m => computeQualityScore(m).tier === qualityFilter);
    }
    return result;
  }, [models, debouncedSearch, qualityFilter]);

  const providerCount = new Set(models?.map((model) => model.provider).filter(Boolean)).size;
  const publishedCount = filteredModels?.length ?? 0;
  const categoryCount = new Set(models?.map((model) => model.category)).size;

  return (
    <AppLayout>
      {/* Hero Section */}
      <section className="relative pt-24 pb-12 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] -z-10 pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[128px] -z-10 pointer-events-none" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="section-frame mesh-bg overflow-hidden px-6 py-8 md:px-10 md:py-12"
          >
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300 mb-6">
                  <Sparkles className="w-3 h-3 text-primary" /> Curated specialist intelligence
                </span>
                <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight mb-6 leading-[1.02]">
                  Specialized
                  <span className="block text-gradient">AI APIs</span>
                </h1>
                <p className="text-base md:text-xl text-zinc-300 mb-10 max-w-2xl leading-relaxed font-medium">
                  Source production-ready AI products for legal review, financial analysis, research ops, healthcare support, and operational automation without settling for generic endpoints.
                </p>

                <div className="relative max-w-2xl group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-accent/50 to-blue-500/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                      <Search className="h-6 w-6 text-zinc-400 group-focus-within:text-accent transition-colors" />
                    </div>
                    <Input 
                      className="w-full pl-14 pr-14 py-8 rounded-2xl bg-black/50 border-zinc-700 text-xl focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent placeholder:text-zinc-400 transition-all backdrop-blur-xl"
                      placeholder="Search specialized APIs, fields, or creators..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute inset-y-0 right-5 flex items-center text-zinc-400 hover:text-white transition-colors"
                        aria-label="Clear search"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  { label: "Published Listings", value: publishedCount, icon: Layers3 },
                  { label: "Active Providers", value: providerCount, icon: Cpu },
                  { label: "Specialized Categories", value: categoryCount, icon: ArrowUpRight },
                ].map((item) => (
                  <div key={item.label} className="glass-panel rounded-[1.5rem] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-3xl font-display font-bold text-white">{item.value}</div>
                        <div className="mt-1 text-sm text-zinc-400">{item.label}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-zinc-300">
                        <item.icon className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories & Grid */}
      <section className="pb-16 container mx-auto px-4 sm:px-6 lg:px-8 flex-1">
        <div className="section-frame p-5 md:p-6 mb-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-zinc-400 mb-2">Browse Marketplace</div>
              <h2 className="text-2xl md:text-3xl text-white">Find domain-tuned AI products</h2>
            </div>
            <div className="text-sm text-zinc-400">
              {publishedCount} results{selectedCategory !== "All" ? ` in ${selectedCategory}` : " across all categories"}
              {(selectedCategory !== "All" || searchQuery || qualityFilter !== "all") && (
                <button
                  onClick={() => { setSelectedCategory("All"); setSearchQuery(""); setQualityFilter("all"); }}
                  className="ml-3 text-xs text-accent hover:text-white transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-6 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={selectedCategory === "All" ? "default" : "outline"}
            className={`rounded-full px-6 transition-all shrink-0 ${
              selectedCategory === "All"
                ? "bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/10"
                : "bg-transparent border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500"
            }`}
            onClick={() => setSelectedCategory("All")}
          >
            All
          </Button>
          {MODEL_CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              className={`rounded-full px-5 transition-all shrink-0 ${
                selectedCategory === cat 
                  ? "bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/10" 
                  : "bg-transparent border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500"
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              <span className="mr-1.5">{CATEGORY_ICONS[cat] ?? "📦"}</span> {cat}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-4">
          <span className="text-xs text-zinc-400 mr-1">Quality:</span>
          {([
            { value: "all" as const, label: "All" },
            { value: "premium" as const, label: "Premium" },
            { value: "verified" as const, label: "Verified" },
          ] as const).map(({ value, label }) => {
            const active = qualityFilter === value;
            const tierInfo = value !== "all" ? formatQualityTier(value) : null;
            return (
              <button
                key={value}
                onClick={() => setQualityFilter(value)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  active
                    ? tierInfo ? `${tierInfo.bg} ${tierInfo.color}` : "bg-white/10 border-white/20 text-white"
                    : "border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500"
                }`}
              >
                {tierInfo && <ShieldCheck className="h-3 w-3" />}
                {label}
              </button>
            );
          })}
        </div>
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
          <div className="section-frame text-center py-20 px-6">
            <h3 className="text-xl font-display text-zinc-300">No models found</h3>
            <p className="text-zinc-400 mt-2">Try adjusting your search or category filters.</p>
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
