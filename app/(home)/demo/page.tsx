// app/r2-demo/page.tsx
"use client";
import { Dropzone, FileWithMetadata } from "@/components/ui/dropzone";
import Image from "next/image";
import { useState } from "react";

export default function HomePage() {
  const [files, setFiles] = useState<FileWithMetadata[]>();
  console.log(files);
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Cloudflare R2 File Upload</h1>
      <Dropzone
        provider="cloudflare-r2"
        variant="avatar"
        maxFiles={10}
        maxSize={1024 * 1024 * 50} // 50MB
        onFilesChange={(files) => setFiles(files)}
      />
      <Image
      width={200}
      height={300}
      src="https://pub-somalite-school-system-media-objects.r2.dev/8adcd972-982a-4eb7-b10d-d95c64e94142-WhatsApp%20Image%202025-12-28%20at%2018.15.13%20(1).jpeg"
      alt="freedom"
      />
    </div>
  );
}

