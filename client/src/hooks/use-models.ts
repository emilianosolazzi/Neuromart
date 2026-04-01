import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type {
  AiModelWithCreator,
  CreateAiModelInput,
  ModelOnboardingMode,
  ModelPricingMode,
  ModelProvider,
  ModelStatus,
} from "@shared/schema";

export type UseModelsParams = {
  category?: string;
  creatorId?: number;
  onboardingMode?: ModelOnboardingMode;
  pricingModel?: ModelPricingMode;
  provider?: ModelProvider;
  modelStatus?: ModelStatus;
  page?: number;
  pageSize?: number;
};

export function useModels(params?: UseModelsParams) {
  return useQuery<AiModelWithCreator[]>({
    queryKey: [api.models.list.path, params],
    queryFn: async () => {
      const url = new URL(api.models.list.path, window.location.origin);
      if (params?.category && params.category !== "All") {
        url.searchParams.set("category", params.category);
      }
      if (params?.creatorId) {
        url.searchParams.set("creatorId", params.creatorId.toString());
      }
      if (params?.onboardingMode) {
        url.searchParams.set("onboardingMode", params.onboardingMode);
      }
      if (params?.pricingModel) {
        url.searchParams.set("pricingModel", params.pricingModel);
      }
      if (params?.provider) {
        url.searchParams.set("provider", params.provider);
      }
      if (params?.modelStatus) {
        url.searchParams.set("modelStatus", params.modelStatus);
      }
      if (params?.page) {
        url.searchParams.set("page", params.page.toString());
      }
      if (params?.pageSize) {
        url.searchParams.set("pageSize", params.pageSize.toString());
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

export function useCreateModel(userId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAiModelInput) => {
      const res = await fetch(api.models.create.path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { "x-user-id": String(userId) } : {}),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.message ?? "Failed to create model");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.models.list.path] });
    },
  });
}

export type ModelStats = {
  modelId: number;
  totalRentals: number;
  activeRentals: number;
};

export function useModelStats(modelId: number | null, userId: number | null) {
  return useQuery<ModelStats>({
    queryKey: ["/api/models", modelId, "stats", userId],
    queryFn: async () => {
      const res = await fetch(`/api/models/${modelId}/stats`, {
        headers: {
          ...(userId ? { "x-user-id": String(userId) } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to fetch model stats");
      return res.json();
    },
    enabled: !!modelId && !!userId,
  });
}
