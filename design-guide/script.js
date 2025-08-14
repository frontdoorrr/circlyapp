// Circly App JavaScript

// 전역 상태
let currentTab = 'home';
let polls = [
    {
        id: 1,
        question: "가장 잘생긴 사람은?",
        circleId: 1,
        circleName: "3학년 2반",
        timeLeft: "2시간 30분",
        totalVotes: 18,
        hasVoted: false,
        options: [
            { name: "민수", votes: 8, percentage: 44 },
            { name: "지훈", votes: 5, percentage: 28 },
            { name: "태현", votes: 3, percentage: 17 },
            { name: "승호", votes: 2, percentage: 11 }
        ]
    },
    {
        id: 2,
        question: "가장 친절한 사람은?",
        circleId: 1,
        circleName: "3학년 2반",
        timeLeft: "완료",
        totalVotes: 22,
        hasVoted: true,
        options: [
            { name: "서연", votes: 12, percentage: 55 },
            { name: "미나", votes: 6, percentage: 27 },
            { name: "은지", votes: 4, percentage: 18 }
        ]
    }
];

const questionTemplates = {
    외모: [
        "가장 잘생긴 사람은?",
        "가장 예쁜 사람은?",
        "오늘 패션이 가장 멋진 사람은?",
        "미소가 가장 예쁜 사람은?"
    ],
    성격: [
        "가장 친절한 사람은?",
        "가장 재밌는 사람은?",
        "가장 든든한 사람은?",
        "가장 유쾌한 사람은?"
    ],
    재능: [
        "가장 똑똑한 사람은?",
        "운동을 가장 잘하는 사람은?",
        "노래를 가장 잘하는 사람은?",
        "그림을 가장 잘 그리는 사람은?"
    ]
};

// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// 앱 초기화
function initializeApp() {
    switchTab('home');
    updatePollDisplay();
    
    // 실시간 시간 업데이트 시뮬레이션
    setInterval(updateTimeDisplay, 60000);
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 모달 배경 클릭 시 닫기
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    // 복사 버튼 기능
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            copyToClipboard(this);
        });
    });
}

// 탭 전환
function switchTab(tabName) {
    // 네비게이션 아이템 업데이트
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');

    // 탭 콘텐츠 업데이트
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');

    currentTab = tabName;

    // 메인 콘텐츠 애니메이션
    const mainContent = document.getElementById('mainContent');
    mainContent.classList.add('fade');
    
    setTimeout(() => {
        mainContent.classList.remove('fade');
    }, 150);
}

// 투표 상세 모달 열기
function openPollModal(pollId) {
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;

    const modal = document.getElementById('pollModal');
    const modalHeader = modal.querySelector('.modal-header');
    
    // 모달 내용 업데이트
    modalHeader.querySelector('h2').textContent = poll.question;
    modalHeader.querySelector('p').textContent = poll.circleName;
    modalHeader.querySelector('.time-info span').textContent = `${poll.timeLeft} 남음`;

    // 옵션 리스트 업데이트
    const optionList = modal.querySelector('.option-list');
    optionList.innerHTML = poll.options.map(option => `
        <button class="option-item" onclick="vote(${pollId}, '${option.name}')">
            <span>${option.name}</span>
            <i class="fas fa-arrow-right"></i>
        </button>
    `).join('');

    showModal('pollModal');
}

// 투표하기
function vote(pollId, optionName) {
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;

    // 투표 처리 시뮬레이션
    showLoadingFeedback();
    
    setTimeout(() => {
        poll.hasVoted = true;
        poll.totalVotes++;
        
        // 선택된 옵션 투표수 증가
        const option = poll.options.find(opt => opt.name === optionName);
        if (option) {
            option.votes++;
        }
        
        // 퍼센테이지 재계산
        poll.options.forEach(opt => {
            opt.percentage = Math.round((opt.votes / poll.totalVotes) * 100);
        });

        // 옵션을 투표수 기준으로 정렬
        poll.options.sort((a, b) => b.votes - a.votes);

        updatePollDisplay();
        closePollModal();
        showSuccessFeedback('투표가 완료되었습니다! 🎉');
        
        // 결과 보기로 자동 전환
        setTimeout(() => {
            showResultCard(pollId);
        }, 1000);
    }, 1000);
}

// 초대 모달 열기
function showInviteModal() {
    showModal('inviteModal');
}

