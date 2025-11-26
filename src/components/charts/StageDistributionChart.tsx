import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface StageData {
  stageName: string;
  studentCount: number;
}

interface StageDistributionChartProps {
  data: StageData[];
}

// Color palette for different stages
const COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#ec4899", // pink-500
];

// Dynamic color mapping based on stage data
const createStageColorMap = (stageData: StageData[]) => {
  const colorMap: { [key: string]: string } = {};

  // Sort stages alphabetically to ensure consistent coloring
  const sortedStages = [...stageData].sort((a, b) =>
    a.stageName.localeCompare(b.stageName)
  );

  sortedStages.forEach((stage, index) => {
    colorMap[stage.stageName] = COLORS[index % COLORS.length];
  });

  return colorMap;
};

// Export function to get color for a specific stage (for use in other components)
export const getStageColorForName = (stageName: string, stageData: StageData[]): string => {
  const colorMap = createStageColorMap(stageData);
  return colorMap[stageName] || COLORS[0];
};

const StageDistributionChart: React.FC<StageDistributionChartProps> = ({ data }) => {
  // Create dynamic color mapping for stages
  const stageColorMap = createStageColorMap(data);

  // Transform data for pie chart
  const chartData = data.map((stage, index) => ({
    name: `${stage.stageName} (${stage.studentCount})`,
    value: stage.studentCount,
    originalName: stage.stageName,
  }));

  // Calculate total for percentage display
  const totalStudents = data.reduce((sum, stage) => sum + stage.studentCount, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value as number) / totalStudents * 100).toFixed(1);
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.payload.originalName}</p>
          <p className="text-sm text-gray-600">
            Students: <span className="font-medium text-blue-600">{data.value}</span>
          </p>
          <p className="text-sm text-gray-600">
            of Total: <span className="font-medium text-green-600">{percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if slice is large enough
    if (value < 5) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight="bold"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
      >
        {value}
      </text>
    );
  };

  return (
    <div className="w-full h-full p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
      <div className="flex justify-between items-center mb-3 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900">Stage Distribution</h3>
        <div className="text-sm text-gray-500">
          Total Stages: {chartData.length}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center flex-1 text-gray-500">
          <p>No stage data available</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 p-2">
          <ResponsiveContainer width="100%" height="100%" margin={{ top: 20, right: 20, bottom: 70, left: 20 }}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                label={CustomLabel}
                outerRadius={70}
                innerRadius={18}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={1}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={stageColorMap[entry.originalName] || COLORS[0]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={60}
                formatter={(value: string) => (
                  <span className="text-xs font-medium text-gray-700">{value}</span>
                )}
                wrapperStyle={{
                  paddingTop: '10px',
                  fontSize: '10px',
                  lineHeight: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Footer Stats */}
      {chartData.length > 0 && (
        <div className="mt-auto pt-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div>Total Students: {totalStudents}</div>
            <div>Average per Stage: {Math.round(totalStudents / chartData.length)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StageDistributionChart;