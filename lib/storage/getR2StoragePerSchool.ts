import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region:   "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
  credentials: {
    accessKeyId:     process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME!;

export async function getR2StoragePerSchool(schoolId: string): Promise<number> {
  let totalBytes       = 0;
  let continuationToken: string | undefined;

  try {
    do {
      const cmd = new ListObjectsV2Command({
        Bucket:            BUCKET,
        Prefix:            `${schoolId}/`,
        ContinuationToken: continuationToken,
        MaxKeys:           1000,
      });

      const res = await r2.send(cmd);

      for (const obj of res.Contents ?? []) {
        totalBytes += obj.Size ?? 0;
      }

      continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (continuationToken);
  } catch {
    // R2 unavailable or prefix doesn't exist — return 0
  }

  return totalBytes;
}
