import { toolRegistry } from './ToolRegistry'
import { HttpRequestTool, httpRequestToolMetadata } from './http/HttpRequestTool'
import { DataTransformTool, dataTransformToolMetadata } from './transform/DataTransformTool'
import { TextProcessingTool, textProcessingToolMetadata } from './text/TextProcessingTool'

/**
 * 初始化所有工具
 * 在应用启动时调用
 */
export function initializeTools(): void {
  console.log('Initializing workflow tools...')

  // 注册 HTTP 请求工具
  toolRegistry.register(new HttpRequestTool(), httpRequestToolMetadata)

  // 注册数据转换工具
  toolRegistry.register(new DataTransformTool(), dataTransformToolMetadata)

  // 注册文本处理工具
  toolRegistry.register(new TextProcessingTool(), textProcessingToolMetadata)

  console.log(`Total tools registered: ${toolRegistry.getAllToolNames().length}`)
  console.log('Available tools:', toolRegistry.getAllToolNames().join(', '))
}

// 导出工具注册表供其他模块使用
export { toolRegistry } from './ToolRegistry'
export * from './types'
