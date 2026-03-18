# Vertex AI 기반 Gemini Assistant 설정 가이드

이 문서는 Google Cloud Platform(GCP)의 **Vertex AI**를 사용하여 GitHub Actions에서 Gemini Assistant를 안정적으로 구동하기 위한 전체 설정 과정을 설명합니다.

---

## 1. Google Cloud 프로젝트 준비

1.  **GCP 콘솔 접속**: [Google Cloud Console](https://console.cloud.google.com/)에 접속합니다.
2.  **프로젝트 ID 확인**: 상단 프로젝트 선택기에서 사용 중인 프로젝트의 **ID**를 확인합니다. (예: `gen-lang-client-07111599943`)
3.  **결제 계정 연결**: [결제 페이지](https://console.cloud.google.com/billing)에서 해당 프로젝트에 유효한 결제 수단이 연결되어 있는지 확인합니다. (무료 크레딧 범위 내 사용 시에도 연결은 필수입니다.)

---

## 2. API 활성화

Vertex AI 기능을 사용하려면 관련 API를 활성화해야 합니다.

1.  상단 검색창에 **"Vertex AI API"**를 검색합니다.
2.  **Vertex AI API** 페이지에서 **'사용'** 또는 **'활성화'** 버튼을 클릭합니다.
3.  (선택 사항) 초기 설정 시 나타나는 "모든 권장 API 활성화"를 클릭하면 편리합니다.

---

## 3. 서비스 계정 및 권한 설정 (IAM)

GitHub Actions가 내 GCP 리소스에 접근할 수 있도록 전용 계정을 만듭니다.

1.  **메뉴 이동**: `IAM 및 관리자` > `서비스 계정`으로 이동합니다.
2.  **계정 생성**: 상단 **'+ 서비스 계정 만들기'**를 클릭합니다.
    -   **이름**: `gemini-bot` (또는 원하는 이름)
    -   **ID**: 자동으로 생성됩니다.
3.  **권한 부여 (중요)**: '이 서비스 계정에 프로젝트에 대한 액세스 권한 부여' 단계에서 다음 역할을 추가합니다.
    -   역할: **Vertex AI 사용자 (Vertex AI User)**
4.  **완료**: 나머지 단계는 생략하고 '완료'를 클릭합니다.

---

## 4. 서비스 계정 키(JSON) 생성

> **보안 참고**: 프로덕션 환경에서는 JSON 키를 발급받는 대신 **Workload Identity Federation(WIF)**을 사용하는 것이 더 안전한 모범 사례입니다. 이 가이드는 빠른 설정을 위해 JSON 키 방식을 설명하지만, 향후 전환을 고려해 보세요. ([Google 공식 문서](https://cloud.google.com/iam/docs/workload-identity-federation))

1.  생성된 서비스 계정의 **이메일 주소**를 클릭하여 상세 페이지로 들어갑니다.
2.  **'키(Keys)'** 탭을 클릭합니다.
3.  **'키 추가' > '새 키 만들기'**를 선택합니다.
4.  **JSON** 형식을 선택하고 **'만들기'**를 클릭합니다.
5.  컴퓨터에 다운로드된 `.json` 파일을 열어 내용을 전체 복사해 둡니다.

---

## 5. GitHub Secrets 등록

GitHub 레포지토리의 **Settings > Secrets and variables > Actions** 메뉴에서 다음 값을 추가합니다.

1.  `GCP_SA_KEY`: 복사한 **서비스 계정 JSON 키** 내용 전체를 붙여넣습니다.
2.  `GCP_PROJECT_ID`: 내 GCP **프로젝트 ID**를 입력합니다. (예: `gen-lang-client-07111599943`)

---

## 6. GitHub Actions 워크플로우 구성

`.github/workflows/gemini-bot.yml` 파일에 다음 구조를 적용합니다.

```yaml
permissions:
  contents: write
  pull-requests: write
  issues: write
  # id-token: write # OIDC 인증 사용 시 필수 (JSON 키 방식 사용 시 불필요)

jobs:
  gemini-job:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      # 1. Google Cloud 인증
      - id: 'auth'
        name: 'Authenticate to Google Cloud'
        uses: 'google-github-actions/auth@v2'
        with:
          credentials_json: '${{ secrets.GCP_SA_KEY }}'

      # 2. Gemini CLI 실행 (Vertex AI 모드)
      - name: Run Gemini CLI
        uses: google-github-actions/run-gemini-cli@v0
        with:
          use_vertex_ai: true
          gcp_project_id: ${{ secrets.GCP_PROJECT_ID }}
          gcp_location: "asia-northeast3" # 서울 리전
          gemini_model: "gemini-1.5-flash" # 또는 gemini-1.5-pro
          prompt: "여기에 프롬프트 입력"
          settings: '{"approval_mode": "yolo"}'
```

---

## 7. 문제 해결 (Troubleshooting)

### 403 Forbidden / Permission Denied
- **원인**: Vertex AI API가 활성화되지 않았거나, 서비스 계정에 'Vertex AI 사용자' 권한이 없습니다.
- **해결**: GCP 콘솔에서 API 활성화 상태와 IAM 역할을 다시 확인하세요.

### 429 Quota Exceeded
- **원인**: Vertex AI의 무료 할당량을 초과했습니다.
- **해결**: 결제 계정을 연결하여 할당량을 늘리거나, 호출 빈도를 조절하세요. Vertex AI는 AI Studio보다 훨씬 높은 기본 쿼터를 제공합니다.

### Invalid Delimiter 'EOF'
- **원인**: 워크플로우 실행 중 에러가 발생하여 출력값이 정상적으로 생성되지 않았을 때 GitHub Actions에서 발생하는 부차적인 에러입니다.
- **해결**: 위의 `403` 또는 `429` 에러를 먼저 해결하면 사라집니다.
