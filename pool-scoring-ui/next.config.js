/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIgnores: [
      // builds on vercel used to ignore these dependencies before but not anymore, so builds are failing
      // TODO remove these once builds are fixed in vercel
      "**/node_modules/@swc/core-linux-x64-gnu",
      "**/node_modules/@swc/core-linux-x64-musl",
      "**/node_modules/@esbuild/linux-x64",
      "**/node_modules/terser/dist",
      "**/node_modules/uglify-js/lib",
    ],
  },
};

module.exports = nextConfig;
