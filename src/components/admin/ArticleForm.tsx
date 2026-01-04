import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichTextEditor } from './RichTextEditor';
import { useCategories, useCreateArticle, useUpdateArticle, useUploadImage, DBArticle } from '@/hooks/useArticles';
import { useAuth } from '@/hooks/useAuth';
import { Upload, X, Eye, Save, Send } from 'lucide-react';

interface ArticleFormProps {
  article?: DBArticle;
  mode: 'create' | 'edit';
}

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export const ArticleForm = ({ article, mode }: ArticleFormProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: categories } = useCategories();
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();
  const uploadImage = useUploadImage();

  const [title, setTitle] = useState(article?.title || '');
  const [slug, setSlug] = useState(article?.slug || '');
  const [excerpt, setExcerpt] = useState(article?.excerpt || '');
  const [content, setContent] = useState(article?.content || '');
  const [featuredImage, setFeaturedImage] = useState(article?.featured_image || '');
  const [categoryId, setCategoryId] = useState(article?.category_id || '');
  const [tags, setTags] = useState(article?.tags?.join(', ') || '');
  const [readTime, setReadTime] = useState(article?.read_time || 5);
  const [isBreaking, setIsBreaking] = useState(article?.is_breaking || false);
  const [isFeatured, setIsFeatured] = useState(article?.is_featured || false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (mode === 'create' && title && !article) {
      setSlug(generateSlug(title));
    }
  }, [title, mode, article]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImage.mutateAsync(file);
      setFeaturedImage(url);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    const articleData = {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      featured_image: featuredImage || null,
      category_id: categoryId || null,
      author_id: user?.id,
      status,
      is_breaking: isBreaking,
      is_featured: isFeatured,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      read_time: readTime,
      published_at: status === 'published' ? new Date().toISOString() : null,
    };

    if (mode === 'edit' && article) {
      await updateArticle.mutateAsync({ id: article.id, ...articleData });
    } else {
      await createArticle.mutateAsync(articleData);
    }

    navigate('/admin');
  };

  const isSubmitting = createArticle.isPending || updateArticle.isPending;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Article Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter article title"
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="article-url-slug"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary of the article (shown in previews)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Content *</Label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Write your article content here..."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Publish Options */}
        <Card>
          <CardHeader>
            <CardTitle>Publish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={() => handleSubmit('draft')}
                variant="outline"
                className="flex-1"
                disabled={isSubmitting || !title || !content}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={() => handleSubmit('published')}
                className="flex-1"
                disabled={isSubmitting || !title || !content}
              >
                <Send className="h-4 w-4 mr-2" />
                Publish
              </Button>
            </div>
            
            {article && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => window.open(`/${article.category?.slug}/${article.slug}`, '_blank')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Article
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Featured Image */}
        <Card>
          <CardHeader>
            <CardTitle>Featured Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {featuredImage ? (
              <div className="relative">
                <img
                  src={featuredImage}
                  alt="Featured"
                  className="w-full aspect-video object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => setFeaturedImage('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  {isUploading ? 'Uploading...' : 'Click to upload image'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              </label>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="image-url">Or paste image URL</Label>
              <Input
                id="image-url"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Category & Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tag1, tag2, tag3"
              />
              <p className="text-xs text-muted-foreground">Separate tags with commas</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="read-time">Read Time (minutes)</Label>
              <Input
                id="read-time"
                type="number"
                value={readTime}
                onChange={(e) => setReadTime(parseInt(e.target.value) || 5)}
                min={1}
              />
            </div>
          </CardContent>
        </Card>

        {/* Article Options */}
        <Card>
          <CardHeader>
            <CardTitle>Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="breaking">Breaking News</Label>
              <Switch
                id="breaking"
                checked={isBreaking}
                onCheckedChange={setIsBreaking}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="featured">Featured Article</Label>
              <Switch
                id="featured"
                checked={isFeatured}
                onCheckedChange={setIsFeatured}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
