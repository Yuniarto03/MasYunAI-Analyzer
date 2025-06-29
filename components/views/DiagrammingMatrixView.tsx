import React, { useState, useMemo, useCallback, useEffect, useRef, DragEvent, WheelEvent, MouseEvent as ReactMouseEvent } from 'react';
import { Panel } from '../Panel';
import { IconType, DiagramNode, DiagramEdge, DiagramNodeStyle, DiagramTheme, DiagramState, ViewKey } from '../../types';
import { generateDiagramFromPrompt } from '../../services/geminiService';

// --- ICONS ---
const HomeIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.5 1.5 0 012.122 0l8.954 8.955M2.25 12v10.5a1.5 1.5 0 001.5 1.5H7.5v-6.75a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v6.75h3.75a1.5 1.5 0 001.5-1.5V12" /></svg>;
const RectangleIcon: IconType = ({ className }) => <svg className={className} viewBox="0 0 32 18" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="1" width="30" height="16" rx="2" /></svg>;
const EllipseIcon: IconType = ({ className }) => <svg className={className} viewBox="0 0 32 18" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="16" cy="9" rx="15" ry="8" /></svg>;
const DiamondIcon: IconType = ({ className }) => <svg className={className} viewBox="0 0 32 18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 1L31 9L16 17L1 9L16 1Z" /></svg>;
const PerspectiveIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.82m5.84-2.56a15.953 15.953 0 01-1.258 3.05m-2.702-8.836a15.953 15.953 0 013.05-1.258m-8.836 2.702a15.953 15.953 0 01-1.258-3.05M14.37 15.59a6 6 0 01-2.56 5.84m-2.56-5.84a6 6 0 017.38-5.84m-7.38 5.84L5.63 5.63m14.14 0L15.59 9.63" /></svg>;
const ThemeIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402a3.75 3.75 0 00-.625-6.25a3.75 3.75 0 00-6.25-.625l-6.402 6.401a3.75 3.75 0 000 5.304m7.496-7.496a.75.75 0 011.06 0l3.359 3.359a.75.75 0 010 1.06l-4.242 4.242a.75.75 0 01-1.06 0l-3.359-3.359a.75.75 0 010-1.06l4.242-4.242z" /></svg>;
const ExportIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const PresentIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15m11.25-6H9m11.25 0v4.5m0-4.5H9" /></svg>;
const AIGenerateIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>;
const TrashIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193v-.443A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>;
const DatabaseIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.25 3.335C6.25 2.645 6.78 2.06 7.437 2H12.5a.75.75 0 01.75.75v14.5a.75.75 0 01-.75.75h-5.063a.75.75 0 01-.687-.468l-1.875-4.5a.75.75 0 01.468-.937l3.75-1.5a.75.75 0 000-1.336l-3.75-1.5a.75.75 0 01-.468-.937l1.875-4.5z" /><path d="M14.5 2.75a.75.75 0 00-1.437.265l-1.875 4.5a.75.75 0 00.468.937l3.75 1.5a.75.75 0 010 1.336l-3.75 1.5a.75.75 0 00-.468.937l1.875 4.5a.75.75 0 001.437.265H12.5v-14.5h2z" /></svg>;
const CloudIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" /></svg>;
const ExitIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>;
const PlusIcon: IconType = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const MinusIcon: IconType = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>;
const FitScreenIcon: IconType = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" /></svg>;
const ChevronUpIcon: IconType = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>;
const ChevronDownIcon: IconType = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>;
const UserIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.095a1.23 1.23 0 00.41-1.412A9.957 9.957 0 0010 12c-2.31 0-4.438.784-6.131 2.095z" /></svg>;
const ServerIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h13A1.5 1.5 0 0118 3.5v2A1.5 1.5 0 0116.5 7h-13A1.5 1.5 0 012 5.5v-2zM2 9.5A1.5 1.5 0 013.5 8h13A1.5 1.5 0 0118 9.5v2A1.5 1.5 0 0116.5 13h-13A1.5 1.5 0 012 11.5v-2zM3.5 14a1.5 1.5 0 00-1.5 1.5v2A1.5 1.5 0 003.5 19h13a1.5 1.5 0 001.5-1.5v-2A1.5 1.5 0 0016.5 14h-13z" clipRule="evenodd" /></svg>;
const DocumentIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8.343a1 1 0 00-.293-.707l-3.343-3.343A1 1 0 0011.657 4H4zm7 2.75a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0111 4.75z" clipRule="evenodd" /></svg>;
const HexagonIcon: IconType = ({ className }) => <svg className={className} viewBox="0 0 32 28" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 14L9 3H23L30 14L23 25H9L2 14Z" /></svg>;
const CylinderIcon: IconType = ({ className }) => <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M30 7C30 3.68629 23.8366 1 16 1C8.16344 1 2 3.68629 2 7" /><path d="M2 7V25C2 28.3137 8.16344 31 16 31C23.8366 31 30 28.3137 30 25V7" /><ellipse cx="16" cy="7" rx="14" ry="6" /></svg>;
const FolderIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>;
const FlowchartIcon: IconType = DiamondIcon;
const OrgChartIcon: IconType = UserIcon;
const WorkflowIcon: IconType = ServerIcon;
const TextIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M3.75 4.25a.75.75 0 00-1.5 0v11.5a.75.75 0 001.5 0V4.25zM5.5 4.5a.75.75 0 01.75-.75h2.5a.75.75 0 010 1.5h-2.5a.75.75 0 01-.75-.75zM5.5 8a.75.75 0 01.75-.75h5a.75.75 0 010 1.5h-5a.75.75 0 01-.75-.75zM5.5 11.5a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75zM9.5 15.25a.75.75 0 00-1.5 0v.5a.75.75 0 001.5 0v-.5z" /><path d="M12.75 4.25a.75.75 0 00-1.5 0v11.5a.75.75 0 001.5 0V4.25zM14.5 4.5a.75.75 0 01.75-.75h2.5a.75.75 0 010 1.5h-2.5a.75.75 0 01-.75-.75zM14.5 8a.75.75 0 01.75-.75h5a.75.75 0 010 1.5h-5a.75.75 0 01-.75-.75zM14.5 11.5a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75z" /></svg>;
const UndoIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.793 2.232a.75.75 0 01-.025 1.06L3.623 7.5H16.25a.75.75 0 010 1.5H3.623l4.145 4.208a.75.75 0 11-1.085 1.036l-5.5-5.25a.75.75 0 010-1.036l5.5-5.25a.75.75 0 011.06.025z" clipRule="evenodd" /></svg>;
const RedoIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.207 2.232a.75.75 0 00.025 1.06L16.377 7.5H3.75a.75.75 0 000 1.5h12.627l-4.145 4.208a.75.75 0 101.085 1.036l5.5-5.25a.75.75 0 000-1.036l5.5-5.25a.75.75 0 00-1.06.025z" clipRule="evenodd" /></svg>;
const PointerIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10.22 3.22a.75.75 0 011.06 0l1.75 1.75a.75.75 0 01-1.06 1.06L10.5 4.56v9.94a.75.75 0 01-1.5 0V4.56L7.53 6.03a.75.75 0 01-1.06-1.06l3.25-3.25z" /><path d="M4.53 9.03a.75.75 0 010-1.06l3.25-3.25a.75.75 0 011.06 1.06L7.56 7.5h4.88l-1.28-1.28a.75.75 0 111.06-1.06l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 11-1.06-1.06l1.28-1.28H7.56l1.28 1.28a.75.75 0 01-1.06 1.06L4.53 9.03z" /></svg>;
const HandPanIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 3zM6.75 6.75a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5a.75.75 0 01-.75-.75zM9.5 9.75a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5zm1.5 0a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5a.75.75 0 01.75-.75zm2.5.75a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5zM6.5 9.75a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 016.5 9.75z" /></svg>;
const ConnectorIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M7.75 2.75a.75.75 0 00-1.5 0v1.258a32.987 32.987 0 00-3.599.278.75.75 0 10.198 1.487A31.545 31.545 0 018.5 5.513V14.5a2.5 2.5 0 005 0V5.513a31.545 31.545 0 014.151-.238.75.75 0 10.198-1.487 32.987 32.987 0 00-3.599-.278V2.75a.75.75 0 00-1.5 0zM4.25 15.5a1 1 0 100-2 1 1 0 000 2zM15.75 13.5a1 1 0 100 2 1 1 0 000-2z" /></svg>;
const AlignTopIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18" /><rect x="6" y="9" width="4" height="6" strokeWidth="1.5" /><rect x="14" y="9" width="4" height="10" strokeWidth="1.5" /></svg>;
const AlignMiddleIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18" /><rect x="6" y="9" width="4" height="6" strokeWidth="1.5" /><rect x="14" y="7" width="4" height="10" strokeWidth="1.5" /></svg>;
const AlignBottomIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 19.5h18" /><rect x="6" y="9" width="4" height="6" strokeWidth="1.5" /><rect x="14" y="5.5" width="4" height="10" strokeWidth="1.5" /></svg>;
const AlignLeftIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 3v18" /><rect x="9" y="6" width="6" height="4" strokeWidth="1.5" /><rect x="9" y="14" width="10" height="4" strokeWidth="1.5" /></svg>;
const AlignCenterIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18" /><rect x="9" y="6" width="6" height="4" strokeWidth="1.5" /><rect x="7" y="14" width="10" height="4" strokeWidth="1.5" /></svg>;
const AlignRightIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 3v18" /><rect x="9" y="6" width="6" height="4" strokeWidth="1.5" /><rect x="5.5" y="14" width="10" height="4" strokeWidth="1.5" /></svg>;
const DistributeHorizontalIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5M3.75 6.75h16.5M3.75 17.25h16.5" /></svg>;
const DistributeVerticalIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75v16.5M6.75 3.75v16.5M17.25 3.75v16.5" /></svg>;

