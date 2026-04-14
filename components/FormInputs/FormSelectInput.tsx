// "use client";
// import AddNewButton from "@/components/FormInputs/AddNewButton";
// import React from "react";
// import Select from "react-tailwindcss-select";
// import { Option, Options } from "react-tailwindcss-select/dist/components/type";
// type FormSelectInputProps = {
//   options: Options;
//   label: string;
//   option: Option;
//   setOption: any;
//   href?: string;
//   labelShown?: boolean;
//   toolTipText?: string;
// };
// export default function FormSelectInput({
//   options,
//   label,
//   option,
//   setOption,
//   href,
//   toolTipText,
//   labelShown = true,
// }: FormSelectInputProps) {
//   return (
//     <div className="">
//       {labelShown && (
//         <h2 className="pb-2 block text-sm font-medium leading-6 text-gray-900">
//           Select {label}
//         </h2>
//       )}
//       <div className="flex items-center space-x-2">
//         <Select
//           isSearchable
//           primaryColor="blue"
//           value={option}
//           onChange={(item) => setOption(item)}
//           options={options}
//           placeholder={label}
//         />
//         {href && toolTipText && (
//           <AddNewButton toolTipText={toolTipText} href={href} />
//         )}
//       </div>
//     </div>
//   );
// }


// "use client";

// import AddNewButton from "@/components/FormInputs/AddNewButton";
// import React from "react";
// import Select from "react-tailwindcss-select";
// import { Option, Options } from "react-tailwindcss-select/dist/components/type";

// type FormSelectInputProps = {
//   options: Options;
//   label: string;
//   option: Option | null; // Allow option to be null
//   setOption: (option: Option | null) => void; // Adjusted setter to handle null values
//   href?: string;
//   labelShown?: boolean;
//   toolTipText?: string;
// };

// export default function FormSelectInput({
//   options,
//   label,
//   option,
//   setOption,
//   href,
//   toolTipText,
//   labelShown = true,
// }: FormSelectInputProps) {
//   return (
//     <div className="">
//       {labelShown && (
//         <h2 className="pb-2 block text-sm font-medium leading-6 text-gray-900">
//           Select {label}
//         </h2>
//       )}
//       <div className="flex items-center space-x-2">
//         <Select
//           isSearchable
//           primaryColor="blue"
//           value={option}
//           onChange={(item) => setOption(item || null)} // Ensure option can be null
//           options={options}
//           placeholder={label}
//         />
//         {href && toolTipText && (
//           <AddNewButton toolTipText={toolTipText} href={href} />
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import AddNewButton from "@/components/FormInputs/AddNewButton";
import React from "react";
import Select from "react-tailwindcss-select";
import { Option, Options } from "react-tailwindcss-select/dist/components/type";

type FormSelectInputProps = {
  options: Options;
  label: string;
  option: Option | null; // Allow option to be null
  setOption: (option: Option | null) => void; // Ensure the setter allows null
  href?: string;
  labelShown?: boolean;
  toolTipText?: string;
  isSearchable?:boolean
};

export default function FormSelectInput({
  options,
  label,
  option,
  setOption,
  isSearchable,
  href,
  toolTipText,
  labelShown = true,
}: FormSelectInputProps) {
  return (
    <div className="">
      {labelShown && (
        <h2 className="pb-2 block text-sm font-medium leading-6 text-gray-900">
          Select {label}
        </h2>
      )}
      <div className="flex items-center space-x-2">
        <Select
        isSearchable={isSearchable}
          primaryColor="blue"
          value={option}
          onChange={(item) => {
            // Type narrowing
            if (!item || Array.isArray(item)) {
              setOption(null); // Handle null or array case
            } else {
              setOption(item); // Handle single Option case
            }
          }}
          options={options}
          placeholder={label}
        />
        {href && toolTipText && (
          <AddNewButton toolTipText={toolTipText} href={href} />
        )}
      </div>
    </div>
  );
}
