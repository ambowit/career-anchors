import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCpWallet } from "@/hooks/useCpWallet";
import { toast } from "sonner";

export interface PurchaseResult {
  success: boolean;
  remainingBalance?: number;
  error?: string;
}

export interface ServiceInfo {
  serviceType: string;
  serviceId?: string;
  serviceName: string;
  cpPrice: number;
  description?: string;
}

export function useCpPurchase() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { wallet, membership } = useCpWallet();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [pendingService, setPendingService] = useState<ServiceInfo | null>(null);
  const [onPurchaseSuccess, setOnPurchaseSuccess] = useState<(() => void) | null>(null);

  const discountRate = membership?.current_tier?.discount_rate ?? 1;
  const getDiscountedPrice = (originalPrice: number): number => {
    return Math.ceil(originalPrice * discountRate);
  };

  const totalBalance = wallet?.total_balance ?? 0;

  const purchaseMutation = useMutation({
    mutationFn: async (service: ServiceInfo) => {
      if (!user?.id) throw new Error("Not authenticated");

      const finalPrice = getDiscountedPrice(service.cpPrice);

      const { data, error } = await supabase.functions.invoke("consume-cp", {
        body: {
          user_id: user.id,
          amount: finalPrice,
          description: service.description || service.serviceName,
          service_type: service.serviceType,
          service_id: service.serviceId,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data as PurchaseResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cp-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["cp-transactions"] });
      setShowPurchaseModal(false);
      if (onPurchaseSuccess) {
        onPurchaseSuccess();
        setOnPurchaseSuccess(null);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const initiatePurchase = (service: ServiceInfo, successCallback?: () => void) => {
    setPendingService(service);
    if (successCallback) {
      setOnPurchaseSuccess(() => successCallback);
    }
    setShowPurchaseModal(true);
  };

  const confirmPurchase = () => {
    if (!pendingService) return;
    purchaseMutation.mutate(pendingService);
  };

  const cancelPurchase = () => {
    setShowPurchaseModal(false);
    setPendingService(null);
    setOnPurchaseSuccess(null);
  };

  const canAfford = (cpPrice: number): boolean => {
    return totalBalance >= getDiscountedPrice(cpPrice);
  };

  return {
    showPurchaseModal,
    pendingService,
    totalBalance,
    discountRate,
    getDiscountedPrice,
    canAfford,
    initiatePurchase,
    confirmPurchase,
    cancelPurchase,
    isPurchasing: purchaseMutation.isPending,
    purchaseError: purchaseMutation.error,
  };
}
