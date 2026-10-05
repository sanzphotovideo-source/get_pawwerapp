export default function handler(_request, response) {
  response.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  response.status(200).json({ pixelId: process.env.META_PIXEL_ID || "" });
}
