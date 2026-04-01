import { useState } from "react";
import {
  Bot,
  Briefcase,
  Code2,
  Cpu,
  Image as ImageIcon,
  MessageSquare,
  Mic,
  Sparkles,
} from "lucide-react";

type ModelVisualProps = {
  name: string;
  category: string;
  imageUrl?: string | null;
  creatorName?: string;
  className?: string;
  imageClassName?: string;
  variant?: "card" | "detail";
};

const palettes = [
  {
    base: "from-cyan-500/25 via-sky-500/15 to-transparent",
    orb: "bg-cyan-400/20",
    edge: "border-cyan-400/20",
    tint: "text-cyan-100",
  },
  {
    base: "from-emerald-500/25 via-lime-500/15 to-transparent",
    orb: "bg-emerald-400/20",
    edge: "border-emerald-400/20",
    tint: "text-emerald-100",
  },
  {
    base: "from-amber-500/25 via-orange-500/15 to-transparent",
    orb: "bg-amber-400/20",
    edge: "border-amber-400/20",
    tint: "text-amber-100",
  },
  {
    base: "from-fuchsia-500/20 via-pink-500/15 to-transparent",
    orb: "bg-fuchsia-400/20",
    edge: "border-fuchsia-400/20",
    tint: "text-fuchsia-100",
  },
  {
    base: "from-violet-500/25 via-indigo-500/15 to-transparent",
    orb: "bg-violet-400/20",
    edge: "border-violet-400/20",
    tint: "text-violet-100",
  },
];

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function getCategoryMeta(category: string) {
  const normalized = category.toLowerCase();

  if (normalized.includes("chat") || normalized.includes("support") || normalized.includes("legal")) {
    return { icon: MessageSquare, label: "Expert reasoning layer" };
  }

  if (normalized.includes("code") || normalized.includes("dev") || normalized.includes("engineering")) {
    return { icon: Code2, label: "Workflow automation" };
  }

  if (normalized.includes("image") || normalized.includes("creative") || normalized.includes("design")) {
    return { icon: ImageIcon, label: "Specialized generation" };
  }

  if (normalized.includes("voice") || normalized.includes("audio")) {
    return { icon: Mic, label: "Audio intelligence" };
  }

  if (
    normalized.includes("finance") ||
    normalized.includes("health") ||
    normalized.includes("ops") ||
    normalized.includes("research") ||
    normalized.includes("product")
  ) {
    return { icon: Briefcase, label: "Vertical AI API" };
  }

  if (normalized.includes("custom")) {
    return { icon: Sparkles, label: "Custom expert model" };
  }

  return { icon: Bot, label: "Domain-specific intelligence" };
}

export function ModelVisual({
  name,
  category,
  imageUrl,
  creatorName,
  className,
  imageClassName,
  variant = "card",
}: ModelVisualProps) {
  const [imageFailed, setImageFailed] = useState(false);

  if (imageUrl && !imageFailed) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={imageClassName}
        onError={() => setImageFailed(true)}
      />
    );
  }

  const palette = palettes[hashString(`${name}:${category}`) % palettes.length];
  const meta = getCategoryMeta(category);
  const Icon = meta.icon;
  const compact = variant === "card";

  if (compact) {
    return (
      <div className={`relative overflow-hidden bg-zinc-950 ${className ?? ""}`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${palette.base}`} />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
        <div className={`absolute -top-10 -right-8 rounded-full blur-3xl h-28 w-28 ${palette.orb}`} />
        <div className={`absolute -bottom-12 -left-10 rounded-full blur-3xl h-32 w-32 ${palette.orb}`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_45%)]" />

        <div className="relative flex h-full flex-col justify-end p-5">
          <div className="flex justify-end">
            <div className={`rounded-2xl border bg-black/25 backdrop-blur-md ${palette.edge} p-3`}>
              <Icon className={`h-5 w-5 ${palette.tint}`} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-zinc-950 ${className ?? ""}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${palette.base}`} />
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "52px 52px" }} />
      <div className={`absolute -top-10 -right-8 rounded-full blur-3xl h-40 w-40 ${palette.orb}`} />
      <div className={`absolute -bottom-12 -left-10 rounded-full blur-3xl h-44 w-44 ${palette.orb}`} />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_45%)]" />

      <div className="relative flex h-full flex-col justify-between p-8 md:p-10">
        <div className="flex items-start justify-between gap-4">
          <div className={`rounded-full border bg-black/20 backdrop-blur-md ${palette.edge} px-4 py-2`}>
            <span className="font-medium uppercase tracking-[0.18em] text-zinc-200 text-xs">
              {category}
            </span>
          </div>

          <div className={`rounded-2xl border bg-black/25 backdrop-blur-md ${palette.edge} p-4`}>
            <Icon className={`h-7 w-7 ${palette.tint}`} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-zinc-300 text-xs">
            <Cpu className="h-4 w-4" />
            {meta.label}
          </div>

          <div>
            <h3 className="max-w-[18ch] text-3xl md:text-4xl text-white">
              {name}
            </h3>
            <p className="mt-2 text-zinc-400 text-sm md:text-base">
              {creatorName ? `Designed by ${creatorName}` : "Built for specialized production use"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}