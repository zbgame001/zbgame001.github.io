// ==================== 虚拟时间机制 ====================
const VIRTUAL_DAY_MS = 1 * 60 * 1000;
const VIRTUAL_MONTH_DAYS = 30;
const VIRTUAL_YEAR_DAYS = 365;

const VIRTUAL_HOUR_MS = VIRTUAL_DAY_MS / 24;
const VIRTUAL_MINUTE_MS = VIRTUAL_HOUR_MS / 60;
const VIRTUAL_SECOND_MS = VIRTUAL_MINUTE_MS / 60;

window.charts = {
    fans: null,
    likes: null,
    views: null,
    interactions: null
};

// ==================== 虚拟日期系统 ====================
const GAME_START_VIRTUAL_DATE = {
    year: 2025,
    month: 1,
    day: 1
};

function getVirtualDate() {
    const totalDays = Math.floor(getVirtualDaysPassed());
    const currentYear = GAME_START_VIRTUAL_DATE.year + Math.floor(totalDays / 365);
    const dayOfYear = totalDays % 365;
    
    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let remainingDays = dayOfYear;
    let month = 0;
    
    for (let i = 0; i < monthDays.length; i++) {
        if (remainingDays < monthDays[i]) {
            month = i;
            break;
        }
        remainingDays -= monthDays[i];
    }
    
    const timeInDay = gameTimer % VIRTUAL_DAY_MS;
    const hours = Math.floor(timeInDay / VIRTUAL_HOUR_MS);
    const minutes = Math.floor((timeInDay % VIRTUAL_HOUR_MS) / VIRTUAL_MINUTE_MS);
    const seconds = Math.floor((timeInDay % VIRTUAL_MINUTE_MS) / VIRTUAL_SECOND_MS);
    
    return {
        year: currentYear,
        month: month + 1,
        day: remainingDays + 1,
        totalDays: totalDays,
        totalMonths: Math.floor(totalDays / 30),
        totalYears: Math.floor(totalDays / 365),
        hours: hours,
        minutes: minutes,
        seconds: seconds,
        formattedTime: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    };
}

function formatVirtualDate(short = false) {
    const date = getVirtualDate();
    if (short) {
        return `${date.year}年${String(date.month).padStart(2, '0')}月${String(date.day).padStart(2, '0')}日 ${date.formattedTime}`;
    }
    return `虚拟${date.year}年${date.month}月${date.day}日 ${date.formattedTime}`;
}

// ==================== 核心计时器系统 ====================
let gameTimer = 0;
let realStartTime = Date.now();
let timerInterval = null;

function startGameTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    timerInterval = setInterval(() => {
        const now = Date.now();
        const delta = now - realStartTime;
        gameTimer += delta;
        window.gameTimer = gameTimer; // ✅ 修复2：计时器循环中同步
        realStartTime = now;
        saveGame();
    }, 1000);
}

function stopGameTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function getVirtualDaysPassed() {
    if (!gameTimer || isNaN(gameTimer) || gameTimer < 0) {
        console.warn('gameTimer异常，重置为0:', gameTimer);
        gameTimer = 0;
        return 0;
    }
    return gameTimer / VIRTUAL_DAY_MS;
}

// ==================== 游戏状态 ====================
let gameState = {
    username: '', 
    userId: '', 
    avatar: '', 
    avatarImage: '', // 新增：存储base64图片数据
    fans: 0, 
    likes: 0, 
    views: 0, 
    works: 0, 
    money: 0, 
    warnings: 0, 
    isBanned: false, 
    banReason: '', 
    banDaysCount: 0, 
    banStartTime: null,
    isHotSearch: false, 
    hotSearchDaysCount: 0, 
    hotSearchStartTime: null,
    hotSearchInterval: null, 
    hotSearchTitle: '', 
    
    // ✅ 修复：补充舆论风波系统缺失的初始状态
    isPublicOpinionCrisis: false,
    publicOpinionDaysCount: 0,
    publicOpinionStartTime: null,
    publicOpinionInterval: null,
    publicOpinionTitle: '',
    
    achievements: [], 
    worksList: [], 
    notifications: [], 
    liveStatus: false, 
    lastUpdateTime: 0,
    lastWorkTime: 0,
    isDroppingFansFromInactivity: false,
    inactivityDropInterval: null,
    inactivityWarningShown: false,
    highAdCountDropInterval: null,
    highAdCountWarningShown: false,
    gameStartTime: 0,
    chartData: { 
        fans: [], 
        likes: [], 
        views: [], 
        interactions: [],
        currentIndex: 0,
        currentDay: 0,
        lastInteractionTotal: 0
    }, 
    liveInterval: null, 
    workUpdateIntervals: [], 
    banInterval: null, 
    banDropInterval: null, 
    trafficWorks: {}, 
    totalInteractions: 0,
    activeFans: 0,
    appealAvailable: true, 
    devMode: false,
    gameTimer: 0,
    realStartTime: 0,
    // 新增虚假商单相关状态
    fakeAdPenalty: null,
    fakeAdPenaltyInterval: null,
    fakeAdBans: 0,
    monthsWithoutFakeAd: 0,
    lastCheckMonth: -1,
    // ✅ 修复：补充舆论风波系统缺失的初始状态
    isPublicOpinionCrisis: false,
    publicOpinionDaysCount: 0,
    publicOpinionStartTime: null,
    publicOpinionInterval: null,
    publicOpinionTitle: '',
    
    // ✅ 新增功能：关注列表和评论点赞状态
    following: [], // 关注列表
    commentLikes: {}, // 记录用户点赞过的评论 {workId_commentId: true}
    
    // ✅ 新增：消息中心
    messages: [], // 消息列表：点赞、评论、转发等互动消息

    // ✅ 新增：私信系统状态
    privateMessageSystem: {
        conversations: [],
        unreadCount: 0,
        lastCheckTime: 0,
        generationInterval: null
    },
    
    // ✅ 新增：系统消息状态
    systemMessages: {
        unreadCount: 0,
        messages: [],
        hotSearchActiveWorks: []
    },
    
    // ✅ 新增：宠粉狂魔成就相关计数
    commentRepliesCount: 0, // 回复评论总数
    liveHistory: [], // 直播历史记录
    
    // ✅ 新增：社交达人成就计数
    followingCount: 0, // 关注人数（冗余字段，实际用following.length）
    
    // ✅ 新增：基础涨粉/掉粉增益（每发布一个作品增加）
    baseFanChangeBoost: 0, // 初始为0，每发布一个作品增加5
    
    // ✅ 新增：消息免打扰状态
    doNotDisturb: false // 默认关闭
};
