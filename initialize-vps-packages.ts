import { storage } from "./server/storage";

// Initialize VPS packages with the required pricing tiers
async function initializeVpsPackages() {
  try {
    console.log("Initializing VPS packages...");

    const packages = [
      {
        name: "basic",
        displayName: "Basic VPS",
        description: "Perfect for light workloads and development",
        price: 350, // $3.50 in cents
        currency: "USD",
        vcpu: "0.5",
        memory: 512, // 0.5GB in MB
        storage: 20, // 20GB
        additionalStorage: 0,
        ipv4Addresses: 1,
        trafficPort: "100Mbps",
        osChoices: JSON.stringify([
          { value: "ubuntu-22.04", label: "Ubuntu 22.04 LTS" },
          { value: "debian-12", label: "Debian 12" }
        ]),
        isAnonymous: true,
        stripePriceId: "price_basic_vps", // Replace with actual Stripe price ID
        isActive: true,
        sortOrder: 1
      },
      {
        name: "standard",
        displayName: "Standard VPS",
        description: "Great for small applications and websites",
        price: 500, // $5.00 in cents
        currency: "USD",
        vcpu: "1.0",
        memory: 1024, // 1GB in MB
        storage: 40, // 40GB
        additionalStorage: 0,
        ipv4Addresses: 1,
        trafficPort: "100Mbps",
        osChoices: JSON.stringify([
          { value: "ubuntu-22.04", label: "Ubuntu 22.04 LTS" },
          { value: "debian-12", label: "Debian 12" },
          { value: "centos-7", label: "CentOS 7" }
        ]),
        isAnonymous: true,
        stripePriceId: "price_standard_vps", // Replace with actual Stripe price ID
        isActive: true,
        sortOrder: 2
      },
      {
        name: "professional",
        displayName: "Professional VPS",
        description: "High-performance for production workloads",
        price: 1000, // $10.00 in cents
        currency: "USD",
        vcpu: "2.0",
        memory: 2048, // 2GB in MB
        storage: 150, // 150GB
        additionalStorage: 0,
        ipv4Addresses: 1,
        trafficPort: "1Gbps",
        osChoices: JSON.stringify([
          { value: "ubuntu-22.04", label: "Ubuntu 22.04 LTS" },
          { value: "debian-12", label: "Debian 12" },
          { value: "centos-7", label: "CentOS 7" },
          { value: "windows-2019", label: "Windows Server 2019" }
        ]),
        isAnonymous: true,
        stripePriceId: "price_professional_vps", // Replace with actual Stripe price ID
        isActive: true,
        sortOrder: 3
      },
      {
        name: "enterprise",
        displayName: "Enterprise VPS",
        description: "Maximum performance for demanding applications",
        price: 1500, // $15.00 in cents
        currency: "USD",
        vcpu: "4.0",
        memory: 4096, // 4GB in MB
        storage: 200, // 200GB
        additionalStorage: 1024, // 1TB additional
        ipv4Addresses: 1,
        trafficPort: "1Gbps",
        osChoices: JSON.stringify([
          { value: "ubuntu-22.04", label: "Ubuntu 22.04 LTS" },
          { value: "debian-12", label: "Debian 12" },
          { value: "centos-7", label: "CentOS 7" },
          { value: "windows-2019", label: "Windows Server 2019" },
          { value: "windows-2022", label: "Windows Server 2022" }
        ]),
        isAnonymous: true,
        stripePriceId: "price_enterprise_vps", // Replace with actual Stripe price ID
        isActive: true,
        sortOrder: 4
      }
    ];

    for (const packageData of packages) {
      try {
        const created = await storage.createVpsPackage(packageData);
        console.log(`✓ Created VPS package: ${created.displayName} - $${created.price / 100}/month`);
      } catch (error) {
        console.error(`✗ Failed to create package ${packageData.displayName}:`, error);
      }
    }

    console.log("VPS packages initialization complete!");
  } catch (error) {
    console.error("Error initializing VPS packages:", error);
    throw error;
  }
}

// Run the initialization
initializeVpsPackages()
  .then(() => {
    console.log("VPS packages initialized successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to initialize VPS packages:", error);
    process.exit(1);
  });