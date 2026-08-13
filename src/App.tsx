import { useState } from 'react'
import { Route, Routes, NavLink, Link } from 'react-router-dom'
import { Home } from './pages/Home'
import { Karten } from './pages/Karten'
import { Tierlist } from './pages/Tierlist'
import { Matchups } from './pages/Matchups'
import { Impressum } from './pages/Impressum'
import { Datenschutz } from './pages/Datenschutz'
import { HeaderSlotProvider } from './components/layout/HeaderSlot'
import { useHeaderSlotValue } from './components/layout/useHeaderSlot'

const NAV_LINKS = [
  { to: '/', label: 'Start', end: true },
  { to: '/karten', label: 'Karten', end: false },
  { to: '/tierlist', label: 'Tierlist', end: false },
  { to: '/matchups', label: 'Matchups', end: false },
]

function Logo({ size = 26 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="bg-accent"
        style={{
          width: size,
          height: size,
          clipPath: 'polygon(0 0,100% 0,100% 72%,72% 100%,0 100%)',
        }}
      />
      <div className="font-mono text-[13px] font-bold tracking-[0.16em]">
        TCGP<span className="text-contrast">·</span>META
      </div>
    </div>
  )
}

function navLinkClassName({ isActive }: { isActive: boolean }): string {
  return `flex items-center px-5 h-full text-sm border-b-2 ${
    isActive
      ? 'text-accent font-medium bg-accent/10 border-accent'
      : 'text-text-dim border-transparent hover:text-text'
  }`
}

function DesktopNav() {
  const slot = useHeaderSlotValue()

  return (
    <div className="hidden md:block sticky top-0 z-20 bg-bg-panel border-b border-line">
      <div className="flex items-stretch justify-between">
        <div className="flex items-center gap-3.5 px-6 border-r border-line">
          <Link to="/">
            <Logo />
          </Link>
        </div>
        <div className="flex items-stretch flex-1">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={navLinkClassName}
            >
              {link.label}
            </NavLink>
          ))}
          <div className="flex-1" />
          <div className="flex items-center gap-4 px-5 font-mono text-[11px] tracking-[0.06em] text-text-faint">
            <Link to="/impressum" className="hover:text-text-dim">
              IMPRESSUM
            </Link>
            <Link to="/datenschutz" className="hover:text-text-dim">
              DATENSCHUTZ
            </Link>
          </div>
          {slot?.action && (
            <div className="flex items-center px-5 border-l border-line">
              {slot.action}
            </div>
          )}
        </div>
      </div>
      {slot?.meta && (
        <div className="border-t border-line bg-bg-base">{slot.meta}</div>
      )}
    </div>
  )
}

function MobileNav() {
  const [open, setOpen] = useState(false)
  const slot = useHeaderSlotValue()

  return (
    <div className="md:hidden sticky top-0 z-20 bg-bg-panel border-b border-line">
      <div className="flex items-center justify-between px-3.5 py-3">
        <Link to="/" onClick={() => setOpen(false)}>
          <Logo size={22} />
        </Link>
        <button
          type="button"
          aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex h-11 w-11 flex-col items-end justify-center gap-1.5 pr-0.5"
        >
          <span
            className={`h-[1.5px] bg-accent transition-transform ${open ? 'w-5 translate-y-[6.5px] rotate-45' : 'w-5'}`}
          />
          <span
            className={`h-[1.5px] w-5 bg-accent ${open ? 'opacity-0' : ''}`}
          />
          <span
            className={`h-[1.5px] bg-accent transition-transform ${open ? 'w-5 -translate-y-[6.5px] -rotate-45' : 'w-[13px]'}`}
          />
        </button>
      </div>

      {open && (
        <div className="bg-bg-panel border-t border-line">
          <div className="flex flex-col border-b border-line">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `h-12 flex items-center px-3.5 text-[15px] border-b border-[#12151c] ${
                    isActive
                      ? 'text-accent font-medium bg-accent/10 border-l-2 border-l-accent'
                      : 'text-text-dim'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/impressum"
              onClick={() => setOpen(false)}
              className="h-11 flex items-center px-3.5 font-mono text-[11px] tracking-[0.1em] text-text-faint border-b border-[#12151c]"
            >
              IMPRESSUM
            </Link>
            <Link
              to="/datenschutz"
              onClick={() => setOpen(false)}
              className="h-11 flex items-center px-3.5 font-mono text-[11px] tracking-[0.1em] text-text-faint"
            >
              DATENSCHUTZ
            </Link>
          </div>
          {slot && (slot.action || slot.meta) && (
            <div className="flex flex-col gap-2.5 px-3.5 py-3">
              {slot.action}
              {slot.meta && <div className="text-center">{slot.meta}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <HeaderSlotProvider>
      <div className="min-h-screen bg-bg-base text-text">
        <DesktopNav />
        <MobileNav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/karten" element={<Karten />} />
          <Route path="/tierlist" element={<Tierlist />} />
          <Route path="/matchups" element={<Matchups />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/datenschutz" element={<Datenschutz />} />
        </Routes>
      </div>
    </HeaderSlotProvider>
  )
}

export default App
