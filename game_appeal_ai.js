// ==================== 申诉AI审核系统 ====================
// 本模块实现机器审核功能，检测申诉文本的真诚度
// 依赖: game_core.js (gameState, gameTimer)
// 依赖: game_ui.js (showAlert)

// ==================== 申诉AI配置 ====================
const APPEAL_AI_CONFIG = {
    minLength: 20,           // 最小字数
    maxLength: 300,          // 最大字数
    targetLength: 80,        // 理想字数
    sincerityKeywords: [     // 真诚词汇（加分）
        '真诚', '抱歉', '错误', '改正', '保证', '承诺', '理解', '认识',
        '深刻', '反思', '学习', '改进', '态度', '认真', '负责', '遵守',
        '规则', '规范', '注意', '小心', '谨慎', '尊重', '用户', '平台'
    ],
    templateKeywords: [      // 模板化词汇（扣分）
        '申诉', '请求', '撤销', '希望可以', '希望能够', '给我一次机会',
        '下次不会', '再也不敢', '原谅', '饶恕', '无知', '不懂', '不知道'
    ],
    sincerityPhrases: [      // 真诚短语（大幅加分）
        '深刻认识到错误', '诚心诚意道歉', '认真反思行为', '保证不再犯',
        '严格遵守规定', '珍惜账号', '尊重平台规则', '对用户负责'
    ],
    templatePhrases: [       // 模板短语（大幅扣分）
        '请求撤销警告', '希望可以', '希望能够', '给我一次机会', '下次不敢了',
        '真不知道', '不懂规矩', '无心之失', '不小心犯错'
    ],
    sincerityThreshold: 7.0,  // 通过阈值
    maxScore: 10.0
};

