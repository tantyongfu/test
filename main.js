// 倒计时管理模块
class CountdownManager {
    constructor(endDate) {
        this.endDate = endDate;
        this.totalDuration = endDate - new Date();
        this.elements = {
            days: document.getElementById('days'),
            hours: document.getElementById('hours'),
            minutes: document.getElementById('minutes'),
            seconds: document.getElementById('seconds'),
            progressBar: document.getElementById('progress-bar'),
            progressText: document.getElementById('progress-text')
        };
    }

    start() {
        this.update();
        this.interval = setInterval(() => this.update(), 1000);
    }

    update() {
        const now = new Date();
        const distance = this.endDate - now;

        if (distance < 0) {
            this.stop();
            this.showExpired();
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        this.updateDisplay(days, hours, minutes, seconds);
        this.updateProgress(distance);
    }

    updateDisplay(days, hours, minutes, seconds) {
        this.animateNumberChange(this.elements.days, days);
        this.animateNumberChange(this.elements.hours, hours);
        this.animateNumberChange(this.elements.minutes, minutes);
        this.animateNumberChange(this.elements.seconds, seconds);
    }

    animateNumberChange(element, value) {
        const formattedValue = String(value).padStart(2, '0');
        if (element.textContent !== formattedValue) {
            element.classList.add('number-change');
            element.textContent = formattedValue;
            setTimeout(() => element.classList.remove('number-change'), 300);
        }
    }

    updateProgress(distance) {
        const elapsed = this.totalDuration - distance;
        const percentage = (elapsed / this.totalDuration) * 100;
        this.elements.progressBar.style.width = `${percentage}%`;
        this.elements.progressText.textContent = `${percentage.toFixed(2)}%`;
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    showExpired() {
        document.getElementById('countdown').innerHTML = `
            <div class="col-span-4 text-center text-3xl font-bold text-red-600">
                活动已结束
            </div>
        `;
        document.getElementById('submit-btn').disabled = true;
        document.getElementById('btn-text').textContent = '活动已结束';
    }
}

// 抽奖管理模块
class LotteryManager {
    constructor() {
        this.storageKey = 'lottery_data';
        this.loadData();
    }

    loadData() {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
            const parsed = JSON.parse(data);
            this.winner = parsed.winner || null;
            this.participants = parsed.participants || [];
        } else {
            this.winner = null;
            this.participants = [];
        }
    }

    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify({
            winner: this.winner,
            participants: this.participants
        }));
    }

    hasWinner() {
        return this.winner !== null;
    }

    hasParticipated(uid) {
        return this.participants.includes(uid);
    }

    participate(uid) {
        if (this.hasWinner()) {
            return {
                success: false,
                message: '抽奖名额已被抢完，下次请早！'
            };
        }

        if (this.hasParticipated(uid)) {
            return {
                success: false,
                message: '您已经参与过抽奖了，每个UID只能参与一次！'
            };
        }

        // 简单的抽奖逻辑：随机决定是否中奖
        // 由于只有1个名额，可以设置一定的中奖概率
        const isWinner = Math.random() < 0.3; // 30%的中奖概率

        this.participants.push(uid);

        if (isWinner) {
            this.winner = uid;
            this.saveData();
            return {
                success: true,
                isWinner: true,
                message: `恭喜您中奖了！您的UID：${uid}`
            };
        } else {
            this.saveData();
            return {
                success: true,
                isWinner: false,
                message: '很遗憾，您未中奖，但感谢您的参与！'
            };
        }
    }

    getRemainingSlots() {
        return this.hasWinner() ? 0 : 1;
    }
}

// UI管理模块
class UIManager {
    constructor() {
        this.elements = {
            form: document.getElementById('lottery-form'),
            uidInput: document.getElementById('uid'),
            submitBtn: document.getElementById('submit-btn'),
            btnText: document.getElementById('btn-text'),
            result: document.getElementById('result'),
            error: document.getElementById('error'),
            resultMessage: document.getElementById('result-message'),
            errorMessage: document.getElementById('error-message'),
            remainingSlots: document.getElementById('remaining-slots')
        };
    }

    showLoading() {
        this.elements.submitBtn.disabled = true;
        this.elements.btnText.innerHTML = '<span class="loading"></span>';
    }

    hideLoading() {
        this.elements.submitBtn.disabled = false;
        this.elements.btnText.textContent = '🎁 立即抽奖';
    }

    showSuccess(message) {
        this.elements.result.classList.remove('hidden');
        this.elements.result.classList.add('bounce-in');
        this.elements.error.classList.add('hidden');
        this.elements.resultMessage.textContent = message;
        this.elements.form.style.display = 'none';
    }

    showError(message) {
        this.elements.error.classList.remove('hidden');
        this.elements.error.classList.add('bounce-in');
        this.elements.result.classList.add('hidden');
        this.elements.errorMessage.textContent = message;
        this.hideLoading();
    }

    updateRemainingSlots(count) {
        this.elements.remainingSlots.textContent = count;
        if (count === 0) {
            this.elements.submitBtn.disabled = true;
            this.elements.btnText.textContent = '名额已满';
        }
    }

    resetMessages() {
        this.elements.result.classList.add('hidden');
        this.elements.error.classList.add('hidden');
    }
}

// 主应用类
class LotteryApp {
    constructor() {
        // 设置90天后的结束时间
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 90);
        
        this.countdown = new CountdownManager(endDate);
        this.lottery = new LotteryManager();
        this.ui = new UIManager();
        
        this.init();
    }

    init() {
        // 启动倒计时
        this.countdown.start();
        
        // 更新剩余名额
        this.ui.updateRemainingSlots(this.lottery.getRemainingSlots());
        
        // 绑定表单提交事件
        this.ui.elements.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // 输入框变化时重置消息
        this.ui.elements.uidInput.addEventListener('input', () => {
            this.ui.resetMessages();
        });
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const uid = this.ui.elements.uidInput.value.trim();
        
        if (!uid) {
            this.ui.showError('请输入您的UID');
            return;
        }

        // 显示加载状态
        this.ui.showLoading();

        // 模拟网络延迟
        setTimeout(() => {
            const result = this.lottery.participate(uid);
            
            if (result.success) {
                if (result.isWinner) {
                    this.ui.showSuccess(result.message);
                    this.ui.updateRemainingSlots(0);
                    this.celebrateWin();
                } else {
                    this.ui.showError(result.message);
                }
            } else {
                this.ui.showError(result.message);
            }
        }, 1500);
    }

    celebrateWin() {
        // 创建庆祝效果
        this.createConfetti();
    }

    createConfetti() {
        const colors = ['#667eea', '#764ba2', '#f093fb', '#ffd700', '#ff69b4'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.position = 'fixed';
                confetti.style.width = '10px';
                confetti.style.height = '10px';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.left = Math.random() * window.innerWidth + 'px';
                confetti.style.top = '-10px';
                confetti.style.opacity = '1';
                confetti.style.borderRadius = '50%';
                confetti.style.pointerEvents = 'none';
                confetti.style.zIndex = '9999';
                
                document.body.appendChild(confetti);
                
                const animation = confetti.animate([
                    { 
                        transform: 'translateY(0) rotate(0deg)',
                        opacity: 1
                    },
                    { 
                        transform: `translateY(${window.innerHeight + 10}px) rotate(${Math.random() * 360}deg)`,
                        opacity: 0
                    }
                ], {
                    duration: 3000 + Math.random() * 2000,
                    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                });
                
                animation.onfinish = () => confetti.remove();
            }, i * 30);
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new LotteryApp();
});