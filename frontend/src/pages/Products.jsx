import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { api } from "../lib/api";
import { ProductCard } from "../components/ProductCard";
import { Reveal } from "../components/Reveal";

const CATEGORIES = ["All", "S.S. Nipple Pipe Fittings", "Auto Parts"];

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const category = params.get("category") || "All";

  useEffect(() => {
    setLoading(true);
    api
      .get("/products", { params: { category: category === "All" ? undefined : category, q: q || undefined } })
      .then(({ data }) => setProducts(data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category, q]);

  const counts = useMemo(() => products.length, [products]);

  return (
    <div className="bg-[#F8FAFC] pb-24 pt-32 lg:pt-40" data-testid="products-page">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="eyebrow">Product Catalogue</p>
          <h1 className="mt-4 font-display text-4xl font-black uppercase tracking-tight text-slate-900 sm:text-5xl">
            Built to spec. <span className="text-amber-600">Priced on request.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Add items to your quote cart and submit a single B2B enquiry — our team responds with
            formal pricing, lead time and freight details within 24 hours.
          </p>
        </Reveal>

        <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" data-testid="category-filters">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => (c === "All" ? setParams({}) : setParams({ category: c }))}
                className={`h-10 border px-4 font-mono text-[11px] uppercase tracking-[0.15em] transition-all duration-200 ${
                  category === c
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-300 bg-white text-slate-600 hover:border-slate-950"
                }`}
                data-testid={`filter-${c === "All" ? "all" : c === "Auto Parts" ? "auto-parts" : "fittings"}`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="relative lg:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products…"
              className="h-11 w-full border border-slate-300 bg-white pl-10 pr-4 font-mono text-xs tracking-wide text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-amber-600"
              data-testid="product-search-input"
            />
          </div>
        </div>

        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500" data-testid="products-count">
          {loading ? "Loading…" : `${counts} products`}
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.product_id} product={p} index={i} />
          ))}
        </div>

        {!loading && products.length === 0 && (
          <div className="border border-slate-200 bg-white p-16 text-center" data-testid="products-empty">
            <p className="font-display text-xl font-bold uppercase text-slate-500">No products found</p>
            <p className="mt-2 text-sm text-slate-500">Try a different search or category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
