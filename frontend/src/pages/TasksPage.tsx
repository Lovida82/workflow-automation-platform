import { useState } from 'react';
import { Layout } from '../components/Layout';
import { useTasks, Task } from '../hooks/useTasks';

export function TasksPage() {
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium');
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<Task['status'] | 'all'>('all');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setCreating(true);
    try {
      await createTask(newTaskTitle, newTaskDescription, newTaskPriority);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('medium');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (task: Task, newStatus: Task['status']) => {
    try {
      await updateTask(task.id, { status: newStatus });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 태스크를 삭제하시겠습니까?')) return;

    try {
      await deleteTask(id);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const filteredTasks = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">태스크</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            태스크 만들기
          </button>
        </div>

        {/* Filter */}
        <div className="mb-4 flex space-x-2">
          {(['all', 'pending', 'in_progress', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 text-sm rounded-full ${
                filter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status === 'all'
                ? '전체'
                : status === 'in_progress'
                  ? '진행 중'
                  : status === 'pending'
                    ? '대기 중'
                    : '완료'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">로딩 중...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              {filter === 'all' ? '태스크가 없습니다.' : filter === 'pending' ? '대기 중인 태스크가 없습니다.' : filter === 'in_progress' ? '진행 중인 태스크가 없습니다.' : '완료된 태스크가 없습니다.'}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                첫 번째 태스크 만들기
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <li key={task.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3
                            className={`text-lg font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}
                          >
                            {task.title}
                          </h3>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{task.description}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <select
                          value={task.status}
                          onChange={(e) =>
                            handleStatusChange(task, e.target.value as Task['status'])
                          }
                          className={`text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${getStatusColor(task.status)}`}
                        >
                          <option value="pending">대기 중</option>
                          <option value="in_progress">진행 중</option>
                          <option value="completed">완료</option>
                        </select>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <form onSubmit={handleCreate}>
                <div className="px-6 py-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">새 태스크 만들기</h2>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="task-title"
                        className="block text-sm font-medium text-gray-700"
                      >
                        제목
                      </label>
                      <input
                        type="text"
                        id="task-title"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="태스크 제목"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="task-description"
                        className="block text-sm font-medium text-gray-700"
                      >
                        설명
                      </label>
                      <textarea
                        id="task-description"
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="태스크에 대해 설명해주세요..."
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="task-priority"
                        className="block text-sm font-medium text-gray-700"
                      >
                        우선순위
                      </label>
                      <select
                        id="task-priority"
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as Task['priority'])}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="low">낮음</option>
                        <option value="medium">보통</option>
                        <option value="high">높음</option>
                      </select>
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
