import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useWorkflows } from '../hooks/useWorkflows';
import { useTasks } from '../hooks/useTasks';

export function DashboardPage() {
  const { workflows, loading: workflowsLoading } = useWorkflows();
  const { tasks, loading: tasksLoading } = useTasks();

  const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;

  const activeWorkflows = workflows.filter((w) => w.status === 'active').length;

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">대시보드</h1>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* 전체 워크플로우 */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-indigo-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-xl">W</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      전체 워크플로우
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {workflowsLoading ? '...' : workflows.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <Link to="/workflows" className="text-sm text-indigo-600 hover:text-indigo-900">
                전체 보기
              </Link>
            </div>
          </div>

          {/* 활성 워크플로우 */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-xl">A</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      활성 워크플로우
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {workflowsLoading ? '...' : activeWorkflows}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* 진행 중 태스크 */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-xl">P</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">대기 중 / 진행 중</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {tasksLoading ? '...' : `${pendingTasks} / ${inProgressTasks}`}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <Link to="/tasks" className="text-sm text-indigo-600 hover:text-indigo-900">
                전체 보기
              </Link>
            </div>
          </div>

          {/* 완료 태스크 */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-xl">C</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">완료된 태스크</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {tasksLoading ? '...' : completedTasks}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 최근 워크플로우 */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">최근 워크플로우</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {workflowsLoading ? (
              <div className="p-4 text-center text-gray-500">로딩 중...</div>
            ) : workflows.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                워크플로우가 없습니다.{' '}
                <Link to="/workflows/new" className="text-indigo-600 hover:text-indigo-900">
                  새로 만들기
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {workflows.slice(0, 5).map((workflow) => (
                  <li key={workflow.id}>
                    <Link to={`/workflows/${workflow.id}`} className="block hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {workflow.name}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                workflow.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : workflow.status === 'draft'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {workflow.status === 'active' ? '활성' : workflow.status === 'draft' ? '초안' : '보관'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="text-sm text-gray-500">{workflow.description || '설명 없음'}</p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <span>{workflow.nodes.length}개 노드</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
