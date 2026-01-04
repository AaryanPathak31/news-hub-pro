import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CATEGORIES } from '@/types/news';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';

export const Header = () => {
  const { user, isEditor } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const mainCategories = CATEGORIES.filter(c => c.slug !== 'breaking');

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container flex items-center justify-between h-9 text-sm">
          <span className="hidden sm:block font-medium">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <LanguageSelector />
            <ThemeToggle />
            <div className="h-4 w-px bg-primary-foreground/20" />
            {isEditor ? (
              <Link to="/admin" className="hover:underline flex items-center gap-1 text-xs">
                <User className="h-3 w-3" />
                Admin
              </Link>
            ) : user ? (
              <Link to="/admin" className="hover:underline text-xs">Dashboard</Link>
            ) : (
              <Link to="/auth" className="hover:underline text-xs">Login</Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <h1 className="text-2xl md:text-4xl font-serif font-bold tracking-tight text-foreground transition-transform group-hover:scale-[1.02]">
              NoName<span className="text-destructive">News</span>
            </h1>
          </Link>

          {/* Search */}
          <div className="flex items-center gap-2">
            <div className={cn(
              "transition-all duration-300 overflow-hidden",
              isSearchOpen ? "w-48 md:w-64" : "w-0"
            )}>
              <Input
                type="search"
                placeholder="Search news..."
                className="h-9 bg-muted"
                aria-label="Search news"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Toggle search"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-t border-border bg-background" aria-label="Main navigation">
        <div className="container">
          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center justify-center gap-1 h-12">
            <li>
              <Link
                to="/breaking"
                className="px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 rounded-md transition-all animate-breaking"
              >
                🔴 Breaking News
              </Link>
            </li>
            {mainCategories.map((category) => (
              <li key={category.slug}>
                <Link
                  to={`/${category.slug}`}
                  className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-all"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Mobile Navigation */}
          <div className={cn(
            "md:hidden overflow-hidden transition-all duration-300",
            isMenuOpen ? "max-h-96 py-4" : "max-h-0"
          )}>
            <ul className="flex flex-col gap-1">
              <li>
                <Link
                  to="/breaking"
                  className="block px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  🔴 Breaking News
                </Link>
              </li>
              {mainCategories.map((category) => (
                <li key={category.slug}>
                  <Link
                    to={`/${category.slug}`}
                    className="block px-3 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
};
