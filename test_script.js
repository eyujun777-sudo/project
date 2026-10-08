
    /* =====================================================
       ⚙️ 설정 1: GitHub OAuth App Client ID
    ===================================================== */
    const GITHUB_CLIENT_ID = 'Ov23liTjUpOj4R35f39b';

    /* =====================================================
       ⚙️ 설정 2: Supabase URL 및 anon key (데이터베이스)
       Supabase 프로젝트 설정 -> API 에서 복사하여 입력하세요.
    ===================================================== */
    const SUPABASE_URL = 'https://cwnkyixexrexqpkhlxng.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_Hcsk7AUN0ZGVPabBs2dTBg_Is90S0c-';

    // Supabase 클라이언트 초기화 (사용자가 키를 입력했을 때만)
    let supabase = null;
    if (SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL.startsWith('http')) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }

    /* ===== App State ===== */
    const ATPT_CODE = "C10";
    const SCHOOL_CODE = "7150597";
    let selectedDate = new Date("2026-10-08");
    const todayYMD = "2026-10-08";
    let selectedStarRating = 5;
    let showAllergyInfo = true;
    const mealCache = {};
    const STORAGE_VOTES_KEY = "daejin_meal_votes_v1";
    const STORAGE_AUTH_KEY = "daejin_gh_auth_v1";

    // GitHub Auth state
    let ghUser = null;          // { login, name, avatar_url, token }
    let deviceFlowTimeout = null;

    const initialReviews = [
      { date: "2026-10-08", stars: 5, text: "오늘 순살치킨 양념 소스 진짜 꿀맛입니다 🍗 대진전자 영양사님 감사해요!", time: "12:35", author: "daejin_student" },
      { date: "2026-10-08", stars: 5, text: "한우 육개장 국물 얼큰하고 고기 엄청 많아요 👍👍", time: "12:40", author: "daejin_student2" },
      { date: "2026-10-02", stars: 5, text: "닭갈비 볶음밥에 망고 푸딩 조합 미쳤음!!", time: "12:20", author: "student_03" },
      { date: "2026-10-01", stars: 4, text: "쭈삼 볶음밥 맛있어요. 마요네즈 찍어먹으니까 존맛!", time: "12:45", author: "student_04" }
    ];

    /* ===== Init ===== */
    document.addEventListener("DOMContentLoaded", () => {
      loadTheme();
      loadSavedAuth();
      updateDateDisplay();
      fetchMealDataForDate(formatYMD(selectedDate));
      fetchSupabaseData().then(() => {
        if (allVotes.length === 0) {
          renderWeeklyStats();
          renderMonthlyStats();
          renderReviewsFeed();
        }
      });
      checkClientId();
    });

    function checkClientId() {
      if (GITHUB_CLIENT_ID === 'YOUR_GITHUB_CLIENT_ID') {
        document.getElementById('clientIdNotice').style.display = 'block';
      }
    }

    /* ===== Theme ===== */
    function setTheme(mode) {
      document.documentElement.setAttribute('data-theme', mode);
      localStorage.setItem('meal_theme', mode);
      document.getElementById('btnDark').classList.toggle('active', mode === 'dark');
      document.getElementById('btnLight').classList.toggle('active', mode === 'light');
    }

    function loadTheme() {
      setTheme(localStorage.getItem('meal_theme') || 'dark');
    }

    /* ===== Settings Panel ===== */
    function toggleSettings() {
      const panel = document.getElementById('settingsPanel');
      const overlay = document.getElementById('settingsOverlay');
      const isOpen = panel.classList.contains('open');
      panel.classList.toggle('open', !isOpen);
      overlay.classList.toggle('open', !isOpen);
    }

    function closeSettings() {
      document.getElementById('settingsPanel').classList.remove('open');
      document.getElementById('settingsOverlay').classList.remove('open');
    }

    /* ===== GitHub Auth - Saved Session ===== */
    function loadSavedAuth() {
      try {
        const saved = localStorage.getItem(STORAGE_AUTH_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.token && parsed.login) {
            // Verify token still valid by calling /user
            verifyAndSetUser(parsed);
            return;
          }
        }
      } catch (e) { }
      renderAuthState('login');
    }

    async function verifyAndSetUser(userData) {
      try {
        const res = await fetch('/gh-api/user', {
          headers: { 'Authorization': 'Bearer ' + userData.token }
        });
        if (res.ok) {
          const freshData = await res.json();
          ghUser = {
            login: freshData.login,
            name: freshData.name || freshData.login,
            avatar_url: freshData.avatar_url,
            token: userData.token
          };
          localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(ghUser));
          renderAuthState('voted');
        } else {
          localStorage.removeItem(STORAGE_AUTH_KEY);
          renderAuthState('login');
        }
      } catch (e) {
        // Network error - still show user if cached
        ghUser = userData;
        renderAuthState('voted');
      }
    }

    /* ===== GitHub Device Flow ===== */
    async function startGithubDeviceFlow() {
      if (GITHUB_CLIENT_ID === 'YOUR_GITHUB_CLIENT_ID') {
        alert('⚠️ GitHub OAuth App의 Client ID를 코드에 설정해야 합니다.\n\nGitHub → Settings → Developer settings → OAuth Apps에서 앱을 만들고,\nindex.html 상단의 GITHUB_CLIENT_ID 값을 변경해 주세요.');
        return;
      }

      renderAuthState('device');

      try {
        // Step 1: Request device code
        const res = await fetch('/gh-api/device', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            client_id: GITHUB_CLIENT_ID,
            scope: 'read:user'
          })
        });

        if (!res.ok) {
          throw new Error('GitHub API 오류: ' + res.status);
        }

        const data = await res.json();

        if (data.error) {
          throw new Error(data.error_description || data.error);
        }

        const { device_code, user_code, verification_uri, interval, expires_in } = data;

        // Show user code
        document.getElementById('deviceCodeDisplay').textContent = user_code;
        document.getElementById('openGithubLink').href = verification_uri || 'https://github.com/login/device';

        // Step 2: Poll for token
        let pollInterval = (interval || 5) * 1000;
        const expiresAt = Date.now() + (expires_in || 900) * 1000;

        const pollToken = async () => {
          if (!document.getElementById('authDeviceSection') || document.getElementById('authDeviceSection').style.display === 'none') {
            return; // Stop polling if user cancelled
          }

          if (Date.now() > expiresAt) {
            cancelDeviceFlow();
            alert('⏱️ 인증 시간이 초과되었습니다. 다시 시도해 주세요.');
            return;
          }

          try {
            const tokenRes = await fetch('/gh-api/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                device_code: device_code,
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
              })
            });

            const resText = await tokenRes.text();
            document.getElementById('pollDebugLog').textContent = `[Debug] Status: ${tokenRes.status}, Error: ${JSON.parse(resText).error || 'None'}`;

            let tokenData;
            try {
              tokenData = JSON.parse(resText);
            } catch (e) {
              throw new Error(`JSON 파싱 실패`);
            }

            if (tokenData.access_token) {
              // Success! Get user info
              await fetchGithubUser(tokenData.access_token);
              return; // Stop polling
            } else if (tokenData.error === 'authorization_pending') {
              // Still waiting
              deviceFlowTimeout = setTimeout(pollToken, pollInterval);
            } else if (tokenData.error === 'slow_down') {
              // GitHub requires us to slow down polling
              pollInterval += 5000;
              deviceFlowTimeout = setTimeout(pollToken, pollInterval);
            } else if (tokenData.error === 'expired_token') {
              cancelDeviceFlow();
              alert('⏱️ 코드가 만료되었습니다. 다시 시도해 주세요.');
            } else if (tokenData.error === 'access_denied') {
              cancelDeviceFlow();
              alert('❌ 로그인이 취소되었습니다.');
            } else {
              // Other errors, retry anyway
              deviceFlowTimeout = setTimeout(pollToken, pollInterval);
            }
          } catch (e) {
            console.warn('Poll error:', e);
            document.getElementById('pollDebugLog').textContent = `[Debug Error] ${e.message}`;
            deviceFlowTimeout = setTimeout(pollToken, pollInterval);
          }
        };

        // Start polling
        deviceFlowTimeout = setTimeout(pollToken, pollInterval);

      } catch (err) {
        console.error('Device flow error:', err);
        renderAuthState('login');
        alert('❌ GitHub 로그인 시작 중 오류가 발생했습니다.\n' + err.message);
      }
    }

    async function fetchGithubUser(token) {
      try {
        const res = await fetch('/gh-api/user', {
          headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!res.ok) throw new Error('사용자 정보를 가져올 수 없습니다.');

        const userData = await res.json();
        ghUser = {
          login: userData.login,
          name: userData.name || userData.login,
          avatar_url: userData.avatar_url,
          token: token
        };

        localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(ghUser));
        renderAuthState('voted');

        if (window.confetti) {
          confetti({ particleCount: 60, spread: 55, origin: { y: 0.5 } });
        }
      } catch (err) {
        renderAuthState('login');
        alert('❌ 사용자 정보를 불러오는 중 오류가 발생했습니다.\n' + err.message);
      }
    }


    function cancelDeviceFlow() {
      if (deviceFlowTimeout) {
        clearTimeout(deviceFlowTimeout);
        deviceFlowTimeout = null;
      }
      renderAuthState('login');
    }

    function logout() {
      ghUser = null;
      localStorage.removeItem(STORAGE_AUTH_KEY);
      renderAuthState('login');
    }

    function copyDeviceCode() {
      const code = document.getElementById('deviceCodeDisplay').textContent;
      navigator.clipboard.writeText(code).then(() => {
        const el = document.getElementById('deviceCodeDisplay');
        const original = el.textContent;
        el.textContent = '✓ 복사됨!';
        el.classList.add('copied');
        setTimeout(() => {
          el.textContent = original;
          el.classList.remove('copied');
        }, 1500);
      });
    }

    /* ===== Auth State Renderer ===== */
    function renderAuthState(state) {
      // 'login' | 'device' | 'voted'
      document.getElementById('authLoginSection').style.display = state === 'login' ? 'block' : 'none';
      document.getElementById('authDeviceSection').style.display = state === 'device' ? 'block' : 'none';
      document.getElementById('authVoteSection').style.display = state === 'voted' ? 'block' : 'none';

      if (state === 'voted' && ghUser) {
        document.getElementById('userAvatar').src = ghUser.avatar_url || '';
        document.getElementById('userDisplayName').textContent = ghUser.name || ghUser.login;
      }
    }

    /* ===== Date Utils ===== */
    function formatYMD(d) {
      return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
    }

    function getKorDay(d) {
      return ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
    }

    function updateDateDisplay() {
      const ymd = formatYMD(selectedDate);
      const isToday = ymd === todayYMD;
      document.getElementById('datePicker').value = ymd;
      document.getElementById('selectedDateTitle').textContent =
        selectedDate.getFullYear() + '년 ' +
        (selectedDate.getMonth() + 1) + '월 ' +
        selectedDate.getDate() + '일 (' + getKorDay(selectedDate) + ') 식단';
      document.getElementById('votingCardBox').style.display = isToday ? 'block' : 'none';
      document.getElementById('votingLockedBox').style.display = isToday ? 'none' : 'block';
      document.getElementById('todayBtn').classList.toggle('today-active', isToday);
    }

    function changeDate(delta) {
      selectedDate.setDate(selectedDate.getDate() + delta);
      updateDateDisplay();
      fetchMealDataForDate(formatYMD(selectedDate));
    }

    function goToday() {
      selectedDate = new Date(todayYMD);
      updateDateDisplay();
      fetchMealDataForDate(formatYMD(selectedDate));
    }

    function onDatePickerChange(val) {
      if (!val) return;
      selectedDate = new Date(val);
      updateDateDisplay();
      fetchMealDataForDate(formatYMD(selectedDate));
    }

    function toggleAllergyDisplay() {
      showAllergyInfo = document.getElementById('allergyToggle').checked;
      const compact = formatYMD(selectedDate).replace(/-/g, '');
      if (mealCache[compact]) renderCurrentDishes(mealCache[compact]);
    }

    /* ===== NEIS API ===== */
    async function fetchMealDataForDate(ymdStr) {
      const compact = ymdStr.replace(/-/g, '');
      const container = document.getElementById('dishesListContainer');
      if (mealCache[compact]) { renderCurrentDishes(mealCache[compact]); return; }

      container.innerHTML = '<div class="empty-state"><div class="icon">⏳</div><strong>급식 정보 불러오는 중...</strong><span>NEIS 서버에 요청 중입니다.</span></div>';

      const url = 'https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&pIndex=1&pSize=10' +
        '&ATPT_OFCDC_SC_CODE=' + ATPT_CODE +
        '&SD_SCHUL_CODE=' + SCHOOL_CODE +
        '&MLSV_YMD=' + compact;
      try {
        const res = await fetch(url);
        const data = await res.json();
        const rows = data.mealServiceDietInfo && data.mealServiceDietInfo[1] && data.mealServiceDietInfo[1].row;
        if (rows) {
          mealCache[compact] = rows[0];
          renderCurrentDishes(rows[0]);
        } else {
          renderNoMeal();
        }
      } catch (e) {
        const fallback = getFallbackMeal(compact);
        if (fallback) { mealCache[compact] = fallback; renderCurrentDishes(fallback); }
        else renderNoMeal();
      }
    }

    function renderCurrentDishes(mealData) {
      const container = document.getElementById('dishesListContainer');
      if (!mealData || !mealData.DDISH_NM) { renderNoMeal(); return; }
      document.getElementById('calInfoVal').textContent = mealData.CAL_INFO || '-';
      document.getElementById('ntrInfoVal').innerHTML = (mealData.NTR_INFO || '').replace(/<br\/>/g, ' | ');

      const dishes = mealData.DDISH_NM.split('<br/>');
      container.innerHTML = dishes.map(dish => {
        let name = dish.trim();
        let allergy = '';
        const m = dish.match(/\(([\d\.]+)\)/);
        if (m) { allergy = '알레르기 ' + m[1]; name = dish.replace(/\([\d\.]+\)/, '').trim(); }
        return '<div class="dish-row"><span class="dish-name">' + name + '</span>' +
          (showAllergyInfo && allergy ? '<span class="allergy-tag">' + allergy + '</span>' : '') +
          '</div>';
      }).join('');
    }

    function renderNoMeal() {
      document.getElementById('calInfoVal').textContent = '-';
      document.getElementById('ntrInfoVal').textContent = '-';
      document.getElementById('dishesListContainer').innerHTML =
        '<div class="empty-state"><div class="icon">🏖️</div><strong>등록된 급식이 없습니다</strong><span>주말, 공휴일 또는 급식이 없는 날입니다.</span></div>';
    }

    function getFallbackMeal(compact) {
      const meals = {
        '20261006': { DDISH_NM: '귀리밥 <br/>육개장(한우) (5.6.9.13.16)<br/>애호박새우살볶음 (5.6.9)<br/>명란돌자반 (5)<br/>순살치킨,양념S (1.2.5.6.12.13.15)<br/>배추김치 (9)', CAL_INFO: '829.6 Kcal', NTR_INFO: '탄수화물 118.3g | 단백질 33.7g | 지방 23.5g' },
        '20261007': { DDISH_NM: '짜장면&오이채 (1.2.5.6.10.13.16)<br/>파송송계란탕국 (1.5.6.9)<br/>비타민샐러드 (1.2.5.6.12)<br/>코코넛왕새우튀김,칠리S (1.5.6.9.12.13)<br/>단무지무침<br/>마시는유산균음료 (2)', CAL_INFO: '1004.5 Kcal', NTR_INFO: '탄수화물 161.7g | 단백질 40.0g | 지방 24.2g' },
        '20261008': { DDISH_NM: '쌀밥<br/>쇠고기떡국 (1.5.6.13.16)<br/>김치제육볶음 (9.10.13)<br/>콩나물무침 (5)<br/>단호박버터구이 (2)<br/>배추김치 (9)', CAL_INFO: '875.0 Kcal', NTR_INFO: '탄수화물 130.2g | 단백질 36.5g | 지방 25.1g' }
      };
      return meals[compact] || null;
    }

    /* ===== Voting ===== */
    function selectStar(rating) {
      selectedStarRating = rating;
      document.querySelectorAll('.star-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i + 1 === rating);
      });
    }

    async function submitTodayVote() {
      if (!ghUser) {
        alert('⚠️ 투표하려면 GitHub 로그인이 필요합니다.');
        return;
      }
      if (!supabase) {
        alert('⚠️ Supabase 설정이 필요합니다. 소스코드를 확인해주세요.');
        return;
      }

      const text = document.getElementById('studentReviewInput').value.trim();
      const mealData = getFallbackMeal(todayYMD) || { DDISH_NM: '오늘의 급식' };
      // html 태그 제거해서 순수 텍스트만 저장
      const mealContent = mealData.DDISH_NM.replace(/<[^>]*>?/gm, ' ').trim();

      try {
        // 투표 저장 (Supabase)
        const { error } = await supabase.from('meal_votes').insert([{
          github_id: ghUser.login,
          github_name: ghUser.name,
          vote_date: todayYMD,
          meal_content: mealContent,
          stars: selectedStarRating,
          review: text || '오늘 급식 맛있게 잘 먹었습니다!'
        }]);

        if (error) {
          if (error.code === '23505') { // Unique constraint violation (PostgreSQL)
            alert('✅ ' + ghUser.name + '님은 오늘 이미 투표하셨습니다!\n내일 다시 참여해 주세요.');
          } else {
            throw error;
          }
          return;
        }

        if (window.confetti) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

        alert('🎉 ' + ghUser.name + '님의 투표가 제출되었습니다! (' + selectedStarRating + '점)');
        document.getElementById('studentReviewInput').value = '';

        // 통계 및 피드 갱신
        await fetchSupabaseData();
      } catch (err) {
        console.error(err);
        alert('❌ 투표 저장 중 오류가 발생했습니다: ' + err.message);
      }
    }

    // Supabase에서 가져온 데이터를 담을 전역 변수
    let allVotes = [];

    async function fetchSupabaseData() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('meal_votes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        allVotes = data || [];

        renderWeeklyStats();
        renderMonthlyStats();
        renderReviewsFeed();
      } catch (err) {
        console.error('Supabase 데이터 로드 실패:', err);
      }
    }

    /* ===== Stats ===== */
    function getDayString(dateStr) {
      const d = new Date(dateStr.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
      return ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][d.getDay()];
    }

    function renderWeeklyStats() {
      // 최근 7일(이번 주) 데이터 필터링
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // 날짜별 그룹화
      const dailyStats = {};
      allVotes.forEach(v => {
        const vDate = new Date(v.vote_date);
        if (vDate >= weekAgo) {
          if (!dailyStats[v.vote_date]) dailyStats[v.vote_date] = { sum: 0, count: 0, day: getDayString(v.vote_date) };
          dailyStats[v.vote_date].sum += v.stars;
          dailyStats[v.vote_date].count += 1;
        }
      });

      // 화면에 보여줄 5일 추출 (최근 데이터 순)
      let sortedDates = Object.keys(dailyStats).sort().reverse().slice(0, 5).reverse();

      let html = '';
      if (sortedDates.length === 0) {
        html = '<div style="text-align:center; padding: 2rem; color: var(--text-muted);">이번 주 데이터가 없습니다.</div>';
      } else {
        html = sortedDates.map(date => {
          const d = dailyStats[date];
          const avg = d.sum / d.count;
          const isToday = date === todayYMD ? '(오늘)' : '';
          return '<div class="stat-row">' +
            '<span class="stat-label">' + d.day + isToday + '</span>' +
            '<div class="stat-track"><div class="stat-fill" style="width:' + (avg / 5 * 100).toFixed(1) + '%"></div></div>' +
            '<span class="stat-score">' + avg.toFixed(2) + '</span>' +
            '</div>';
        }).join('');
      }
      document.getElementById('weeklyStatBars').innerHTML = html;
    }

    function renderMonthlyStats() {
      // 이번 달 데이터 (단순히 전체 투표로 대체, 실전에서는 이번 달 필터)
      const currentMonth = new Date().getMonth() + 1;
      const thisMonthVotes = allVotes.filter(v => {
        const d = new Date(v.vote_date);
        return (d.getMonth() + 1) === currentMonth;
      });

      const totalVotes = thisMonthVotes.length;
      let avgScore = 0;
      let fiveStarRatio = 0;

      if (totalVotes > 0) {
        const sum = thisMonthVotes.reduce((acc, v) => acc + v.stars, 0);
        avgScore = (sum / totalVotes).toFixed(2);
        const fiveStars = thisMonthVotes.filter(v => v.stars === 5).length;
        fiveStarRatio = Math.round((fiveStars / totalVotes) * 100);
      }

      // 일간 통계로 최고 인기 메뉴/요일 찾기 로직 등 추가 가능
      document.getElementById('totalVoteCountVal').textContent = totalVotes + '표';
      document.getElementById('monthlyScoreVal').textContent = avgScore;
      document.getElementById('fiveStarRatioVal').textContent = fiveStarRatio + '%';
    }

    function renderReviewsFeed() {
      const feed = allVotes.length > 0 ? allVotes : initialReviews; // Fallback
      const votes = feed.slice(0, 6);
      document.getElementById('reviewsFeedContainer').innerHTML = votes.map(v => {
        const dateStr = v.vote_date ? v.vote_date : v.date;
        const timeStr = v.created_at ? new Date(v.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : (v.time || '');
        const authorStr = v.github_id || v.author || '재학생';
        const textStr = v.review || v.text || '';
        return '<div class="review-item">' +
          '<div class="review-top">' +
          '<span class="review-author">@' + authorStr + '</span>' +
          '<span class="review-stars">' + '⭐'.repeat(v.stars) + '</span>' +
          '</div>' +
          '<div class="review-text">' + textStr + '</div>' +
          '<div class="review-date">' + dateStr + ' ' + timeStr + '</div>' +
          '</div>';
      }).join('');
    }

    /* ===== Tab Switch ===== */
    function switchView(viewId, tabIdx) {
      ['todayMealView', 'statsView', 'rankingView'].forEach(id => {
        document.getElementById(id).style.display = (id === viewId) ? 'grid' : 'none';
      });
      document.querySelectorAll('.tab-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === tabIdx);
      });
    }
  