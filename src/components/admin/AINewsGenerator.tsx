import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCategories } from "@/hooks/useArticles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, Newspaper, Zap, Clock } from "lucide-react";

export const AINewsGenerator = () => {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [articleCount, setArticleCount] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationLog, setGenerationLog] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!selectedCategory) {
      toast.error("Please select a category");
      return;
    }

    const category = categories?.find(c => c.id === selectedCategory);
    if (!category) {
      toast.error("Category not found");
      return;
    }

    setIsGenerating(true);
    setGenerationLog([`Starting AI news generation for ${category.name}...`]);

    try {
      setGenerationLog(prev => [...prev, "Fetching latest news from RSS feeds..."]);
      
      const { data, error } = await supabase.functions.invoke("auto-generate-news", {
        body: {
          categoryId: category.id,
          categoryName: category.name,
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
            ...data.articles.map((a: any) => `✓ Published: ${a.title}`)
          ]);
        }
      } else {
        setGenerationLog(prev => [...prev, `✗ ${data.message || "Generation failed"}`]);
        toast.error(data.message || "Failed to generate articles");
      }
    } catch (error: any) {
      console.error("Generation error:", error);
      setGenerationLog(prev => [...prev, `✗ Error: ${error.message}`]);
      toast.error(error.message || "Failed to generate articles");
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
    setGenerationLog(["Starting bulk AI news generation for all categories..."]);

    for (const category of categories) {
      try {
        setGenerationLog(prev => [...prev, `\nProcessing ${category.name}...`]);
        
        const { data, error } = await supabase.functions.invoke("auto-generate-news", {
          body: {
            categoryId: category.id,
            categoryName: category.name,
            count: 1,
          },
        });

        if (error) {
          setGenerationLog(prev => [...prev, `✗ ${category.name}: ${error.message}`]);
        } else if (data.success) {
          setGenerationLog(prev => [...prev, `✓ ${category.name}: ${data.message}`]);
        }

        // Delay between categories to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error: any) {
        setGenerationLog(prev => [...prev, `✗ ${category.name}: ${error.message}`]);
      }
    }

    setGenerationLog(prev => [...prev, "\n✓ Bulk generation complete!"]);
    toast.success("Bulk generation complete!");
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI News Generator
          </CardTitle>
          <CardDescription>
            Automatically fetch trending news, rewrite with AI to avoid plagiarism, 
            generate images, and publish to your site.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="count">Number of Articles</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={5}
                value={articleCount}
                onChange={(e) => setArticleCount(parseInt(e.target.value) || 1)}
                disabled={isGenerating}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedCategory}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Newspaper className="mr-2 h-4 w-4" />
                    Generate Articles
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={handleGenerateAll}
              disabled={isGenerating}
              className="flex-1"
            >
              <Zap className="mr-2 h-4 w-4" />
              Generate for All Categories (1 each)
            </Button>
          </div>
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
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl mb-2">📡</div>
              <div className="font-medium text-sm">1. Fetch News</div>
              <div className="text-xs text-muted-foreground">From RSS feeds (BBC, NYT, etc.)</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl mb-2">🤖</div>
              <div className="font-medium text-sm">2. AI Rewrite</div>
              <div className="text-xs text-muted-foreground">Original content, no plagiarism</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl mb-2">🖼️</div>
              <div className="font-medium text-sm">3. Generate Image</div>
              <div className="text-xs text-muted-foreground">AI-powered visuals</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl mb-2">🚀</div>
              <div className="font-medium text-sm">4. Auto-Publish</div>
              <div className="text-xs text-muted-foreground">Instantly live on site</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
