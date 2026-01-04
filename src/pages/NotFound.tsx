import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <div className="container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="font-serif text-8xl font-bold text-muted-foreground/30 mb-4">404</h1>
        <h2 className="font-serif text-3xl font-bold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved. 
          Try searching or return to the homepage.
        </p>
        <div className="flex gap-4">
          <Button asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/search">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
