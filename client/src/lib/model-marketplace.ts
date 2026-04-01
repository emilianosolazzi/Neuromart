import type { AiModel, ModelOnboardingMode, ModelPricingMode, ModelProvider } from "@shared/schema";

/* ------------------------------------------------------------------ */
/*  100 Specialist Niches — 10 categories × 10 niches each            */
/* ------------------------------------------------------------------ */

export const SPECIALIST_NICHES: Record<string, string[]> = {
  "DeFi & Web3": [
    "MEV Arbitrage Predictor",
    "Flash Loan Liquidator",
    "Governance Whale Tracker",
    "Smart Contract Vuln Scanner",
    "Impermanent Loss Calculator",
    "ZK-Proof Gas Optimizer",
    "Cross-Chain Yield Ranker",
    "NFT Wash-Trade Detector",
    "Restaking Risk Auditor",
    "Travel Rule Compliance Bot",
  ],
  Industrial: [
    "Grid-Edge Load Balancer",
    "Predictive Valve Failure",
    "Subsurface Soil Analyst",
    "Cold-Chain Pharma Auditor",
    "Precision Ag-Drone Planner",
    "HVAC Economizer Tuner",
    "Container Load Optimizer",
    "Steel Fatigue Monitor",
    "Telecom Shadow Mapper",
    "Warehouse Robotics Router",
  ],
  "Bio-Tech": [
    "Peptide Fold Optimizer",
    "Cortisol-Sleep Mapper",
    "Microbiome Diet Auditor",
    "Drug Interaction Checker",
    "Nootropic Synergy Engine",
    "Epigenetic Clock Estimator",
    "Glucose Sensitivity Model",
    "Vagal Tone Coach",
    "Allergen Forecast API",
    "Telomere Length Tracker",
  ],
  "Creative & Media": [
    "Vocal Timbre Matcher",
    "Diegetic Sound Designer",
    "Parametric Arch Generator",
    "Procedural Lore Builder",
    "Glitch Art Entropy Engine",
    "Influencer Vibe Auditor",
    "Color Grade Transfer API",
    "Script Branch Simulator",
    "Tech-Wear Pattern Drafter",
    "Synth Patch Recreator",
  ],
  "Legal & Security": [
    "Patent Prior Art Finder",
    "Contract Small Print Scanner",
    "Zero-Day Correlation Engine",
    "Deepfake Liveness Detector",
    "OSINT Financial Tracer",
    "Dead-Drop Secure Router",
    "Metadata Sanitizer",
    "Phishing Vibe Checker",
    "Insider Trade Pattern Detector",
    "Side-Channel Leak Auditor",
  ],
  "Engineering & DevOps": [
    "K8s Cost Shrinker",
    "C-to-Rust Translator",
    "Slow Query Optimizer",
    "Breaking Change Notifier",
    "Flaky Test Hunter",
    "Z-Index Stack Resolver",
    "Doc-to-Test Generator",
    "Cold Start Predictor",
    "Injection Fuzz Tester",
    "Semantic Commit Fixer",
  ],
  Logistics: [
    "Drone Battery Path Planner",
    "Empty-Leg Flight Finder",
    "Harmonized Code Matcher",
    "Warehouse Slotting Optimizer",
    "Port Delay Predictor",
    "Stockout Risk Predictor",
    "Carbon Offset Verifier",
    "Returns Grade Classifier",
    "Single-Point Failure Mapper",
    "Pallet Stability Auditor",
  ],
  "Academic & Research": [
    "Multi-Paper Synthesizer",
    "Genealogy Record Linker",
    "Citation Circle Finder",
    "Ancient Script Decipherer",
    "Grant Alignment Matcher",
    "P-Hacking Detector",
    "Solubility Predictor",
    "Climate Micro-Localizer",
    "Osteological Classifier",
    "Space Debris Predictor",
  ],
  "Urban & Civic": [
    "Zoning Loophole Finder",
    "Rental Yield Estimator",
    "Low-Stress Path Finder",
    "FOIA Request Automator",
    "Lease Clause Auditor",
    "Tax Appraisal Challenger",
    "Gentrification Predictor",
    "Pothole Repair Estimator",
    "Circular Economy Mapper",
    "Offline Mesh Coordinator",
  ],
  Strategy: [
    "Tone De-Escalator",
    "Leverage Position Identifier",
    "Crisis PR Simulator",
    "Product Leak Correlator",
    "Cognitive Bias Neutralizer",
    "Sentiment Momentum Scraper",
    "White-Label API Wrapper",
    "Minimalist Sprint Planner",
    "Truth Verification API",
    "Legacy System Agent",
  ],
};

/* ------------------------------------------------------------------ */
/*  Quality scoring — computed from listing completeness               */
/* ------------------------------------------------------------------ */

export type QualityTier = "needs_work" | "verified" | "premium";

export interface QualityResult {
  score: number;
  max: number;
  tier: QualityTier;
  items: { label: string; met: boolean }[];
}

