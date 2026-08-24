import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma", "bcryptjs", "mysql2", "mariadb"],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
