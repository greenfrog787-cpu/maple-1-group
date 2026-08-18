# 📒 작업 메모 (memory.md)

> 이 파일은 **작업 로그**입니다. 작업을 할 때마다 아래 "작업 로그"에 한 항목씩 추가합니다.
> 좌표/고정값 등 **설계 스펙**은 `.claude/RhythmGame_Architecture.md` 에 있습니다. (설계가 바뀌면 그쪽을 먼저 갱신)

---

## 1. 프로젝트 개요

MSW(MapleStory Worlds) 프로젝트 — **오토런(auto-run) + 리듬 액션** 게임.

플레이어는 계속 오른쪽으로 자동 달리고, 화면 오른쪽에서 왼쪽으로 흘러오는 **화살표 노트**를
방향키로 정확한 타이밍에 눌러서 월드에 실제로 스폰된 **장애물/몬스터**를 파괴한다.
노트를 놓치면 그 노트에 짝지어진 장애물이 플레이어에게 데미지를 준다.

핵심 설계 결정 (코드 주석에 근거가 남아 있음):
- **노트 1개 = 월드 해저드 1개** 로 1:1 페어링. 해저드는 `RhythmLogic:SpawnNote()` 에서만 스폰됨.
- 판정은 **전적으로 노트(UI)** 가 담당. 물리 접촉 데미지는 폐기됨
  (접촉 시점이 노트 판정선 도달보다 한 박자 반 빨라서 사용 불가로 판명).
- `NOTE_SPEED = AutoMovePlayer.RunSpeed × UI_PX_PER_WORLD_UNIT(150)` 로 항상 재계산.
  화살표와 지면이 같은 화면 속도로 움직여야 페어링이 유지되기 때문. 직접 지정 금지.

---

## 2. 현재 파일 구조 / 역할

### 스크립트 (`RootDesk/MyDesk/`)

| 파일 | 종류 | 역할 | 상태 |
|---|---|---|---|
| `Rhythm/RhythmLogic.mlua` | `@Logic` ClientOnly | **메인 게임 로직**. 노트 스폰/이동/판정, 콤보·점수, HP, 게임오버, 스테이지2, 아바타 액션·슬래시 VFX, 난이도 적용 | 핵심, 가장 큼(≈1070줄) |
| `Rhythm/ObstacleManager.mlua` | `@Logic` Server | 월드 해저드(장애물/몬스터) 스폰·제거·데미지. 클라 요청(`RequestSpawn/Clear/Miss/ClearAll`) 처리 | 동작 중 |
| `Rhythm/TitleScreen.mlua` | `@Logic` ClientOnly | 타이틀 화면, 난이도 선택(easy/normal/hard), 시작 버튼, 클릭/호버 SFX | 동작 중 |
| `Runner/AutoMovePlayer.mlua` | `@Logic` ClientOnly | 자동 달리기, 카메라 고정(Damping 0 / DeadZoneY 0.45 / ScreenOffset 0.2,0.655), 공중 추진력 보정 | 동작 중 |
| `Runner/AutoRunner.mlua` | `@Component` Server | **구버전** 스크롤/몬스터 스폰. `mushroom`/`boss` 모델 참조 → 프로젝트에 없음 | ⚠️ 레거시(미사용 추정) |
| `Monster.mlua` | `@Component` | 몬스터 HP/사망/리스폰/피격 플래시(`hitFlashTick` @Sync) | ObstacleManager가 플래시 트리거로 사용 |
| `MonsterAttack.mlua` | `@Component` AttackComponent | 몬스터 근접 공격 | ObstacleManager가 `Neutralize()`로 비활성화 |
| `PlayerAttack.mlua` / `PlayerHit.mlua` | `@Component` | 표준 전투 컴포넌트 | ⚠️ 리듬 판정이 전투를 대체 → 사실상 미사용 |
| `UIPopup / UIToast / UIMyInfo / UIMyInfoSimple.mlua` | - | MSW 기본 템플릿 UI | ⚠️ 미사용 추정 |

### 데이터

- `map/map01.map` — 게임 플레이 맵 (`/maps/map01`, TileMapMode 0)
- `map/mainmenu.map` — 메인메뉴 씬 (`/maps/mainmenu`, TileMapMode 0) — 2026-08-17 신설.
  ⚠️ **발판(Foothold) 0개** / `Global/SectorConfig.config` 에 `map://mainmenu` 미등록 → §4 참고
- `ui/RhythmGame.ui` (order 3) — 게임 플레이 HUD. 총 88 엔티티:
  - 노트 20개(`Note_{A,S,D,F}_0~4`, 각각 `Fill`+`Label` 자식)
  - 판정 영역: `LaneRail_{A,S,D,F}`(상시 레일) / `KeyFlash_{A,S,D,F}`(상시 판정박스) /
    `KeyHint_{A,S,D,F}`(▲◀▶▼) / `JudgeLine`
  - HUD: `ScoreText`(상단중앙) / `HPBarBg` → 자식 `HPBarFill`·`HPLabel`(좌상단)
  - 연출: `JudgmentFeedback`, `ComboText`, `DarkOverlay`, `Stage2Banner`
  - `GameOverPanel` → 자식 `Title`/`BtnRestart`/`BtnHome`
  > ⚠️ **텍스트 컴포넌트가 두 종류 섞여 있다.** 신규(`ScoreText`/`HPLabel`)는 UIBuilder 가 만든
  > `TextGUIRendererComponent`, 기존(`ComboText`/`JudgmentFeedback`/노트 `Label`)은 레거시
  > `TextComponent`. 잘못된 쪽으로 `GetComponent` 하면 nil 이 와서 텍스트가 조용히 안 바뀐다.
- `ui/TitleScreen.ui` (order 50) — 타이틀
- `ui/DefaultGroup.ui`, `ui/PopupGroup.ui`, `ui/ToastGroup.ui` — 기본 템플릿
- `RootDesk/MyDesk/Models/Obstacles/ObstacleLow.model`, `ObstacleHigh.model` — 지상 장애물

---

## 3. 현재 게임플레이 흐름

```
월드 시작 (mainmenu 씬)
 → TitleScreen  — 난이도 선택(easy/normal/hard) + 플레이/조작법/크레딧
 → 플레이 클릭 → TeleportToMapPosition("map01")
 → TitleScreen:OnUpdate 가 CurrentMap 폴링 → 도착 감지
 → RhythmLogic:StartGame(diff) → ApplyDifficulty() + RestartGame() + StartBgm() → gameStarted = true
 → SPAWN_INTERVAL 마다 SpawnNote(): NextPatternLane() 이 고른 레인 노트 활성화
                                   + ObstacleManager:RequestSpawn(lane, 절대 spawnX)
 → 방향키 입력 → FlashKey / HitLane(판정) / PlayLaneAction(아바타 모션 + 슬래시 VFX)
    · 히트 → PlayHitFeel(SFX+히트스톱+셰이크) + PopCombo + ObstacleManager:RequestClear(lane)
    · 미스 → PlayMissFeel(SFX+셰이크) + ObstacleManager:RequestMiss(lane)
              → 서버가 PlayerComponent.Hp 차감 → NotifyHp → SetHpDisplay(HUD 갱신)
 → 점수 20000 → EnterStage2() (스크롤 ×1.5, 0.75비트 간격, 스테이지2 BGM, 배너)
 → HP 0 → 서버 NotifyPlayerDead → TriggerGameOver() → 게임오버 패널 (Restart / Home)
 → Home → GoHome() → TeleportToMapPosition("mainmenu") → 메뉴로 복귀
```

