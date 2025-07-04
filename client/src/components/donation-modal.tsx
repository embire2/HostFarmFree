import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Server, Globe, Database, Mail, Zap, Star, Crown, Gift, ArrowLeft } from "lucide-react";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GiftTier {
  amount: number;
  title: string;
  description: string;
  features: string[];
  icon: React.ComponentType<any>;
  color: string;
  popular?: boolean;
  gifts: {
    type: 'vps' | 'hosting' | 'both';
    details: any;
  }[];
}

const giftTiers: GiftTier[] = [
  {
    amount: 5,
    title: "Basic VPS",
    description: "Perfect for getting started with your own server",
    icon: Server,
    color: "from-blue-500 to-cyan-500",
    features: [
      "1 vCPU Core",
      "1GB RAM",
      "40GB SSD Storage",
      "1 IPv4 Address",
      "Unlimited Traffic",
      "Premium Forum Badge"
    ],
    gifts: [{
      type: 'vps',
      details: {
        cpu: "1 vCPU",
        ram: "1GB",
        storage: "40GB SSD",
        ipv4: "1 IPv4",
        os: "Ubuntu 22.04 LTS / Debian 12 / Windows 2025",
        traffic: "Unlimited",
        extras: ["Premium Forum Badge"]
      }
    }]
  },
  {
    amount: 10,
    title: "Growth Package",
    description: "Choose between hosting or enhanced VPS",
    icon: Zap,
    color: "from-green-500 to-emerald-500",
    popular: true,
    features: [
      "50GB Web Hosting + .im Domain",
      "OR 2 vCPU + 2GB RAM VPS",
      "Premium Support",
      "Discord Forum Access",
      "Priority Queue"
    ],
    gifts: [
      {
        type: 'hosting',
        details: {
          storage: "50GB",
          domain: ".im Domain Included",
          bandwidth: "Unlimited",
          databases: "Unlimited MySQL",
          emails: "Unlimited Email Accounts",
          support: "Premium Support"
        }
      },
      {
        type: 'vps',
        details: {
          cpu: "2 vCPU",
          ram: "2GB",
          storage: "80GB SSD",
          ipv4: "1 IPv4",
          os: "Ubuntu 22.04 LTS / Debian 12 / Windows 2025",
          traffic: "Unlimited",
          extras: ["Premium Support", "Discord Access"]
        }
      }
    ]
  },
  {
    amount: 15,
    title: "Professional",
    description: "Enhanced resources with premium features",
    icon: Crown,
    color: "from-purple-500 to-pink-500",
    features: [
      "100GB Web Hosting + .im Domain",
      "OR Premium VPS (4 vCPU + 4GB RAM)",
      "Discord Server Badges",
      "Priority Support",
      "Custom Configurations"
    ],
    gifts: [
      {
        type: 'hosting',
        details: {
          storage: "100GB",
          domain: ".im Domain Included",
          bandwidth: "Unlimited",
          databases: "Unlimited MySQL",
          emails: "Unlimited Email Accounts",
          support: "Priority Support",
          extras: ["Discord Badges", "Custom Configurations"]
        }
      },
      {
        type: 'vps',
        details: {
          cpu: "4 vCPU",
          ram: "4GB",
          storage: "120GB SSD",
          ipv4: "1 IPv4",
          os: "Ubuntu 22.04 LTS / Debian 12 / Windows 2025",
          traffic: "Unlimited",
          extras: ["Discord Badges", "Priority Support", "Custom Configurations"]
        }
      }
    ]
  },
  {
    amount: 20,
    title: "Ultimate Combo",
    description: "Get both hosting AND VPS with premium perks",
    icon: Gift,
    color: "from-orange-500 to-red-500",
    features: [
      "100GB Web Hosting + .im Domain",
      "PLUS 4 vCPU + 4GB RAM VPS",
      "Discord Nitro Basic (1 Month)",
      "VIP Support Channel",
      "Custom Server Configurations"
    ],
    gifts: [{
      type: 'both',
      details: {
        hosting: {
          storage: "100GB",
          domain: ".im Domain Included",
          bandwidth: "Unlimited",
          databases: "Unlimited MySQL",
          emails: "Unlimited Email Accounts"
        },
        vps: {
          cpu: "4 vCPU",
          ram: "4GB",
          storage: "120GB SSD",
          ipv4: "1 IPv4",
          os: "Ubuntu 22.04 LTS / Debian 12 / Windows 2025",
          traffic: "Unlimited"
        },
        extras: ["Discord Nitro Basic", "VIP Support", "Custom Configurations"]
      }
    }]
  }
];

