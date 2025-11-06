/**
 * 创作者主页 - 标签页切换功能
 * 负责导航标签页、视图切换、收藏筛选等交互
 */

/**
 * 初始化标签页功能
 */
function initTabs() {
    // 主导航标签页切换
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName, tabButtons, tabPanels);
        });
    });

    // 作品视图切换
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            const view = button.getAttribute('data-view');
            switchView(view, viewButtons);
        });
    });

    // 收藏分类筛选
    const filterButtons = document.querySelectorAll('.collection-filter');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            filterCollections(filter, filterButtons);
        });
    });

    console.log('✅ 标签页功能初始化完成');
}

/**
 * 切换标签页
 * @param {string} tabName - 标签页名称
 * @param {NodeList} buttons - 按钮列表
 * @param {NodeList} panels - 面板列表
 */
function switchTab(tabName, buttons, panels) {
    // 移除所有激活状态
    buttons.forEach(btn => btn.classList.remove('active'));
    panels.forEach(panel => panel.classList.remove('active'));

    // 添加激活状态
    const activeButton = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    const activePanel = document.getElementById(`${tabName}-panel`);

    if (activeButton && activePanel) {
        activeButton.classList.add('active');
        activePanel.classList.add('active');

        // 如果切换到关于页面，初始化图表
        if (tabName === 'about') {
            // 延迟渲染图表，确保容器已显示
            setTimeout(() => {
                if (window.renderSkillsChart) {
                    window.renderSkillsChart();
                }
            }, 100);
        }

        // 如果切换到作品页面，重新渲染图表
        if (tabName === 'works') {
            setTimeout(() => {
                if (window.renderWorksCharts) {
                    window.renderWorksCharts();
                }
            }, 100);
        }

        console.log(`🔄 切换到标签页: ${tabName}`);
    }
}

/**
 * 切换作品视图
 * @param {string} view - 视图类型 (grid/list)
 * @param {NodeList} buttons - 视图按钮列表
 */
function switchView(view, buttons) {
    const worksGrid = document.getElementById('works-list');

    // 更新按钮状态
    buttons.forEach(btn => btn.classList.remove('active'));
    const activeButton = document.querySelector(`.view-btn[data-view="${view}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }

    // 更新视图模式
    if (view === 'list') {
        worksGrid.classList.add('list-view');
    } else {
        worksGrid.classList.remove('list-view');
    }

    // 更新全局变量
    currentView = view;

    console.log(`🔄 切换视图模式: ${view}`);
}

/**
 * 筛选收藏
 * @param {string} filter - 筛选类型
 * @param {NodeList} buttons - 筛选按钮列表
 */
function filterCollections(filter, buttons) {
    const collectionCards = document.querySelectorAll('.collection-card');

    // 更新按钮状态
    buttons.forEach(btn => btn.classList.remove('active'));
    const activeButton = document.querySelector(`.collection-filter[data-filter="${filter}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }

    // 筛选收藏卡片
    let visibleCount = 0;
    collectionCards.forEach(card => {
        const category = card.getAttribute('data-category');

        if (filter === 'all' || category === filter) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    // 更新收藏数量显示
    document.getElementById('collections-count').textContent = visibleCount;

    console.log(`🔍 筛选收藏: ${filter}, 显示 ${visibleCount} 项`);
}

/**
 * 获取当前活动的标签页
 * @returns {string} 当前标签页名称
 */
function getCurrentTab() {
    const activeButton = document.querySelector('.tab-btn.active');
    return activeButton ? activeButton.getAttribute('data-tab') : 'works';
}

/**
 * 获取当前视图模式
 * @returns {string} 当前视图模式
 */
function getCurrentView() {
    return currentView;
}

/**
 * 切换到指定标签页（供外部调用）
 * @param {string} tabName - 标签页名称
 */
function goToTab(tabName) {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    switchTab(tabName, tabButtons, tabPanels);
}

/**
 * 使用防抖优化的搜索功能
 * @param {Function} callback - 搜索回调函数
 * @param {number} delay - 延迟时间（毫秒）
 */
function debounce(callback, delay = 300) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            callback.apply(this, args);
        }, delay);
    };
}

/**
 * 使用节流优化的滚动功能
 * @param {Function} callback - 滚动回调函数
 * @param {number} delay - 延迟时间（毫秒）
 */
function throttle(callback, delay = 200) {
    let lastTime = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastTime >= delay) {
            callback.apply(this, args);
            lastTime = now;
        }
    };
}

/**
 * 平滑滚动到元素
 * @param {HTMLElement} element - 目标元素
 * @param {number} offset - 偏移量
 */
function smoothScrollTo(element, offset = 0) {
    if (!element) return;

    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

/**
 * 检查元素是否在视口中
 * @param {HTMLElement} element - 要检查的元素
 * @returns {boolean} 是否在视口中
 */
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * 懒加载图片
 */
function initLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px'
    });

    images.forEach(img => {
        imageObserver.observe(img);
    });

    console.log('✅ 懒加载初始化完成');
}

/**
 * 无限滚动加载
 */
function initInfiniteScroll() {
    const loadMoreTrigger = document.createElement('div');
    loadMoreTrigger.className = 'load-more-trigger';
    loadMoreTrigger.style.height = '1px';

    const worksGrid = document.getElementById('works-list');
    if (worksGrid) {
        worksGrid.appendChild(loadMoreTrigger);

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadMoreWorks();
                }
            });
        }, {
            rootMargin: '200px'
        });

        observer.observe(loadMoreTrigger);
    }
}

/**
 * 加载更多作品（示例函数）
 */
function loadMoreWorks() {
    // 这里可以实现加载更多作品的逻辑
    console.log('📦 加载更多作品...');
}

/**
 * 键盘导航支持
 */
function initKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // ESC 键关闭模态框
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal.active');
            modals.forEach(modal => {
                modal.classList.remove('active');
            });
        }

        // 左右箭头切换标签页
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            const currentTab = getCurrentTab();
            const tabs = ['works', 'activities', 'about', 'collections'];
            const currentIndex = tabs.indexOf(currentTab);

            if (currentIndex !== -1) {
                let newIndex;
                if (e.key === 'ArrowLeft') {
                    newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
                } else {
                    newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
                }

                if (e.ctrlKey || e.metaKey) {
                    goToTab(tabs[newIndex]);
                }
            }
        }
    });

    console.log('✅ 键盘导航初始化完成');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initLazyLoading();
    initKeyboardNavigation();
});

// 暴露全局函数供其他模块使用
window.goToTab = goToTab;
window.getCurrentTab = getCurrentTab;
window.getCurrentView = getCurrentView;
window.debounce = debounce;
window.throttle = throttle;
window.smoothScrollTo = smoothScrollTo;
