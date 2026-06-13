import { describe, test, expect } from "bun:test";
import { isRetryableError } from "./retry";

describe("isRetryableError", () => {
  test("returns false for non-Error values", () => {
    expect(isRetryableError("string error", "")).toBe(false);
    expect(isRetryableError(42, "provider returned error")).toBe(false);
    expect(isRetryableError(null, "provider returned error")).toBe(false);
  });

  test("returns false when error message lacks 'exited with'", () => {
    const err = new Error("some other error");
    expect(isRetryableError(err, "provider returned error")).toBe(false);
  });

  test("detects 'provider returned error' in log slice", () => {
    const err = new Error("opencode exited with 1");
    expect(isRetryableError(err, "Error: provider returned error")).toBe(true);
  });

  test("detects 'provider returned an error' in log slice", () => {
    const err = new Error("opencode exited with 1");
    expect(isRetryableError(err, "Error: provider returned an error")).toBe(true);
  });

  test("detects rate limit patterns", () => {
    const err = new Error("opencode exited with 1");
    expect(isRetryableError(err, "Error: rate limit exceeded")).toBe(true);
    expect(isRetryableError(err, "Error: too many requests")).toBe(true);
  });

  test("detects network errors", () => {
    const err = new Error("opencode exited with 1");
    expect(isRetryableError(err, "Error: fetch failed")).toBe(true);
    expect(isRetryableError(err, "Error: socket hang up")).toBe(true);
    expect(isRetryableError(err, "Error: ECONNRESET")).toBe(true);
    expect(isRetryableError(err, "Error: ETIMEDOUT")).toBe(true);
  });

  test("detects HTTP status codes with context", () => {
    const err = new Error("opencode exited with 1");
    expect(isRetryableError(err, "Error: HTTP 429")).toBe(true);
    expect(isRetryableError(err, "Error: status 502")).toBe(true);
    expect(isRetryableError(err, "Error: response status 503")).toBe(true);
  });

  test("rejects bare HTTP status codes without context", () => {
    const err = new Error("opencode exited with 1");
    expect(isRetryableError(err, "Error: port 4292")).toBe(false);
    expect(isRetryableError(err, "Error: line 5032")).toBe(false);
  });

  test("detects '500 internal server error'", () => {
    const err = new Error("opencode exited with 1");
    expect(isRetryableError(err, "Error: 500 internal server error")).toBe(true);
  });

  test("returns false for non-retryable errors", () => {
    const err = new Error("opencode exited with 1");
    expect(isRetryableError(err, "Error: build failed")).toBe(false);
    expect(isRetryableError(err, "Error: syntax error")).toBe(false);
  });

  test("per-attempt log slicing: stale content from attempt 1 does not affect attempt 2", () => {
    const err = new Error("opencode exited with 1");
    const attempt1Log = "Error: provider returned error";
    const attempt2Log = "Error: build failed";

    // Attempt 1 log contains retryable error
    expect(isRetryableError(err, attempt1Log)).toBe(true);

    // Attempt 2 log does NOT contain retryable error (only new content)
    expect(isRetryableError(err, attempt2Log)).toBe(false);
  });
});
