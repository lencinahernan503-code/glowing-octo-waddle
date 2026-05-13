import { MetadataRoute } from "next";

const BASE = "https://frontend-production-df10b.up.railway.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/explorar`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/auth/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/auth/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/explorar?categoria=mujer`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE}/explorar?categoria=hombre`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE}/explorar?categoria=calzado`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE}/explorar?categoria=accesorios`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
    { url: `${BASE}/explorar?categoria=buzos`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
    { url: `${BASE}/explorar?categoria=bijouterie`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
  ];
}
