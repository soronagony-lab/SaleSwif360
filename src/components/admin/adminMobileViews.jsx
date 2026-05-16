import {
  Eye,
  MessageCircle,
  Phone,
  Trash2,
} from 'lucide-react'
import { formatPrice } from '@/lib/format'

export function orderStatusClass(status) {
  if (status === 'Nouvelle') {
    return 'bg-blue-50 text-blue-700 border-blue-200'
  }
  if (status === 'En cours') {
    return 'bg-yellow-50 text-yellow-700 border-yellow-200'
  }
  if (status === 'Livrée') {
    return 'bg-green-50 text-green-700 border-green-200'
  }
  return 'bg-red-50 text-red-700 border-red-200'
}

export function OrderStatusSelect({ value, onChange, className = '' }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`text-xs font-bold px-3 py-2 rounded-full outline-none cursor-pointer border-2 appearance-none min-h-[44px] ${orderStatusClass(value)} ${className}`}
    >
      <option value="Nouvelle">Nouvelle</option>
      <option value="En cours">En cours</option>
      <option value="Livrée">Livrée</option>
      <option value="Annulée">Annulée</option>
    </select>
  )
}

export function AdminOrderCard({
  order,
  onView,
  onDelete,
  onStatusChange,
  getWhatsAppLink,
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <p className="font-bold text-teal-700">#{String(order.id).slice(-5)}</p>
          <p className="font-bold text-gray-900 truncate">{order.customerName}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {String(order.date).split(' ')[0]}
          </p>
        </div>
        <OrderStatusSelect
          value={order.status}
          onChange={(e) => onStatusChange(order.id, e.target.value)}
          className="shrink-0 max-w-[9rem]"
        />
      </div>
      <p className="text-sm text-gray-600 flex items-center gap-1">
        <Phone className="w-3.5 h-3.5 shrink-0" />
        {order.phone}
      </p>
      <div className="text-sm">
        <p className="font-medium text-gray-800">{order.productName}</p>
        <p className="font-black text-orange-500 mt-0.5">
          {formatPrice(order.price)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {order.city} — {order.address}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => onView(order.id)}
          className="inline-flex flex-1 min-w-[100px] min-h-[44px] items-center justify-center gap-1.5 bg-teal-100 hover:bg-teal-200 text-teal-800 px-3 rounded-xl font-bold text-xs border-0"
        >
          <Eye className="w-4 h-4" /> Détail
        </button>
        <a
          href={getWhatsAppLink(order)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center bg-[#25D366] hover:bg-[#20b856] text-white px-3 rounded-xl border-0"
          aria-label="WhatsApp"
        >
          <MessageCircle className="w-4 h-4" />
        </a>
        <button
          type="button"
          onClick={() => onDelete(order.id)}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center bg-red-50 hover:bg-red-100 text-red-700 px-3 rounded-xl border-0"
          aria-label="Supprimer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function AdminCustomerCard({ customer }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0">
          {customer.customerName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-900 truncate">{customer.customerName}</p>
          <p className="text-sm text-gray-600">{customer.phone}</p>
        </div>
        <span className="ml-auto shrink-0 text-sm font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
          {customer.orderCount} cmd.
        </span>
      </div>
      <p className="text-xs text-gray-500">
        {customer.city || 'Ville non renseignée'}
      </p>
      <div className="text-sm border-t border-gray-100 pt-2">
        <p className="text-xs text-gray-500">{customer.lastDate}</p>
        <p className="font-medium text-gray-900 line-clamp-2">
          {customer.lastProduct || '—'}
        </p>
      </div>
    </div>
  )
}

export function AdminMarketingClientCard({
  customer,
  checked,
  onToggle,
  href,
  onRelanceClick,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-50 rounded-2xl border border-gray-100 p-4">
      <label className="flex items-center gap-3 min-h-[44px] flex-1 min-w-0 cursor-pointer">
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-gray-300 shrink-0"
          checked={checked}
          onChange={onToggle}
        />
        <span className="min-w-0">
          <span className="block font-bold text-gray-900 truncate">
            {customer.customerName}
          </span>
          <span className="block text-sm text-gray-600">{customer.phone}</span>
        </span>
      </label>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onRelanceClick}
        className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-800 px-4 py-2.5 rounded-xl font-bold text-sm shrink-0"
      >
        <MessageCircle className="w-4 h-4" /> Relancer
      </a>
    </div>
  )
}
