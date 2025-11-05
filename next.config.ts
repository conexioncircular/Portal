// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "storage.googleapis.com",   // para tus imágenes de Chile Travel
      "content.r9cdn.net",        // para tus imágenes de turismo
      "encrypted-tbn0.gstatic.com", // para las de Google Thumbnails
      "emmajeanstravels.com",       // puente Pedro de Valdivia
      "www.cascada.travel",         // reserva Huellelhue
    ],
  },
};

module.exports = nextConfig;
