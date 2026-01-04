import { Facebook, Twitter, Linkedin, Link2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ShareButtonsProps {
  url: string;
  title: string;
}

export const ShareButtons = ({ url, title }: ShareButtonsProps) => {
  const { toast } = useToast();
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      name: 'Facebook',
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      className: 'hover:bg-[#1877F2] hover:text-white',
    },
    {
      name: 'X (Twitter)',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      className: 'hover:bg-black hover:text-white',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
      className: 'hover:bg-[#0A66C2] hover:text-white',
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      className: 'hover:bg-[#25D366] hover:text-white',
    },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied!',
        description: 'The article link has been copied to your clipboard.',
      });
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground mr-2">Share:</span>
      {shareLinks.map((link) => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${link.name}`}
        >
          <Button
            variant="outline"
            size="icon"
            className={`h-8 w-8 transition-colors ${link.className}`}
          >
            <link.icon className="h-4 w-4" />
          </Button>
        </a>
      ))}
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={copyLink}
        aria-label="Copy link"
      >
        <Link2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
