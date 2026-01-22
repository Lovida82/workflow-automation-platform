// 차트 렌더링 컴포넌트
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ChartRendererProps {
  type: 'line-chart' | 'bar-chart' | 'wordcloud' | 'table';
  data: any[];
  config: {
    xField?: string;
    yField?: string;
    categoryField?: string;
    valueField?: string;
    wordField?: string;
    countField?: string;
    title?: string;
  };
}

const COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
];

export function ChartRenderer({ type, data, config }: ChartRendererProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg">
        <p className="text-slate-500">데이터가 없습니다.</p>
      </div>
    );
  }

  switch (type) {
    case 'line-chart':
      return (
        <div className="w-full">
          {config.title && (
            <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">
              {config.title}
            </h3>
          )}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={config.xField || 'x'}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => String(value).substring(0, 10)}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey={config.yField || 'y'}
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );

    case 'bar-chart':
      return (
        <div className="w-full">
          {config.title && (
            <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">
              {config.title}
            </h3>
          )}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={config.categoryField || 'category'}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => String(value).substring(0, 15)}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey={config.valueField || 'value'}
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );

    case 'wordcloud':
      // 워드클라우드는 원형 차트로 대체 (간단한 구현)
      const wordField = config.wordField || 'word';
      const countField = config.countField || 'count';
      const pieData = data.slice(0, 10).map(item => ({
        name: item[wordField] || '',
        value: item[countField] || 0,
      }));

      return (
        <div className="w-full">
          {config.title && (
            <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">
              {config.title || '키워드 분포'}
            </h3>
          )}
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {data.slice(0, 20).map((item, index) => {
              const word = item[wordField];
              const count = item[countField];
              const maxCount = Math.max(...data.map(d => d[countField] || 0));
              const fontSize = Math.max(12, Math.min(32, 12 + (count / maxCount) * 20));

              return (
                <span
                  key={index}
                  className="px-2 py-1 rounded transition-colors hover:opacity-80"
                  style={{
                    fontSize: `${fontSize}px`,
                    color: COLORS[index % COLORS.length],
                    fontWeight: count > maxCount * 0.5 ? 'bold' : 'normal',
                  }}
                  title={`${word}: ${count}회`}
                >
                  {word}
                </span>
              );
            })}
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );

    default:
      return (
        <div className="p-4 bg-slate-50 rounded-lg">
          <p className="text-slate-500 text-sm">지원하지 않는 차트 타입입니다: {type}</p>
        </div>
      );
  }
}