export function computeQualityScore(model: Partial<AiModel>): QualityResult {
  const items = [
    { label: "Name", met: !!model.name },
    { label: "Detailed description", met: (model.description?.length ?? 0) >= 50 },
    { label: "Specialist niche", met: !!model.specialistNiche },
    { label: "Documentation URL", met: !!model.apiDocsUrl },
    { label: "Access summary", met: !!model.accessSummary },
    { label: "Tags", met: !!model.tags },
  ];
  const score = items.filter((i) => i.met).length;
  const tier: QualityTier = score <= 2 ? "needs_work" : score <= 4 ? "verified" : "premium";
  return { score, max: items.length, tier, items };
}

export function formatQualityTier(tier: QualityTier) {
  switch (tier) {
    case "premium":
      return { label: "Premium", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" };
    case "verified":
      return { label: "Verified", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" };
    default:
      return { label: "Needs Work", color: "text-zinc-400", bg: "bg-zinc-400/10 border-zinc-400/20" };
  }
}

export function getNichesForCategory(category: string): string[] {
  return SPECIALIST_NICHES[category] ?? [];
}

/* ------------------------------------------------------------------ */
/*  Category icons (emoji shorthand)                                   */
/* ------------------------------------------------------------------ */

export const CATEGORY_ICONS: Record<string, string> = {
  "DeFi & Web3": "⛓️",
  Industrial: "🏗️",
  "Bio-Tech": "🧬",
  "Creative & Media": "🎨",
  "Legal & Security": "🔒",
  "Engineering & DevOps": "⚙️",
  Logistics: "🚚",
  "Academic & Research": "🔬",
  "Urban & Civic": "🏙️",
  Strategy: "🎯",
  Custom: "✨",
};

export function splitModelTags(tags?: string | null) {
  return (tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function formatProvider(provider?: ModelProvider | string | null) {
  if (!provider) {
    return "Independent";
  }

  switch (provider) {
    case "openai":
      return "OpenAI";
    case "anthropic":
      return "Anthropic";
    case "google":
      return "Google";
    case "azure":
      return "Azure";
    case "huggingface":
      return "Hugging Face";
    default:
      return "Custom";
  }
}

export function formatOnboardingMode(mode: ModelOnboardingMode | string) {
  switch (mode) {
    case "external_api":
      return "External API";
    case "provider_backed":
      return "Provider-backed";
    case "self_hosted":
      return "Self-hosted";
    default:
      return "Prompt-only";
  }
}

export function formatPricing(model: Pick<AiModel, "pricingModel" | "pricingLabel" | "pricePerQuery">) {
  if (model.pricingModel === "custom_quote") {
    return {
      primary: model.pricingLabel ?? "Custom quote",
      secondary: "contact for pricing",
    };
  }

  return {
    primary: model.pricePerQuery ? `$${model.pricePerQuery}` : "Custom",
    secondary: model.pricePerQuery ? "per request" : "pricing on request",
  };
}

export function formatStatus(status: string) {
  switch (status) {
    case "published":
      return "Published";
    case "beta":
      return "Beta";
    case "deprecated":
      return "Deprecated";
    case "archived":
      return "Archived";
    default:
      return "Draft";
  }
}

export function getOnboardingGuidance(mode: ModelOnboardingMode | string) {
  switch (mode) {
    case "external_api":
      return {
        title: "External API onboarding",
        summary: "Best for teams with a production API that renters can activate without moving infrastructure.",
        requirements: ["Endpoint URL", "Access summary", "Pricing plan"],
        renterOutcome: "Renter reviews docs, activates access, and receives integration details.",
      };
    case "provider_backed":
      return {
        title: "Provider-backed onboarding",
        summary: "Best for curated products built on top of OpenAI, Anthropic, Azure, Google, or Hugging Face models.",
        requirements: ["Provider", "Model identifier", "Positioning and tags"],
        renterOutcome: "Renter sees the base model, evaluates fit, and activates a managed offering.",
      };
    case "self_hosted":
      return {
        title: "Self-hosted onboarding",
        summary: "Best for open-source or private deployments where the creator controls the runtime environment.",
        requirements: ["Endpoint URL", "Docs URL", "Access summary"],
        renterOutcome: "Renter confirms deployment expectations and receives guided access after purchase.",
      };
    default:
      return {
        title: "Prompt-only onboarding",
        summary: "Best for expert workflows where the product value lives in the system prompt and packaging, not an external runtime.",
        requirements: ["System prompt", "Category", "Per-request price or quote"],
        renterOutcome: "Renter evaluates the workflow, unlocks the prompt package, and starts using it immediately.",
      };
  }
}

export function getPricingGuidance(mode: ModelPricingMode | string) {
  if (mode === "custom_quote") {
    return {
      title: "Custom quote",
      summary: "Use this when pricing depends on deployment size, support level, seats, or enterprise onboarding.",
    };
  }

  return {
    title: "Per request",
    summary: "Use this when renters can evaluate and scale usage with a simple transactional price.",
  };
}