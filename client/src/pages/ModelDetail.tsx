import { useParams, useLocation } from "wouter";
import { useModel } from "@/hooks/use-models";
import { useCreateRental } from "@/hooks/use-rentals";
import { useUser } from "@/lib/user-context";
import { AppLayout } from "@/components/layout/AppLayout";
import { ModelVisual } from "@/components/ui/ModelVisual";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatOnboardingMode, formatPricing, formatProvider, formatStatus, getOnboardingGuidance, splitModelTags, computeQualityScore, formatQualityTier, CATEGORY_ICONS } from "@/lib/model-marketplace";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, CheckCircle2, CircleCheckBig, Cpu, Key, Lock, ShieldCheck, User as UserIcon } from "lucide-react";
import { Link } from "wouter";

export default function ModelDetail() {
  const params = useParams();
  const id = params.id ? parseInt(params.id, 10) : null;
  const { data: model, isLoading } = useModel(id);
  
  const { userId } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const rentMutation = useCreateRental();

  const handleRent = () => {
    if (!userId || !model) {
      toast({ title: "Authentication required", description: "Please select a user in the top right.", variant: "destructive" });
      return;
    }

    rentMutation.mutate(
      { renterId: userId, modelId: model.id },
      {
        onSuccess: () => {
          toast({ title: "Successfully rented model!", description: "You can now access it in your dashboard." });
          setLocation("/dashboard");
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-20 max-w-5xl">
          <Skeleton className="h-10 w-32 mb-10 bg-zinc-900" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-3xl bg-zinc-900" />
            <div className="space-y-6">
              <Skeleton className="h-16 w-3/4 bg-zinc-900" />
              <Skeleton className="h-24 w-full bg-zinc-900" />
              <Skeleton className="h-12 w-1/3 bg-zinc-900" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!model) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-display font-bold">Model not found</h1>
          <Link href="/" className="text-primary mt-4 inline-block hover:underline">Return to browse</Link>
        </div>
      </AppLayout>
    );
  }

  const pricing = formatPricing(model);
  const tags = splitModelTags(model.tags);
  const actionLabel = model.pricingModel === "custom_quote" ? "Request Access" : "Rent Access Now";
  const onboardingGuidance = getOnboardingGuidance(model.onboardingMode);
  const quality = computeQualityScore(model);
  const tierInfo = formatQualityTier(quality.tier);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 lg:py-20 max-w-6xl">
        <Link href="/" className="inline-flex items-center text-zinc-400 hover:text-white mb-10 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Left Col: Image */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5"
          >
            <div className="sticky top-24">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden glass-card p-2">
                <ModelVisual
                  name={model.name}
                  category={model.category}
                  imageUrl={model.imageUrl}
                  creatorName={`@${model.creator.username}`}
                  variant="detail"
                  className="h-full w-full rounded-2xl"
                  imageClassName="w-full h-full object-cover rounded-2xl"
                />
              </div>
            </div>
          </motion.div>

          {/* Right Col: Content */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-7 flex flex-col justify-center"
          >
            <div className="flex flex-wrap gap-3 mb-6">
              <Badge variant="outline" className="border-zinc-800 bg-zinc-900 text-zinc-200">{CATEGORY_ICONS[model.category] ?? "📦"} {model.category}</Badge>
              {model.specialistNiche && (
                <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent">{model.specialistNiche}</Badge>
              )}
              <Badge variant="outline" className="border-zinc-800 bg-zinc-900 text-zinc-300">{formatOnboardingMode(model.onboardingMode)}</Badge>
              <Badge variant="outline" className="border-zinc-800 bg-zinc-900 text-zinc-300">{formatStatus(model.modelStatus)}</Badge>
              <Badge variant="outline" className={`${tierInfo.bg} ${tierInfo.color} flex items-center gap-1`}><ShieldCheck className="h-3 w-3" /> {tierInfo.label}</Badge>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-display font-bold tracking-tight mb-4 leading-tight text-white">
              {model.name}
            </h1>
            
            <div className="flex items-center gap-3 text-zinc-400 mb-8 pb-8 border-b border-zinc-900">
              <div className="flex items-center gap-2 bg-zinc-900 rounded-full py-1 pr-4 pl-1">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                  <UserIcon className="w-4 h-4" />
                </div>
                <span className="text-sm text-zinc-200 font-medium">@{model.creator.username}</span>
              </div>
              <div className="text-sm text-zinc-400">{formatProvider(model.provider)}{model.baseModel ? ` • ${model.baseModel}` : ""}</div>
            </div>

            <h3 className="text-xl font-display font-bold mb-4">About this model</h3>
            <p className="text-lg text-zinc-300 leading-relaxed mb-10">
              {model.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
                <div className="text-xs uppercase tracking-[0.16em] text-zinc-400 mb-2">Provider</div>
                <div className="text-white font-medium">{formatProvider(model.provider)}</div>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
                <div className="text-xs uppercase tracking-[0.16em] text-zinc-400 mb-2">Model Identifier</div>
                <div className="text-white font-medium">{model.modelIdentifier ?? model.baseModel ?? "Creator-defined workflow"}</div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Cpu className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-2 text-zinc-300 font-medium mb-3">
                <Lock className="w-4 h-4" /> {model.systemPrompt ? "Base System Prompt" : "Access Summary"}
              </div>
              <div className="font-mono text-sm text-zinc-400 line-clamp-3">
                {model.systemPrompt ?? model.accessSummary ?? "Creator will share onboarding instructions and access details after purchase."}
              </div>
              <div className="mt-3 text-xs text-primary font-medium flex items-center gap-1">
                <Key className="w-3 h-3" /> {model.systemPrompt ? "Rent to unlock full prompt" : "Purchase to unlock full integration details"}
              </div>
            </div>

            {(model.apiBaseUrl || model.apiDocsUrl || tags.length > 0) && (
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 mb-10 space-y-4">
                <h3 className="text-lg font-display font-bold text-white">Integration Snapshot</h3>
                {model.apiBaseUrl && (
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-zinc-400 mb-2">Endpoint</div>
                    <div className="font-mono text-sm text-zinc-300 break-all">{model.apiBaseUrl}</div>
                  </div>
                )}
                {model.apiDocsUrl && (
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-zinc-400 mb-2">Documentation</div>
                    <a href={model.apiDocsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                      {model.apiDocsUrl}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="border-zinc-700 text-zinc-300">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 mb-10">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-lg font-display font-bold text-white">How access works</h3>
                  <p className="mt-1 text-sm text-zinc-400">Designed to make activation easy for renters before they commit.</p>
                </div>
                <Badge variant="outline" className="border-zinc-700 text-zinc-300">{formatOnboardingMode(model.onboardingMode)}</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-3 mt-6">
                {[
                  { step: "1", title: "Review fit", description: "Check provider, tags, docs, and onboarding mode to confirm this matches your workflow." },
                  { step: "2", title: model.pricingModel === "custom_quote" ? "Request terms" : "Activate access", description: model.pricingModel === "custom_quote" ? "Submit for quote-based onboarding when pricing depends on deployment size or support." : "Start with a clear per-request access model so evaluation is fast." },
                  { step: "3", title: "Receive instructions", description: onboardingGuidance.renterOutcome },
                ].map((item) => (
                  <div key={item.step} className="rounded-2xl border border-white/12 bg-white/[0.05] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-black">{item.step}</div>
                      <div className="font-medium text-white">{item.title}</div>
                    </div>
                    <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-zinc-400">What you should expect</div>
                  <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                    <li className="flex items-start gap-3"><CircleCheckBig className="mt-0.5 h-4 w-4 text-primary" /> {onboardingGuidance.renterOutcome}</li>
                    <li className="flex items-start gap-3"><CircleCheckBig className="mt-0.5 h-4 w-4 text-primary" /> {model.apiDocsUrl ? "Technical documentation is attached for pre-purchase review." : "The creator provides guided onboarding after activation."}</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-zinc-400">Good fit when</div>
                  <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                    {onboardingGuidance.requirements.slice(0, 3).map((item) => (
                      <li key={item} className="flex items-start gap-3"><CircleCheckBig className="mt-0.5 h-4 w-4 text-primary" /> You value {item.toLowerCase()}.</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-zinc-900 border border-accent/20 rounded-3xl p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl shadow-accent/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <p className="text-sm text-accent uppercase tracking-widest font-display font-bold mb-1">Access Model</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl md:text-5xl font-bold text-white tracking-tighter">{pricing.primary}</span>
                  <span className="text-zinc-400 font-medium">{pricing.secondary}</span>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    size="lg" 
                    className="bg-accent-gradient text-white border-0 rounded-full px-10 py-8 text-xl font-bold shadow-xl shadow-accent/20 hover:shadow-accent/40 hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto relative z-10"
                    disabled={rentMutation.isPending}
                  >
                    {rentMutation.isPending ? "Configuring Access..." : actionLabel}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-display text-xl">Confirm access to {model.name}</AlertDialogTitle>
                    <AlertDialogDescription className="text-zinc-300">
                      {model.pricingModel === "custom_quote"
                        ? "You're requesting a custom quote. The creator will follow up with pricing and onboarding details."
                        : `You'll be charged ${pricing.primary} ${pricing.secondary}. Access credentials will be available in your dashboard immediately.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-transparent border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-full">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleRent}
                      className="bg-white text-black hover:bg-zinc-200 rounded-full font-semibold"
                    >
                      {model.pricingModel === "custom_quote" ? "Request Access" : "Confirm & Activate"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
            <ul className="mt-8 space-y-3">
              {[
                `Onboarding mode: ${formatOnboardingMode(model.onboardingMode)}`,
                model.pricingModel === "custom_quote" ? "Commercial terms are finalized through a quote-based onboarding flow" : "Per-request pricing supports fast evaluation and controlled production rollout",
                model.apiDocsUrl ? "Documentation link is attached for technical review before activation" : "Creator-managed onboarding details are provided after access is granted"
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400" /> {feature}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
