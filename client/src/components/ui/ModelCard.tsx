import { Link } from "wouter";
import { AiModelWithCreator } from "@shared/schema";
import { Sparkles, ArrowRight } from "lucide-react";
import { Badge } from "./badge";
import { motion } from "framer-motion";

import fallbackImg1 from "@assets/IMG_3873_1772163282919.jpeg";
import fallbackImg2 from "@assets/IMG_3873_1772163296289.jpeg";

interface ModelCardProps {
  model: AiModelWithCreator;
  index: number;
}

export function ModelCard({ model, index }: ModelCardProps) {
  // Alternate static images if no imageUrl is provided
  const imgUrl = model.imageUrl || (model.id % 2 === 0 ? fallbackImg1 : fallbackImg2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link href={`/models/${model.id}`}>
        <div className="group glass-card rounded-2xl overflow-hidden cursor-pointer h-full flex flex-col">
          <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
            <img 
              src={imgUrl} 
              alt={model.name} 
              className="object-cover w-full h-full opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="absolute top-4 left-4">
              <Badge variant="secondary" className="bg-accent/20 backdrop-blur-md border-accent/30 text-white font-medium">
                {model.category}
              </Badge>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
              <div>
                <h3 className="text-xl font-display font-bold text-white mb-1 group-hover:text-accent transition-colors">{model.name}</h3>
                <p className="text-sm text-zinc-300">by @{model.creator.username}</p>
              </div>
              <div className="text-right">
                <span className="block text-2xl font-bold text-white">${model.pricePerQuery}</span>
                <span className="block text-[10px] uppercase tracking-widest text-zinc-400 font-bold">/query</span>
              </div>
            </div>
          </div>
          
          <div className="p-6 flex-1 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -z-10 group-hover:bg-accent/10 transition-colors duration-500" />
            <p className="text-zinc-400 text-sm line-clamp-2 leading-relaxed mb-8">
              {model.description}
            </p>
            
            <div className="flex items-center justify-between text-xs pt-4 border-t border-white/5">
              <span className="flex items-center gap-1.5 text-zinc-500 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-accent" /> Verified Premium
              </span>
              <span className="flex items-center gap-1 text-accent font-bold uppercase tracking-wider group-hover:gap-2 transition-all">
                Open Access <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
