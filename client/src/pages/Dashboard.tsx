import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUser } from "@/lib/user-context";
import { useRentals } from "@/hooks/use-rentals";
import { useModels, useCreateModel, useModelStats } from "@/hooks/use-models";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatOnboardingMode, formatPricing, formatProvider, formatStatus, getOnboardingGuidance, getPricingGuidance, getNichesForCategory, computeQualityScore, formatQualityTier, CATEGORY_ICONS } from "@/lib/model-marketplace";
import { Box, Plus, Activity, Key, FolderKanban, Radar, Workflow, CircleCheckBig, Sparkles, ShieldCheck, Users } from "lucide-react";
import {
  MODEL_CATEGORIES,
  MODEL_ONBOARDING_MODES,
  MODEL_PRICING_MODES,
  MODEL_PROVIDERS,
  MODEL_STATUSES,
  type CreateAiModelInput,
  type ModelCategory,
  type ModelOnboardingMode,
  type ModelPricingMode,
  type ModelProvider,
  type ModelStatus,
} from "@shared/schema";
import { Link } from "wouter";

function QualityMeter({ specialistNiche }: { specialistNiche: string }) {
  /* Reads live form values via DOM for real-time feedback without lifting all state */
  const [score, setScore] = useState(0);
  const [items, setItems] = useState<{ label: string; met: boolean }[]>([]);
  const [tier, setTier] = useState<"needs_work" | "verified" | "premium">("needs_work");

  const refresh = () => {
    const form = document.querySelector("form");
    if (!form) return;
    const fd = new FormData(form);
    const result = computeQualityScore({
      name: fd.get("name") as string,
      description: fd.get("description") as string,
      specialistNiche: specialistNiche || undefined,
      apiDocsUrl: (fd.get("apiDocsUrl") as string) || undefined,
      accessSummary: (fd.get("accessSummary") as string) || undefined,
      tags: (fd.get("tags") as string) || undefined,
    } as any);
    setScore(result.score);
    setItems(result.items);
    setTier(result.tier);
  };

  useEffect(() => {
    const interval = setInterval(refresh, 800);
    return () => clearInterval(interval);
  });

  useEffect(() => { refresh(); }, [specialistNiche]);

  const tierInfo = formatQualityTier(tier);
  const pct = Math.round((score / 6) * 100);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg text-white">Listing Quality</h3>
          <p className="text-sm text-zinc-400">Complete more fields to increase your quality tier.</p>
        </div>
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${tierInfo.bg} ${tierInfo.color}`}>
          <ShieldCheck className="h-3.5 w-3.5" /> {tierInfo.label}
        </div>
      </div>
      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            tier === "premium" ? "bg-emerald-400" : tier === "verified" ? "bg-amber-400" : "bg-zinc-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {items.map((item) => (
          <div key={item.label} className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 border ${item.met ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-300" : "border-zinc-700 bg-zinc-900/60 text-zinc-400"}`}>
            <CircleCheckBig className="h-3.5 w-3.5 shrink-0" />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function HostedModelCard({ model }: { model: import("@shared/schema").AiModelWithCreator }) {
  const { data: stats } = useModelStats(model.id);
  return (
    <div className="section-frame p-6 flex items-center justify-between gap-6">
      <div className="min-w-0 flex-1">
        <h4 className="font-display font-bold text-lg text-white mb-1 truncate">{model.name}</h4>
        <div className="text-sm text-zinc-400 mb-3">{model.category} • {formatOnboardingMode(model.onboardingMode)} • {formatPricing(model).primary}</div>
        <div className="text-xs text-zinc-400 mb-3">{formatProvider(model.provider)} • {formatStatus(model.modelStatus)}</div>
        <Link href={`/models/${model.id}`} className="text-xs text-primary font-medium hover:underline">
          View in Marketplace
        </Link>
      </div>
      <div className="text-right shrink-0 space-y-3">
        <div>
          <div className="text-2xl font-bold text-white">{stats?.activeRentals ?? "—"}</div>
          <div className="text-xs text-zinc-400 flex items-center gap-1 justify-end"><Users className="h-3 w-3" /> Active Renters</div>
        </div>
        {stats && stats.totalRentals > 0 && (
          <div>
            <div className="text-sm font-semibold text-zinc-400">{stats.totalRentals}</div>
            <div className="text-xs text-zinc-400">Total Activations</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { userId } = useUser();
  const { toast } = useToast();
  const [category, setCategory] = useState<ModelCategory>(MODEL_CATEGORIES[0]);
  const [onboardingMode, setOnboardingMode] = useState<ModelOnboardingMode>("prompt_only");
  const [pricingModel, setPricingModel] = useState<ModelPricingMode>("per_request");
  const [provider, setProvider] = useState<ModelProvider>("custom");
  const [modelStatus, setModelStatus] = useState<ModelStatus>("draft");
  const [specialistNiche, setSpecialistNiche] = useState("");
  
  const { data: rentals, isLoading: loadingRentals } = useRentals({
    renterId: userId ?? undefined,
    page: 1,
    pageSize: 24,
  });
  const { data: myModels, isLoading: loadingModels } = useModels({
    creatorId: userId ?? undefined,
    page: 1,
    pageSize: 24,
  });

  const createMutation = useCreateModel();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const activeRentals = rentals?.length ?? 0;
  const activeListings = myModels?.length ?? 0;
  const publishedListings = myModels?.filter((model) => model.modelStatus === "published").length ?? 0;
  const onboardingGuidance = getOnboardingGuidance(onboardingMode);
  const pricingGuidance = getPricingGuidance(pricingModel);
  const availableNiches = getNichesForCategory(category);

  const handleCreateModel = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return;

    const formData = new FormData(e.currentTarget);
    const data: CreateAiModelInput = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      systemPrompt: (formData.get("systemPrompt") as string) || undefined,
      category,
      onboardingMode,
      pricingModel,
      provider: onboardingMode === "prompt_only" ? undefined : provider,
      modelStatus,
      modelIdentifier: (formData.get("modelIdentifier") as string) || undefined,
      baseModel: (formData.get("baseModel") as string) || undefined,
      apiBaseUrl: (formData.get("apiBaseUrl") as string) || undefined,
      apiDocsUrl: (formData.get("apiDocsUrl") as string) || undefined,
      accessSummary: (formData.get("accessSummary") as string) || undefined,
      tags: (formData.get("tags") as string) || undefined,
      version: (formData.get("version") as string) || undefined,
      pricingLabel: (formData.get("pricingLabel") as string) || undefined,
      pricePerQuery: pricingModel === "per_request" ? (formData.get("pricePerQuery") as string) || undefined : undefined,
      creatorId: userId,
      imageUrl: (formData.get("imageUrl") as string) || undefined,
      specialistNiche: specialistNiche || undefined,
    };

    createMutation.mutate(data, {
      onSuccess: () => {
        toast({ title: "Model created successfully!" });
        setIsDialogOpen(false);
      },
      onError: (err) => {
        toast({ title: "Failed to create model", description: err.message, variant: "destructive" });
      }
    });
  };

  if (!userId) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center flex-col text-center px-4">
          <Box className="w-16 h-16 text-zinc-800 mb-4" />
          <h2 className="text-2xl font-display font-bold text-white mb-2">Select a User</h2>
          <p className="text-zinc-400">Please select a mock user from the top right dropdown to view your dashboard.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-6xl">
        <div className="grid gap-4 md:grid-cols-3 mb-10">
          {[
            { label: "Active Rentals", value: activeRentals, note: "Products currently provisioned", icon: Radar },
            { label: "Hosted Listings", value: activeListings, note: "Listings managed from this desk", icon: FolderKanban },
            { label: "Published", value: publishedListings, note: "Market-visible AI products", icon: Workflow },
          ].map((item) => (
            <div key={item.label} className="section-frame p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">{item.label}</div>
                  <div className="mt-2 text-3xl font-display text-white">{item.value}</div>
                  <div className="mt-1 text-sm text-zinc-400">{item.note}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-zinc-300">
                  <item.icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-white">Dashboard</h1>
            <p className="text-zinc-400 mt-2">Manage live access, monitor listings, and publish specialist AI products with cleaner operator workflows.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-black hover:bg-zinc-200 rounded-full shadow-lg shadow-white/5 font-semibold px-6">
                <Plus className="w-4 h-4 mr-2" /> Host New Model
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-3xl max-h-[88vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Publish a market-ready AI product</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Register prompt-only workflows, provider-backed models, external APIs, or self-hosted AI products.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateModel} className="space-y-6 mt-4">
                <div className="section-frame p-5 md:p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">
                        <Sparkles className="h-3.5 w-3.5 text-primary" /> Provider onboarding guide
                      </div>
                      <h3 className="mt-4 text-2xl font-display text-white">{onboardingGuidance.title}</h3>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">{onboardingGuidance.summary}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-100 lg:max-w-xs">
                      <div className="flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4" /> Renter outcome</div>
                      <p className="mt-2 text-emerald-100/80">{onboardingGuidance.renterOutcome}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 md:grid-cols-3">
                    {[
                      { step: "1", title: "Position it", note: "Name, category, and what makes it better than generic AI." },
                      { step: "2", title: "Explain access", note: "Show renters what runtime, docs, and support they can expect." },
                      { step: "3", title: "Launch cleanly", note: "Choose pricing and status so buyers know how to activate it." },
                    ].map((item) => (
                      <div key={item.step} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-black">{item.step}</div>
                          <div className="font-medium text-white">{item.title}</div>
                        </div>
                        <p className="mt-3 text-sm text-zinc-400">{item.note}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {onboardingGuidance.requirements.map((requirement) => (
                      <div key={requirement} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-300">
                        <CircleCheckBig className="h-3.5 w-3.5 text-primary" />
                        {requirement}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
                  <div>
                    <h3 className="font-display text-lg text-white">1. Listing Basics</h3>
                    <p className="text-sm text-zinc-400">Define how this product appears in the marketplace.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="name" className="text-zinc-300">Model Name</Label>
                    <Input id="name" name="name" required className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary" placeholder="e.g. Contract Risk Reviewer API" />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="onboardingMode" className="text-zinc-300">Onboarding Mode</Label>
                    <Select value={onboardingMode} onValueChange={(value) => setOnboardingMode(value as ModelOnboardingMode)}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary">
                        <SelectValue placeholder="Select onboarding mode" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        {MODEL_ONBOARDING_MODES.map((mode) => (
                          <SelectItem key={mode} value={mode}>{formatOnboardingMode(mode)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="category" className="text-zinc-300">Category</Label>
                    <Select value={category} onValueChange={(value) => { setCategory(value as ModelCategory); setSpecialistNiche(""); }}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        {MODEL_CATEGORIES.map((item) => (
                          <SelectItem key={item} value={item}>{CATEGORY_ICONS[item] ?? "📦"} {item}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="imageUrl" className="text-zinc-300">Image URL (Optional)</Label>
                    <Input id="imageUrl" name="imageUrl" type="url" className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary" placeholder="https://..." />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label className="text-zinc-300">Specialist Niche</Label>
                    {availableNiches.length > 0 ? (
                      <Select value={specialistNiche} onValueChange={setSpecialistNiche}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary">
                          <SelectValue placeholder="Pick a specialist niche or choose Other..." />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-60">
                          {availableNiches.map((niche) => (
                            <SelectItem key={niche} value={niche}>{niche}</SelectItem>
                          ))}
                          <SelectItem value="__custom__">Other — type your own</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={specialistNiche}
                        onChange={(e) => setSpecialistNiche(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary"
                        placeholder="Describe your specialist niche..."
                      />
                    )}
                    {specialistNiche === "__custom__" && (
                      <Input
                        className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary mt-2"
                        placeholder="Describe your custom niche..."
                        onChange={(e) => {
                          if (e.target.value) setSpecialistNiche(e.target.value);
                        }}
                      />
                    )}
                    <p className="text-xs text-zinc-400">Helps buyers find the exact specialist capability they need.</p>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="description" className="text-zinc-300">Description</Label>
                    <Textarea id="description" name="description" required className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary h-24 resize-none" placeholder="What real workflow does this AI product solve better than a generic model?" />
                  </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
                  <div>
                    <h3 className="font-display text-lg text-white">2. Runtime & Integration</h3>
                    <p className="text-sm text-zinc-400">Capture how buyers will access and evaluate the product.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="provider" className="text-zinc-300">Provider</Label>
                    <Select value={provider} onValueChange={(value) => setProvider(value as ModelProvider)}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        {MODEL_PROVIDERS.map((item) => (
                          <SelectItem key={item} value={item}>{formatProvider(item)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-zinc-400">
                      {onboardingMode === "prompt_only"
                        ? "Optional for prompt-only products. Leave as-is unless you are packaging a workflow around a known provider."
                        : "Tell renters whether this is a custom runtime or built on top of a major AI provider."}
                    </p>
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="modelIdentifier" className="text-zinc-300">Model Identifier</Label>
                    <Input id="modelIdentifier" name="modelIdentifier" className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary" placeholder="gpt-4.1, claude-sonnet-4, internal-v2" />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="baseModel" className="text-zinc-300">Base Model (Optional)</Label>
                    <Input id="baseModel" name="baseModel" className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary" placeholder="GPT-4.1, Claude Sonnet, Llama 3.3" />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="version" className="text-zinc-300">Version (Optional)</Label>
                    <Input id="version" name="version" className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary" placeholder="1.0, 2026-03, beta-2" />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="apiBaseUrl" className="text-zinc-300">Endpoint URL</Label>
                    <Input id="apiBaseUrl" name="apiBaseUrl" type="url" className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary" placeholder="https://api.example.com/v1" />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="apiDocsUrl" className="text-zinc-300">Docs URL</Label>
                    <Input id="apiDocsUrl" name="apiDocsUrl" type="url" className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary" placeholder="https://docs.example.com" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="accessSummary" className="text-zinc-300">Access Summary</Label>
                    <Textarea id="accessSummary" name="accessSummary" className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary h-24 resize-none" placeholder="Explain how onboarding, credentials, support, or deployment works for buyers." />
                    <p className="text-xs text-zinc-400">Write this for renters. It should explain what they get after activation in one short paragraph.</p>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="systemPrompt" className="text-zinc-300">System Prompt</Label>
                    <Textarea id="systemPrompt" name="systemPrompt" className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary font-mono text-xs h-32" placeholder="Required for prompt-only products. Optional for provider-backed or API-integrated products." />
                  </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
                  <div>
                    <h3 className="font-display text-lg text-white">3. Pricing & Launch</h3>
                    <p className="text-sm text-zinc-400">Define how buyers evaluate and activate this listing.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="pricingModel" className="text-zinc-300">Pricing Model</Label>
                    <Select value={pricingModel} onValueChange={(value) => setPricingModel(value as ModelPricingMode)}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary">
                        <SelectValue placeholder="Select pricing model" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        {MODEL_PRICING_MODES.map((item) => (
                          <SelectItem key={item} value={item}>{item === "per_request" ? "Per request" : "Custom quote"}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-zinc-400">{pricingGuidance.summary}</p>
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="modelStatus" className="text-zinc-300">Listing Status</Label>
                    <Select value={modelStatus} onValueChange={(value) => setModelStatus(value as ModelStatus)}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        {MODEL_STATUSES.map((item) => (
                          <SelectItem key={item} value={item}>{formatStatus(item)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {pricingModel === "per_request" ? (
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <Label htmlFor="pricePerQuery" className="text-zinc-300">Price per Request ($)</Label>
                      <Input id="pricePerQuery" name="pricePerQuery" type="number" step="0.0001" min="0" required className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary" placeholder="0.0500" />
                    </div>
                  ) : (
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <Label htmlFor="pricingLabel" className="text-zinc-300">Pricing Label</Label>
                      <Input id="pricingLabel" name="pricingLabel" required className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary" placeholder="Custom team pricing" />
                    </div>
                  )}
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="tags" className="text-zinc-300">Tags</Label>
                    <Input id="tags" name="tags" className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary" placeholder="contracts, review, compliance" />
                  </div>
                </div>
                </div>

                <QualityMeter specialistNiche={specialistNiche} />

                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
                    <div className="text-xs uppercase tracking-[0.18em] text-zinc-400">What renters will understand</div>
                    <ul className="mt-4 space-y-3 text-sm text-zinc-300">
                      <li className="flex items-start gap-3"><CircleCheckBig className="mt-0.5 h-4 w-4 text-primary" /> What this product is for and how it differs from generic models.</li>
                      <li className="flex items-start gap-3"><CircleCheckBig className="mt-0.5 h-4 w-4 text-primary" /> Whether access is immediate, quoted, managed, or self-hosted.</li>
                      <li className="flex items-start gap-3"><CircleCheckBig className="mt-0.5 h-4 w-4 text-primary" /> What pricing and activation path to expect before committing.</li>
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
                    <div className="text-xs uppercase tracking-[0.18em] text-zinc-400">Publish checklist</div>
                    <ul className="mt-4 space-y-3 text-sm text-zinc-300">
                      {onboardingGuidance.requirements.map((requirement) => (
                        <li key={requirement} className="flex items-start gap-3"><CircleCheckBig className="mt-0.5 h-4 w-4 text-primary" /> {requirement}</li>
                      ))}
                      <li className="flex items-start gap-3"><CircleCheckBig className="mt-0.5 h-4 w-4 text-primary" /> Clear tags and pricing so renters can evaluate quickly.</li>
                    </ul>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-zinc-800">
                  <Button type="submit" disabled={createMutation.isPending} className="bg-white text-black hover:bg-zinc-200">
                    {createMutation.isPending ? "Publishing..." : "Publish Model"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="rentals" className="w-full">
          <TabsList className="bg-zinc-900/50 border border-zinc-800 p-1 rounded-xl mb-8">
            <TabsTrigger value="rentals" className="rounded-lg data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
              My Rentals{activeRentals > 0 && <span className="ml-2 text-xs bg-zinc-800 data-[state=active]:bg-zinc-700 rounded-full px-2 py-0.5">{activeRentals}</span>}
            </TabsTrigger>
            <TabsTrigger value="models" className="rounded-lg data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
              Hosted Models{activeListings > 0 && <span className="ml-2 text-xs bg-zinc-800 data-[state=active]:bg-zinc-700 rounded-full px-2 py-0.5">{activeListings}</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rentals" className="outline-none">
            {loadingRentals ? (
              <div className="text-zinc-400">Loading rentals...</div>
            ) : rentals?.length === 0 ? (
              <div className="section-frame p-12 text-center">
                <Key className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-xl font-display font-bold text-white mb-2">No active rentals</h3>
                <p className="text-zinc-400 mb-6 max-w-md mx-auto">You haven't rented any specialized models yet. Head over to the marketplace to find the perfect intelligence for your needs.</p>
                <Link href="/">
                  <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-full">
                    Explore Marketplace
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {rentals?.map((rental) => (
                  <div key={rental.id} className="section-frame p-6 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-display font-bold text-lg text-white">{rental.model.name}</h4>
                        <span className="text-xs text-zinc-400">Rented on {new Date(rental.createdAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium flex items-center gap-1.5">
                        <Activity className="w-3 h-3" /> Active
                      </span>
                    </div>
                    <div className="bg-black/50 border border-zinc-800/50 rounded-xl p-4 font-mono text-sm text-zinc-400 mt-auto">
                      <div className="text-xs text-zinc-500 mb-1">API Endpoint</div>
                      <div className="text-white select-all">POST /api/inference/{rental.model.id}</div>
                      <div className="text-xs text-zinc-500 mt-3 mb-1">Auth Header</div>
                      <div className="text-white truncate">Bearer nm_{rental.id}_auth_token</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="models" className="outline-none">
            {loadingModels ? (
              <div className="text-zinc-500">Loading models...</div>
            ) : myModels?.length === 0 ? (
              <div className="section-frame p-12 text-center">
                <Box className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-xl font-display font-bold text-white mb-2">No hosted models</h3>
                <p className="text-zinc-500 mb-6">You haven't published any models to the marketplace yet.</p>
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  variant="outline" 
                  className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-full"
                >
                  Publish your first model
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {myModels?.map((model) => (
                  <HostedModelCard key={model.id} model={model} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
