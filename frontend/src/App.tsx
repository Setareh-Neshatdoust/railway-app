import { Link } from 'react-router-dom'
import { useTheme } from './hooks/useTheme'
import { ThemeToggleButton } from './components/ThemeToggleButton'
import { AppRoutes } from './routes/AppRoutes'

function App() {
  const { isDark, toggleTheme } = useTheme()
  return (
    <div className="min-h-screen bg-page text-primary">
      <header className="border-b border-line px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-medium">Italian railway performance</h1>
          <nav className="flex gap-4 text-sm">
            <Link to="/" className="text-muted hover:text-primary">Route stats</Link>
            <Link to="/stations" className="text-muted hover:text-primary">Station analysis</Link>
          </nav>
        </div>
        <ThemeToggleButton isDark={isDark} onToggle={toggleTheme} />
      </header>
      <AppRoutes />
    </div>
  )
}

export default App