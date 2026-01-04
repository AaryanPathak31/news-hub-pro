import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useCategories } from "@/hooks/useArticles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, Newspaper, Zap, Clock, Settings, Timer, AlertCircle } from "lucide-react";

export const AINewsGenerator = () => {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [articleCount, setArticleCount] = useState<number>(2);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationLog, setGenerationLog] = useState<string[]>([]);
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(20);
  const [autoTimer, setAutoTimer] = useState<NodeJS.Timeout | null>(null);
  const [nextRunTime, setNextRunTime] = useState<Date | null>(null);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const selectAllCategories = () => {
    if (categories) {
      setSelectedCategories(categories.map(c => c.id));
    }
  };

  const clearAllCategories = () => {
    setSelectedCategories([]);
  };

  const handleGenerate = async () => {
    if (selectedCategories.length === 0) {
      toast.error("Please select at least one category");
      return;
    }

    const selectedCats = categories?.filter(c => selectedCategories.includes(c.id)) || [];
    
    setIsGenerating(true);
    setGenerationLog([`🚀 Starting AI news generation for ${selectedCats.map(c => c.name).join(', ')}...`]);
    setGenerationLog(prev => [...prev, `📰 Generating ${articleCount} article(s) per category as BREAKING NEWS`]);

    try {
      setGenerationLog(prev => [...prev, "📡 Fetching latest news from RSS feeds (with Indian news focus)..."]);
      
      const { data, error } = await supabase.functions.invoke("auto-generate-news", {
        body: {
          categoryIds: selectedCategories,
          categoryNames: selectedCats.map(c => c.name),
          count: articleCount,
        },
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setGenerationLog(prev => [...prev, `✓ ${data.message}`]);
        toast.success(data.message);
        
        if (data.articles?.length > 0) {
          setGenerationLog(prev => [
            ...prev, 
            ...data.articles.map((a: { title: string }) => `✓ 🔴 BREAKING: ${a.title}`)
          ]);
        }
      } else {
        setGenerationLog(prev => [...prev, `✗ ${data.message || "Generation failed"}`]);
        toast.error(data.message || "Failed to generate articles");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Generation error:", error);
      setGenerationLog(prev => [...prev, `✗ Error: ${errorMessage}`]);
      toast.error(errorMessage || "Failed to generate articles");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!categories || categories.length === 0) {
      toast.error("No categories available");
      return;
    }

    setIsGenerating(true);
    setGenerationLog([`🚀 Starting automated news generation for ALL categories...`]);
    setGenerationLog(prev => [...prev, `📰 ${articleCount} articles per category as BREAKING NEWS`]);
    setGenerationLog(prev => [...prev, `🇮🇳 Prioritizing Indian news sources`]);

    for (const category of categories) {
      try {
        setGenerationLog(prev => [...prev, `\n📁 Processing ${category.name}...`]);
        
        const { data, error } = await supabase.functions.invoke("auto-generate-news", {
          body: {
            categoryIds: [category.id],
            categoryNames: [category.name],
            count: articleCount,
          },
        });

        if (error) {
          setGenerationLog(prev => [...prev, `✗ ${category.name}: ${error.message}`]);
        } else if (data.success) {
          setGenerationLog(prev => [...prev, `✓ ${category.name}: ${data.message}`]);
          if (data.articles?.length > 0) {
            data.articles.forEach((a: { title: string }) => {
              setGenerationLog(prev => [...prev, `  🔴 ${a.title}`]);
            });
          }
        }

        // Delay between categories to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setGenerationLog(prev => [...prev, `✗ ${category.name}: ${errorMessage}`]);
      }
    }

    setGenerationLog(prev => [...prev, "\n✓ Automated generation complete! All articles published as BREAKING NEWS."]);
    toast.success("Automated generation complete!");
    setIsGenerating(false);
  };

  // Auto-generation timer
  useEffect(() => {
    if (autoEnabled && !autoTimer) {
      const runAutoGeneration = async () => {
        console.log("Running scheduled auto-generation...");
        await handleGenerateAll();
        setNextRunTime(new Date(Date.now() + intervalMinutes * 60 * 1000));
      };

      // Set next run time
      setNextRunTime(new Date(Date.now() + intervalMinutes * 60 * 1000));
      
      const timer = setInterval(runAutoGeneration, intervalMinutes * 60 * 1000);
      setAutoTimer(timer);
      
      toast.success(`Auto-generation enabled! Next run in ${intervalMinutes} minutes`);
    } else if (!autoEnabled && autoTimer) {
      clearInterval(autoTimer);
      setAutoTimer(null);
      setNextRunTime(null);
      toast.info("Auto-generation disabled");
    }

    return () => {
      if (autoTimer) {
        clearInterval(autoTimer);
      }
    };
  }, [autoEnabled, intervalMinutes]);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI News Generator
          </CardTitle>
          <CardDescription>
            Automatically fetch trending news (with Indian focus), rewrite with AI for SEO optimization, 
            generate unique images, and publish as Breaking News.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Breaking News Info */}
          <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">All Generated Articles = Breaking News</p>
              <p className="text-sm text-muted-foreground">
                New articles are automatically marked as Breaking News. After 20 minutes, they get demoted 
                when newer articles are published, creating an auto-ranking system.
              </p>
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Categories</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllCategories}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={clearAllCategories}>
                  Clear
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories?.map((category) => (
                <div
                  key={category.id}
                  className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedCategories.includes(category.id)
                      ? "bg-primary/10 border-primary"
                      : "bg-card hover:bg-accent"
                  }`}
                  onClick={() => toggleCategory(category.id)}
                >
                  <Checkbox 
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => toggleCategory(category.id)}
                  />
                  <label className="text-sm font-medium cursor-pointer">
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="count">Articles per Category</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={5}
                value={articleCount}
                onChange={(e) => setArticleCount(parseInt(e.target.value) || 2)}
                disabled={isGenerating}
              />
              <p className="text-xs text-muted-foreground">Recommended: 2 articles per category</p>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || selectedCategories.length === 0}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Newspaper className="mr-2 h-4 w-4" />
                    Generate Breaking News
                  </>
                )}
              </Button>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={handleGenerateAll}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            <Zap className="mr-2 h-4 w-4" />
            Generate for All Categories ({articleCount} each)
          </Button>
        </CardContent>
      </Card>

      {/* Auto-Generation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5" />
            Automated Scheduling
          </CardTitle>
          <CardDescription>
            Enable automatic news generation at regular intervals. Articles older than 20 minutes 
            are automatically demoted from Breaking News when new articles are published.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-generate Breaking News</Label>
              <p className="text-sm text-muted-foreground">
                Automatically generate {articleCount} article(s) per category at set intervals
              </p>
            </div>
            <Switch
              checked={autoEnabled}
              onCheckedChange={setAutoEnabled}
              disabled={isGenerating}
            />
          </div>

          {autoEnabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="interval">Interval (minutes)</Label>
                <Input
                  id="interval"
                  type="number"
                  min={10}
                  max={1440}
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(parseInt(e.target.value) || 20)}
                  disabled={isGenerating}
                />
                <p className="text-xs text-muted-foreground">
                  Default: 20 minutes. Breaking news older than this will be auto-demoted.
                </p>
              </div>

              {nextRunTime && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-primary">
                  <Timer className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Next run: {nextRunTime.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Generation Log */}
      {generationLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              Generation Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm max-h-64 overflow-y-auto">
              {generationLog.map((log, index) => (
                <div 
                  key={index} 
                  className={`${
                    log.startsWith("✓") ? "text-green-600 dark:text-green-400" : 
                    log.startsWith("✗") ? "text-red-600 dark:text-red-400" : 
                    log.includes("🔴") ? "text-destructive font-medium" :
                    "text-muted-foreground"
                  }`}
                >
                  {log}
                </div>
              ))}
              {isGenerating && (
                <div className="flex items-center gap-2 text-muted-foreground mt-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Processing...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-transparent rounded-lg border">
              <div className="text-2xl mb-2">🇮🇳</div>
              <div className="font-medium text-sm">1. Fetch News</div>
              <div className="text-xs text-muted-foreground">Indian + Global sources</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-transparent rounded-lg border">
              <div className="text-2xl mb-2">🤖</div>
              <div className="font-medium text-sm">2. AI Rewrite</div>
              <div className="text-xs text-muted-foreground">SEO optimized content</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-transparent rounded-lg border">
              <div className="text-2xl mb-2">🖼️</div>
              <div className="font-medium text-sm">3. Generate Image</div>
              <div className="text-xs text-muted-foreground">AI-powered visuals</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-destructive/10 to-transparent rounded-lg border border-destructive/20">
              <div className="text-2xl mb-2">🔴</div>
              <div className="font-medium text-sm">4. Breaking News</div>
              <div className="text-xs text-muted-foreground">Auto-published live</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-transparent rounded-lg border">
              <div className="text-2xl mb-2">⏰</div>
              <div className="font-medium text-sm">5. Auto-Rank</div>
              <div className="text-xs text-muted-foreground">Demote after 20 min</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
