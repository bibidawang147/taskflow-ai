/**
 * 创作者主页 - 主逻辑文件
 * 负责数据加载、初始化和渲染
 */

// 全局数据存储
let creatorData = null;
let currentView = 'grid'; // 作品视图模式：grid 或 list

/**
 * 初始化应用
 */
async function init() {
    try {
        // 加载创作者数据
        await loadCreatorData();

        // 渲染页面各个部分
        renderProfile();
        renderStats();
        renderWorks();
        renderActivities();
        renderAbout();
        renderCollections();
        renderSidebar();

        // 初始化统计数字滚动动画
        initCountUpAnimation();

        console.log('✅ 创作者主页加载完成');
    } catch (error) {
        console.error('❌ 初始化失败:', error);
        showToast('加载失败，请刷新页面重试', 'error');
    }
}

/**
 * 加载创作者数据
 */
async function loadCreatorData() {
    try {
        const response = await fetch('data/creator-data.json');
        if (!response.ok) {
            throw new Error('数据加载失败');
        }
        creatorData = await response.json();
        console.log('📦 数据加载成功:', creatorData);
    } catch (error) {
        console.error('数据加载错误:', error);
        throw error;
    }
}

/**
 * 渲染个人资料
 */
function renderProfile() {
    const { profile } = creatorData;

    // 头像
    document.getElementById('creator-avatar').src = profile.avatar;
    document.getElementById('creator-avatar').alt = profile.username;

    // 在线状态
    const onlineStatus = document.getElementById('online-status');
    if (!profile.isOnline) {
        onlineStatus.classList.add('offline');
    }

    // 用户名
    document.getElementById('creator-name').textContent = profile.username;

    // 徽章
    const badgesContainer = document.getElementById('creator-badges');
    profile.badges.forEach(badge => {
        const badgeEl = document.createElement('span');
        badgeEl.className = `badge ${badge.type}`;
        badgeEl.innerHTML = `
            <span>${badge.icon}</span>
            <span>${badge.name}</span>
        `;
        badgesContainer.appendChild(badgeEl);
    });

    // 个性签名
    document.getElementById('creator-bio').textContent = profile.bio;

    // 位置和加入时间
    document.getElementById('creator-location').textContent = profile.location;

    const joinDate = new Date(profile.joinDate);
    const daysActive = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
    document.getElementById('creator-join-date').textContent = `加入 ${daysActive} 天`;
}

/**
 * 渲染统计数据
 */
function renderStats() {
    const { stats } = creatorData;

    // 设置统计数据
    setStatValue('stat-works', stats.worksCount);
    setStatValue('stat-uses', stats.totalUses);
    setStatValue('stat-likes', stats.likesCount);
    setStatValue('stat-followers', stats.followersCount);
    setStatValue('stat-following', stats.followingCount);
    document.getElementById('stat-rating').textContent = stats.avgRating.toFixed(1);
}

/**
 * 设置统计值（用于动画）
 */
function setStatValue(id, value) {
    const element = document.getElementById(id);
    element.setAttribute('data-target', value);
    element.textContent = '0';
}

/**
 * 初始化统计数字滚动动画
 */
function initCountUpAnimation() {
    const statElements = document.querySelectorAll('.stat-value[data-target]');

    statElements.forEach(element => {
        const target = parseInt(element.getAttribute('data-target'));
        const duration = 1000; // 1秒
        const steps = 30;
        const increment = target / steps;
        let current = 0;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            current += increment;

            if (step >= steps) {
                current = target;
                clearInterval(timer);
            }

            // 格式化大数字
            element.textContent = formatNumber(Math.floor(current));
        }, duration / steps);
    });
}

/**
 * 格式化数字（添加千位分隔符）
 */
