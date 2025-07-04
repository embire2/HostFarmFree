import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Server, Globe, Database, Mail, Zap, Star, Crown, Gift } from "lucide-react";
import { loadStripe } from '@stripe/stripe-js';
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
        cpu: 1,
        ram: 1,
        storage: 40,
        ipv4: 1,
        os: ['Ubuntu 22.04', 'Debian 12']
      }
    }]
  },
  {
    amount: 10,
    title: "Enhanced Package",
    description: "Choose between hosting with domain OR enhanced VPS",
    icon: Globe,
    color: "from-green-500 to-emerald-500",
    popular: true,
    features: [
      "Option A: 50GB Hosting + .im Domain",
      "Option B: Enhanced VPS (2vCPU, 2GB RAM)",
      "cPanel Access (hosting)",
      "10 SQL Databases (hosting)",
      "Unlimited Email (hosting)",
      "Premium Forum Badge"
    ],
    gifts: [
      {
        type: 'hosting',
        details: {
          storage: 50,
          domain: '.im domain included',
          databases: 10,
          email: 'unlimited',
          subdomains: 10
        }
      },
      {
        type: 'vps',
        details: {
          cpu: 2,
          ram: 2,
          storage: 50,
          ipv4: 1,
          os: ['Ubuntu 22.04', 'Debian 12', 'Windows 2025']
        }
      }
    ]
  },
  {
    amount: 15,
    title: "Premium Package",
    description: "Choose between premium hosting OR premium VPS with Discord perks",
    icon: Crown,
    color: "from-purple-500 to-pink-500",
    features: [
      "Option A: 100GB Hosting + .im Domain",
      "Option B: Premium VPS (2vCPU, 3GB RAM)",
      "20 SQL Databases (hosting)",
      "Premium + VIP Discord Badges",
      "Priority Support",
      "Enhanced Resources"
    ],
    gifts: [
      {
        type: 'hosting',
        details: {
          storage: 100,
          domain: '.im domain included',
          databases: 20,
          email: 'unlimited',
          subdomains: 20
        }
      },
      {
        type: 'vps',
        details: {
          cpu: 2,
          ram: 3,
          storage: 100,
          ipv4: 1,
          os: ['Ubuntu 22.04', 'Debian 12', 'Windows 2025']
        }
      }
    ]
  },
  {
    amount: 20,
    title: "Ultimate Package",
    description: "Get BOTH hosting AND VPS plus Discord Nitro",
    icon: Gift,
    color: "from-orange-500 to-red-500",
    features: [
      "100GB Hosting + .im Domain",
      "AND Premium VPS (2vCPU, 3GB RAM, 1TB)",
      "Premium + VIP Discord Badges",
      "Discord Nitro Basic Subscription",
      "Priority Support",
      "Everything Included"
    ],
    gifts: [
      {
        type: 'both',
        details: {
          hosting: {
            storage: 100,
            domain: '.im domain included',
            databases: 20,
            email: 'unlimited',
            subdomains: 20
          },
          vps: {
            cpu: 2,
            ram: 3,
            storage: 1000,
            ipv4: 1,
            os: ['Ubuntu 22.04', 'Debian 12', 'Windows 2025']
          },
          extras: ['Discord Nitro Basic']
        }
      }
    ]
  }
];

export default function DonationModal({ isOpen, onClose }: DonationModalProps) {
  const [selectedTier, setSelectedTier] = useState<GiftTier | null>(null);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTierSelect = (tier: GiftTier) => {
    setSelectedTier(tier);
    if (tier.gifts.length === 1) {
      setSelectedGift(tier.gifts[0]);
    } else {
      setSelectedGift(null);
    }
  };

  const handleGiftSelect = (gift: any) => {
    setSelectedGift(gift);
  };

  const handleSubscribe = async () => {
    if (!selectedTier || !selectedGift) {
      toast({
        title: "Please select a donation tier and gift option",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/create-subscription", {
        amount: selectedTier.amount * 100, // Convert to cents
        giftTier: `$${selectedTier.amount}`,
        giftType: selectedGift.type,
        giftDetails: JSON.stringify(selectedGift.details)
      });

      const { clientSecret } = await response.json();
      
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error } = await stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/donation-success`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Support HostFarm.org & Get Amazing Gifts
          </DialogTitle>
          <p className="text-center text-muted-foreground text-lg">
            Monthly donations help us provide free hosting to everyone. Choose your gift tier below:
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {giftTiers.map((tier) => {
            const IconComponent = tier.icon;
            return (
              <Card 
                key={tier.amount} 
                className={`relative cursor-pointer transition-all hover:scale-105 ${
                  selectedTier?.amount === tier.amount 
                    ? 'ring-2 ring-primary shadow-lg' 
                    : 'hover:shadow-md'
                } ${tier.popular ? 'border-primary' : ''}`}
                onClick={() => handleTierSelect(tier)}
              >
                {tier.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${tier.color} flex items-center justify-center mb-4`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{tier.title}</h3>
                  <div className="text-3xl font-bold text-primary mb-2">
                    ${tier.amount}<span className="text-sm text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>
                  <ul className="space-y-2">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selectedTier && selectedTier.gifts.length > 1 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4 text-center">Choose Your Gift Option:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedTier.gifts.map((gift, index) => (
                <Card 
                  key={index}
                  className={`cursor-pointer transition-all hover:scale-105 ${
                    selectedGift === gift ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleGiftSelect(gift)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-bold mb-2 capitalize">
                      {gift.type === 'vps' ? 'VPS Server' : 
                       gift.type === 'hosting' ? 'Web Hosting' : 'Both Options'}
                    </h4>
                    <div className="text-sm space-y-1">
                      {gift.type === 'vps' && (
                        <>
                          <div>CPU: {gift.details.cpu} vCPU</div>
                          <div>RAM: {gift.details.ram}GB</div>
                          <div>Storage: {gift.details.storage}GB SSD</div>
                          <div>OS: {gift.details.os.join(', ')}</div>
                        </>
                      )}
                      {gift.type === 'hosting' && (
                        <>
                          <div>Storage: {gift.details.storage}GB</div>
                          <div>Domain: {gift.details.domain}</div>
                          <div>Databases: {gift.details.databases}</div>
                          <div>Email: {gift.details.email}</div>
                        </>
                      )}
                      {gift.type === 'both' && (
                        <>
                          <div className="font-semibold">Hosting + VPS Combo</div>
                          <div>Everything from both options above</div>
                          {gift.details.extras && (
                            <div>Bonus: {gift.details.extras.join(', ')}</div>
                          )}
                        </>
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