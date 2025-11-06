import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Link2,
  FileText,
  Image,
  Video,
  FileCode,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  analyzeContent,
  ContentType,
  detectContentType,
  validateFileSize,
  formatFileSize,
} from '../services/contentAnalysis';

type InputMethod = 'file' | 'url' | 'text';

export default function ReverseEngineerPage() {
  const navigate = useNavigate();

  const [inputMethod, setInputMethod] = useState<InputMethod>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [useMock, setUseMock] = useState(false);

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件大小
    if (!validateFileSize(file, 10)) {
      setError('文件大小不能超过10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  // 处理拖拽上传
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!validateFileSize(file, 10)) {
      setError('文件大小不能超过10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // 提交分析
  const handleSubmit = async () => {
    setError(null);
    setResult(null);

    // 验证输入
    if (inputMethod === 'file' && !selectedFile) {
      setError('请选择文件');
      return;
    }

    if (inputMethod === 'url' && !urlInput.trim()) {
      setError('请输入URL');
      return;
    }

    if (inputMethod === 'text' && !textInput.trim()) {
      setError('请输入文本内容');
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await analyzeContent(
        {
          file: inputMethod === 'file' ? selectedFile! : undefined,
          url: inputMethod === 'url' ? urlInput : undefined,
          text: inputMethod === 'text' ? textInput : undefined,
          autoSave: true,
        },
        useMock
      );

      setResult(response);

      // 如果成功创建工作流，3秒后跳转
      if (response.workflow) {
        setTimeout(() => {
          navigate(`/workflows/${response.workflow.id}`);
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || '分析失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 获取内容类型图标
  const getContentTypeIcon = (type?: ContentType) => {
    if (inputMethod === 'file' && selectedFile) {
      const detectedType = detectContentType(selectedFile);
      type = detectedType;
    }

    switch (type) {
      case 'image':
        return <Image className="w-6 h-6" />;
      case 'video':
        return <Video className="w-6 h-6" />;
      case 'code':
      case 'pdf':
      case 'ppt':
        return <FileCode className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            从成果逆向生成工作流
          </h1>
          <p className="text-lg text-gray-600">
            上传一个成果（图片、视频、文档等），AI将分析并生成完成它所需的工作流程
          </p>
        </div>

        {/* 主卡片 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* 输入方式选择 */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              选择输入方式
            </label>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setInputMethod('file')}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                  inputMethod === 'file'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Upload className="w-8 h-8 mb-2" />
                <span className="font-medium">上传文件</span>
              </button>

              <button
                onClick={() => setInputMethod('url')}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                  inputMethod === 'url'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Link2 className="w-8 h-8 mb-2" />
                <span className="font-medium">粘贴链接</span>
              </button>

              <button
                onClick={() => setInputMethod('text')}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                  inputMethod === 'text'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className="w-8 h-8 mb-2" />
                <span className="font-medium">输入文本</span>
              </button>
            </div>
          </div>

          {/* 文件上传区域 */}
          {inputMethod === 'file' && (
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                上传文件
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-indigo-400 transition-colors cursor-pointer"
              >
                {selectedFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center text-indigo-600">
                      {getContentTypeIcon()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      <X className="inline w-4 h-4 mr-1" />
                      移除文件
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      拖拽文件到这里，或
                      <label className="text-indigo-600 hover:text-indigo-700 cursor-pointer font-medium ml-1">
                        点击选择
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileSelect}
                          accept="image/*,video/*,application/pdf,.ppt,.pptx"
                        />
                      </label>
                    </p>
                    <p className="text-sm text-gray-500">
                      支持图片、视频、PDF、PPT等格式，最大10MB
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* URL 输入 */}
          {inputMethod === 'url' && (
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                输入URL
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/article"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="mt-2 text-sm text-gray-500">
                支持文章链接、图片链接等
              </p>
            </div>
          )}

          {/* 文本输入 */}
          {inputMethod === 'text' && (
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                输入文本内容
              </label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="粘贴文章内容或描述..."
                rows={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>
          )}

          {/* Mock模式切换 */}
          <div className="mb-6 flex items-center">
            <input
              type="checkbox"
              id="mockMode"
              checked={useMock}
              onChange={(e) => setUseMock(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="mockMode" className="ml-2 text-sm text-gray-700">
              使用测试模式（不消耗API credits）
            </label>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* 成功结果 */}
          {result && (
            <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-2">
                    {result.message}
                  </h3>
                  {result.workflow && (
                    <p className="text-green-800 mb-2">
                      工作流已创建：<strong>{result.workflow.title}</strong>
                    </p>
                  )}
                </div>
              </div>

              {/* 分析结果详情 */}
              <div className="bg-white rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">成果类型：</span>
                    <span className="font-medium ml-2">
                      {result.analysis.sourceType}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">复杂度：</span>
                    <span className="font-medium ml-2">
                      {result.analysis.complexity || '中等'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">步骤数：</span>
                    <span className="font-medium ml-2">
                      {result.analysis.stepsExtracted}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">预估时间：</span>
                    <span className="font-medium ml-2">
                      {result.analysis.estimatedTime || '未知'}
                    </span>
                  </div>
                </div>

                {result.analysis.tags && result.analysis.tags.length > 0 && (
                  <div className="pt-2 border-t">
                    <span className="text-gray-600 text-sm">标签：</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {result.analysis.tags.map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {result.workflow && (
                <p className="text-sm text-green-700 mt-4">
                  正在跳转到工作流编辑器...
                </p>
              )}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            onClick={handleSubmit}
            disabled={isAnalyzing}
            className="w-full bg-indigo-600 text-white py-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                AI正在分析中...
              </>
            ) : (
              '生成工作流'
            )}
          </button>
        </div>

        {/* 使用说明 */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">使用说明</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                <strong>图片：</strong>上传设计稿、数据图表、产品截图等，AI将分析并推断出创作流程
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                <strong>文章/文本：</strong>粘贴教程、文档或URL，AI将提取其中的工作流程
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                <strong>视频：</strong>上传教程视频，AI将通过音频转录分析流程（即将支持）
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                生成的工作流可以保存为模板，下次复用
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
