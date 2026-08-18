# 🎮 Rhythm Game Architecture Guide

이 문서는 Rhythm Game의 모든 고정 설정과 구조를 정리합니다.
**모든 수정 전에 이 문서를 먼저 참고하세요.**

---

## 1. 좌표계 (Coordinate System)

### 화살표 이동 방향
```
오른쪽 (950) → 왼쪽 (판정선) → 화면 밖
noteX: 950.0 → 0.0 → 음수 (제거)
```

### 주요 x축 값
| 요소 | x축 | 설명 |
|------|-----|------|
| **화살표 시작** | 950.0 | 화면 오른쪽에서 시작 |
| **플레이어 위치** | -350.0 | 모든 레인에서 동일 (왼쪽 끝) |
| **판정선 (JUDGE_X)** | 0.0 → **-350.0** | 플레이어 위치로 변경 필요 |
| **Green Box** | 0.0 (중앙) → **-350.0** | 플레이어 위치로 정렬 필요 |

### 레인별 y축 값
```lua
laneY = { -270.0, -340.0, -430.0, -500.0 }
-- Lane 1 (A): y = -270.0  (KeyFlash와 동기화)
-- Lane 2 (S): y = -340.0  (KeyFlash와 동기화)
-- Lane 3 (D): y = -430.0  (KeyFlash와 동기화)
-- Lane 4 (F): y = -500.0  (KeyFlash와 동기화)
```

---

## 2. UI 요소 (UI Elements)

### 화살표 노트 (Note)
| 객체 | 경로 | 개수 | 위치 |
|------|------|------|------|
| Note_A_0~4 | /ui/RhythmGame/Note_A_* | 5개 | Lane 1 |
| Note_S_0~4 | /ui/RhythmGame/Note_S_* | 5개 | Lane 2 |
| Note_D_0~4 | /ui/RhythmGame/Note_D_* | 5개 | Lane 3 |
| Note_F_0~4 | /ui/RhythmGame/Note_F_* | 5개 | Lane 4 |
- **초기 위치**: x=950.0, y=laneY[lane]
- **이동**: x -= NOTE_SPEED * delta (초/프레임 95.0 픽셀)

### Green Box (KeyFlash) - 🔴 **수정 필요**
| 요소 | 현재 x축 | 목표 x축 | y축 | 크기 | 상태 |
|------|---------|---------|-----|------|------|
| KeyFlash_A | 0.0 | **-350** | -200.0 | 120×70 | ❌→✅ |
| KeyFlash_S | 0.0 | **-350** | -280.0 | 120×70 | ❌→✅ |
| KeyFlash_D | 0.0 | **-350** | -360.0 | 120×70 | ❌→✅ |
| KeyFlash_F | 0.0 | **-350** | -440.0 | 120×70 | ❌→✅ |

**이유**: 플레이어 x축(-350)과 동기화하여 정확한 판정 가능

### 기타 UI
| 요소 | 경로 | 현재 상태 |
|------|------|---------|
| ScoreText | /ui/RhythmGame/ScoreText | ✅ 상단 중앙 |
| ComboText | /ui/RhythmGame/ComboText | ✅ 하단 중앙 |
| JudgmentFeedback | /ui/RhythmGame/JudgmentFeedback | ✅ 중앙 |
| HPBarBg | /ui/RhythmGame/HPBarBg | ✅ 상단 중앙 |
| HPBarFill | /ui/RhythmGame/HPBarFill | ✅ 상단 중앙 |
| HPLabel | /ui/RhythmGame/HPLabel | ✅ 상단 중앙 |
| DarkOverlay | /ui/RhythmGame/DarkOverlay | ✅ 게임오버 화면 |
| Stage2Banner | /ui/RhythmGame/Stage2Banner | ✅ 스테이지 공지 |

> ⚠️ 위 표의 `ScoreText` / `HPBarBg` / `HPBarFill` / `HPLabel` 은 실제 `ui/RhythmGame.ui` 에 **없습니다**.
> `RhythmLogic:OnBeginPlay` 로그에서 `scoreEntity=false` / `hpBarFill=false` 로 확인됨. 표가 구현보다 앞서 있음.

### 타이틀 화면 (ui/TitleScreen.ui) — UIGroup order 50

| 요소 | 경로 | 역할 |
|------|------|------|
| Root | /ui/TitleScreen/Root | Enable 토글 대상 (그룹 DefaultShow 는 true 고정) |
| Dimmer | /ui/TitleScreen/Root/Dimmer | 전체 화면 딤 + raycast 차단 |
| Window | /ui/TitleScreen/Root/Window | 900×660 패널 |
| BtnEasy / BtnNormal / BtnHard | .../Window/Btn* | 난이도 선택 (선택된 것만 파란색) |
| BtnStart | .../Window/BtnStart | `_RhythmLogic:StartGame(difficulty)` 호출 |