// Payment form component that uses Stripe Elements
const PaymentForm = ({ selectedTier, selectedGift, onBack, onClose }: {
  selectedTier: GiftTier;
  selectedGift: any;
  onBack: () => void;
  onClose: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      console.error('Stripe or elements not loaded');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/donation-success`,
        },
      });

      if (error) {
        console.error('Payment error:', error);
        toast({
          title: "Payment Failed",
          description: error.message || "Unknown payment error",
          variant: "destructive",
        });
      } else {
        // Payment succeeded - user will be redirected to success page
        onClose();
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment Error",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <h3 className="text-xl font-bold">Complete Your Subscription</h3>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
        <h4 className="font-bold text-lg mb-2">
          ${selectedTier.amount}/month - {selectedTier.title}
        </h4>
        <p className="text-sm text-muted-foreground mb-2">
          Gift: {selectedGift.type === 'both' ? 'Hosting + VPS Combo' : 
                selectedGift.type === 'hosting' ? 'Web Hosting Package' : 'VPS Server'}
        </p>
        <p className="text-xs text-muted-foreground">
          Your gift will be activated within 24 hours after successful payment.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 border rounded-lg">
          <PaymentElement />
        </div>

        <Button
          type="submit"
          disabled={!stripe || isLoading}
          className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 text-lg font-bold hover:scale-105 transition-all"
        >
          {isLoading ? "Processing..." : `Subscribe for $${selectedTier.amount}/month`}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Secure payment powered by Stripe. You can cancel anytime.
        </p>
      </form>
    </div>
  );
};

export default function DonationModal({ isOpen, onClose }: DonationModalProps) {
  const [selectedTier, setSelectedTier] = useState<GiftTier | null>(null);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [paymentStep, setPaymentStep] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTierSelect = (tier: GiftTier) => {
    setSelectedTier(tier);
    setSelectedGift(null);
    setPaymentStep(false);
  };

  const handleGiftSelect = (gift: any) => {
    setSelectedGift(gift);
  };

  const handleSubscribe = async () => {
    if (!selectedTier || !selectedGift) {
      toast({
        title: "Selection Required",
        description: "Please select a gift option first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Creating subscription with:', {
        amount: selectedTier.amount * 100,
        giftTier: `$${selectedTier.amount}`,
        giftType: selectedGift.type,
        giftDetails: JSON.stringify(selectedGift.details)
      });

      const response = await apiRequest("POST", "/api/create-subscription", {
        amount: selectedTier.amount * 100,
        giftTier: `$${selectedTier.amount}`,
        giftType: selectedGift.type,
        giftDetails: JSON.stringify(selectedGift.details)
      });

      const data = await response.json();
      console.log('Subscription response:', data);

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setPaymentStep(true);
      } else {
        throw new Error('No client secret received');
      }
    } catch (error) {
      console.error('Subscription creation error:', error);
      toast({
        title: "Subscription Failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setPaymentStep(false);
    setClientSecret(null);
  };

  const handleClose = () => {
    setSelectedTier(null);
    setSelectedGift(null);
    setPaymentStep(false);
    setClientSecret(null);
    onClose();
  };

  if (paymentStep && clientSecret) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete Your Subscription</DialogTitle>
          </DialogHeader>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm
              selectedTier={selectedTier!}
              selectedGift={selectedGift}
              onBack={handleBack}
              onClose={handleClose}
            />
          </Elements>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Support HostFarm.org & Get Amazing Gifts
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {giftTiers.map((tier) => (
            <Card 
              key={tier.amount}
              className={`cursor-pointer transition-all hover:scale-105 ${
                selectedTier?.amount === tier.amount 
                  ? 'ring-2 ring-primary shadow-lg' 
                  : 'hover:shadow-md'
              } ${tier.popular ? 'ring-2 ring-yellow-400' : ''}`}
              onClick={() => handleTierSelect(tier)}
            >
              <CardContent className="p-6">
                {tier.popular && (
                  <Badge className="bg-yellow-500 text-white mb-2">
                    Most Popular
                  </Badge>
                )}
                
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${tier.color} flex items-center justify-center mb-4`}>
                  <tier.icon className="w-6 h-6 text-white" />
                </div>
                
                <div className="text-3xl font-bold text-primary mb-2">
                  ${tier.amount}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </div>
                
                <h3 className="text-xl font-bold mb-2">{tier.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>
                
                <ul className="space-y-2">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedTier && selectedTier.gifts.length > 1 && (
          <div className="mt-8">
            <h3 className="text-2xl font-bold mb-4 text-center">
              Choose Your Gift for ${selectedTier.amount}/month
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedTier.gifts.map((gift, idx) => (
                <Card 
                  key={idx}
                  className={`cursor-pointer transition-all hover:scale-102 ${
                    selectedGift === gift ? 'ring-2 ring-secondary shadow-lg' : 'hover:shadow-md'
                  }`}
                  onClick={() => handleGiftSelect(gift)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      {gift.type === 'hosting' && <Globe className="w-8 h-8 text-blue-500" />}
                      {gift.type === 'vps' && <Server className="w-8 h-8 text-green-500" />}
                      {gift.type === 'both' && <Gift className="w-8 h-8 text-purple-500" />}
                      
                      <h4 className="text-xl font-bold">
                        {gift.type === 'hosting' ? 'Web Hosting Package' : 
                         gift.type === 'vps' ? 'VPS Server' : 'Hosting + VPS Combo'}
                      </h4>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {gift.type === 'hosting' && (
                        <>
                          <div className="flex justify-between">
                            <span>Storage:</span>
                            <span className="font-semibold">{gift.details.storage}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Domain:</span>
                            <span className="font-semibold">{gift.details.domain}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Bandwidth:</span>
                            <span className="font-semibold">{gift.details.bandwidth}</span>
                          </div>
                        </>
                      )}
                      
                      {gift.type === 'vps' && (
                        <>
                          <div className="flex justify-between">
                            <span>CPU:</span>
                            <span className="font-semibold">{gift.details.cpu}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>RAM:</span>
                            <span className="font-semibold">{gift.details.ram}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Storage:</span>
                            <span className="font-semibold">{gift.details.storage}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Operating System:</span>
                            <span className="font-semibold text-xs">{gift.details.os}</span>
                          </div>
                        </>
                      )}
                      
                      {gift.type === 'both' && (
                        <div className="space-y-3">
                          <div className="bg-blue-50 p-3 rounded">
                            <h5 className="font-bold text-blue-700 mb-1">Hosting Package</h5>
                            <div className="text-xs space-y-1">
                              <div>Storage: {gift.details.hosting.storage}</div>
                              <div>Domain: {gift.details.hosting.domain}</div>
                            </div>
                          </div>
                          <div className="bg-green-50 p-3 rounded">
                            <h5 className="font-bold text-green-700 mb-1">VPS Server</h5>
                            <div className="text-xs space-y-1">
                              <div>CPU: {gift.details.vps.cpu}</div>
                              <div>RAM: {gift.details.vps.ram}</div>
                              <div>Storage: {gift.details.vps.storage}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {selectedTier && (selectedTier.gifts.length === 1 || selectedGift) && (
          <div className="mt-8 text-center">
            <Button 
              onClick={handleSubscribe}
              disabled={loading}
              className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-3 text-lg font-bold rounded-lg hover:scale-105 transition-all"
            >
              {loading ? "Processing..." : `Subscribe for $${selectedTier.amount}/month`}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              You can cancel anytime. Your gift will be activated within 24 hours.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}