> ⚠️ 씬 전환 감지는 **폴링**이다. `@Logic` 은 `OnMapEnter`/`OnMapLeave` 를 받지 못하기 때문
> (핸들러를 달면 컴파일은 되지만 절대 호출되지 않는 죽은 코드가 된다).

> **HP 소유권**: 서버 `PlayerComponent.Hp` 가 **유일한 원본**. `RhythmLogic.hp` 는 표시용 미러일 뿐.
> 무적 스위치는 `ObstacleManager.Invincible`(기본 false). 예전 `RhythmLogic.DEBUG_MODE` 는 제거됨.

### 레인 매핑 (고정)

| lane | 키 | 화살표 글리프 | UI 엔티티 | 아바타 액션 | 월드 해저드 |
|:-:|---|---|---|---|---|
| 1 | ↑ | `^` | `Note_D_*` | `swingO2` + BlastWave | 높은 장애물 `obstaclehigh` |
| 2 | ← | `<-` | `Note_A_*` | `swingO1` + SlashArcBlue | 몬스터 `movemonster` (슬라임) |
| 3 | → | `->` | `Note_F_*` | `stabO1` + SlashArcOrange | 몬스터 `chasemonster` (뿔버섯) |
| 4 | ↓ | `v` | `Note_S_*` | `swingO3` + SlashArcCyan | 낮은 장애물 `obstaclelow` |

> ⚠️ `noteNames = { "D", "A", "F", "S" }` — 노트 그룹 이름과 레인 번호가 **일부러 어긋나 있음**.
> 각 그룹이 고정된 화살표 그림을 갖고 있어서, 원하는 위→아래 순서(^ ← → v)를 만들려고 재배치한 것.

### 판정 (UI px, 모든 박스 pivot 0.5 = 중심 좌표)

- `JUDGE_X = -550`, KeyFlash 박스 폭 120, 노트 폭 80
- `PERFECT_WINDOW = 20` → 박스에 완전히 들어감 → 300점
- `GOOD_WINDOW = 60` → 화살표 절반 이상 겹침 → 100점
- 초과 → Miss (콤보 0, `RequestMiss`)

### 스테이지 (4단계, 2026-08-07~)

난이도 축이 **4개**다. 속도만 올리면 단조로워서, 스테이지마다 성격을 다르게 줬다.

| 스테이지 | 이름 | 진입 점수 | 스크롤 배율 | 노트 간격(비트) | 패턴 풀 | 판정 |
|:-:|---|--:|:-:|:-:|---|---|
| 1 | WARM-UP | 0 | ×1.0 | 난이도값 | 단순 4종(계단·연타) | 기본 |
| 2 | ACCELERATION | 20,000 | ×1.3 | 1.25 | +교차 3종 = 7종 | 기본 |
| 3 | RUSH | 50,000 | ×1.6 | 1.0 | 전체 10종 | 기본 |
| 4 | FINAL | 90,000 | ×2.0 | 0.75 | 전체 10종 | **퍼펙트 20→14 / 굿 60→45** |

- 스테이지마다 **BGM 교체** (`BgmStage1~4`) + `STAGE N 이름` 배너.
- `ApplyStage(n)` 하나가 속도·밀도·판정창·패턴풀·BGM 을 전부 설치한다.
  라운드 시작(=`ApplyStage(1)`)과 승격이 **같은 경로**를 타므로 두 경로가 어긋날 수 없다.
- **스크롤 속도는 항상 `BASE_RUN_SPEED × 난이도배율 × 스테이지배율`** 로 계산한다.
  예전 `EnterStage2` 는 살아 있는 `RunSpeed` 에 곱해서(compound) 재시작 때 부스트가 남았다.
- 난이도와 스테이지는 곱해진다: hard(×1.3) + 스테이지4(×2.0) → `1.76 × 1.3 × 2.0 = 4.576`.
- ⚠️ 예전 `EnterStage2` 는 `DarkOverlay`(게임오버 딤)를 켜고 끄지 않아서 **스테이지2 이후 화면이
  계속 어두웠다.** 제거함 — 배너·BGM·속도 변화로 충분히 전달되고, 딤은 레인 가독성을 해친다.

### 난이도 (비트 그리드 기반 — 스테이지 1의 시작점)

`SPAWN_INTERVAL` 은 더 이상 상수가 아니라 **파생값**: `(60 / BPM) × BeatsPerNote`.
난이도는 초가 아니라 **비트 수**로 표현한다. (`BPM = 120` 기준 아래 표)

| 난이도 | BeatsPerNote | SPAWN_INTERVAL | RunSpeed 배율 | NOTE_SPEED (BASE 1.76 기준) |
|---|:-:|:-:|:-:|:-:|
| easy | 2.0 | 1.0 | 0.8 | 211.2 |
| normal | 1.5 | 0.75 | 1.0 | 264.0 |
| hard | 1.0 | 0.5 | 1.3 | 343.2 |
| stage2 | 0.75 | 0.375 | (현재 ×1.5) | 재계산 |

> BPM 을 바꾸면 **밀도만** 변한다. 노트↔해저드 페어링은 `NOTE_SPEED = RunSpeed × 150` 이
> 따로 잡고 있어서 BPM 과 무관하게 유지된다.

### 노트 패턴 (2026-07-29~)

레인 선택이 `math.random(1,4)` 에서 **프레이즈 10종**으로 바뀌었다 (`BuildNotePatterns`).
계단 상/하행, 좌우 트릴, 바깥 교차, 연타, 지그재그 등. `NextPatternLane()` 이 현재 프레이즈를
끝까지 소진한 뒤 새 프레이즈를 추첨한다. 리스타트 시 프레이즈 경계에서 시작.

### 사운드

| 용도 | 종류 |
|---|---|
| BGM 스테이지1 | `fb2ae50a8aeb49c29c04bc3db91e7e6a` (115s, 밝은 신스) |
| BGM 스테이지2 | `32330a23b78a4c9cbc56e9d05d985a06` (92s, 록/오케) |
| 히트(모든 판정) | `df9c5ddbc2f849609cf7c9dc3ce1dfc9` (0.44s 검격) |
| 퍼펙트 추가 레이어 | `796a7d6af19d4dff8d265bd4f768f21d` (0.91s 차임) |
| 미스 | `174d501eccd04eadbd6c6411d4ade7e7` (0.89s 에러음) |
| 콤보 마일스톤(10마다) | `c6813615a6fc4850b907302a698ffae5` (1.58s 축하음) |
| 타이틀 클릭 / 호버 | `972843e7…` / `159bf70a…` |

