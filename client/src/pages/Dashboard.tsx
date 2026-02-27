import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUser } from "@/lib/user-context";
import { useRentals } from "@/hooks/use-rentals";
import { useModels, useCreateModel } from "@/hooks/use-models";
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
import { Box, Plus, Activity, Key } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { userId } = useUser();
  const { toast } = useToast();
  
  const { data: rentals, isLoading: loadingRentals } = useRentals(userId);
  const { data: allModels, isLoading: loadingModels } = useModels();
  
  // Filter models created by this user
  const myModels = allModels?.filter(m => m.creatorId === userId);

  const createMutation = useCreateModel();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateModel = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      systemPrompt: formData.get("systemPrompt") as string,
      category: formData.get("category") as string,
      pricePerQuery: formData.get("pricePerQuery") as string, // Backend expects string/numeric
      creatorId: userId,
      imageUrl: formData.get("imageUrl") as string || null,
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
          <p className="text-zinc-500">Please select a mock user from the top right dropdown to view your dashboard.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-white">Dashboard</h1>
            <p className="text-zinc-400 mt-2">Manage your active rentals and hosted models.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-black hover:bg-zinc-200 rounded-full shadow-lg shadow-white/5 font-semibold px-6">
                <Plus className="w-4 h-4 mr-2" /> Host New Model
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Host a new AI Model</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Publish your specialized model to the marketplace and earn from API usage.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateModel} className="space-y-6 mt-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="name" className="text-zinc-300">Model Name</Label>
                    <Input id="name" name="name" required className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary" placeholder="e.g. Senior React Developer" />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="category" className="text-zinc-300">Category</Label>
                    <Select name="category" required defaultValue="Chat">
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="Chat">Chat</SelectItem>
                        <SelectItem value="Code">Code</SelectItem>
                        <SelectItem value="Image">Image</SelectItem>
                        <SelectItem value="Voice">Voice</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="description" className="text-zinc-300">Description</Label>
                    <Textarea id="description" name="description" required className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary h-24 resize-none" placeholder="What does this model excel at?" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="systemPrompt" className="text-zinc-300">System Prompt</Label>
                    <Textarea id="systemPrompt" name="systemPrompt" required className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary font-mono text-xs h-32" placeholder="You are a highly capable AI that..." />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="pricePerQuery" className="text-zinc-300">Price per Query ($)</Label>
                    <Input id="pricePerQuery" name="pricePerQuery" type="number" step="0.0001" min="0" required className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary" placeholder="0.0050" />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="imageUrl" className="text-zinc-300">Image URL (Optional)</Label>
                    <Input id="imageUrl" name="imageUrl" type="url" className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary" placeholder="https://..." />
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
              My Rentals
            </TabsTrigger>
            <TabsTrigger value="models" className="rounded-lg data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
              Hosted Models
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rentals" className="outline-none">
            {loadingRentals ? (
              <div className="text-zinc-500">Loading rentals...</div>
            ) : rentals?.length === 0 ? (
              <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-12 text-center">
                <Key className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-xl font-display font-bold text-white mb-2">No active rentals</h3>
                <p className="text-zinc-500 mb-6 max-w-md mx-auto">You haven't rented any specialized models yet. Head over to the marketplace to find the perfect intelligence for your needs.</p>
                <Link href="/">
                  <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-full">
                    Explore Marketplace
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {rentals?.map((rental) => (
                  <div key={rental.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-display font-bold text-lg text-white">{rental.model.name}</h4>
                        <span className="text-xs text-zinc-500">Rented on {new Date(rental.createdAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium flex items-center gap-1.5">
                        <Activity className="w-3 h-3" /> Active
                      </span>
                    </div>
                    <div className="bg-black/50 border border-zinc-800/50 rounded-xl p-4 font-mono text-sm text-zinc-400 mt-auto">
                      <div className="text-xs text-zinc-600 mb-1">API Endpoint</div>
                      <div className="text-white select-all">POST /api/inference/{rental.model.id}</div>
                      <div className="text-xs text-zinc-600 mt-3 mb-1">Auth Header</div>
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
              <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-12 text-center">
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
                  <div key={model.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center justify-between">
                    <div>
                      <h4 className="font-display font-bold text-lg text-white mb-1">{model.name}</h4>
                      <div className="text-sm text-zinc-400 mb-3">{model.category} • ${model.pricePerQuery}/query</div>
                      <Link href={`/models/${model.id}`} className="text-xs text-primary font-medium hover:underline">
                        View in Marketplace
                      </Link>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">0</div>
                      <div className="text-xs text-zinc-500">Total Queries</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
