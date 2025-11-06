import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { mkdirp } from 'mkdirp';

export interface UploadedFile {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  url: string;
}

export interface FileMetadata {
  fileType: string;
  fileSize: number;
  mimeType: string;
  dimensions?: { width: number; height: number };
  duration?: number;
  [key: string]: any;
}

class FileStorageService {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(__dirname, '../../uploads');
  }

  /**
   * 保存文件到本地存储
   */
  async saveFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    category: 'images' | 'videos' | 'documents' = 'documents'
  ): Promise<UploadedFile> {
    // 生成唯一文件名
    const ext = path.extname(originalName);
    const hash = crypto.randomBytes(16).toString('hex');
    const filename = `${Date.now()}-${hash}${ext}`;

    // 确定保存路径
    const categoryDir = path.join(this.uploadsDir, category);
    await mkdirp(categoryDir);

    const filePath = path.join(categoryDir, filename);

    // 保存文件
    await fs.writeFile(filePath, buffer);

    // 获取文件大小
    const stats = await fs.stat(filePath);

    return {
      filename,
      originalName,
      path: filePath,
      size: stats.size,
      mimeType,
      url: `/uploads/${category}/${filename}`,
    };
  }

  /**
   * 保存Base64编码的文件
   */
  async saveBase64File(
    base64Data: string,
    originalName: string,
    mimeType: string,
    category: 'images' | 'videos' | 'documents' = 'documents'
  ): Promise<UploadedFile> {
    // 移除Base64前缀（如 "data:image/png;base64,"）
    const base64String = base64Data.replace(/^data:.*?;base64,/, '');
    const buffer = Buffer.from(base64String, 'base64');

    return this.saveFile(buffer, originalName, mimeType, category);
  }

  /**
   * 读取文件
   */
  async readFile(filePath: string): Promise<Buffer> {
    return fs.readFile(filePath);
  }

  /**
   * 删除文件
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  /**
   * 检查文件是否存在
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取文件URL
   */
  getFileUrl(filePath: string): string {
    const relativePath = filePath.replace(this.uploadsDir, '');
    return `/uploads${relativePath}`;
  }

  /**
   * 验证文件类型
   */
  validateFileType(
    mimeType: string,
    allowedTypes: string[]
  ): boolean {
    return allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const prefix = type.slice(0, -2);
        return mimeType.startsWith(prefix);
      }
      return mimeType === type;
    });
  }

  /**
   * 验证文件大小
   */
  validateFileSize(size: number, maxSize: number): boolean {
    return size <= maxSize;
  }

  /**
   * 获取图片尺寸（如果安装了sharp库）
   */
  async getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number } | null> {
    try {
      // 尝试导入sharp（可选依赖）
      // @ts-ignore - sharp is an optional dependency
      const sharp = await import('sharp');
      const metadata = await sharp.default(buffer).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
      };
    } catch (error) {
      // sharp未安装，返回null
      console.warn('sharp not installed, cannot get image dimensions');
      return null;
    }
  }

  /**
   * 提取文件元数据
   */
  async extractMetadata(
    buffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<FileMetadata> {
    const metadata: FileMetadata = {
      fileType: path.extname(originalName).toLowerCase().slice(1),
      fileSize: buffer.length,
      mimeType,
    };

    // 如果是图片，尝试获取尺寸
    if (mimeType.startsWith('image/')) {
      const dimensions = await this.getImageDimensions(buffer);
      if (dimensions) {
        metadata.dimensions = dimensions;
      }
    }

    return metadata;
  }

  /**
   * 清理过期文件（可选，用于定期清理临时文件）
   */
  async cleanupOldFiles(
    category: 'images' | 'videos' | 'documents',
    daysOld: number
  ): Promise<number> {
    const categoryDir = path.join(this.uploadsDir, category);
    const files = await fs.readdir(categoryDir);

    const now = Date.now();
    const maxAge = daysOld * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(categoryDir, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtimeMs > maxAge) {
        await this.deleteFile(filePath);
        deletedCount++;
      }
    }

    return deletedCount;
  }
}

export const fileStorageService = new FileStorageService();
