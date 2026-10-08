import tkinter as tk
from tkinter import ttk, messagebox
import time

class VirtualTerrariumApp:
    """
    [방과 후 가상 테라리움 식물 재배기 (Virtual Terrarium)]
    파이썬 내장 라이브러리 Tkinter만을 사용하여 구현한 단독 실행형 GUI 프로그램입니다.
    학교 제출용 숙제에 맞춰 모든 클래스 및 메소스에 상세한 주석이 작성되어 있습니다.
    """
    def __init__(self, root):
        # 1. 메인 윈도우 창 기본 설정 (400x500 크기, 파스텔톤 배경)
        self.root = root
        self.root.title("방과 후 가상 테라리움 식물 재배기 🪴")
        self.root.geometry("400x500")
        self.root.resizable(False, False)  # 창 크기 고정

        # 파스텔톤 컬러 팔레트 정의
        self.COLOR_BG = "#F4F8F3"          # 배경색 (크림 민트)
        self.COLOR_CARD = "#E2EFCB"        # 카드/프레임 배경색 (파스텔 연두)
        self.COLOR_TEXT_MAIN = "#2D3748"   # 기본 텍스트 색상 (다크 슬레이트)
        self.COLOR_MOISTURE = "#3182CE"    # 수분 게이지 색상 (파랑)
        self.COLOR_GROWTH = "#38A169"      # 성장 게이지 색상 (초록)
        self.COLOR_WARNING = "#E53E3E"     # 경고 텍스트 색상 (빨강)

        self.root.configure(bg=self.COLOR_BG)

        # 2. 식물 상태 데이터 변수 초기화
        self.moisture = 80          # 수분 스탯 (0 ~ 100%)
        self.growth = 10            # 성장 지수 (0 ~ 100%)
        self.is_withered = False    # 시듦 상태 여부 (True/False)
        self.warning_shown = False  # 경고 팝업 중복 출력 방지 플래그

        # 식물 진화 단계 정의 (성장 지수 기준)
        # 0~25: 씨앗 / 26~60: 새싹 / 61~99: 꽃 / 100 이상: 거대한 나무
        self.growth_stages = [
            {"min_growth": 0,   "emoji": "🫘", "name": "씨앗", "desc": "씨앗이 흙 속에서 발아를 준비 중입니다."},
            {"min_growth": 26,  "emoji": "🌱", "name": "새싹", "desc": "파릇파릇한 새싹이 돋아났습니다!"},
            {"min_growth": 61,  "emoji": "🌷", "name": "예쁜 꽃", "desc": "화사하고 어여쁜 꽃이 피어났습니다!"},
            {"min_growth": 100, "emoji": "🌳", "name": "거대한 나무", "desc": "울창하고 웅장한 나무로 완벽히 성장했습니다!"}
        ]

        # 3. GUI 레이아웃 구성 함수 호출
        self._setup_ui()

        # 4. 방치 상태 수분 자동 감소 타이머 시작 (3초마다 실행)
        self._start_decay_loop()

    def _setup_ui(self):
        """GUI 화면 컴포넌트(상단 상태바, 중앙 이모지 영역, 하단 버튼)를 배치합니다."""

        # -------------------------------------------------------------
        # [상단 헤더 영역] - 타이틀 및 현재 식물 상태 표시
        # -------------------------------------------------------------
        top_frame = tk.Frame(self.root, bg=self.COLOR_CARD, bd=0, relief="flat", padx=15, pady=10)
        top_frame.pack(fill="x", padx=15, pady=(15, 5))

        title_label = tk.Label(
            top_frame,
            text="🪴 가상 테라리움 (Virtual Terrarium)",
            font=("맑은 고딕", 12, "bold"),
            bg=self.COLOR_CARD,
            fg=self.COLOR_TEXT_MAIN
        )
        title_label.pack(anchor="w")

        # 현재 상태 텍스트 (예: "상태: 파릇파릇함 🌱")
        self.status_label = tk.Label(
            top_frame,
            text="상태: 파릇파릇함 🌱",
            font=("맑은 고딕", 11, "bold"),
            bg=self.COLOR_CARD,
            fg="#2F855A"
        )
        self.status_label.pack(anchor="w", pady=(3, 0))

        # -------------------------------------------------------------
        # [중앙 디스플레이 영역] - 큰 식물 이모지 & 화분 표시
        # -------------------------------------------------------------
        center_frame = tk.Frame(self.root, bg=self.COLOR_BG)
        center_frame.pack(fill="both", expand=True, padx=15, pady=5)

        # 거대 식물 이모지 표시 라벨
        self.plant_emoji_label = tk.Label(
            center_frame,
            text="🫘",
            font=("Segoe UI Emoji", 72),
            bg=self.COLOR_BG
        )
        self.plant_emoji_label.pack(pady=(10, 0))

        # 화분 받침대 이모지
        pot_label = tk.Label(
            center_frame,
            text="🪴",
            font=("Segoe UI Emoji", 36),
            bg=self.COLOR_BG
        )
        pot_label.pack(pady=(0, 5))

        # 식물 설명 텍스트 라벨
        self.desc_label = tk.Label(
            center_frame,
            text="씨앗이 흙 속에서 발아를 준비 중입니다.",
            font=("맑은 고딕", 9),
            bg=self.COLOR_BG,
            fg="#4A5568"
        )
        self.desc_label.pack()

        # -------------------------------------------------------------
        # [스탯 게이지 영역] - 수분 및 성장 수치 프로그레스바
        # -------------------------------------------------------------
        stats_frame = tk.Frame(self.root, bg=self.COLOR_BG, padx=20)
        stats_frame.pack(fill="x", pady=5)

        # 1. 수분 게이지
        moisture_info_frame = tk.Frame(stats_frame, bg=self.COLOR_BG)
        moisture_info_frame.pack(fill="x")
        tk.Label(moisture_info_frame, text="💧 수분 수치", font=("맑은 고딕", 9, "bold"), bg=self.COLOR_BG, fg=self.COLOR_MOISTURE).pack(side="left")
        self.moisture_val_label = tk.Label(moisture_info_frame, text="80%", font=("맑은 고딕", 9, "bold"), bg=self.COLOR_BG, fg=self.COLOR_MOISTURE)
        self.moisture_val_label.pack(side="right")

        self.moisture_bar = ttk.Progressbar(stats_frame, length=360, mode="determinate", maximum=100)
        self.moisture_bar.pack(fill="x", pady=(2, 8))
        self.moisture_bar["value"] = self.moisture

        # 2. 성장 게이지
        growth_info_frame = tk.Frame(stats_frame, bg=self.COLOR_BG)
        growth_info_frame.pack(fill="x")
        tk.Label(growth_info_frame, text="📈 성장 지수", font=("맑은 고딕", 9, "bold"), bg=self.COLOR_BG, fg=self.COLOR_GROWTH).pack(side="left")
        self.growth_val_label = tk.Label(growth_info_frame, text="10%", font=("맑은 고딕", 9, "bold"), bg=self.COLOR_BG, fg=self.COLOR_GROWTH)
        self.growth_val_label.pack(side="right")

        self.growth_bar = ttk.Progressbar(stats_frame, length=360, mode="determinate", maximum=100)
        self.growth_bar.pack(fill="x", pady=(2, 5))
        self.growth_bar["value"] = self.growth

        # -------------------------------------------------------------
        # [하단 액션 버튼 영역] - 물 주기, 영양제 주기, 하교 후 확인하기
        # -------------------------------------------------------------
        btn_frame = tk.Frame(self.root, bg=self.COLOR_BG, padx=15, pady=10)
        btn_frame.pack(fill="x", side="bottom")

        # 버튼 1: [물 주기 💧]
        self.btn_water = tk.Button(
            btn_frame,
            text="물 주기 💧",
            font=("맑은 고딕", 10, "bold"),
            bg="#BEE3F8",
            fg="#2B6CB0",
            activebackground="#90CDF4",
            relief="groove",
            bd=1,
            height=2,
            command=self.give_water
        )
        self.btn_water.pack(side="left", fill="x", expand=True, padx=3)

        # 버튼 2: [영양제 주기 🧪]
        self.btn_nutrient = tk.Button(
            btn_frame,
            text="영양제 주기 🧪",
            font=("맑은 고딕", 10, "bold"),
            bg="#C6F6D5",
            fg="#276749",
            activebackground="#9AE6B4",
            relief="groove",
            bd=1,
            height=2,
            command=self.give_nutrient
        )
        self.btn_nutrient.pack(side="left", fill="x", expand=True, padx=3)

        # 버튼 3: [하교 후 확인하기 👀]
        self.btn_school = tk.Button(
            btn_frame,
            text="하교 후 확인 👀",
            font=("맑은 고딕", 10, "bold"),
            bg="#FED7E2",
            fg="#9B2C2C",
            activebackground="#FBB6CE",
            relief="groove",
            bd=1,
            height=2,
            command=self.check_after_school
        )
        self.btn_school.pack(side="left", fill="x", expand=True, padx=3)

        # 메시지 로그 표시 라벨
        self.log_label = tk.Label(
            self.root,
            text="테라리움에 오신 것을 환영합니다! 식물을 잘 가꿔보세요.",
            font=("맑은 고딕", 8),
            bg=self.COLOR_BG,
            fg="#718096"
        )
        self.log_label.pack(side="bottom", pady=(0, 5))

    # =================================================================
    # 핵심 핵심 로직 함수 정의 (이벤트 처리 및 스탯 계산)
    # =================================================================

    def give_water(self):
        """[물 주기 💧] 버튼 클릭 시 호출되는 핸들러 함수"""
        # 시든 상태였다면 회복 처리
        if self.is_withered:
            self.is_withered = False
            self.warning_shown = False
            self.log_label.config(text="시원한 물을 받아 식물이 싱싱하게 회복되었습니다! 🌊", fg="#2B6CB0")
        else:
            self.log_label.config(text="시원한 물을 주었습니다! 🌊", fg="#2B6CB0")

        # 수분 수치 +30 상승 (최대 100 제한)
        self.moisture = min(100, self.moisture + 30)
        self.update_display()

    def give_nutrient(self):
        """[영양제 주기 🧪] 버튼 클릭 시 호출되는 핸들러 함수"""
        if self.is_withered:
            messagebox.showwarning("경고", "식물이 목말라 시들어 있습니다! 🚨 먼저 물을 주세요!")
            return

        # 성장 지수 +20 상승 (최대 100 제한)
        self.growth = min(100, self.growth + 20)
        self.log_label.config(text="영양제를 먹고 식물이 무럭무럭 자랍니다! 🧪✨", fg="#276749")
        self.update_display()

    def check_after_school(self):
        """[하교 후 확인하기 👀] 버튼 클릭 시 호출되는 핸들러 함수"""
        if self.is_withered:
            messagebox.showwarning("경고", "식물이 목말라 시들어 있습니다! 🚨 물을 줘서 살려주세요!")
            return

        # 하교 후 자습/햇빛 팝업창 출력 (요구사항 반영)
        messagebox.showinfo(
            "하교 자습 정산 ☀️",
            "유저님이 학교에 있는 동안 식물이 햇빛을 받고 무럭무럭 자랐습니다!"
        )

        # 성장 지수 +30 상승
        self.growth = min(100, self.growth + 30)
        self.log_label.config(text="학교에 다녀온 동안 식물이 햇빛을 받고 폭풍 성장했습니다! ☀️", fg="#9B2C2C")
        self.update_display()

    def update_display(self):
        """현재 데이터(수분, 성장 지수, 시듦 여부)에 맞춰 UI를 갱신합니다."""
        # 1. 프로그레스바 및 수치 텍스트 업데이트
        self.moisture_bar["value"] = self.moisture
        self.moisture_val_label.config(text=f"{self.moisture}%")

        self.growth_bar["value"] = self.growth
        self.growth_val_label.config(text=f"{self.growth}%")

        # 2. 예외 처리: 수분이 0일 때 시듦(Withered) 상태 처리
        if self.moisture <= 0:
            self.is_withered = True
            self.plant_emoji_label.config(text="🥀")
            self.status_label.config(text="상태: 목말라함! 🚨", fg=self.COLOR_WARNING)
            self.desc_label.config(text="식물이 바짝 말라 시들어가고 있습니다! 물을 주어 살려주세요.")

            # 경고 팝업 1회 출력
            if not self.warning_shown:
                self.warning_shown = True
                messagebox.showwarning("경고 🚨", "식물이 목말라하고 있습니다! 🚨 물을 주어 살려주세요!")
            return

        # 3. 정상 상태일 때: 성장 지수 기반 이모지 및 진화 단계 결정
        current_stage = self.growth_stages[0]
        for stage in self.growth_stages:
            if self.growth >= stage["min_growth"]:
                current_stage = stage

        # UI 요소 업데이트
        self.plant_emoji_label.config(text=current_stage["emoji"])
        self.status_label.config(text=f"상태: {current_stage['name']} ({'파릇파릇함 🌱' if self.growth < 100 else '최종 성장 완료! 👑'})", fg="#2F855A")
        self.desc_label.config(text=current_stage["desc"])

    def _start_decay_loop(self):
        """방치 상태 구현: 3초마다 수분을 5씩 감소시키는 재귀 타이머 함수"""
        if not self.is_withered:
            self.moisture = max(0, self.moisture - 5)
            self.update_display()

        # 3000ms(3초) 후에 이 함수를 다시 호출하도록 스케줄링
        self.root.after(3000, self._start_decay_loop)


# =================================================================
# 메인 프로그램 실행부
# =================================================================
if __name__ == "__main__":
    # Tkinter 메인 루프 생성 및 앱 실행
    root = tk.Tk()
    app = VirtualTerrariumApp(root)
    root.mainloop()
