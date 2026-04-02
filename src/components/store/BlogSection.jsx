import { BookOpen, ChevronLeft, Sparkles, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  BLOG_CATEGORIES,
  articlesByCategory,
  blogArticles,
} from '@/data/blogArticles'

function findProductByHint(products, hint) {
  if (!hint || !products?.length) return null
  const h = hint.toLowerCase()
  return products.find((p) => p.name.toLowerCase().includes(h)) ?? null
}

export function BlogList({
  onOpenArticle,
  onBackHome,
}) {
  const productArts = articlesByCategory(BLOG_CATEGORIES.product)
  const businessArts = articlesByCategory(BLOG_CATEGORIES.business)

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <button
        type="button"
        onClick={onBackHome}
        className="flex items-center text-emerald-800 hover:text-emerald-950 mb-6 font-medium bg-emerald-50 px-3 py-1.5 rounded-lg border-0 cursor-pointer text-sm"
      >
        <ChevronLeft className="w-5 h-5 mr-1" /> Retour à l&apos;accueil
      </button>

      <div className="text-center mb-12">
        <span className="inline-flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-widest">
          <BookOpen className="w-4 h-4" />
          Blog
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-emerald-950 mt-2">
          Conseils bien-être & business
        </h1>
        <p className="text-stone-600 mt-3 max-w-2xl mx-auto text-sm md:text-base">
          Articles pour mieux choisir vos produits Forever Living Products® et
          comprendre l&apos;opportunité de distribution. Mots-clés SEO intégrés
          pour vous aider à nous retrouver en ligne.
        </p>
      </div>

      <section className="mb-14">
        <h2 className="text-xl font-bold text-emerald-900 mb-6 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-500" />
          Produits & bien-être
        </h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {productArts.map((a) => (
            <li key={a.slug}>
              <button
                type="button"
                onClick={() => onOpenArticle(a.slug)}
                className="w-full text-left bg-white rounded-2xl border border-emerald-100 p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition group"
              >
                <h3 className="font-bold text-emerald-950 group-hover:text-emerald-800 leading-snug mb-2">
                  {a.title}
                </h3>
                <p className="text-sm text-stone-600 line-clamp-2">{a.excerpt}</p>
                <p className="text-xs text-amber-700 mt-3 font-medium">
                  Lire l&apos;article →
                </p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-emerald-900 mb-6 flex items-center gap-2">
          <Users className="w-6 h-6 text-amber-500" />
          Business & opportunité
        </h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {businessArts.map((a) => (
            <li key={a.slug}>
              <button
                type="button"
                onClick={() => onOpenArticle(a.slug)}
                className="w-full text-left bg-white rounded-2xl border border-amber-100 p-5 shadow-sm hover:shadow-md hover:border-amber-200 transition group"
              >
                <h3 className="font-bold text-emerald-950 group-hover:text-emerald-800 leading-snug mb-2">
                  {a.title}
                </h3>
                <p className="text-sm text-stone-600 line-clamp-2">{a.excerpt}</p>
                <p className="text-xs text-amber-700 mt-3 font-medium">
                  Lire l&apos;article →
                </p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <aside className="mt-12 rounded-2xl bg-stone-100 border border-stone-200 p-4 text-xs text-stone-500">
        <strong className="text-stone-700">Index des articles :</strong>{' '}
        {blogArticles.map((a) => a.slug).join(', ')}
      </aside>
    </div>
  )
}

export function BlogArticleView({
  article,
  products,
  onBackToBlog,
  onCtaShop,
  onCtaBusiness,
  onGoToProduct,
  waLinkMlm,
}) {
  if (!article) return null

  const linkedProduct = findProductByHint(products, article.productNameHint)

  return (
    <article className="max-w-3xl mx-auto pb-16">
      <button
        type="button"
        onClick={onBackToBlog}
        className="flex items-center text-emerald-800 hover:text-emerald-950 mb-6 font-medium bg-emerald-50 px-3 py-1.5 rounded-lg border-0 cursor-pointer text-sm"
      >
        <ChevronLeft className="w-5 h-5 mr-1" /> Retour au blog
      </button>

      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-2">
          {article.category === BLOG_CATEGORIES.product
            ? 'Produits & bien-être'
            : 'Business & opportunité'}
        </p>
        <h1 className="text-2xl md:text-4xl font-extrabold text-emerald-950 leading-tight">
          {article.title}
        </h1>
        <p className="text-stone-600 mt-4 text-lg leading-relaxed">{article.excerpt}</p>
        <p className="mt-4 text-xs text-stone-500 border-l-4 border-emerald-300 pl-3">
          <strong className="text-stone-700">Mots-clés SEO :</strong>{' '}
          {article.keywords}
        </p>
      </header>

      <div className="rounded-2xl overflow-hidden mb-10 aspect-[21/9] max-h-56 bg-stone-200">
        <img
          src={article.heroImage}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      <div className="prose prose-stone max-w-none">
        {article.paragraphs.map((p, i) => (
          <p key={i} className="text-stone-700 leading-relaxed mb-5 text-base">
            {p}
          </p>
        ))}
      </div>

      <div className="mt-10 p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-amber-50 border border-emerald-100">
        <p className="font-semibold text-emerald-950 mb-4">
          {article.cta === 'shop'
            ? 'Passer à l’action — boutique'
            : 'Passer à l’action — opportunité'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          {article.cta === 'shop' && (
            <>
              {linkedProduct ? (
                <Button
                  variant="accent"
                  className="rounded-xl"
                  onClick={() => onGoToProduct(linkedProduct)}
                >
                  Voir : {linkedProduct.name}
                </Button>
              ) : null}
              <Button
                variant={linkedProduct ? 'outline' : 'accent'}
                className="rounded-xl"
                onClick={onCtaShop}
              >
                {linkedProduct ? 'Toute la boutique' : 'Découvrir la boutique'}
              </Button>
            </>
          )}
          {article.cta === 'business' && (
            <>
              <Button variant="accent" className="rounded-xl" onClick={onCtaBusiness}>
                Présentation opportunité
              </Button>
              <Button variant="outline" className="rounded-xl" asChild>
                <a href={waLinkMlm} target="_blank" rel="noopener noreferrer">
                  WhatsApp — échanger avec un conseiller
                </a>
              </Button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
