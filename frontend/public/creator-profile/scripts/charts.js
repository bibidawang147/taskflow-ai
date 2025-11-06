/**
 * 创作者主页 - 图表渲染功能
 * 使用 Chart.js 渲染各种统计图表
 */

// 存储图表实例，用于销毁和重新创建
const chartInstances = {};

// Chart.js 全局配置
Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
Chart.defaults.color = '#6b7280';

/**
 * 初始化所有图表
 */
function initCharts() {
    if (!creatorData || !creatorData.charts) {
        console.warn('⚠️ 图表数据未加载');
        return;
    }

    // 延迟渲染，确保 DOM 已准备好
    setTimeout(() => {
        renderWorksCharts();
        renderSidebarCharts();
        console.log('✅ 图表初始化完成');
    }, 500);
}

/**
 * 渲染作品页面的图表
 */
function renderWorksCharts() {
    if (!creatorData || !creatorData.charts) return;

    renderCategoryChart();
    renderPublicationChart();
}

/**
 * 渲染作品分类分布饼图
 */
function renderCategoryChart() {
    const canvas = document.getElementById('category-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const data = creatorData.charts.categoryDistribution;

    // 销毁旧图表
    if (chartInstances.categoryChart) {
        chartInstances.categoryChart.destroy();
    }

    // 创建新图表
    chartInstances.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    '#2563eb', // 蓝色
                    '#10b981', // 绿色
                    '#f59e0b', // 橙色
                    '#8b5cf6', // 紫色
                ],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 13
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1500,
                easing: 'easeInOutQuart'
            }
        }
    });

    console.log('📊 作品分类图表已渲染');
}

/**
 * 渲染发布趋势折线图
 */
function renderPublicationChart() {
    const canvas = document.getElementById('publication-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const data = creatorData.charts.monthlyPublications;

    // 销毁旧图表
    if (chartInstances.publicationChart) {
        chartInstances.publicationChart.destroy();
    }

    // 创建新图表
    chartInstances.publicationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => {
                const date = new Date(item.month);
                return `${date.getMonth() + 1}月`;
            }),
            datasets: [{
                label: '发布数量',
                data: data.map(item => item.count),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#2563eb',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return `发布: ${context.parsed.y} 个作品`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart'
            }
        }
    });

    console.log('📈 发布趋势图表已渲染');
}

/**
 * 渲染技能雷达图（关于页面）
 */
function renderSkillsChart() {
    const canvas = document.getElementById('skills-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const skills = creatorData.about.skills;

    // 销毁旧图表
    if (chartInstances.skillsChart) {
        chartInstances.skillsChart.destroy();
    }

    // 创建新图表
    chartInstances.skillsChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: skills.map(skill => skill.name),
            datasets: [{
                label: '技能等级',
                data: skills.map(skill => skill.level),
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                borderColor: '#2563eb',
                borderWidth: 2,
                pointBackgroundColor: '#2563eb',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed.r}/10`;
                        }
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    min: 0,
                    max: 10,
                    ticks: {
                        stepSize: 2,
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    pointLabels: {
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart'
            }
        }
    });

    console.log('🕸️ 技能雷达图已渲染');
}

/**
 * 渲染侧边栏图表
 */
function renderSidebarCharts() {
    renderFollowersChart();
    renderUsageChart();
}

/**
 * 渲染粉丝增长趋势图
 */
function renderFollowersChart() {
    const canvas = document.getElementById('followers-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const data = creatorData.charts.followersGrowth;

    // 销毁旧图表
    if (chartInstances.followersChart) {
        chartInstances.followersChart.destroy();
    }

    // 创建新图表
    chartInstances.followersChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => {
                const date = new Date(item.month);
                return `${date.getMonth() + 1}月`;
            }),
            datasets: [{
                label: '粉丝数',
                data: data.map(item => item.count),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 10,
                    titleFont: {
                        size: 13
                    },
                    bodyFont: {
                        size: 12
                    },
                    callbacks: {
                        label: function(context) {
                            return `粉丝: ${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        font: {
                            size: 10
                        },
                        callback: function(value) {
                            return value >= 1000 ? (value / 1000) + 'k' : value;
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });

    console.log('📈 粉丝增长图表已渲染');
}

/**
 * 渲染使用量趋势图
 */
function renderUsageChart() {
    const canvas = document.getElementById('usage-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const data = creatorData.charts.usageTrend;

    // 销毁旧图表
    if (chartInstances.usageChart) {
        chartInstances.usageChart.destroy();
    }

    // 创建新图表
    chartInstances.usageChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => {
                const date = new Date(item.month);
                return `${date.getMonth() + 1}月`;
            }),
            datasets: [{
                label: '使用量',
                data: data.map(item => item.count),
                backgroundColor: 'rgba(37, 99, 235, 0.8)',
                borderColor: '#2563eb',
                borderWidth: 0,
                borderRadius: 4,
                hoverBackgroundColor: '#2563eb'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 10,
                    titleFont: {
                        size: 13
                    },
                    bodyFont: {
                        size: 12
                    },
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            return `使用: ${value >= 10000 ? (value / 10000).toFixed(1) + '万' : value.toLocaleString()} 次`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        font: {
                            size: 10
                        },
                        callback: function(value) {
                            return value >= 10000 ? (value / 10000) + '万' : value;
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });

    console.log('📊 使用量图表已渲染');
}

/**
 * 销毁所有图表
 */
function destroyAllCharts() {
    Object.values(chartInstances).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    console.log('🗑️ 所有图表已销毁');
}

/**
 * 响应式图表重绘
 */
function handleChartResize() {
    const resizeObserver = new ResizeObserver(entries => {
        entries.forEach(entry => {
            const chartId = entry.target.id.replace('-chart', '');
            const chart = chartInstances[chartId + 'Chart'];
            if (chart) {
                chart.resize();
            }
        });
    });

    // 观察所有图表容器
    const chartCanvases = document.querySelectorAll('canvas[id$="-chart"]');
    chartCanvases.forEach(canvas => {
        resizeObserver.observe(canvas);
    });
}

// 页面加载完成后初始化图表
document.addEventListener('DOMContentLoaded', () => {
    // 等待数据加载完成
    const checkData = setInterval(() => {
        if (creatorData) {
            clearInterval(checkData);
            initCharts();
            handleChartResize();
        }
    }, 100);
});

// 窗口大小改变时重新调整图表
window.addEventListener('resize', window.throttle(() => {
    Object.values(chartInstances).forEach(chart => {
        if (chart && typeof chart.resize === 'function') {
            chart.resize();
        }
    });
}, 300));

// 暴露函数供其他模块使用
window.renderWorksCharts = renderWorksCharts;
window.renderSkillsChart = renderSkillsChart;
window.renderSidebarCharts = renderSidebarCharts;
window.destroyAllCharts = destroyAllCharts;
