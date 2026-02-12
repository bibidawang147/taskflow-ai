/**
 * 新用户示例画布模板
 * 由导出工具生成，workflowId 使用占位符 __SAMPLE_N__
 * 初始化时根据 sampleWorkflows 数组顺序替换为真实 ID
 *
 * 索引对照（与 sampleWorkflows 数组一致）：
 *  0: 副业项目可行性评估
 *  1: 自媒体账号起号方案
 *  2: 小红书爆款笔记全流程
 *  3: 公众号爆文写作助手
 *  4: 短视频脚本生成器
 *  5: 视频选题日历规划
 *  6: 电商数据分析报告
 *  7: 竞品对比分析
 *  8: 电商主图文案策划
 *  9: 社交媒体配图方案
 * 10: PRD需求文档生成器
 * 11: 会议纪要整理助手
 */

/**
 * 根据实际创建的 workflowIds 数组（与 sampleWorkflows 顺序一一对应），
 * 生成完整的画布 snapshot 数据
 */
export function buildSampleCanvasSnapshot(workflowIds: string[]) {
  // 占位符 → 实际 ID 映射
  const id = (index: number) => workflowIds[index] || `missing-${index}`

  return {
    cards: [],
    zoom: 1.0,
    canvasItems: {
      'canvas-root': {
        id: 'canvas-root',
        type: 'container',
        name: '工作流画布',
        parentId: '',
        position: { x: 0, y: 0 },
        size: { width: 3200, height: 1800 },
        collapsed: false,
        childrenIds: [
          'container-video',
          'wf-standalone',
          'container-copywriting',
          'container-design',
          'container-business'
        ],
        color: 'rgba(139, 92, 246, 0.15)'
      },

      // ===== 独立卡片：自媒体账号起号方案 =====
      'wf-standalone': {
        id: 'wf-standalone',
        type: 'workflow',
        workflowId: id(1),
        parentId: 'canvas-root',
        position: { x: 31, y: 332 }
      },

      // ===== 文案创作 容器 =====
      'container-copywriting': {
        id: 'container-copywriting',
        type: 'container',
        name: '文案创作',
        parentId: 'canvas-root',
        position: { x: 393, y: 16 },
        size: { width: 283, height: 314 },
        collapsed: false,
        childrenIds: ['wf-copy-1', 'wf-copy-2'],
        color: 'rgba(139, 92, 246, 0.15)'
      },
      'wf-copy-1': {
        id: 'wf-copy-1',
        type: 'workflow',
        workflowId: id(3), // 公众号爆文写作助手
        parentId: 'container-copywriting',
        position: { x: 0, y: 20 }
      },
      'wf-copy-2': {
        id: 'wf-copy-2',
        type: 'workflow',
        workflowId: id(2), // 小红书爆款笔记全流程
        parentId: 'container-copywriting',
        position: { x: 3, y: 165 }
      },

      // ===== 视频制作 容器 =====
      'container-video': {
        id: 'container-video',
        type: 'container',
        name: '视频制作',
        parentId: 'canvas-root',
        position: { x: 391, y: 427 },
        size: { width: 281, height: 315 },
        collapsed: false,
        childrenIds: ['wf-video-1', 'wf-video-2'],
        color: 'rgba(139, 92, 246, 0.15)'
      },
      'wf-video-1': {
        id: 'wf-video-1',
        type: 'workflow',
        workflowId: id(5), // 视频选题日历规划
        parentId: 'container-video',
        position: { x: 0, y: 17 }
      },
      'wf-video-2': {
        id: 'wf-video-2',
        type: 'workflow',
        workflowId: id(4), // 短视频脚本生成器
        parentId: 'container-video',
        position: { x: 1, y: 166 }
      },

      // ===== 图文制作 容器 =====
      'container-design': {
        id: 'container-design',
        type: 'container',
        name: '图文制作',
        parentId: 'canvas-root',
        position: { x: 744, y: 218 },
        size: { width: 281, height: 311 },
        collapsed: false,
        childrenIds: ['wf-design-1', 'wf-design-2'],
        color: 'rgba(236, 72, 153, 0.15)'
      },
      'wf-design-1': {
        id: 'wf-design-1',
        type: 'workflow',
        workflowId: id(9), // 社交媒体配图方案
        parentId: 'container-design',
        position: { x: 0, y: 0 }
      },
      'wf-design-2': {
        id: 'wf-design-2',
        type: 'workflow',
        workflowId: id(8), // 电商主图文案策划
        parentId: 'container-design',
        position: { x: 1, y: 162 }
      },

      // ===== 业务开发 容器 =====
      'container-business': {
        id: 'container-business',
        type: 'container',
        name: '业务开发',
        parentId: 'canvas-root',
        position: { x: 1111, y: 216 },
        size: { width: 561, height: 477 },
        collapsed: false,
        childrenIds: [
          'wf-biz-1', 'wf-biz-2', 'wf-biz-3', 'wf-biz-4', 'wf-biz-5'
        ],
        color: 'rgba(59, 130, 246, 0.15)'
      },
      'wf-biz-1': {
        id: 'wf-biz-1',
        type: 'workflow',
        workflowId: id(10), // PRD需求文档生成器
        parentId: 'container-business',
        position: { x: 0, y: 0 }
      },
      'wf-biz-2': {
        id: 'wf-biz-2',
        type: 'workflow',
        workflowId: id(0), // 副业项目可行性评估
        parentId: 'container-business',
        position: { x: 1, y: 157 }
      },
      'wf-biz-3': {
        id: 'wf-biz-3',
        type: 'workflow',
        workflowId: id(7), // 竞品对比分析
        parentId: 'container-business',
        position: { x: 272, y: 0 }
      },
      'wf-biz-4': {
        id: 'wf-biz-4',
        type: 'workflow',
        workflowId: id(11), // 会议纪要整理助手
        parentId: 'container-business',
        position: { x: 281, y: 155 }
      },
      'wf-biz-5': {
        id: 'wf-biz-5',
        type: 'workflow',
        workflowId: id(6), // 电商数据分析报告
        parentId: 'container-business',
        position: { x: 6, y: 328 }
      }
    },
    canvasEdges: {
      'edge-1': {
        id: 'edge-1',
        sourceItemId: 'wf-standalone',
        sourceHandle: 'top',
        targetItemId: 'container-copywriting',
        targetHandle: 'left'
      },
      'edge-2': {
        id: 'edge-2',
        sourceItemId: 'wf-standalone',
        sourceHandle: 'bottom',
        targetItemId: 'container-video',
        targetHandle: 'left'
      },
      'edge-3': {
        id: 'edge-3',
        sourceItemId: 'wf-standalone',
        sourceHandle: 'right',
        targetItemId: 'container-design',
        targetHandle: 'left'
      }
    }
  }
}