---

## 4. 미해결 / 주의 항목

> 우선순위가 매겨진 전체 작업 목록은 [to-do-list.md](to-do-list.md) 참고. 아래는 코드를 읽을 때 알아야 할 주의점 위주.
> (2026-07-29 기준으로 갱신 — DEBUG_MODE / HUD 부재 / HP 이중관리 / BGM 부재는 **모두 해결됨**)

### ✅ 해결 — 아바타 방향 (2026-08-07, **스크린샷으로 검증 완료**)

**원인**: 아바타의 **렌더링 flip 은 `AvatarRendererComponent:GetAvatarRootEntity()` 의
`TransformComponent.Scale.x` 가 쥐고 있고, 이 값은 `PlayerControllerComponent.LookDirectionX` 를
따라오지 않는다.** 플레이 중 실측:

```
LookDirectionX = 1.0   IsFaceLeft() = false   <- 논리는 전부 "오른쪽"
avatarRoot.Scale.x = -1.0                     <- 그런데 렌더는 X 반전 = 왼쪽
body.Scale.x = 1.0                            <- body 가 아니라 root 에 걸린다
```

**스크린샷 A/B 로 확정한 규칙** (추측 아님, 눈으로 비교함):

| `avatarRoot.Scale.x` | 렌더 결과 |
|---|---|
| `-1` | 칼이 왼쪽 -> **왼쪽** 봄 |
| `+1` | 칼이 오른쪽 -> **오른쪽** 봄 ✅ |

**수정**: `AutoMovePlayer:EnforceAvatarFacing()` — 매 프레임 `Scale.x < 0` 이면 부호를 뒤집는다.
매 프레임 검사하는 이유는 상태 전환 때 아바타가 다시 칠해지면서 반전이 복구될 수 있어서.
(부호 비교 한 번이라 비용은 무시할 수준)

> ⚠️ **이 항목이 두 번 실패했던 이유** — `LookDirectionX` / `FixedLookAt` 은 **논리적 방향**만 바꾼다.
> 그걸 고치고 `faceLeft=false` 로그를 근거로 두 번 "PASS" 라고 보고했지만 화면은 그대로였다.
> **방향·연출 같은 시각적 항목은 로그로 판정하면 안 되고 반드시 `maker_screenshot` 으로 봐야 한다.**
> (`FixedLookAt` 은 결국 원인이 아니었다. 현재 `0` 으로 두고 있고 그대로 두면 된다.)

### 🔴 Maker 에서 사람이 해야 하는 것 (2026-08-17, 코드로 못 고침)

- [ ] **`mainmenu` 맵에 발판이 0개** → 플레이어가 무한 낙하한다. Maker 에서 Foothold 를 그려야 함.
      (발판 작성은 MapBuilder 커버리지 밖 — Maker UI 전용 작업)
- [ ] **`Global/SectorConfig.config` 에 `map://mainmenu` 미등록** — 현재 `map://map01` 만 있다.
      `Global/` 은 읽기 전용 정책이라 코드로 못 넣는다.
- [ ] **월드 시작 맵이 아직 `map01` 일 수 있음** → Maker 에서 `mainmenu` 로 변경 필요.
- [ ] **`Global/DefaultPlayer.model` 의 `CustomPantsEquip` 에 신발 아이템(`096bb827…`)이 들어 있다**
      → `LEA-3005 InvalidArgument` 의 실제 원인. 바지 슬롯에 신발이라 카테고리가 안 맞는다.
      Maker 에서 해당 슬롯을 비워야 함.

### 그 외 주의 항목

- [ ] **`AutoMovePlayer.lastX` 가 리스타트/리스폰 때 초기화되지 않는다** (2026-08-17 발견, 미수정).
      리스타트 직후 X 보정이 옛 좌표를 기준으로 계산될 수 있다. 조사 중 다른 작업으로 넘어가면서 중단됨.
- [ ] **메뉴 리스타일 / 배경 끄기가 화면 미검증** — Maker MCP 끊김 상태에서 저장만 했다.
      Maker Refresh 후 육안 확인 필요. (§5 2026-08-17 마지막 항목)
- [ ] **메뉴 배경 이미지 미적용** — 사용자가 준 `4bae573b-4837-4c8d-8318-7cdff89152fd` 는
      하이픈 포함 36자로 MSW RUID(32자 hex) 형식이 아니다. 공개 검색·계정 리소스·프로젝트 어디에도 없음.
      32자 형태로 다시 받아야 함. 버튼 이미지도 같은 이유로 보류(미리보기를 못 봐서 9-slice 선택 불가).
- [ ] **`chasemonster` 스폰마다 `Invalid RUID Format ... null`** — `Neutralize()` 에서
      `DamageSkin*` / `HitEffectSpawner` 를 다 껐는데도 계속 뜬다. 스크립트가 끄기 **전**,
      모델 인스턴스화 시점에 발생하는 것으로 추정.
      → `Global/NativeModel/ChaseMonster.model` 을 `MyDesk/Models/Monsters/` 로 복사해
        빈 RUID 를 채운 전용 모델을 쓰는 것이 정공법 (Global 은 읽기 전용 정책).
- [ ] **`LEA-3028 MissingModel: 'mushroom'`** — map01 의 엔티티가 없는 모델 참조. MapBuilder 로 제거.
- [ ] **`LEA-3005 InvalidArgument`** — `CostumeManagerComponent` 의 `096bb827…` 가 유효한 아이템
      카테고리가 아님. `Global/DefaultPlayer.model` 쪽 값으로 추정 → Global 이라 사용자 확인 필요.
- [ ] **`BPM = 120` 은 실측이 아니라 자리표시자** — `BgmStage1` 트랙을 귀로 듣고 맞춰야
      노트가 진짜 박자에 떨어진다. 값 하나만 고치면 차트 전체가 따라감.
- [ ] **레거시 파일 정리** — `Runner/AutoRunner.mlua`(없는 `mushroom`/`boss` 모델 참조),
      `PlayerAttack` / `PlayerHit` / `UIMyInfo*` / `UIPopup` / `UIToast`.
      ⚠️ `PlayerAttack`/`PlayerHit` 은 `Global/DefaultPlayer.model` 에 붙어 있을 수 있으므로
      삭제 전 `.model`/`.map` 참조 확인 필수.
- [ ] **측정용 임시 코드 잔존** — `measuringHighJump`, `jumpSeqPeakY`, `MEASURED ...` 로그.
      점프 캘리브레이션은 끝났으므로 제거 가능.
- [ ] **`DoHighJump()` 는 호출되지 않음** — lane 1이 점프에서 지상 공격으로 바뀌면서
      `PlayLaneAction` 안에서 주석 처리됨. Space 점프만 살아 있음.
