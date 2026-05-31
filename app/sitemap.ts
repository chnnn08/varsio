import { MetadataRoute } from "next";

const base = "https://varsio.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: base,                     lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${base}/match`,          lastModified: new Date(), changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/study`,          lastModified: new Date(), changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/chat`,           lastModified: new Date(), changeFrequency: "daily",   priority: 0.85 },
    { url: `${base}/quiz`,           lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/tools`,          lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/marketplace`,    lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
    { url: `${base}/explore`,        lastModified: new Date(), changeFrequency: "weekly",  priority: 0.75 },
  ];
}
