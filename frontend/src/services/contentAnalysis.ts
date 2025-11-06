import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export type ContentType = 'url' | 'text' | 'image' | 'video' | 'pdf' | 'ppt' | 'code';

export interface ContentAnalysisRequest {
  contentType?: ContentType;
  file?: File;
  url?: string;
  text?: string;
  autoSave?: boolean;
}

export interface ContentAnalysisResponse {
  message: string;
  workflow?: any;
  config?: any;
  metadata?: {
    title: string;
    description: string;
    category: string;
    tags: string[];
  };
  analysis: {
    sourceType: ContentType;
    sourceTitle: string;
    sourceDescription?: string;
    category?: string;
    complexity?: 'simple' | 'medium' | 'complex';
    estimatedTime?: string;
    stepsExtracted: number;
    tags?: string[];
    fileUrl?: string;
  };
  testMode?: boolean;
}

/**
 * 从成果逆向生成工作流
 */
export async function analyzeContent(
  request: ContentAnalysisRequest,
  useMock: boolean = false
): Promise<ContentAnalysisResponse> {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('未登录，请先登录');
  }

  const endpoint = useMock
    ? `${API_BASE_URL}/api/workflows/generate/from-content-mock`
    : `${API_BASE_URL}/api/workflows/generate/from-content`;

  // 使用FormData来支持文件上传
  const formData = new FormData();

  if (request.file) {
    formData.append('file', request.file);
  }

  if (request.url) {
    formData.append('url', request.url);
  }

  if (request.text) {
    formData.append('text', request.text);
  }

  if (request.contentType) {
    formData.append('contentType', request.contentType);
  }

  formData.append('autoSave', String(request.autoSave ?? true));

  try {
    const response = await axios.post<ContentAnalysisResponse>(endpoint, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('内容分析失败:', error);
    throw new Error(error.response?.data?.error || '内容分析失败');
  }
}

/**
 * 检测文件类型
 */
export function detectContentType(file: File): ContentType {
  const mimeType = file.type;

  if (mimeType.startsWith('image/')) {
    return 'image';
  } else if (mimeType.startsWith('video/')) {
    return 'video';
  } else if (mimeType === 'application/pdf') {
    return 'pdf';
  } else if (mimeType.includes('presentation')) {
    return 'ppt';
  } else {
    return 'code';
  }
}

/**
 * 验证文件大小
 */
export function validateFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
