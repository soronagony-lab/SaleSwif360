import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useShop } from '@/context/ShopContext'

const GA4_RE = /^G-[A-Z0-9]+$/i

function removeGa4Script() {
  document.getElementById('ga4-gtag-js')?.remove()
}

/**
 * Google Analytics 4 — activé si l’admin renseigne un Measurement ID (G-…).
 * Vues de page en navigation SPA.
 */
export function AnalyticsGa4() {
  const { settings } = useShop()
  const location = useLocation()
  const gaReadyRef = useRef(false)

  const id = settings.ga4Id?.trim() ?? ''
  const valid = GA4_RE.test(id)

  useEffect(() => {
    removeGa4Script()
    gaReadyRef.current = false
    delete window.gtag

    if (!valid) return undefined

    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag() {
      window.dataLayer.push(arguments)
    }

    const s = document.createElement('script')
    s.id = 'ga4-gtag-js'
    s.async = true
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
    s.onload = () => {
      window.gtag('js', new Date())
      window.gtag('config', id, { send_page_view: false })
      gaReadyRef.current = true
      window.gtag('event', 'page_view', {
        page_path:
          window.location.pathname + window.location.search,
        page_title: document.title,
      })
    }
    document.head.appendChild(s)

    return () => {
      gaReadyRef.current = false
      removeGa4Script()
      delete window.gtag
    }
  }, [id, valid])

  useEffect(() => {
    if (!valid || !gaReadyRef.current || typeof window.gtag !== 'function') {
      return
    }
    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_title: document.title,
    })
  }, [location.pathname, location.search, valid])

  return null
}
