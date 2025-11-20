const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// p-limit ES 모듈 동적 import
let pLimit;
let limit;

class ImprovedWebCrawler {
    constructor(baseUrl, outputDir) {
        this.baseUrl = baseUrl;
        this.outputDir = outputDir;
        this.visitedUrls = new Set();
        this.urlToFile = new Map();
        this.browser = null;
    }

    async init() {
        // p-limit 동적 import
        const pLimitModule = await import('p-limit');
        pLimit = pLimitModule.default;
        limit = pLimit(3);

        this.browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        // 디렉토리 생성
        await fs.mkdir(this.outputDir, { recursive: true });
        await fs.mkdir(path.join(this.outputDir, 'pages'), { recursive: true });
        await fs.mkdir(path.join(this.outputDir, 'components'), { recursive: true });
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    normalizeUrl(url) {
        try {
            const urlObj = new URL(url);

            // hash와 쿼리 파라미터 제거
            urlObj.hash = '';
            urlObj.search = '';

            // https://webinars.co.kr 또는 https://www.webinars.co.kr 도메인만 허용
            if (!urlObj.hostname.includes('webinars.co.kr')) {
                return null;
            }

            return urlObj.href;
        } catch (e) {
            return null;
        }
    }

    generateFileName(url) {
        const urlObj = new URL(url);
        let pathname = urlObj.pathname;

        // 홈페이지
        if (pathname === '/' || pathname === '') {
            return 'index';
        }

        // 경로를 파일명으로 변환
        pathname = pathname.replace(/^\//, '').replace(/\/$/, '');
        pathname = pathname.replace(/[^a-zA-Z0-9-_]/g, '_');

        // 너무 긴 파일명 처리
        if (pathname.length > 50) {
            const hash = crypto.createHash('md5').update(pathname).digest('hex').substring(0, 8);
            pathname = pathname.substring(0, 40) + '_' + hash;
        }

        return pathname || 'index';
    }

    async crawlPage(url) {
        const normalizedUrl = this.normalizeUrl(url);
        if (!normalizedUrl || this.visitedUrls.has(normalizedUrl)) {
            return [];
        }

        this.visitedUrls.add(normalizedUrl);
        console.log(`크롤링 중: ${normalizedUrl}`);

        const page = await this.browser.newPage();

        // User-Agent 설정
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        try {
            // 페이지 로드
            const response = await page.goto(normalizedUrl, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            if (!response || !response.ok()) {
                console.log(`페이지 로드 실패: ${normalizedUrl}`);
                await page.close();
                return [];
            }

            // 페이지 내용 가져오기
            const html = await page.content();
            const title = await page.title();

            // 파일명 생성
            const fileName = this.generateFileName(normalizedUrl);
            this.urlToFile.set(normalizedUrl, fileName);

            // HTML 저장
            const htmlPath = path.join(this.outputDir, 'pages', `${fileName}.html`);
            await fs.writeFile(htmlPath, html);

            // JSX로 변환
            const jsxContent = await this.convertToJSX(html, title, fileName);
            const jsxPath = path.join(this.outputDir, 'components', `${fileName}.jsx`);
            await fs.writeFile(jsxPath, jsxContent);

            // 페이지 내 모든 링크 수집
            const links = await page.evaluate(() => {
                const allLinks = Array.from(document.querySelectorAll('a[href]'))
                    .map(a => {
                        const href = a.href;
                        // 앵커 링크 제외
                        if (href.includes('#')) {
                            const [baseUrl] = href.split('#');
                            return baseUrl;
                        }
                        return href;
                    })
                    .filter(href => {
                        if (!href) return false;
                        // 외부 링크, 이메일, 전화번호 제외
                        if (href.startsWith('mailto:')) return false;
                        if (href.startsWith('tel:')) return false;
                        if (href.startsWith('javascript:')) return false;

                        try {
                            const url = new URL(href);
                            // webinars.co.kr 도메인만
                            return url.hostname.includes('webinars.co.kr');
                        } catch {
                            return false;
                        }
                    });

                // 중복 제거
                return [...new Set(allLinks)];
            });

            await page.close();

            console.log(`${normalizedUrl}에서 ${links.length}개의 링크 발견`);
            return links;

        } catch (error) {
            console.error(`에러 발생 (${normalizedUrl}):`, error.message);
            await page.close();
            return [];
        }
    }

    async convertToJSX(html, title, fileName) {
        const $ = cheerio.load(html);

        // 불필요한 요소 제거
        $('script').remove();
        $('noscript').remove();
        $('style').remove();
        $('link[rel="stylesheet"]').remove();
        $('meta').remove();

        // body 내용 추출
        let bodyContent = $('body').html() || '';

        // HTML 속성을 JSX 속성으로 변환
        bodyContent = bodyContent
            .replace(/class=/g, 'className=')
            .replace(/for=/g, 'htmlFor=')
            .replace(/tabindex=/g, 'tabIndex=')
            .replace(/onclick=/g, 'onClick=')
            .replace(/onchange=/g, 'onChange=')
            .replace(/onsubmit=/g, 'onSubmit=')
            .replace(/style="([^"]*)"/g, (match, p1) => {
                // 인라인 스타일을 객체로 변환
                const styleObj = p1.split(';')
                    .filter(s => s.trim())
                    .map(s => {
                        const [key, value] = s.split(':').map(x => x.trim());
                        const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
                        return `${camelKey}: "${value}"`;
                    })
                    .join(', ');
                return `style={{${styleObj}}}`;
            })
            .replace(/<img([^>]*)>/g, '<img$1 />')
            .replace(/<input([^>]*)>/g, '<input$1 />')
            .replace(/<br>/g, '<br />')
            .replace(/<hr>/g, '<hr />')
            .replace(/<!--[\s\S]*?-->/g, ''); // HTML 주석 제거

        // 컴포넌트 이름 생성
        const componentName = fileName
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');

        // JSX 컴포넌트 템플릿
        const jsxTemplate = `import React from 'react';

const ${componentName}Page = () => {
    return (
        <div className="page-container">
            <h1>${title}</h1>
            <div dangerouslySetInnerHTML={{__html: \`${bodyContent.replace(/`/g, '\\`')}\`}} />
        </div>
    );
};

export default ${componentName}Page;
`;

        return jsxTemplate;
    }

    async crawl() {
        console.log('크롤링 시작:', this.baseUrl);

        // 초기 URL 목록 - 주요 페이지들 명시적으로 추가
        const initialUrls = [
            this.baseUrl,
            'https://webinars.co.kr/about/',
            'https://webinars.co.kr/services2/',
            'https://webinars.co.kr/reference/',
            'https://webinars.co.kr/contact/',
            'https://webinars.co.kr/wp/contact/',
            'https://webinars.co.kr/wp/about/'
        ];

        const urlsToCrawl = [...initialUrls];
        const processedUrls = new Set();
        const maxPages = 50;

        while (urlsToCrawl.length > 0 && this.visitedUrls.size < maxPages) {
            // 배치 처리
            const batch = [];
            while (batch.length < 5 && urlsToCrawl.length > 0) {
                const url = urlsToCrawl.shift();
                const normalized = this.normalizeUrl(url);

                if (normalized && !processedUrls.has(normalized) && !this.visitedUrls.has(normalized)) {
                    processedUrls.add(normalized);
                    batch.push(normalized);
                }
            }

            if (batch.length === 0) {
                break;
            }

            // 병렬 크롤링
            const results = await Promise.all(
                batch.map(url =>
                    limit(() => this.crawlPage(url))
                )
            );

            // 새로운 URL 추가
            for (const links of results) {
                for (const link of links) {
                    const normalized = this.normalizeUrl(link);
                    if (normalized && !processedUrls.has(normalized) && !this.visitedUrls.has(normalized)) {
                        urlsToCrawl.push(normalized);
                        console.log(`큐에 추가: ${normalized}`);
                    }
                }
            }

            console.log(`진행상황: ${this.visitedUrls.size}개 페이지 처리 완료, ${urlsToCrawl.length}개 대기 중`);
        }

        // 인덱스 파일 생성
        await this.createIndexFile();

        console.log(`크롤링 완료! 총 ${this.visitedUrls.size}개 페이지 처리`);
    }

    async createIndexFile() {
        const pages = Array.from(this.urlToFile.entries()).map(([url, fileName]) => ({
            url,
            fileName,
            componentName: fileName
                .split(/[-_]/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join('')
        }));

        // 라우터 파일 생성
        const routerContent = `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

${pages.map(p => `import ${p.componentName}Page from './components/${p.fileName}.jsx';`).join('\n')}

const AppRouter = () => {
    return (
        <Router>
            <Routes>
${pages.map(p => {
    const urlPath = new URL(p.url).pathname || '/';
    return `                <Route path="${urlPath}" element={<${p.componentName}Page />} />`;
}).join('\n')}
            </Routes>
        </Router>
    );
};

export default AppRouter;
`;

        await fs.writeFile(path.join(this.outputDir, 'AppRouter.jsx'), routerContent);

        // 페이지 목록 JSON 생성
        await fs.writeFile(
            path.join(this.outputDir, 'pages.json'),
            JSON.stringify(pages, null, 2)
        );

        // 크롤링 요약 파일 생성
        const summary = `# 크롤링 요약

총 ${pages.length}개 페이지 크롤링 완료

## 페이지 목록:
${pages.map(p => `- ${p.url} → ${p.fileName}.jsx`).join('\n')}

## 생성된 파일:
- pages/ : HTML 원본 파일
- components/ : JSX 변환 파일
- AppRouter.jsx : React Router 설정
- pages.json : 페이지 메타데이터
`;

        await fs.writeFile(path.join(this.outputDir, 'SUMMARY.md'), summary);
    }
}

// 메인 실행 함수
async function main() {
    const crawler = new ImprovedWebCrawler(
        'https://webinars.co.kr',
        '/Users/jaeohpark/내 드라이브(Jaeoh.Park@webinars.co.kr)/Development/dev/webinars_home/webinars_v3/archive'
    );

    try {
        await crawler.init();
        await crawler.crawl();
    } catch (error) {
        console.error('크롤링 중 오류 발생:', error);
    } finally {
        await crawler.close();
    }
}

// 스크립트 실행
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { ImprovedWebCrawler };