import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Server, 
  Puzzle, 
  Shield, 
  Gauge, 
  Code, 
  LifeBuoy,
  Star,
  Heart,
  Rocket,
  Play,
  CheckCircle,
  Database,
  Lock,
  Zap,
  Download
} from "lucide-react";
import Navbar from "@/components/navbar";
import ThreeSectionServices from "@/components/three-section-services";
import StatsGrid from "@/components/stats-grid";
import DonationModal from "@/components/donation-modal";
import SEOHead, { generateSchemaData } from "@/components/seo-head";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function Landing() {
  const [showDonationModal, setShowDonationModal] = useState(false);
  
  const { data: featuredPlugins } = useQuery({
    queryKey: ["/api/plugins", { limit: 6 }],
  });

  const { data: publicPlugins } = useQuery({
    queryKey: ["/api/plugins/public"],
  });

  // Generate comprehensive schema data for SEO
  const organizationSchema = generateSchemaData.organization();
  const hostingServiceSchema = generateSchemaData.webHostingService();
  const breadcrumbSchema = generateSchemaData.breadcrumb([
    { name: "Home", url: "https://hostfarm.org" },
    { name: "Free WordPress Hosting", url: "https://hostfarm.org" }
  ]);

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [organizationSchema, hostingServiceSchema, breadcrumbSchema]
  };

  const features = [
    {
      title: "Free WordPress Hosting with SSL",
      description: "Professional WordPress hosting with 99.9% uptime, free SSL certificates, daily backups, and one-click WordPress installation. No hidden fees, ads, or storage limits.",
      icon: Server,
      color: "from-blue-50 to-indigo-100",
      borderColor: "border-blue-200",
      iconBg: "bg-primary",
      items: ["99.9% Uptime SLA", "Free SSL Certificates", "Daily Automated Backups", "SSD Storage", "24/7 Monitoring"]
    },
    {
      title: "Premium WordPress Plugin Library",
      description: "Download thousands of premium WordPress plugins worth $15,000+ completely free. Access top plugins for SEO, e-commerce, page builders, and security.",
      icon: Puzzle,
      color: "from-green-50 to-emerald-100",
      borderColor: "border-green-200",
      iconBg: "bg-accent",
      items: ["2,000+ Premium Plugins", "Regular Updates", "One-Click Installation"]
    },
    {
      title: "100% Anonymous Registration",
      description: "World's only completely anonymous hosting provider. Zero personal information required.",
      icon: Shield,
      color: "from-purple-50 to-pink-100",
      borderColor: "border-purple-200",
      iconBg: "bg-purple-600",
      items: ["No Email Required", "No Phone Number", "Complete Privacy"]
    },
    {
      title: "Powerful Dashboard",
      description: "Manage your hosting, plugins, and websites from one intuitive dashboard.",
      icon: Gauge,
      color: "from-orange-50 to-red-100",
      borderColor: "border-orange-200",
      iconBg: "bg-orange-600",
      items: ["Real-time Analytics", "Resource Monitoring", "Easy Management"]
    },
    {
      title: "WHM/cPanel Integration",
      description: "Powered by industry-standard WHM and cPanel for reliable hosting management.",
      icon: Code,
      color: "from-cyan-50 to-blue-100",
      borderColor: "border-cyan-200",
      iconBg: "bg-cyan-600",
      items: ["Professional Tools", "Full Control", "Scalable Infrastructure"]
    },
    {
      title: "Community Support",
      description: "Join our growing community of developers and get help when you need it.",
      icon: LifeBuoy,
      color: "from-teal-50 to-green-100",
      borderColor: "border-teal-200",
      iconBg: "bg-teal-600",
      items: ["Community Forums", "Documentation", "Video Tutorials"]
    }
  ];

  const samplePlugins = [
    {
      id: 1,
      name: "WooCommerce Pro",
      description: "Advanced e-commerce functionality with premium features for your online store.",
      category: "E-commerce",
      downloads: 45230,
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
    },
    {
      id: 2,
      name: "Rank Math Pro",
      description: "Complete SEO solution with advanced features and analytics.",
      category: "SEO",
      downloads: 32145,
      image: "https://images.unsplash.com/photo-1562577309-4932fdd64cd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
    },
    {
      id: 3,
      name: "Elementor Pro",
      description: "Advanced page builder with premium widgets and templates.",
      category: "Page Builder",
      downloads: 67890,
      image: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
    }
  ];

  const testimonials = [
    {
      name: "Alex Johnson",
      title: "Web Developer",
      content: "HostFarm.org has been a game-changer for my agency. Free hosting plus access to premium plugins worth thousands of dollars. Incredible!",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"
    },
    {
      name: "Sarah Chen",
      title: "Freelance Designer", 
      content: "Started my freelance career with HostFarm.org. The anonymous registration and free plugins helped me launch client projects without upfront costs.",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"
    },
    {
      name: "Mike Rodriguez",
      title: "Startup Founder",
      content: "Our startup saved thousands on hosting and plugins. The one-click WordPress installer and WHM integration made everything seamless.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Free WordPress Hosting with SSL & Premium Plugins - HostFarm.org"
        description="Get professional WordPress hosting with free SSL certificates, daily backups, 99.9% uptime, and access to $15,000+ worth of premium WordPress plugins. No ads, no limits, completely anonymous registration."
        keywords="free WordPress hosting, WordPress hosting with SSL, premium WordPress plugins, anonymous hosting, free hosting, WordPress plugins download, web hosting, subdomain hosting, free SSL certificate, WordPress installation"
        canonical="https://hostfarm.org"
        ogImage="https://hostfarm.org/og-hosting-image.jpg"
        schemaData={combinedSchema}
      />
      <Navbar />

      {/* Anonymous Hosting Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 py-4 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white font-bold text-lg md:text-xl">
            🌟 <span className="font-black">WORLD'S ONLY COMPLETELY ANONYMOUS HOSTING & VPS PROVIDER</span> 🌟
          </p>
          <p className="text-white/90 text-sm md:text-base mt-1">
            <strong>No personal information required</strong> - Start hosting with complete privacy
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative gradient-primary text-white py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        ></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Free WordPress Hosting with SSL{" "}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-green-300">
              + Premium Plugin Library
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-4 max-w-3xl mx-auto opacity-90">
            <strong>Professional WordPress hosting with 99.9% uptime guarantee.</strong> Free SSL certificates, daily backups, 
            SSD storage, and access to $15,000+ worth of premium WordPress plugins. Anonymous registration available.
          </p>
          
          {/* Privacy Benefits */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-8 max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-center items-center gap-6 text-white">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-green-400" />
                <span className="font-bold">No Email Required</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-green-400" />
                <span className="font-bold">No Phone Number</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-green-400" />
                <span className="font-bold">No Credit Card</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-green-400" />
                <span className="font-bold">Complete Privacy</span>
              </div>
            </div>
          </div>

          <ThreeSectionServices />

          <div className="mt-12">
            <StatsGrid />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-dark mb-4">World's Only Anonymous Hosting Platform</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              <strong>Complete privacy protection</strong> - no personal information required. From anonymous hosting to premium plugins, 
              we provide all the tools necessary to build amazing WordPress websites while protecting your identity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className={`bg-gradient-to-br ${feature.color} p-8 rounded-2xl border ${feature.borderColor}`}>
                  <CardContent className="p-0">
                    <div className={`w-12 h-12 ${feature.iconBg} rounded-xl flex items-center justify-center mb-6`}>
                      <IconComponent className="text-white text-xl" />
                    </div>
                    <h3 className="text-xl font-semibold text-dark mb-4">{feature.title}</h3>
                    <p className="text-gray-600 mb-4">{feature.description}</p>
                    <ul className="text-sm text-gray-600 space-y-2">
                      {feature.items.map((item, i) => (
                        <li key={i} className="flex items-center">
                          <CheckCircle className="text-accent mr-2 w-4 h-4" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Plugin Library Preview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-dark mb-4">Premium Plugin Library</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover thousands of premium WordPress plugins, all available for free download.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {publicPlugins && Array.isArray(publicPlugins) && publicPlugins.length > 0 ? (
              publicPlugins.slice(0, 3).map((plugin: any) => (
                <Card key={plugin.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
                  {plugin.imageUrl ? (
                    <img 
                      src={plugin.imageUrl} 
                      alt={plugin.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Puzzle className="w-16 h-16 text-white opacity-50" />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-primary text-white text-xs px-3 py-1 rounded-full font-medium">
                        {plugin.category.toUpperCase()}
                      </Badge>
                      <span className="text-green-600 font-semibold">FREE</span>
                    </div>
                    <h3 className="text-xl font-semibold text-dark mb-2">{plugin.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{plugin.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <Server className="w-4 h-4 mr-1" />
                        <span>{plugin.downloadCount?.toLocaleString() || 0}</span>
                      </div>
                      <Button 
                        onClick={() => window.location.href = `/plugin/${plugin.slug}`}
                        className="bg-accent text-white hover:bg-green-600 transition-colors text-sm font-medium"
                      >
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <Puzzle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Public Plugins Available</h3>
                <p className="text-gray-500">Check back soon for amazing plugins!</p>
              </div>
            )}
          </div>

          <div className="text-center">
            <Button 
              onClick={() => window.location.href = "/plugins"}
              className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-secondary transition-colors font-medium"
            >
              Browse All Plugins
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 gradient-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">100% Free Forever</h2>
          <p className="text-xl mb-12 max-w-2xl mx-auto opacity-90">
            We're a non-profit organization dedicated to providing free hosting and premium plugins to everyone.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="glass border-white/20 p-8">
              <CardContent className="p-0 text-center">
                <h3 className="text-2xl font-bold mb-2 text-white">Free Hosting</h3>
                <div className="text-4xl font-bold mb-2 text-white">$0</div>
                <div className="text-sm opacity-80 mb-6 text-white">Forever</div>
                <ul className="space-y-3 text-left text-white">
                  <li className="flex items-center">
                    <CheckCircle className="text-accent mr-3 w-5 h-5" />
                    Unlimited WordPress sites
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="text-accent mr-3 w-5 h-5" />
                    5GB storage per site
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="text-accent mr-3 w-5 h-5" />
                    SSL certificates included
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="glass border-white/40 p-8 transform scale-105">
              <CardContent className="p-0 text-center">
                <h3 className="text-2xl font-bold mb-2 text-white">Premium Plugins</h3>
                <div className="text-4xl font-bold mb-2 text-white">$0</div>
                <div className="text-sm opacity-80 mb-6 text-white">No Limits</div>
                <ul className="space-y-3 text-left text-white">
                  <li className="flex items-center">
                    <CheckCircle className="text-accent mr-3 w-5 h-5" />
                    2,000+ premium plugins
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="text-accent mr-3 w-5 h-5" />
                    Regular updates
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="text-accent mr-3 w-5 h-5" />
                    Commercial use allowed
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="glass border-white/20 p-8">
              <CardContent className="p-0 text-center">
                <h3 className="text-2xl font-bold mb-2 text-white">Community Support</h3>
                <div className="text-4xl font-bold mb-2 text-white">$0</div>
                <div className="text-sm opacity-80 mb-6 text-white">Always Free</div>
                <ul className="space-y-3 text-left text-white">
                  <li className="flex items-center">
                    <CheckCircle className="text-accent mr-3 w-5 h-5" />
                    Community forums
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="text-accent mr-3 w-5 h-5" />
                    Video tutorials
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="text-accent mr-3 w-5 h-5" />
                    Documentation
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="glass border-white/20 max-w-4xl mx-auto" id="donate">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4 text-white">Help Us Keep This Free</h3>
              <p className="text-lg mb-6 opacity-90 text-white">
                Your donations help us maintain servers, acquire new plugins, and keep everything running smoothly for the community.
              </p>
              <div className="flex justify-center items-center">
                <Button 
                  onClick={() => setShowDonationModal(true)}
                  className="bg-accent hover:bg-green-600 text-white px-12 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
                >
                  <Heart className="mr-3 w-6 h-6" />
                  Donate Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-dark mb-4">Loved by Developers & Agencies</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of satisfied users who've built amazing websites with our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-6">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover mr-4"
                    />
                    <div>
                      <div className="font-semibold text-dark">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.title}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Build Something Amazing?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of developers, agencies, and entrepreneurs who trust HostFarm.org for their hosting needs.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
            <Button 
              onClick={() => window.location.href = "/auth"}
              className="bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg"
            >
              <Rocket className="mr-2 w-5 h-5" />
              Get Started Free
            </Button>
            <Button variant="outline" className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors text-lg">
              <Play className="mr-2 w-5 h-5" />
              Watch Demo
            </Button>
          </div>

          <div className="text-sm opacity-80">
            <p>✓ No credit card required  ✓ Setup in under 2 minutes  ✓ 100% free forever</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Server className="text-primary text-2xl" />
                <span className="text-2xl font-bold">HostFarm.org</span>
              </div>
              <p className="text-gray-300 mb-6 max-w-md">
                A non-profit organization dedicated to providing free WordPress hosting and premium plugins to developers, agencies, and entrepreneurs worldwide.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="/plugins" className="hover:text-white transition-colors">Plugin Library</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Community Forums</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Video Tutorials</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-300 mb-4 md:mb-0">
              <p>&copy; 2024 HostFarm.org. All rights reserved. | Non-profit organization.</p>
            </div>
            <div className="flex space-x-6 text-sm text-gray-300">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#donate" className="hover:text-white transition-colors">Donate</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Donation Modal */}
      <DonationModal 
        isOpen={showDonationModal} 
        onClose={() => setShowDonationModal(false)} 
      />
    </div>
  );
}
