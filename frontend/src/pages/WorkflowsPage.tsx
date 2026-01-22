import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Play, Edit2, Trash2 } from 'lucide-react';
import { Layout } from '../components/Layout';
import { useWorkflows } from '../hooks/useWorkflows';

export function WorkflowsPage() {
  const navigate = useNavigate();
  const { workflows, loading, createWorkflow, deleteWorkflow } = useWorkflows();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDescription, setNewWorkflowDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkflowName.trim()) return;

    setCreating(true);
    try {
      const workflowId = await createWorkflow(newWorkflowName, newWorkflowDescription);
      setNewWorkflowName('');
      setNewWorkflowDescription('');
      setShowCreateModal(false);
      navigate(`/workflows/${workflowId}`);
    } catch (error) {
      console.error('Failed to create workflow:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 워크플로우를 삭제하시겠습니까?')) return;

    try {
      await deleteWorkflow(id);
    } catch (error) {
      console.error('Failed to delete workflow:', error);
    }
  };

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">워크플로우</h1>
            <p className="text-sm text-gray-500 mt-1">노코드로 자동화 워크플로우를 만들어 보세요</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/workflows/new"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              새 워크플로우
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">로딩 중...</div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">워크플로우가 없습니다.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              첫 번째 워크플로우 만들기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {workflow.description || '설명 없음'}
                      </p>
                    </div>
                    <span
                      className={`ml-2 px-2.5 py-0.5 text-xs font-medium rounded-full ${
                        workflow.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : workflow.status === 'draft'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {workflow.status === 'active' ? '활성' : workflow.status === 'draft' ? '초안' : '보관'}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      {workflow.nodes.length}개 노드
                    </span>
                    <span className="mx-2">·</span>
                    <span>{workflow.edges.length}개 연결</span>
                  </div>
                </div>

                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 rounded-b-lg flex justify-between items-center">
                  <Link
                    to={`/workflows/${workflow.id}`}
                    className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    편집
                  </Link>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/workflows/${workflow.id}`)}
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="실행"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(workflow.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <form onSubmit={handleCreate}>
                <div className="px-6 py-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">새 워크플로우 만들기</h2>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="workflow-name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        이름
                      </label>
                      <input
                        type="text"
                        id="workflow-name"
                        value={newWorkflowName}
                        onChange={(e) => setNewWorkflowName(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="워크플로우 이름"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="workflow-description"
                        className="block text-sm font-medium text-gray-700"
                      >
                        설명
                      </label>
                      <textarea
                        id="workflow-description"
                        value={newWorkflowDescription}
                        onChange={(e) => setNewWorkflowDescription(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="워크플로우에 대해 설명해주세요..."
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3 rounded-b-lg">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    {creating ? '생성 중...' : '만들기'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
