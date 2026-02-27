import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertAiModel, AiModelWithCreator } from "@shared/schema";

export function useModels(category?: string) {
  return useQuery<AiModelWithCreator[]>({
    queryKey: [api.models.list.path, category],
    queryFn: async () => {
      const url = new URL(api.models.list.path, window.location.origin);
      if (category && category !== "All") {
        url.searchParams.set("category", category);
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch models");
      return res.json();
    },
  });
}

export function useModel(id: number | null) {
  return useQuery<AiModelWithCreator>({
    queryKey: [api.models.get.path, id],
    queryFn: async () => {
      if (!id) throw new Error("ID is required");
      const url = buildUrl(api.models.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Model not found");
        throw new Error("Failed to fetch model");
      }
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertAiModel) => {
      const res = await fetch(api.models.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create model");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.models.list.path] });
    },
  });
}
