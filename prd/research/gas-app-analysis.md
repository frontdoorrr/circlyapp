# Gas 앱 화면 및 User Flow 분석

> 목적: Circly가 참고할 Gas 스타일의 익명 칭찬 투표 경험을 화면 단위로 해체한다.
> 레퍼런스: YouTube `How to use Gas App | Gas School App` (`https://www.youtube.com/watch?v=IdpRwM_GNbM`), 공개 스크린샷/기사 자료.
> 주의: Gas는 2023-11-07 종료된 앱이므로 현재 앱을 직접 설치해 재현할 수 없다. 본 문서는 공개 영상/이미지에서 확인되는 UI와 기사 기반 동작 설명을 합쳐 구현 참고용으로 정리한다.

## 1. 핵심 제품 구조

Gas는 "학교/친구 네트워크 안에서 앱이 만든 긍정 질문에 4지선다로 친구를 고르고, 선택받은 친구가 익명 Flame을 받는" 앱이다.

핵심 루프:

1. 사용자가 학교/학년/성별/연락처 기반으로 친구 풀을 만든다.
2. 앱이 제공하는 칭찬형 질문 12개가 한 라운드로 열린다.
3. 각 질문마다 친구 후보 4명이 나온다.
4. 사용자가 한 명을 고르면 상대방 Inbox에 Flame이 쌓인다.
5. 라운드를 끝내면 코인/대기/초대 유도가 나온다.
6. 받은 Flame은 익명으로 보이고, 유료 God Mode가 신원 힌트를 판다.

Gas의 UX는 화면 수가 많지 않다. 대신 각 화면이 하나의 행동만 요구한다.

- 온보딩: 학교/친구 그래프 만들기
- Play: 질문에 답하기
- Inbox: 받은 칭찬 확인하기
- Paywall: 누가 보냈는지 궁금증을 수익화하기
- Profile/Coins: 내 노출 기회와 공유 확산 관리하기

## 2. IA 및 탭 구조

Gas의 주요 탭은 공개 스크린샷 기준으로 `Inbox`, `Gas` 또는 `Play`, `Profile` 중심이다. 일부 화면에서는 상단 네비게이션이 아래처럼 보인다.

```text
┌──────────────────────────────┐
│ Inbox 1        Gas    Profile│
│ ─────                         │
└──────────────────────────────┘
```

구현 관점에서는 Circly의 현재 구조에 아래처럼 매핑할 수 있다.

| Gas 영역 | 역할 | Circly 대응 |
|---|---|---|
| Welcome/Onboarding | 가입, 학교/학년/성별, 친구 풀 생성 | `app/(auth)/`, 온보딩 |
| Gas/Play | 질문 라운드 진행 | `app/(main)/(0-home)/`, `app/poll/` |
| Inbox | 받은 Flame/칭찬 확인 | 알림/결과 탭 또는 Profile 하위 |
| Profile | Flame 수, 코인, 공유, 노출권 | `app/(main)/(2-profile)/` |
| God Mode | 힌트 해금형 구독 | `app/subscription/` |

## 3. 화면별 와이어프레임

### S00. Welcome

첫 화면은 Gas 브랜드와 "어떻게 재미를 얻는지"를 즉시 보여준다. 긴 설명보다 앱 결과물의 예시를 먼저 보여주는 구조다.

