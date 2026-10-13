import { Link } from 'react-router-dom'
import { useTheme } from './hooks/useTheme'
import { ThemeToggleButton } from './components/ThemeToggleButton'
import { AppRoutes } from './routes/AppRoutes'

function App() {
  const { isDark, toggleTheme } = useTheme()
  return (
    <div className="min-h-screen bg-page text-primary">
      <header className="sticky top-0 z-10 bg-page border-b border-line px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-medium">
            <Link to="/" className="hover:text-accent">Italian railway performance</Link>
          </h1>
        </div>
        <ThemeToggleButton isDark={isDark} onToggle={toggleTheme} />
      </header>
      <AppRoutes />
    </div>
  )
}

export default App