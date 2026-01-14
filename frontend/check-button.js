// 在浏览器控制台运行这段代码，检查"一键生成工作流"按钮是否存在

// 方法1: 直接查找按钮文本
console.log('🔍 方法1: 查找按钮文本');
const buttonText = document.body.innerText.includes('一键生成工作流');
console.log('页面中是否包含"一键生成工作流"文字:', buttonText);

// 方法2: 查找绿色卡片容器
console.log('\n🔍 方法2: 查找绿色卡片');
const emeraldCards = document.querySelectorAll('[class*="emerald"]');
console.log('找到的绿色元素数量:', emeraldCards.length);
emeraldCards.forEach((el, idx) => {
  console.log(`绿色元素 ${idx + 1}:`, el);
  console.log('  文本内容:', el.textContent.substring(0, 100));
});

// 方法3: 查找所有按钮
console.log('\n🔍 方法3: 查找所有按钮');
const allButtons = document.querySelectorAll('button');
console.log('页面总按钮数:', allButtons.length);
const workflowButton = Array.from(allButtons).find(btn =>
  btn.textContent.includes('一键生成工作流')
);
if (workflowButton) {
  console.log('✅ 找到按钮!', workflowButton);
  console.log('按钮可见性:', window.getComputedStyle(workflowButton).display);
  console.log('按钮位置:', workflowButton.getBoundingClientRect());
} else {
  console.log('❌ 未找到"一键生成工作流"按钮');
}

// 方法4: 检查iframe（如果在父页面）
console.log('\n🔍 方法4: 检查iframe');
const iframe = document.querySelector('.embedded-chat-iframe');
if (iframe) {
  console.log('找到iframe:', iframe);
  console.log('iframe尺寸:', {
    width: iframe.offsetWidth,
    height: iframe.offsetHeight
  });
  console.log('⚠️ 注意: 你在父页面。需要切换到iframe内部检查。');
  console.log('切换方法: 开发者工具 -> 顶部下拉框 -> 选择iframe');
} else {
  console.log('当前在iframe内部或非嵌入模式');
}

// 方法5: 查找消息中的stepDetection数据
console.log('\n🔍 方法5: 检查React数据（仅供参考）');
const messageElements = document.querySelectorAll('[class*="message"]');
console.log('找到的消息元素:', messageElements.length);
