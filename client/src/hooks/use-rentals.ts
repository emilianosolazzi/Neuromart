import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { InsertRental, RentalWithDetails } from "@shared/schema";

export function useRentals(renterId?: number | null) {
  return useQuery<RentalWithDetails[]>({
    queryKey: [api.rentals.list.path, renterId],
    queryFn: async () => {
      const url = new URL(api.rentals.list.path, window.location.origin);
      if (renterId) {
        url.searchParams.set("renterId", renterId.toString());
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch rentals");
      return res.json();
    },
    enabled: renterId !== undefined, // Can fetch all if explicitly not filtering
  });
}

export function useCreateRental() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertRental) => {
      const res = await fetch(api.rentals.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