**흐름**: 월드 시작 → `RhythmLogic.gameStarted = false` (노트 스폰/레인 키 입력 정지, 오토런은 계속 = 타이틀 배경)
→ 게임 시작 클릭 → `StartGame(diff)` → `ApplyDifficulty()` + `RestartGame()` → `gameStarted = true`
→ 게임오버 창의 **Home** → `GoHome()` → 타이틀 복귀.

**난이도 값** (`RhythmLogic:ApplyDifficulty`):

| 난이도 | SPAWN_INTERVAL | RunSpeed 배율 | NOTE_SPEED (BASE 1.76 기준) |
|--------|:--------------:|:-------------:|:---------------------------:|
| easy | 1.5 | 0.8 | 211.2 |
| normal | 1.0 | 1.0 | 264.0 |
| hard | 0.7 | 1.3 | 343.2 |

> `NOTE_SPEED` 는 직접 지정하지 않고 항상 `RunSpeed × UI_PX_PER_WORLD_UNIT` 로 재계산합니다.
> 화살표와 장애물이 같은 화면 속도로 움직여야 페어링이 유지되기 때문입니다 (Stage 2 도 동일 방식).

---

## 3. 핵심 변수 (Key Variables)

### RhythmLogic.mlua 고정값
```lua
JUDGE_X = 0.0              -- 판정선 x축
PERFECT_WINDOW = 80.0      -- 퍼펙트 판정 범위 (±80)
GOOD_WINDOW = 160.0        -- 굿 판정 범위 (±160)
NOTE_SPEED = 95.0          -- 화살표 이동 속도 (픽셀/초)
SPAWN_INTERVAL = 1.5       -- 화살표 생성 간격 (초)
DEBUG_MODE = true          -- 무적 모드
```

### 동적 배열
```lua
laneY = { -200.0, -280.0, -360.0, -440.0 }  -- 각 레인의 y축
noteX = {}                 -- 각 화살표의 현재 x축 (배열)
noteActive = {}            -- 각 화살표의 활성화 상태
noteLane = {}              -- 각 화살표가 속한 레인
```

---

## 4. 플레이어 위치 정보 ✅

**모든 레인에서 동일:**
- Lane A: x = **-350.0**
- Lane S: x = **-350.0**
- Lane D: x = **-350.0**
- Lane F: x = **-350.0**

**특징**: 플레이어는 화면의 왼쪽 끝에 고정되어 있으며, 모든 레인에서 동일한 x축 위치

---

## 5. 몬스터-화살표 매핑 (Monster-Arrow Mapping)

### 현재 상태
```lua
-- SpawnNote() 메서드에서:
if self.noteCounter % 3 ~= 1 then
    _ObstacleManager:RequestSpawn(lane)  -- 몬스터 스폰
end
```

**문제점**:
1. 몬스터의 정확한 x축 위치가 정의되지 않음
2. 화살표 레인과 몬스터 위치 정렬 필요
3. 매핑되지 않은 화살표 존재 가능성

---

## 6. 화살표 판정 로직

```lua
-- 거리 계산
dist = math.abs(noteX[i] - JUDGE_X)

-- 판정 결과
if dist <= PERFECT_WINDOW (80)  → Perfect (점수 100)
if dist <= GOOD_WINDOW (160)    → Good (점수 50)
else                             → Miss (점수 0, HP -1)
```

---

## 7. 개선 필요 항목 (TODO)

### ①️⃣ 좌표 정렬 ✅ 완료
- [x] 플레이어 x축: -350.0 (모든 레인)
- [x] JUDGE_X: -350.0
- [x] Green Box x축: -350.0
- [x] 화살표 y축: KeyFlash y축과 동기화

### ②️⃣ 몬스터-화살표 매핑
- [ ] 각 몬스터의 x축 위치 정의
- [ ] 몬스터 위치와 화살표 레인 일치
- [ ] 모든 화살표가 몬스터에 매핑되었는지 검증

### ③️⃣ UI 반응성
- [ ] Green Box 시각적 피드백 개선
- [ ] 판정 결과 표시 (Perfect/Good/Miss)

---

## 8. 파일 구조

```
RootDesk/MyDesk/Rhythm/
├── RhythmLogic.mlua          ← 메인 로직
├── ObstacleManager.mlua       ← 몬스터 관리
├── TitleScreen.mlua           ← 타이틀/시작 화면 컨트롤러 (@Logic, ClientOnly)
└── (기타 스크립트)

ui/RhythmGame.ui             ← 게임 플레이 UI (order 3)
ui/TitleScreen.ui            ← 타이틀 화면 (order 50)
```

---

## 📝 **사용법**

이 문서를 매번 참고하면:
- ✅ 좌표 시스템 한눈에 파악
- ✅ 고정값들 쉽게 찾기
- ✅ 수정 전 구조 이해
- ✅ 커뮤니케이션 빨라짐

**문제 발생 시**: 이 문서를 먼저 업데이트한 후 코드 수정 진행
