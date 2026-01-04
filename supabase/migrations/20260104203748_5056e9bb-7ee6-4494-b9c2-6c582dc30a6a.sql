-- Remove base64 images from existing articles (they cause statement timeouts)
UPDATE articles 
SET featured_image = NULL 
WHERE featured_image LIKE 'data:image%';

-- Add performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_articles_status_published_at 
ON articles(status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_created_at_desc 
ON articles(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_category_published 
ON articles(category_id, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_breaking_published 
ON articles(is_breaking, published_at DESC) 
WHERE is_breaking = true;