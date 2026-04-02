import { Eye } from 'lucide-react'
import { formatPrice } from '@/lib/format'
import { ProductImage } from '@/components/ProductImage'

export function ProductCard({ product, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all group flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <ProductImage
          src={product.images?.[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-3 md:p-5 flex flex-col flex-grow">
        <h3 className="font-bold text-gray-800 text-sm md:text-lg mb-1 line-clamp-2 leading-tight">
          {product.name}
        </h3>
        <span className="font-black text-lg md:text-xl text-orange-500 mt-auto">
          {formatPrice(product.price)}
        </span>
        <span className="mt-3 w-full bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white font-bold py-2 md:py-2.5 rounded-xl transition-colors flex justify-center items-center text-sm md:text-base border border-teal-100 group-hover:border-teal-600 pointer-events-none">
          <Eye className="w-4 h-4 mr-2" /> Consulter
        </span>
      </div>
    </button>
  )
}
