import { Route, Routes, Link } from 'react-router-dom'
import { Home } from './pages/Home'
import { Karten } from './pages/Karten'
import { Tierlist } from './pages/Tierlist'
import { Impressum } from './pages/Impressum'
import { Datenschutz } from './pages/Datenschutz'

function App() {
  return (
    <div className="min-h-screen">
      <nav className="border-b border-gray-200 px-4 py-3 text-sm dark:border-gray-800">
        <Link to="/" className="mr-4 hover:underline">
          Start
        </Link>
        <Link to="/karten" className="mr-4 hover:underline">
          Karten
        </Link>
        <Link to="/tierlist" className="mr-4 hover:underline">
          Tierlist
        </Link>
        <Link to="/impressum" className="mr-4 hover:underline">
          Impressum
        </Link>
        <Link to="/datenschutz" className="hover:underline">
          Datenschutz
        </Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/karten" element={<Karten />} />
        <Route path="/tierlist" element={<Tierlist />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
      </Routes>
    </div>
  )
}

export default App
