// TechStackGrid.tsx
import React from "react";
import { LucideIcon } from "lucide-react";
import {
  Newspaper,
  Globe,
  Home,
  BarChart2,
  Settings,
  Shield,
  Lock,
  CreditCard,
  Bot,
  Building2,
  Upload,
  Cloud,
  Database,
  FileUp,
  Mail,
} from "lucide-react";

// Types and Interfaces
type ThemeType = "light" | "dark";
type CategoryType = "frontend" | "backend" | "utilities";

interface TechStackGridProps {
  theme?: ThemeType;
}

interface CategoryItem {
  name: string;
  icon: React.ReactNode;
  description?: string;
}

interface Category {
  title: string;
  type: CategoryType;
  items: CategoryItem[];
}

interface ThemeColors {
  wrapper: string;
  section: Record<CategoryType, string>;
  card: string;
  cardGlow: string;
  iconWrapper: Record<CategoryType, string>;
  title: Record<CategoryType, string>;
  text: string;
  icon: Record<CategoryType, string>;
  grid: string;
}

// Theme Styles
const themeStyles: Record<ThemeType, ThemeColors> = {
  light: {
    wrapper: "bg-gray-50 border-gray-200",
    section: {
      frontend: "bg-orange-50/50",
      backend: "bg-blue-50/50",
      utilities: "bg-gray-100/50",
    },
    card: "bg-white hover:bg-gray-50 border border-gray-200/50",
    cardGlow: "hover:shadow-[0_0_15px_rgba(249,115,22,0.1)]",
    iconWrapper: {
      frontend: "bg-orange-100",
      backend: "bg-blue-100",
      utilities: "bg-gray-100",
    },
    title: {
      frontend: "text-orange-600",
      backend: "text-blue-600",
      utilities: "text-gray-600",
    },
    text: "text-gray-600",
    icon: {
      frontend: "text-orange-500",
      backend: "text-blue-500",
      utilities: "text-gray-500",
    },
    grid: "bg-[linear-gradient(to_right,#e5e7eb15_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb15_1px,transparent_1px)]",
  },
  dark: {
    wrapper: "bg-neutral-950 border-neutral-800",
    section: {
      frontend: "bg-neutral-900/50",
      backend: "bg-slate-900/50",
      utilities: "bg-neutral-900/50",
    },
    card: "bg-black hover:bg-neutral-900 border border-neutral-800/50",
    cardGlow: "hover:shadow-[0_0_15px_rgba(249,115,22,0.15)]",
    iconWrapper: {
      frontend: "bg-orange-950/50",
      backend: "bg-blue-950/50",
      utilities: "bg-neutral-900",
    },
    title: {
      frontend: "text-orange-300",
      backend: "text-blue-300",
      utilities: "text-gray-300",
    },
    text: "text-gray-300",
    icon: {
      frontend: "text-orange-400",
      backend: "text-blue-400",
      utilities: "text-gray-400",
    },
    grid: "bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]",
  },
};

// Category Data
const categories: Category[] = [
  {
    title: "Frontend",
    type: "frontend",
    items: [
      { name: "Blog", icon: <Newspaper className="w-6 h-6" /> },
      { name: "i18n", icon: <Globe className="w-6 h-6" /> },
      { name: "Landing page", icon: <Home className="w-6 h-6" /> },
      { name: "Analytics", icon: <BarChart2 className="w-6 h-6" /> },
      { name: "Dashboard & Settings", icon: <Settings className="w-6 h-6" /> },
      { name: "Admin UI", icon: <Shield className="w-6 h-6" /> },
    ],
  },
  {
    title: "Backend & API",
    type: "backend",
    items: [
      { name: "Auth", icon: <Lock className="w-6 h-6" /> },
      { name: "Payments", icon: <CreditCard className="w-6 h-6" /> },
      { name: "AI", icon: <Bot className="w-6 h-6" /> },
      { name: "Multi-tenancy", icon: <Building2 className="w-6 h-6" /> },
      { name: "File uploads", icon: <Upload className="w-6 h-6" /> },
      { name: "Serverless", icon: <Cloud className="w-6 h-6" /> },
    ],
  },
];

const bottomCategories: Category[] = [
  {
    title: "Database",
    type: "utilities",
    items: [
      {
        name: "PostgreSQL",
        icon: <Database className="w-5 h-5" />,
        description: "Primary Database",
      },
      {
        name: "MongoDB",
        icon: <Database className="w-5 h-5" />,
        description: "Document Store",
      },
    ],
  },
  {
    title: "Storage",
    type: "utilities",
    items: [
      {
        name: "Uploadthing",
        icon: <FileUp className="w-5 h-5" />,
        description: "File Storage",
      },
    ],
  },
  {
    title: "Mailing",
    type: "utilities",
    items: [
      {
        name: "Resend",
        icon: <Mail className="w-5 h-5" />,
        description: "Email Service",
      },
    ],
  },
];

// Component
const TechStackGrid: React.FC<TechStackGridProps> = ({ theme = "light" }) => {
  const style = themeStyles[theme];

  // Card Component
  const Card: React.FC<{
    item: CategoryItem;
    type: CategoryType;
    style: ThemeColors;
  }> = ({ item, type, style }) => (
    <div
      className={`
      relative flex flex-col items-center justify-center p-3 sm:p-4 
      ${style.card} ${style.cardGlow} rounded-xl 
      transition-all duration-300
      overflow-hidden
    `}
    >
      {/* Grid pattern background */}
      <div
        className={`absolute inset-0 ${style.grid}`}
        style={{
          backgroundSize: "20px 20px",
          maskImage:
            "radial-gradient(ellipse 80% 50% at 50% 50%, black, transparent)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 50% at 50% 50%, black, transparent)",
        }}
      />

      {/* Icon with background */}
      <div
        className={`
        relative rounded-lg p-2 mb-2
        ${style.iconWrapper[type]}
        transform transition-transform duration-300 group-hover:scale-110
      `}
      >
        <div className={style.icon[type]}>{item.icon}</div>
      </div>

      <span
        className={`relative mt-2 text-xs sm:text-sm ${style.text} text-center z-10`}
      >
        {item.name}
      </span>
    </div>
  );

  return (
    <div
      className={`w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 rounded-3xl border ${style.wrapper} transition-colors duration-300`}
    >
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {categories.map((category, idx) => (
          <div
            key={idx}
            className={`p-4 sm:p-6 rounded-2xl ${
              style.section[category.type]
            } backdrop-blur-sm`}
          >
            <h2
              className={`text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 ${
                style.title[category.type]
              }`}
            >
              {category.title}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {category.items.map((item, index) => (
                <Card
                  key={index}
                  item={item}
                  type={category.type}
                  style={style}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {bottomCategories.map((category, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl ${
              style.section[category.type]
            } backdrop-blur-sm`}
          >
            <h3
              className={`text-lg sm:text-xl font-medium mb-4 ${
                style.title[category.type]
              }`}
            >
              {category.title}
            </h3>
            <div className="flex items-center gap-3">
              {category.items.map((item, index) => (
                <Card
                  key={index}
                  item={item}
                  type={category.type}
                  style={style}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TechStackGrid;