function formatNumber(num) {
    if (num >= 10000) {
        return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
}

/**
 * 渲染作品列表
 */
function renderWorks() {
    const { works } = creatorData;
    const worksContainer = document.getElementById('works-list');
    document.getElementById('works-count').textContent = works.length;

    worksContainer.innerHTML = '';

    works.forEach(work => {
        const workCard = createWorkCard(work);
        worksContainer.appendChild(workCard);
    });
}

/**
 * 创建作品卡片
 */
function createWorkCard(work) {
    const card = document.createElement('div');
    card.className = 'work-card';
    card.innerHTML = `
        <div class="work-card-cover">
            <img src="${work.coverImage}" alt="${work.title}" loading="lazy">
        </div>
        <div class="work-card-body">
            <h3 class="work-card-title">${work.title}</h3>
            <p class="work-card-description">${work.description}</p>
            <div class="work-card-meta">
                <span class="work-card-rating">
                    <svg class="icon" width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    ${work.rating}
                </span>
                <span class="work-card-uses">
                    <svg class="icon" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                        <path d="M1.38 8.28a.5.5 0 010-.566 7.003 7.003 0 0113.238.006.5.5 0 010 .566A7.003 7.003 0 011.379 8.28zM11 8a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    ${formatNumber(work.usesCount)}
                </span>
            </div>
            <div class="work-card-footer">
                <div class="work-card-tags">
                    ${work.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
            <div class="work-card-actions">
                <button onclick="handleCollectWork('${work.id}')">收藏</button>
                <button onclick="handleViewWork('${work.id}')">查看</button>
            </div>
        </div>
    `;

    return card;
}

/**
 * 渲染动态时间线
 */
function renderActivities() {
    const { activities } = creatorData;
    const timelineContainer = document.getElementById('activities-timeline');

    timelineContainer.innerHTML = '';

    if (activities.length === 0) {
        timelineContainer.innerHTML = '<div class="empty-state"><p>暂无动态</p></div>';
        return;
    }

    activities.forEach(activity => {
        const timelineItem = createTimelineItem(activity);
        timelineContainer.appendChild(timelineItem);
    });
}

/**
 * 创建时间线项目
 */
function createTimelineItem(activity) {
    const item = document.createElement('div');
    item.className = `timeline-item ${activity.type}`;

    const timeAgo = getTimeAgo(activity.timestamp);

    item.innerHTML = `
        <div class="timeline-icon">${activity.icon}</div>
        <div class="timeline-card">
            <div class="timeline-content">${activity.content}</div>
            <div class="timeline-meta">
                <span class="timeline-time">
                    <svg class="icon" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0a8 8 0 110 16A8 8 0 018 0zm0 1a7 7 0 100 14A7 7 0 008 1zm3.5 6.5a.5.5 0 010 1h-4a.5.5 0 01-.5-.5v-3a.5.5 0 011 0V7h3.5z"/>
                    </svg>
                    ${timeAgo}
                </span>
                <div class="timeline-interactions">
                    <button onclick="handleLikeActivity('${activity.id}')">
                        <svg class="icon" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
                        </svg>
                        ${activity.likes}
                    </button>
                    <button onclick="handleCommentActivity('${activity.id}')">
                        <svg class="icon" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M2.678 11.894a1 1 0 01.287.801 10.97 10.97 0 01-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 01.71-.074A8.06 8.06 0 008 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 4.808 1 8c0 1.468.617 2.83 1.678 3.894z"/>
                        </svg>
                        ${activity.comments}
                    </button>
                </div>
            </div>
        </div>
    `;

    return item;
}

/**
 * 计算相对时间
 */
function getTimeAgo(timestamp) {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
}

/**
 * 渲染关于页面
 */
function renderAbout() {
    const { about } = creatorData;

    // 个人介绍
    document.getElementById('creator-introduction').textContent = about.introduction;

    // 擅长领域
    const expertiseContainer = document.getElementById('expertise-tags');
    expertiseContainer.innerHTML = about.expertise
        .map(item => `<span class="expertise-tag">${item}</span>`)
        .join('');

    // 常用工具
    const toolsContainer = document.getElementById('tools-grid');
    toolsContainer.innerHTML = about.tools
        .map(tool => `
            <div class="tool-item">
                <div class="tool-icon">${tool.icon}</div>
                <div class="tool-name">${tool.name}</div>
            </div>
        `)
        .join('');

    // 工作经验
    const experienceContainer = document.getElementById('experience-list');
    experienceContainer.innerHTML = about.experience
        .map(exp => `
            <div class="experience-item">
                <div class="experience-company">${exp.company}</div>
                <div class="experience-position">${exp.position}</div>
                <div class="experience-period">${exp.period}</div>
            </div>
        `)
        .join('');

    // 成就展示
    const achievementsContainer = document.getElementById('achievements-grid');
    achievementsContainer.innerHTML = about.achievements
        .map(achievement => `
            <div class="achievement-item">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-badge">${achievement.badge}</div>
                <div class="achievement-description">${achievement.description}</div>
                <div class="achievement-date">${formatDate(achievement.date)}</div>
            </div>
        `)
        .join('');

    // 精选作品
    const featuredWorks = creatorData.works.filter(work => work.featured);
    const featuredContainer = document.getElementById('featured-works');
    featuredContainer.innerHTML = '';
    featuredWorks.forEach(work => {
        const workCard = createWorkCard(work);
        featuredContainer.appendChild(workCard);
    });
}

/**
 * 格式化日期
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * 渲染收藏列表
 */
function renderCollections() {
    const { collections } = creatorData;
    const collectionsContainer = document.getElementById('collections-list');
    document.getElementById('collections-count').textContent = collections.length;

    collectionsContainer.innerHTML = '';

    if (collections.length === 0) {
        collectionsContainer.innerHTML = '<div class="empty-state"><p>暂无收藏</p></div>';
        return;
    }

    collections.forEach(collection => {
        const collectionCard = createCollectionCard(collection);
        collectionsContainer.appendChild(collectionCard);
    });
}

/**
 * 创建收藏卡片
 */
function createCollectionCard(collection) {
    const card = document.createElement('div');
    card.className = 'collection-card';
    card.setAttribute('data-category', collection.category);

    card.innerHTML = `
        <div class="collection-work">
            <div class="collection-work-cover">
                <img src="${collection.workCover}" alt="${collection.workTitle}" loading="lazy">
            </div>
            <div class="collection-work-title">${collection.workTitle}</div>
            <div class="collection-work-author">作者：${collection.workAuthor}</div>
        </div>
        <div class="collection-note">
            <div class="collection-note-label">我的笔记</div>
            <div class="collection-note-text">${collection.note}</div>
        </div>
        <div class="collection-footer">
            <span>${formatDate(collection.collectedAt)}</span>
            <button onclick="handleUncollect('${collection.id}')">取消收藏</button>
        </div>
    `;

    return card;
}

/**
 * 渲染侧边栏
 */
function renderSidebar() {
    // 创作者标签
    const tagsContainer = document.getElementById('creator-tags');
    const allTags = [...new Set(creatorData.works.flatMap(work => work.tags))];
    tagsContainer.innerHTML = allTags.slice(0, 10)
        .map(tag => `<span class="creator-tag">${tag}</span>`)
        .join('');

    // 相似创作者
    const similarCreatorsContainer = document.getElementById('similar-creators');
    similarCreatorsContainer.innerHTML = creatorData.similarCreators
        .map(creator => `
            <div class="similar-creator-item">
                <img src="${creator.avatar}" alt="${creator.username}" class="similar-creator-avatar">
                <div class="similar-creator-info">
                    <div class="similar-creator-name">${creator.username}</div>
                    <div class="similar-creator-bio">${creator.bio}</div>
                </div>
                <button class="similar-creator-follow ${creator.isFollowing ? 'following' : ''}"
                        onclick="handleFollowCreator('${creator.id}', this)">
                    ${creator.isFollowing ? '已关注' : '关注'}
                </button>
            </div>
        `)
        .join('');
}

/**
 * 显示 Toast 提示
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * 事件处理函数
 */

// 收藏作品
function handleCollectWork(workId) {
    console.log('收藏作品:', workId);
    showToast('已添加到收藏');
}

// 查看作品
function handleViewWork(workId) {
    console.log('查看作品:', workId);
    showToast('跳转到作品详情页');
}

// 点赞动态
function handleLikeActivity(activityId) {
    console.log('点赞动态:', activityId);
    showToast('点赞成功');
}

// 评论动态
function handleCommentActivity(activityId) {
    console.log('评论动态:', activityId);
    showToast('评论功能开发中');
}

// 取消收藏
function handleUncollect(collectionId) {
    console.log('取消收藏:', collectionId);
    showToast('已取消收藏');
}

// 关注创作者
function handleFollowCreator(creatorId, button) {
    const isFollowing = button.classList.contains('following');

    if (isFollowing) {
        button.classList.remove('following');
        button.textContent = '关注';
        showToast('已取消关注');
    } else {
        button.classList.add('following');
        button.textContent = '已关注';
        showToast('关注成功');
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
