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
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute top-4 left-4">
              <Badge variant="secondary" className="bg-black/50 backdrop-blur-md border-white/10 text-white font-medium">
                {model.category}
              </Badge>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
              <div>
                <h3 className="text-xl font-display font-bold text-white mb-1">{model.name}</h3>
                <p className="text-sm text-zinc-300">by @{model.creator.username}</p>
              </div>
              <div className="text-right">
                <span className="block text-lg font-bold text-white">${model.pricePerQuery}</span>
                <span className="block text-xs text-zinc-400">/query</span>
              </div>
            </div>
          </div>
          
          <div className="p-5 flex-1 flex flex-col justify-between">
            <p className="text-zinc-400 text-sm line-clamp-2 leading-relaxed mb-6">
              {model.description}
            </p>
            
            <div className="flex items-center justify-between text-sm pt-4 border-t border-white/5">
              <span className="flex items-center gap-1.5 text-zinc-500">
                <Sparkles className="w-4 h-4 text-primary" /> Premium Model
              </span>
              <span className="flex items-center gap-1 text-primary font-medium group-hover:translate-x-1 transition-transform">
                Details <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
