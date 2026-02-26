12 19
수정사항 mainpage 음식 컨테이너 조정
JoinTimePage 시간 그리드 위치 조정 

12 25 수정사항
메인페이지 joinmodal페이지 오류 수정중

0113 수정사항 
1. 지도 마커 변경 ( O)
2. JoinCategoryPage 아이콘 뒤에 radius 수정 (O)
3. 사진 박스 가게 이름 짤림 ( 9 글자 이후 마스킹 처리는 했는데 라벨 앞부분에 잘림 gap 수정 필요)

할일 
4. 서브 카테고리 페이지 무한 스크롤 변경
5. 슬롯 그리드 간격 라운드 처리....
6. 사진 api 연결 및 사진 박스 폰트 사이즈 수정 ( api 연결할때 사이즈 조절하면서 일괄적으로 하겠습니다 )

---

## 로컬 실행 환경변수

Vite는 프로젝트 루트의 `.env*`만 읽습니다. (예: `.env`, `.env.local`, `.env.production`)

필수 변수는 루트의 `.env`에 설정합니다.

- `VITE_API_BASE_URL`
- `VITE_KAKAO_MAP_APP_KEY`
- `VITE_GA_MEASUREMENT_ID` (GA4, 예: `G-XXXXXXXXXX`)

## GA4 조회가 0일 때 체크리스트

1. GA4 관리자 > 데이터 스트림 > 웹 스트림에서 측정 ID가 `G-...` 형식인지 확인
2. 배포/로컬 모두에서 `VITE_GA_MEASUREMENT_ID`가 실제 값으로 주입되는지 확인
	- DevTools에서 `https://www.googletagmanager.com/gtag/js?id=G-...` 요청이 뜨는지 확인
3. GA4의 **실시간(Realtime)** 또는 **DebugView**로 유입 확인 (일반 보고서는 지연될 수 있음)
4. 광고차단(AdBlock/Brave Shields)·추적방지 기능을 끄고 시크릿 창에서 재시도

---

## 측정 지표(현재 코드 기준)

### 자동/기본

- `page_view`: SPA 라우트 변경 시 전송 (react-router)

### 전환(키 이벤트 후보)

- `create_flow_complete`: 모임 생성 완료 화면 진입
- `join_flow_complete`: 참여/정보 반영 완료 화면 진입

### 퍼널 보조(행동)

- `create_link_copy`: 생성 링크 복사
- `create_link_share`: 생성 링크 공유
- `create_register_click`: 등록하기 클릭
- `join_go_back_click`: 참여 완료 후 돌아가기 클릭

### 페이지별 체류시간(커스텀)

- `route_dwell`: 라우트 전환 시 “이전 페이지” 체류시간(ms)
	- `gmg_from_path`: 이전 라우트 경로(+쿼리)
	- `gmg_to_path`: 다음 라우트 경로(+쿼리) 또는 `(exit)`
	- `gmg_dwell_ms`: 체류시간(ms)

---

## GA4에서 해야 할 설정

### 1) 전환(키 이벤트) 지정

GA4 → 구성(Configure) → 이벤트(Events)에서 아래 이벤트를 **키 이벤트(전환)** 로 설정

- `create_flow_complete`
- `join_flow_complete`

### 2) UTM을 이벤트 기준으로 쪼개보기(선택)

현재 전환 이벤트에는 아래 파라미터들이 같이 전송됩니다.

- `gmg_utm_source`, `gmg_utm_medium`, `gmg_utm_campaign`, `gmg_utm_content`

GA4 → 관리자(Admin) → 커스텀 정의(Custom definitions)

- 커스텀 차원 추가(이벤트 범위)
	- Dimension name: 원하는 이름
	- Scope: Event
	- Event parameter: 위 파라미터명 그대로 입력

### 3) 페이지별 체류시간(ms) 리포트 만들기(탐색)

GA4 → 탐색(Explore) → 자유 형식(Free form)

- Rows: `gmg_from_path`
- Values: `Event count` (event = `route_dwell` 필터)

추가로 평균 체류시간을 보고 싶으면

GA4 → 관리자(Admin) → 커스텀 정의(Custom definitions)

- 커스텀 메트릭 추가(이벤트 범위)
	- Metric name: 예) `Route dwell (ms)`
	- Scope: Event
	- Event parameter: `gmg_dwell_ms`
	- Unit of measurement: Milliseconds

그 다음 탐색에서 `Route dwell (ms)`의 평균/합계를 확인합니다.