const FONT_FAMILIES = ['Segoe UI', 'Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana'];

const THEMES: Record<string, DiagramTheme> = {
    holographic: {
        node: { backgroundColor: 'rgba(14, 24, 45, 0.7)', borderColor: '#22d3ee', borderWidth: 2, color: '#e5e7eb', fontFamily: 'Segoe UI', opacity: 1, shadow: true },
        edge: { stroke: '#a855f7', labelColor: '#d1d5db' },
        canvas: { backgroundColor: '#0A0F1E', gridColor: 'rgba(59, 130, 246, 0.07)' }
    },
    professional: {
        node: { backgroundColor: '#ffffff', borderColor: '#4b5563', borderWidth: 2, color: '#1f2937', fontFamily: 'Arial', opacity: 1, shadow: false },
        edge: { stroke: '#6b7280', labelColor: '#374151' },
        canvas: { backgroundColor: '#f3f4f6', gridColor: 'rgba(209, 213, 219, 0.5)' }
    },
    neon: {
        node: { backgroundColor: '#111827', borderColor: '#ff00ff', borderWidth: 3, color: '#00ffff', fontFamily: 'Courier New', opacity: 1, shadow: true },
        edge: { stroke: '#ffff00', labelColor: '#00ff00' },
        canvas: { backgroundColor: '#000000', gridColor: 'rgba(255, 0, 255, 0.1)' }
    }
};

const useHistory = (initialState: DiagramState) => {
    const [history, setHistory] = useState<DiagramState[]>([initialState]);
    const [index, setIndex] = useState(0);

    const setState = (action: React.SetStateAction<DiagramState>, overwrite = false) => {
        const newState = typeof action === 'function' ? action(history[index]) : action;
        if (overwrite) {
            const historyCopy = [...history];
            historyCopy[index] = newState;
            setHistory(historyCopy);
        } else {
            const updatedHistory = history.slice(0, index + 1);
            setHistory([...updatedHistory, newState]);
            setIndex(updatedHistory.length);
        }
    };
    
    const undo = () => {
        if (index > 0) setIndex(prev => prev - 1);
    };
    const redo = () => {
        if (index < history.length - 1) setIndex(prev => prev + 1);
    };

    return [history[index], setState, undo, redo, index > 0, index < history.length - 1] as const;
};

const getClosestPort = (fromPoint: {x: number, y: number}, toNode: DiagramNode) => {
    const { position, size } = toNode;
    const ports = [
        { x: position.x + size.width / 2, y: position.y, index: 0 },
        { x: position.x + size.width, y: position.y + size.height / 2, index: 1 },
        { x: position.x + size.width / 2, y: position.y + size.height, index: 2 },
        { x: position.x, y: position.y + size.height / 2, index: 3 },
    ];

    let closestPort = ports[0];
    let minDistance = Infinity;

    ports.forEach(port => {
        const dist = Math.sqrt(Math.pow(port.x - fromPoint.x, 2) + Math.pow(port.y - fromPoint.y, 2));
        if (dist < minDistance) {
            minDistance = dist;
            closestPort = port;
        }
    });
    return closestPort;
};

const getEdgePath = (sourceNode: DiagramNode, targetNode: DiagramNode) => {
    const sourceCenter = { x: sourceNode.position.x + sourceNode.size.width / 2, y: sourceNode.position.y + sourceNode.size.height / 2 };
    const targetCenter = { x: targetNode.position.x + targetNode.size.width / 2, y: targetNode.position.y + targetNode.size.height / 2 };
    const sourcePort = getClosestPort(targetCenter, sourceNode);
    const targetPort = getClosestPort(sourceCenter, targetNode);
    const dx = targetPort.x - sourcePort.x;
    const dy = targetPort.y - sourcePort.y;
    const c1 = { x: sourcePort.x, y: sourcePort.y };
    const c2 = { x: targetPort.x, y: targetPort.y };

    if (sourcePort.index === 0) c1.y -= dy * 0.4;
    else if (sourcePort.index === 2) c1.y += dy * 0.4;
    else if (sourcePort.index === 1) c1.x += dx * 0.4;
    else if (sourcePort.index === 3) c1.x -= dx * 0.4;

    if (targetPort.index === 0) c2.y += dy * 0.4;
    else if (targetPort.index === 2) c2.y -= dy * 0.4;
    else if (targetPort.index === 1) c2.x -= dx * 0.4;
    else if (targetPort.index === 3) c2.x += dx * 0.4;

    return `M ${sourcePort.x} ${sourcePort.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${targetPort.x} ${targetPort.y}`;
};

const ICONS: Record<string, IconType> = {
    datastore: CylinderIcon,
    cloud: CloudIcon,
    user: UserIcon,
    server: ServerIcon,
    document: DocumentIcon,
    process: HexagonIcon,
    database: DatabaseIcon,
    folder: FolderIcon,
};

const ASSET_PALETTE_ITEMS = [
    { name: 'Rectangle', type: 'rectangle' as const, icon: RectangleIcon, nodeIcon: null, label: 'Generic Box' },
    { name: 'Ellipse', type: 'ellipse' as const, icon: EllipseIcon, nodeIcon: null, label: 'Start / End' },
    { name: 'Decision', type: 'diamond' as const, icon: DiamondIcon, nodeIcon: null, label: 'Decision' },
    { name: 'Process', type: 'rectangle' as const, icon: HexagonIcon, nodeIcon: 'process', label: 'Process' },
    { name: 'Text', type: 'text' as const, icon: TextIcon, nodeIcon: null, label: 'Annotation Text' },
    { name: 'Person', type: 'rectangle' as const, icon: UserIcon, nodeIcon: 'user', label: 'Name\nTitle' },
    { name: 'Data Store', type: 'rectangle' as const, icon: CylinderIcon, nodeIcon: 'datastore', label: 'Data Store' },
    { name: 'Folder', type: 'rectangle' as const, icon: FolderIcon, nodeIcon: 'folder', label: 'Folder' },
    { name: 'Server', type: 'rectangle' as const, icon: ServerIcon, nodeIcon: 'server', label: 'Server' },
    { name: 'Cloud', type: 'rectangle' as const, icon: CloudIcon, nodeIcon: 'cloud', label: 'Cloud Service' },
];

