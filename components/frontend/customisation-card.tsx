import React from "react";
import { Info, Check } from "lucide-react";

interface CustomizationCardProps {
  theme?: "dark" | "light";
  className?: string;
}

const CustomizationCard: React.FC<CustomizationCardProps> = ({
  theme = "dark",
  className = "",
}) => {
  const themeStyles = {
    dark: {
      wrapper: "bg-gray-900/40 border-gray-800",
      text: {
        primary: "text-white",
        secondary: "text-gray-400",
        accent: "text-blue-400",
      },
      price: {
        original: "text-gray-500",
        current: "text-white",
      },
      discount: "bg-red-500/20 text-red-400",
      button: "bg-blue-600 hover:bg-blue-500 text-white",
      feature: {
        icon: "text-blue-400",
      },
    },
    light: {
      wrapper: "bg-white/40 border-gray-200",
      text: {
        primary: "text-gray-900",
        secondary: "text-gray-600",
        accent: "text-blue-600",
      },
      price: {
        original: "text-gray-400",
        current: "text-gray-900",
      },
      discount: "bg-red-100 text-red-600",
      button: "bg-blue-600 hover:bg-blue-500 text-white",
      feature: {
        icon: "text-blue-600",
      },
    },
  };

  const style = themeStyles[theme];

  const features = [
    "Everything from Team Plan",
    "Customized Landing Page",
    "Custom Feature Development",
    "Server Setup & Deployment",
  ];

  return (
    <div
      className={`
      relative rounded-2xl border p-6
      backdrop-blur-sm
      ${style.wrapper}
      ${className}
    `}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
        {/* Left side */}
        <div className="space-y-6">
          {/* Title with info icon */}
          <div className="flex items-center gap-2">
            <h2 className={`text-2xl font-medium ${style.text.primary}`}>
              Customization?
            </h2>
            <Info className={`w-5 h-5 ${style.text.accent}`} />
          </div>

          {/* Pricing */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className={`text-lg line-through ${style.price.original}`}>
                $1299
              </span>
              <div className="flex items-baseline gap-2">
                <span className={`text-lg ${style.text.secondary}`}>
                  Start At
                </span>
                <span className={`text-4xl font-bold ${style.price.current}`}>
                  $999
                </span>
              </div>
            </div>
            <div
              className={`
              inline-block px-3 py-1 rounded-full text-sm font-medium
              ${style.discount}
            `}
            >
              UP TO 20% OFF
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-col gap-6 items-end">
          {/* Features list */}
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className={`w-5 h-5 ${style.feature.icon}`} />
                <span className={style.text.secondary}>{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button
            className={`
            px-6 py-2 rounded-lg text-sm font-medium
            transition-colors duration-200
            whitespace-nowrap
            ${style.button}
          `}
          >
            Get In Touch
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizationCard;
