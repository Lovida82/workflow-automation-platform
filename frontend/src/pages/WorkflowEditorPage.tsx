// 워크플로우 에디터 페이지
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { useWorkflowStore } from '../store/workflowStore';
import { CanvasEditor } from '../components/canvas/CanvasEditor';

export function WorkflowEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { setWorkflow } = useWorkflowStore();

  // 인증 확인
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // 워크플로우 로드
  useEffect(() => {
    const loadWorkflow = async () => {
      if (id && id !== 'new') {
        try {
          const docRef = doc(db, 'workflows', id);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setWorkflow(
              id,
              data.name || '워크플로우',
              data.description || '',
              data.nodes || [],
              data.edges || []
            );
          } else {
            console.error('Workflow not found');
            navigate('/workflows');
          }
        } catch (error) {
          console.error('Error loading workflow:', error);
        }
      } else {
        // 새 워크플로우
        setWorkflow(null as any, '새 워크플로우', '', [], []);
      }
    };

    if (user) {
      loadWorkflow();
    }
  }, [id, user, setWorkflow, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <CanvasEditor />;
}
