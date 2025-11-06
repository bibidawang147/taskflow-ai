/**
 * 创作者主页 - 交互功能
 * 负责按钮点击、模态框、关注等用户交互
 */

// 全局状态
let isFollowing = false;
let currentUsersModal = 'followers'; // 当前显示的用户列表类型

/**
 * 初始化交互功能
 */
function initInteractions() {
    initFollowButton();
    initMessageButton();
    initShareButton();
    initMoreButton();
    initModals();
    initStatsClickable();

    console.log('✅ 交互功能初始化完成');
}

/**
 * 初始化关注按钮
 */
function initFollowButton() {
    const followBtn = document.getElementById('follow-btn');

    if (followBtn) {
        followBtn.addEventListener('click', () => {
            toggleFollow(followBtn);
        });
    }
}

/**
 * 切换关注状态
 */
function toggleFollow(button) {
    isFollowing = !isFollowing;

    if (isFollowing) {
        button.classList.add('following');
        button.innerHTML = `
            <svg class="icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/>
            </svg>
            已关注
        `;
        showToast('关注成功', 'success');

        // 更新粉丝数
        updateFollowerCount(1);
    } else {
        button.classList.remove('following');
        button.innerHTML = `
            <svg class="icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 2a.5.5 0 01.5.5v5h5a.5.5 0 010 1h-5v5a.5.5 0 01-1 0v-5h-5a.5.5 0 010-1h5v-5A.5.5 0 018 2z"/>
            </svg>
            关注
        `;
        showToast('已取消关注', 'success');

        // 更新粉丝数
        updateFollowerCount(-1);
    }
}

/**
 * 更新粉丝数量
 */
function updateFollowerCount(delta) {
    const followersStat = document.getElementById('stat-followers');
    if (followersStat) {
        const currentCount = parseInt(followersStat.getAttribute('data-target'));
        const newCount = currentCount + delta;
        followersStat.setAttribute('data-target', newCount);
        followersStat.textContent = formatNumber(newCount);
    }
}

/**
 * 初始化私信按钮
 */
function initMessageButton() {
    const messageBtn = document.getElementById('message-btn');

    if (messageBtn) {
        messageBtn.addEventListener('click', () => {
            showToast('私信功能开发中', 'info');
            console.log('💬 打开私信对话框');
        });
    }
}

/**
 * 初始化分享按钮
 */
function initShareButton() {
    const shareBtn = document.getElementById('share-btn');
    const shareModal = document.getElementById('share-modal');
    const closeShareModal = document.getElementById('close-share-modal');
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const shareLinkInput = document.getElementById('share-link-input');

    if (shareBtn && shareModal) {
        // 打开分享模态框
        shareBtn.addEventListener('click', () => {
            shareModal.classList.add('active');
            // 设置分享链接
            shareLinkInput.value = window.location.href;
        });

        // 关闭分享模态框
        if (closeShareModal) {
            closeShareModal.addEventListener('click', () => {
                shareModal.classList.remove('active');
            });
        }

        // 点击遮罩关闭
        const overlay = shareModal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                shareModal.classList.remove('active');
            });
        }

        // 复制链接
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', () => {
                shareLinkInput.select();
                document.execCommand('copy');

                // 使用现代 API 复制（如果支持）
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(shareLinkInput.value).then(() => {
                        showToast('链接已复制到剪贴板', 'success');
                        copyLinkBtn.textContent = '已复制';

                        setTimeout(() => {
                            copyLinkBtn.textContent = '复制链接';
                        }, 2000);
                    });
                } else {
                    showToast('链接已复制到剪贴板', 'success');
                }
            });
        }

        // 社交分享按钮
        const socialBtns = shareModal.querySelectorAll('.social-btn');
        socialBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const platform = btn.textContent.trim();
                showToast(`分享到 ${platform}`, 'info');
                console.log(`📤 分享到 ${platform}`);
            });
        });
    }
}

/**
 * 初始化更多按钮
 */
function initMoreButton() {
    const moreBtn = document.getElementById('more-btn');

    if (moreBtn) {
        moreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showMoreMenu(e);
        });
    }
}

