/** @type {import('next').NextConfig} */
import dotenv from "dotenv";

const env = {};
if (process.env.DEV) {
  env = dotenv.config().parsed;
}

const nextConfig = {
  env: env,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
