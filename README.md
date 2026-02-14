# Voki

Voki는 거래를 기록하고 복기하는 트레이딩 저널 서비스입니다.  
`Next.js (App Router)` + `Supabase` 기반으로 동작합니다.

## 주요 기능

- 이메일/비밀번호 인증 (로그인, 회원가입, 로그아웃)
- 대시보드
  - 최근 90일 누적 수익률
  - 최근 90일 월별 승률
  - 리스크 요약 카드 (최대 연속 손실, 최대 낙폭, 평균 손실금)
  - 최근 거래 5개
- 거래 관리
  - 거래 작성/상세/삭제
  - 거래 리스트 필터 (기간, 방향, 종목)
  - 페이지네이션 (10개 단위)

## 기술 스택

- Next.js 16
- React 19
- Supabase (Auth, Postgres, RLS)
- shadcn/ui
- Recharts

## 로컬 실행

```bash
pnpm install
pnpm dev
```

- 기본 주소: `http://localhost:3000`

## 환경 변수

`.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

## 라우트

- `/login`
- `/signup`
- `/dashboard`
- `/trades`
- `/trades/new`
- `/trades/[id]`

## Supabase 마이그레이션

```bash
pnpm dlx supabase@latest login
pnpm dlx supabase@latest link --project-ref <PROJECT_REF>
pnpm dlx supabase@latest db push
```

- SQL 파일 위치: `supabase/migrations`

## 배포

- Production: https://voki-rose.vercel.app

## 참고

- 세션 가드: `proxy.ts`, `lib/supabase/proxy.ts`
- Supabase SSR 클라이언트: `lib/supabase/server.ts`, `lib/supabase/client.ts`