```text
┌──────────────────────────────┐
│ 4:57                    39%  │
│                              │
│          WELCOME TO          │
│             GAS              │
│                              │
│    ┌────────┐   ┌────────┐   │
│    │ 🙂      │   │  🔥     │   │
│    │ BEST   │   │        │   │
│    │ SMILE  │   │ A boy  │   │
│    │        │   │ gassed │   │
│    └────────┘   └────────┘   │
│                              │
│   Answer Polls About Friends │
│   Get Flames When Picked     │
│                              │
│ ┌──────────────────────────┐ │
│ │          Start           │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

구성:

- 상단: 앱 이름 `GAS`
- 중앙: 두 개의 폰 목업 또는 투표/알림 예시
- 하단: 기능 가치 2줄
- CTA: `Start`

구현 포인트:

- 첫 화면에서 "익명 칭찬 투표"를 텍스트로 길게 설명하지 않는다.
- 사용자가 받을 보상인 Flame을 시각적으로 먼저 노출한다.
- CTA는 1개만 둔다.

### S01. Age Gate

Gas는 청소년 대상 서비스라 온보딩 초반에 나이 확인이 필요하다.

```text
┌──────────────────────────────┐
│                              │
│             🎂               │
│                              │
│      Are you 13 or older?    │
│                              │
│  Gas is for students and     │
│  friends in your school.     │
│                              │
│ ┌──────────────────────────┐ │
│ │        Yes, continue     │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │        Not yet           │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

구성:

- 질문형 제목
- 최소 연령 안내
- 통과 CTA / 차단 CTA

구현 포인트:

- 실제 프로덕션에서는 단순 자기확인만으로 충분하지 않을 수 있다.
- Circly는 중고등학생 대상이므로 약관, 개인정보, 보호자 정책과 함께 설계해야 한다.

### S02. Phone Number 또는 계정 생성

Gas 계열 앱은 빠른 친구 그래프 생성을 위해 휴대폰/연락처 기반 가입을 유도한다.

```text
┌──────────────────────────────┐
│ ←                            │
│                              │
│        What's your number?   │
│                              │
│ ┌──────────────────────────┐ │
│ │ +1  Phone number         │ │
│ └──────────────────────────┘ │
│                              │
│ We'll send a code to verify  │
│ your account.                │
│                              │
│ ┌──────────────────────────┐ │
│ │          Continue        │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

대체 구현:

- Circly가 Supabase Auth 이메일 로그인을 유지한다면, 이 화면은 이메일/비밀번호 또는 소셜 로그인으로 대체한다.
- Gas식 확산을 재현하려면 로그인 직후 연락처/학교 선택을 반드시 이어 붙인다.

### S03. Location Permission

학교 선택을 빠르게 만들기 위해 위치 권한을 요청한다.

```text
┌──────────────────────────────┐
│ ←                            │
│                              │
│             📍               │
│                              │
│     Find your school         │
│                              │
│  Allow location so we can    │
│  show schools near you.      │
│                              │
│ ┌──────────────────────────┐ │
│ │      Allow location      │ │
│ └──────────────────────────┘ │
│        Enter manually        │
└──────────────────────────────┘
```

상태:

- `notDetermined`: 권한 요청 CTA
- `granted`: 학교 목록으로 이동
- `denied`: 수동 검색 fallback

구현 포인트:

- 권한 요청 전에 자체 설명 화면을 먼저 보여준다.
- iOS/Android 시스템 권한 팝업은 CTA를 누른 뒤 띄운다.
- 위치가 없어도 수동 검색으로 계속 진행 가능해야 한다.

### S04. School Select

사용자가 자신의 학교를 고르는 화면이다. Gas의 네트워크 효과는 학교 단위 그래프에서 나온다.

```text
┌──────────────────────────────┐
│ ←                            │
│                              │
│       Pick your school       │
│                              │
│ ┌──────────────────────────┐ │
│ │ Search school name       │ │
│ └──────────────────────────┘ │
│                              │
│ Nearby                       │
│ ┌──────────────────────────┐ │
│ │ Lincoln High School   >  │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Westview High School  >  │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Add my school            │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

구성:

- 검색 input
- 근처 학교 리스트
- 학교 추가 요청

데이터:

- `school_id`
- `school_name`
- `school_region`

구현 포인트:

- 선택된 학교는 이후 친구 후보 풀의 가장 강한 필터가 된다.
- 학교가 없는 경우에도 "학교 추가 요청"으로 이탈을 줄인다.

### S05. Grade Select

학년은 친구 후보 추천과 익명 힌트에 쓰인다.

```text
┌──────────────────────────────┐
│ ←                            │
│                              │
│       What grade are you?    │
│                              │
│ ┌────────────┐ ┌───────────┐ │
│ │  Freshman  │ │ Sophomore │ │
│ └────────────┘ └───────────┘ │
│ ┌────────────┐ ┌───────────┐ │
│ │  Junior    │ │ Senior    │ │
│ └────────────┘ └───────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │          Continue        │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

구현 포인트:

- 선택지는 큰 pill/card 버튼으로 둔다.
- 이후 Flame 상세에서 `from a boy in 11th grade` 같은 힌트로 재사용된다.

### S06. Gender Select

Gas는 Flame 색상과 힌트 문구에 성별 정보를 사용했다.

```text
┌──────────────────────────────┐
│ ←                            │
│                              │
│     How should we show you?  │
│                              │
│ ┌──────────────────────────┐ │
│ │ 👧 Girl                  │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ 👦 Boy                   │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ 🧑 Non-binary            │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │          Continue        │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

구현 포인트:

- Circly에서는 개인정보 민감도 때문에 선택/비공개 옵션을 둬야 한다.
- Gas식 힌트 수익화를 그대로 쓰면 개인정보 노출 리스크가 커진다.

### S07. Contacts Permission

Gas의 후보 풀은 연락처와 학교 네트워크를 기반으로 채워진다.

```text
┌──────────────────────────────┐
│ ←                            │
│                              │
│             👥               │
│                              │
│       Find your friends      │
│                              │
│  Sync contacts to add people │
│  you already know.           │
│                              │
│ ┌──────────────────────────┐ │
│ │       Sync contacts      │ │
│ └──────────────────────────┘ │
│          Skip for now        │
└──────────────────────────────┘
```

상태:

- 허용: 연락처 매칭 → 친구 추천
- 거부: 학교 기반 추천 또는 초대 코드 공유

구현 포인트:

- Gas처럼 친구 후보가 많아야 투표가 즉시 재미있어진다.
- Circly가 초대 코드 기반 Circle 모델을 유지한다면 "연락처 전체 업로드" 대신 "친구 초대/코드 공유"가 더 안전하다.

### S08. Invite/Bootstrap Friends

초기 그래프가 부족하면 투표를 시작할 수 없기 때문에 초대 화면이 필요하다.

```text
┌──────────────────────────────┐
│ ←                            │
│                              │
│       Add friends to play    │
│                              │
│ ┌──────────────────────────┐ │
│ │ Maya Lee              Add│ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Jordan Kim           Add│ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │       Invite friends     │ │
│ └──────────────────────────┘ │
│        Continue anyway       │
└──────────────────────────────┘
```

구현 포인트:

- 최소 투표 가능 인원은 후보 4명을 만들 수 있는 수준이어야 한다.
- 후보가 부족하면 투표 UI 대신 초대 CTA를 보여준다.

### S09. Home / Round Ready

라운드가 열려 있으면 즉시 Play로 들어가게 한다.

```text
┌──────────────────────────────┐
│ Inbox 1        Gas    Profile│
│                              │
│             🔥               │
│                              │
│        New polls are ready   │
│                              │
│   Answer 12 polls to earn    │
│   coins and send flames.     │
│                              │
│ ┌──────────────────────────┐ │
│ │           Play           │ │
│ └──────────────────────────┘ │
│                              │
│       Invite friends         │
└──────────────────────────────┘
```

상태:

- `ready`: Play CTA 활성
- `cooldown`: 다음 라운드 카운트다운
- `notEnoughFriends`: 친구 추가/초대 CTA
- `needsNotification`: 알림 권한 CTA

### S10. Play / Poll Question

Gas의 핵심 화면이다. 질문 1개, 이모지 1개, 후보 4명, 진행도만 보여준다.

```text
┌──────────────────────────────┐
│ Inbox 1        Gas    Profile│
│ ──────────────────────────── │
│            1 of 12           │
│                              │
│              🙂              │
│                              │
│    The most beautiful person │
│         you have ever met    │
│                              │
│ ┌────────────┐ ┌───────────┐ │
│ │ Jose       │ │ Maddie    │ │
│ │ Montes     │ │ Salinas   │ │
│ └────────────┘ └───────────┘ │
│ ┌────────────┐ ┌───────────┐ │
│ │ Tamara     │ │ Zion      │ │
│ │ Rodriguez  │ │ Garza     │ │
│ └────────────┘ └───────────┘ │
│                              │
│     Skip              Shuffle│
└──────────────────────────────┘
```

구성:

- 상단 탭: Inbox/Gas/Profile
- 진행도: `1 of 12`
- 질문 이모지
- 질문 문구
- 2x2 후보 버튼
- 보조 액션: `Skip`, `Shuffle`

인터랙션:

- 후보 탭: 즉시 투표 제출
- Skip: 투표 없이 다음 질문
- Shuffle: 같은 질문의 후보 4명 재구성
- Inbox/Profile 탭: 라운드 중 이탈 가능하되, 돌아오면 현재 진행 유지

구현 포인트:

- 후보 카드는 엄지 영역에 둔다.
- 이름은 1-2줄까지 허용한다.
- 라운드 진행 중 긴 설명/설정/필터는 보여주지 않는다.
- 후보 선정은 같은 Circle/학교/친구 풀에서 자기 자신 제외, 최근 노출 편향 보정이 필요하다.

### S11. Selection Feedback

선택 직후에는 눌린 후보가 강조되고 다음 질문으로 넘어간다. 공개 스크린샷에는 손가락 아이콘/강조 카드가 나타나는 예시가 있다.

```text
┌──────────────────────────────┐
│            1 of 12           │
│                              │
│              🙂              │
│                              │
│    The most beautiful person │
│         you have ever met    │
│                              │
│ ┌────────────┐ ┌───────────┐ │
│ │ Jose       │ │ Maddie    │ │
│ └────────────┘ └───────────┘ │
│ ┌────────────┐ ┌───────────┐ │
│ │ Tamara     │ │ Zion   👆 │ │
│ └────────────┘ └───────────┘ │
│                              │
│          Sending flame...    │
└──────────────────────────────┘
```

상태 전환:

1. `idle`
2. `selected`
3. `submitting`
4. `success`
5. 다음 질문으로 자동 전환

구현 포인트:

- 별도 확인 모달을 띄우지 않는다.
- 제출 실패 시 같은 화면에서 toast/inline retry를 제공한다.
- 익명성을 강조하기 위해 "sent anonymously" 같은 짧은 피드백을 쓸 수 있다.

### S12. Round Progress / Question Advance

라운드 안에서는 같은 레이아웃이 반복되고, 숫자만 바뀐다.

```text
┌──────────────────────────────┐
│ Inbox 1        Gas    Profile│
│ ──────────────────────────── │
│            8 of 12           │
│                              │
│              🕵️              │
│                              │
│  Want to steal them from     │
│  their boyfriend/girlfriend  │
│                              │
│ ┌────────────┐ ┌───────────┐ │
│ │ Candidate  │ │ Candidate │ │
│ └────────────┘ └───────────┘ │
│ ┌────────────┐ ┌───────────┐ │
│ │ Candidate  │ │ Candidate │ │
│ └────────────┘ └───────────┘ │
│                              │
│     Skip              Shuffle│
└──────────────────────────────┘
```

질문 톤:

- 칭찬형: "Best smile", "Most beautiful person..."
- 관계/호감형: "Feels like they are always flirting..."
- 성격/능력형: "Has so many skills..."
- 파티/친구형: "Should DJ every party"

주의:

- Gas에는 외모/연애성 질문도 있었다. Circly가 중고등학생 대상이면 안전 정책상 질문 카테고리 제한이 필요하다.

### S13. Round Complete / Cooldown

12문항을 끝내면 즉시 더 할 수 없게 만들고 다음 라운드까지 기다리게 한다.

```text
┌──────────────────────────────┐
│ Inbox 1        Gas    Profile│
│                              │
│              🎉              │
│                              │
│       You're out of polls    │
│            for now           │
│                              │
│       New polls in 58:42     │
│                              │
│ ┌──────────────────────────┐ │
│ │       Invite friends     │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │      Enable reminders    │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

구성:

- 완료 감정 피드백
- 다음 라운드 카운트다운
- 초대 CTA
- 알림 CTA

구현 포인트:

- 부족함을 만들어 재방문을 유도한다.
- "초대하면 다음 라운드가 열린다" 같은 부스터가 가능하다.

### S14. Coins Earned

Gas는 라운드 완료로 코인을 지급하고, 코인을 통해 내 이름을 다른 사람의 Poll에 더 자주 노출시킬 수 있게 했다.

```text
┌──────────────────────────────┐
│                              │
│              🪙              │
│                              │
│        You earned coins      │
│                              │
│             +20              │
│                              │
│  Use coins to show up in     │
│  more friends' polls.        │
│                              │
│ ┌──────────────────────────┐ │
│ │       Use coins          │ │
│ └──────────────────────────┘ │
│        Back to Gas           │
└──────────────────────────────┘
```

구현 포인트:

- Flame은 받는 보상, Coin은 행동 보상이다.
- Coin은 투표 참여를 반복시키는 장치다.

### S15. Inbox List

받은 칭찬은 Flame 리스트로 표시된다. 공개 스크린샷 기준으로 각 행은 Flame 아이콘과 시간만 매우 간단하게 보인다.

```text
┌──────────────────────────────┐
│ Feed        Inbox 3      Play│
│             ─────            │
│                              │
│ ┌──────────────────────────┐ │
│ │           🔵🔥        2m │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │           🟣🔥        2m │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │           🔴🔥        2m │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │           ⚪🔥        2m │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

구성:

- 상단 탭
- unread badge
- Flame row 리스트
- 각 row: 색상 Flame, 시간

색상 의미:

- 파랑: boy
- 핑크: girl
- 보라: non-binary
- 회색: 읽음/비활성/잠김 상태로 추정

구현 포인트:

- 리스트는 일부러 정보량이 적다. 궁금증을 만들기 위한 설계다.
- row를 탭하면 상세 화면에서 질문/힌트를 보여준다.

### S16. Flame Detail

Flame 상세는 "누가 보냈는지"를 직접 보여주지 않고 제한된 힌트만 제공한다.

```text
┌──────────────────────────────┐
│ ←                            │
│                              │
│              👦              │
│       From a boy in 11th     │
│              grade           │
│                              │
│ ┌──────────────────────────┐ │
│ │ "A person who never      │ │
│ │  ceases to amaze me."    │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ "Who do you secretly     │ │
│ │  admire?"                │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │    🔒 See who sent it    │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

구성:

- 익명 힌트: 성별/학년
- 받은 질문 또는 칭찬 prompt
- 잠긴 CTA: `See who sent it`

구현 포인트:

- 무료 상태에서는 절대 실명 노출을 하지 않는다.
- 힌트는 충분히 궁금하지만 너무 특정 가능하지 않게 제한해야 한다.
- Circly는 미성년자 대상이므로 신원 해금형 과금은 정책 검토가 필요하다.

### S17. Share Reply

일부 Gas 스크린샷은 받은 Poll 결과를 Snapchat/Instagram으로 답장하거나 공유하는 하단 영역을 보여준다.

```text
┌──────────────────────────────┐
│                              │
│        [Result Card]         │
│                              │
│          gasapp.co           │
│                              │
│ ┌──────────────────────────┐ │
│ │ Reply on...     👻   IG  │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │    🔒 See who sent it    │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

구성:

- 상단: 결과 카드
- 브랜드 URL
- Snapchat/Instagram 공유 CTA
- God Mode CTA

구현 포인트:

- Circly의 `Result Card` 1080x1920 공유 기능과 직접 연결된다.
- 공유 전용 이미지는 결과 문구, 선택된 이름, 브랜딩, QR/딥링크를 포함할 수 있다.

### S18. God Mode Paywall

Gas의 핵심 수익화 화면이다. "누가 보냈는지" 궁금증이 생긴 순간 진입한다.

```text
┌──────────────────────────────┐
│ ←                            │
│                              │
│              🔒              │
│        See who likes you     │
│                              │
│  Unlock hints and reveal     │
│  who sent your flames.       │
│                              │
│ ✓ See 2 names every week     │
│ ✓ Unlimited hints            │
│ ✓ Secret crush alerts        │
│ ✓ Double coins on polls      │
│                              │
│ ┌──────────────────────────┐ │
│ │      Continue - $6.99/w  │ │
│ └──────────────────────────┘ │
│        Maybe later           │
└──────────────────────────────┘
```

진입 경로:

- Inbox 상세의 `See who sent it`
- Inbox 하단의 `See who likes you`
- Profile의 God Mode CTA

구현 포인트:

- 결제 CTA 직전에는 사용자가 이미 받은 Flame 맥락을 보여줘야 전환율이 높다.
- 단순 "프리미엄 가입"보다 "이 Flame을 누가 보냈는지" 문맥으로 판매한다.

### S19. God Mode Hint Reveal

유료 또는 코인 사용 후 신원 힌트가 단계적으로 열린다.

```text
┌──────────────────────────────┐
│ ←                            │
│                              │
│          Your hint           │
│                              │
│ ┌──────────────────────────┐ │
│ │ From a boy in 11th grade │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Initial: J               │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ School: LHS              │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │       Reveal more        │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

구현 포인트:

- 공개 자료에 따르면 God Mode는 제한적으로 이름/힌트 해금을 제공했다.
- Circly에서는 익명 투표의 신뢰를 해치지 않도록 "완전 실명 공개"보다 "안전한 힌트" 또는 "보낸 사람 동의 기반 공개"가 낫다.

### S20. Profile

Profile은 내 Flame, 코인, 공유, 노출권 구매의 허브다.

```text
┌──────────────────────────────┐
│ Inbox          Gas    Profile│
│                       ───────│
│                              │
│           [Avatar]           │
│          Jamie Kim           │
│       Lincoln High · 11th    │
│                              │
│ ┌────────────┐ ┌───────────┐ │
│ │ 🔥 Flames  │ │ 🪙 Coins  │ │
│ │    128     │ │    240    │ │
│ └────────────┘ └───────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │       Share Profile      │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │       Use coins          │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

구성:

- 프로필 기본 정보
- Flame 수
- Coin 수
- 공유 CTA
- 코인 사용 CTA

주의:

- 공개 프로필에 학교/학년/이름이 과도하게 노출되면 안전 리스크가 커진다.

### S21. Use Coins / Boost

코인은 내 이름을 다른 사람의 질문 후보에 더 자주 노출시키는 성장/참여 장치다.

```text
┌──────────────────────────────┐
│ ←                            │
│                              │
│          Use coins           │
│                              │
│ ┌──────────────────────────┐ │
│ │ Show me in 3 random      │ │
│ │ friends' polls           │ │
│ │                    100 🪙 │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Show me in my crush's    │ │
│ │ polls                    │ │
│ │                    300 🪙 │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

구현 포인트:

- 투표 참여 → 코인 → 내 노출 증가 → Flame 수신 가능성 증가 → 재방문 루프다.
- "crush" 타겟팅은 청소년 안전/정서 리스크가 있으므로 Circly에서는 `친구들에게 더 자주 노출` 정도로 완화하는 것이 안전하다.

## 4. 상세 User Flow

### F01. 신규 사용자 온보딩

목표: 투표 가능한 친구 후보 풀을 만들고 첫 라운드에 진입한다.

```text
Welcome
  → Age Gate
  → Account/Phone Auth
  → Location Permission
  → School Select
  → Grade Select
  → Gender Select
  → Contacts Permission
  → Friend Suggestions / Invite
  → Home
  → Play
```

상세:

1. 사용자가 `Start`를 누른다.
2. 최소 연령 확인을 통과한다.
3. 계정을 생성하거나 로그인한다.
4. 위치 권한을 허용하면 근처 학교 리스트를 받는다.
5. 학교를 선택한다.
6. 학년과 성별을 선택한다.
7. 연락처 동기화를 허용한다.
8. 매칭된 친구를 추가하거나 초대 링크를 공유한다.
9. 후보가 4명 이상이면 첫 라운드 Play CTA가 활성화된다.
10. 후보가 부족하면 `Invite friends`가 우선 노출된다.

예외:

- 위치 거부: 학교 수동 검색
- 연락처 거부: 학교 기반 추천/초대 코드
- 학교 없음: 학교 추가 요청
- 친구 부족: 투표 대신 초대 화면

### F02. 라운드 투표

목표: 12문항을 빠르게 끝내고 Flame을 보낸다.

```text
Home/Round Ready
  → Play Question 1
    → Select Candidate
    → Sending Feedback
  → Play Question 2
    → Skip or Shuffle or Select
  → ...
  → Play Question 12
  → Round Complete
  → Coins Earned
  → Cooldown
```

터치 단위:

1. `Play`를 탭한다.
2. `1 of 12` 질문을 본다.
3. 후보 4명 중 한 명을 탭한다.
4. 선택 카드가 강조된다.
5. 서버에 익명 vote가 생성된다.
6. 상대방에게 Flame 이벤트가 생성된다.
7. 다음 질문으로 자동 전환된다.
8. 사용자가 대답하기 어려운 질문은 `Skip`한다.
9. 후보가 마음에 들지 않으면 `Shuffle`한다.
10. 12문항이 끝나면 완료 화면으로 이동한다.

서버 이벤트:

- `poll_question_presented`
- `candidate_selected`
- `vote_created`
- `flame_created`
- `round_progress_updated`
- `round_completed`
- `coins_granted`

### F03. 받은 Flame 확인

목표: 내가 어떤 칭찬을 받았는지 확인하고, 보낸 사람에 대한 궁금증을 만든다.

```text
Push Notification or Inbox Badge
  → Inbox List
  → Flame Detail
  → See who sent it
  → God Mode Paywall
```

상세:

1. 다른 사용자가 나를 후보로 선택한다.
2. 내 Inbox badge가 증가한다.
3. 사용자가 Inbox를 연다.
4. Flame row에는 색상/시간만 보인다.
5. row를 탭하면 질문 문구와 제한 힌트가 보인다.
6. `See who sent it` CTA가 잠긴 상태로 보인다.
7. CTA를 누르면 God Mode Paywall로 이동한다.

핵심 감정:

- "누가 나를 골랐지?"
- "어떤 질문에서 나를 골랐지?"
- "힌트를 더 볼 수 있을까?"

### F04. God Mode 결제

목표: 받은 Flame 맥락에서 신원 힌트를 유료로 해금한다.

```text
Flame Detail
  → Locked CTA
  → God Mode Paywall
  → Purchase
  → Hint Reveal
  → Inbox Detail
```

상세:

1. 사용자가 잠긴 CTA를 누른다.
2. Paywall은 일반 기능 목록보다 "현재 Flame을 해금"하는 맥락을 강조한다.
3. 사용자가 결제한다.
4. 구독 상태가 활성화된다.
5. 이름/힌트/이니셜 등 추가 정보가 열린다.

주의:

- 미성년자 대상 서비스에서 신원 공개형 과금은 민감하다.
- Circly에서는 RevenueCat을 쓰더라도 "완전 공개"보다 "프라이버시 보존형 힌트"가 적합하다.

### F05. 공유/초대 확산

목표: 친구를 앱 안으로 데려와 후보 풀과 라운드 참여율을 늘린다.

```text
Round Complete or Flame Detail or Profile
  → Invite Friends / Share Profile / Reply on SNS
  → Native Share Sheet
  → Friend Opens Link
  → Join/School/Circle Flow
