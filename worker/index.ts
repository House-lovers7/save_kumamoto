/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

// --- Security headers (WO-3) ---------------------------------------------
//
// vinext 0.0.50 supports Next.js-style `headers()` in next.config.js, but
// per this task's scope (worker/index.ts only, no next.config.ts changes)
// headers are applied here by wrapping the outgoing Response instead.
//
// Cloudflare Workers responses returned from another handler/fetch carry
// immutable Headers; the documented pattern is to copy them into a new
// mutable Headers instance and construct a fresh Response around the same
// body (this also works for streaming bodies, since the ReadableStream
// reference is passed through untouched, not buffered).
// https://developers.cloudflare.com/workers/examples/security-headers/
//
// CSP is intentionally split in two:
//   - `Content-Security-Policy` (enforced): frame-ancestors only. Per the
//     CSP3 spec, `Content-Security-Policy-Report-Only` never blocks
//     anything for ANY directive (disposition "report" skips the
//     should-block-request algorithm entirely), so a frame-ancestors put
//     only in the report-only header would give zero real clickjacking
//     protection today. frame-ancestors carries no risk of breaking
//     Next/vinext's inline scripts, so it is safe to enforce immediately.
//     X-Frame-Options is included alongside it as a legacy fallback for
//     browsers that predate frame-ancestors support.
//   - `Content-Security-Policy-Report-Only` (monitoring only): the rest of
//     the policy (script-src/style-src/etc.), started in report-only mode
//     because Next/vinext's SSR output relies on inline bootstrap scripts
//     that a strict enforced policy could break. No report-uri/report-to
//     is set, so no violation data leaves the browser.
const ENFORCED_CSP = "frame-ancestors 'none'";
const REPORT_ONLY_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

function applySecurityHeaders(response: Response, pathname: string): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  // Sends the full URL on same-origin/HTTPS-to-HTTPS requests but only the
  // origin cross-origin, and nothing on a downgrade to HTTP — a widely
  // recommended default (MDN) that avoids leaking full URLs (which may
  // carry query params) to third-party destinations.
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Content-Security-Policy", ENFORCED_CSP);
  headers.set("Content-Security-Policy-Report-Only", REPORT_ONLY_CSP);

  // The status page is the only way to check the current kill-switch state
  // (see app/status/page.tsx); it must never be served stale from a cache.
  if (pathname === "/status") {
    headers.set("Cache-Control", "no-store");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      const response = await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
      return applySecurityHeaders(response, url.pathname);
    }

    const response = await handler.fetch(request, env, ctx);
    return applySecurityHeaders(response, url.pathname);
  },
};

export default worker;
