/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, webpack }) => {
    // snarkjs (via @avalabs/ac-eerc-sdk -> ffjavascript) pulls in Node-only
    // code paths (worker threads, node:fs/node:crypto) that are never
    // actually exercised in the browser but that webpack still tries to
    // resolve statically. Strip the "node:" scheme so the fallback below
    // applies, then stub the bare modules out for the client bundle.
    if (!isServer) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        }),
      );
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        crypto: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
};

export default nextConfig;