/**
 * 显示更多菜单
 */
function showMoreMenu(event) {
    // 创建下拉菜单
    const menu = document.createElement('div');
    menu.className = 'dropdown-menu';
    menu.style.position = 'absolute';
    menu.style.background = 'white';
    menu.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
    menu.style.borderRadius = '8px';
    menu.style.padding = '8px';
    menu.style.minWidth = '150px';
    menu.style.zIndex = '100';
    menu.innerHTML = `
        <button class="menu-item" style="width: 100%; padding: 10px; text-align: left; border: none; background: none; cursor: pointer; border-radius: 4px; transition: background 0.2s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='transparent'">
            举报
        </button>
        <button class="menu-item" style="width: 100%; padding: 10px; text-align: left; border: none; background: none; cursor: pointer; border-radius: 4px; transition: background 0.2s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='transparent'">
            屏蔽
        </button>
        <button class="menu-item" style="width: 100%; padding: 10px; text-align: left; border: none; background: none; cursor: pointer; border-radius: 4px; transition: background 0.2s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='transparent'">
            复制链接
        </button>
    `;

    // 定位菜单
    const rect = event.currentTarget.getBoundingClientRect();
    menu.style.top = (rect.bottom + window.scrollY) + 'px';
    menu.style.left = (rect.left + window.scrollX) + 'px';

    document.body.appendChild(menu);

    // 点击菜单项
    menu.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            showToast(item.textContent + '功能开发中', 'info');
            document.body.removeChild(menu);
        });
    });

    // 点击其他地方关闭菜单
    setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
            if (menu.parentNode) {
                document.body.removeChild(menu);
            }
            document.removeEventListener('click', closeMenu);
        });
    }, 0);
}

/**
 * 初始化模态框
 */
function initModals() {
    initUsersModal();
}

/**
 * 初始化用户列表模态框
 */
function initUsersModal() {
    const usersModal = document.getElementById('users-modal');
    const closeUsersModal = document.getElementById('close-users-modal');
    const usersTabs = document.querySelectorAll('.users-tab');
    const searchInput = document.getElementById('users-search-input');

    // 关闭模态框
    if (closeUsersModal) {
        closeUsersModal.addEventListener('click', () => {
            usersModal.classList.remove('active');
        });
    }

    // 点击遮罩关闭
    const overlay = usersModal.querySelector('.modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', () => {
            usersModal.classList.remove('active');
        });
    }

    // 切换标签
    usersTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const type = tab.getAttribute('data-type');
            switchUsersTab(type, usersTabs);
        });
    });

    // 搜索功能
    if (searchInput) {
        searchInput.addEventListener('input', window.debounce((e) => {
            const query = e.target.value.toLowerCase();
            filterUsers(query);
        }, 300));
    }
}

/**
 * 切换用户列表标签
 */