- [ ] **`.claude/RhythmGame_Architecture.md` §3 이 코드와 불일치** — 문서에는
      `JUDGE_X = 0.0`, `PERFECT_WINDOW = 80`, `GOOD_WINDOW = 160`, `NOTE_SPEED = 95`,
      `SPAWN_INTERVAL = 1.5`, `laneY = { -200, -280, -360, -440 }` 로 적혀 있으나
      실제 코드는 `-550 / 20 / 60 / RunSpeed에서 재계산 / 비트 파생 / { -270, -340, -430, -500 }`.
      (§1 의 laneY 표는 코드와 일치 — §3만 옛날 값) → 문서 §3 갱신 필요.

---

## 5. 작업 로그

> 형식: `### YYYY-MM-DD — 제목` / 무엇을 / 왜 / 건드린 파일 / 검증 결과

> ⚠️ 아래 **2026-08-17** 5개 항목은 그날 한 작업이 아니라, 8/7 이후 기록이 밀려 있던 분량을
> 8/17 에 **소급해서 한꺼번에 적은 것**이다. 개별 작업일은 남아 있지 않다(git 저장소가 아님).
> 순서는 실제 작업 순서를 따랐다. 앞으로는 작업할 때마다 그때그때 적을 것.

### 2026-08-17 — 레인별 아바타 액션 + 슬래시 VFX (소급 기록)

- **무엇을**: 레인마다 다른 공격 모션을 붙이고(1↑ `swingO2` / 2← `swingO1` / 3→ `stabO1` / 4↓ `swingO3`),
  각각에 전용 이펙트를 깔았다. `SlashArcBlue/Orange/Cyan` + 1번 레인은 `BlastWave`(장풍).
- **왜 어려웠나 — MSW 아바타는 달리기와 공격을 합성할 수 없다.**
  몸통은 한 번에 클립 하나만 재생한다. `CoreActionName`(맨몸) / `PartsActionName`(장비) 는
  상체·하체 분리가 **아니다.** 그래서 "달리면서 칼 휘두르기"를 애니메이션 합성으로는 못 만든다.
  - 해결: `AvatarStateAnimationComponent:RemoveActionSheet("IDLE"/"MOVE")` 로 상태머신이
    지상 이동 클립을 **다시 칠하지 못하게 매핑을 뜯어내고**, `StartRunLoop()` 로 달리기를 직접 돌린다.
    액션 키가 들어오면 `ACTION_HOLD_DURATION(0.45s)` 동안 공격 클립을 유지했다가 달리기로 복귀.
  - MSW 에 `run` 액션은 없다(`MapleAvatarBodyActionState` 에 Walk 만 존재). "달리기" = walk 클립을
    `RUN_RATE = 2.4` 로 빠르게 돌린 것.
- **이펙트 함정 2개**
  1. `PlayEffectAttached` 에 **`Color` 옵션을 주면 조용히 안 보인다.** 시리얼은 정상적으로 돌아오는데
     화면에 아무것도 안 뜬다 → 색을 주지 말고 **레인마다 다른 클립**을 쓰는 쪽으로 바꿨다.
  2. **원샷 재생은 첫 프레임이 거의 빈 이미지라 안 보인다** (frame0 = 4×4px, frame1 = 384×272).
     → `isLoop = true` 로 틀고 `_TimerService:SetTimerOnce` 로 직접 걷어낸다.
- **건드린 파일**: `Rhythm/RhythmLogic.mlua`
- **검증**: 사용자 육안 확인 — "effect는 모두 보이고 있다". 좌표는 요청대로 왼쪽으로 재조정,
  장풍 크기 `BlastScale = 0.24`(원본의 60%).

### 2026-08-17 — 액션 중에도 월드가 계속 흐르도록 물리 보정 (소급 기록)

- **증상**: 공격 클립이 나가는 동안 플레이어가 제자리에 박혀서 지면·몬스터가 멈춰 보였다.
  배경(BackgroundComponent)만 계속 흘러서 "달리다 멈췄다"가 반복됐다.
- **원인**: 엔진이 공격 클립 재생 중 아바타를 **루팅(rooting)** 한다. 실측 `1.76 → 0.57 u/s`.
- **수정 (지상/공중 분리)**
  - 지상: `MovementComponent:SetWorldPosition(Vector2(expected, pos.y))` 로 매 프레임 X 를 보정.
  - 공중: `Rigidbody:AddForce(Vector2(AirPushForce, 0))` — `AirPushForce = 0.11`.
- **⚠️ 여기서 두 번 헛짚었다 (재발 방지)**
  1. `TransformComponent.Position` 직접 쓰기는 **Rigidbody 가 덮어써서 무효**다.
     (`@Logic` 의 `OnUpdate` 가 컴포넌트보다 먼저 도는 것도 겹침) → `SetWorldPosition` 이어야 한다.
  2. **`SetWorldPosition` 은 텔레포트라서 속도를 0 으로 만든다.** 공중에도 걸었더니 점프 높이가
     0.011 로 뭉개졌다 → 지상에서만 걸도록 게이트.
  - 공중 속도를 "1.99 로 고쳤다"고 한 번 잘못 보고했다. 착지 순간의 따라잡기 텔레포트(몇 프레임에 2유닛)가
    평균을 부풀린 것이고, **비행 구간만 재면 0.72 u/s** 였다. → 그 수치로 `AirPushForce` 를 다시 잡았다.
- **점프 시 지면이 우측으로 미끄러지던 문제**: 카메라 `DeadZone` 을 `(0,0)` 으로 둬서 세로 유지 밴드가
  사라진 것이 원인 → `CameraDeadZoneY = 0.45`. `CameraDamping` 은 비율이 아니라 **시간 상수**로 동작해서
  4.0 을 주면 플레이어가 화면 오른쪽 끝까지 밀린다 → `0.0` 유지.
- **건드린 파일**: `Runner/AutoMovePlayer.mlua`, `Rhythm/RhythmLogic.mlua`
- **검증**: 사용자 육안 확인 — "방금 확인한 jump 상태는 아주 훌륭하다".

### 2026-08-17 — 4개 레인 전부에 해저드 배치 + 판정 완전 분리 (소급 기록)

- **무엇을**: 예전엔 위 레인에만 장애물이 있었다. 이제 `RequestSpawn(lane, spawnX)` 가 레인별로 분기한다 —
  2/3 은 몬스터(`SpawnMonster`), 1/4 는 장애물(`SpawnObstacle`, high/low).
- **몬스터가 회색 점으로 보이던 문제**: 네이티브 몬스터 모델은 `SpriteRUID` 가 **비어서 출고**된다.
  스폰 시점에 이동 애니메이션 클립을 직접 꽂아서 해결 (`MonsterSpriteLane2/3`).
