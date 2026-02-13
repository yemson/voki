# Voki

트레이딩 복기 웹 서비스입니다.  
기술 스택은 Next.js(App Router) + Supabase입니다.

## Local 실행

```bash
pnpm install
pnpm dev
```

기본 주소: `http://localhost:3000`

## 환경 변수

`.env.local`에 아래 값을 설정합니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

## 인증 라우트

- `/login`
- `/signup`
- `/dashboard` (로그인 필요)

## Supabase 마이그레이션 적용

```bash
pnpm dlx supabase@latest login
pnpm dlx supabase@latest link --project-ref <PROJECT_REF>
pnpm dlx supabase@latest db push
```

인증/프로필/RLS 관련 SQL은 `supabase/migrations`에 있습니다.

## 기타

- UI는 shadcn 컴포넌트를 사용합니다.
- 세션 가드는 `proxy.ts` + `lib/supabase/proxy.ts`에서 처리합니다.
