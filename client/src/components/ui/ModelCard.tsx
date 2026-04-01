import { Link } from "wouter";
import { AiModelWithCreator } from "@shared/schema";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Badge } from "./badge";
import { motion } from "framer-motion";
import { ModelVisual } from "./ModelVisual";
import { formatOnboardingMode, formatPricing, formatProvider, formatStatus, splitModelTags, computeQualityScore, formatQualityTier, CATEGORY_ICONS } from "@/lib/model-marketplace";

interface ModelCardProps {
  model: AiModelWithCreator;
  index: number;
}

export function ModelCard({ model, index }: ModelCardProps) {
  const pricing = formatPricing(model);
  const tags = splitModelTags(model.tags).slice(0, 2);
  const quality = computeQualityScore(model);
  const tierInfo = formatQualityTier(quality.tier);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="h-full"
    >
      <Link href={`/models/${model.id}`}>
        <div className="group glass-card rounded-[1.75rem] overflow-hidden cursor-pointer h-full flex flex-col hover:-translate-y-1">
          <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
            <ModelVisual
              name={model.name}
              category={model.category}
              imageUrl={model.imageUrl}
              creatorName={`@${model.creator.username}`}
              variant="card"
              className="h-full w-full opacity-90 group-hover:scale-105 transition-all duration-700 ease-out"
              imageClassName="object-cover w-full h-full opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="absolute top-4 left-4 flex flex-wrap gap-2 pr-4">
              <Badge variant="secondary" className="bg-accent/20 backdrop-blur-md border-accent/30 text-white font-medium">
                {model.category}
              </Badge>
              <Badge variant="secondary" className="bg-black/30 backdrop-blur-md border-white/10 text-zinc-200 font-medium">
                {formatStatus(model.modelStatus)}
              </Badge>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
              <div>
                <h3 className="text-xl font-display font-bold text-white mb-1 group-hover:text-accent transition-colors">{model.name}</h3>
                <p className="text-sm text-zinc-300">{formatProvider(model.provider)} • @{model.creator.username}</p>
              </div>
              <div className="text-right">
                <span className="block text-lg font-bold text-white">{pricing.primary}</span>
                <span className="block text-[10px] uppercase tracking-widest text-zinc-400 font-bold">{pricing.secondary}</span>
              </div>
            </div>
          </div>
          
          <div className="p-6 flex-1 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -z-10 group-hover:bg-accent/10 transition-colors duration-500" />
            <div className="mb-6 space-y-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                {formatOnboardingMode(model.onboardingMode)}
              </div>
              <p className="text-zinc-400 text-sm line-clamp-3 leading-relaxed">
                {model.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="border-white/10 text-zinc-400">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <div className="flex items-center justify-between text-xs pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                {model.specialistNiche && model.specialistNiche !== model.name ? (
                  <span className="text-zinc-500 truncate max-w-[140px]" title={model.specialistNiche}>{model.specialistNiche}</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-zinc-500 font-medium">
                    <span>{CATEGORY_ICONS[model.category] ?? "📦"}</span> {model.category}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${tierInfo.bg} ${tierInfo.color}`}>
                  <ShieldCheck className="h-3 w-3" /> {tierInfo.label}
                </span>
              </div>
              <span className="flex items-center gap-1 text-accent font-bold uppercase tracking-wider group-hover:gap-2 transition-all">
                View Details <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
