import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Server, Globe, Library, Shield, Zap, CheckCircle } from "lucide-react";
import DomainSearch from "@/components/domain-search";
import VpsPricing from "@/components/vps-pricing";
import PluginLibraryRegistration from "@/components/plugin-library-registration";

export default function ThreeSectionServices() {
  const [activeSection, setActiveSection] = useState<"hosting" | "vps" | "plugins">("hosting");

  const sections = [
    {
      id: "hosting" as const,
      title: "Create Free Hosting Account",
      icon: <Globe className="w-6 h-6" />,
      description: "Get your free WordPress hosting with a custom subdomain",
      color: "border-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      id: "vps" as const,
      title: "Create Anonymous VPS",
      icon: <Server className="w-6 h-6" />,
      description: "100% anonymous VPS hosting with multiple pricing tiers",
      color: "border-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      id: "plugins" as const,
      title: "Access WordPress Plugin Library",
      icon: <Library className="w-6 h-6" />,
      description: "Register to access our premium WordPress plugin collection",
      color: "border-purple-500",
      bgColor: "bg-purple-500/10",
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
      default:
        return <DomainSearch />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Section Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((section) => (
          <Card
            key={section.id}
            className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
              activeSection === section.id
                ? `${section.color} ${section.bgColor} shadow-lg`
                : "border-white/20 bg-white/5 hover:bg-white/10"
            }`}
            onClick={() => setActiveSection(section.id)}
          >
            <CardHeader className="text-center">
              <CardTitle className="text-lg font-bold text-white flex items-center justify-center gap-2">
                {section.icon}
                {section.title}
              </CardTitle>
              <p className="text-gray-300 text-sm">
                {section.description}
              </p>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex justify-center">
                <Badge
                  variant={activeSection === section.id ? "default" : "secondary"}
                  className={activeSection === section.id ? "bg-white text-black" : ""}
                >
                  {activeSection === section.id ? "Active" : "Click to view"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
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
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Privacy First</h3>
            <p className="text-gray-300 text-sm">
              All our services prioritize your privacy and security. Anonymous options available.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6 text-center">
            <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Instant Setup</h3>
            <p className="text-gray-300 text-sm">
              Get your hosting account or VPS ready within minutes. No waiting times.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Contracts</h3>
            <p className="text-gray-300 text-sm">
              Cancel anytime. No long-term commitments. Pay only for what you use.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}