// ==================== 核心AI审核函数 ====================
function performAppealAICheck(appealText, callback) {
    // 基础参数
    const text = appealText.trim();
    const length = text.length;
    
    // 初始化评分
    let score = 5.0;  // 基础分5.0
    
    // ==================== 1. 字数评分 (权重: 20%) ====================
    let lengthScore = 0;
    if (length < APPEAL_AI_CONFIG.minLength) {
        lengthScore = 2.0;  // 字数太少
    } else if (length > APPEAL_AI_CONFIG.maxLength) {
        lengthScore = 6.0;  // 字数太多
    } else {
        // 理想字数附近得分最高
        const ratio = Math.abs(length - APPEAL_AI_CONFIG.targetLength) / APPEAL_AI_CONFIG.targetLength;
        lengthScore = 9.0 - (ratio * 4.0);
    }
    score += (lengthScore - 5.0) * 0.2;
    
    // ==================== 2. 关键词检测 (权重: 25%) ====================
    let keywordScore = 5.0;
    const sincerityMatches = APPEAL_AI_CONFIG.sincerityKeywords.filter(keyword => 
        text.includes(keyword)
    ).length;
    const templateMatches = APPEAL_AI_CONFIG.templateKeywords.filter(keyword => 
        text.includes(keyword)
    ).length;
    
    // 真诚词汇加分
    keywordScore += sincerityMatches * 0.5;
    // 模板词汇扣分
    keywordScore -= templateMatches * 0.8;
    
    // 限制范围
    keywordScore = Math.max(1.0, Math.min(9.0, keywordScore));
    score += (keywordScore - 5.0) * 0.25;
    
    // ==================== 3. 短语检测 (权重: 30%) ====================
    let phraseScore = 5.0;
    const hasSincerityPhrase = APPEAL_AI_CONFIG.sincerityPhrases.some(phrase => 
        text.includes(phrase)
    );
    const hasTemplatePhrase = APPEAL_AI_CONFIG.templatePhrases.some(phrase => 
        text.includes(phrase)
    );
    
    if (hasSincerityPhrase) phraseScore += 3.0;  // 有真诚短语大幅加分
    if (hasTemplatePhrase) phraseScore -= 2.5;   // 有模板短语大幅扣分
    
    phraseScore = Math.max(1.0, Math.min(10.0, phraseScore));
    score += (phraseScore - 5.0) * 0.30;
    
    // ==================== 4. 情感分析 (权重: 15%) ====================
    let emotionScore = 5.0;
    // 检测积极/消极情感词汇
    const positiveWords = ['感谢', '感谢平台', '感谢理解', '感谢给机会', '会珍惜'];
    const negativeWords = ['倒霉', '倒霉', '倒霉透顶', '运气不好', '真倒霉'];
    
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    emotionScore += positiveCount * 0.8;
    emotionScore -= negativeCount * 0.6;
    
    emotionScore = Math.max(2.0, Math.min(9.0, emotionScore));
    score += (emotionScore - 5.0) * 0.15;
    
    // ==================== 5. 重复内容检测 (权重: 10%) ====================
    let repeatScore = 10.0;
    const sentences = text.split(/[。！？\n]/).filter(s => s.trim());
    
    // 检测重复句子
    const uniqueSentences = new Set(sentences);
    if (sentences.length > 1) {
        const repeatRatio = (sentences.length - uniqueSentences.size) / sentences.length;
        repeatScore -= repeatRatio * 8.0;  // 重复内容大幅扣分
    }
    
    // 检测重复词汇
    const words = text.split(/[\s,，。！？\n]/).filter(w => w.trim());
    const wordFreq = {};
    words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    const repeatWords = Object.values(wordFreq).filter(freq => freq > 2).length;
    repeatScore -= repeatWords * 0.5;
    
    repeatScore = Math.max(1.0, Math.min(10.0, repeatScore));
    score += (repeatScore - 5.0) * 0.10;
    
    // ==================== 6. 模板化程度检测 (补充权重) ====================
    let templateScore = 10.0;
    
    // 检测常见模板开头
    const templateStarts = [
        '我申诉', '我要申诉', '关于', '针对', '对于'
    ];
    if (templateStarts.some(start => text.startsWith(start))) {
        templateScore -= 2.0;
    }
    
    // 检测"保证"类词汇重复
    const guaranteeCount = (text.match(/保证/g) || []).length;
    if (guaranteeCount >= 3) {
        templateScore -= 3.0;  // 多次保证显得不真实
    }
    
    // 检测感叹号过多
    const exclamationCount = (text.match(/[!！]/g) || []).length;
    if (exclamationCount >= 5) {
        templateScore -= 2.0;
    }
    
    // 检测"我"字重复
    const iCount = (text.match(/我/g) || []).length;
    if (iCount >= 10) {
        templateScore -= 1.5;
    }
    
    templateScore = Math.max(1.0, Math.min(10.0, templateScore));
    score += (templateScore - 5.0) * 0.15;  // 额外增加15%权重
    
    // ==================== 7. 时间相关性检测 ====================
    let timeScore = 7.0;  // 基础分较高
    
    // 检测是否提到"刚刚"、"最近"等时间词
    const timeWords = ['刚刚', '刚刚发现', '最近', '这几天', '这段时间'];
    if (timeWords.some(word => text.includes(word))) {
        timeScore += 1.5;
    }
    
    // 检测是否提到未来承诺
    const futureWords = ['今后', '以后', '未来', '接下来'];
    if (futureWords.some(word => text.includes(word))) {
        timeScore += 1.0;
    }
    
    timeScore = Math.min(10.0, timeScore);
    score += (timeScore - 5.0) * 0.05;  // 5%权重
    
    // ==================== 8. 最终评分处理 ====================
    // 添加随机因素（模拟真实审核的不确定性）
    const randomFactor = (Math.random() - 0.5) * 2.0;  // ±1.0随机
    score += randomFactor;
    
    // 限制最终分数范围
    score = Math.max(1.0, Math.min(APPEAL_AI_CONFIG.maxScore, score));
    
    // ==================== 9. 判定是否通过 ====================
    const isSincere = score >= APPEAL_AI_CONFIG.sincerityThreshold;
    
    console.log(`[AI审核] 申诉文本: "${text.substring(0,50)}..." | 得分: ${score.toFixed(2)}/10 | 结果: ${isSincere ? '通过' : '不通过'}`);
    
    // 执行回调
    setTimeout(() => {
        if (typeof callback === 'function') {
            callback(isSincere, score);
        }
    }, 1500);  // 模拟审核耗时
}

// ==================== 申诉AI状态说明 ====================
function getAppealAIStatus() {
    return {
        version: '1.0.0',
        config: APPEAL_AI_CONFIG,
        status: 'active',
        description: '基于多维度特征检测的申诉审核系统'
    };
}

// ==================== 全局函数绑定 ====================
window.performAppealAICheck = performAppealAICheck;
window.getAppealAIStatus = getAppealAIStatus;
window.APPEAL_AI_CONFIG = APPEAL_AI_CONFIG;

console.log('申诉AI审核系统已加载', getAppealAIStatus());
