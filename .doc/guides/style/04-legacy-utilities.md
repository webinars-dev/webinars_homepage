# 4. 레거시 유틸리티 클래스

`public/css/inline-styles.css`에 정의된 레거시 유틸리티 클래스 목록입니다.  
레거시 페이지(`archive/components/`)에서만 사용하며, 신규 컴포넌트에서는 사용하지 않습니다.

---

## 폰트 패밀리

```css
.en   { font-family: 'hyphen' !important; }
.noto { font-family: 'Noto Sans KR' !important; }
```

---

## 텍스트 크기 (`.txt*`)

| 클래스 | font-size |
|--------|-----------|
| `.txt12` | 12px |
| `.txt13` | 13px |
| `.txt14` | 14px |
| `.txt15` | 15px |
| `.txt16` | 16px |
| `.txt17` | 17px |
| `.txt18` | 18px |
| `.txt19` | 19px |
| `.txt20` | 20px |
| `.txt22` | 22px |
| `.txt24` | 24px |
| `.txt25` | 25px |
| `.txt26` | 26px |
| `.txt28` | 28px |
| `.txt30` | 30px |
| `.txt32` | 32px |
| `.txt36` | 36px |
| `.txt38` | 38px (letter-spacing: -0.08em) |
| `.txt40` | 40px |
| `.txt45` | 40px (주의: 실제값 40px) |
| `.txt48` | 48px |
| `.txt50` | 50px |
| `.txt55` | 55px |
| `.txt58` | 58px |
| `.txt60` | 50px (주의: 실제값 50px) |

> ⚠️ `.txt45`와 `.txt60`은 클래스명과 실제 font-size가 다릅니다.

---

## 줄 높이 (`.line*`)

| 클래스 | line-height |
|--------|-------------|
| `.line13` | 1.3em |
| `.line14` | 1.4em |
| `.line15` | 1.5em |
| `.line16` | 1.6em |
| `.line27` | 27px |

---

## 폰트 웨이트

```css
.w700 { font-weight: 700 !important; }
.w400 { font-weight: 400 !important; }
.b    { font-weight: 900 !important; }
```

---

## 마진 유틸리티 (`.mt*`)

| 클래스 | margin-top |
|--------|------------|
| `.mt10` | 10px |
| `.mt15` | 15px |
| `.mt20` | 20px |
| `.mt30` | 30px |
| `.mt40` | 40px |
| `.mt50` | 50px |

---

## 텍스트 컬러

```css
.wh  { color: #fff; }       /* 화이트 */
```

---

## 텍스트 변환 / 정렬

```css
.upp      { text-transform: uppercase; }
.txtleft  { text-align: left; }
```

---

## 레이아웃 유틸리티

```css
.fl   { display: inline-block; }
.m_no { display: block !important; }   /* 모바일에서 숨김 */
.pc_no{ display: none !important; }    /* PC에서 숨김 */
```

> 반응형: `@media (max-width: 789px)`에서 `.m_no`와 `.pc_no` 값이 반전됩니다.

---

## 링크 스타일

```css
.wh a { color: #fff !important; }
.underline { display: initial; border-bottom: 5px solid #fff; }
```

---

## 레퍼런스 모달 유틸리티 (`.re_*`, `.txt*`)

`reference2.css`에도 동일한 클래스가 재정의되어 있습니다.

```css
.re_1 { /* 좌측 바가 있는 구분선 라인 */ }
.re_2 { /* 들여쓰기 리스트 영역 */ }
.txt36 { font-size: 36px; } /* 모달 타이틀용 */
.txt18 { font-size: 18px; } /* 모달 본문용 */
```

---

## 레터 스페이싱

```css
.le0  { letter-spacing: 0em !important; }
.le02 { letter-spacing: 0.02em !important; }
```

---

## 너비 고정 유틸리티 (레거시)

```css
.width1180  { width: 1180px !important; margin: 0 auto !important; }
.width1180_2{ width: 1200px !important; margin: 0 auto !important; }
```

> 반응형: `@media (max-width: 789px)`에서 `width: 100%`로 오버라이드됩니다.
