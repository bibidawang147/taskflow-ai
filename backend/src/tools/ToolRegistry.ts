import { Tool, ToolMetadata, ToolCategory } from './types'

/**
 * 工具注册表 - 管理所有可用工具
 */
export class ToolRegistry {
  private static instance: ToolRegistry
  private tools: Map<string, Tool> = new Map()
  private metadata: Map<string, ToolMetadata> = new Map()

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry()
    }
    return ToolRegistry.instance
  }

  /**
   * 注册工具
   */
  register(tool: Tool, metadata: ToolMetadata): void {
    if (this.tools.has(tool.name)) {
      console.warn(`Tool "${tool.name}" already registered, overwriting...`)
    }
    this.tools.set(tool.name, tool)
    this.metadata.set(tool.name, metadata)
    console.log(`Tool registered: ${tool.name} (${metadata.displayName})`)
  }

  /**
   * 获取工具
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name)
  }

  /**
   * 获取工具元数据
   */
  getMetadata(name: string): ToolMetadata | undefined {
    return this.metadata.get(name)
  }

  /**
   * 获取所有工具名称
   */
  getAllToolNames(): string[] {
    return Array.from(this.tools.keys())
  }

  /**
   * 获取所有工具元数据
   */
  getAllMetadata(): ToolMetadata[] {
    return Array.from(this.metadata.values())
  }

  /**
   * 按类别获取工具
   */
  getToolsByCategory(category: ToolCategory): ToolMetadata[] {
    return Array.from(this.metadata.values()).filter(
      meta => meta.category === category
    )
  }

  /**
   * 检查工具是否存在
   */
  hasTool(name: string): boolean {
    return this.tools.has(name)
  }

  /**
   * 注销工具
   */
  unregister(name: string): boolean {
    const hasMetadata = this.metadata.delete(name)
    const hasTool = this.tools.delete(name)
    return hasMetadata && hasTool
  }

  /**
   * 清空所有工具
   */
  clear(): void {
    this.tools.clear()
    this.metadata.clear()
  }
}

// 导出单例
export const toolRegistry = ToolRegistry.getInstance()