// 결과 카드 모달 열기
function showResultCard(pollId = 2) {
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;

    const modal = document.getElementById('resultModal');
    const resultCard = modal.querySelector('.result-card');
    
    // 결과 카드 내용 업데이트
    resultCard.querySelector('h3').textContent = poll.question;
    
    const winner = poll.options[0];
    const winnerElement = resultCard.querySelector('.winner');
    winnerElement.querySelector('.winner-name').textContent = winner.name;
    winnerElement.querySelector('.winner-percentage').textContent = `(${winner.percentage}%)`;
    
    // 차트 업데이트
    const chart = resultCard.querySelector('.result-chart');
    chart.innerHTML = poll.options.slice(0, 3).map((option, index) => {
        const colors = ['var(--pink-400)', 'var(--purple-400)', 'var(--blue-400)'];
        return `
            <div class="chart-item">
                <span class="name">${option.name}</span>
                <div class="bar-container">
                    <div class="bar" style="width: ${option.percentage}%; background: ${colors[index]};"></div>
                </div>
                <span class="percentage">${option.percentage}%</span>
            </div>
        `;
    }).join('');
    
    // 총 참여자 수 업데이트
    resultCard.querySelector('.result-footer').textContent = `총 ${poll.totalVotes}명 참여 • circly.app`;
    
    showModal('resultModal');
    
    // 차트 애니메이션
    setTimeout(() => {
        const bars = modal.querySelectorAll('.bar');
        bars.forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.width = width;
            }, 100);
        });
    }, 200);
}

// 질문 카테고리 선택
function showQuestions(category) {
    const questions = questionTemplates[category];
    if (!questions) return;

    // 간단한 질문 선택 시뮬레이션
    const selectedQuestion = questions[Math.floor(Math.random() * questions.length)];
    
    showLoadingFeedback();
    
    setTimeout(() => {
        showSuccessFeedback(`"${selectedQuestion}" 투표가 생성되었습니다! 🎉`);
        switchTab('home');
    }, 1500);
}

// 모달 표시
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// 모달 닫기
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

// 모든 모달 닫기
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
    document.body.style.overflow = 'auto';
}

// 개별 모달 닫기 함수들
function closePollModal() {
    closeModal('pollModal');
}

function closeInviteModal() {
    closeModal('inviteModal');
}

function closeResultModal() {
    closeModal('resultModal');
}

// 클립보드에 복사
function copyToClipboard(button) {
    const text = button.closest('.invite-option').querySelector('.invite-url, .invite-code').textContent;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showCopyFeedback(button);
        });
    } else {
        // 폴백: 텍스트 선택 방식
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showCopyFeedback(button);
    }
}

// 복사 성공 피드백
function showCopyFeedback(button) {
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> 복사됨';
    button.style.color = 'var(--green-500)';
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.color = 'var(--purple-500)';
    }, 2000);
}

// 성공 피드백 표시
function showSuccessFeedback(message) {
    const feedback = document.createElement('div');
    feedback.className = 'success-feedback';
    feedback.textContent = message;
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.remove();
    }, 3000);
}

// 로딩 피드백 표시
function showLoadingFeedback() {
    document.querySelectorAll('.btn-primary, .btn-vote, .option-item').forEach(btn => {
        btn.classList.add('loading');
        btn.disabled = true;
    });
    
    setTimeout(() => {
        document.querySelectorAll('.loading').forEach(element => {
            element.classList.remove('loading');
            element.disabled = false;
        });
    }, 1500);
}

// 투표 목록 업데이트
function updatePollDisplay() {
    // 실제 구현에서는 서버에서 데이터를 가져와야 함
    // 여기서는 시뮬레이션을 위한 코드
}

// 시간 표시 업데이트
function updateTimeDisplay() {
    // 실시간 시간 업데이트 로직
    // 실제 구현에서는 서버 시간과 동기화 필요
}

// SNS 공유 기능
function shareToInstagram() {
    // Instagram Web API 또는 네이티브 앱 연동
    showSuccessFeedback('Instagram으로 공유되었습니다! 📸');
}

function shareToKakao() {
    // 카카오톡 SDK 연동
    showSuccessFeedback('카카오톡으로 공유되었습니다! 💬');
}

// 이미지 저장
function saveResultImage() {
    // Canvas API를 사용한 이미지 생성 및 저장
    showSuccessFeedback('이미지가 갤러리에 저장되었습니다! 📱');
}

// 에러 처리
function handleError(error) {
    console.error('Circly App Error:', error);
    showSuccessFeedback('잠시 후 다시 시도해주세요 🔄');
}

// 개발자 도구용 디버그 함수들
function debugPoll(pollId) {
    console.log('Poll Debug:', polls.find(p => p.id === pollId));
}

function resetPolls() {
    polls.forEach(poll => {
        poll.hasVoted = false;
        poll.totalVotes = Math.floor(Math.random() * 30) + 10;
        poll.options.forEach(option => {
            option.votes = Math.floor(Math.random() * poll.totalVotes * 0.4);
            option.percentage = Math.round((option.votes / poll.totalVotes) * 100);
        });
    });
    console.log('Polls reset for testing');
}

// 앱 버전 정보
console.log('🎉 Circly App v1.0.0 - 익명 칭찬 투표 플랫폼');