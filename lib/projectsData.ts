export interface Project {
  id: number;
  title: string;
  description: string;
  image: string;
  category: string;
  tags: string[];
  demoUrl: string;
  repoUrl: string;
  featured: boolean;
}

export const projects: Project[] = [
  {
    id: 1,
    title: "Analytics Dashboard",
    description: "A comprehensive analytics dashboard with real-time data visualization and user insights.",
    image: "/SaaS-blog-banner.jpg",
    category: "data",
    tags: ["React", "D3.js", "Node.js", "MongoDB"],
    demoUrl: "https://example.com/demo",
    repoUrl: "https://github.com/example/analytics-dashboard",
    featured: true,
  },
  {
    id: 2,
    title: "Mountain Travel",
    description: "A responsive travel website with booking capabilities and destination guides.",
    image: "/SaaS-blog-banner.jpg",
    category: "web",
    tags: ["Next.js", "Tailwind CSS", "Prisma", "PostgreSQL"],
    demoUrl: "https://example.com/demo",
    repoUrl: "https://github.com/example/mountain-travel",
    featured: true,
  },
  {
    id: 3,
    title: "Amplify Website Builder",
    description: "A drag-and-drop website builder with customizable templates and components.",
    image: "/SaaS-blog-banner.jpg",
    category: "web",
    tags: ["Vue.js", "Firebase", "Vuex", "SCSS"],
    demoUrl: "https://example.com/demo",
    repoUrl: "https://github.com/example/amplify-builder",
    featured: true,
  },
  {
    id: 4,
    title: "Real Estate App",
    description: "A mobile app for real estate listings with virtual tours and mortgage calculator.",
    image: "/SaaS-blog-banner.jpg",
    category: "mobile",
    tags: ["React Native", "Expo", "Redux", "Firebase"],
    demoUrl: "https://example.com/demo",
    repoUrl: "https://github.com/example/real-estate-app",
    featured: false,
  },
  {
    id: 5,
    title: "SaaS Pricing Platform",
    description: "A customizable pricing platform for SaaS businesses with subscription management.",
    image: "/SaaS-blog-banner.jpg",
    category: "web",
    tags: ["Angular", "TypeScript", "Stripe API", "Express"],
    demoUrl: "https://example.com/demo",
    repoUrl: "https://github.com/example/saas-pricing",
    featured: false,
  },
  {
    id: 6,
    title: "NFT Marketplace",
    description: "A decentralized marketplace for creating, buying, and selling NFTs with wallet integration.",
    image: "/SaaS-blog-banner.jpg",
    category: "blockchain",
    tags: ["Solidity", "Ethers.js", "React", "Hardhat"],
    demoUrl: "https://example.com/demo",
    repoUrl: "https://github.com/example/nft-marketplace",
    featured: true,
  },
];
