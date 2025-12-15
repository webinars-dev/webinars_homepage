import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import './BlogCard.css';

export default function BlogCard({ post }) {
  const {
    slug,
    title,
    excerpt,
    featured_image,
    published_at,
    author,
    category,
    tags = []
  } = post;

  const formattedDate = published_at
    ? format(new Date(published_at), 'yyyy년 M월 d일', { locale: ko })
    : '';

  const placeholderImage = '/wp-content/uploads/2024/placeholder-blog.jpg';

  return (
    <article className="blog-card">
      <Link to={`/blog/${slug}`} className="blog-card-image-link">
        <div className="blog-card-image">
          <img
            src={featured_image || placeholderImage}
            alt={title}
            loading="lazy"
            onError={(e) => {
              e.target.src = placeholderImage;
            }}
          />
        </div>
      </Link>

      <div className="blog-card-content">
        {category && (
          <Link
            to={`/blog/category/${category.slug}`}
            className="blog-card-category"
          >
            {category.name}
          </Link>
        )}

        <h2 className="blog-card-title">
          <Link to={`/blog/${slug}`}>{title}</Link>
        </h2>

        <p className="blog-card-excerpt">{excerpt}</p>

        <div className="blog-card-meta">
          {author && (
            <span className="blog-card-author">
              {author.avatar_url && (
                <img
                  src={author.avatar_url}
                  alt={author.name}
                  className="blog-card-author-avatar"
                />
              )}
              {author.name}
            </span>
          )}
          <span className="blog-card-date">{formattedDate}</span>
        </div>

        {tags.length > 0 && (
          <div className="blog-card-tags">
            {tags.slice(0, 3).map((tag) => (
              <Link
                key={tag.id}
                to={`/blog/tag/${tag.slug}`}
                className="blog-card-tag"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
