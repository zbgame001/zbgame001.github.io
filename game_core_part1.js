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

// ==================== 生成完全随机的虚拟起始日期 ====================
function generateRandomVirtualStartDate() {
    // 完全随机的正数年份（2000到3000年之间）
    const year = Math.floor(Math.random() * 1001) + 2000;
    
    // 随机月份 1-12
    const month = Math.floor(Math.random() * 12) + 1;
    
    // 根据年份和月份确定最大天数（处理闰年）
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const monthDays = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const maxDay = monthDays[month - 1];
    
    // 随机日期 1-最大天数
    const day = Math.floor(Math.random() * maxDay) + 1;
    
    // 随机时间
    const hours = Math.floor(Math.random() * 24);
    const minutes = Math.floor(Math.random() * 60);
    const seconds = Math.floor(Math.random() * 60);
    
    return {
        year: year,
        month: month,
        day: day,
        hours: hours,
        minutes: minutes,
        seconds: seconds
    };
}

// ==================== 虚拟日期系统（已修复） ====================
function getVirtualDate() {
    // 如果没有设置起始日期，生成一个（兼容旧存档）
    if (!gameState.virtualStartDate) {
        gameState.virtualStartDate = generateRandomVirtualStartDate();
    }
    
    const startDate = gameState.virtualStartDate;
    
    // 将起始时间转换为毫秒偏移量
    const startOffset = startDate.hours * VIRTUAL_HOUR_MS + 
                        startDate.minutes * VIRTUAL_MINUTE_MS + 
                        startDate.seconds * VIRTUAL_SECOND_MS;
    
    // 总游戏时间 = 实际游戏时间 + 起始时间偏移
    const totalGameTime = gameTimer + startOffset;
    
    // 计算从起始日期开始的总天数和当天的时间
    const totalDays = Math.floor(totalGameTime / VIRTUAL_DAY_MS);
    const timeInDay = totalGameTime % VIRTUAL_DAY_MS;
    
    // 计算当前日期（起始日 + 经过的天数）
    let currentYear = startDate.year;
    let currentMonth = startDate.month;
    let currentDay = startDate.day + totalDays;
    
    // 处理日期进位（考虑闰年和不同月份天数）
    while (true) {
        const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || (currentYear % 400 === 0);
        const daysInCurrentMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][currentMonth - 1];
        
        if (currentDay > daysInCurrentMonth) {
            currentDay -= daysInCurrentMonth;
            currentMonth++;
            if (currentMonth > 12) {
                currentMonth = 1;
                currentYear++;
            }
        } else {
            break;
        }
    }
    
    // 从当天时间偏移计算时分秒
    const hours = Math.floor(timeInDay / VIRTUAL_HOUR_MS);
    const minutes = Math.floor((timeInDay % VIRTUAL_HOUR_MS) / VIRTUAL_MINUTE_MS);
    const seconds = Math.floor((timeInDay % VIRTUAL_MINUTE_MS) / VIRTUAL_SECOND_MS);
    
    return {
        year: currentYear,
        month: currentMonth,
        day: currentDay,
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
    
    // ✅ 新增：虚拟起始日期（完全随机，2000-3000年）
    virtualStartDate: null,
    
    // ✅ 新增：封号类型系统（0=原有普通封号, 1=作品私密+头像空白+名字UID, 2=名字UID+头像空白, 3=所有作品私密）
    banType: 0,
    originalUsername: '', // 保存封禁前的原始名字
    originalAvatar: '', // 保存封禁前的原始头像文字
    originalAvatarImage: '', // 保存封禁前的原始头像图片
    preBanPublicWorks: [], // 保存封禁前公开的作品ID列表（用于类型1和3）
    
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

// ==================== 封号涨粉拦截系统（核心新增） ====================
// 使用 Object.defineProperty 拦截 fans 属性的修改，实现全局检测
function setupBanInterceptor() {
    let internalFans = gameState.fans || 0;
    
    Object.defineProperty(gameState, 'fans', {
        get: function() {
            return internalFans;
        },
        set: function(value) {
            // 如果被封号且新值大于当前值（即涨粉操作），则阻止
            if (gameState.isBanned && value > internalFans) {
                console.log(`[封号拦截] 阻止涨粉: ${internalFans} → ${value}，来源: ${new Error().stack}`);
                return; // 直接返回，不修改值
            }
            // 允许修改（包括掉粉和正常情况）
            internalFans = value;
        },
        configurable: true // 允许后续重新配置（用于存档加载后重新设置）
    });
    
    // 同步初始值
    internalFans = gameState.fans || 0;
    console.log('[封号拦截] 全局涨粉拦截器已启动');
}

// 解封后清理函数（用于确保解封状态正确）
window.clearBanState = function() {
    gameState.isBanned = false;
    gameState.banDaysCount = 0;
    gameState.banStartTime = null;
    console.log('[封号状态] 已清除封禁状态，恢复涨粉功能');
};

// 立即设置拦截器（针对新游戏）
setupBanInterceptor();
