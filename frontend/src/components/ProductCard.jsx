import { Link } from "react-router-dom";
import { Plus, ArrowUpRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { useCart } from "../context/CartContext";

export const ProductCard = ({ product, index = 0 }) => {
  const { add } = useCart();
  return (
    <Reveal delay={(index % 4) * 0.07} className="h-full">
      <article
        className="group flex h-full flex-col border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-amber-600/50 hover:shadow-xl hover:shadow-slate-900/5"
        data-testid={`product-card-${product.product_id}`}
      >
        <Link to={`/products/${product.product_id}`} className="relative block overflow-hidden" data-testid={`product-view-${product.product_id}`}>
          <img
            src={product.image}
            alt={product.title}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <span className="absolute left-0 top-4 bg-slate-950/90 px-2.5 py-1 font-mono text-[10px] tracking-[0.25em] text-amber-500">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </Link>
        <div className="flex flex-1 flex-col p-5">
          <span className="eyebrow !text-[10px]">{product.category}</span>
          <h3 className="mt-2 font-display text-lg font-bold uppercase leading-tight tracking-tight text-slate-900">
            <Link to={`/products/${product.product_id}`} className="transition-colors hover:text-amber-700">
              {product.title}
            </Link>
          </h3>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-slate-500">
            {product.grade} · MOQ {product.moq}
          </p>
          <div className="mt-auto flex gap-2 pt-5">
            <Link
              to={`/products/${product.product_id}`}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 border border-slate-300 font-mono text-[11px] uppercase tracking-[0.15em] text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-950"
              data-testid={`product-specs-${product.product_id}`}
            >
              Specs <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={() => add(product)}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 bg-slate-950 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-all hover:bg-amber-600 active:scale-95"
              data-testid={`product-card-add-${product.product_id}`}
            >
              <Plus className="h-3.5 w-3.5" /> Quote
            </button>
          </div>
        </div>
      </article>
    </Reveal>
  );
};
