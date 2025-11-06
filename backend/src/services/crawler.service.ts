import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import logger from '../utils/logger';

export interface CrawledNote {
  noteId: string;
  title: string;
  desc: string;
  type: string;
  user: {
    userId: string;
    nickname: string;
  };
  imageList: string[];
  videoUrl?: string;
  tags: string[];
  likedCount: string;
  collectedCount: string;
  commentCount: string;
  shareCount: string;
  createTime: string;
  updateTime: string;
  comments?: Array<{
    commentId: string;
    content: string;
    user: {
      nickname: string;
    };
    likedCount: string;
    createTime: string;
  }>;
}

export interface CrawlerResult {
  success: boolean;
  data?: CrawledNote[];
  error?: string;
  outputFile?: string;
}

class CrawlerService {
  private crawlerPath: string;
  private pythonPath: string;

  constructor() {
    this.crawlerPath = path.join(process.cwd(), '../crawler/MediaCrawler');
    this.pythonPath = 'python3'; // 可以配置为环境变量
  }

  /**
   * 执行小红书爬虫
   * @param keywords 搜索关键词，多个用逗号分隔
   * @param maxCount 最大爬取数量
   */
  async crawlXiaohongshu(
    keywords: string,
    maxCount: number = 20
  ): Promise<CrawlerResult> {
    try {
      logger.info(`开始爬取小红书数据，关键词: ${keywords}`);

      // 准备环境变量
      const env = {
        ...process.env,
        KEYWORDS: keywords,
        CRAWLER_MAX_NOTES_COUNT: maxCount.toString(),
      };

      // 执行 Python 爬虫脚本
      const result = await this.runPythonScript('main.py', [], env);

      if (!result.success) {
        throw new Error(result.error || '爬虫执行失败');
      }

      // 读取爬取结果
      const notes = await this.readCrawlerOutput();

      return {
        success: true,
        data: notes,
      };
    } catch (error) {
      logger.error('小红书爬虫执行失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  /**
   * 运行 Python 脚本
   */
  private runPythonScript(
    scriptName: string,
    args: string[] = [],
    env: NodeJS.ProcessEnv = process.env
  ): Promise<{ success: boolean; output?: string; error?: string }> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(this.crawlerPath, scriptName);

      const pythonProcess = spawn(this.pythonPath, [scriptPath, ...args], {
        cwd: this.crawlerPath,
        env,
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        logger.info(`[Python] ${output.trim()}`);
      });

      pythonProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        logger.warn(`[Python Error] ${output.trim()}`);
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output: stdout });
        } else {
          resolve({
            success: false,
            error: `Python 脚本退出码: ${code}\n${stderr}`,
          });
        }
      });

      pythonProcess.on('error', (error) => {
        reject(error);
      });

      // 10分钟超时
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('爬虫执行超时'));
      }, 10 * 60 * 1000);
    });
  }

  /**
   * 读取爬虫输出的 JSON 文件
   */
  private async readCrawlerOutput(): Promise<CrawledNote[]> {
    try {
      // MediaCrawler 默认将结果保存在 data/xhs 目录
      const dataDir = path.join(this.crawlerPath, 'data', 'xhs');

      // 查找最新的 JSON 文件
      const files = await fs.readdir(dataDir);
      const jsonFiles = files.filter(f => f.endsWith('.json')).sort().reverse();

      if (jsonFiles.length === 0) {
        logger.warn('未找到爬取数据文件');
        return [];
      }

      const latestFile = path.join(dataDir, jsonFiles[0]);
      logger.info(`读取爬取数据: ${latestFile}`);

      const content = await fs.readFile(latestFile, 'utf-8');
      const data = JSON.parse(content);

      return Array.isArray(data) ? data : [data];
    } catch (error) {
      logger.error('读取爬虫输出失败:', error);
      return [];
    }
  }

  /**
   * 检查爬虫环境是否就绪
   */
  async checkEnvironment(): Promise<{ ready: boolean; message: string }> {
    try {
      // 检查 crawler 目录
      await fs.access(this.crawlerPath);

      // 检查 Python
      const pythonCheck = await this.runPythonScript('--version', []);

      if (!pythonCheck.success) {
        return {
          ready: false,
          message: 'Python 环境未安装或配置错误',
        };
      }

      return {
        ready: true,
        message: '爬虫环境就绪',
      };
    } catch (error) {
      return {
        ready: false,
        message: `环境检查失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }
}

export default new CrawlerService();
