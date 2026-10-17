import { Link } from 'react-router-dom'
import { useTheme } from './hooks/useTheme'
import { ThemeToggleButton } from './components/ThemeToggleButton'
import { AppRoutes } from './routes/AppRoutes'
import { BackToTop } from './components/BackToTop'

function App() {
  const { isDark, toggleTheme } = useTheme()
  return (
    <div className="min-h-screen bg-page text-primary">
      <header className="sticky top-0 z-10 bg-page border-b border-line">
        <div className="mx-auto max-w-5xl h-16 px-6 flex items-center justify-between">
          <h1 className="text-lg font-medium">
            <Link to="/" className="hover:text-accent">Italian railway performance</Link>
          </h1>
          <ThemeToggleButton isDark={isDark} onToggle={toggleTheme} />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <AppRoutes />
      </main>
      <BackToTop />
    </div>
  )
}

export default App