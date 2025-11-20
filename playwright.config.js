// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './',
  testMatch: '*.spec.js',

  // 전체 테스트 타임아웃 설정
  timeout: 30 * 1000,

  // 병렬 실행 설정
  fullyParallel: true,

  // CI/CD 환경 설정
  forbidOnly: !!process.env.CI,

  // 재시도 횟수
  retries: process.env.CI ? 2 : 0,

  // 병렬 워커 수
  workers: process.env.CI ? 1 : undefined,

  // 리포터 설정
  reporter: 'html',

  // 공통 설정
  use: {
    // 기본 URL
    baseURL: 'http://localhost:3000',

    // 스크린샷
    screenshot: 'only-on-failure',

    // 비디오 녹화
    video: 'retain-on-failure',

    // 트레이스
    trace: 'on-first-retry',
  },

  // 프로젝트 설정
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 개발 서버 설정 (이미 실행 중이면 건너뜀)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
