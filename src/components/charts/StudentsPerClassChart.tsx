import React from 'react';
import { getStageColorForName } from './StageDistributionChart';

interface ClassData {
  className: string;
  studentCount: number;
  stage?: string;
}

interface StageData {
  stageName: string;
  studentCount: number;
}

interface StudentsPerClassChartProps {
  data: ClassData[];
  stageData?: StageData[];
}

// Helper function to determine class color based on stage
const getClassColor = (classData: ClassData, stageData: StageData[]): string => {
  if (!stageData || stageData.length === 0) {
    return '#3b82f6'; // Default blue color
  }

  // If we have direct stage information for this class, use it
  if (classData.stage) {
    return getStageColorForName(classData.stage, stageData);
  }

  // Fallback: try to match class name with stage names
  const classNameLower = classData.className.toLowerCase();

  // Direct stage name match
  for (const stage of stageData) {
    const stageNameLower = stage.stageName.toLowerCase();
    if (classNameLower.includes(stageNameLower) || stageNameLower.includes(classNameLower)) {
      return getStageColorForName(stage.stageName, stageData);
    }
  }

  // If still no match, use the first stage color as fallback
  return getStageColorForName(stageData[0].stageName, stageData);
};

const StudentsPerClassChart: React.FC<StudentsPerClassChartProps> = ({ data, stageData }) => {

  // Use real data if available, otherwise empty
  const chartData = data && data.length > 0 ? data : [];

  // Sort data by student count (descending)
  const sortedData = [...chartData].sort((a, b) => b.studentCount - a.studentCount);

  // Find max student count for scaling
  const maxCount = sortedData.length > 0 ? Math.max(...sortedData.map(d => d.studentCount)) : 0;

  return (
    <div className="w-full h-full p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900">Students per Class</h3>
        <div className="text-sm text-gray-500">
          Total Classes: {sortedData.length}
        </div>
      </div>

      {sortedData.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>No class data available</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto" style={{ height: '280px' }}>
          {sortedData.map((item, index) => {
            const barWidth = maxCount > 0 ? (item.studentCount / maxCount) * 100 : 0;
            const color = getClassColor(item, stageData || []);

            return (
              <div key={index} className="flex items-center gap-4 group">
                {/* Class Name */}
                <div className="flex-shrink-0 w-36 text-sm font-medium text-gray-700">
                  <span
                    className="block truncate"
                    title={item.className}
                    style={{
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {item.className}
                  </span>
                </div>

                {/* Bar Container */}
                <div className="flex-1 relative min-w-0">
                  {/* Background bar */}
                  <div
                    className="h-7 bg-gray-200 rounded-full"
                    style={{ width: '100%' }}
                  ></div>

                  {/* Colored bar */}
                  <div
                    className="h-7 rounded-full flex items-center justify-end pr-3 transition-all duration-300 hover:opacity-80 group-hover:shadow-sm"
                    style={{
                      width: `${Math.max(barWidth, 8)}%`,
                      backgroundColor: color,
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      minWidth: '32px'
                    }}
                  >
                    {barWidth > 15 && (
                      <span className="text-xs font-semibold text-white drop-shadow-sm">
                        {item.studentCount}
                      </span>
                    )}
                  </div>

                  {/* Student count outside bar if bar is too small */}
                  {barWidth <= 15 && (
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs font-semibold text-gray-700 bg-white px-1 rounded shadow-sm">
                      {item.studentCount}
                    </span>
                  )}
                </div>

                {/* Student count label */}
                <div className="flex-shrink-0 w-14 text-sm font-bold text-gray-900 text-right">
                  {item.studentCount}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      {sortedData.length > 0 && (
        <div className="mt-auto pt-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div>Total Students: {sortedData.reduce((sum, item) => sum + item.studentCount, 0)}</div>
            <div>Average per Class: {sortedData.length > 0 ? Math.round(sortedData.reduce((sum, item) => sum + item.studentCount, 0) / sortedData.length) : 0}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPerClassChart;