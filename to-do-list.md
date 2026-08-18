# ✅ Rhythm Runner — 작업 목록

> **목표(판단 기준)**: 플레이어 입장에서 **심플 / 중독성 / 리듬감 / 타격감**.
> 이 4가지에 얼마나 기여하는지로 우선순위를 매겼습니다.
>
> - 진행 기록은 [memory.md](memory.md), 고정 스펙은 [.claude/RhythmGame_Architecture.md](.claude/RhythmGame_Architecture.md)
> - `[x]` = 완료 · `[ ]` = 남은 작업

---

## 🟢 완료된 작업

- [x] **오토런 이동** — 지면 스크롤 일정 속도 유지, 공중 추진력 보정 (`AutoMovePlayer`)
- [x] **카메라 고정** — Damping 0 / DeadZoneY 0.45 / ScreenOffset(0.2, 0.655), 점프 시 화면 흔들림 제거
- [x] **메인 메뉴** — 난이도 3단계 + 게임 시작 + **조작법 / 크레딧 오버레이** (`TitleScreen`)
      — 2026-08-07 확장. 별도 맵이 아니라 map01 위 UIGroup(오토런 배경 유지).
- [x] **난이도 시스템** — SPAWN_INTERVAL + 스크롤 배율 연동, 재시작 시 동일 난이도 유지
- [x] **노트 스폰/이동/판정** — 4레인, Perfect(±20) / Good(±60) / Miss
- [x] **노트 ↔ 월드 해저드 1:1 페어링** — 화살표마다 장애물/몬스터 1개, 속도 동기화
- [x] **레인별 아바타 공격 모션** — swingO1 / swingO2 / stabO1 / swingO3 (한손검 장착)
- [x] **레인별 슬래시 VFX** — SlashArcBlue / Orange / Cyan + BlastWave
- [x] **점프 / 2단 점프** — Space, 착지 시 카운트 리셋
- [x] **게임오버 화면** — 딤 + 패널 + Restart / Home 버튼
- [x] **스테이지 4단계** — WARM-UP / ACCELERATION / RUSH / FINAL — 2026-08-07
      난이도 축 4개(스크롤 속도 · 노트 밀도 · 패턴 복잡도 · 판정 관대함)가 함께 상승.
      스테이지별 BGM + `STAGE N 이름` 배너. 테이블 기반이라 5단계 추가는 배열 한 칸씩.
      ＋ 예전 스테이지2의 버그 2개 동시 수정: RunSpeed compound(재시작 후 부스트 잔존),
      DarkOverlay 를 켜고 안 꺼서 스테이지2 이후 화면이 계속 어둡던 문제.
- [x] **몬스터 / 장애물 스프라이트** — 슬라임 · 뿔버섯 · 배럴 · 선인장 · 가시함정
- [x] **타이틀 버튼 SFX** — 클릭 / 호버
- [x] **타격 SFX** — 히트(모든 판정) / 퍼펙트 추가 레이어 / 미스 / 콤보 마일스톤 — 2026-07-29 (1차)
- [x] **히트스톱 + 카메라 셰이크** — 퍼펙트 5프레임·굿 3프레임, 미스는 셰이크만 — 2026-07-29 (1차)
- [x] **판정 텍스트 연출** — 스케일 팝 + 레인 위쪽으로 위치 이동 — 2026-07-29 (1차)
- [x] **콤보 연출 강화** — 10/20/30 단계별 색·크기, 10콤보마다 전용 SFX+셰이크 — 2026-07-29 (1차)
- [x] **레인 가독성** — 레인 레일 / 상시 표시 판정박스 / 레인별 색 / 방향키 힌트 교정 — 2026-07-29 (1차)
- [x] **UI 직렬화 에러 60여 개 제거** — 배열형 Color → 오브젝트형 (1차 부수 수정)
- [x] **점수 / HP HUD 신설** — 상단 중앙 점수, 좌상단 HP 바 — 2026-07-29 (2차)
- [x] **`DEBUG_MODE` 무적 제거** — `ObstacleManager.Invincible = false` 로 이관 — 2026-07-29 (2차)
- [x] **HP 이중 관리 통일** — 서버 `PlayerComponent.Hp` 단일 소스 + `NotifyHp` 미러링 — 2026-07-29 (2차)
- [x] **BGM + 비트 그리드** — 스테이지1/2 트랙, `SPAWN_INTERVAL = (60/BPM) × BeatsPerNote` — 2026-07-29 (2차)
- [x] **노트 패턴화** — 계단/트릴/연타/지그재그 등 10개 프레이즈, 소진 시 랜덤 재추첨 — 2026-07-29 (2차)
- [x] **플레이어가 이동 방향(오른쪽)을 보도록 수정** — 2026-08-07, **스크린샷 검증 완료**
      진짜 원인은 `LookDirectionX` 가 아니라 **아바타 루트의 `Scale.x`**(-1=왼쪽 / +1=오른쪽).
      `AutoMovePlayer:EnforceAvatarFacing()` 이 매 프레임 음수면 뒤집는다.

---

## 🔴 우선순위 [상] — 이게 없으면 게임이 성립 안 됨

- [ ] **0-b. 좌상단 HP 바가 화면에 안 보인다** (2026-08-07 플레이 화면에서 발견)
      `hpBarFill=true` 로 바인딩되고 값도 갱신되는데 스크린샷에 안 나온다.
      최상단 어두운 배경에 묻혔거나 다른 UIGroup 에 가려졌을 가능성. 위치/`GroupOrder` 확인 필요.

- [ ] **0-c. 점수 텍스트가 기본 닉네임·HP 바와 겹침** — 상단 중앙 `0` 이 캐릭터 이름표와 충돌.
      좌/우 상단으로 이동 권장.

- [ ] **2-b. BPM 실측 튜닝** (2차에서 절반만 해결)
      BGM 재생과 비트 그리드(`SPAWN_INTERVAL = (60/BPM) × BeatsPerNote`)는 들어갔지만
      `BPM = 120` 은 **실측값이 아니라 자리표시자**다. `BgmStage1` 트랙을 귀로 듣고 맞춰야
      노트가 진짜 박자에 떨어진다. 값 하나만 고치면 차트 전체가 따라감.

---

## 🟡 우선순위 [중] — 재미(타격감·중독성)를 실제로 끌어올림

- [ ] **11. 결과 화면** — 게임오버에 최종 점수 / 최대 콤보 / Perfect·Good·Miss 수 / 정확도(%).
      "다음엔 더" 동기 부여. **2차에서 유일하게 손도 못 댄 항목.**
      필요 작업: `RhythmLogic` 에 `maxCombo` / `perfectCount` / `goodCount` / `missCount` 누적
      → `GameOverPanel` 아래에 통계 텍스트를 UIBuilder 로 추가 → `TriggerGameOver` 에서 채우기.
      ⚠️ 신규 UI 텍스트는 `TextGUIRendererComponent` 가 생성되므로 스크립트도 그쪽으로 읽어야 함
      (기존 `ComboText`/`JudgmentFeedback` 은 레거시 `TextComponent`).

- [ ] **13. 런타임 에러 정리** (2차에서 부분만 해결)
      - `chasemonster` 스폰마다 `Invalid RUID Format ... null` — `Neutralize()` 에서
        `DamageSkin*`/`HitEffectSpawner` 를 다 꺼도 계속 뜸. 모델 인스턴스화 시점 발생으로 추정.
        → `Global/NativeModel/ChaseMonster.model` 을 `MyDesk/Models/Monsters/` 로 복사해
          빈 RUID 를 채운 전용 모델 사용 (Global 은 읽기 전용 정책)
      - `LEA-3028 MissingModel: 'mushroom'` — map01 엔티티가 없는 모델 참조 → MapBuilder 로 제거
      - `LEA-3005 InvalidArgument` — `CostumeManagerComponent` 의 `096bb827…` 가 잘못된 카테고리.
        `Global/DefaultPlayer.model` 로 추정 → Global 이라 사용자 확인 필요
      - 레거시 파일 정리: `Runner/AutoRunner.mlua`, `UIMyInfo*`, `UIPopup`, `UIToast`
        (`PlayerAttack`/`PlayerHit` 은 DefaultPlayer 에 붙어 있을 수 있으니 참조 확인 후)

