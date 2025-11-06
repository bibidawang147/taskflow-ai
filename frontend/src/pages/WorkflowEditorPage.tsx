import WorkflowEditor from '../components/WorkflowEditor/WorkflowEditor'

export default function WorkflowEditorPage() {
  return (
    <div className="h-screen bg-gray-100">
      <div className="h-full flex flex-col">
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">工作流编辑器</h1>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">未保存的更改</span>
            <button className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700">
              保存
            </button>
          </div>
        </div>
        <div className="flex-1">
          <WorkflowEditor />
        </div>
      </div>
    </div>
  )
}