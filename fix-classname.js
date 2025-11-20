const fs = require('fs');
const path = require('path');

// 컴포넌트 파일들 읽기
const componentsDir = './archive/components';
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
    const filePath = path.join(componentsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // dangerouslySetInnerHTML 블록 찾기
    const dangerousHTMLRegex = /dangerouslySetInnerHTML=\{\{__html:\s*`([\s\S]*?)`\s*\}\}/g;
    
    content = content.replace(dangerousHTMLRegex, (match, htmlContent) => {
        // HTML 문자열 내의 className을 class로 변경
        let fixedHtml = htmlContent
            .replace(/className="/g, 'class="')
            .replace(/className='/g, "class='");
        
        return `dangerouslySetInnerHTML={{__html: \`${fixedHtml}\`}}`;
    });
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed className in: ${file}`);
});

console.log('All className attributes have been converted to class!');
