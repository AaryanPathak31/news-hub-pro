import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Linkedin, Youtube, Mail, Loader2 } from 'lucide-react';
import { CATEGORIES } from '@/types/news';
import { toast } from 'sonner';

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const mainCategories = CATEGORIES.filter(c => c.slug !== 'breaking');
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubscribing(true);
    
    try {
      const emailLower = email.toLowerCase().trim();
      
      // Store in localStorage
      const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
      if (subscribers.includes(emailLower)) {
        toast.info('You are already subscribed to our newsletter!');
      } else {
        subscribers.push(emailLower);
        localStorage.setItem('newsletter_subscribers', JSON.stringify(subscribers));
        toast.success('Thank you for subscribing! You will receive our daily newsletter every morning.');
        setEmail('');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className="bg-primary text-primary-foreground mt-16" role="contentinfo">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-block mb-4">
              <h2 className="text-2xl font-serif font-bold">
                NoName<span className="text-destructive">News</span>
              </h2>
            </Link>
            <p className="text-sm text-primary-foreground/80 mb-4">
              Your trusted source for breaking news, in-depth analysis, and comprehensive coverage of world events.
            </p>
            <div className="flex gap-3">
              <a href="https://facebook.com" aria-label="Facebook" className="hover:text-destructive transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" aria-label="Twitter" className="hover:text-destructive transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" aria-label="LinkedIn" className="hover:text-destructive transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://youtube.com" aria-label="YouTube" className="hover:text-destructive transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Categories</h3>
            <ul className="space-y-2 text-sm">
              {mainCategories.slice(0, 6).map((category) => (
                <li key={category.slug}>
                  <Link 
                    to={`/${category.slug}`} 
                    className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Contact</Link></li>
              <li><Link to="/advertise" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Advertise</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Daily Newsletter</h3>
            <p className="text-sm text-primary-foreground/80 mb-4">
              Get the latest news delivered to your inbox every morning at 7 AM.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="flex-1 px-3 py-2 text-sm rounded-md bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-destructive"
                aria-label="Email for newsletter"
                disabled={isSubscribing}
              />
              <button 
                type="submit" 
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50"
                aria-label="Subscribe to newsletter"
                disabled={isSubscribing}
              >
                {isSubscribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p className="text-primary-foreground/60">
            © {currentYear} NoNameNews. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">Terms of Service</Link>
            <Link to="/cookies" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
