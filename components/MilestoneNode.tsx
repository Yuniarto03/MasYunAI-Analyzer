import React from 'react';
import { Milestone } from '../types';
import { RAW_COLOR_VALUES } from '../constants';
import { 
  Calendar, 
  Target, 
  Briefcase, 
  Users, 
  Zap, 
  Award, 
  Rocket, 
  Shield, 
  Heart, 
  Star,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Pause
} from 'lucide-react';

export type MilestoneCategoryKey = 
  | 'GENERAL' 
  | 'DEVELOPMENT' 
  | 'MARKETING' 
  | 'SALES' 
  | 'FINANCE' 
  | 'HR' 
  | 'OPERATIONS' 
  | 'QUALITY' 
  | 'SECURITY' 
  | 'LAUNCH' 
  | 'MILESTONE' 
  | 'DEADLINE' 
  | 'REVIEW' 
  | 'OTHER';

export const MILESTONE_CATEGORIES: Record<MilestoneCategoryKey, { 
  label: string; 
  icon: React.ElementType; 
  colorKey: string; 
}> = {
  GENERAL: { label: 'General', icon: Target, colorKey: 'blue-400' },
  DEVELOPMENT: { label: 'Development', icon: Rocket, colorKey: 'green-400' },
  MARKETING: { label: 'Marketing', icon: Zap, colorKey: 'purple-500' },
  SALES: { label: 'Sales', icon: Award, colorKey: 'yellow-400' },
  FINANCE: { label: 'Finance', icon: Briefcase, colorKey: 'cyan-400' },
  HR: { label: 'Human Resources', icon: Users, colorKey: 'pink-500' },
  OPERATIONS: { label: 'Operations', icon: Shield, colorKey: 'amber-500' },
  QUALITY: { label: 'Quality Assurance', icon: CheckCircle, colorKey: 'lime-500' },
  SECURITY: { label: 'Security', icon: Shield, colorKey: 'violet-500' },
  LAUNCH: { label: 'Product Launch', icon: Rocket, colorKey: 'green-400' },
  MILESTONE: { label: 'Key Milestone', icon: Star, colorKey: 'yellow-400' },
  DEADLINE: { label: 'Deadline', icon: Clock, colorKey: 'red-500' },
  REVIEW: { label: 'Review/Audit', icon: CheckCircle, colorKey: 'blue-400' },
  OTHER: { label: 'Other', icon: Heart, colorKey: 'gray-400' }
};

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'completed': return CheckCircle;
    case 'in_progress': return Clock;
    case 'delayed': return AlertTriangle;
    case 'cancelled': return XCircle;
    case 'pending': return Pause;
    default: return Clock;
  }
};

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'completed': return '#10b981'; // green
    case 'in_progress': return '#3b82f6'; // blue
    case 'delayed': return '#f59e0b'; // amber
    case 'cancelled': return '#ef4444'; // red
    case 'pending': return '#6b7280'; // gray
    default: return '#6b7280';
  }
};

interface MilestoneNodeProps {
  milestone: Milestone;
  positionStyle: React.CSSProperties;
  isAboveAxis: boolean;
  connectorColor: string;
  onViewDetails: () => void;
}

