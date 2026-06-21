import { readFileSync } from "node:fs";
import fs from "node:fs/promises";

export function isRetryableError(err: unknown, logSlice: string): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  if (!msg.includes("exited with")) return false;

  const content = logSlice.toLowerCase();
  const textPatterns = [
    "provider returned error",
    "provider returned an error",
    "overloaded",
    "rate limit",
    "too many requests",
    "connection error",
    "fetch failed",
    "socket hang up",
    "econnreset",
    "etimedout",
    "context deadline exceeded",
    "500 internal server error",
    "connection aborted",
    "fetch aborted",
    "request aborted",
    "operation aborted",
  ];
  if (textPatterns.some((p) => content.includes(p))) return true;

  const httpStatusRegex = /(?:http|status|error|response)[\s:]+429\b/;
  const httpServerErrorRegex = /(?:http|status|error|response)[\s:]+50[23]\b/;
  if (httpStatusRegex.test(content) || httpServerErrorRegex.test(content)) return true;

  const nonRetryableBuildPatterns = [
    "build failed",
    "compilation failed",
    "typescript error",
    "error ts",
    "expected a string starting with",
  ];
  const hasBuildError = nonRetryableBuildPatterns.some((p) => content.includes(p));
  if (hasBuildError) return false;

  return false;
}

export function readLogSlice(file: string, byteOffset: number): string {
  try {
    const buf = readFileSync(file);
    if (byteOffset >= buf.length) return "";
    return buf.subarray(byteOffset).toString("utf8");
  } catch {
    return "";
  }
}

export async function fileSize(file: string): Promise<number> {
  try {
    return (await fs.stat(file)).size;
  } catch {
    return 0;
  }
}
