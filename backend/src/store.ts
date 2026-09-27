export type Product = {
  id: string;
  name: string;
  priceCents: number;
  stock: number;
};

// A cart holds quantities only; prices are read from the catalog when needed.
export type Cart = {
  id: string;
  items: Map<string, number>; // productId -> quantity
};

export const products = new Map<string, Product>();
export const carts = new Map<string, Cart>();

function seed(): void {
  products.clear();
  const catalog: Product[] = [
    { id: "p1", name: "Mechanical Keyboard", priceCents: 7999, stock: 25 },
    { id: "p2", name: "Wireless Mouse", priceCents: 2999, stock: 3 }, // kept low to test overselling later
    { id: "p3", name: "USB-C Hub", priceCents: 4550, stock: 40 },
    { id: "p4", name: '27" Monitor', priceCents: 21999, stock: 10 },
    { id: "p5", name: "Laptop Stand", priceCents: 3499, stock: 15 },
  ];
  for (const p of catalog) products.set(p.id, { ...p });
}

// Reseed to a clean state; tests call this so every run starts identical.
export function reset(): void {
  carts.clear();
  seed();
}

seed();
