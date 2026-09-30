// Mock product catalogue for the Wellness Store prototype (/store).
// No payments: Buy Now opens the brand/retailer page in a new tab.
// Images are CSS art (icon + gradient) — no external image URLs by policy.

export const PRODUCT_CATEGORIES = ["accessories", "equipment", "lifestyle", "nutrition"];

export const PRODUCT_CATEGORY_META = {
  accessories: { icon: "fa-solid fa-headphones", labelKey: "store.catAccessories" },
  equipment: { icon: "fa-solid fa-dumbbell", labelKey: "store.catEquipment" },
  lifestyle: { icon: "fa-solid fa-bag-shopping", labelKey: "store.catLifestyle" },
  nutrition: { icon: "fa-solid fa-jar-wheat", labelKey: "store.catNutrition" },
};

export const FEATURED_TAGS = ["yoga-mats", "smartwatches", "snacks", "bands", "bottles"];

export const PRODUCTS = [
  {
    id: "pro-yoga-mat",
    name: "ProGrip Yoga Mat 6mm",
    brand: "Boldfit",
    category: "accessories",
    tags: ["yoga-mats"],
    rating: 4.4,
    reviews: 23150,
    price: 899,
    mrp: 1499,
    icon: "fa-solid fa-person-praying",
    color: "#7e57c2",
    url: "https://www.amazon.in/s?k=boldfit+yoga+mat+6mm",
  },
  {
    id: "pulse-smartwatch",
    name: "Pulse Fitness Smartwatch",
    brand: "Noise",
    category: "accessories",
    tags: ["smartwatches"],
    rating: 4.2,
    reviews: 18400,
    price: 2999,
    mrp: 5999,
    icon: "fa-solid fa-clock",
    color: "#0288d1",
    url: "https://www.amazon.in/s?k=noise+fitness+smartwatch",
  },
  {
    id: "roasted-makhana",
    name: "Roasted Makhana (Pack of 3)",
    brand: "Farmley",
    category: "nutrition",
    tags: ["snacks"],
    rating: 4.5,
    reviews: 9620,
    price: 399,
    mrp: 540,
    icon: "fa-solid fa-bowl-food",
    color: "#2e7d32",
    url: "https://www.amazon.in/s?k=farmley+roasted+makhana",
  },
  {
    id: "power-bands",
    name: "Resistance Bands Set (Set of 5)",
    brand: "Strauss",
    category: "equipment",
    tags: ["bands"],
    rating: 4.3,
    reviews: 7410,
    price: 649,
    mrp: 1299,
    icon: "fa-solid fa-dumbbell",
    color: "#e65100",
    url: "https://www.amazon.in/s?k=resistance+bands+set+of+5",
  },
  {
    id: "steel-bottle",
    name: "Insulated Steel Bottle 1L",
    brand: "Milton",
    category: "lifestyle",
    tags: ["bottles"],
    rating: 4.6,
    reviews: 31200,
    price: 749,
    mrp: 1100,
    icon: "fa-solid fa-bottle-water",
    color: "#00897b",
    url: "https://www.amazon.in/s?k=milton+insulated+steel+bottle+1l",
  },
  {
    id: "whey-plant",
    name: "Plant Protein, Chocolate 500g",
    brand: "Oziva",
    category: "nutrition",
    tags: ["snacks"],
    rating: 4.1,
    reviews: 5280,
    price: 1249,
    mrp: 1699,
    icon: "fa-solid fa-jar-wheat",
    color: "#6a1b9a",
    url: "https://www.amazon.in/s?k=oziva+plant+protein+chocolate",
  },
  {
    id: "skipping-rope",
    name: "Speed Skipping Rope",
    brand: "Nivia",
    category: "equipment",
    tags: ["bands"],
    rating: 4.0,
    reviews: 3150,
    price: 299,
    mrp: 499,
    icon: "fa-solid fa-person-running",
    color: "#c2185b",
    url: "https://www.amazon.in/s?k=nivia+skipping+rope",
  },
  {
    id: "sleep-mask",
    name: "Contoured Sleep Mask",
    brand: "SleepyCat",
    category: "lifestyle",
    tags: ["bottles"],
    rating: 4.3,
    reviews: 1980,
    price: 499,
    mrp: 899,
    icon: "fa-solid fa-moon",
    color: "#4527a0",
    url: "https://www.amazon.in/s?k=contoured+sleep+mask",
  },
];

export function discountPct(p) {
  if (!p.mrp || p.mrp <= p.price) return 0;
  return Math.round(((p.mrp - p.price) / p.mrp) * 100);
}

export function formatINR(n) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

export function topRated(count = 4) {
  return [...PRODUCTS].sort((a, b) => b.rating - a.rating).slice(0, count);
}
