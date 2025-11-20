const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function downloadAssets() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    console.log('원본 사이트에서 에셋 정보 수집 중...');
    await page.goto('https://www.webinars.co.kr', { waitUntil: 'networkidle0' });

    // 모든 스타일시트 URL 수집
    const stylesheets = await page.evaluate(() => {
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        return Array.from(links).map(link => link.href);
    });

    // 모든 스크립트 URL 수집
    const scripts = await page.evaluate(() => {
        const scriptTags = document.querySelectorAll('script[src]');
        return Array.from(scriptTags).map(script => script.src);
    });

    // 인라인 스타일 수집
    const inlineStyles = await page.evaluate(() => {
        const styleTags = document.querySelectorAll('style');
        return Array.from(styleTags).map(style => style.innerHTML);
    });

    console.log(`발견된 스타일시트: ${stylesheets.length}개`);
    console.log(`발견된 스크립트: ${scripts.length}개`);
    console.log(`발견된 인라인 스타일: ${inlineStyles.length}개`);

    // CSS 다운로드
    const cssUrls = [];
    for (let i = 0; i < stylesheets.length; i++) {
        const url = stylesheets[i];
        try {
            const response = await axios.get(url);
            const filename = `style-${i}.css`;
            fs.writeFileSync(
                path.join(__dirname, 'public', 'css', filename),
                response.data
            );
            cssUrls.push(`/css/${filename}`);
            console.log(`✓ ${filename} 다운로드 완료`);
        } catch (error) {
            console.log(`✗ CSS 다운로드 실패: ${url}`);
        }
    }

    // 인라인 스타일 저장
    if (inlineStyles.length > 0) {
        const combinedStyles = inlineStyles.join('\n\n');
        fs.writeFileSync(
            path.join(__dirname, 'public', 'css', 'inline-styles.css'),
            combinedStyles
        );
        cssUrls.push('/css/inline-styles.css');
        console.log('✓ 인라인 스타일 저장 완료');
    }

    // JavaScript 다운로드 (WordPress 핵심 스크립트만)
    const jsUrls = [];
    const wpScripts = scripts.filter(url =>
        url.includes('wp-includes') || url.includes('wp-content/themes')
    );

    for (let i = 0; i < wpScripts.length; i++) {
        const url = wpScripts[i];
        try {
            const response = await axios.get(url);
            const filename = `script-${i}.js`;
            fs.writeFileSync(
                path.join(__dirname, 'public', 'js', filename),
                response.data
            );
            jsUrls.push(`/js/${filename}`);
            console.log(`✓ ${filename} 다운로드 완료`);
        } catch (error) {
            console.log(`✗ JS 다운로드 실패: ${url}`);
        }
    }

    // index.html 업데이트를 위한 정보 저장
    const assetInfo = {
        stylesheets: cssUrls,
        scripts: jsUrls,
        originalUrls: {
            css: stylesheets,
            js: scripts
        }
    };

    fs.writeFileSync(
        path.join(__dirname, 'public', 'asset-info.json'),
        JSON.stringify(assetInfo, null, 2)
    );

    console.log('\n에셋 다운로드 완료!');
    console.log('asset-info.json 파일이 생성되었습니다.');

    await browser.close();
}

downloadAssets().catch(console.error);