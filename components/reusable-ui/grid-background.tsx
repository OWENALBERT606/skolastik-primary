// // import { cn } from "@/lib/utils";
// // import React, { ReactNode } from "react";

// // interface GridBackgroundProps {
// //   children: ReactNode;
// //   className?: string;
// // }

// // const GridBackground: React.FC<GridBackgroundProps> = ({
// //   children,
// //   className = "",
// // }) => {
// //   return (
// //     <div className={cn("relative min-h-screen w-full dark:bg-slate-950 bg-slate-50", className)}>
// //       {/* Grid Pattern SVG */}
// //       <div className="absolute inset-0 z-0" aria-hidden="true">
// //         <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
// //           <defs>
// //             <pattern
// //               id="grid-pattern"
// //               width="40"
// //               height="40"
// //               patternUnits="userSpaceOnUse"
// //             >
// //               {/* Vertical lines */}
// //               <path
// //                 d="M 40 0 L 40 40"
// //                 fill="none"
// //                 stroke="rgb(226 232 240)"
// //                 strokeWidth="0.4"
// //               />
// //               {/* Horizontal lines */}
// //               <path
// //                 d="M 0 40 L 40 40"
// //                 fill="none"
// //                 stroke="rgb(226 232 240)"
// //                 strokeWidth="0.4"
// //               />
// //             </pattern>
// //           </defs>
// //           <rect width="100%" height="100%" fill="url(#grid-pattern)" />
// //         </svg>
// //       </div>

// //       {/* Content Container */}
// //       <div className="relative z-10">{children}</div>
// //     </div>
// //   );
// // };

// // export { GridBackground };



// import { cn } from "@/lib/utils";
// import React, { ReactNode } from "react";

// interface GridBackgroundProps {
//   children: ReactNode;
//   className?: string;
// }

// const GridBackground: React.FC<GridBackgroundProps> = ({
//   children,
//   className = "",
// }) => {
//   return (
//     <div
//       className={cn(
//         "relative min-h-screen w-full bg-slate-50 dark:bg-slate-950",
//         className
//       )}
//     >
//       {/* Grid Pattern */}
//       <div className="absolute inset-0 z-0" aria-hidden="true">
//         <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
//           <defs>
//             {/* Light Mode Grid */}
//             <pattern
//               id="grid-light"
//               width="40"
//               height="40"
//               patternUnits="userSpaceOnUse"
//             >
//               <path
//                 d="M 40 0 L 40 40"
//                 fill="none"
//                 stroke="rgb(226 232 240)" // slate-200
//                 strokeWidth="0.4"
//               />
//               <path
//                 d="M 0 40 L 40 40"
//                 fill="none"
//                 stroke="rgb(226 232 240)"
//                 strokeWidth="0.4"
//               />
//             </pattern>

//             {/* Dark Mode Grid */}
//             <pattern
//               id="grid-dark"
//               width="40"
//               height="40"
//               patternUnits="userSpaceOnUse"
//             >
//               <path
//                 d="M 40 0 L 40 40"
//                 fill="none"
//                 stroke="rgb(51 65 85)" // slate-700
//                 strokeWidth="0.4"
//               />
//               <path
//                 d="M 0 40 L 40 40"
//                 fill="none"
//                 stroke="rgb(51 65 85)"
//                 strokeWidth="0.4"
//               />
//             </pattern>
//           </defs>

//           {/* Light grid (visible in light mode) */}
//           <rect
//             width="100%"
//             height="100%"
//             fill="url(#grid-light)"
//             className="block dark:hidden"
//           />

//           {/* Dark grid (visible in dark mode) */}
//           <rect
//             width="100%"
//             height="100%"
//             fill="url(#grid-dark)"
//             className="hidden dark:block"
//           />
//         </svg>
//       </div>

//       {/* Content */}
//       <div className="relative z-10">{children}</div>
//     </div>
//   );
// };

// export { GridBackground };



// components/reusable-ui/grid-background.tsx
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface GridBackgroundProps {
  children: ReactNode;
  className?: string;
  imageSrc?: string; // New prop for the background image
}

const GridBackground: React.FC<GridBackgroundProps> = ({
  children,
  className = "",
  imageSrc,
}) => {
  return (
    <div className={cn("relative min-h-screen w-full overflow-hidden", className)}>
      {/* 1. The Image Layer */}
      {imageSrc && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url(${imageSrc})` }}
        >
          {/* 2. The Dark/Light Overlay (Makes text readable) */}
          <div className="" />
        </div>
      )}

      {/* 3. The SVG Grid Layer */}
      <div className="absolute inset-0 z-10 opacity-30 pointer-events-none" aria-hidden="true">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 40 40" fill="none" stroke="white" strokeWidth="0.2" />
              <path d="M 0 40 L 40 40" fill="none" stroke="white" strokeWidth="0.2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      {/* 4. The Form Content */}
      <div className="relative z-20 flex items-center justify-center min-h-screen">
        {children}
      </div>
    </div>
  );
};

export { GridBackground };