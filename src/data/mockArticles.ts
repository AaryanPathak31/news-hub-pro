import { Article } from '@/types/news';

export const mockArticles: Article[] = [
  {
    id: '1',
    slug: 'global-climate-summit-reaches-historic-agreement',
    title: 'Global Climate Summit Reaches Historic Agreement on Carbon Emissions',
    excerpt: 'World leaders have agreed to a landmark deal that commits nations to reduce carbon emissions by 50% by 2035, marking a turning point in the fight against climate change.',
    content: `<p>In a groundbreaking development at the Global Climate Summit, world leaders from over 190 countries have agreed to a historic deal that commits nations to reduce carbon emissions by 50% by 2035.</p>
    <p>The agreement, reached after two weeks of intense negotiations, represents the most ambitious climate action plan in history. Key provisions include:</p>
    <ul>
      <li>Mandatory emissions reduction targets for all major economies</li>
      <li>A $100 billion annual fund for developing nations</li>
      <li>Strict penalties for non-compliance</li>
      <li>Quarterly reporting requirements</li>
    </ul>
    <h2>A New Era for Climate Action</h2>
    <p>Climate scientists have welcomed the agreement, noting that it puts the world on track to limit global warming to 1.5 degrees Celsius above pre-industrial levels.</p>
    <blockquote>"This is the moment we've been working toward for decades. The world has finally united in the face of our greatest challenge." - Dr. Sarah Chen, Climate Research Institute</blockquote>
    <p>Implementation of the agreement will begin immediately, with nations required to submit detailed action plans within 90 days.</p>`,
    featuredImage: 'https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=1200&h=630&fit=crop',
    category: 'world',
    tags: ['climate', 'environment', 'global summit', 'carbon emissions'],
    author: { id: '1', name: 'Sarah Mitchell', role: 'Senior Correspondent' },
    publishedAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T14:45:00Z',
    readingTime: 5,
    isFeatured: true,
    views: 45230
  },
  {
    id: '2',
    slug: 'ai-breakthrough-medical-diagnosis',
    title: 'AI System Achieves 99% Accuracy in Early Cancer Detection',
    excerpt: 'A revolutionary artificial intelligence system developed by researchers can detect early-stage cancers with unprecedented accuracy, potentially saving millions of lives.',
    content: `<p>Scientists have unveiled an AI system capable of detecting early-stage cancers with 99% accuracy, a breakthrough that could revolutionize medical diagnostics worldwide.</p>
    <p>The system, developed by a team of international researchers, analyzes medical imaging data to identify cancerous cells at stages previously undetectable by human doctors.</p>
    <h2>How It Works</h2>
    <p>The AI uses advanced deep learning algorithms trained on millions of medical images, enabling it to spot patterns invisible to the human eye.</p>`,
    featuredImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=630&fit=crop',
    category: 'technology',
    tags: ['AI', 'healthcare', 'cancer research', 'medical technology'],
    author: { id: '2', name: 'James Chen', role: 'Technology Editor' },
    publishedAt: '2024-01-15T09:00:00Z',
    readingTime: 4,
    isBreaking: true,
    views: 78450
  },
  {
    id: '3',
    slug: 'stock-market-hits-record-high',
    title: 'Stock Markets Surge to All-Time Highs Amid Strong Economic Data',
    excerpt: 'Global stock markets have reached unprecedented levels as economic indicators show robust growth across major economies.',
    content: `<p>Stock markets around the world closed at record highs today, driven by stronger-than-expected economic data and growing optimism about corporate earnings.</p>
    <p>The S&P 500 gained 2.3%, while European and Asian markets also posted significant gains.</p>`,
    featuredImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=630&fit=crop',
    category: 'business',
    tags: ['stock market', 'economy', 'finance', 'investment'],
    author: { id: '3', name: 'Michael Brooks', role: 'Financial Correspondent' },
    publishedAt: '2024-01-15T08:15:00Z',
    readingTime: 3,
    views: 32100
  },
  {
    id: '4',
    slug: 'world-cup-final-preview',
    title: 'World Cup Final: Historic Showdown Set to Break Viewership Records',
    excerpt: 'The highly anticipated World Cup final between two powerhouse nations is expected to be the most-watched sporting event in history.',
    content: `<p>Football fans worldwide are preparing for what promises to be the most-watched sporting event in history as two titans of the sport prepare to battle for World Cup glory.</p>
    <p>Analysts predict viewership could exceed 1.5 billion, shattering all previous records.</p>`,
    featuredImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=630&fit=crop',
    category: 'sports',
    tags: ['world cup', 'football', 'sports', 'final'],
    author: { id: '4', name: 'David Torres', role: 'Sports Editor' },
    publishedAt: '2024-01-15T07:30:00Z',
    readingTime: 4,
    isFeatured: true,
    views: 89340
  },
  {
    id: '5',
    slug: 'political-reforms-pass-senate',
    title: 'Landmark Political Reforms Pass Senate in Historic Bipartisan Vote',
    excerpt: 'In a rare display of unity, senators from both parties have passed sweeping political reforms aimed at increasing transparency and reducing corruption.',
    content: `<p>The United States Senate has passed a comprehensive political reform package in a historic bipartisan vote, marking the most significant governance changes in decades.</p>
    <p>The legislation includes stricter campaign finance rules, enhanced lobbying disclosures, and new ethics requirements for elected officials.</p>`,
    featuredImage: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&h=630&fit=crop',
    category: 'politics',
    tags: ['politics', 'reform', 'senate', 'legislation'],
    author: { id: '5', name: 'Emily Watson', role: 'Political Correspondent' },
    publishedAt: '2024-01-15T06:45:00Z',
    readingTime: 6,
    views: 41200
  },
  {
    id: '6',
    slug: 'celebrity-film-breaks-box-office',
    title: 'New Blockbuster Shatters Opening Weekend Box Office Records',
    excerpt: 'The highly anticipated superhero film has exceeded all expectations, earning over $400 million globally in its opening weekend.',
    content: `<p>Hollywood's latest superhero epic has demolished box office records, earning an unprecedented $400 million in its opening weekend alone.</p>
    <p>The film's success marks a triumphant return for theatrical releases following years of streaming dominance.</p>`,
    featuredImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=630&fit=crop',
    category: 'entertainment',
    tags: ['movies', 'box office', 'entertainment', 'hollywood'],
    author: { id: '6', name: 'Lisa Park', role: 'Entertainment Reporter' },
    publishedAt: '2024-01-15T05:00:00Z',
    readingTime: 3,
    views: 56780
  },
  {
    id: '7',
    slug: 'new-treatment-alzheimers-approved',
    title: "FDA Approves Groundbreaking Alzheimer's Treatment",
    excerpt: "A new drug showing remarkable results in slowing Alzheimer's progression has received FDA approval, offering hope to millions of patients.",
    content: `<p>The FDA has granted approval to a revolutionary new treatment for Alzheimer's disease, marking a major breakthrough in the fight against the devastating condition.</p>
    <p>Clinical trials showed the drug slowed cognitive decline by up to 35% in early-stage patients.</p>`,
    featuredImage: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1200&h=630&fit=crop',
    category: 'health',
    tags: ['health', 'alzheimers', 'FDA', 'medical breakthrough'],
    author: { id: '7', name: 'Dr. Rachel Green', role: 'Health Editor' },
    publishedAt: '2024-01-15T04:30:00Z',
    readingTime: 5,
    isBreaking: true,
    views: 67890
  },
  {
    id: '8',
    slug: 'major-earthquake-response',
    title: 'International Aid Pours In After Devastating 7.8 Magnitude Earthquake',
    excerpt: 'Countries worldwide are mobilizing emergency response teams following a catastrophic earthquake that has left thousands in need of assistance.',
    content: `<p>Emergency response teams from around the globe are rushing to provide aid following a devastating 7.8 magnitude earthquake that struck early this morning.</p>
    <p>Search and rescue operations are underway as the international community pledges billions in humanitarian assistance.</p>`,
    featuredImage: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=1200&h=630&fit=crop',
    category: 'breaking',
    tags: ['earthquake', 'emergency', 'humanitarian aid', 'disaster response'],
    author: { id: '8', name: 'Tom Anderson', role: 'Breaking News Editor' },
    publishedAt: '2024-01-15T03:00:00Z',
    readingTime: 4,
    isBreaking: true,
    views: 123450
  },
  {
    id: '9',
    slug: 'tech-giant-antitrust-ruling',
    title: 'Court Rules Against Tech Giant in Landmark Antitrust Case',
    excerpt: 'A federal court has delivered a major blow to one of the largest technology companies, finding it violated antitrust laws.',
    content: `<p>In a ruling that could reshape the technology industry, a federal court has found a major tech company guilty of antitrust violations.</p>
    <p>The decision could lead to significant changes in how tech giants operate and compete.</p>`,
    featuredImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=630&fit=crop',
    category: 'technology',
    tags: ['technology', 'antitrust', 'legal', 'big tech'],
    author: { id: '2', name: 'James Chen', role: 'Technology Editor' },
    publishedAt: '2024-01-14T22:00:00Z',
    readingTime: 6,
    views: 45670
  },
  {
    id: '10',
    slug: 'olympic-records-shattered',
    title: 'Athletes Shatter Multiple World Records at Winter Olympics',
    excerpt: 'The Winter Olympics have produced an unprecedented number of world records as athletes push the limits of human performance.',
    content: `<p>The Winter Olympics continue to deliver extraordinary performances as athletes from around the world shatter long-standing records.</p>
    <p>Sports scientists attribute the record-breaking performances to advances in training technology and equipment.</p>`,
    featuredImage: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&h=630&fit=crop',
    category: 'sports',
    tags: ['olympics', 'sports', 'world records', 'winter olympics'],
    author: { id: '4', name: 'David Torres', role: 'Sports Editor' },
    publishedAt: '2024-01-14T20:30:00Z',
    readingTime: 4,
    views: 78900
  },
  {
    id: '11',
    slug: 'central-bank-interest-rate-decision',
    title: 'Central Bank Holds Rates Steady, Signals Future Cuts',
    excerpt: 'The Federal Reserve has maintained interest rates but indicated that cuts could come later this year as inflation shows signs of cooling.',
    content: `<p>The Federal Reserve has voted to hold interest rates steady at their current level, while signaling that rate cuts could be on the horizon.</p>
    <p>Markets responded positively to the news, with stocks rallying on expectations of easier monetary policy ahead.</p>`,
    featuredImage: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1200&h=630&fit=crop',
    category: 'business',
    tags: ['federal reserve', 'interest rates', 'economy', 'monetary policy'],
    author: { id: '3', name: 'Michael Brooks', role: 'Financial Correspondent' },
    publishedAt: '2024-01-14T18:00:00Z',
    readingTime: 5,
    views: 34560
  },
  {
    id: '12',
    slug: 'mental-health-awareness-initiative',
    title: 'Global Mental Health Initiative Launches in 50 Countries',
    excerpt: 'A new international effort aims to improve mental health services and reduce stigma around mental illness worldwide.',
    content: `<p>Health ministers from 50 countries have launched a coordinated global initiative to improve mental health services and combat the stigma surrounding mental illness.</p>
    <p>The program includes funding for community mental health centers and training for healthcare workers.</p>`,
    featuredImage: 'https://images.unsplash.com/photo-1493836512294-502baa1986e2?w=1200&h=630&fit=crop',
    category: 'health',
    tags: ['mental health', 'global health', 'healthcare', 'wellness'],
    author: { id: '7', name: 'Dr. Rachel Green', role: 'Health Editor' },
    publishedAt: '2024-01-14T16:00:00Z',
    readingTime: 4,
    views: 23450
  }
];

export const getBreakingNews = (): Article[] => {
  return mockArticles.filter(a => a.isBreaking);
};

export const getFeaturedArticles = (): Article[] => {
  return mockArticles.filter(a => a.isFeatured);
};

export const getTrendingArticles = (limit = 5): Article[] => {
  return [...mockArticles]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, limit);
};

export const getLatestArticles = (limit = 10): Article[] => {
  return [...mockArticles]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
};

export const getArticlesByCategory = (category: string, limit?: number): Article[] => {
  const articles = mockArticles.filter(a => a.category === category);
  return limit ? articles.slice(0, limit) : articles;
};

export const getArticleBySlug = (slug: string): Article | undefined => {
  return mockArticles.find(a => a.slug === slug);
};

export const getRelatedArticles = (article: Article, limit = 4): Article[] => {
  return mockArticles
    .filter(a => a.id !== article.id && (a.category === article.category || a.tags.some(tag => article.tags.includes(tag))))
    .slice(0, limit);
};