- **`ClearRange` 12.0 → 1.0**: 12 로 두니 **막 스폰된 장애물**이 지워지고 정작 도착한 놈이 남았다(실측 dx=9.97).
  결국 거리 게이트 자체를 신뢰하지 않기로 했다 — 타이밍은 노트 판정이 이미 결정하므로 거리로 다시 거를 이유가 없다.
- **접촉 데미지 완전 폐기**: 장애물은 더 이상 부딪혀도 안 아프다. 판정은 100% 노트가 갖는다
  (§1 의 설계 결정과 일치). 클라/서버 플레이어 X 좌표 드리프트를 의심했으나 **실측 0.00** 으로 기각.
- **건드린 파일**: `Rhythm/ObstacleManager.mlua`, `Rhythm/RhythmLogic.mlua`
- **검증 (PASS)** — 레인별 집계: 109개 스폰 / 44개 파괴 = 키 입력 44회, 실패 0.

### 2026-08-17 — 게임오버 UI (소급 기록)

- **무엇을**: 화면 중앙 "게임 오버" 창 + 그 아래 절반 크기 **다시하기** / 같은 크기 **홈** 버튼.
  `ui/RhythmGame.ui` 의 `GameOverPanel` 아래에 `Title`/`BtnRestart`/`BtnHome`.
- **🔴 죽어도 창이 안 뜨던 버그**: `DamagePlayer` 가 HP 0 이 되면 `PlayerComponent:Respawn()` 을
  **조용히** 호출하고 끝나서 클라가 죽음을 알 방법이 없었다.
  → `ObstacleManager:NotifyPlayerDead()` (`@ExecSpace("Client")`) 신설 → `RhythmLogic:TriggerGameOver()`.
  `TriggerGameOver` 에는 재진입 가드를 넣었다(연속 피격 시 중복 호출).
- **바인딩**: UIBuilder 가 `.mlua` 프로퍼티 기본값에 UUID 를 주입한다. 단 **프로퍼티가 `.mlua` 에 먼저
  선언돼 있어야** 주입이 된다 — 없는 이름으로 `injectBindings` 하면 실패한다.
- **건드린 파일**: `ui/RhythmGame.ui`(UIBuilder), `Rhythm/RhythmLogic.mlua`, `Rhythm/ObstacleManager.mlua`
- **검증**: 사망 → 패널 표출 확인. 버튼 동작(다시하기/홈) 연결됨.

### 2026-08-17 — 메인메뉴를 별도 씬으로 분리 + 리스타일 (소급 기록)

- **무엇을**: 8/7 항목("별도 맵은 만들지 않았다")을 **뒤집었다.** 사용자가 별도 씬을 요청 →
  `map/mainmenu.map` 신설(사용자가 Maker 에서 생성, TileMapMode 0).
  - `TitleScreen:OnStartPressed()` 가 `StartGame` 대신 `_TeleportService:TeleportToMapPosition` 으로
    `map01` 로 이동. `OnUpdate` 가 현재 맵 이름을 폴링하다가 도착하면 `_RhythmLogic:StartGame(difficulty)`.
  - `RhythmLogic:GoHome()` 도 `_TitleScreen:Show()` 대신 `mainmenu` 로 텔레포트.
  - 난이도 선택은 메인 화면으로 이동. 선택값은 `@Logic` 프로퍼티라 씬 전환을 넘어 살아남는다.
  - ⚠️ **`@Logic` 은 `OnMapEnter`/`OnMapLeave` 를 절대 못 받는다.** 그래서 맵 도착 감지를
    `_UserService.LocalPlayer.CurrentMap` **폴링**으로 했다. 핸들러를 달면 조용한 죽은 코드가 된다.
- **메뉴 리스타일**: 참고 이미지대로 좌측 세로 컬럼형으로 재배치. 타이틀 "MAPLE RHYTHM"(92pt),
  플레이/조작법/크레딧을 아이콘 + 색 버튼(금/하늘/연두)으로.
- **⚠️ 첫 시도가 통째로 날아갔던 이유 (중요)**: `b.write()` 가 lint 에러 4건(L013 off-canvas)으로
  **예외를 던져서 파일이 저장되지 않았다.** 사용자 눈엔 "아무것도 안 바뀜"으로 보였다.
  원인은 기존 엔티티들이 **가장자리 앵커**를 쓰고 있던 것 — `Title` 의 anchor/pivot 이 (0.5, **1**) 이라
  `pos:[0,300]` 이 "Window 상단에서 위로 300" 으로 해석돼 캔버스 밖(y=700)으로 나갔다.
  → **모든 자식 patch 에 `anchor:"middle-center"` + `pivot:[0.5,0.5]` 를 명시**해서 해결.
  (8/7 항목의 "patch 는 Pivot 을 유지한다" 함정과 같은 뿌리다. 두 번 밟았다.)
- **배경**: `mainmenu` 의 `BackgroundComponent` 에 `794ad842…` 를 적용했다가, 사용자 요청으로
  `Enable = false` 로 껐다. 컴포넌트는 남겨뒀으니 플래그 하나로 되돌릴 수 있다.
- **건드린 파일**: `ui/TitleScreen.ui`(UIBuilder), `Rhythm/TitleScreen.mlua`, `Rhythm/RhythmLogic.mlua`,
  `map/mainmenu.map`(MapBuilder)
- **검증 (부분)** — 씬 전환(mainmenu ↔ map01)과 난이도 전달은 동작 확인.
  ⚠️ **리스타일 결과와 배경 끄기는 화면으로 확인하지 못했다** — Maker MCP 연결이 끊긴 상태.
  빌더로 계산한 좌표상으로는 11개 자식 전부 캔버스 안에 들어온다(`Window` 중심 (-520, 0), 900×800).

### 2026-08-07 — 메인 메뉴 (기존 타이틀 확장)

> ⚠️ **이 항목의 "별도 맵을 만들지 않았다"는 결정은 2026-08-17 에 뒤집혔다.**
> 지금은 `map/mainmenu.map` 별도 씬이다. 아래 UIBuilder 함정 2개는 여전히 유효.

- **무엇을**: `ui/TitleScreen.ui` 를 정식 메인 메뉴로 확장. **별도 맵(씬)은 만들지 않았다** —
  사용자가 "map01 위 UIGroup 유지" 쪽을 선택. 오토런 배경 연출과 Home 복귀 흐름이 그대로 유지된다.
  - 창 660 → **780** 으로 키우고 그 사이에 보조 메뉴 2개 추가: **조작법 / 크레딧**
  - `Root/HowToPanel`, `Root/CreditsPanel` 오버레이 신설 (Window 의 형제, 1020×820).
    `Root` 의 자식이라 타이틀이 숨겨질 때 같이 사라진다 → 별도 UIGroup 을 만들지 않은 이유.
  - `TitleScreen.mlua` 에 `OpenPanel()` / `ClosePanels()` 추가. 한 번에 하나만 열리고,
    `Show()` 에서도 닫아 Home 복귀 시 오버레이가 남지 않게 함. 버튼은 기존 `WireButton` 을
    타므로 클릭·호버 SFX 가 자동으로 붙는다.
  - 난이도 설명 문구가 비트 그리드 이전 수치(1.5초/1.0초/0.7초)라 실제와 달랐다 → 실제값으로 교정.
