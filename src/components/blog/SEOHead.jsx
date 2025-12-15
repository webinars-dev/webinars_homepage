import { useEffect } from 'react';

/**
 * SEO 메타 태그 관리 컴포넌트
 * React 19에서는 document.head를 직접 조작하는 방식 사용
 *
 * @param {Object} props
 * @param {string} props.title - 페이지 제목
 * @param {string} props.description - 페이지 설명
 * @param {string} props.url - 페이지 URL
 * @param {string} props.image - OG 이미지 URL
 * @param {string} props.type - OG 타입 (default: 'article')
 * @param {Object} props.article - 아티클 메타데이터 (author, publishedTime, modifiedTime, tags)
 * @param {Object} props.jsonLd - JSON-LD 구조화 데이터
 */
export default function SEOHead({
  title,
  description,
  url,
  image,
  type = 'article',
  article = {},
  jsonLd,
}) {
  useEffect(() => {
    // 기존 태그들 저장 (복원용)
    const originalTitle = document.title;
    const originalMetas = {};
    const metaTags = [];
    const jsonLdScript = [];

    // 제목 설정
    if (title) {
      document.title = title;
    }

    // 메타 태그 설정 헬퍼
    const setMeta = (name, content, isProperty = false) => {
      if (!content) return;

      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`);

      if (meta) {
        originalMetas[name] = { attr, content: meta.getAttribute('content') };
        meta.setAttribute('content', content);
      } else {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
        metaTags.push(meta);
      }
    };

    // 기본 메타 태그
    setMeta('description', description);

    // Open Graph 태그
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:url', url, true);
    setMeta('og:type', type, true);
    if (image) {
      setMeta('og:image', image, true);
      setMeta('og:image:width', '1200', true);
      setMeta('og:image:height', '630', true);
    }
    setMeta('og:site_name', '웨비나스', true);
    setMeta('og:locale', 'ko_KR', true);

    // Twitter Card 태그
    setMeta('twitter:card', image ? 'summary_large_image' : 'summary');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    if (image) {
      setMeta('twitter:image', image);
    }

    // 아티클 메타 태그
    if (article.author) {
      setMeta('article:author', article.author, true);
    }
    if (article.publishedTime) {
      setMeta('article:published_time', article.publishedTime, true);
    }
    if (article.modifiedTime) {
      setMeta('article:modified_time', article.modifiedTime, true);
    }
    if (article.tags && article.tags.length > 0) {
      article.tags.forEach((tag) => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'article:tag');
        meta.setAttribute('content', tag);
        document.head.appendChild(meta);
        metaTags.push(meta);
      });
    }

    // JSON-LD 구조화 데이터
    if (jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
      jsonLdScript.push(script);
    }

    // Cleanup: 컴포넌트 언마운트 시 원래 상태로 복원
    return () => {
      document.title = originalTitle;

      // 추가한 태그 제거
      metaTags.forEach((tag) => {
        if (tag.parentNode) {
          tag.parentNode.removeChild(tag);
        }
      });

      jsonLdScript.forEach((script) => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });

      // 수정한 태그 복원
      Object.entries(originalMetas).forEach(([name, { attr, content }]) => {
        const meta = document.querySelector(`meta[${attr}="${name}"]`);
        if (meta && content) {
          meta.setAttribute('content', content);
        }
      });
    };
  }, [title, description, url, image, type, article, jsonLd]);

  return null;
}

/**
 * 블로그 포스트용 JSON-LD 생성 헬퍼
 */
export function createBlogPostingJsonLd({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  authorName,
  tags = [],
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: description,
    image: image,
    url: url,
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: '웨비나스',
      logo: {
        '@type': 'ImageObject',
        url: 'https://webinars.co.kr/wp-content/uploads/2024/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    keywords: tags.join(', '),
  };
}
