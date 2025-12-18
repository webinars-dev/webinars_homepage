# Salesforce Lead Integration PRD

## 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | Contact Form → Salesforce Lead 연동 |
| 목적 | 웹사이트 문의 폼 제출 시 Salesforce에 Lead 자동 생성 |
| 대상 페이지 | `/contact/` (http://localhost:3000/contact/) |
| 연동 대상 | Salesforce CRM - Lead Object |
| Salesforce 인스턴스 | `webinars2012.lightning.force.com` |
| 상태 | 기획 → **Salesforce 설정 완료** |
| Organization ID | `00D900000010dAi` |
| Project_Type__c 필드 ID | `00NTJ00000JV6e7` |
| reCAPTCHA Site Key | `6LefX-EUAAAAAAVEujkJZwYtf8nEDLdSNLE0_gYy` |

---

## 현재 Contact Form 구조

### 폼 필드 분석

| 필드명 | 필드 타입 | 필수여부 | 현재 name 속성 | 설명 |
|--------|----------|----------|----------------|------|
| 프로젝트 유형 | Radio | 필수 | `quform_1_4` | 5개 옵션 (아래 참조) |
| 성함 | Text | 필수 | `quform_1_9` | 담당자 이름 |
| 소속 | Text | 필수 | `quform_1_5` | 회사/기관명 |
| 이메일 | Text | 필수 | `quform_1_12` | 이메일 주소 |
| 연락처 | Text | 필수 | `quform_1_14` | 전화번호 |
| 문의사항 | Textarea | 필수 | `quform_1_15` | 상세 문의 내용 |

### 프로젝트 유형 옵션

| 현재 폼 값 (원본) | Salesforce 저장 값 (정규화) | 표시 텍스트 |
|-------------------|---------------------------|-------------|
| `Webinar/ Streaming` | `Webinar/Streaming` | WEBINAR/ STREAMING |
| `Hybrid` | `Hybrid` | HYBRID |
| `Platform` | `Platform` | PLATFORM |
| `Solution` | `Solution` | SOLUTION |
| `기타` | `기타` | 기타 |

> ⚠️ **값 정규화 필요**: 현재 폼의 `Webinar/ Streaming` 값(슬래시 뒤 공백)과 Salesforce Picklist 값 `Webinar/Streaming`(공백 없음)이 불일치합니다. 제출 전 값을 정규화하거나 Salesforce Picklist 값을 폼과 동일하게 설정해야 합니다.

### 문의사항 기본 안내문
```
문의 시, 아래 주요 내용 전달 시 정확하고 빠른 상담 가능 합니다.
-행사 예정일
-행사 지역
-행사 참가 대상
-예상 참가자 인원 수(오프라인/온라인)
```

---

## Salesforce Lead 필드 매핑

### 표준 필드 매핑

| Contact Form 필드 | Salesforce Lead 필드 | API Name | 필드 타입 | 비고 |
|-------------------|---------------------|----------|-----------|------|
| 성함 | Last Name | `LastName` | Text(80) | 필수, 성/이름 분리 없이 전체 사용 |
| 소속 | Company | `Company` | Text(255) | 필수 |
| 이메일 | Email | `Email` | Email | |
| 연락처 | Phone | `Phone` | Phone | |
| 문의사항 | Description | `Description` | Text Area(Long) | |

### 커스텀 필드 (생성 필요)

| Contact Form 필드 | Salesforce Lead 필드 | API Name | 필드 타입 | Picklist 값 |
|-------------------|---------------------|----------|-----------|-------------|
| 프로젝트 유형 | Project Type | `Project_Type__c` | Picklist | Webinar/Streaming, Hybrid, Platform, Solution, 기타 |

### 자동 설정 필드

| Salesforce Lead 필드 | API Name | Web-to-Lead 파라미터 | 값 | 비고 |
|---------------------|----------|---------------------|-----|------|
| Lead Source | `LeadSource` | `lead_source` | `Web` | Hidden 필드로 수동 추가 필요 |
| Status | `Status` | _(설정 불가)_ | Org 기본값 | Web-to-Lead에서 직접 지정 불가, 아래 참고 |
| Lead Record Type | `RecordTypeId` | `recordType` | (ID 확인 필요) | Hidden 필드로 수동 추가 필요 |

> ⚠️ **Lead Status 주의**: Web-to-Lead는 Status 필드를 직접 지정할 수 없습니다. 생성되는 Lead의 Status는 **Org의 기본 Lead Status** 값을 따릅니다.
>
> **기본값을 `New`로 변경하려면**: Setup → Object Manager → Lead → Fields & Relationships → Status → 값 목록에서 `New` 옆의 체크박스를 "Default"로 선택 → Save

---

## 기술 구현 방안

### Option 1: Salesforce Web-to-Lead (권장 - MVP)

**장점**:
- 별도 백엔드 불필요
- Salesforce 기본 제공 기능
- 빠른 구현 가능

**단점**:
- 성공/실패 피드백 제한적
- 커스텀 검증 로직 제한

**구현 방법 (실제 값 적용)**:
```html
<!-- reCAPTCHA 스크립트 -->
<script src="https://www.google.com/recaptcha/api.js"></script>
<script>
function timestamp() {
  var response = document.getElementById("g-recaptcha-response");
  if (response == null || response.value.trim() == "") {
    var elems = JSON.parse(document.getElementsByName("captcha_settings")[0].value);
    elems["ts"] = JSON.stringify(new Date().getTime());
    document.getElementsByName("captcha_settings")[0].value = JSON.stringify(elems);
  }
}
setInterval(timestamp, 500);
</script>

<form action="https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8&orgId=00D900000010dAi" method="POST">
  <!-- reCAPTCHA 설정 -->
  <input type="hidden" name="captcha_settings" value='{"keyname":"contactformReCap","fallback":"true","orgId":"00D900000010dAi","ts":""}'>

  <!-- 필수 Hidden Fields -->
  <input type="hidden" name="oid" value="00D900000010dAi">
  <input type="hidden" name="retURL" value="https://webinars.co.kr/contact/thank-you">

  <!-- Lead Source (수동 추가 필요) -->
  <input type="hidden" name="lead_source" value="Web">

  <!-- 표준 필드 -->
  <input type="text" name="last_name" maxlength="80" />      <!-- 성함 → LastName -->
  <input type="text" name="company" maxlength="40" />        <!-- 소속 → Company -->
  <input type="email" name="email" maxlength="80" />         <!-- 이메일 → Email -->
  <input type="tel" name="phone" maxlength="40" />           <!-- 연락처 → Phone -->
  <textarea name="description"></textarea>                   <!-- 문의사항 → Description -->

  <!-- 커스텀 필드 (Project_Type__c) - 필드 ID: 00NTJ00000JV6e7 -->
  <select name="00NTJ00000JV6e7" title="프로젝트 유형">
    <option value="">--None--</option>
    <option value="Webinar/Streaming">Webinar/Streaming</option>
    <option value="Hybrid">Hybrid</option>
    <option value="Platform">Platform</option>
    <option value="Solution">Solution</option>
    <option value="기타">기타</option>
  </select>

  <!-- reCAPTCHA 위젯 -->
  <div class="g-recaptcha" data-sitekey="6LefX-EUAAAAAAVEujkJZwYtf8nEDLdSNLE0_gYy"></div>

  <button type="submit">보내기</button>
</form>
```

> ✅ **Salesforce 설정 완료**: 위 코드는 실제 Salesforce에서 생성된 Web-to-Lead HTML입니다. `lead_source` hidden 필드는 수동으로 추가해야 합니다.

### Option 2: Salesforce REST API + Backend

**장점**:
- 완전한 제어 가능
- 상세한 에러 핸들링
- 중복 체크 등 추가 로직 가능

**단점**:
- 백엔드 서버 필요
- OAuth 인증 관리 필요
- 구현 복잡도 증가

**아키텍처**:
```
[React Contact Form]
    → [API Gateway/Lambda]
    → [Salesforce REST API]
```

**필요 사항**:
- Connected App 생성
- OAuth 2.0 Client Credentials Flow
- API Rate Limit 고려

### Option 3: Salesforce Flow + Platform Events

**장점**:
- Low-code 접근
- Salesforce 내 자동화 통합 용이

**단점**:
- Platform Events 설정 필요
- 외부 시스템 연동 복잡

---

## 권장 구현 방안: Web-to-Lead (Phase 1)

### Phase 1: Web-to-Lead 기본 연동

**범위**:
1. Salesforce에서 Web-to-Lead 폼 생성
2. React Contact Form에 Web-to-Lead 통합
3. 커스텀 필드 (Project_Type__c) 생성 및 매핑
4. 제출 후 감사 페이지 구현

**구현 단계**:

| 단계 | 작업 | 담당 | 예상 산출물 |
|------|------|------|-------------|
| 1 | Salesforce 커스텀 필드 생성 | Salesforce Admin | Lead.Project_Type__c 필드 |
| 2 | Web-to-Lead 양식 생성 | Salesforce Admin | Web-to-Lead HTML 코드 |
| 3 | React Form 컴포넌트 개발 | Frontend Dev | ContactForm.jsx |
| 4 | 감사 페이지 구현 | Frontend Dev | ThankYou.jsx |
| 5 | 테스트 및 검증 | QA | 테스트 결과 리포트 |

### Phase 2: Backend API 연동 (선택)

**범위** (필요시):
- AWS Lambda + API Gateway 구성
- Salesforce Connected App 설정
- 중복 리드 체크 로직
- 상세 에러 핸들링

---

## React Contact Form 컴포넌트 설계

### 컴포넌트 구조

```
src/components/contact/
├── ContactForm.jsx          # 메인 폼 컴포넌트
├── ProjectTypeSelector.jsx  # 프로젝트 유형 라디오 버튼
├── ContactFormFields.jsx    # 입력 필드 그룹
├── ThankYouModal.jsx        # 제출 완료 모달
└── contactForm.css          # 스타일
```

### 상태 관리

```javascript
const initialFormState = {
  projectType: 'Webinar/Streaming',  // 기본값 (Salesforce Picklist 값과 일치)
  name: '',
  company: '',
  email: '',
  phone: '',
  description: '문의 시, 아래 주요 내용 전달 시 정확하고 빠른 상담 가능 합니다.\n-행사 예정일\n-행사 지역\n-행사 참가 대상\n-예상 참가자 인원 수(오프라인/온라인)'
};

// 프로젝트 유형 옵션 (UI 표시값 → Salesforce 저장값 매핑)
const PROJECT_TYPE_OPTIONS = [
  { label: 'WEBINAR/ STREAMING', value: 'Webinar/Streaming' },
  { label: 'HYBRID', value: 'Hybrid' },
  { label: 'PLATFORM', value: 'Platform' },
  { label: 'SOLUTION', value: 'Solution' },
  { label: '기타', value: '기타' }
];
```

> ⚠️ **값 정규화**: UI에서 `WEBINAR/ STREAMING`으로 표시하더라도, 폼 제출 시 `value`는 Salesforce Picklist와 일치하는 `Webinar/Streaming`을 사용합니다.

### 폼 검증 규칙

| 필드 | 검증 규칙 |
|------|----------|
| 성함 | 필수, 2자 이상 |
| 소속 | 필수, 2자 이상 |
| 이메일 | 필수, 이메일 형식 검증 |
| 연락처 | 필수, 전화번호 형식 (숫자, 하이픈 허용) |
| 문의사항 | 필수, 10자 이상 |

---

## Salesforce 설정 요구사항

### 1. 커스텀 필드 생성

**Lead Object → Project_Type__c**
- Label: 프로젝트 유형
- API Name: Project_Type__c
- Type: Picklist
- Values (정확히 아래 값으로 설정):
  - `Webinar/Streaming` ← 슬래시 뒤 공백 없음
  - `Hybrid`
  - `Platform`
  - `Solution`
  - `기타`

> ⚠️ **Picklist 값 주의**: 웹 폼에서 전송하는 값과 정확히 일치해야 합니다. 대소문자, 공백 모두 일치해야 Lead 생성 시 값이 올바르게 저장됩니다.

### 2. Web-to-Lead 설정

**Salesforce 접속**: [webinars2012.lightning.force.com](https://webinars2012.lightning.force.com)

1. Setup → Feature Settings → Marketing → Web-to-Lead
2. "Web-to-Lead" 활성화 확인
3. "Create Web-to-Lead Form" 클릭
4. 필드 선택:
   - Last Name (필수)
   - Company (필수)
   - Email
   - Phone
   - Description
   - Project_Type__c (커스텀)
5. Return URL 설정: `https://webinars.co.kr/contact/thank-you`
6. **Generate** 클릭 후 생성된 HTML 코드 저장

**생성된 HTML에서 확인해야 할 값들**:

```html
<!-- 1. Organization ID (oid) - 필수 -->
<input type="hidden" name="oid" value="00D5g000000XXXX">

<!-- 2. 커스텀 필드 ID - Project_Type__c -->
<select name="00N5g00000XXXXX">  <!-- 이 00N... 값을 확인 -->

<!-- 3. Return URL -->
<input type="hidden" name="retURL" value="...">
```

**⚠️ 생성된 HTML에 수동으로 추가해야 할 Hidden 필드들**:

Web-to-Lead 생성 시 자동 포함되지 않으므로, 생성된 HTML에 아래 필드를 **직접 추가**해야 합니다:

```html
<!-- Lead Source 지정 (필수 추가) -->
<input type="hidden" name="lead_source" value="Web">

<!-- Record Type 지정 (선택 - 특정 레코드 타입 사용 시) -->
<input type="hidden" name="recordType" value="[RECORD_TYPE_ID]">
```

> 📌 **Record Type ID 확인 방법**: Setup → Object Manager → Lead → Record Types → 해당 Record Type 클릭 → URL에서 ID 확인 (예: `012xxxxxxxxxxxx`)

### 3. Lead Source Picklist 확인 (필수)

Web-to-Lead에서 `lead_source=Web`을 전송하기 전, Org의 Lead Source picklist에 `Web` 값이 **활성 상태**인지 확인해야 합니다.

**확인 방법**:

1. Setup → Object Manager → Lead → Fields & Relationships → Lead Source
2. Picklist Values 섹션에서 `Web` 값 존재 여부 확인
3. 없거나 비활성인 경우 → "New" 버튼으로 `Web` 값 추가 또는 활성화

> ⚠️ **주의**: Lead Source picklist에 `Web` 값이 없으면 폼 제출 시 Lead Source 필드가 비어있게 됩니다.

### 4. Lead Assignment Rule (선택)

웹사이트 문의 리드를 특정 사용자/큐에 자동 할당:
- Rule Name: Web Contact Lead Assignment
- Criteria: Lead Source = Web
- Assign To: (영업팀 큐 또는 담당자)

---

## UI/UX 고려사항

### 현재 디자인 유지

- 기존 WordPress Quform 스타일 유지
- 다크 테마 배경 (#1a1a1a 계열)
- 라디오 버튼 커스텀 스타일 유지

### 사용자 피드백

| 상황 | 피드백 |
|------|--------|
| 필수 필드 미입력 | 인라인 에러 메시지 + 필드 하이라이트 |
| 이메일 형식 오류 | "올바른 이메일 형식을 입력해주세요" |
| 제출 중 | 버튼 로딩 상태 + "보내는 중..." 텍스트 |
| 제출 성공 | 감사 페이지로 이동 또는 모달 표시 |
| 제출 실패 | 에러 메시지 + 재시도 안내 |

### 감사 페이지/모달 내용

```
문의해 주셔서 감사합니다.

접수된 문의는 영업일 기준 1-2일 내에
담당자가 연락드리겠습니다.

[홈으로 돌아가기]
```

---

## 테스트 시나리오

### 기능 테스트

| # | 테스트 케이스 | 예상 결과 |
|---|--------------|----------|
| 1 | 모든 필수 필드 입력 후 제출 | Salesforce에 Lead 생성, 감사 페이지 표시 |
| 2 | 필수 필드 누락 후 제출 | 에러 메시지 표시, 제출 안됨 |
| 3 | 잘못된 이메일 형식 입력 | 이메일 형식 에러 표시 |
| 4 | 프로젝트 유형 각각 선택 | 해당 값이 Lead에 정확히 저장됨 |
| 5 | 문의사항에 한글 긴 텍스트 입력 | 인코딩 문제 없이 정상 저장 |

### 값 정규화 테스트 (Critical)

| # | 테스트 케이스 | 예상 결과 |
|---|--------------|----------|
| 1 | UI에서 "WEBINAR/ STREAMING" 선택 후 제출 | Salesforce Lead의 Project_Type__c = `Webinar/Streaming`으로 저장 |
| 2 | 정규화 로직 없이 원본 값 `Webinar/ Streaming` 전송 | ⚠️ Picklist 불일치로 값 저장 실패 (빈 값 또는 에러) |
| 3 | 모든 프로젝트 유형 옵션 순차 테스트 | 각 값이 Salesforce Picklist 값과 정확히 일치하여 저장됨 |

> ⚠️ **Critical**: 값 정규화 실패 시 Lead는 생성되나 Project_Type__c 필드가 비어있거나 에러가 발생합니다. 반드시 폼 제출 전 `Webinar/ Streaming` → `Webinar/Streaming` 변환을 확인하세요.

### Salesforce 검증

| # | 확인 항목 |
|---|----------|
| 1 | Lead 레코드 생성 확인 |
| 2 | 모든 필드 값 정확히 매핑 확인 |
| 3 | Lead Source = `Web` 확인 (hidden 필드 정상 작동) |
| 4 | Project_Type__c 값이 Picklist와 일치하는지 확인 |
| 5 | Lead Status가 Org 기본값으로 설정되는지 확인 |
| 6 | Assignment Rule 작동 확인 (설정된 경우) |

### 엣지 케이스

| # | 테스트 케이스 | 예상 결과 |
|---|--------------|----------|
| 1 | 네트워크 오류 상황 | 적절한 에러 메시지 표시 |
| 2 | 동일 이메일로 중복 제출 | 중복 Lead 생성 (Phase 2에서 처리) |
| 3 | XSS 공격 시도 | 입력값 sanitize 처리 |
| 4 | 매우 긴 텍스트 입력 | 길이 제한 적용 |

---

## 보안 고려사항

### 입력 검증
- 클라이언트 + 서버 양쪽 검증
- XSS 방지를 위한 입력값 sanitize
- SQL Injection 방지 (해당시)

### 스팸 방지
- Honeypot 필드 유지 (기존 quform_1_0)
- reCAPTCHA 추가 고려 (Phase 2)
- Rate Limiting 적용 (Phase 2, API 방식)

### 데이터 보호
- HTTPS 필수
- 개인정보 최소 수집
- 개인정보처리방침 링크 추가 권장

---

## 구현 태스크 및 체크리스트

### Phase 1: Salesforce 설정 (Salesforce Admin)

#### Step 1.1: 사전 확인

| # | 태스크 | 체크 |
|---|--------|------|
| 1 | Salesforce 로그인 확인 ([webinars2012.lightning.force.com](https://webinars2012.lightning.force.com)) | ☐ |
| 2 | System Administrator 권한 확인 | ☐ |
| 3 | Web-to-Lead 기능 활성화 상태 확인 (Setup → Marketing → Web-to-Lead) | ☐ |

#### Step 1.2: Lead Source Picklist 확인

| # | 태스크 | 체크 |
|---|--------|------|
| 1 | Setup → Object Manager → Lead → Fields & Relationships → Lead Source 이동 | ☐ |
| 2 | Picklist Values에서 `Web` 값 존재 확인 | ☐ |
| 3 | `Web` 값이 없으면 "New" 버튼으로 추가 | ☐ |
| 4 | `Web` 값이 비활성이면 활성화 | ☐ |

#### Step 1.3: Lead Status 기본값 설정

| # | 태스크 | 체크 |
|---|--------|------|
| 1 | Setup → Object Manager → Lead → Fields & Relationships → Status 이동 | ☐ |
| 2 | 현재 기본값 확인 (Default 체크된 항목) | ☐ |
| 3 | 원하는 기본값으로 변경 (예: `New` 또는 `Open - Not Contacted`) | ☐ |
| 4 | Save 클릭 | ☐ |

**현재 기본값**: ___________________ (기록용)

#### Step 1.4: 커스텀 필드 생성 (Project_Type__c)

| # | 태스크 | 체크 |
|---|--------|------|
| 1 | Setup → Object Manager → Lead → Fields & Relationships → New 클릭 | ☐ |
| 2 | Data Type: `Picklist` 선택 → Next | ☐ |
| 3 | Field Label: `프로젝트 유형` 입력 | ☐ |
| 4 | Field Name: `Project_Type` 확인 (자동 생성) | ☐ |
| 5 | Values 입력 (한 줄에 하나씩, **정확히** 아래 값 입력): | ☐ |

```
Webinar/Streaming
Hybrid
Platform
Solution
기타
```

| # | 태스크 | 체크 |
|---|--------|------|
| 6 | Display values alphabetically 체크 해제 | ☐ |
| 7 | Next → Field-Level Security 설정 (Visible 체크) | ☐ |
| 8 | Next → Page Layout 추가 | ☐ |
| 9 | Save | ☐ |
| 10 | API Name이 `Project_Type__c`인지 확인 | ☐ |

**생성된 필드 ID**: ___________________ (기록용)

#### Step 1.5: Web-to-Lead 폼 생성

| # | 태스크 | 체크 |
|---|--------|------|
| 1 | Setup → Feature Settings → Marketing → Web-to-Lead 이동 | ☐ |
| 2 | "Create Web-to-Lead Form" 클릭 | ☐ |
| 3 | 필드 선택 (Available Fields → Selected Fields로 이동): | ☐ |

**선택할 필드 목록**:

- [ ] Last Name
- [ ] Company
- [ ] Email
- [ ] Phone
- [ ] Description
- [ ] 프로젝트 유형 (Project_Type__c)

| # | 태스크 | 체크 |
|---|--------|------|
| 4 | Return URL 입력: `https://webinars.co.kr/contact/thank-you` | ☐ |
| 5 | "Generate" 버튼 클릭 | ☐ |
| 6 | 생성된 HTML 코드 복사하여 저장 | ☐ |

#### Step 1.6: 생성된 HTML에서 값 추출

생성된 HTML에서 아래 값들을 추출하여 기록:

| 항목 | 추출할 값 | 기록 |
|------|----------|------|
| Organization ID | `<input type="hidden" name="oid" value="여기값">` | ✅ `00D900000010dAi` |
| Project_Type__c 필드 ID | `<select name="00N...">` 또는 `<input name="00N...">` | ✅ `00NTJ00000JV6e7` |
| Return URL | `<input type="hidden" name="retURL" value="...">` | ✅ `https://webinars.co.kr/contact/thank-you` |
| reCAPTCHA Site Key | `data-sitekey="..."` | ✅ `6LefX-EUAAAAAAVEujkJZwYtf8nEDLdSNLE0_gYy` |
| reCAPTCHA Key Name | `captcha_settings.keyname` | ✅ `contactformReCap` |

#### Step 1.7: Hidden 필드 추가 (수동)

생성된 HTML에 아래 코드를 `</form>` 전에 추가:

```html
<!-- Lead Source 지정 -->
<input type="hidden" name="lead_source" value="Web">

<!-- Record Type 지정 (필요시) -->
<!-- <input type="hidden" name="recordType" value="[RECORD_TYPE_ID]"> -->
```

| # | 태스크 | 체크 |
|---|--------|------|
| 1 | `lead_source` hidden 필드 추가 완료 | ☐ |
| 2 | `recordType` hidden 필드 추가 (필요시) | ☐ |
| 3 | 최종 HTML 코드 저장 | ☐ |

---

### Phase 2: React 컴포넌트 개발 (Frontend Dev)

#### Step 2.1: 컴포넌트 파일 생성

| # | 태스크 | 체크 |
|---|--------|------|
| 1 | `src/components/contact/` 디렉토리 생성 | ☐ |
| 2 | `ContactForm.jsx` 파일 생성 | ☐ |
| 3 | `contactForm.css` 스타일 파일 생성 | ☐ |
| 4 | `ThankYouModal.jsx` 또는 감사 페이지 컴포넌트 생성 | ☐ |

#### Step 2.2: ContactForm 구현

| # | 태스크 | 체크 |
|---|--------|------|
| 1 | Salesforce Web-to-Lead action URL 설정 (`https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8`) | ☐ |
| 2 | `oid` hidden 필드 추가 (Step 1.6에서 추출한 Organization ID) | ☐ |
| 3 | `retURL` hidden 필드 추가 (`https://webinars.co.kr/contact/thank-you`) | ☐ |
| 4 | `lead_source` hidden 필드 추가 (`Web`) | ☐ |
| 5 | `recordType` hidden 필드 추가 (선택 - 특정 레코드 타입 사용 시) | ☐ |
| 6 | 프로젝트 유형 필드 구현 (`name="00N..."` - Step 1.6에서 추출한 필드 ID 사용) | ☐ |
| 7 | 값 정규화 로직 구현 (`Webinar/ Streaming` → `Webinar/Streaming`) | ☐ |
| 8 | 필수 입력 필드 구현 (last_name, company, email, phone, description) | ☐ |
| 9 | 폼 검증 로직 구현 | ☐ |
| 10 | Submit 버튼 및 로딩 상태 구현 | ☐ |
| 11 | reCAPTCHA 스크립트 로드 (`https://www.google.com/recaptcha/api.js`) | ☐ |
| 12 | `captcha_settings` hidden 필드 추가 | ☐ |
| 13 | reCAPTCHA 위젯 추가 (`data-sitekey="6LefX-EUAAAAAAVEujkJZwYtf8nEDLdSNLE0_gYy"`) | ☐ |
| 14 | timestamp 함수 구현 (reCAPTCHA 타임스탬프 갱신) | ☐ |

**Hidden 필드 체크리스트 (실제 값)**:

```html
<!-- 필수 Hidden 필드 -->
<input type="hidden" name="oid" value="00D900000010dAi" />
<input type="hidden" name="retURL" value="https://webinars.co.kr/contact/thank-you" />
<input type="hidden" name="lead_source" value="Web" />

<!-- reCAPTCHA 설정 -->
<input type="hidden" name="captcha_settings" value='{"keyname":"contactformReCap","fallback":"true","orgId":"00D900000010dAi","ts":""}' />

<!-- 선택 Hidden 필드 -->
<input type="hidden" name="recordType" value="[필요시 Record Type ID]" />
```

**커스텀 필드 (Project_Type__c)**:

```html
<select name="00NTJ00000JV6e7" title="프로젝트 유형">
  <option value="">--None--</option>
  <option value="Webinar/Streaming">Webinar/Streaming</option>
  <option value="Hybrid">Hybrid</option>
  <option value="Platform">Platform</option>
  <option value="Solution">Solution</option>
  <option value="기타">기타</option>
</select>
```

**reCAPTCHA 위젯**:

```html
<div class="g-recaptcha" data-sitekey="6LefX-EUAAAAAAVEujkJZwYtf8nEDLdSNLE0_gYy"></div>
```

#### Step 2.3: 스타일링

| # | 태스크 | 체크 |
|---|--------|------|
| 1 | 기존 WordPress Quform 스타일 참조 | ☐ |
| 2 | 다크 테마 배경 적용 | ☐ |
| 3 | 라디오 버튼 커스텀 스타일 | ☐ |
| 4 | 에러 메시지 스타일 | ☐ |
| 5 | 모바일 반응형 확인 | ☐ |

#### Step 2.4: 감사 페이지/모달 구현

| # | 태스크 | 체크 |
|---|--------|------|
| 1 | `/contact/thank-you` 라우트 추가 | ☐ |
| 2 | 감사 메시지 UI 구현 | ☐ |
| 3 | 홈으로 돌아가기 버튼 | ☐ |

---

### Phase 3: 테스트 및 검증 (QA)

#### Step 3.1: 로컬 테스트

| # | 태스크 | 체크 |
|---|--------|------|
| 1 | 개발 서버에서 Contact 페이지 접근 확인 | ☐ |
| 2 | 모든 필드 정상 렌더링 확인 | ☐ |
| 3 | 필수 필드 검증 작동 확인 | ☐ |
| 4 | 프로젝트 유형 선택 UI 확인 | ☐ |

#### Step 3.2: Salesforce 연동 테스트

| # | 태스크 | 테스트 데이터 | 결과 |
|---|--------|-------------|------|
| 1 | 기본 제출 테스트 | 모든 필드 입력 | ☐ Pass / ☐ Fail |
| 2 | Lead 생성 확인 | Salesforce에서 Lead 검색 | ☐ Pass / ☐ Fail |
| 3 | LastName 매핑 확인 | | ☐ Pass / ☐ Fail |
| 4 | Company 매핑 확인 | | ☐ Pass / ☐ Fail |
| 5 | Email 매핑 확인 | | ☐ Pass / ☐ Fail |
| 6 | Phone 매핑 확인 | | ☐ Pass / ☐ Fail |
| 7 | Description 매핑 확인 | | ☐ Pass / ☐ Fail |
| 8 | Project_Type__c 매핑 확인 | | ☐ Pass / ☐ Fail |
| 9 | Lead Source = Web 확인 | | ☐ Pass / ☐ Fail |
| 10 | Lead Status 기본값 확인 | | ☐ Pass / ☐ Fail |
| 11 | Record Type 확인 (설정한 경우) | 예상 Record Type: _________ | ☐ Pass / ☐ Fail / ☐ N/A |
| 12 | Return URL 리다이렉트 확인 | | ☐ Pass / ☐ Fail |

#### Step 3.3: 값 정규화 테스트 (Critical)

| # | 선택한 옵션 | 예상 저장값 | 실제 저장값 | 결과 |
|---|------------|-----------|-----------|------|
| 1 | WEBINAR/ STREAMING | `Webinar/Streaming` | | ☐ Pass / ☐ Fail |
| 2 | HYBRID | `Hybrid` | | ☐ Pass / ☐ Fail |
| 3 | PLATFORM | `Platform` | | ☐ Pass / ☐ Fail |
| 4 | SOLUTION | `Solution` | | ☐ Pass / ☐ Fail |
| 5 | 기타 | `기타` | | ☐ Pass / ☐ Fail |

**네거티브 테스트 (정규화 미적용 시 실패 확인)**:

| # | 테스트 케이스 | 전송 값 | 예상 결과 | 실제 결과 | 결과 |
|---|-------------|---------|----------|----------|------|
| 6 | 정규화 없이 원본 값 전송 | `Webinar/ Streaming` (공백 포함) | Project_Type__c 빈 값 또는 저장 실패 | | ☐ Pass / ☐ Fail |

> ⚠️ **회귀 방지**: 테스트 #6은 정규화 로직이 누락되었을 때 문제를 조기에 발견하기 위한 네거티브 케이스입니다. 이 테스트가 Pass(실패 확인)되어야 정규화 로직의 필요성이 검증됩니다.

#### Step 3.4: 엣지 케이스 테스트

| # | 테스트 케이스 | 결과 |
|---|--------------|------|
| 1 | 한글 이름/회사명 입력 | ☐ Pass / ☐ Fail |
| 2 | 긴 문의사항 텍스트 (500자 이상) | ☐ Pass / ☐ Fail |
| 3 | 특수문자 포함 입력 | ☐ Pass / ☐ Fail |
| 4 | 이메일 형식 검증 | ☐ Pass / ☐ Fail |
| 5 | 중복 제출 | ☐ Pass / ☐ Fail |

---

### Phase 4: 프로덕션 배포

#### Step 4.1: 배포 전 체크리스트

| # | 태스크 | 체크 |
|---|--------|------|
| 1 | 모든 테스트 통과 확인 | ☐ |
| 2 | Production Salesforce Org ID 확인 | ☐ |
| 3 | Production Return URL 설정 확인 | ☐ |
| 4 | HTTPS 적용 확인 | ☐ |
| 5 | 코드 리뷰 완료 | ☐ |

#### Step 4.2: 배포

| # | 태스크 | 체크 |
|---|--------|------|
| 1 | 프로덕션 빌드 생성 | ☐ |
| 2 | 배포 실행 | ☐ |
| 3 | 프로덕션 환경 접근 확인 | ☐ |

#### Step 4.3: 배포 후 검증

| # | 태스크 | 체크 |
|---|--------|------|
| 1 | 프로덕션 Contact 페이지 접근 확인 | ☐ |
| 2 | 실제 테스트 제출 (본인 정보로) | ☐ |
| 3 | Salesforce에서 Lead 생성 확인 | ☐ |
| 4 | 감사 페이지 리다이렉트 확인 | ☐ |
| 5 | 테스트 Lead 삭제 또는 표시 | ☐ |

---

### Phase 5 (선택): 고도화

| # | 태스크 | 우선순위 | 체크 |
|---|--------|---------|------|
| 1 | Backend API 구축 (Lambda) | 낮음 | ☐ |
| 2 | 중복 리드 체크 로직 | 중간 | ☐ |
| 3 | reCAPTCHA 통합 | 중간 | ✅ (Phase 2로 이동) |
| 4 | 제출 성공/실패 상세 피드백 | 중간 | ☐ |
| 5 | Google Analytics 이벤트 추적 | 낮음 | ☐ |

---

## 진행 상태 요약

| Phase | 상태 | 완료일 | 담당자 |
|-------|------|--------|--------|
| Phase 1: Salesforce 설정 | ☐ 대기 / ☐ 진행중 / ✅ 완료 | 2025-11-28 | Salesforce Admin |
| Phase 2: React 개발 | ☐ 대기 / ☐ 진행중 / ☐ 완료 | | |
| Phase 3: 테스트 | ☐ 대기 / ☐ 진행중 / ☐ 완료 | | |
| Phase 4: 배포 | ☐ 대기 / ☐ 진행중 / ☐ 완료 | | |
| Phase 5: 고도화 | ☐ 대기 / ☐ 진행중 / ☐ 완료 / ☐ 스킵 | | |

---

## 관련 문서

- [Webinars V3 PRD](./webinars-prd.md)
- [Salesforce Web-to-Lead 가이드](https://help.salesforce.com/s/articleView?id=sf.setting_up_web-to-lead.htm)
- [Salesforce REST API 문서](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/)

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2025-11-27 | 1.0 | 초안 작성 | Claude |
| 2025-11-27 | 1.1 | Web-to-Lead URL 수정 (webtocase → webto), 프로젝트 유형 값 정규화 명시, Hidden 필드(lead_source, recordType) 추가, 커스텀 필드 ID 설명 보강 | Claude |
| 2025-11-27 | 1.2 | Salesforce 인스턴스 정보 추가 (webinars2012), Lead Status 설정 불가 명시, Hidden 필드 수동 추가 안내 강화, 값 정규화 테스트 케이스 추가 | Claude |
| 2025-11-27 | 1.3 | Lead Status 기본값 변경 절차 추가, Lead Source Picklist 확인 섹션 추가 | Claude |
| 2025-11-27 | 1.4 | 단계별 구현 태스크 및 체크리스트 추가 (Phase 1~5), 진행 상태 요약 테이블 추가 | Claude |
| 2025-11-27 | 1.5 | Step 2.2에 retURL/recordType/00N 필드 ID 태스크 추가, Hidden 필드 체크리스트 추가, 번호 형식 오류 수정 | Claude |
| 2025-11-27 | 1.6 | Step 3.2에 Record Type 확인 테스트 추가, Step 3.3에 네거티브 테스트 케이스(정규화 미적용 시 실패 확인) 추가 | Claude |
| 2025-11-28 | 1.7 | **실제 Salesforce 값 적용**: oid(`00D900000010dAi`), 필드 ID(`00NTJ00000JV6e7`), reCAPTCHA Site Key 추가, Step 2.2에 reCAPTCHA 구현 태스크 추가, Hidden 필드 체크리스트에 실제 값 반영 | Claude |
