const fs = require('fs').promises;
const path = require('path');

async function fixComponentNames() {
    const componentsDir = path.join(__dirname, 'archive', 'components');

    // 숫자로 시작하는 파일들 목록
    const problematicFiles = [
        '2023_offline_1201.jsx',
        '2024_offline_0705.jsx',
        '2024_offline_0904.jsx',
        '2024_offline_1028.jsx'
    ];

    for (const filename of problematicFiles) {
        const filePath = path.join(componentsDir, filename);

        try {
            // 파일 읽기
            let content = await fs.readFile(filePath, 'utf-8');

            // 컴포넌트 이름 변경 (숫자를 뒤로 이동)
            const oldComponentName = filename.replace('.jsx', '')
                .split(/[-_]/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join('');

            // 숫자로 시작하는 경우 처리
            const newComponentName = 'Offline' + oldComponentName.substring(0);

            // 내용 수정
            content = content.replace(
                new RegExp(`const ${oldComponentName}Page`, 'g'),
                `const ${newComponentName}Page`
            );
            content = content.replace(
                new RegExp(`export default ${oldComponentName}Page`, 'g'),
                `export default ${newComponentName}Page`
            );

            // 파일 저장
            await fs.writeFile(filePath, content);
            console.log(`수정됨: ${filename} - ${oldComponentName}Page → ${newComponentName}Page`);

        } catch (error) {
            console.error(`파일 처리 중 오류 (${filename}):`, error.message);
        }
    }

    console.log('컴포넌트 이름 수정 완료!');
}

// 스크립트 실행
fixComponentNames().catch(console.error);