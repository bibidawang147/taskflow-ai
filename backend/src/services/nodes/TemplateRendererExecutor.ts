import { WorkflowNode, ExecutionContext, TemplateRendererConfig } from '../../types/workflow'

/**
 * 模板渲染节点执行器
 * 使用上下文变量渲染文本模板，支持 {{variable}} 和 {variable} 语法
 */
export class TemplateRendererExecutor {
  async execute(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const config = node.config as TemplateRendererConfig

    if (!config.template) {
      throw new Error('TemplateRenderer 节点缺少 template 配置')
    }

    // 渲染模板
    const rendered = this.renderTemplate(config.template, context)

    console.log(`TemplateRenderer 节点执行完成`, {
      templateLength: config.template.length,
      outputLength: rendered.length
    })

    return rendered
  }

  /**
   * 渲染模板
   * 支持格式:
   * - {{variable}} - 双大括号
   * - {{object.property}} - 嵌套属性
   * - {{variable:defaultValue}} - 默认值
   * - {variable} - 单大括号（兼容）
   */
  private renderTemplate(template: string, context: ExecutionContext): string {
    if (!template) return ''

    // 替换双大括号变量 {{...}}
    let result = template.replace(/\{\{([^}]+)\}\}/g, (match, varPath) => {
      return this.resolveVariable(varPath.trim(), context, match)
    })

    // 替换单大括号变量 {...}（兼容旧格式）
    result = result.replace(/\{([^}]+)\}/g, (match, varName) => {
      // 跳过已经是 {{}} 格式的
      if (template.includes(`{${match}}`)) {
        return match
      }
      return this.resolveVariable(varName.trim(), context, match)
    })

    return result
  }

  /**
   * 解析变量值
   * 支持:
   * - 简单变量: variable
   * - 嵌套属性: object.property
   * - 默认值: variable:defaultValue
   */
  private resolveVariable(varPath: string, context: ExecutionContext, fallback: string): string {
    // 检查是否有默认值语法 variable:defaultValue
    let defaultValue: string | undefined
    if (varPath.includes(':')) {
      const parts = varPath.split(':')
      varPath = parts[0].trim()
      defaultValue = parts.slice(1).join(':').trim()
    }

    // 获取变量值
    const value = this.getNestedValue(context, varPath)

    if (value !== undefined && value !== null) {
      return typeof value === 'string' ? value : JSON.stringify(value)
    }

    // 返回默认值或原始匹配
    return defaultValue !== undefined ? defaultValue : fallback
  }

  /**
   * 获取嵌套对象的值
   * 例如: getNestedValue(obj, 'input.text') 返回 obj.input.text
   */
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.')
    let current = obj

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        return undefined
      }
    }

    return current
  }
}

export const templateRendererExecutor = new TemplateRendererExecutor()
