# MeetPoint

> 친구와 위치를 공유하고, 공정한 약속 장소를 추천하는 웹 서비스

MeetPoint는 친구와 채팅하면서 현재 위치 또는 약속 당일의 출발 위치를 기준으로 두 사람 모두에게 적절한 약속 장소를 추천하는 웹 애플리케이션입니다.

---

# 📖 프로젝트 소개

기존에는 약속 장소를 정하기 위해 메신저, 지도 앱, 장소 검색 서비스를 각각 이용해야 했습니다.

MeetPoint는 이러한 불편함을 해결하기 위해

- 친구 선택
- 채팅
- 위치 공유
- 중간 지점 계산
- 장소 추천

과정을 하나의 서비스에서 제공합니다.

---

# ✨ 주요 기능

## 👤 회원가입 및 로그인

- 닉네임 + 비밀번호 로그인
- JWT + httpOnly Cookie 인증

## 👥 친구 관리

- 친구 추가
- 친구 목록 조회
- 친구 검색

## 💬 채팅

- 댓글형 채팅
- 친구별 대화 조회

## 📍 위치 공유

### 지금 만나기

- 현재 위치 공유
- Geolocation API 사용

### 나중에 만나기

- 주소 검색
- 지도 핀 선택
- 저장된 출발 위치 사용

## 🗺 약속 장소 추천

추천 기준

- 평균 이동거리
- 거리 편차
- 카테고리 적합도
- 지역 활성도
- 교통 접근성

---

# 🛠 기술 스택

## Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

## Backend

- Next.js Route Handler
- JWT
- Repository Pattern

## Database

- Supabase
- PostgreSQL

## Map

- Kakao Maps JavaScript SDK
- Kakao Local API
- Daum Postcode
- Kakao Geocoder

---

# 📂 프로젝트 구조

```text
app/
components/
lib/
types/
fixtures/
```

---

# 🚀 실행 방법

### 저장소 복제

```bash
git clone https://github.com/opensourcegroup11/meetpoint.git
```

### 패키지 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서

```
http://localhost:3000
```

으로 접속합니다.

---

# 🔑 환경 변수

`.env.local`

```env
JWT_SECRET=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_KAKAO_MAP_APP_KEY=
KAKAO_REST_API_KEY=
```

---

# 🌿 브랜치 전략

```
main
└── develop
    ├── feature/login
    ├── feature/chat
    ├── feature/location
    └── feature/recommendation
```

- main : 최종 제출
- develop : 개발 통합
- feature/* : 기능 개발
---


## Jira 연동 기록

- KAN-10 홈 화면 UI 구현 작업을 Jira와 연결
- KAN-24 초기 세팅 연결
- KAN-25 Tailwind 설정 연결
- KAN-26 GitHub 저장소 생성 및 코드 업로드 작업을 Jira와 연결
