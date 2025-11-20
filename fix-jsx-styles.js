const fs = require('fs');
const path = require('path');

// 컴포넌트 파일들 읽기
const componentsDir = './archive/components';
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
    const filePath = path.join(componentsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // dangerouslySetInnerHTML 내부의 JSX 스타일 객체를 문자열 형식으로 변환
    // {{opacity: "0"}} -> "opacity: 0"
    content = content.replace(/style=\{\{([^}]+)\}\}/g, (match, styleContent) => {
        // JSX 객체 스타일을 CSS 문자열로 변환
        const cssStyle = styleContent
            .replace(/(\w+):\s*"([^"]+)"/g, '$1: $2')
            .replace(/(\w+):\s*'([^']+)'/g, '$1: $2')
            .replace(/,\s*/g, '; ')
            .replace(/\{default:\s*"undefined"\}/g, '')
            .trim();
        
        return `style="${cssStyle}"`;
    });
    
    // data-header-button_style={{default: "undefined"}} 같은 경우 처리
    content = content.replace(/data-header-button_style=\{\{[^}]+\}\}/g, 'data-header-button_style=""');
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${file}`);
});

console.log('All JSX files have been fixed!');
