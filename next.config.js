/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          }
        ]
      }
    ];
  },
  images: {
    domains: ['maps.googleapis.com', 'maps.gstatic.com', 'res.cloudinary.com']
  }
};

module.exports = nextConfig; 