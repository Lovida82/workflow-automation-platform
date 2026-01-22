import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600">
      <nav className="bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="text-white text-xl font-bold">Workflow Automation</div>
            <div className="space-x-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="bg-white text-indigo-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
                >
                  대시보드로 이동
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    로그인
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-white text-indigo-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
                  >
                    시작하기
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white mb-6">
            Automate Your Workflows
          </h1>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            강력한 워크플로우 자동화 플랫폼으로 비즈니스 프로세스를 구축, 관리, 자동화하세요.
            Firebase 기반으로 안정적이고 확장 가능합니다.
          </p>
          <div className="space-x-4">
            {user ? (
              <Link
                to="/dashboard"
                className="bg-white text-indigo-600 px-8 py-3 rounded-md text-lg font-medium hover:bg-gray-100 inline-block"
              >
                대시보드로 이동
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="bg-white text-indigo-600 px-8 py-3 rounded-md text-lg font-medium hover:bg-gray-100 inline-block"
                >
                  무료로 시작하기
                </Link>
                <Link
                  to="/login"
                  className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-white hover:text-indigo-600 inline-block"
                >
                  로그인
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-6">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">W</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Visual Workflow Builder</h3>
            <p className="text-indigo-100">
              직관적인 드래그 앤 드롭 인터페이스로 복잡한 워크플로우를 설계하세요.
              코딩이 필요 없습니다.
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-6">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">T</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Task Management</h3>
            <p className="text-indigo-100">
              태스크를 효율적으로 추적하고 관리하세요. 우선순위 지정, 할당,
              실시간 진행 상황 모니터링이 가능합니다.
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-6">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">F</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Firebase Powered</h3>
            <p className="text-indigo-100">
              Firebase 기반으로 실시간 동기화, 안전한 인증, 확장 가능한 클라우드
              함수를 제공합니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
