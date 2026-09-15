import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Minus, Plus, ClipboardList, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";
import { useShopCart } from "../context/ShopCartContext";
import { ProductCard } from "../components/ProductCard";
import { Reveal } from "../components/Reveal";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(100);
  const [variantIdx, setVariantIdx] = useState(0);
  const [notFound, setNotFound] = useState(false);
  const { add, setDrawerOpen } = useCart();
  const { add: addToCart } = useShopCart();

  useEffect(() => {
    setProduct(null);
    setNotFound(false);
    api
      .get(`/products/${id}`)
      .then(({ data }) => {
        setProduct(data);
        api.get("/products", { params: { category: data.category } }).then(({ data: rel }) =>
          setRelated(rel.filter((r) => r.product_id !== data.product_id).slice(0, 4))
        );
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound)
    return (
      <div className="grid min-h-[60vh] place-items-center bg-[#F8FAFC] pt-24" data-testid="product-not-found">
        <div className="text-center">
          <p className="font-display text-2xl font-bold uppercase text-slate-700">Product not found</p>
          <Link to="/products" className="mt-4 inline-block font-mono text-xs uppercase tracking-[0.2em] text-amber-700">
            Back to catalogue
          </Link>
        </div>
      </div>
    );

  if (!product)
    return <div className="min-h-[60vh] bg-[#F8FAFC] pt-24" data-testid="product-loading" />;

  return (
    <div className="bg-[#F8FAFC] pb-24 pt-32 lg:pt-40" data-testid="product-detail-page">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link to="/products" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-amber-700" data-testid="back-to-products">
          <ArrowLeft className="h-3.5 w-3.5" /> Catalogue
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="clip-corner sticky top-32 overflow-hidden border border-slate-200 bg-white">
              <img src={product.image} alt={product.title} className="aspect-[4/3] w-full object-cover" data-testid="product-detail-image" />
            </div>
          </Reveal>

          <div>
            <Reveal>
              <p className="eyebrow">{product.category}</p>
              <h1 className="mt-3 font-display text-3xl font-black uppercase tracking-tight text-slate-900 sm:text-4xl" data-testid="product-detail-title">
                {product.title}
              </h1>
              <p className="mt-3 font-mono text-xs uppercase tracking-[0.15em] text-slate-500">
                {product.grade} · Unit: {product.unit} · MOQ: {product.moq}
              </p>
              <p className="mt-6 text-sm leading-relaxed text-slate-600 sm:text-base">{product.description}</p>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="mt-8 border border-slate-200 bg-white">
                <p className="border-b border-slate-200 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
                  Technical Specifications
                </p>
                <ul className="divide-y divide-slate-100" data-testid="product-specs-list">
                  {product.specs?.map((s) => (
                    <li key={s} className="flex items-center gap-3 px-5 py-3 font-mono text-xs text-slate-700">
                      <Check className="h-3.5 w-3.5 shrink-0 text-amber-600" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              {product.variants?.length > 0 && (
                <div className="mt-8">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">Select Size / Variant</p>
                  <div className="mt-3 flex flex-wrap gap-2" data-testid="variant-selector">
                    {product.variants.map((v, i) => (
                      <button
                        key={v.variant_id || i}
                        onClick={() => setVariantIdx(i)}
                        className={`h-11 border px-4 font-mono text-xs tracking-wide transition-all ${
                          variantIdx === i ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-slate-950"
                        }`}
                        data-testid={`variant-${i}`}
                      >
                        {v.size} · ₹{v.price}
                      </button>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap items-baseline gap-3" data-testid="detail-price">
                    <span className="font-display text-3xl font-extrabold text-slate-900">
                      ₹{product.variants[variantIdx].price.toLocaleString("en-IN")}
                    </span>
                    <span className="font-mono text-xs uppercase tracking-[0.15em] text-slate-500">
                      /{(product.unit || "Piece").toLowerCase()} · {product.variants[variantIdx].availability} · MOQ {product.variants[variantIdx].min_order_quantity}
                    </span>
                  </div>
                </div>
              )}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <div className="flex items-center border border-slate-300 bg-white">
                  <button className="grid h-12 w-11 place-items-center text-slate-500 hover:text-amber-700" onClick={() => setQty(Math.max(1, qty - 50))} data-testid="detail-qty-minus">
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-12 w-20 border-x border-slate-300 text-center font-mono text-sm outline-none"
                    data-testid="detail-qty-input"
                  />
                  <button className="grid h-12 w-11 place-items-center text-slate-500 hover:text-amber-700" onClick={() => setQty(qty + 50)} data-testid="detail-qty-plus">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => {
                    const v = product.variants?.[variantIdx];
                    if (!v) {
                      toast.error("No purchasable variant on this product — use Add to Quote");
                      return;
                    }
                    addToCart(product, v, qty);
                  }}
                  className="flex h-12 flex-1 items-center justify-center gap-2 bg-amber-600 px-6 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-white transition-all hover:bg-amber-500 active:scale-95 sm:flex-none sm:px-8"
                  data-testid="detail-add-to-cart"
                >
                  <ShoppingCart className="h-4 w-4" /> Add to Cart
                </button>
                <button
                  onClick={() => {
                    add(product, qty);
                    setDrawerOpen(true);
                  }}
                  className="flex h-12 flex-1 items-center justify-center gap-2 bg-slate-950 px-6 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-white transition-all hover:bg-slate-800 active:scale-95 sm:flex-none sm:px-8"
                  data-testid="detail-add-to-quote"
                >
                  <ClipboardList className="h-4 w-4" /> Add to Quote
                </button>
              </div>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Prices indicative, ex-works Rajkot · GST extra · MTC available · Pan-India dispatch
              </p>
            </Reveal>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-24">
            <Reveal>
              <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-slate-900 sm:text-3xl">
                Related in {product.category}
              </h2>
            </Reveal>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p, i) => (
                <ProductCard key={p.product_id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