```

상세:

1. 라운드가 끝나거나 Flame을 확인한 뒤 공유 CTA가 보인다.
2. 사용자는 Snapchat/Instagram/문자 공유를 선택한다.
3. 공유 카드에는 결과 문구, 앱 브랜딩, 딥링크가 포함된다.
4. 친구가 링크를 열면 가입/학교 선택/Circle 참여로 이어진다.

Circly 적용:

- 기존 Result Card 스펙과 연결한다.
- Circle 초대 링크를 공유 카드에 포함한다.

## 5. 구현 데이터 모델 관점

Gas식 UI를 Circly에 구현하려면 최소한 아래 상태가 필요하다.

### Onboarding State

```text
User
- id
- display_name
- school_id
- grade
- gender_hint_preference
- onboarding_completed_at

FriendGraph
- user_id
- friend_user_id
- source: contacts | school | invite | circle
- status: suggested | added | blocked
```

### Round State

```text
PollRound
- id
- circle_id or school_id
- opens_at
- closes_at
- question_count
- current_index
- status: ready | active | completed | cooldown

PollQuestion
- id
- round_id
- template_id
- emoji
- prompt
- candidates[4]
```

### Vote/Flame State

```text
Vote
- id
- question_id
- selected_user_id
- voter_hash
- created_at

Flame
- id
- receiver_user_id
- question_id
- sender_hint_gender
- sender_hint_grade
- read_at
- created_at
```

### Monetization State

```text
Subscription
- user_id
- provider: revenuecat
- entitlement: god_mode
- active_until

HintUnlock
- flame_id
- user_id
- level
- unlocked_at
```

## 6. Circly 적용 우선순위

### P0: 반드시 재현할 것

- 첫 화면에서 "투표하기 → Flame 받기"를 즉시 이해시키는 Welcome
- 질문 1개 + 후보 4명 + `1 of 12` 진행도
- 후보 탭 즉시 제출
- Skip/Shuffle
- 라운드 완료 후 cooldown
- Inbox에서 받은 칭찬 리스트
- Flame 상세의 제한 힌트

### P1: 제품 루프 강화를 위해 필요

- 코인/참여 보상
- 알림 권한 유도
- 친구 초대/공유 카드
- 후보 부족 시 초대 우선 화면
- 받은 Flame 기반 Paywall 진입

### P2: 신중히 검토할 것

- 성별/학년 기반 힌트
- God Mode의 신원 공개
- Crush 타겟팅
- 외모/연애성 질문
- 학교/실명/학년 공개 프로필

## 7. Safety Notes

Gas가 성공한 이유는 익명성과 학교 네트워크의 강한 긴장감이지만, Circly가 중고등학생 대상이라면 같은 요소가 리스크가 될 수 있다.

필수 안전 원칙:

- 사용자가 직접 질문을 만들 수 없게 한다.
- DM/댓글/공개 타임라인을 만들지 않는다.
- 질문 템플릿은 긍정/비교 완화 기준으로 운영자가 관리한다.
- 자기 자신 투표 금지.
- 후보 노출 편향을 완화해 특정 학생이 반복 배제되지 않게 한다.
- 개인정보 힌트는 최소화한다.
- 신고/차단/학교 이탈/계정 삭제 플로우를 쉽게 제공한다.
- 결과 공유는 수신자 동의와 민감정보 마스킹을 고려한다.

## 8. Reference Links

- YouTube: `How to use Gas App | Gas School App` - https://www.youtube.com/watch?v=IdpRwM_GNbM
- Elite Daily: `What Is The Gas App? Discord Bought The Compliments-Based Platform` - https://www.elitedaily.com/lifestyle/what-is-gas-app-compliments
- Gabb: `What is the Gas App & Is It Safe for Kids?` - https://gabb.com/blog/is-the-gas-app-dangerous/
- Wikipedia: `Gas (app)` - https://en.wikipedia.org/wiki/Gas_%28app%29

