import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { InsertRental, RentalWithDetails } from "@shared/schema";

export type UseRentalsParams = {
  renterId?: number;
  page?: number;
  pageSize?: number;
};

export function useRentals(params?: UseRentalsParams) {
  return useQuery<RentalWithDetails[]>({
    queryKey: [api.rentals.list.path, params],
    queryFn: async () => {
      const url = new URL(api.rentals.list.path, window.location.origin);
      if (params?.renterId) {
        url.searchParams.set("renterId", params.renterId.toString());
      }
      if (params?.page) {
        url.searchParams.set("page", params.page.toString());
      }
      if (params?.pageSize) {
        url.searchParams.set("pageSize", params.pageSize.toString());
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch rentals");
      return res.json();
    },
  });
}

export function useCreateRental(userId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertRental) => {
      const res = await fetch(api.rentals.create.path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { "x-user-id": String(userId) } : {}),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create rental");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.rentals.list.path] });
    },
  });
}
