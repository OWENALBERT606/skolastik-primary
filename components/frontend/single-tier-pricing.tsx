import React from "react";
import {
  Rocket,
  Check,
  Box,
  Palette,
  Shield,
  CodeXml,
  Database,
  Mail,
  Layout,
  FileText,
} from "lucide-react";

interface PricingCardProps {
  theme?: "light" | "dark";
  className?: string;
}

const PricingCard: React.FC<PricingCardProps> = ({
  theme = "light",
  className = "",
}) => {
  const themeStyles = {
    light: {
      wrapper: `
        bg-white 
        border border-gray-200/60 
        shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] 
        hover:shadow-[0_16px_60px_-12px_rgba(0,0,0,0.15)]
      `,
      title: "text-gray-900",
      description: "text-gray-600",
      subtitle: "text-indigo-600",
      price: {
        original: "text-gray-400",
        current: "text-gray-900",
        unit: "text-gray-600",
        save: "text-gray-600",
      },
      promo: {
        wrapper: "bg-indigo-100/50",
        text: "text-indigo-600",
      },
      button: "bg-indigo-600 hover:bg-indigo-700 text-white",
      feature: {
        text: "text-gray-600",
        icon: "text-indigo-500",
        iconBg: "bg-indigo-100/50",
      },
      hint: "text-gray-500",
    },
    dark: {
      wrapper: `
        bg-gray-900 
        border border-gray-800/60 
        shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] 
        hover:shadow-[0_16px_60px_-12px_rgba(0,0,0,0.7)]
      `,
      title: "text-white",
      description: "text-gray-400",
      subtitle: "text-indigo-400",
      price: {
        original: "text-gray-600",
        current: "text-white",
        unit: "text-gray-400",
        save: "text-gray-400",
      },
      promo: {
        wrapper: "bg-indigo-900/50",
        text: "text-indigo-400",
      },
      button: "bg-indigo-500 hover:bg-indigo-600 text-white",
      feature: {
        text: "text-gray-400",
        icon: "text-indigo-400",
        iconBg: "bg-indigo-900/50",
      },
      hint: "text-gray-500",
    },
  };

  const features = [
    {
      icon: Box,
      text: "Complete Project Setup & Structure",
    },
    {
      icon: Palette,
      text: "Modern UI Components & Design System",
    },
    {
      icon: Shield,
      text: "Authentication & Authorization",
    },
    {
      icon: Database,
      text: "Database & API Integration",
    },
    {
      icon: CodeXml,
      text: "Clean & Maintainable Codebase",
    },
    {
      icon: Mail,
      text: "Email Templates & Notifications",
    },
    {
      icon: Layout,
      text: "Responsive Dashboard & Admin Panel",
    },
    {
      icon: FileText,
      text: "Documentation & Best Practices",
    },
  ];

  const style = themeStyles[theme];

  return (
    <div
      className={`
      ${style.wrapper}
      rounded-3xl overflow-hidden
      transform transition-all duration-300
      ${className}
    `}
    >
      <div className="p-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          {/* Left Column - Info & Features */}
          <div>
            {/* Header */}
            <div className="mb-8">
              <h2 className={`text-2xl font-bold mb-4 ${style.title}`}>
                Starter Kit License
              </h2>
              <p className={`text-lg ${style.description}`}>
                Get complete access to our comprehensive starter kit with all
                features included. Perfect for projects of any size with
                flexible scaling options.
              </p>
            </div>

            {/* Features Section */}
            <h3 className={`text-lg font-semibold mb-4 ${style.subtitle}`}>
              Everything you need included
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className={`
                    p-1.5 rounded-lg
                    ${style.feature.iconBg}
                  `}
                  >
                    <Check className={`w-4 h-4 ${style.feature.icon}`} />
                  </div>
                  <span className={`${style.feature.text}`}>
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Pricing */}
          <div className="mt-8 lg:mt-0 lg:flex lg:flex-col lg:justify-center">
            <div className="space-y-6">
              {/* Price Display */}
              <div>
                <div className={`mb-2 ${style.price.save}`}>
                  Lifetime access • One-time payment
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xl line-through ${style.price.original}`}
                  >
                    $300
                  </span>
                  <div className="flex items-baseline">
                    <span
                      className={`text-5xl font-bold ${style.price.current}`}
                    >
                      $150
                    </span>
                    <span className={`text-xl ml-2 ${style.price.unit}`}>
                      USD
                    </span>
                  </div>
                </div>

                {/* Promo Code */}
                <div
                  className={`
                  mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                  ${style.promo.wrapper}
                `}
                >
                  <span className="text-lg">🎁</span>
                  <span className={style.promo.text}>
                    Get $150 off with code HALFOFF
                  </span>
                </div>
              </div>

              <button
                className={`
                w-full py-3 px-4 rounded-lg text-sm font-medium
                transition-colors duration-200
                ${style.button}
              `}
              >
                Get Started Now
              </button>

              <div className={`text-sm ${style.hint}`}>
                14-day money-back guarantee • Free updates
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingCard;
