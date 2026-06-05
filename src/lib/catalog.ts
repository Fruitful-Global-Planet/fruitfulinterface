/**
 * Fruitful Portal Kiosk — seed catalog.
 * Real categories and artisan attribution from the Fruitful brand assets.
 * Phase 1: in-memory. Phase 2 ports this to Lovable Cloud.
 */

import hatAsset from "@/assets/fruitful-hat.jpeg.asset.json";

export type CategoryId =
  | "hats"
  | "kidswear"
  | "prints"
  | "pottery"
  | "nourish"
  | "apparel";

export type Category = {
  id: CategoryId;
  label: string;
  emoji: string;
};

export const CATEGORIES: Category[] = [
  { id: "hats", label: "Artisan Hats", emoji: "🎩" },
  { id: "kidswear", label: "Kidswear", emoji: "👗" },
  { id: "prints", label: "SamFox Prints", emoji: "🖼️" },
  { id: "pottery", label: "Pottery", emoji: "🏺" },
  { id: "nourish", label: "Nourishment", emoji: "☕" },
  { id: "apparel", label: "Apparel", emoji: "👕" },
];

export type Product = {
  id: string;
  sku: string;
  category: CategoryId;
  name: string;
  description: string;
  /** Price in ZAR cents */
  priceZAR: number;
  /** Price in USD cents (display only) */
  priceUSD: number;
  imageUrl: string;
  artisanName: string;
  artisanLocation: string;
  stock: number;
  featured?: boolean;
};

