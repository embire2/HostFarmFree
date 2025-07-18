import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Server, Globe, Library, Shield, Zap, CheckCircle, Star } from "lucide-react";
import DomainSearch from "@/components/domain-search";
import VpsPricing from "@/components/vps-pricing";
import PluginLibraryRegistration from "@/components/plugin-library-registration";
import PremiumHostingSearch from "@/components/premium-hosting-search";

export default function ThreeSectionServices() {
  const [activeSection, setActiveSection] = useState<"hosting" | "vps" | "plugins" | "premium">("hosting");
  
  // TEMPORARY: Disable VPS and Premium Hosting sections (easy to reactivate)
  const disabledSections = {
    vps: true,      // Set to false to reactivate VPS
    premium: true   // Set to false to reactivate Premium Hosting
  };

  const sections = [
    {
      id: "hosting" as const,
      title: "Create Free Hosting Account",
      icon: <Globe className="w-6 h-6" />,
      description: "Get your free WordPress hosting with a custom subdomain",
      color: "border-emerald-400",
      bgColor: "bg-gradient-to-br from-emerald-500/40 to-green-600/40",
      headerBg: "bg-gradient-to-r from-emerald-500/30 to-green-500/30",
      iconColor: "text-emerald-300",
      titleColor: "text-white",
      descColor: "text-emerald-50",
    },
    {
      id: "vps" as const,
      title: "Create Anonymous VPS",
      icon: <Server className="w-6 h-6" />,
      description: "100% anonymous VPS hosting with multiple pricing tiers",
      color: "border-cyan-400",
      bgColor: "bg-gradient-to-br from-cyan-500/40 to-blue-600/40",
      headerBg: "bg-gradient-to-r from-cyan-500/30 to-blue-500/30",
      iconColor: "text-cyan-300",
      titleColor: "text-white",
      descColor: "text-cyan-50",
      disabled: disabledSections.vps,
    },
    {
      id: "plugins" as const,
      title: "Access WordPress Plugin Library",
      icon: <Library className="w-6 h-6" />,
      description: "Register to access our premium WordPress plugin collection",
      color: "border-fuchsia-400",
      bgColor: "bg-gradient-to-br from-fuchsia-500/40 to-purple-600/40",
      headerBg: "bg-gradient-to-r from-fuchsia-500/30 to-purple-500/30",
      iconColor: "text-fuchsia-300",
      titleColor: "text-white",
      descColor: "text-fuchsia-50",
    },
    {
      id: "premium" as const,
      title: "Create Premium Hosting Package",
      icon: <Star className="w-6 h-6" />,
      description: "Create a hosting package using your own subdomain or register a new domain",
      color: "border-amber-400",
      bgColor: "bg-gradient-to-br from-amber-500/40 to-orange-600/40",
      headerBg: "bg-gradient-to-r from-amber-500/30 to-orange-500/30",
      iconColor: "text-amber-300",
      titleColor: "text-white",
      descColor: "text-amber-50",
      disabled: disabledSections.premium,
    },
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case "hosting":
        return <DomainSearch />;
      case "vps":
        return <VpsPricing />;
      case "plugins":
        return <PluginLibraryRegistration />;
      case "premium":
        return <PremiumHostingSearch />;
      default:
        return <DomainSearch />;
    }
  };

  return (
    <TooltipProvider>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Section Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sections.map((section) => {
            const isDisabled = (section as any).disabled;
            
            const cardContent = (
              <Card
                key={section.id}
                className={`transition-all duration-300 ${
                  isDisabled 
                    ? "cursor-not-allowed opacity-40 grayscale hover:grayscale-0 hover:opacity-60 border-gray-500/50 bg-gray-600/20" 
                    : `cursor-pointer hover:scale-105 ${
                        activeSection === section.id
                          ? `${section.color} ${section.bgColor} shadow-xl shadow-${section.color.split('-')[1]}-500/20`
                          : "border-white/20 bg-white/5 hover:bg-white/10"
                      }`
                }`}
                onClick={() => !isDisabled && setActiveSection(section.id)}
              >
                <CardHeader className={`text-center ${
                  isDisabled 
                    ? "bg-gray-600/20" 
                    : activeSection === section.id ? section.headerBg : "bg-white/5"
                } rounded-t-lg`}>
                  <CardTitle className={`text-lg font-bold flex items-center justify-center gap-2 ${
                    isDisabled 
                      ? "text-gray-400" 
                      : activeSection === section.id ? section.titleColor : "text-white"
                  }`}>
                    <span className={
                      isDisabled 
                        ? "text-gray-400" 
                        : activeSection === section.id ? section.iconColor : "text-white"
                    }>
                      {section.icon}
                    </span>
                    {section.title}
                  </CardTitle>
                  <p className={`text-sm font-medium ${
                    isDisabled 
                      ? "text-gray-500" 
                      : activeSection === section.id ? section.descColor : "text-gray-300"
                  }`}>
                    {section.description}
                  </p>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="flex justify-center">
                    <Badge
                      variant={activeSection === section.id ? "default" : "secondary"}
                      className={
                        isDisabled 
                          ? "bg-gray-600/40 text-gray-400 font-medium cursor-not-allowed"
                          : activeSection === section.id 
                            ? "bg-white text-black font-semibold shadow-lg" 
                            : "bg-white/20 text-white font-medium hover:bg-white/30"
                      }
                    >
                      {isDisabled ? "Coming Soon" : activeSection === section.id ? "Active" : "Click to view"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );

            return isDisabled ? (
              <Tooltip key={section.id}>
                <TooltipTrigger asChild>
                  {cardContent}
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coming Soon</p>
                </TooltipContent>
              </Tooltip>
            ) : cardContent;
          })}
        </div>

      <Separator className="bg-white/20" />

      {/* Active Section Content */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            {sections.find(s => s.id === activeSection)?.title}
          </h2>
          <p className="text-gray-300">
            {sections.find(s => s.id === activeSection)?.description}
          </p>
        </div>

        {renderSectionContent()}
      </div>

      {/* Service Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <Card className="bg-gradient-to-br from-emerald-600/80 to-green-700/80 border-emerald-400 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-emerald-100 mx-auto mb-4 drop-shadow-lg" />
            <h3 className="text-lg font-bold text-white mb-2 drop-shadow-md">Privacy First</h3>
            <p className="text-emerald-50 text-sm font-medium">
              All our services prioritize your privacy and security. Anonymous options available.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-600/80 to-blue-700/80 border-cyan-400 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6 text-center">
            <Zap className="w-12 h-12 text-cyan-100 mx-auto mb-4 drop-shadow-lg" />
            <h3 className="text-lg font-bold text-white mb-2 drop-shadow-md">Instant Setup</h3>
            <p className="text-cyan-50 text-sm font-medium">
              Get your hosting account or VPS ready within minutes. No waiting times.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-fuchsia-600/80 to-purple-700/80 border-fuchsia-400 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-fuchsia-100 mx-auto mb-4 drop-shadow-lg" />
            <h3 className="text-lg font-bold text-white mb-2 drop-shadow-md">No Contracts</h3>
            <p className="text-fuchsia-50 text-sm font-medium">
              Cancel anytime. No long-term commitments. Pay only for what you use.
            </p>
          </CardContent>
        </Card>
      </div>
      </div>
    </TooltipProvider>
  );
}