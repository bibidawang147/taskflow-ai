// 工作流容器层级数据 - 统一的数据源
// 用于工作流画布和AI聊天页面的容器选择

export type WorkRole = {
  id: string
  name: string
  icon: string
  description: string
  jobs: WorkJob[]
}

export type WorkJob = {
  id: string
  name: string
  description?: string
}

// 工作角色和具体工作定义
export const workspaceContainers: WorkRole[] = [
  {
    id: 'content_creator',
    name: '内容创作者',
    icon: '✍️',
    description: '专注内容创作与自媒体运营',
    jobs: [
      { id: 'xiaohongshu', name: '小红书运营', description: '小红书内容创作与运营' },
      { id: 'douyin_script', name: '抖音脚本策划', description: '短视频脚本策划与创作' },
      { id: 'wechat_article', name: '公众号写作', description: '微信公众号文章创作' },
      { id: 'zhihu_writing', name: '知乎创作', description: '知乎问答与文章创作' },
      { id: 'kuaishou', name: '快手运营', description: '快手短视频运营' },
      { id: 'bilibili', name: 'B站UP主', description: 'B站视频创作与运营' }
    ]
  },
  {
    id: 'marketing_specialist',
    name: '营销专员',
    icon: '📊',
    description: '负责市场推广与品牌营销',
    jobs: [
      { id: 'email_marketing', name: '邮件营销', description: 'EDM营销与邮件内容策划' },
      { id: 'social_media', name: '社交媒体推广', description: '社交媒体内容推广' },
      { id: 'ad_copywriting', name: '广告文案', description: '广告创意文案撰写' },
      { id: 'seo_optimization', name: 'SEO优化', description: '搜索引擎优化' },
      { id: 'event_planning', name: '活动策划', description: '营销活动策划与执行' },
      { id: 'brand_operation', name: '品牌运营', description: '品牌形象建设与维护' }
    ]
  },
  {
    id: 'data_analyst',
    name: '数据分析师',
    icon: '📈',
    description: '数据挖掘与商业分析',
    jobs: [
      { id: 'sales_analysis', name: '销售数据分析', description: '销售数据统计与分析' },
      { id: 'user_behavior', name: '用户行为分析', description: '用户行为数据分析' },
      { id: 'financial_analysis', name: '财务数据分析', description: '财务报表分析' },
      { id: 'market_research', name: '市场调研', description: '市场趋势研究与分析' },
      { id: 'competitor_analysis', name: '竞品分析', description: '竞争对手分析' },
      { id: 'report_making', name: '报表制作', description: '数据报表制作' }
    ]
  },
  {
    id: 'developer',
    name: '开发工程师',
    icon: '💻',
    description: '软件开发与技术支持',
    jobs: [
      { id: 'code_review', name: '代码审查', description: '代码质量审查' },
      { id: 'tech_docs', name: '技术文档', description: '技术文档编写' },
      { id: 'unit_testing', name: '单元测试', description: '单元测试编写与维护' },
      { id: 'api_design', name: 'API设计', description: 'RESTful API设计' },
      { id: 'performance_optimization', name: '性能优化', description: '系统性能优化' },
      { id: 'architecture_design', name: '架构设计', description: '系统架构设计' }
    ]
  },
  {
    id: 'customer_service',
    name: '客服专员',
    icon: '🎧',
    description: '客户服务与售后支持',
    jobs: [
      { id: 'pre_sales', name: '售前咨询', description: '售前产品咨询服务' },
      { id: 'after_sales', name: '售后支持', description: '售后问题处理' },
      { id: 'complaint_handling', name: '投诉处理', description: '客户投诉处理' },
      { id: 'customer_callback', name: '客户回访', description: '客户满意度回访' },
      { id: 'satisfaction_survey', name: '满意度调查', description: '客户满意度调查' },
      { id: 'qa', name: '问题解答', description: '常见问题解答' }
    ]
  },
  {
    id: 'business_personnel',
    name: '商务人员',
    icon: '💼',
    description: '商务拓展与项目管理',
    jobs: [
      { id: 'business_plan', name: '商业计划书', description: '商业计划书撰写' },
      { id: 'project_proposal', name: '项目提案', description: '项目提案准备' },
      { id: 'meeting_minutes', name: '会议纪要', description: '会议记录整理' },
      { id: 'presentation_ppt', name: '演讲PPT', description: 'PPT设计与制作' },
      { id: 'contract_drafting', name: '合同起草', description: '商务合同起草' },
      { id: 'project_management', name: '项目管理', description: '项目进度管理' }
    ]
  }
]

// 根据角色ID获取角色信息
export function getRoleById(roleId: string): WorkRole | undefined {
  return workspaceContainers.find(role => role.id === roleId)
}

// 根据角色ID和工作ID获取工作信息
export function getJobById(roleId: string, jobId: string): WorkJob | undefined {
  const role = getRoleById(roleId)
  return role?.jobs.find(job => job.id === jobId)
}

// 获取所有角色列表（用于下拉选择）
export function getAllRoles(): Array<{ id: string; name: string; icon: string; description: string }> {
  return workspaceContainers.map(role => ({
    id: role.id,
    name: role.name,
    icon: role.icon,
    description: role.description
  }))
}

// 根据角色ID获取该角色下的所有工作
export function getJobsByRole(roleId: string): WorkJob[] {
  const role = getRoleById(roleId)
  return role?.jobs || []
}