- **UIBuilder 함정 2개 (다음에 또 밟기 쉬움)**
  1. **top 앵커에서 `pos.y` 는 위쪽이 양수다.** 패널 안쪽(아래)으로 내리려면 **음수**를 줘야 한다.
     양수로 줬다가 본문이 패널 위로 통째로 튀어나왔다.
  2. **`patch()` 는 `anchor` 만 바꾸고 `Pivot` 은 기존 값을 유지한다.**
     `middle-center`(pivot 0.5,0.5)로 만든 텍스트를 `top-center` 로 patch 했더니 pivot 이 그대로라
     rect 의 절반이 위로 삐져나왔다. → **앵커를 바꿀 땐 `pivot` 도 같이 명시할 것.**
- **건드린 파일**: `ui/TitleScreen.ui`(UIBuilder), `Rhythm/TitleScreen.mlua`, `memory.md`, `to-do-list.md`
- **검증 (PASS, 스크린샷 3장)** — build 에러 0.
  메인 메뉴 / 조작법 패널 / 크레딧 패널을 각각 캡처해 레이아웃 확인.
  바인딩 6개 전부 `isvalid=true`, 패널 배타 동작(하나 열면 다른 하나 닫힘) 확인.

### 2026-08-07 — 스테이지 4단계로 확장

- **무엇을**: 스테이지 2개(하드코딩) → **4개(테이블 기반)** 로 일반화.
  `BuildStageTable()` 이 이름/점수게이트/속도배율/비트간격/패턴풀/판정창/BGM 을 병렬 배열로 들고 있고,
  `ApplyStage(n)` 하나가 전부 설치한다. 5스테이지 추가는 각 배열에 한 칸씩 넣으면 끝.
- **난이도 축 4개** (속도만 올리면 단조로워서): 스크롤 속도 · 노트 밀도 · **패턴 복잡도** · **판정 관대함**.
  스테이지1은 단순 패턴 4종만 풀리고, 4에서 전체 10종 + 판정창 축소(퍼펙트 20→14).
- **같이 고친 것**
  - 예전 `EnterStage2` 가 `_AutoMovePlayer.RunSpeed` 에 **곱셈**(compound)을 했다 → 항상
    `BASE_RUN_SPEED × 난이도배율 × 스테이지배율` 로 계산하도록 변경.
  - 예전 `EnterStage2` 가 `DarkOverlay`(게임오버 딤)를 켜고 **끄지 않아서** 스테이지2 이후 화면이
    계속 어두웠다 → 제거.
  - `StartGame` 의 중복 `StartBgm` 제거(`ApplyStage(1)` 이 이미 튼다 → 한 프레임 뒤 재시작되던 문제).
  - `stage2Banner*` → `stageBanner*` 로 이름 일반화, 배너 텍스트를 런타임에 `STAGE N 이름` 으로 설정.
- **건드린 파일**: `RootDesk/MyDesk/Rhythm/RhythmLogic.mlua`, `memory.md`, `to-do-list.md`
- **검증 (PASS)** — build 에러 0. 점수를 게이트 위로 올려 4단계를 전부 밟음:
  ```
  S1 stage=1 run=1.76  note=264.0 spawn=0.75  perfect=20 pool=4
  S2 stage=2 run=2.288 note=343.2 spawn=0.625 perfect=20 pool=7
  S3 stage=3 run=2.816 note=422.4 spawn=0.5   perfect=20 pool=10
  S4 stage=4 run=3.52  note=528.0 spawn=0.375 perfect=14 pool=10
  CAP stage=4 (999999점에도 4 유지)      invariant ok=true  ← NOTE_SPEED = RunSpeed×150 항상 성립
  bannerText='STAGE 3  RUSH' enable=true
  AFTER-RESTART stage=1 run=1.76 perfect=20 pool=4 darkOverlay=false  ← 딤 복구 확인
  HARD-S1 run=2.288 / HARD-S4 run=4.576   ← 난이도×스테이지 배율이 곱해짐
  ```

### 2026-08-07 — 아바타 방향 버그 실제 해결 (3번째 시도, 스크린샷 검증)

- **무엇을**: `AutoMovePlayer` 에 `EnforceAvatarFacing()` 추가. 매 프레임
  `AvatarRendererComponent:GetAvatarRootEntity()` 의 `TransformComponent.Scale.x` 가 음수면 부호를 뒤집는다.
  `FixedLookAt` 은 `1` → `0` 으로 되돌리고 순서도 `FixedLookAt` → `LookDirectionX` 로 바꿨다.
- **어떻게 찾았나**: 런타임에서 아바타 렌더 트리의 변환값을 직접 찍어봤다.
  `LookDirectionX=1.0` / `IsFaceLeft()=false` 인데 `avatarRoot.Scale.x = -1.0` 이었다.
  → **논리 방향과 렌더 flip 이 서로 다른 값**이라는 걸 처음으로 확인.
  이어서 `Scale.x` 를 `-1` / `+1` 로 바꿔가며 **스크린샷 2장을 비교**해 `+1` 이 오른쪽임을 확정.
  (`FixedLookAt` 은 범인이 아니었다 — 0 으로 바꿔도 여전히 왼쪽이었음)
- **건드린 파일**: `RootDesk/MyDesk/Runner/AutoMovePlayer.mlua`, `memory.md`, `to-do-list.md`
- **검증 (PASS, 시각 확인)** — build 에러 0.
  - 로그: `[FACE-FIX] avatarRoot.scale.x = 1.0`
  - **스크린샷**: 게임 진행 중(노트 흐르고 슬라임 접근) 캐릭터의 칼이 **오른쪽**을 향함.
    수정 전 스크린샷과 좌우가 명확히 반대.
- **교훈 (같은 실수 3번 방지)**: 시각적 항목을 로그로 PASS 판정하지 말 것.
  `IsFaceLeft()` 같은 API 는 "엔진이 생각하는 방향"이지 "화면에 그려진 방향"이 아니다.
  이번엔 렌더 트리의 Transform 을 직접 찍고 스크린샷 A/B 를 떠서야 원인이 나왔다.
- **플레이 화면을 처음 눈으로 보고 알게 된 것 (신규 이슈)**
  - **좌상단 HP 바가 화면에 안 보인다.** `hpBarFill=true` 로 바인딩은 되어 있고 값도 갱신되는데
    스크린샷에는 없다. 최상단이 어두운 배경이라 묻혔거나 다른 UIGroup 에 가려졌을 가능성.
  - **점수 텍스트가 기본 닉네임/HP 바와 겹친다** — 상단 중앙 `0` 이 `룡사_더율` 이름표와 충돌.
    좌측이나 우측 상단으로 옮기는 편이 나아 보임.

### 2026-07-29 — 대화창 이관 / 인수인계 + 방향 버그 재오픈

