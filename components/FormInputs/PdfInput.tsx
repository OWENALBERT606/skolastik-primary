// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { UploadButton } from "@/lib/uploadthing";
// // import React, { useState } from "react";

// // type PdfInputProps = {
// //   title: string;
// //   pdfUrl: any; // accept string or array
// //   setPdfUrl: any;
// //   endpoint: any;
// // };

// // export default function PdfInput({
// //   title,
// //   pdfUrl,
// //   setPdfUrl,
// //   endpoint,
// // }: PdfInputProps) {
// //   const [fileName, setFileName] = useState<any>(pdfUrl ? pdfUrl.split("/").pop() || "" : "");

// //   return (
// //     <Card className="overflow-hidden">
// //       <CardHeader>
// //         <CardTitle>{title}</CardTitle>
// //       </CardHeader>
// //       <CardContent>
// //         <div className="grid gap-2">
// //           {pdfUrl && (
// //             <div className="p-4 border rounded-md bg-gray-50 dark:bg-slate-800">
// //               <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
// //                 {fileName}
// //               </p>
// //             </div>
// //           )}
// //           <UploadButton
// //             className="col-span-full"
// //             endpoint={endpoint}
// //             onClientUploadComplete={(res) => {
// //               if (res.length > 0) {
// //                 setPdfUrl(res[0].url);
// //                 setFileName(res[0].name);
// //                 console.log("PDF uploaded: ", res[0]);
// //               }
// //             }}
// //             onUploadError={(error: Error) => {
// //               alert(`Upload Error: ${error.message}`);
// //             }}
// //             // Optional: restrict file types
// //           />
// //         </div>
// //       </CardContent>
// //     </Card>
// //   );
// // }



// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { UploadButton } from "@/lib/uploadthing";
// import React, { useState, useEffect } from "react";

// type PdfInputProps = {
//   title: string;
//   pdfUrl: string | null; // always string or null
//   setPdfUrl: (url: string) => void;
//   endpoint: any;
// };

// export default function PdfInput({
//   title,
//   pdfUrl,
//   setPdfUrl,
//   endpoint,
// }: PdfInputProps) {
//   const [fileName, setFileName] = useState("");

//   // Compute fileName whenever pdfUrl changes
//   useEffect(() => {
//     if (pdfUrl && typeof pdfUrl === "string") {
//       setFileName(pdfUrl.split("/").pop() || "");
//     } else {
//       setFileName("");
//     }
//   }, [pdfUrl]);

//   return (
//     <Card className="overflow-hidden">
//       <CardHeader>
//         <CardTitle>{title}</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <div className="grid gap-2">
//           {fileName && (
//             <div className="p-4 border rounded-md bg-gray-50 dark:bg-slate-800">
//               <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
//                 {fileName}
//               </p>
//             </div>
//           )}
//           <UploadButton
//             className="col-span-full"
//             endpoint={endpoint}
//             onClientUploadComplete={(res) => {
//               if (res.length > 0) {
//                 setPdfUrl(res[0].url); // always a string
//               }
//             }}
//             onUploadError={(error: Error) => {
//               alert(`Upload Error: ${error.message}`);
//             }}
//           />
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadButton } from "@/lib/uploadthing";
import React, { useState, useEffect } from "react";

type PdfInputProps = {
  title: string;
  pdfUrl: string | null; // always string or null
  setPdfUrl: (url: string) => void;
  endpoint: any;
};

export default function PdfInput({
  title,
  pdfUrl,
  setPdfUrl,
  endpoint,
}: PdfInputProps) {
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    if (pdfUrl && typeof pdfUrl === "string") {
      setFileName(pdfUrl.split("/").pop() || "");
    } else {
      setFileName("");
    }
  }, [pdfUrl]);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {fileName && (
            <div className="p-4 border rounded-md bg-gray-50 dark:bg-slate-800">

              {/* Display PDF in iframe */}
              <iframe
                src={pdfUrl!}
                className="w-full h-60 mt-2 border rounded-md"
                title="PDF Preview"
              />
            </div>
          )}

          <UploadButton
            className="col-span-full"
            endpoint={endpoint}
            onClientUploadComplete={(res) => {
              if (res.length > 0) {
                setPdfUrl(res[0].url); // always a string
              }
            }}
            onUploadError={(error: Error) => {
              alert(`Upload Error: ${error.message}`);
            }}
            // optional: restrict file types with allowedFileTypes
          />
        </div>
      </CardContent>
    </Card>
  );
}
