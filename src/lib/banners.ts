/**
 * Core Fruitful brand banners — uploaded to the CDN once and reused across the kiosk UI.
 */
import logo from "@/assets/banners/fruitful-logo.png.asset.json";
import global from "@/assets/banners/fruitful-global.png.asset.json";
import doggy from "@/assets/banners/doggy-station.png.asset.json";
import planet from "@/assets/banners/planet-change.png.asset.json";
import locals from "@/assets/banners/support-locals.jpg.asset.json";
import thanks from "@/assets/banners/thank-you.jpg.asset.json";
import proudly from "@/assets/brand/proudly-fruitful.jpg.asset.json";
import madiba from "@/assets/brand/madiba-tata.jpg.asset.json";
import mark from "@/assets/brand/fruitful-mark.png.asset.json";

export const BANNERS = {
  logo: logo.url,
  global: global.url,
  doggy: doggy.url,
  planet: planet.url,
  locals: locals.url,
  thanks: thanks.url,
  proudly: proudly.url,
  madiba: madiba.url,
  mark: mark.url,
} as const;

/** Rotating wide banners for the browse strip & attractor halo. */
export const ROTATING_BANNERS: { src: string; title: string; subtitle: string }[] = [
  { src: BANNERS.proudly, title: "Proudly Fruitful", subtitle: "If you don't like the fruits, change the seeds." },
  { src: BANNERS.global, title: "Fruitful Global", subtitle: "Changing seeds across the planet." },
  { src: BANNERS.locals, title: "We Support Lekker Locals", subtitle: "Handmade pots from rural South Africa." },
  { src: BANNERS.planet, title: "Planet · Change", subtitle: "Fruitful x the dance of change." },
  { src: BANNERS.doggy, title: "Doggy Drinking Station", subtitle: "Fresh water for your best friend." },
];