- **무엇을**: 대화 컨텍스트가 가득 차서 새 세션으로 넘기기 위해 `memory.md` §2~§4 를 현재 코드에
  맞게 갱신하고, `to-do-list.md` 의 완료/잔여를 정리. 게임 코드 변경 없음.
- **🔴 재오픈된 버그 — 플레이어가 아직도 왼쪽을 본다**
  - 사용자 육안 확인: **시작할 때도, 걸을 때도** 아바타가 왼쪽을 향함.
  - 앞선 작업에서 서버 쓰기(`LookDirectionX = 1`, `FixedLookAt = 1`)로 바꾸고
    `faceLeft=false` 로그를 근거로 **PASS 로 보고했으나 실제 화면은 안 고쳐졌다.**
  - **내가 한 검증의 결함**: `IsFaceLeft()` / `LookDirectionX` 는 **논리적 방향**만 알려준다.
    아바타가 실제로 어느 쪽으로 **그려지는지**는 별개의 값이다. 스크린샷 확대에 실패했을 때
    "로그가 맞으니 됐다"고 넘어간 것이 잘못. **다음엔 반드시 스크린샷으로 눈으로 확인할 것.**
  - 원인 가설과 실험 순서는 §4 "🔴 최우선" 항목에 정리해 뒀다.
    첫 실험은 **`FixedLookAt = 0` 으로 되돌리기** — 이 프로퍼티가 "오른쪽 고정"이 아니라
    "현재 방향 고정"이라면, 기본값 -1(왼쪽) 상태에서 잠갔으므로 영구히 왼쪽이 된다.
- **건드린 파일**: `memory.md`, `to-do-list.md` (문서만)

### 2026-07-29 — 2차 이어서: BGM·비트 그리드 + 노트 패턴화 (2차 5.5/7)

- **BGM + 비트 그리드 (상2, 완료)**
  - 스테이지1 `fb2ae50a…`(115s 신스), 스테이지2 `32330a23…`(92s 록/오케) — `PlayBGM`/`StopBGM(false)`(페이드).
  - **`SPAWN_INTERVAL` 을 상수에서 파생값으로 전환**: `(60 / BPM) × BeatsPerNote`.
    난이도는 이제 초가 아니라 **비트 수**로 표현(easy 2 / normal 1.5 / hard 1 / stage2 0.75).
  - ⚠️ **`BPM = 120` 은 실측이 아니라 자리표시자.** 트랙을 듣고 맞춰야 진짜로 박자에 떨어진다.
    다만 노트↔해저드 페어링은 `NOTE_SPEED = RunSpeed × 150` 이 잡고 있어서 BPM 과 무관 —
    BPM 을 바꿔도 밀도만 변하고 페어링은 안 깨진다.
- **노트 패턴화 (중10, 완료)** — `math.random(1,4)` 완전 랜덤을 폐기하고 프레이즈 10종
  (계단 상/하행, 좌우 트릴, 바깥 교차, 연타, 지그재그 등). `NextPatternLane()` 이 현재
  프레이즈를 끝까지 소진한 뒤 새 프레이즈를 추첨. 리스타트 시 프레이즈 경계에서 시작.
  검증 로그 `laneSequence=432133323232` = 4321(상행) + 333(우 연타) + 232323(트릴) 로 읽힘.
- **런타임 에러 정리 (중13, 부분)**
  - `Neutralize()` 가 `DamageSkinComponent` / `HitEffectSpawnerComponent` /
    `DamageSkinSettingComponent` 도 끄도록 확장.
  - ⚠️ 그런데도 `chasemonster` 스폰마다 `Invalid RUID Format ... null` 이 **계속 뜬다.**
    스크립트가 끄기 전, **모델 인스턴스화 시점**에 이미 발생하는 것으로 보임. 정공법은
    `Global/NativeModel/ChaseMonster.model` 을 `MyDesk/Models/Monsters/` 로 복사해 빈 RUID 를 채우는 것.
  - ObstacleManager 의 죽은 프로퍼티 블록(`SpawnAhead`/`SpawnY` 등) 제거 + 왜 없앴는지 주석으로 남김.
- **미착수**: 결과 화면(중11), map01 의 `mushroom` MissingModel 제거, 레거시 스크립트 삭제.
- **건드린 파일**: `Rhythm/RhythmLogic.mlua`, `Rhythm/ObstacleManager.mlua`, `to-do-list.md`, `memory.md`
- **검증 (PASS)** — build 에러 0.
  `BGM started bpm=120.0 spawnInterval=0.75` / `isPlayBGM=true` /
  `bpm=120.0 spawnInterval=0.75 expected=0.75`(파생식 일치) /
  `laneSequence=432133323232 patternCount=10`

### 2026-07-29 — 1차(타격감·리듬감 5종) 완료 + 2차 3/7 완료

- **1차 — [중] 5개 전부 완료, 검증 PASS**
  1. **타격 SFX** — 히트(0.44s 검격, 모든 판정) / 퍼펙트 추가 레이어(밝은 차임) / 미스(에러 블립) /
     콤보 마일스톤(10마다 축하음). RUID 는 msw-search `resourceTypeFilter=["effect"]`(= 오디오) 로 확보.
  2. **히트스톱 + 카메라 셰이크** — 퍼펙트 timeScale 0.15×5프레임, 굿 0.35×3프레임, 미스는 셰이크만(0.85).
     ⚠️ **히트스톱은 초가 아니라 프레임으로 센다.** `SetClientTimeScale` 이 클라 시계를 늦추므로
     초 기반 타이머는 자기가 끝내야 할 슬로우모션에 자기가 늘어난다. 프레임은 렌더 속도로 계속 흐름.
     `ClearHitStop()` 을 OnUpdate 최상단 + 게임오버 + 리스타트 + OnEndPlay 에 배치(슬로우모션 고착 방지).
  3. **판정 텍스트 연출** — 스케일 팝(1.55→1.0, 0.18s) + 위치를 화면 중앙에서 레인 위(-300,-150)로 이동.
  4. **콤보 연출** — 10/20/30 단계별 색·폰트 크기, 10콤보마다 전용 SFX + 셰이크.
  5. **레인 가독성** — `LaneRail_*` 4개 신설(판정선~스폰지점 레일), 판정박스(KeyFlash)를
     `Enable=false` → **상시 표시**(idle alpha 0.22 ↔ flash 0.92 페이드), 레인별 색 통일,
     **키 힌트 A/S/D/F → ▲◀▶▼ 교정**(실제 입력은 방향키인데 글자가 틀려 있었음).
- **부수 수정: `LEA-3044` 60여 개 제거** — `Note_*/Fill.Color` 와 `Label.FontColor/OutlineColor` 가
  `[r,g,b,a]` **배열형**이라 엔진 역직렬화가 실패하고 있었다. 오브젝트형 `{r,g,b,a}` 로 교정하면서
  레인 색을 같이 넣음. 이게 "노트 색이 의도대로 안 나오던" 원인.