function switchUsersTab(type, tabs) {
    // 更新标签状态
    tabs.forEach(tab => tab.classList.remove('active'));
    const activeTab = document.querySelector(`.users-tab[data-type="${type}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }

    // 更新标题
    const title = document.getElementById('users-modal-title');
    title.textContent = type === 'followers' ? '粉丝列表' : '关注列表';

    // 更新列表内容
    currentUsersModal = type;
    renderUsersList(type);
}

/**
 * 渲染用户列表
 */
function renderUsersList(type) {
    const usersListContainer = document.getElementById('users-list');
    const users = type === 'followers' ? creatorData.followers : creatorData.following;

    usersListContainer.innerHTML = '';

    if (users.length === 0) {
        usersListContainer.innerHTML = '<div class="empty-state"><p>暂无数据</p></div>';
        return;
    }

    users.forEach(user => {
        const userItem = createUserItem(user);
        usersListContainer.appendChild(userItem);
    });
}

/**
 * 创建用户项
 */
function createUserItem(user) {
    const item = document.createElement('div');
    item.className = 'user-item';
    item.setAttribute('data-username', user.username.toLowerCase());
    item.setAttribute('data-bio', user.bio.toLowerCase());

    item.innerHTML = `
        <img src="${user.avatar}" alt="${user.username}" class="user-avatar">
        <div class="user-info">
            <div class="user-name">${user.username}</div>
            <div class="user-bio">${user.bio}</div>
            ${user.isFollowing ? '<div class="user-mutual">互相关注</div>' : ''}
        </div>
        <button class="user-follow-btn ${user.isFollowing ? 'following' : ''}"
                onclick="handleUserFollow('${user.id}', this)">
            ${user.isFollowing ? '已关注' : '关注'}
        </button>
    `;

    return item;
}

/**
 * 筛选用户
 */
function filterUsers(query) {
    const userItems = document.querySelectorAll('.user-item');

    userItems.forEach(item => {
        const username = item.getAttribute('data-username');
        const bio = item.getAttribute('data-bio');

        if (username.includes(query) || bio.includes(query)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

/**
 * 处理用户关注
 */
function handleUserFollow(userId, button) {
    const isFollowing = button.classList.contains('following');

    if (isFollowing) {
        button.classList.remove('following');
        button.textContent = '关注';
        showToast('已取消关注', 'success');
    } else {
        button.classList.add('following');
        button.textContent = '已关注';
        showToast('关注成功', 'success');
    }
}

/**
 * 初始化统计数据可点击
 */
function initStatsClickable() {
    // 点击粉丝数
    const followersStat = document.getElementById('stat-followers');
    if (followersStat) {
        followersStat.style.cursor = 'pointer';
        followersStat.parentElement.style.cursor = 'pointer';
        followersStat.parentElement.addEventListener('click', () => {
            openUsersModal('followers');
        });
    }

    // 点击关注数
    const followingStat = document.getElementById('stat-following');
    if (followingStat) {
        followingStat.style.cursor = 'pointer';
        followingStat.parentElement.style.cursor = 'pointer';
        followingStat.parentElement.addEventListener('click', () => {
            openUsersModal('following');
        });
    }
}

/**
 * 打开用户列表模态框
 */
function openUsersModal(type) {
    const usersModal = document.getElementById('users-modal');
    const usersTabs = document.querySelectorAll('.users-tab');

    usersModal.classList.add('active');
    switchUsersTab(type, usersTabs);
}

/**
 * 动画效果：按钮点击反馈
 */
function addClickAnimation(element) {
    element.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.6)';
        ripple.style.width = ripple.style.height = '100px';
        ripple.style.left = e.clientX - this.offsetLeft - 50 + 'px';
        ripple.style.top = e.clientY - this.offsetTop - 50 + 'px';
        ripple.style.animation = 'ripple-effect 0.6s ease-out';

        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
}

/**
 * 添加涟漪动画的 CSS
 */
function addRippleStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple-effect {
            from {
                transform: scale(0);
                opacity: 1;
            }
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * 平滑滚动到顶部
 */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * 添加返回顶部按钮
 */
function addBackToTopButton() {
    const button = document.createElement('button');
    button.className = 'back-to-top';
    button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
        </svg>
    `;
    button.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 50%;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 999;
    `;

    button.addEventListener('click', scrollToTop);

    // 显示/隐藏按钮
    window.addEventListener('scroll', window.throttle(() => {
        if (window.scrollY > 300) {
            button.style.opacity = '1';
            button.style.visibility = 'visible';
        } else {
            button.style.opacity = '0';
            button.style.visibility = 'hidden';
        }
    }, 200));

    document.body.appendChild(button);
}

/**
 * 添加键盘快捷键提示
 */
function showKeyboardShortcuts() {
    console.log(`
🎹 键盘快捷键：
- ESC: 关闭模态框
- Ctrl/Cmd + ←/→: 切换标签页
- ↑: 返回顶部
    `);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initInteractions();
    addRippleStyles();
    addBackToTopButton();
    showKeyboardShortcuts();
});

// 暴露函数供全局使用
window.handleUserFollow = handleUserFollow;
window.openUsersModal = openUsersModal;
window.scrollToTop = scrollToTop;
