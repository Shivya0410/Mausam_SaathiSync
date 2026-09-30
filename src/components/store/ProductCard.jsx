"use client";

import { useTranslation } from "react-i18next";
import { discountPct, formatINR } from "../../data/products";

/** Product card: CSS-art tile, rating, price/MRP/discount, external Buy Now. */
export default function ProductCard({ product }) {
  const { t } = useTranslation();
  const off = discountPct(product);
  return (
    <article className="store-card">
      <div className="store-art" style={{ background: `linear-gradient(135deg, ${product.color}, #2d1b4e)` }}>
        <i className={product.icon} aria-hidden="true"></i>
        {off > 0 && <span className="store-off">-{off}%</span>}
      </div>
      <div className="store-body">
        <span className="store-brand">{product.brand}</span>
        <h3>{product.name}</h3>
        <span className="store-rating">
          <i className="fa-solid fa-star" aria-hidden="true"></i>
          {product.rating.toFixed(1)} ({product.reviews.toLocaleString("en-IN")})
        </span>
        <div className="store-price">
          <strong>{formatINR(product.price)}</strong>
          {product.mrp > product.price && <s>{formatINR(product.mrp)}</s>}
        </div>
        <a className="store-buy" href={product.url} target="_blank" rel="noopener noreferrer">
          {t("store.buyNow")} <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
        </a>
      </div>
    </article>
  );
}
