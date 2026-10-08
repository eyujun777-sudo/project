import tkinter as tk
from tkinter import ttk
import random

class MorningLuckySlotMachine:
    """
    [아침의 행운 (Morning Lucky) - 등교 운세 슬롯머신 (학교 생활 특화 버전)]
    파이썬 내장 라이브러리 Tkinter와 random 모듈만을 활용하여 제작된
    레트로 다크모드 오락실 스타일의 단독 실행형 운세 슬롯머신 프로그램입니다.
    수정된 학교 생활 공감 데이터 리스트가 반영되어 있습니다.
    """

    def __init__(self, root):
        # 1. 메인 윈도우 창 설정 (450x480 크기, 다크 오락실 테마)
        self.root = root
        self.root.title("🎰 오늘의 등교 운세 슬롯머신 🎰")
        self.root.geometry("450x480")
        self.root.resizable(False, False)  # 창 크기 고정

        # 다크 모드 레트로 오락실 테마 색상 팔레트 정의
        self.COLOR_BG = "#1A1A2E"          # 메인 배경 (딥 네이비)
        self.COLOR_PANEL = "#16213E"       # 패널 배경 (다크 블루)
        self.COLOR_REEL_BG = "#0F3460"     # 슬롯 릴 배경 (네온 다크)
        self.COLOR_NEON_CYAN = "#00FFF5"   # 네온 민트/시안 강조색
        self.COLOR_NEON_PINK = "#E94560"   # 네온 핑크 버튼/타이틀 색상
        self.COLOR_GOLD = "#FEE715"        # 텍스트 강조 황금색
        self.COLOR_WHITE = "#F8FAFC"       # 기본 밝은 텍스트 색상

        self.root.configure(bg=self.COLOR_BG)

        # 2. 수정된 학교 생활 특화 데이터 리스트 정의 (요구사항 100% 반영)
        self.status_list = [
            "찍신 강림 완료 🎯",
            "비몽사몽 좀비 상태 🧟",
            "개운함 MAX 풀충전 🔋",
            "배고파서 기절 직전 꼬르륵 🫠"
        ]

        self.event_list = [
            "수행평가 벼락치기 대성공 💯",
            "쌤이 눈감아줘서 복장 프리패스 🏃",
            "첫 교시 단축 수업 개꿀 ⏱️",
            "발표 걸렸는데 종 쳐서 생존 🔔"
        ]

        self.item_list = [
            "매우 부드러운 검은색 볼펜 🖊️",
            "잠 깨워주는 졸음번쩍 껌 🍬",
            "친구한테 빌린 체육복 바지 🩳",
            "가방 속 숨겨둔 초코바 🍫"
        ]

        # 애니메이션 중 복수 클릭 방지 플래그
        self.is_spinning = False

        # 3. GUI 화면 컴포넌트 생성 및 배치
        self._setup_ui()

    def _setup_ui(self):
        """GUI 레이아웃 (타이틀, 3개 슬롯 릴, 결과 문장 창, 뽑기 버튼)을 배치합니다."""

        # -------------------------------------------------------------
        # [상단 헤더 영역] - 슬롯머신 타이틀
        # -------------------------------------------------------------
        header_frame = tk.Frame(self.root, bg=self.COLOR_PANEL, bd=2, relief="ridge", padx=10, pady=10)
        header_frame.pack(fill="x", padx=15, pady=(15, 10))

        title_label = tk.Label(
            header_frame,
            text="🎰 오늘의 등교 운세 슬롯머신 🎰",
            font=("맑은 고딕", 14, "bold"),
            bg=self.COLOR_PANEL,
            fg=self.COLOR_NEON_CYAN
        )
        title_label.pack()

        subtitle_label = tk.Label(
            header_frame,
            text="버튼을 눌러 오늘 학교에서 일어날 초특급 행운을 확인하세요!",
            font=("맑은 고딕", 9),
            bg=self.COLOR_PANEL,
            fg="#94A3B8"
        )
        subtitle_label.pack(pady=(2, 0))

        # -------------------------------------------------------------
        # [중앙 슬롯 릴 영역] - 3개의 슬롯 창 [ ??? ] [ ??? ] [ ??? ]
        # -------------------------------------------------------------
        reels_frame = tk.Frame(self.root, bg=self.COLOR_BG)
        reels_frame.pack(fill="x", padx=15, pady=10)

        # 3개 슬롯 라벨을 저장할 리스트
        self.reel_labels = []
        reel_titles = ["1. 상태 (Condition)", "2. 사건 (Event)", "3. 행운 아이템"]

        for i in range(3):
            # 각 슬롯을 담을 수직 프레임
            single_reel_box = tk.Frame(reels_frame, bg=self.COLOR_REEL_BG, bd=2, relief="groove", padx=5, pady=8)
            single_reel_box.pack(side="left", fill="both", expand=True, padx=4)

            # 슬롯 소제목
            reel_title = tk.Label(
                single_reel_box,
                text=reel_titles[i],
                font=("맑은 고딕", 8, "bold"),
                bg=self.COLOR_REEL_BG,
                fg="#A0AEC0"
            )
            reel_title.pack()

            # 슬롯 릴 메인 텍스트 표시 영역 (초기값 [ ??? ])
            reel_label = tk.Label(
                single_reel_box,
                text="[ ??? ]",
                font=("맑은 고딕", 9, "bold"),
                bg=self.COLOR_REEL_BG,
                fg=self.COLOR_GOLD,
                wraplength=110,  # 긴 글자 자동 줄바꿈
                height=4
            )
            reel_label.pack(pady=5)
            self.reel_labels.append(reel_label)

        # -------------------------------------------------------------
        # [결과 문장 출력 영역] - 최종 완성형 텍스트 박스
        # -------------------------------------------------------------
        result_frame = tk.Frame(self.root, bg=self.COLOR_PANEL, bd=1, relief="solid", padx=10, pady=12)
        result_frame.pack(fill="x", padx=15, pady=10)

        self.result_label = tk.Label(
            result_frame,
            text="👇 하단의 [오늘의 운세 뽑기 시작! 🔥] 버튼을 눌러보세요!",
            font=("맑은 고딕", 10),
            bg=self.COLOR_PANEL,
            fg=self.COLOR_WHITE,
            wraplength=400,
            justify="center"
        )
        self.result_label.pack()

        # -------------------------------------------------------------
        # [하단 액션 버튼 영역] - 커다란 뽑기 버튼
        # -------------------------------------------------------------
        btn_container = tk.Frame(self.root, bg=self.COLOR_BG, padx=15, pady=5)
        btn_container.pack(fill="x", side="bottom", pady=(0, 15))

        self.spin_button = tk.Button(
            btn_container,
            text="🔥 오늘의 운세 뽑기 시작! 🔥",
            font=("맑은 고딕", 12, "bold"),
            bg=self.COLOR_NEON_PINK,
            fg="#FFFFFF",
            activebackground="#FF6B81",
            activeforeground="#FFFFFF",
            relief="raised",
            bd=3,
            height=2,
            cursor="hand2",
            command=self.start_spin
        )
        self.spin_button.pack(fill="x")

    # =================================================================
    # 핵심 게임 로직 & 슬롯 애니메이션 처리 함수
    # =================================================================

    def start_spin(self):
        """[오늘의 운세 뽑기 시작! 🔥] 버튼 클릭 시 호출되는 함수"""
        if self.is_spinning:
            return  # 이미 슬롯이 돌아가는 중이면 중복 클릭 방지

        self.is_spinning = True
        self.spin_button.config(state="disabled", text="🎰 운세 릴 회전 중...")

        # 슬롯머신 회전 애니메이션 실행 (18번 돌아간 후 최종 결과 출력)
        self._animate_spin(spin_count=18)

    def _animate_spin(self, spin_count):
        """슬롯 릴이 빙글빙글 돌아가는 듯한 역동적인 스핀 애니메이션 효과"""
        if spin_count > 0:
            # 매 프레임마다 임시 랜덤 단어를 릴에 표시
            temp_status = random.choice(self.status_list)
            temp_event = random.choice(self.event_list)
            temp_item = random.choice(self.item_list)

            self.reel_labels[0].config(text=temp_status, fg="#A0AEC0")
            self.reel_labels[1].config(text=temp_event, fg="#A0AEC0")
            self.reel_labels[2].config(text=temp_item, fg="#A0AEC0")

            # 대기 시간을 점진적으로 늘려 서서히 멈추는 효과 연출
            delay = 50 + (18 - spin_count) * 8
            self.root.after(delay, lambda: self._animate_spin(spin_count - 1))
        else:
            # 애니메이션 종료 후 최종 랜덤 운세 결정!
            self._finalize_result()

    def _finalize_result(self):
        """파이썬 random.choice 함수를 활용해 최종 운세를 뽑고 화면에 출력합니다."""

        # 1. 상태, 사건, 아이템 리스트에서 각각 무작위로 1개씩 추출
        selected_status = random.choice(self.status_list)
        selected_event = random.choice(self.event_list)
        selected_item = random.choice(self.item_list)

        # 2. 중앙 3개 슬롯 창 텍스트 및 황금색 강조 갱신
        self.reel_labels[0].config(text=selected_status, fg=self.COLOR_GOLD)
        self.reel_labels[1].config(text=selected_event, fg=self.COLOR_GOLD)
        self.reel_labels[2].config(text=selected_item, fg=self.COLOR_GOLD)

        # 3. 하단 결과창에 요구사항 완성형 문장 출력
        # "오늘 당신은 [상태]로 학교에서 [사건]을 겪으며, 행운의 아이템은 [아이템]입니다!"
        final_sentence = (
            f"🌟 오늘 당신은 [{selected_status}] 상태로 학교에서\n"
            f"[{selected_event}] 사건을 겪으며,\n"
            f"행운의 아이템은 [{selected_item}] 입니다! ✨"
        )
        self.result_label.config(text=final_sentence, fg=self.COLOR_NEON_CYAN)

        # 4. 버튼 상태 복구
        self.is_spinning = False
        self.spin_button.config(state="normal", text="🔥 다시 뽑기 (Re-Spin)! 🔥")


# =================================================================
# 메인 프로그램 실행부
# =================================================================
if __name__ == "__main__":
    # Tkinter 메인 루프 생성 및 앱 실행
    root = tk.Tk()
    app = MorningLuckySlotMachine(root)
    root.mainloop()
