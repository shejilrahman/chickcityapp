import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: true, // Temporarily disabled to diagnose build error
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // any Next.js config
};

export default withPWA(nextConfig);