---

## ⚪ 우선순위 [하] — 있으면 좋지만 나중

- [ ] **14. 랭킹 / 리더보드** — `msw-packages` 에 기성 패키지 있는지 먼저 확인
- [ ] **15. 곡 선택 화면** — BGM(2번)이 들어간 뒤에 의미 있음
- [ ] **16. 튜토리얼 / 첫 플레이 안내** — 지금은 타이틀 한 줄 설명이 전부
- [ ] **17. 보스전** — 스테이지 4단계는 완료. 남은 건 최종 보스 같은 별도 컨텐츠.
      스테이지3에 **더블 노트**(같은 박에 2레인 동시)를 넣는 것도 후보 —
      노트↔해저드 1:1 은 유지되므로(각 노트가 각자 해저드를 가짐) 불변식과 충돌하지 않는다.
- [ ] **18. 아바타 커스터마이징 / 스킨**
- [ ] **19. 모바일 대응** — 터치 입력, 9.6×5.4 안전 영역
- [ ] **20. 임시 측정 코드 제거** — `measuringHighJump`, `jumpSeqPeakY`, `MEASURED ...` 로그
- [ ] **21. 미사용 코드 제거** — `ObstacleManager`의 `SpawnAhead`/`HitRange`/`ClearRange`/
      `ObstacleInterval`/`MaxConcurrentObstacles`/`Tier1·2Duration`/`CountActiveObstacles()`,
      `RhythmLogic:DoHighJump()`(호출처 없음)
- [ ] **22. 아키텍처 문서 §3 갱신** — `JUDGE_X`/판정 윈도우/`laneY`가 코드와 불일치

---

## 🚩 진행 이력 요약

**1차 (완료)** — [중] 5개: 타격 SFX / 히트스톱+셰이크 / 판정 텍스트 연출 / 콤보 연출 / 레인 가독성
(＋부수로 UI 색상 직렬화 에러 60여 개 제거)

**2차 (5.5 / 7)**

| # | 항목 | 상태 |
|:-:|---|---|
| 1 | 점수 / HP HUD 신설 | ✅ |
| 2 | `DEBUG_MODE` 무적 제거 → `ObstacleManager.Invincible` | ✅ |
| 3 | HP 이중 관리 통일 (서버 단일 소스 + `NotifyHp`) | ✅ |
| 4 | BGM + 비트 그리드 | ✅ (BPM 청감 튜닝 남음 → [상]2-b) |
| 5 | 결과 화면 | ⬜ 미착수 → [중]11 |
| 6 | 노트 패턴화 (10개 프레이즈) | ✅ |
| 7 | 런타임 에러 / 레거시 정리 | 🔶 부분 → [중]13 |

---

## ▶️ 다음 세션 권장 순서

1. **[상]0-b HP 바 안 보임 / 0-c 점수 겹침** — 플레이 화면에서 바로 눈에 띄는 문제.
2. **[상]2-b BPM 튜닝** — 값 하나 고치는 작업인데 "리듬 게임"의 체감이 여기서 갈림.
3. **[중]11 결과 화면** — 2차에서 유일하게 손 못 댄 항목.
4. **[중]13 런타임 에러 정리** — 콘솔이 깨끗해야 다음 버그가 보임.

> **테스트 요령** (매번 다시 알아내지 말 것):
> 타이틀의 시작 버튼은 `mouse_input` 으로 못 누른다(엔진 UI). 대신
> `maker_execute_script` 로 `_TitleScreen:Hide(); _RhythmLogic:StartGame("normal")` 하면
> 게임 코드를 안 건드리고 플레이 상태로 들어간다. 판정도 `noteActive[i]` / `noteX[i]` 를
> 직접 세팅한 뒤 `HitLane(lane)` 을 부르면 결정적으로 재현된다.
> **단, 시각적 항목(방향·연출)은 로그가 아니라 `maker_screenshot` 으로 확인할 것.**