- **2차 — 7개 중 3개 완료**
  1. **점수/HP HUD 신설** — 상단 중앙 `ScoreText`, 좌상단 `HPBarBg/HPBarFill/HPLabel`.
     HP 바는 `FillAmount` 가 아니라 **폭 리사이즈**(9-slice 테두리 유지). 비율별 초록/노랑/빨강.
  2. **`DEBUG_MODE` 제거** → `ObstacleManager.Invincible`(기본 false)로 이관.
  3. **HP 이중 관리 통일** — 서버 `PlayerComponent.Hp` 단일 소스, `NotifyHp` Client RPC 로 HUD 미러링.
     클라 쪽 미스당 -10 산술은 삭제.
- **작업 중 밟은 함정 2개 (재발 방지)**
  - UIBuilder 로 자식으로 만든 엔티티는 **경로에 부모가 포함**된다. `RhythmLogic` 이
    `/ui/RhythmGame/HPBarFill` 를 찾고 있었는데 실제 경로는 `/ui/RhythmGame/HPBarBg/HPBarFill` →
    `hpBarFillEntity` 가 nil.
  - **UIBuilder `text()`/`button()` 은 `TextGUIRendererComponent` 를 만든다.** 이 프로젝트의 기존
    HUD 텍스트(ComboText / JudgmentFeedback / Note Label)는 레거시 `TextComponent` 라서
    둘을 섞으면 `GetComponent` 가 nil 을 돌려주고 텍스트가 조용히 안 바뀐다. 신규는 GUIRenderer, 기존은 레거시.
- **건드린 파일**: `Rhythm/RhythmLogic.mlua`, `Rhythm/ObstacleManager.mlua`,
  `ui/RhythmGame.ui`(UIBuilder 경유), `to-do-list.md`, `memory.md`
- **검증 (PASS)** — build 에러 0. `maker_execute_script` 로 노트를 판정선에 올려놓고 결정적으로 타격:
  - `hit feel perfect=true hitStopFrames=5` / `perfect=false hitStopFrames=2`(굿)
  - `miss feel (sfx+shake)` / `combo milestone 10`
  - `settled hitStopFrames=0 fbPop=0.0 comboPop=0.0`, `feedbackScale=1.0 comboScale=1.0` (고착 없음)
  - `scoreText='300' score=300`, `hp30% width=123.6 color=(1,0.85,0.25)`, `hp100% width=412.0`
  - `LEA-3044` 0건(이전 60여 건)
- **테스트 요령**: 타이틀 버튼은 `mouse_input` 으로 못 누른다(엔진 UI). 대신
  `maker_execute_script` 로 `_TitleScreen:Hide(); _RhythmLogic:StartGame("normal")` 하면 게임 코드를
  건드리지 않고 플레이 상태로 들어갈 수 있다. 판정도 `noteActive/noteX` 를 직접 세팅해 결정적으로 재현 가능.

### 2026-07-29 — 플레이어가 이동 방향(오른쪽)을 보도록 수정 + to-do-list 작성

- **증상**: 스크린샷에서 플레이어가 뒤집혀(왼쪽을 보고) 있었음.
- **원인**: `PlayerControllerComponent.LookDirectionX` 는 **`@Sync`(서버→클라 단방향)** 프로퍼티다.
  기존 코드는 `AutoMovePlayer:OnUpdate`(ClientOnly)에서 매 프레임 `= 1` 을 쓰고
  `RhythmLogic:FaceRight()` 에서도 썼지만, **클라이언트 쓰기는 서버에 전달되지 않아**
  서버의 기본값 `-1`(왼쪽)이 계속 이겨서 아바타가 뒤를 보고 달렸다.
- **수정**:
  - `AutoMovePlayer` 에 `@ExecSpace("Server") LockFacingRight()` 추가 →
    `senderUserId` 로 플레이어를 찾아 서버에서 `LookDirectionX = 1` + **`FixedLookAt = 1`** 설정.
    (`FixedLookAt` 은 "이동해도 보는 방향을 고정" 하는 전용 프로퍼티. 화살표키·넉백·공격 클립이
    다시 뒤집지 못하게 못을 박는 역할)
  - `EnsureFacingRight()` (ClientOnly, `facingLocked` 가드) 로 세션당 RPC 1회만 발생.
    매 프레임 쓰기는 제거.
  - `RhythmLogic:FaceRight()` 는 `_AutoMovePlayer:EnsureFacingRight()` 로 위임.
  - 진단 로그 추가: 서버 확정 로그 + 1초 뒤 클라이언트 `IsFaceLeft()` 확인 로그,
    `PlayLaneAction` 로그에 `faceLeft=` 필드.
- **건드린 파일**: `RootDesk/MyDesk/Runner/AutoMovePlayer.mlua`,
  `RootDesk/MyDesk/Rhythm/RhythmLogic.mlua`, `to-do-list.md`(신규), `memory.md`
- **검증 (PASS)**: refresh → build 로그 에러 0 (LIA-1114/1115 info 만) → play → 런타임 로그
  - 서버: `[AutoMovePlayer] facing locked right (server) LookDirectionX=1.0 FixedLookAt=1`
  - 클라: `[AutoMovePlayer] facing check (client) faceLeft=false LookDirectionX=1.0`
  → `faceLeft=false` = 진행 방향(오른쪽)을 보고 있음.
- **교훈 (재발 방지)**: MSW에서 `@Sync` 프로퍼티는 **반드시 서버에서 써야 한다.**
  클라에서 쓰면 에러 없이 조용히 되돌아간다. `PlayerControllerComponent` / `MovementComponent` /
  `SpriteRendererComponent` 등의 `@Sync` 필드 전부 해당.
- **참고**: 플레이 중 발견한 기존 런타임 에러들(UI `LEA-3044` 60여 개, `LEA-3028 mushroom`,
  `LEA-3005` 코스튬 카테고리)은 to-do-list [상]5 / [중]13 에 기록.

### 2026-07-28 — 현황 파악 및 작업 메모 체계 도입

- **무엇을**: 기존 워크스페이스 전체를 읽어 현재 진행 상태를 정리하고, 이 `memory.md` 를 신설.
- **왜**: 이후 작업마다 변경 내역을 누적 기록하기 위해 (사용자 요청).
- **파악한 것**: 위 1~4장 전체. 게임은 "오토런 + 리듬 액션"이며 타이틀→난이도→플레이→
  스테이지2→게임오버까지 한 사이클이 구현되어 있음. 노트-해저드 1:1 페어링과
  속도 동기화가 이 프로젝트의 핵심 불변식.
- **건드린 파일**: `memory.md` (신규) — 게임 코드 변경 없음.
- **검증**: 코드 변경이 없으므로 Play 검증 생략. 위 "미해결" 항목 중
  UI 누락(ScoreText/HPBar)은 코드 로그 기록에 근거한 것으로, 다음 Play 시 재확인 필요.
