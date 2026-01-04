import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DBArticle } from '@/hooks/useArticles';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Eye, FileText, Calendar, Star, Clock } from 'lucide-react';
import { format, subDays, startOfDay, isWithinInterval } from 'date-fns';

interface AnalyticsDashboardProps {
  articles: DBArticle[];
}

const COLORS = ['hsl(220, 60%, 15%)', 'hsl(220, 60%, 35%)', 'hsl(220, 60%, 55%)', 'hsl(220, 60%, 75%)', 'hsl(220, 60%, 85%)'];

const AnalyticsDashboard = ({ articles }: AnalyticsDashboardProps) => {
  const analytics = useMemo(() => {
    const published = articles.filter(a => a.status === 'published');
    const totalViews = published.reduce((sum, a) => sum + (a.view_count || 0), 0);
    const avgReadTime = published.length > 0 
      ? Math.round(published.reduce((sum, a) => sum + (a.read_time || 0), 0) / published.length)
      : 0;
    
    // Top articles by views
    const topArticles = [...published]
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 5);

    // Articles by category
    const categoryStats: Record<string, number> = {};
    published.forEach(article => {
      const categoryName = article.category?.name || 'Uncategorized';
      categoryStats[categoryName] = (categoryStats[categoryName] || 0) + 1;
    });
    const categoryData = Object.entries(categoryStats).map(([name, value]) => ({ name, value }));

    // Articles published in last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayStart = startOfDay(date);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      
      const count = articles.filter(a => {
        if (!a.published_at) return false;
        const pubDate = new Date(a.published_at);
        return isWithinInterval(pubDate, { start: dayStart, end: dayEnd });
      }).length;

      return {
        date: format(date, 'EEE'),
        articles: count,
      };
    });

    // Views trend (simulated based on view_count distribution)
    const viewsTrend = last7Days.map((day, i) => ({
      date: day.date,
      views: Math.floor(totalViews * (0.1 + Math.random() * 0.2)),
    }));

    return {
      totalViews,
      avgReadTime,
      topArticles,
      categoryData,
      last7Days,
      viewsTrend,
      publishedCount: published.length,
      featuredCount: published.filter(a => a.is_featured).length,
      breakingCount: published.filter(a => a.is_breaking).length,
    };
  }, [articles]);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</p>
                <p className="text-muted-foreground text-sm">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.publishedCount}</p>
                <p className="text-muted-foreground text-sm">Published Articles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.featuredCount}</p>
                <p className="text-muted-foreground text-sm">Featured Articles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted rounded-full">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.avgReadTime} min</p>
                <p className="text-muted-foreground text-sm">Avg. Read Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Publishing Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Publishing Activity</CardTitle>
            <CardDescription>Articles published in the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.last7Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 90%)" />
                  <XAxis dataKey="date" stroke="hsl(220, 10%, 45%)" fontSize={12} />
                  <YAxis stroke="hsl(220, 10%, 45%)" fontSize={12} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(0, 0%, 100%)', 
                      border: '1px solid hsl(220, 14%, 90%)',
                      borderRadius: '0.375rem'
                    }} 
                  />
                  <Bar dataKey="articles" fill="hsl(220, 60%, 15%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Articles by Category</CardTitle>
            <CardDescription>Distribution of published articles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {analytics.categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {analytics.categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No published articles yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Articles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Performing Articles
          </CardTitle>
          <CardDescription>Articles with the highest view counts</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.topArticles.length > 0 ? (
            <div className="space-y-4">
              {analytics.topArticles.map((article, index) => (
                <div key={article.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{article.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {article.category?.name || 'Uncategorized'} • {article.read_time} min read
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span className="font-medium">{(article.view_count || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No published articles yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
