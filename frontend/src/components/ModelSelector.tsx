import { useState, useEffect } from 'react';
import { Check, ChevronDown, Sparkles, Lock, Zap } from 'lucide-react';
import { aiService } from '../services/ai';
import { AIModel, AIProvider, GroupedModels } from '../types/ai';

interface ModelSelectorProps {
  value?: { provider: AIProvider; model: string };
  onChange: (provider: AIProvider, model: AIModel) => void;
  compact?: boolean;
}

export function ModelSelector({ value, onChange, compact = false }: ModelSelectorProps) {
  const [modelsData, setModelsData] = useState<GroupedModels | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(
    value?.provider || null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const data = await aiService.getAvailableModels();
      setModelsData(data);

      // 如果没有选中的，自动选择第一个
      if (!value && data.models) {
        const firstProvider = Object.keys(data.models)[0] as AIProvider;
        const firstModel = data.models[firstProvider]?.[0];
        if (firstProvider && firstModel) {
          setSelectedProvider(firstProvider);
          onChange(firstProvider, firstModel);
        }
      }
    } catch (error) {
      console.error('加载模型列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModelSelect = (provider: AIProvider, model: AIModel) => {
    setSelectedProvider(provider);
    onChange(provider, model);
    setIsOpen(false);
  };

  const getCurrentModel = (): AIModel | null => {
    if (!value || !modelsData) return null;
    const models = modelsData.models[value.provider];
    return models?.find((m) => m.modelId === value.model) || null;
  };

  const currentModel = getCurrentModel();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!modelsData) {
    return <div className="text-red-500 text-sm">加载模型失败</div>;
  }

  // 紧凑模式
  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:border-blue-400 transition-colors w-full"
        >
          <span className="text-lg">{aiService.getProviderIcon(value?.provider || 'openai')}</span>
          <span className="flex-1 text-left text-sm truncate">
            {currentModel?.modelName || '选择模型'}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
              {Object.entries(modelsData.models).map(([provider, models]) => (
                <div key={provider} className="p-2">
                  <div className="text-xs font-semibold text-gray-500 px-2 py-1">
                    {aiService.getProviderName(provider as AIProvider)}
                  </div>
                  {models.map((model) => (
                    <button
                      key={model.modelId}
                      onClick={() => handleModelSelect(provider as AIProvider, model)}
                      className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors"
                    >
                      <div className="font-medium text-sm">{model.modelName}</div>
                      <div className="text-xs text-gray-500">
                        {model.inputPrice}/{model.outputPrice} coins/1K
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // 完整模式
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          选择 AI 模型
        </h3>
        <div className="text-sm text-gray-500">
          你的等级: <span className="font-semibold text-blue-600">{modelsData.userTier}</span>
        </div>
      </div>

      {/* 提供商选择 */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {aiService.getProviderInfo().map((provider) => {
          const hasModels = modelsData.models[provider.id]?.length > 0;
          const isSelected = selectedProvider === provider.id;

          return (
            <button
              key={provider.id}
              onClick={() => hasModels && setSelectedProvider(provider.id)}
              disabled={!hasModels}
              className={`p-3 rounded-lg border-2 transition-all text-center ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : hasModels
                  ? 'border-gray-200 hover:border-blue-300'
                  : 'border-gray-100 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="text-2xl mb-1">{provider.icon}</div>
              <div className="text-xs font-medium truncate">{provider.name}</div>
            </button>
          );
        })}
      </div>

      {/* 模型列表 */}
      {selectedProvider && modelsData.models[selectedProvider] && (
        <div className="space-y-2">
          {modelsData.models[selectedProvider].map((model) => {
            const isSelected =
              value?.provider === selectedProvider && value?.model === model.modelId;

            return (
              <button
                key={model.modelId}
                onClick={() => handleModelSelect(selectedProvider, model)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{model.modelName}</h4>
                      {model.features?.vision && (
                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                          视觉
                        </span>
                      )}
                      {model.features?.functionCalling && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                          函数
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{model.description}</p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        <span>输入: {model.inputPrice} coins/1K</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        <span>输出: {model.outputPrice} coins/1K</span>
                      </div>
                      {model.maxTokens && (
                        <span>最大: {(model.maxTokens / 1000).toFixed(0)}K</span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center ml-2">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 提示信息 */}
      {modelsData.userTier === 'free' && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
          <Lock className="w-4 h-4 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-700">
            部分高级模型需要升级为 Pro 或 Enterprise 会员才能使用
          </div>
        </div>
      )}
    </div>
  );
}
