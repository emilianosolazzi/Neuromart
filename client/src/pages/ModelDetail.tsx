import { useParams, useLocation } from "wouter";
import { useModel } from "@/hooks/use-models";
import { useCreateRental } from "@/hooks/use-rentals";
import { useUser } from "@/lib/user-context";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Cpu, Key, Lock, User as UserIcon } from "lucide-react";
import { Link } from "wouter";

import fallbackImg1 from "@assets/IMG_3873_1772163282919.jpeg";
import fallbackImg2 from "@assets/IMG_3873_1772163296289.jpeg";

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

  const imgUrl = model.imageUrl || (model.id % 2 === 0 ? fallbackImg1 : fallbackImg2);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 lg:py-20 max-w-6xl">
        <Link href="/" className="inline-flex items-center text-zinc-500 hover:text-white mb-10 transition-colors">
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
                <img 
                  src={imgUrl} 
                  alt={model.name} 
                  className="w-full h-full object-cover rounded-2xl"
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
            <div className="inline-block px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 w-fit mb-6">
              {model.category}
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
            </div>

            <h3 className="text-xl font-display font-bold mb-4">About this model</h3>
            <p className="text-lg text-zinc-400 leading-relaxed mb-10">
              {model.description}
            </p>

            {/* System Prompt Peek */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Cpu className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-2 text-zinc-300 font-medium mb-3">
                <Lock className="w-4 h-4" /> Base System Prompt
              </div>
              <div className="font-mono text-sm text-zinc-500 line-clamp-3">
                {model.systemPrompt}
              </div>
              <div className="mt-3 text-xs text-primary font-medium flex items-center gap-1">
                <Key className="w-3 h-3" /> Rent to unlock full prompt
              </div>
            </div>

            {/* CTA */}
            <div className="bg-zinc-900 border border-accent/20 rounded-3xl p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl shadow-accent/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <p className="text-sm text-accent uppercase tracking-widest font-display font-bold mb-1">Premium Access</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white tracking-tighter">${model.pricePerQuery}</span>
                  <span className="text-zinc-500 font-medium">per query</span>
                </div>
              </div>
              <Button 
                size="lg" 
                className="bg-accent-gradient text-white border-0 rounded-full px-10 py-8 text-xl font-bold shadow-xl shadow-accent/20 hover:shadow-accent/40 hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto relative z-10"
                onClick={handleRent}
                disabled={rentMutation.isPending}
              >
                {rentMutation.isPending ? "Configuring Access..." : "Rent Access Now"}
              </Button>
            </div>
            
            <ul className="mt-8 space-y-3">
              {[
                "Instant API access via Neuromart Gateway",
                "Scalable infrastructure provided automatically",
                "Cancel anytime, pay only for what you use"
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-zinc-400">
                  <CheckCircle2 className="w-4 h-4 text-zinc-500" /> {feature}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