const MilestoneNode: React.FC<MilestoneNodeProps> = ({
  milestone,
  positionStyle,
  isAboveAxis,
  connectorColor,
  onViewDetails
}) => {
  const categoryKey = (milestone.category?.toUpperCase() as MilestoneCategoryKey) || 'GENERAL';
  const categoryInfo = MILESTONE_CATEGORIES[categoryKey] || MILESTONE_CATEGORIES.OTHER;
  const IconComp = categoryInfo.icon;
  const iconColor = RAW_COLOR_VALUES[categoryInfo.colorKey] || connectorColor;
  
  const StatusIcon = getStatusIcon(milestone.status);
  const statusColor = getStatusColor(milestone.status);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const milestoneDate = new Date(milestone.date);
  const daysDiff = Math.ceil((milestoneDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  let urgencyClass = '';
  if (daysDiff < 0) urgencyClass = 'border-red-500 shadow-red-500/30';
  else if (daysDiff <= 7) urgencyClass = 'border-yellow-500 shadow-yellow-500/30';
  else if (daysDiff <= 30) urgencyClass = 'border-blue-500 shadow-blue-500/30';
  else urgencyClass = 'border-gray-500 shadow-gray-500/30';

  return (
    <div className="absolute" style={positionStyle}>
      {/* Connector Line */}
      <div 
        className="absolute left-1/2 w-1 bg-gradient-to-b from-transparent via-current to-transparent"
        style={{
          height: '50px',
          color: connectorColor,
          top: isAboveAxis ? 'calc(100% - 10px)' : '-40px',
          transform: 'translateX(-50%)',
          zIndex: 5
        }}
      />
      
      {/* Milestone Card */}
      <div 
        className={`
          relative bg-gray-800/95 backdrop-blur-sm border-2 rounded-xl p-3 shadow-lg 
          hover:shadow-xl transition-all duration-300 cursor-pointer group
          ${urgencyClass}
        `}
        onClick={onViewDetails}
        style={{
          minHeight: '120px',
          boxShadow: `0 8px 25px -5px ${connectorColor}40, 0 4px 10px -3px ${connectorColor}20`
        }}
      >
        {/* Header with Icon and Status */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div 
              className="p-1.5 rounded-lg"
              style={{ backgroundColor: `${iconColor}20`, border: `1px solid ${iconColor}40` }}
            >
              <IconComp size={16} style={{ color: iconColor }} />
            </div>
            <span className="text-xs font-medium text-gray-300 truncate">
              {categoryInfo.label}
            </span>
          </div>
          <StatusIcon size={14} style={{ color: statusColor }} />
        </div>

        {/* Title */}
        <h4 className="text-sm font-bold text-white mb-1 line-clamp-2 group-hover:text-blue-300 transition-colors">
          {milestone.title}
        </h4>

        {/* Date */}
        <div className="flex items-center gap-1 mb-2">
          <Calendar size={12} className="text-gray-400" />
          <span className="text-xs text-gray-400">{milestone.date}</span>
        </div>

        {/* Description */}
        {milestone.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">
            {milestone.description}
          </p>
        )}

        {/* Value/Metric */}
        {milestone.value && (
          <div className="text-xs text-blue-300 font-medium mb-2">
            📊 {milestone.value}
          </div>
        )}

        {/* Progress Bar (if completion percentage exists) */}
        {milestone.completionPercentage !== undefined && (
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span>
              <span>{milestone.completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${milestone.completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Sub-tasks indicator */}
        {milestone.subTasks && milestone.subTasks.length > 0 && (
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <CheckCircle size={10} />
            <span>
              {milestone.subTasks.filter(t => t.completed).length}/{milestone.subTasks.length} tasks
            </span>
          </div>
        )}

        {/* Days indicator */}
        <div className="absolute -top-2 -right-2 bg-gray-900 border border-gray-600 rounded-full px-2 py-1 text-xs font-bold">
          {daysDiff === 0 ? (
            <span className="text-green-400">Today</span>
          ) : daysDiff > 0 ? (
            <span className="text-blue-400">{daysDiff}d</span>
          ) : (
            <span className="text-red-400">{Math.abs(daysDiff)}d ago</span>
          )}
        </div>

        {/* Priority indicator */}
        {milestone.priority && milestone.priority !== 'medium' && (
          <div className={`absolute -top-1 -left-1 w-3 h-3 rounded-full ${
            milestone.priority === 'critical' ? 'bg-red-500' :
            milestone.priority === 'high' ? 'bg-orange-500' :
            'bg-green-500'
          }`} />
        )}
      </div>
    </div>
  );
};

export default MilestoneNode;