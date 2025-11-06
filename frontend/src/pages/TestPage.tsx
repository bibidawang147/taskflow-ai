export function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-500 to-indigo-600 p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 测试区域1 - 超大标题 */}
        <div className="bg-white rounded-3xl p-12 shadow-2xl border-4 border-violet-300">
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-6">
            🎨 UI测试页面
          </h1>
          <p className="text-2xl text-slate-700 font-bold">
            如果你能看到这个页面有漂亮的紫色渐变背景，说明Tailwind工作正常！
          </p>
        </div>

        {/* 测试区域2 - 按钮 */}
        <div className="bg-white rounded-3xl p-12 shadow-2xl">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">按钮测试</h2>
          <button className="px-12 py-6 text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl shadow-2xl hover:scale-110 hover:shadow-violet-500/50 transition-all">
            点击我！超大按钮
          </button>
        </div>

        {/* 测试区域3 - 卡片 */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-violet-100 to-indigo-100 rounded-3xl p-8 border-4 border-violet-300 shadow-xl">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full mb-4 shadow-2xl"></div>
            <h3 className="text-2xl font-bold text-violet-900">卡片 1</h3>
            <p className="text-lg text-violet-700 mt-2">这是测试卡片</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-100 to-violet-100 rounded-3xl p-8 border-4 border-indigo-300 shadow-xl">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-full mb-4 shadow-2xl"></div>
            <h3 className="text-2xl font-bold text-indigo-900">卡片 2</h3>
            <p className="text-lg text-indigo-700 mt-2">这是测试卡片</p>
          </div>
        </div>

        {/* 说明 */}
        <div className="bg-yellow-100 border-4 border-yellow-400 rounded-3xl p-8 shadow-xl">
          <p className="text-xl font-bold text-yellow-900">
            ⚠️ 如果这个页面看起来很漂亮，说明样式系统工作正常。
            <br />
            如果看起来很简陋，说明Tailwind配置有问题。
          </p>
        </div>
      </div>
    </div>
  )
}

export default TestPage
