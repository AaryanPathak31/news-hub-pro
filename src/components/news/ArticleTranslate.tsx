import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Languages } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ArticleTranslateProps {
  content: string;
  title: string;
  onTranslated: (translatedContent: string, translatedTitle: string, language: string) => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা (Bengali)', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ் (Tamil)', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी (Marathi)', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)', flag: '🇮🇳' },
  { code: 'es', name: 'Español (Spanish)', flag: '🇪🇸' },
  { code: 'fr', name: 'Français (French)', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch (German)', flag: '🇩🇪' },
  { code: 'zh', name: '中文 (Chinese)', flag: '🇨🇳' },
  { code: 'ja', name: '日本語 (Japanese)', flag: '🇯🇵' },
  { code: 'ar', name: 'العربية (Arabic)', flag: '🇸🇦' },
  { code: 'ru', name: 'Русский (Russian)', flag: '🇷🇺' },
];

export const ArticleTranslate = ({ content, title, onTranslated }: ArticleTranslateProps) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');

  const handleTranslate = async () => {
    if (!selectedLanguage || selectedLanguage === currentLanguage) {
      return;
    }

    setIsTranslating(true);
    
    try {
      const lang = LANGUAGES.find(l => l.code === selectedLanguage);
      
      const { data, error } = await supabase.functions.invoke('translate-article', {
        body: {
          title,
          content,
          targetLanguage: selectedLanguage,
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }
      
      toast.success(`Article translated to ${lang?.name || selectedLanguage}`);
      setCurrentLanguage(selectedLanguage);
      onTranslated(data.translatedContent, data.translatedTitle, selectedLanguage);
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
      <Languages className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Translate:</span>
      <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
        <SelectTrigger className="w-[180px] h-8">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button 
        size="sm" 
        variant="outline"
        onClick={handleTranslate}
        disabled={isTranslating || !selectedLanguage || selectedLanguage === currentLanguage}
      >
        {isTranslating ? (
          <>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Translating...
          </>
        ) : (
          'Translate'
        )}
      </Button>
    </div>
  );
};