const lightenDarkenColor = (col: string, amt: number) => {
    let usePound = false;
    if (col[0] === "#") {
        col = col.slice(1);
        usePound = true;
    }
    const num = parseInt(col, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255;
    else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
};

type Tool = 'select' | 'pan' | 'connect';

interface DiagrammingMatrixViewProps {
    onNavigate: (viewKey: ViewKey) => void;
}

export const DiagrammingMatrixView: React.FC<DiagrammingMatrixViewProps> = ({ onNavigate }) => {
    const [state, setState, undo, redo, canUndo, canRedo] = useHistory({ nodes: [], edges: [] });
    const { nodes, edges } = state || { nodes: [], edges: [] };
    const [selectedElements, setSelectedElements] = useState<Set<string>>(new Set());
    const [perspective, setPerspective] = useState<'2d' | 'iso'>('2d');
    const [theme, setTheme] = useState<keyof typeof THEMES>('holographic');
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [activeTool, setActiveTool] = useState<Tool>('select');
    const [interactionState, setInteractionState] = useState<{ type: string, data: any } | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isPresentationMode, setIsPresentationMode] = useState(false);
    const [aiPrompt, setAIPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAIError] = useState<string | null>(null);
    const [showInitialPicker, setShowInitialPicker] = useState(true);
    const [isAIPanelMinimized, setIsAIPanelMinimized] = useState(false);
    const [marquee, setMarquee] = useState<{x: number, y: number, width: number, height: number} | null>(null);

    const svgRef = useRef<SVGSVGElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    
    const selectedNode = useMemo(() => {
        if (selectedElements.size !== 1) return undefined;
        const selectedId = selectedElements.values().next().value;
        return nodes.find(n => n.id === selectedId);
    }, [nodes, selectedElements]);

    const selectedEdge = useMemo(() => {
        if (selectedElements.size !== 1) return undefined;
        const selectedId = selectedElements.values().next().value;
        return edges.find(e => e.id === selectedId);
    }, [edges, selectedElements]);
    
    const getPointInSvg = useCallback((clientX: number, clientY: number) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const pt = svgRef.current.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const screenCTM = svgRef.current.getScreenCTM();
        if (screenCTM) return pt.matrixTransform(screenCTM.inverse());
        return pt;
    }, []);

    const handleGoHome = () => {
        if (nodes.length > 0) {
            if (window.confirm("This will clear your current diagram. Are you sure you want to return to the start screen?")) {
                setState({ nodes: [], edges: [] }, true); // Overwrite history
                setSelectedElements(new Set());
                setShowInitialPicker(true);
            }
        } else {
            setShowInitialPicker(true);
        }
    };

    const handleWindowMouseMove = useCallback((e: MouseEvent) => {
        if (!interactionState) return;
        const currentMousePos = getPointInSvg(e.clientX, e.clientY);
        const currentPosOnCanvas = { x: (currentMousePos.x - pan.x) / zoom, y: (currentMousePos.y - pan.y) / zoom };
        setMousePosition(currentPosOnCanvas);

        switch (interactionState.type) {
            case 'pan': {
                const { panStart } = interactionState.data;
                const dx = e.clientX - panStart.x;
                const dy = e.clientY - panStart.y;
                setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                setInteractionState({ type: 'pan', data: { panStart: { x: e.clientX, y: e.clientY } } });
                break;
            }
            case 'drag': {
                const { startMouseOnCanvas, originalNodePositions } = interactionState.data;
                const dx = currentPosOnCanvas.x - startMouseOnCanvas.x;
                const dy = currentPosOnCanvas.y - startMouseOnCanvas.y;
                let newNodes = [...nodes];
                
                originalNodePositions.forEach(({id, position}: {id: string, position: {x:number, y:number}}) => {
                    const index = newNodes.findIndex(n => n.id === id);
                    if (index !== -1) {
                        let newX = position.x + dx;
                        let newY = position.y + dy;
                        // Snap to grid
                        const gridSize = 15;
                        newX = Math.round(newX / gridSize) * gridSize;
                        newY = Math.round(newY / gridSize) * gridSize;
                        newNodes[index] = { ...newNodes[index], position: { x: newX, y: newY } };
                    }
                });
                setState({ nodes: newNodes, edges }, true);
                break;
            }
            case 'marquee': {
                setMarquee(prev => {
                    if (!prev) return null;
                    const { startX, startY } = interactionState.data;
                    const x = Math.min(startX, currentPosOnCanvas.x);
                    const y = Math.min(startY, currentPosOnCanvas.y);
                    const width = Math.abs(currentPosOnCanvas.x - startX);
                    const height = Math.abs(currentPosOnCanvas.y - startY);
                    return { x, y, width, height };
                });
                break;
            }
            case 'resize': {
                const { id, handle, startPos, startSize } = interactionState.data;
                const dx = currentPosOnCanvas.x - startPos.x;
                const dy = currentPosOnCanvas.y - startPos.y;
                setState(prev => ({...prev, nodes: prev.nodes.map(n => {
                    if(n.id !== id) return n;
                    let newWidth = startSize.width; let newHeight = startSize.height;
                    let newX = n.position.x; let newY = n.position.y;
                    if(handle.includes('e')) newWidth = Math.max(20, startSize.width + dx);
                    if(handle.includes('s')) newHeight = Math.max(20, startSize.height + dy);
                    if(handle.includes('w')) { newWidth = Math.max(20, startSize.width - dx); if(newWidth > 20) newX = startPos.x + dx; }
                    if(handle.includes('n')) { newHeight = Math.max(20, startSize.height - dy); if(newHeight > 20) newY = startPos.y + dy; }
                    return {...n, position: {x: newX, y: newY}, size: {width: newWidth, height: newHeight}};
                })}), true);
                break;
            }
        }
    }, [interactionState, getPointInSvg, pan.x, pan.y, zoom, setState, nodes, edges]);
    
    const handleWindowMouseUp = useCallback((e: MouseEvent) => {
        if (interactionState?.type === 'connect') {
            const { sourceId } = interactionState.data;
            const target = (e.target as SVGElement)?.closest('[data-node-id]');
            const targetId = target?.getAttribute('data-node-id');
            if (targetId && sourceId !== targetId) {
                const newEdge: DiagramEdge = {
                    id: `edge-${Date.now()}`, source: sourceId, target: targetId, label: '',
                    style: { stroke: THEMES[theme].edge.stroke, strokeWidth: 2, arrowHead: 'arrow' },
                };
                setState(prev => ({...prev, edges: [...prev.edges, newEdge]}));
            }
        } else if (interactionState?.type === 'drag' || interactionState?.type === 'resize') {
            const finalState = {nodes, edges};
            setState(finalState);
        } else if (interactionState?.type === 'marquee' && marquee) {
            const nodesInMarquee = nodes.filter(n => {
                const nodeRect = {
                    x: n.position.x, y: n.position.y,
                    width: n.size.width, height: n.size.height,
                };
                return (
                    marquee.x < nodeRect.x + nodeRect.width &&
                    marquee.x + marquee.width > nodeRect.x &&
                    marquee.y < nodeRect.y + nodeRect.height &&
                    marquee.y + marquee.height > nodeRect.y
                );
            });
            setSelectedElements(new Set(nodesInMarquee.map(n => n.id)));
            setMarquee(null);
        }
        setInteractionState(null);
    }, [interactionState, theme, setState, nodes, edges, marquee]);

    useEffect(() => {
        if (interactionState) {
            window.addEventListener('mousemove', handleWindowMouseMove);
            window.addEventListener('mouseup', handleWindowMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleWindowMouseMove);
                window.removeEventListener('mouseup', handleWindowMouseUp);
            };
        }
    }, [interactionState, handleWindowMouseMove, handleWindowMouseUp]);
    
    const handleCanvasMouseDown = (e: ReactMouseEvent<SVGSVGElement>) => {
        if (e.target !== e.currentTarget) return;
        if (activeTool === 'pan') {
            setInteractionState({ type: 'pan', data: { panStart: { x: e.clientX, y: e.clientY } } });
        } else if (activeTool === 'select') {
             const startPos = getPointInSvg(e.clientX, e.clientY);
             const startX = (startPos.x - pan.x) / zoom;
             const startY = (startPos.y - pan.y) / zoom;
             setMarquee({ x: startX, y: startY, width: 0, height: 0 });
             setInteractionState({ type: 'marquee', data: { startX, startY } });
             setSelectedElements(new Set());
        }
    };

    const handleWheel = (e: WheelEvent) => {
        e.preventDefault(); if (!svgRef.current) return;
        const scaleAmount = 0.1; const oldZoom = zoom;
        const newZoom = e.deltaY > 0 ? oldZoom * (1 - scaleAmount) : oldZoom * (1 + scaleAmount);
        const clampedZoom = Math.max(0.1, Math.min(3, newZoom));
        const svgPoint = getPointInSvg(e.clientX, e.clientY);
        const newPanX = svgPoint.x - (svgPoint.x - pan.x) * (clampedZoom / oldZoom);
        const newPanY = svgPoint.y - (svgPoint.y - pan.y) * (clampedZoom / oldZoom);
        setZoom(clampedZoom); setPan({ x: newPanX, y: newPanY });
    };

    const zoomCommon = (factor: number) => {
        if (!svgRef.current) return;
        const oldZoom = zoom;
        const newZoom = oldZoom * factor;
        const clampedZoom = Math.max(0.1, Math.min(3, newZoom));
        const { width, height } = svgRef.current.getBoundingClientRect();
        const svgPoint = getPointInSvg(width / 2, height / 2);
        
        const newPanX = svgPoint.x - (svgPoint.x - pan.x) * (clampedZoom / oldZoom);
        const newPanY = svgPoint.y - (svgPoint.y - pan.y) * (clampedZoom / oldZoom);
        
        setZoom(clampedZoom);
        setPan({ x: newPanX, y: newPanY });
    };

    const zoomToFit = useCallback(() => {
        if (nodes.length === 0 || !canvasContainerRef.current) return;
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodes.forEach(node => {
            minX = Math.min(minX, node.position.x);
            minY = Math.min(minY, node.position.y);
            maxX = Math.max(maxX, node.position.x + node.size.width);
            maxY = Math.max(maxY, node.position.y + node.size.height);
        });

        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        if (contentWidth <= 0 || contentHeight <= 0) return;

        const { width: viewWidth, height: viewHeight } = canvasContainerRef.current.getBoundingClientRect();
        const padding = 50;

        const newZoom = Math.min(
            (viewWidth - padding * 2) / contentWidth,
            (viewHeight - padding * 2) / contentHeight,
            1.5
        );
        
        const newPanX = (viewWidth / 2) - ((minX + contentWidth / 2) * newZoom);
        const newPanY = (viewHeight / 2) - ((minY + contentHeight / 2) * newZoom);

        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
    }, [nodes]);
    
    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('application/diagram-node-type') as DiagramNode['type'];
        const label = e.dataTransfer.getData('application/diagram-node-label') || 'New Node';
        const icon = e.dataTransfer.getData('application/diagram-node-icon') || null;

        if (type) {
            const transformedPt = getPointInSvg(e.clientX, e.clientY);
            const x = (transformedPt.x - pan.x) / zoom;
            const y = (transformedPt.y - pan.y) / zoom;
            const newNode: DiagramNode = {
                id: `node-${Date.now()}`, type,
                position: { x: x - 75, y: y - 37.5 },
                size: { width: 150, height: type === 'text' ? 50 : 75 },
                data: { label, style: { ...THEMES[theme].node, icon: icon, ...(type === 'text' && { backgroundColor: 'transparent', borderColor: 'transparent' }) } }
            };
            setState(prev => ({...prev, nodes: [...prev.nodes, newNode]}));
        }
    };

    const handleNodeMouseDown = (e: ReactMouseEvent, id: string) => {
        e.stopPropagation();
        if (activeTool === 'connect') {
            if (!interactionState) {
                const { x, y } = getPointInSvg(e.clientX, e.clientY);
                setInteractionState({ type: 'connect', data: { sourceId: id, x: (x - pan.x) / zoom, y: (y - pan.y) / zoom }});
            }
            return;
        }

        const isSelected = selectedElements.has(id);
        if (e.shiftKey) {
            setSelectedElements(prev => {
                const newSet = new Set(prev);
                if (isSelected) newSet.delete(id);
                else newSet.add(id);
                return newSet;
            });
        } else if (!isSelected) {
            setSelectedElements(new Set([id]));
        }

        const startMouseOnCanvas = { x: (getPointInSvg(e.clientX, e.clientY).x - pan.x) / zoom, y: (getPointInSvg(e.clientX, e.clientY).y - pan.y) / zoom };
        const originalNodePositions = nodes.filter(n => selectedElements.has(n.id) || n.id === id).map(n => ({ id: n.id, position: n.position }));
        setInteractionState({ type: 'drag', data: { startMouseOnCanvas, originalNodePositions } });
    };
    
    const handleResizeHandleMouseDown = (e: ReactMouseEvent, id: string, handle: string) => {
        e.stopPropagation(); const node = nodes.find(n => n.id === id); if(!node) return;
        const startPos = { x: (getPointInSvg(e.clientX, e.clientY).x - pan.x) / zoom, y: (getPointInSvg(e.clientX, e.clientY).y - pan.y) / zoom };
        setInteractionState({ type: 'resize', data: { id, handle, startPos, startSize: node.size } });
    };

    const handleNodeConnectStart = (e: ReactMouseEvent, sourceId: string) => {
        e.stopPropagation();
        const { x, y } = getPointInSvg(e.clientX, e.clientY);
        setInteractionState({ type: 'connect', data: { sourceId, x: (x - pan.x) / zoom, y: (y - pan.y) / zoom } });
    };
    
    const updateNodeStyle = (id: string, styleUpdate: Partial<DiagramNodeStyle>) => setState(prev => ({ ...prev, nodes: prev.nodes.map(n => n.id === id ? { ...n, data: { ...n.data, style: { ...n.data.style, ...styleUpdate } } } : n) }));
    const updateNodeData = (id: string, dataUpdate: Partial<DiagramNode['data']>) => setState(prev => ({ ...prev, nodes: prev.nodes.map(n => n.id === id ? { ...n, data: { ...n.data, ...dataUpdate } } : n) }));
    const updateEdgeStyle = (id: string, styleUpdate: Partial<DiagramEdge['style']>) => setState(prev => ({ ...prev, edges: prev.edges.map(e => e.id === id ? { ...e, style: { ...e.style, ...styleUpdate } } : e) }));
    const updateEdgeData = (id: string, dataUpdate: {label?: string}) => setState(prev => ({ ...prev, edges: prev.edges.map(e => e.id === id ? { ...e, label: dataUpdate.label } : e) }));

    const applyTheme = (themeName: keyof typeof THEMES) => {
        setTheme(themeName); const selectedTheme = THEMES[themeName];
        setState(prev => ({
            nodes: prev.nodes.map(n => ({ ...n, data: { ...n.data, style: { ...selectedTheme.node, ...n.data.style, fontFamily: selectedTheme.node.fontFamily, color: selectedTheme.node.color, backgroundColor: n.type === 'text' ? 'transparent' : selectedTheme.node.backgroundColor, borderColor: n.type === 'text' ? 'transparent' : selectedTheme.node.borderColor } } })),
            edges: prev.edges.map(e => ({ ...e, style: { ...e.style, stroke: selectedTheme.edge.stroke } }))
        }));
    };
    
    const handleDeleteElement = useCallback(() => {
        if (selectedElements.size === 0) return;
        setState(prev => ({
            nodes: prev.nodes.filter(n => !selectedElements.has(n.id)),
            edges: prev.edges.filter(e => !selectedElements.has(e.id) && !selectedElements.has(e.source) && !selectedElements.has(e.target)),
        }));
        setSelectedElements(new Set());
    }, [selectedElements, setState]);
    
    const handleClearCanvas = () => {
        if (window.confirm("Are you sure you want to clear the entire canvas? This action cannot be undone immediately from the history.")) {
            setState({ nodes: [], edges: [] });
            setSelectedElements(new Set());
        }
    };

    const handleAIGenerate = useCallback(async (prompt: string) => {
        if (!prompt) return; setIsGenerating(true); setAIError(null);
        try {
            const { nodes: aiNodes, edges: aiEdges } = await generateDiagramFromPrompt(prompt);
            const themedNodes = aiNodes.map(node => ({ ...node, data: { ...node.data, style: { ...THEMES[theme].node, ...(node.data.style || {}) } } }));
            const themedEdges = aiEdges.map(edge => ({ ...edge, style: { ...edge.style, stroke: THEMES[theme].edge.stroke, strokeWidth: 2, arrowHead: 'arrow' as const } }));
            setState({ nodes: themedNodes, edges: themedEdges });
            setAIPrompt('');
            setShowInitialPicker(false);
            setTimeout(() => zoomToFit(), 100);
        } catch (error: any) { setAIError(error.message || "An unknown error occurred."); } 
        finally { setIsGenerating(false); }
    }, [theme, zoomToFit, setState]);
    
    const exportAs = (format: 'svg' | 'png') => {
        if(!svgRef.current) return;
        const svgData = new XMLSerializer().serializeToString(svgRef.current);
        if (format === 'svg') {
            const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url; link.download = 'diagram.svg'; link.click();
            URL.revokeObjectURL(url);
        } else {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d'); if(!ctx) return;
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width * 2; canvas.height = img.height * 2;
                ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.drawImage(img, 0, 0);
                const pngUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = pngUrl; link.download = 'diagram.png'; link.click();
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        }
    };
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') { e.preventDefault(); undo(); }
                if (e.key === 'y' || (e.key === 'Z' && e.shiftKey)) { e.preventDefault(); redo(); }
            }
            if (e.key === 'Escape') setIsPresentationMode(false);
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElements.size > 0 && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
                handleDeleteElement();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedElements, handleDeleteElement, undo, redo]);
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && selectedNode) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                updateNodeStyle(selectedNode.id, { backgroundImage: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const alignNodes = useCallback((mode: 'left' | 'right' | 'center' | 'top' | 'middle' | 'bottom') => {
        const selNodes = nodes.filter(n => selectedElements.has(n.id));
        if (selNodes.length < 2) return;

        const boundingBox = selNodes.reduce((acc, node) => {
            acc.minX = Math.min(acc.minX, node.position.x);
            acc.minY = Math.min(acc.minY, node.position.y);
            acc.maxX = Math.max(acc.maxX, node.position.x + node.size.width);
            acc.maxY = Math.max(acc.maxY, node.position.y + node.size.height);
            return acc;
        }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

        const newNodes = nodes.map(node => {
            if (!selectedElements.has(node.id)) return node;
            const newNode = { ...node, position: { ...node.position } };
            switch (mode) {
                case 'left': newNode.position.x = boundingBox.minX; break;
                case 'right': newNode.position.x = boundingBox.maxX - node.size.width; break;
                case 'top': newNode.position.y = boundingBox.minY; break;
                case 'bottom': newNode.position.y = boundingBox.maxY - node.size.height; break;
                case 'center': newNode.position.x = boundingBox.minX + (boundingBox.maxX - boundingBox.minX) / 2 - node.size.width / 2; break;
                case 'middle': newNode.position.y = boundingBox.minY + (boundingBox.maxY - boundingBox.minY) / 2 - node.size.height / 2; break;
            }
            return newNode;
        });
        setState(prev => ({ ...prev, nodes: newNodes }));
    }, [nodes, selectedElements, setState]);
    
    const distributeNodes = useCallback((mode: 'horizontal' | 'vertical') => {
        const selNodes = nodes.filter(n => selectedElements.has(n.id));
        if (selNodes.length < 3) return;
        
        const newNodes = [...nodes];
        
        if (mode === 'horizontal') {
            selNodes.sort((a, b) => a.position.x - b.position.x);
            const totalWidth = selNodes.reduce((sum, n) => sum + n.size.width, 0);
            const span = selNodes[selNodes.length - 1].position.x + selNodes[selNodes.length - 1].size.width - selNodes[0].position.x;
            const gap = (span - totalWidth) / (selNodes.length - 1);
            let currentX = selNodes[0].position.x + selNodes[0].size.width + gap;
            for (let i = 1; i < selNodes.length - 1; i++) {
                const nodeIndex = newNodes.findIndex(n => n.id === selNodes[i].id);
                if (nodeIndex !== -1) {
                    newNodes[nodeIndex] = { ...newNodes[nodeIndex], position: { ...newNodes[nodeIndex].position, x: currentX } };
                    currentX += newNodes[nodeIndex].size.width + gap;
                }
            }
        } else { // vertical
            selNodes.sort((a, b) => a.position.y - b.position.y);
            const totalHeight = selNodes.reduce((sum, n) => sum + n.size.height, 0);
            const span = selNodes[selNodes.length - 1].position.y + selNodes[selNodes.length - 1].size.height - selNodes[0].position.y;
            const gap = (span - totalHeight) / (selNodes.length - 1);
            let currentY = selNodes[0].position.y + selNodes[0].size.height + gap;
            for (let i = 1; i < selNodes.length - 1; i++) {
                const nodeIndex = newNodes.findIndex(n => n.id === selNodes[i].id);
                if (nodeIndex !== -1) {
                    newNodes[nodeIndex] = { ...newNodes[nodeIndex], position: { ...newNodes[nodeIndex].position, y: currentY } };
                    currentY += newNodes[nodeIndex].size.height + gap;
                }
            }
        }
        setState(prev => ({ ...prev, nodes: newNodes }));
    }, [nodes, selectedElements, setState]);

    const renderNode = (node: DiagramNode) => {
        const { id, type, size, data } = node;
        const style = data.style || {};
        const NodeIcon = style.icon ? ICONS[style.icon] : null;
        const isSelected = selectedElements.has(id);
        const ports = [ { x: size.width / 2, y: 0 }, { x: size.width, y: size.height / 2 }, { x: size.width / 2, y: size.height }, { x: 0, y: size.height / 2 } ];
        
        const depth = 8;
        const isoXOffset = perspective === 'iso' ? depth * 0.866 : 0;
        const isoYOffset = perspective === 'iso' ? depth * 0.5 : 0;

        const baseProps = {
            width: size.width, height: size.height,
            stroke: style.borderColor, strokeWidth: style.borderWidth,
        };

        const renderShape = (isShadow: boolean) => {
            const fillColor = isShadow ? lightenDarkenColor(style.backgroundColor ?? '#000000', -40) : style.backgroundColor;
            const shapeProps = { ...baseProps, fill: fillColor, stroke: isShadow ? lightenDarkenColor(style.borderColor ?? '#000000', -40) : style.borderColor };
            
            if (type === 'rectangle' || type === 'text') return <rect {...shapeProps} rx="4" />;
            if (type === 'ellipse') return <ellipse cx={size.width/2} cy={size.height/2} rx={size.width/2} ry={size.height/2} {...shapeProps} />;
            if (type === 'diamond') return <polygon points={`${size.width/2},0 ${size.width},${size.height/2} ${size.width/2},${size.height} 0,${size.height/2}`} {...shapeProps} />;
            return null;
        }

        return (
            <g key={id} data-node-id={id} transform={`translate(${node.position.x}, ${node.position.y})`} className={`diagram-node ${isSelected ? 'selected' : ''}`} onMouseDown={e => handleNodeMouseDown(e, id)} style={{opacity: style.opacity ?? 1, cursor: activeTool === 'connect' ? 'crosshair' : 'move' }}>
                {perspective === 'iso' && <g transform={`translate(${isoXOffset}, ${isoYOffset})`}>{renderShape(true)}</g>}
                {renderShape(false)}
                {style.backgroundImage && <image href={style.backgroundImage} x="0" y="0" width={size.width} height={size.height} preserveAspectRatio="xMidYMid slice" />}
                <foreignObject x="5" y="5" width={size.width - 10} height={size.height - 10}>
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: style.color, fontFamily: style.fontFamily, fontSize: style.fontSize, wordBreak: 'break-word', lineHeight: 1.2, padding: '2px',}}>
                       {NodeIcon && <NodeIcon className="w-6 h-6 mb-1" />}
                       <span style={{ whiteSpace: 'pre-wrap' }}>{data.label}</span>
                    </div>
                </foreignObject>
                {!isPresentationMode && activeTool === 'select' && ports.map((port, index) => <circle key={index} className="connection-port" cx={port.x} cy={port.y} r="6" onMouseDown={e => handleNodeConnectStart(e, id)} />)}
                {isSelected && !isPresentationMode && activeTool === 'select' && <>
                    <rect className="resize-handle" x={-4} y={-4} width="8" height="8" style={{cursor: 'nwse-resize'}} onMouseDown={e => handleResizeHandleMouseDown(e, id, 'nw')} />
                    <rect className="resize-handle" x={size.width - 4} y={-4} width="8" height="8" style={{cursor: 'nesw-resize'}} onMouseDown={e => handleResizeHandleMouseDown(e, id, 'ne')} />
                    <rect className="resize-handle" x={-4} y={size.height - 4} width="8" height="8" style={{cursor: 'nesw-resize'}} onMouseDown={e => handleResizeHandleMouseDown(e, id, 'sw')} />
                    <rect className="resize-handle" x={size.width - 4} y={size.height - 4} width="8" height="8" style={{cursor: 'nwse-resize'}} onMouseDown={e => handleResizeHandleMouseDown(e, id, 'se')} />
                </>}
            </g>
        )
    }

    const generateTemplate = (type: 'flowchart' | 'orgchart' | 'workflow') => {
        const defaultStyle = THEMES[theme].node;
        const edgeStyle = { stroke: THEMES[theme].edge.stroke, strokeWidth: 2, arrowHead: 'arrow' as const };
        let template: { nodes: DiagramNode[], edges: DiagramEdge[] };

        if (type === 'flowchart') {
            template = {
                nodes: [
                    { id: 'start', type: 'ellipse', position: { x: 325, y: 50 }, size: { width: 150, height: 75 }, data: { label: 'Start', style: { ...defaultStyle, backgroundColor: '#166534', borderColor: '#22c55e' } } },
                    { id: 'process1', type: 'rectangle', position: { x: 325, y: 175 }, size: { width: 150, height: 75 }, data: { label: 'Process Step 1', style: { ...defaultStyle, backgroundColor: '#1e40af', borderColor: '#60a5fa' } } },
                    { id: 'decision1', type: 'diamond', position: { x: 325, y: 300 }, size: { width: 150, height: 75 }, data: { label: 'Is Condition True?', style: { ...defaultStyle, backgroundColor: '#b45309', borderColor: '#f59e0b' } } },
                    { id: 'process2', type: 'rectangle', position: { x: 525, y: 425 }, size: { width: 150, height: 75 }, data: { label: 'Process "Yes"', style: { ...defaultStyle, backgroundColor: '#1e40af', borderColor: '#60a5fa' } } },
                    { id: 'end', type: 'ellipse', position: { x: 325, y: 550 }, size: { width: 150, height: 75 }, data: { label: 'End', style: { ...defaultStyle, backgroundColor: '#166534', borderColor: '#22c55e' } } },
                ],
                edges: [
                    { id: 'e1', source: 'start', target: 'process1', style: edgeStyle }, { id: 'e2', source: 'process1', target: 'decision1', style: edgeStyle },
                    { id: 'e3', source: 'decision1', target: 'process2', style: edgeStyle, label: 'Yes' }, { id: 'e4', source: 'decision1', target: 'end', style: { ...edgeStyle, strokeDasharray: '8 4' }, label: 'No' },
                    { id: 'e5', source: 'process2', target: 'end', style: edgeStyle },
                ]
            };
        } else if (type === 'orgchart') {
            const orgNodeStyle = { ...THEMES.professional.node, icon: 'user' };
            const orgEdgeStyle = { ...THEMES.professional.edge, strokeWidth: 2, arrowHead: 'none' as const };
            template = {
                nodes: [
                    { id: 'ceo', type: 'rectangle', position: { x: 325, y: 50 }, size: { width: 150, height: 75 }, data: { label: 'CEO\nChief Executive', style: { ...orgNodeStyle, backgroundColor: '#dbeafe', borderColor: '#60a5fa' } } },
                    { id: 'vp1', type: 'rectangle', position: { x: 100, y: 200 }, size: { width: 150, height: 75 }, data: { label: 'VP Engineering\nTech Lead', style: { ...orgNodeStyle, backgroundColor: '#e0e7ff', borderColor: '#a78bfa' } } },
                    { id: 'vp2', type: 'rectangle', position: { x: 550, y: 200 }, size: { width: 150, height: 75 }, data: { label: 'VP Sales\nBusiness Lead', style: { ...orgNodeStyle, backgroundColor: '#d1fae5', borderColor: '#34d399' } } },
                    { id: 'mgr1', type: 'rectangle', position: { x: 100, y: 350 }, size: { width: 150, height: 75 }, data: { label: 'Eng. Manager\nTeam Lead', style: orgNodeStyle } },
                    { id: 'sales1', type: 'rectangle', position: { x: 550, y: 350 }, size: { width: 150, height: 75 }, data: { label: 'Sales Lead\nTeam Lead', style: orgNodeStyle } },
                ],
                edges: [
                    { id: 'e1', source: 'ceo', target: 'vp1', style: orgEdgeStyle }, { id: 'e2', source: 'ceo', target: 'vp2', style: orgEdgeStyle },
                    { id: 'e3', source: 'vp1', target: 'mgr1', style: orgEdgeStyle }, { id: 'e4', source: 'vp2', target: 'sales1', style: orgEdgeStyle },
                ]
            };
        } else { // workflow
            const workflowNodeStyle = { ...THEMES.holographic.node };
            const workflowEdgeStyle = { ...THEMES.holographic.edge, strokeWidth: 2, arrowHead: 'arrow' as const };
            template = {
                 nodes: [
                    { id: 'req', type: 'rectangle', position: { x: 50, y: 250 }, size: { width: 150, height: 75 }, data: { label: 'Client', style: { ...workflowNodeStyle, icon: 'user' } } },
                    { id: 'lb', type: 'rectangle', position: { x: 275, y: 250 }, size: { width: 150, height: 75 }, data: { label: 'Load Balancer', style: { ...workflowNodeStyle, icon: 'server' } } },
                    { id: 'web1', type: 'rectangle', position: { x: 500, y: 150 }, size: { width: 150, height: 75 }, data: { label: 'Web Server 1', style: { ...workflowNodeStyle, icon: 'server' } } },
                    { id: 'web2', type: 'rectangle', position: { x: 500, y: 350 }, size: { width: 150, height: 75 }, data: { label: 'Web Server 2', style: { ...workflowNodeStyle, icon: 'server' } } },
                    { id: 'db', type: 'rectangle', position: { x: 725, y: 250 }, size: { width: 150, height: 75 }, data: { label: 'Database', style: { ...workflowNodeStyle, icon: 'database' } } },
                ],
                edges: [
                    { id: 'e1', source: 'req', target: 'lb', style: workflowEdgeStyle },
                    { id: 'e2', source: 'lb', target: 'web1', style: workflowEdgeStyle },
                    { id: 'e3', source: 'lb', target: 'web2', style: workflowEdgeStyle },
                    { id: 'e4', source: 'web1', target: 'db', style: { ...workflowEdgeStyle, strokeDasharray: '8 4' } },
                    { id: 'e5', source: 'web2', target: 'db', style: { ...workflowEdgeStyle, strokeDasharray: '8 4' } },
                ]
            };
        }
        setState(template);
        setShowInitialPicker(false);
        setTimeout(() => zoomToFit(), 100);
    }
    
    if (showInitialPicker) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gray-900">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-sky-400 mb-2">Diagramming Matrix</h1>
                <p className="text-lg text-gray-400 mb-10">Choose a starting point or use AI to generate a diagram from a prompt.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl w-full mb-10">
                    {[
                        { title: 'Flowchart', desc: 'Map out processes and decisions.', icon: FlowchartIcon, type: 'flowchart' as const },
                        { title: 'Organization Chart', desc: 'Visualize team and company structure.', icon: OrgChartIcon, type: 'orgchart' as const },
                        { title: 'Cloud Workflow', desc: 'Design system architectures.', icon: WorkflowIcon, type: 'workflow' as const },
                        { title: 'Blank Canvas', desc: 'Start fresh with your own ideas.', icon: PlusIcon, type: 'blank' as const },
                    ].map(item => (
                        <button key={item.type} onClick={() => {
                            if (item.type === 'blank') {
                                setState({ nodes: [], edges: [] });
                            } else {
                                generateTemplate(item.type);
                            }
                            setShowInitialPicker(false);
                        }} className="welcome-widget group p-6 text-left flex flex-col">
                           <div className="widget-icon mb-4 text-cyan-400"><item.icon className="w-12 h-12" /></div>
                           <h2 className="text-xl font-bold text-gray-100 mb-2">{item.title}</h2>
                           <p className="text-gray-400 text-sm flex-grow">{item.desc}</p>
                           <div className="mt-4 text-right font-semibold text-purple-400 group-hover:text-white transition-colors duration-300">Start →</div>
                        </button>
                    ))}
                </div>
                <Panel className="w-full max-w-3xl">
                    <h2 className="text-xl font-semibold text-blue-300">AI Diagram Generator</h2>
                    <div className="flex items-end space-x-2 mt-2">
                        <textarea value={aiPrompt} onChange={e => setAIPrompt(e.target.value)} placeholder="e.g., A flowchart for user authentication" className="flex-1 p-2 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" rows={1} />
                        <button onClick={() => handleAIGenerate(aiPrompt)} disabled={isGenerating || !aiPrompt} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2 flex-shrink-0"><AIGenerateIcon className="w-5 h-5"/>{isGenerating ? 'Generating...' : 'Generate'}</button>
                    </div>
                </Panel>
            </div>
        );
    }
    
    // Main View
    return (
        <div className="flex w-full h-full text-white bg-gray-900">
            {!isPresentationMode && (
                 <div className="w-16 flex-shrink-0 bg-gray-900/50 flex flex-col items-center py-4 space-y-4 border-r border-gray-700/50">
                     {[
                         { tool: 'select' as Tool, icon: PointerIcon, name: 'Select / Move' },
                         { tool: 'pan' as Tool, icon: HandPanIcon, name: 'Pan Canvas' },
                         { tool: 'connect' as Tool, icon: ConnectorIcon, name: 'Create Connection' },
                     ].map(({ tool, icon: Icon, name }) => (
                         <button
                             key={tool}
                             onClick={() => setActiveTool(tool)}
                             title={name}
                             className={`p-3 rounded-lg transition-colors duration-200 ${activeTool === tool ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                         >
                             <Icon className="w-6 h-6" />
                         </button>
                     ))}
                 </div>
            )}
            {!isPresentationMode && (
                <Panel title="Assets" className="w-64 flex-shrink-0 mr-4">
                    <div className="grid grid-cols-2 gap-2">
                        {ASSET_PALETTE_ITEMS.map(item => (
                            <div key={item.name} draggable onDragStart={e => {
                                e.dataTransfer.setData('application/diagram-node-type', item.type);
                                e.dataTransfer.setData('application/diagram-node-label', item.label);
                                if (item.nodeIcon) {
                                    e.dataTransfer.setData('application/diagram-node-icon', item.nodeIcon);
                                }
                            }} className="asset-palette-item p-2 rounded-lg flex flex-col items-center justify-center cursor-grab" title={item.name}>
                               <item.icon className="w-10 h-8 text-cyan-400" />
                               <span className="text-xs text-center text-gray-400 mt-1">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </Panel>
            )}

            <div className="flex-grow flex flex-col min-w-0">
                 {!isPresentationMode && (
                    <Panel title="Toolbar" className="mb-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                             <div className="flex items-center space-x-2">
                                <button onClick={handleGoHome} className="p-2 bg-gray-700/50 hover:bg-gray-600 rounded-md" title="Back to Start Screen"><HomeIcon className="w-5 h-5"/></button>
                                <button onClick={undo} disabled={!canUndo} className="p-2 bg-gray-700/50 hover:bg-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed" title="Undo (Ctrl+Z)"><UndoIcon className="w-5 h-5" /></button>
                                <button onClick={redo} disabled={!canRedo} className="p-2 bg-gray-700/50 hover:bg-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed" title="Redo (Ctrl+Y)"><RedoIcon className="w-5 h-5" /></button>
                                <button onClick={handleClearCanvas} className="p-2 bg-gray-700/50 hover:bg-gray-600 rounded-md" title="Clear Canvas"><TrashIcon className="w-5 h-5 text-red-400" /></button>
                                <button onClick={() => setPerspective(p => p === '2d' ? 'iso' : '2d')} className="p-2 bg-gray-700/50 hover:bg-gray-600 rounded-md" title="Toggle Perspective"><PerspectiveIcon className="w-5 h-5" /></button>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => applyTheme('holographic')} className={`p-2 rounded-md ${theme === 'holographic' ? 'ring-2 ring-cyan-400' : 'bg-gray-700/50 hover:bg-gray-600'}`} title="Holographic"><ThemeIcon className="w-5 h-5 text-cyan-400" /></button>
                                <button onClick={() => applyTheme('professional')} className={`p-2 rounded-md ${theme === 'professional' ? 'ring-2 ring-gray-800' : 'bg-gray-700/50 hover:bg-gray-600'}`} title="Professional"><ThemeIcon className="w-5 h-5 text-gray-800" /></button>
                                <button onClick={() => applyTheme('neon')} className={`p-2 rounded-md ${theme === 'neon' ? 'ring-2 ring-fuchsia-400' : 'bg-gray-700/50 hover:bg-gray-600'}`} title="Neon"><ThemeIcon className="w-5 h-5 text-fuchsia-400" /></button>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => setIsPresentationMode(true)} className="p-2 bg-gray-700/50 hover:bg-gray-600 rounded-md" title="Presentation"><PresentIcon className="w-5 h-5" /></button>
                                <button onClick={() => exportAs('svg')} className="p-2 bg-gray-700/50 hover:bg-gray-600 rounded-md" title="Export SVG"><ExportIcon className="w-5 h-5" /></button>
                                <button onClick={() => exportAs('png')} className="p-2 bg-gray-700/50 hover:bg-gray-600 rounded-md" title="Export PNG"><ExportIcon className="w-5 h-5" /></button>
                            </div>
                        </div>
                    </Panel>
                 )}
                 <div ref={canvasContainerRef} className={`flex-grow relative border-2 border-gray-700 rounded-lg ${isPresentationMode ? 'fixed inset-0 z-[2000]' : 'overflow-hidden'}`} onWheel={handleWheel} onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
                    {selectedElements.size > 1 && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
                           <div className="alignment-toolbar">
                                <button onClick={() => alignNodes('left')} className="alignment-toolbar-button" title="Align Left"><AlignLeftIcon className="w-5 h-5"/></button>
                                <button onClick={() => alignNodes('center')} className="alignment-toolbar-button" title="Align Center"><AlignCenterIcon className="w-5 h-5"/></button>
                                <button onClick={() => alignNodes('right')} className="alignment-toolbar-button" title="Align Right"><AlignRightIcon className="w-5 h-5"/></button>
                                <div className="alignment-toolbar-separator"></div>
                                <button onClick={() => alignNodes('top')} className="alignment-toolbar-button" title="Align Top"><AlignTopIcon className="w-5 h-5"/></button>
                                <button onClick={() => alignNodes('middle')} className="alignment-toolbar-button" title="Align Middle"><AlignMiddleIcon className="w-5 h-5"/></button>
                                <button onClick={() => alignNodes('bottom')} className="alignment-toolbar-button" title="Align Bottom"><AlignBottomIcon className="w-5 h-5"/></button>
                                <div className="alignment-toolbar-separator"></div>
                                <button onClick={() => distributeNodes('horizontal')} disabled={selectedElements.size < 3} className="alignment-toolbar-button" title="Distribute Horizontally"><DistributeHorizontalIcon className="w-5 h-5"/></button>
                                <button onClick={() => distributeNodes('vertical')} disabled={selectedElements.size < 3} className="alignment-toolbar-button" title="Distribute Vertically"><DistributeVerticalIcon className="w-5 h-5"/></button>
                           </div>
                        </div>
                    )}
                    <svg ref={svgRef} className={`diagram-canvas w-full h-full ${activeTool === 'pan' && interactionState?.type === 'pan' ? 'grabbing' : ''} ${activeTool === 'select' ? 'select-mode' : ''}`} style={{'--grid-color': THEMES[theme].canvas.gridColor} as React.CSSProperties} onMouseDown={handleCanvasMouseDown}>
                        <defs>
                            <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                            <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#a855f7"><animate attributeName="stop-color" values="#a855f7;#22d3ee;#a855f7" dur="4s" repeatCount="indefinite" /></stop>
                                <stop offset="100%" stopColor="#22d3ee"><animate attributeName="stop-color" values="#22d3ee;#a855f7;#22d3ee" dur="4s" repeatCount="indefinite" /></stop>
                            </linearGradient>
                            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker>
                            <marker id="circle" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6"><circle cx="5" cy="5" r="3" fill="currentColor" /></marker>
                        </defs>
                        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                            {marquee && <rect x={marquee.x} y={marquee.y} width={marquee.width} height={marquee.height} className="marquee-selection" />}
                            {edges.map(edge => {
                                const sourceNode = nodes.find(n => n.id === edge.source);
                                const targetNode = nodes.find(n => n.id === edge.target);
                                if (!sourceNode || !targetNode) return null;
                                const path = getEdgePath(sourceNode, targetNode);
                                const midX = (sourceNode.position.x + sourceNode.size.width/2 + targetNode.position.x + targetNode.size.width/2) / 2;
                                const midY = (sourceNode.position.y + sourceNode.size.height/2 + targetNode.position.y + targetNode.size.height/2) / 2;
                                return (
                                    <g key={edge.id} className={`diagram-edge ${selectedElements.has(edge.id) ? 'selected' : ''}`} onClick={() => setSelectedElements(new Set([edge.id]))}>
                                        <path d={path} fill="none" stroke="url(#edge-gradient)" strokeWidth={edge.style?.strokeWidth || 2} strokeDasharray={edge.style?.strokeDasharray} markerEnd={edge.style?.arrowHead === 'arrow' ? 'url(#arrow)' : undefined} markerStart={edge.style?.arrowHead === 'circle' ? 'url(#circle)' : undefined} style={{color: edge.style?.stroke}} className="animated-edge" />
                                        {edge.label && <text x={midX} y={midY-5} textAnchor="middle" fill={THEMES[theme].edge.labelColor} fontSize="12">{edge.label}</text>}
                                    </g>
                                );
                            })}
                            <g>{nodes.map(node => renderNode(node))}</g>
                            {interactionState?.type === 'connect' && <line x1={interactionState.data.x} y1={interactionState.data.y} x2={mousePosition.x} y2={mousePosition.y} stroke="#0ea5e9" strokeWidth="2" strokeDasharray="5 5" />}
                        </g>
                    </svg>
                    {isPresentationMode && <button onClick={() => setIsPresentationMode(false)} className="exit-presentation-button"><ExitIcon className="w-6 h-6"/></button>}
                    {!isPresentationMode && (
                        <div className="diagram-controls">
                            <button onClick={() => zoomCommon(1.2)} title="Zoom In" className="diagram-zoom-button" disabled={zoom >= 3}><PlusIcon className="w-5 h-5"/></button>
                            <button onClick={() => zoomCommon(1 / 1.2)} title="Zoom Out" className="diagram-zoom-button" disabled={zoom <= 0.1}><MinusIcon className="w-5 h-5"/></button>
                            <button onClick={zoomToFit} title="Zoom to Fit" className="diagram-zoom-button" disabled={nodes.length === 0}><FitScreenIcon className="w-5 h-5"/></button>
                        </div>
                    )}
                 </div>
                {!isPresentationMode && (
                    <Panel>
                        <div className="flex justify-between items-center mb-2">
                           <h2 className="text-xl font-semibold text-blue-300">AI Diagram Generator</h2>
                           <button onClick={() => setIsAIPanelMinimized(!isAIPanelMinimized)} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700" title={isAIPanelMinimized ? "Expand" : "Minimize"}>
                               {isAIPanelMinimized ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronUpIcon className="w-5 h-5" />}
                           </button>
                        </div>
                        {!isAIPanelMinimized && (
                            <div className="pt-2 border-t border-gray-700/50">
                                <div className="flex items-end space-x-2">
                                    <textarea value={aiPrompt} onChange={e => { setAIPrompt(e.target.value); e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`; }} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAIGenerate(aiPrompt); } }} placeholder="e.g., A flowchart for user authentication" className="flex-1 p-2 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" rows={1} style={{ maxHeight: '120px' }} disabled={isGenerating} />
                                    <button onClick={() => handleAIGenerate(aiPrompt)} disabled={isGenerating || !aiPrompt} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2 flex-shrink-0"><AIGenerateIcon className="w-5 h-5"/>{isGenerating ? 'Generating...' : 'Generate'}</button>
                                </div>
                                {aiError && <p className="text-red-400 text-sm mt-2">{aiError}</p>}
                            </div>
                        )}
                    </Panel>
                )}
            </div>

            {!isPresentationMode && selectedElements.size > 0 && (
                <Panel title={selectedElements.size > 1 ? `${selectedElements.size} Items Selected` : (selectedNode ? 'Node Inspector' : 'Edge Inspector')} className="w-80 flex-shrink-0 ml-4 overflow-y-auto hide-scrollbar" onMouseDown={e => e.stopPropagation()}>
                    <div className="space-y-3">
                        {selectedNode && selectedElements.size === 1 && <>
                            <div><label className="text-xs text-gray-400">Label</label><textarea value={selectedNode.data.label} onChange={e => updateNodeData(selectedNode.id, { label: e.target.value })} className="w-full p-1 bg-gray-700 rounded text-sm resize-none" rows={3}/></div>
                            <div><label className="text-xs text-gray-400">Shape</label><select value={selectedNode.type} onChange={e => setState(prev => ({...prev, nodes: prev.nodes.map(n => n.id === selectedNode.id ? { ...n, type: e.target.value as DiagramNode['type'] } : n)}))} className="w-full p-1 bg-gray-700 rounded text-sm"><option value="rectangle">Rectangle</option><option value="ellipse">Ellipse</option><option value="diamond">Diamond</option><option value="text">Text</option></select></div>
                            <div><label className="text-xs text-gray-400">Font</label><select value={selectedNode.data.style.fontFamily} onChange={e => updateNodeStyle(selectedNode.id, { fontFamily: e.target.value })} className="w-full p-1 bg-gray-700 rounded text-sm"><option value="">Default</option>{FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                            <div className="grid grid-cols-2 gap-2"><div><label className="text-xs text-gray-400">Font Size</label><input type="number" value={selectedNode.data.style.fontSize} onChange={e => updateNodeStyle(selectedNode.id, { fontSize: parseInt(e.target.value) })} className="w-full p-1 bg-gray-700 rounded text-sm" /></div><div><label className="text-xs text-gray-400">Text Color</label><input type="color" value={selectedNode.data.style.color} onChange={e => updateNodeStyle(selectedNode.id, { color: e.target.value })} className="w-full p-0 h-8 bg-gray-700 rounded cursor-pointer" /></div></div>
                            <div className="grid grid-cols-2 gap-2"><div><label className="text-xs text-gray-400">Background</label><input type="color" value={selectedNode.data.style.backgroundColor} onChange={e => updateNodeStyle(selectedNode.id, { backgroundColor: e.target.value })} className="w-full p-0 h-8 bg-gray-700 rounded cursor-pointer" /></div><div><label className="text-xs text-gray-400">Border</label><input type="color" value={selectedNode.data.style.borderColor} onChange={e => updateNodeStyle(selectedNode.id, { borderColor: e.target.value })} className="w-full p-0 h-8 bg-gray-700 rounded cursor-pointer" /></div></div>
                            <div><label className="text-xs text-gray-400">Border Width</label><input type="range" value={selectedNode.data.style.borderWidth} onChange={e => updateNodeStyle(selectedNode.id, { borderWidth: parseInt(e.target.value) })} min="0" max="10" className="w-full" /></div>
                            <div><label className="text-xs text-gray-400">Opacity</label><input type="range" value={selectedNode.data.style.opacity} onChange={e => updateNodeStyle(selectedNode.id, { opacity: parseFloat(e.target.value) })} min="0" max="1" step="0.1" className="w-full" /></div>
                            <div><label className="text-xs text-gray-400">Icon</label><input type="text" value={selectedNode.data.style.icon} onChange={e => updateNodeStyle(selectedNode.id, { icon: e.target.value })} placeholder="e.g. database, cloud" className="w-full p-1 bg-gray-700 rounded text-sm" /></div>
                            <div><label className="text-xs text-gray-400">Background Image</label><input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" /><div className="flex gap-2 mt-1"><button onClick={() => imageInputRef.current?.click()} className="flex-1 p-1 bg-gray-600 hover:bg-gray-500 rounded text-sm text-center">Upload</button>{selectedNode.data.style.backgroundImage && (<button onClick={() => updateNodeStyle(selectedNode.id, { backgroundImage: '' })} className="flex-shrink-0 p-1 bg-red-600 hover:bg-red-500 rounded text-sm">Remove</button>)}</div></div>
                            <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-300"><input type="checkbox" checked={!!selectedNode.data.style.shadow} onChange={e => updateNodeStyle(selectedNode.id, { shadow: e.target.checked })} className="h-4 w-4 text-purple-500 bg-gray-600 rounded border-gray-500 focus:ring-purple-400"/><span>Enable Shadow</span></label>
                        </>}
                         {selectedEdge && selectedElements.size === 1 && <>
                            <div><label className="text-xs text-gray-400">Label</label><input type="text" value={selectedEdge.label} onChange={e => updateEdgeData(selectedEdge.id, { label: e.target.value })} className="w-full p-1 bg-gray-700 rounded text-sm" /></div>
                            <div className="grid grid-cols-2 gap-2"><div><label className="text-xs text-gray-400">Line Width</label><input type="number" value={selectedEdge.style?.strokeWidth || 2} onChange={e => updateEdgeStyle(selectedEdge.id, { strokeWidth: parseInt(e.target.value) })} min="1" max="10" className="w-full p-1 bg-gray-700 rounded text-sm" /></div><div><label className="text-xs text-gray-400">Line Color</label><input type="color" value={selectedEdge.style?.stroke} onChange={e => updateEdgeStyle(selectedEdge.id, { stroke: e.target.value })} className="w-full p-0 h-8 bg-gray-700 rounded cursor-pointer" /></div></div>
                            <div><label className="text-xs text-gray-400">Line Style</label><select value={selectedEdge.style?.strokeDasharray || ''} onChange={e => updateEdgeStyle(selectedEdge.id, { strokeDasharray: e.target.value })} className="w-full p-1 bg-gray-700 rounded text-sm"><option value="">Solid</option><option value="8 4">Dashed</option><option value="2 4">Dotted</option></select></div>
                            <div><label className="text-xs text-gray-400">Arrow Head</label><select value={selectedEdge.style?.arrowHead || 'none'} onChange={e => updateEdgeStyle(selectedEdge.id, { arrowHead: e.target.value as any })} className="w-full p-1 bg-gray-700 rounded text-sm"><option value="none">None</option><option value="arrow">Arrow</option><option value="circle">Circle</option></select></div>
                         </>}
                         <button onClick={handleDeleteElement} className="w-full mt-4 p-2 text-sm bg-red-600/80 hover:bg-red-600 text-white rounded-md flex items-center justify-center gap-2"><TrashIcon className="w-4 h-4"/> Delete Selected</button>
                    </div>
                </Panel>
            )}
        </div>
    );
};