const u = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=85&w=${w}`;

export const PRODUCTS: Product[] = [
  // ── HATS ──────────────────────────────────────────────────────
  {
    id: "h-fedora-beaded",
    sku: "FFL-HAT-001",
    category: "hats",
    name: "Fruitful Beaded Fedora",
    description:
      "Handwoven jute fedora with Ndebele-inspired beadwork brim and embroidered Fruitful badge.",
    priceZAR: 69900,
    priceUSD: 3900,
    imageUrl: hatAsset.url,
    artisanName: "HatHaven Collective",
    artisanLocation: "Pretoria, SA",
    stock: 6,
    featured: true,
  },
  {
    id: "h-bushcoding-beanie",
    sku: "FFL-HAT-002",
    category: "hats",
    name: "BushCoding Beanie",
    description: "Heavyweight ribbed knit for cold-morning kiosk coders.",
    priceZAR: 45000,
    priceUSD: 2500,
    imageUrl: u("1576871337622-98d48d895e7d"),
    artisanName: "Limpopo Knitters",
    artisanLocation: "Polokwane, SA",
    stock: 12,
  },
  {
    id: "h-sun-straw",
    sku: "FFL-HAT-003",
    category: "hats",
    name: "Sovereign Sun Straw",
    description: "Wide-brim straw with leather pull-cord. Made for the Lowveld.",
    priceZAR: 54900,
    priceUSD: 3000,
    imageUrl: u("1514327605112-b887c0e61c0a"),
    artisanName: "Mama Thembi",
    artisanLocation: "Nelspruit, SA",
    stock: 8,
  },

  // ── KIDSWEAR ──────────────────────────────────────────────────
  {
    id: "k-romper-bashedi",
    sku: "FFL-KID-001",
    category: "kidswear",
    name: "Bashedi Children Romper",
    description: "Hand-stitched cotton romper with traditional Pedi trim. Ages 1–4.",
    priceZAR: 64900,
    priceUSD: 3500,
    imageUrl: u("1503944583220-79d8926ad5e2"),
    artisanName: "Bashedi Sewing Circle",
    artisanLocation: "Sekhukhune, SA",
    stock: 9,
    featured: true,
  },
  {
    id: "k-dress-tindle",
    sku: "FFL-KID-002",
    category: "kidswear",
    name: "Tindle Traditional Dress",
    description: "Pale-pink hand-embroidered dress. A first-day-of-school heirloom.",
    priceZAR: 69900,
    priceUSD: 3900,
    imageUrl: u("1518831959646-742c3a14ebf7"),
    artisanName: "Gogo Mavis",
    artisanLocation: "Tzaneen, SA",
    stock: 5,
  },
  {
    id: "k-knit-cream",
    sku: "FFL-KID-003",
    category: "kidswear",
    name: "Cream Hand-Knit Set",
    description: "Two-piece organic cotton knit. Bonnet + bootees included.",
    priceZAR: 124900,
    priceUSD: 6900,
    imageUrl: u("1522771930-78848d9293e8"),
    artisanName: "HatHaven Collective",
    artisanLocation: "Pretoria, SA",
    stock: 4,
  },

  // ── PRINTS (SamFox subset; full 30 import in Phase 2) ─────────
  {
    id: "p-kruger-lion-dawn",
    sku: "SF-KRG-LION-01",
    category: "prints",
    name: "Kruger Lion Dawn Canvas",
    description: "Dominant male at sunrise. 300gsm Hahnemühle cotton rag, archival.",
    priceZAR: 145000,
    priceUSD: 9500,
    imageUrl: u("1614027164847-1b28cfe1df60"),
    artisanName: "Sam Fox",
    artisanLocation: "Cape Town, SA",
    stock: 12,
    featured: true,
  },
  {
    id: "p-elephant-matriarch",
    sku: "SF-ADD-ELEP-01",
    category: "prints",
    name: "Elephant Matriarch Sepia",
    description: "Aged matriarch in Addo. Limited sepia edition, signed.",
    priceZAR: 128000,
    priceUSD: 8400,
    imageUrl: u("1564760055775-d63b17a55c44"),
    artisanName: "Sam Fox",
    artisanLocation: "Cape Town, SA",
    stock: 18,
  },
  {
    id: "p-cheetah-sprint",
    sku: "SF-KGL-CHET-01",
    category: "prints",
    name: "Cheetah Sprint Blur",
    description: "Motion-blur capture in Kgalagadi. High-speed series.",
    priceZAR: 165000,
    priceUSD: 10800,
    imageUrl: u("1551969014-7d2c4cddf0b6"),
    artisanName: "Sam Fox",
    artisanLocation: "Cape Town, SA",
    stock: 8,
  },
  {
    id: "p-black-rhino",
    sku: "SF-CNS-RHIN-01",
    category: "prints",
    name: "Black Rhino Portrait",
    description: "Critically endangered. Part of conservation awareness series.",
    priceZAR: 175000,
    priceUSD: 11500,
    imageUrl: u("1564349683136-77e08dba1ef7"),
    artisanName: "Sam Fox",
    artisanLocation: "Cape Town, SA",
    stock: 6,
  },

  // ── POTTERY ───────────────────────────────────────────────────
  {
    id: "pot-limpopo-earth",
    sku: "FFL-POT-001",
    category: "pottery",
    name: "Limpopo Earth Pot",
    description: "River-bank fired clay. Each piece carries the maker's fingerprint.",
    priceZAR: 89900,
    priceUSD: 4900,
    imageUrl: u("1565193998772-263d7f4d2bd9"),
    artisanName: "Ndebele Clay Co-op",
    artisanLocation: "Limpopo, SA",
    stock: 4,
    featured: true,
  },
  {
    id: "pot-brew-mug",
    sku: "FFL-POT-002",
    category: "pottery",
    name: "Ceramic Brew Mug",
    description: "Sand-textured heavy-gauge mug. Built for the long server shift.",
    priceZAR: 15000,
    priceUSD: 850,
    imageUrl: u("1514228742587-6b1558feca3d"),
    artisanName: "Karoo Studio",
    artisanLocation: "Graaff-Reinet, SA",
    stock: 20,
  },
  {
    id: "pot-set-trio",
    sku: "FFL-POT-003",
    category: "pottery",
    name: "Trio Pot Set",
    description: "Three nesting pots. Burnt ochre, deep red, and bone glaze.",
    priceZAR: 224900,
    priceUSD: 12500,
    imageUrl: u("1610701596007-11502861dcfa"),
    artisanName: "Ndebele Clay Co-op",
    artisanLocation: "Limpopo, SA",
    stock: 3,
  },

  // ── NOURISHMENT ───────────────────────────────────────────────
  {
    id: "n-flat-white",
    sku: "FFL-COF-001",
    category: "nourish",
    name: "Fruitful Flat White",
    description: "Single-origin SA beans, double-shot, velvet microfoam.",
    priceZAR: 4200,
    priceUSD: 250,
    imageUrl: u("1495474472287-4d71bcdd2085"),
    artisanName: "Roasted on-site",
    artisanLocation: "This kiosk",
    stock: 45,
    featured: true,
  },
  {
    id: "n-pancakes",
    sku: "FFL-NSH-001",
    category: "nourish",
    name: "Bushstack Pancakes",
    description: "Golden stack with wild honey, berries, and velvet cream.",
    priceZAR: 8500,
    priceUSD: 500,
    imageUrl: u("1528207776546-365bb710ee93"),
    artisanName: "Made on-site",
    artisanLocation: "This kiosk",
    stock: 15,
  },
  {
    id: "n-rooibos",
    sku: "FFL-TEA-001",
    category: "nourish",
    name: "Cederberg Rooibos Pot",
    description: "Caffeine-free, slow-steeped in a clay pot. Honey on the side.",
    priceZAR: 3500,
    priceUSD: 200,
    imageUrl: u("1556679343-c7306c1976bc"),
    artisanName: "Cederberg Tea Co-op",
    artisanLocation: "Western Cape, SA",
    stock: 30,
  },

  // ── APPAREL ───────────────────────────────────────────────────
  {
    id: "a-tshirt-mr",
    sku: "FFL-APP-001",
    category: "apparel",
    name: "Mr Fruitful T-Shirt",
    description: "Organic cotton, screen-printed Mr Fruitful mascot front and back.",
    priceZAR: 35000,
    priceUSD: 1900,
    imageUrl: u("1521572163474-6864f9cf17ab"),
    artisanName: "Fruitful Apparel",
    artisanLocation: "Cape Town, SA",
    stock: 24,
    featured: true,
  },
  {
    id: "a-tshirt-seeds",
    sku: "FFL-APP-002",
    category: "apparel",
    name: "Changing Seeds Tee",
    description: '"If you don\'t like the fruits you are growing, change the seeds."',
    priceZAR: 35000,
    priceUSD: 1900,
    imageUrl: u("1503341504253-dff4815485f1"),
    artisanName: "Fruitful Apparel",
    artisanLocation: "Cape Town, SA",
    stock: 18,
  },
  {
    id: "a-hoodie",
    sku: "FFL-APP-003",
    category: "apparel",
    name: "Bush Coder Hoodie",
    description: "Heavyweight fleece, kangaroo pocket, embroidered logo.",
    priceZAR: 89900,
    priceUSD: 4900,
    imageUrl: u("1556821840-3a63f95609a7"),
    artisanName: "Fruitful Apparel",
    artisanLocation: "Cape Town, SA",
    stock: 10,
  },
];

export const formatZAR = (cents: number) =>
  `R ${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const formatUSD = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
