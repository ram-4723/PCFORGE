/**
 * The canonical route registry for the public PCForge site.
 * Keep navigation, page labels, and route matching in sync through this file.
 */
export const siteRoutes = [
  { id: 'home', path: '/', label: 'Home', title: 'PCForge — Your Performance. Your Rules.', group: 'primary' },
  { id: 'builder', path: '/builder', label: 'Builder', title: 'PC Builder | PCForge', group: 'primary' },
  { id: 'components', path: '/components', label: 'Components', title: 'Components | PCForge', group: 'primary' },
  { id: 'prebuilt', path: '/prebuilt', label: 'Prebuilt', title: 'Prebuilt PCs | PCForge', group: 'primary' },
  { id: 'showcase', path: '/showcase', label: 'Showcase', title: 'Build Showcase | PCForge', group: 'explore' },
  { id: 'hardware-explorer', path: '/hardware-explorer', label: 'Hardware Explorer', title: 'Hardware Explorer | PCForge', group: 'explore' },
  { id: 'about', path: '/about', label: 'About', title: 'About PCForge', group: 'company' },
  { id: 'contact', path: '/contact', label: 'Contact', title: 'Contact PCForge', group: 'company' },
]

export const siteRouteByPath = Object.fromEntries(siteRoutes.map((route) => [route.path, route]))
export const siteNavigationRoutes = siteRoutes
export const footerExploreRoutes = siteRoutes.filter((route) => ['home', 'builder', 'components', 'prebuilt'].includes(route.id))

export function resolveSiteRoute(pathname) {
  return siteRouteByPath[pathname] || { id: 'not-found', path: pathname, title: 'Page not found | PCForge' }
}
