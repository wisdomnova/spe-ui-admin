import type { NextConfig } from "next";
import fs from "fs";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

function findAppRootDir(...starts: string[]): string {
  const tried = starts.map((s) => path.resolve(s));
  const fsRoot = path.parse(tried[0] || process.cwd()).root;
  for (const start of tried) {
    let dir = start;
    while (dir !== fsRoot) {
      const marker = path.join(dir, "node_modules", "tailwindcss", "package.json");
      if (fs.existsSync(marker)) {
        return dir;
      }
      dir = path.dirname(dir);
    }
  }
  return path.resolve(process.cwd());
}

// Next may compile this file outside the repo; `import.meta.url` is not reliable alone.
// Prefer the nearest ancestor of this file *or* cwd that contains installed `tailwindcss`.
const projectRoot = findAppRootDir(
  path.dirname(fileURLToPath(import.meta.url)),
  process.cwd(),
);

const appRequire = createRequire(path.join(projectRoot, "package.json"));
const tailwindcssDir = path.dirname(appRequire.resolve("tailwindcss/package.json"));

const nextConfig: NextConfig = {
  // When a parent folder has package-lock.json, Next infers the wrong workspace root and
  // Turbopack fails to resolve `tailwindcss`. Pin tracing + Turbopack to this app directory.
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
    resolveAlias: {
      tailwindcss: tailwindcssDir,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sprykuhdavbnagzlahqk.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
