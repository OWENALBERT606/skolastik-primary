import React from "react";
import {
  LayoutTemplate,
  CreditCard,
  KeyRound,
  Shield,
  Mail,
  Database,
  Palette,
  FileText,
  Book,
  Search,
  BarChart2,
  TableProperties,
  Upload,
  CheckCircle,
  Hourglass,
  Rocket,
  X,
} from "lucide-react";
import SectionHeader from "../frontend/section-header";

interface ComparisonProps {
  className?: string;
  theme?: "light" | "dark";
}
interface TimelineStep {
  title: string;
  highlight?: string;
  duration?: string;
  icon: React.ReactNode;
  painPoint?: string; // Description for left side
  benefit?: string; // Description for right side
}

const ProjectComparison: React.FC<ComparisonProps> = ({
  className = "",
  theme = "light",
}) => {
  const themeStyles = {
    light: {
      wrapper: "bg-white shadow-xl",
      card: {
        default: "bg-white border-gray-100",
        error: "from-rose-50 to-rose-50/50 border-rose-200/50",
        success: "from-emerald-50 to-emerald-50/50 border-emerald-200/50",
      },
      text: {
        primary: "text-gray-900",
        secondary: "text-gray-600",
        accent: "text-gray-700",
      },
      step: {
        pending: {
          border: "border-gray-300",
          bg: "bg-white",
          icon: "text-gray-400",
          connector: "bg-gray-200",
        },
        complete: {
          border: "border-emerald-500",
          bg: "bg-emerald-50",
          icon: "text-emerald-500",
          connector: "bg-emerald-200",
        },
      },
      highlight: {
        error: "text-rose-500",
        success: "text-emerald-500",
      },
    },
    dark: {
      wrapper: "bg-gray-900 shadow-2xl shadow-black/20",
      card: {
        default: "bg-gray-900 border-gray-800",
        error: "from-rose-950/50 to-rose-950/20 border-rose-900/50",
        success: "from-emerald-950/50 to-emerald-950/20 border-emerald-900/50",
      },
      text: {
        primary: "text-gray-100",
        secondary: "text-gray-400",
        accent: "text-gray-300",
      },
      step: {
        pending: {
          border: "border-gray-700",
          bg: "bg-gray-800",
          icon: "text-gray-500",
          connector: "bg-gray-700",
        },
        complete: {
          border: "border-emerald-500",
          bg: "bg-emerald-950/50",
          icon: "text-emerald-500",
          connector: "bg-emerald-800/50",
        },
      },
      highlight: {
        error: "text-rose-500",
        success: "text-emerald-400",
      },
    },
  };

  const style = themeStyles[theme];

  const steps: TimelineStep[] = [
    {
      title: "Creating",
      highlight: "Landing pages",
      duration: "20 hrs",
      icon: <LayoutTemplate className="w-4 h-4" />,
      painPoint:
        "Struggling with responsive design, animations, and optimizing for different devices",
      benefit:
        "Pre-built, responsive landing pages with modern animations and optimized performance",
    },
    {
      title: "Collect",
      highlight: "Payments",
      duration: "5 hrs",
      icon: <CreditCard className="w-4 h-4" />,
      painPoint:
        "Complex payment gateway integration, webhook handling, and error management",
      benefit:
        "Ready-to-use payment system with Stripe integration and automatic error handling",
    },
    {
      title: "Setting up",
      highlight: "Authentication",
      duration: "10 hrs",
      icon: <KeyRound className="w-4 h-4" />,
      painPoint:
        "Implementing secure auth flows, social logins, and session management",
      benefit:
        "Production-ready authentication with multiple providers and secure session handling",
    },
    {
      title: "Implementing",
      highlight: "Roles and Permissions",
      duration: "10 hrs",
      icon: <Shield className="w-4 h-4" />,
      painPoint:
        "Building complex role hierarchies and managing access control",
      benefit:
        "Built-in role-based access control system with flexible permission management",
    },
    {
      title: "Setting up",
      highlight: "Emails",
      duration: "6 hrs",
      icon: <Mail className="w-4 h-4" />,
      painPoint: "Wrestling with email templates, testing, and deliverability",
      benefit:
        "Ready-to-use email templates with testing and reliable delivery setup",
    },
    {
      title: "Configuring",
      highlight: "Database & State",
      duration: "10 hrs",
      icon: <Database className="w-4 h-4" />,
      painPoint:
        "Setting up database schema, state management, and data fetching",
      benefit: "Pre-configured database, Zustand store, and React Query setup",
    },
    {
      title: "Designing",
      highlight: "Modern UI",
      duration: "18 hrs",
      icon: <Palette className="w-4 h-4" />,
      painPoint:
        "Building consistent UI components and maintaining design system",
      benefit:
        "Beautiful, ready-to-use UI components following modern design principles",
    },
    {
      title: "Setting up",
      highlight: "Blog",
      duration: "8 hrs",
      icon: <FileText className="w-4 h-4" />,
      painPoint:
        "Creating blog layout, managing content, and implementing features",
      benefit:
        "Full-featured blog system with content management and rich features",
    },
    {
      title: "Creating",
      highlight: "Documentation",
      duration: "10 hrs",
      icon: <Book className="w-4 h-4" />,
      painPoint:
        "Building documentation structure and content management system",
      benefit:
        "Pre-built documentation system with search and content organization",
    },
    {
      title: "Optimizing",
      highlight: "SEO",
      duration: "4 hrs",
      icon: <Search className="w-4 h-4" />,
      painPoint: "Implementing meta tags, sitemaps, and SEO best practices",
      benefit:
        "SEO-optimized structure with automatic meta tags and sitemap generation",
    },
    {
      title: "Building",
      highlight: "Dashboard & Charts",
      duration: "12+ hrs",
      icon: <BarChart2 className="w-4 h-4" />,
      painPoint:
        "Creating responsive dashboards and implementing complex charts",
      benefit:
        "Ready-to-use dashboard templates with interactive charts and graphs",
    },
    {
      title: "Implementing",
      highlight: "Datatables",
      duration: "10 hrs",
      icon: <TableProperties className="w-4 h-4" />,
      painPoint: "Building sortable tables with filtering and pagination",
      benefit:
        "Feature-rich datatables with sorting, filtering, and responsive design",
    },
    {
      title: "Configuring",
      highlight: "Forms & Uploads",
      duration: "6 hrs",
      icon: <Upload className="w-4 h-4" />,
      painPoint:
        "Setting up form validation, file uploads, and progress tracking",
      benefit:
        "Pre-built form components with validation and optimized file uploads",
    },
  ];

  const TimelineStep: React.FC<{
    step: TimelineStep;
    isCompleted?: boolean;
    showDuration?: boolean;
    isLast?: boolean;
    showPainPoint?: boolean;
  }> = ({
    step,
    isCompleted = false,
    showDuration = true,
    isLast = false,
    showPainPoint = false,
  }) => {
    const stepStyle = isCompleted ? style.step.complete : style.step.pending;

    return (
      <div className="relative">
        <div className="flex items-start gap-4 group">
          {/* Step indicator and connector line remain the same */}
          <div className="relative flex flex-col items-center">
            {/* Previous step indicator code */}
            <div
              className={`
              w-8 h-8 rounded-full border-2 flex items-center justify-center
              transition-colors duration-300 ${stepStyle.border} ${stepStyle.bg}
            `}
            >
              {isCompleted ? (
                <CheckCircle className={`w-4 h-4 ${stepStyle.icon}`} />
              ) : (
                <Hourglass className={`w-4 h-4 ${stepStyle.icon}`} />
              )}
            </div>
            {!isLast && (
              <div
                className={`w-0.5 h-16 ${stepStyle.connector} transition-colors duration-300`}
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-h-[3rem]">
            <div className="flex items-start gap-3">
              <div
                className={`
                p-2 rounded-xl ${stepStyle.bg} ${stepStyle.border} border
                transition-colors duration-300
              `}
              >
                {step.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={style.text.secondary}>{step.title}</span>
                  <span
                    className={
                      isCompleted ? style.highlight.success : style.text.primary
                    }
                  >
                    {step.highlight}
                  </span>
                  {showDuration && (
                    <span className={`ml-auto ${style.highlight.error}`}>
                      {step.duration}
                    </span>
                  )}
                </div>
                <p className={`text-sm ${style.text.secondary}`}>
                  {showPainPoint ? step.painPoint : step.benefit}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`${style.wrapper} rounded-3xl border ${className}`}>
      {/* Section Header */}
      <div className="py-8">
        <SectionHeader
          title="Time Saving"
          heading="Development Time Comparison"
          description="See how our starter kit dramatically reduces development time by
          providing pre-built, tested components and features that would
          typically take hours or days to implement from scratch."
        />
      </div>

      {/* Comparison Cards */}
      <div className="grid md:grid-cols-2 gap-8 p-8">
        {/* Previous comparison cards code with updated TimelineStep usage */}
        <div
          className={`
          p-6 rounded-2xl border bg-gradient-to-b
          ${style.card.error}
        `}
        >
          <div className="flex items-center gap-2 mb-8">
            <div
              className={`
              p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20
            `}
            >
              <X className="w-5 h-5" />
            </div>
            <h2 className={`text-xl ${style.text.primary}`}>New project</h2>
          </div>

          <div className="space-y-2">
            {steps.map((step, index) => (
              <TimelineStep
                key={index}
                step={step}
                isLast={index === steps.length - 1}
                showDuration
                showPainPoint={true}
              />
            ))}
            <div className="flex gap-4 items-center pt-6 pl-12">
              <div className="text-2xl">😫 </div>
              <div className="flex gap-2 items-center">
                <span className={style.highlight.error}>Headache</span>
                <span className={style.text.secondary}>achieved</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`
          p-6 rounded-2xl border bg-gradient-to-b
          ${style.card.success}
        `}
        >
          <div className="flex items-center gap-2 mb-8">
            <div
              className={`
              p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20
            `}
            >
              <Rocket className="w-5 h-5" />
            </div>
            <h2 className={`text-xl ${style.text.primary}`}>
              New project with
              <span className={`ml-2 ${style.highlight.success}`}>
                Artiplate
              </span>
            </h2>
          </div>

          <div className="space-y-6">
            {steps.map((step, index) => (
              <TimelineStep
                key={index}
                step={step}
                isCompleted
                isLast={index === steps.length - 1}
                showDuration={false}
                showPainPoint={false}
              />
            ))}
            <div className="flex gap-4 items-center pt-6 pl-12">
              <div className="text-2xl">🚀</div>
              <div className="flex gap-2 items-center">
                <span className={style.highlight.success}>Fast launch</span>
                <span className={style.text.secondary}>achieved</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectComparison;
