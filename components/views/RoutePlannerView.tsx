import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useDropzone, FileWithPath } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { AppContext } from '../../contexts/AppContext';
import { AppContextType, RouteResult, CountryInfo, RouteCalculation, BulkRouteResultItem, LatLngTuple, TravelMode } from '../../types';
import { Panel } from '../Panel';
import { RAW_COLOR_VALUES, COUNTRIES_DATA, AVERAGE_TRAVEL_SPEED_KMH, TRAVEL_MODES, HEURISTIC_TRAVEL_FACTORS } from '../../constants';
import { MapPin, Navigation, AlertTriangle, CheckCircle, Calculator, Route, Info, Download, UploadCloud, Trash2, Clock, PlusCircle, Brain, Play, ChevronDown, ChevronUp, Car, PersonStanding, Bike, Globe, Zap, TrendingUp, FileText, Settings, RefreshCw } from 'lucide-react';
import { geocodeAddressWithGemini, getRouteAnalysisForDisplay, analyzeTextWithGemini } from '../../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { exportRouteResultsToXLSX } from '../../services/DataProcessingService';

const MAX_ROUTES = 8;
const ROUTE_COLORS_KEYS = ['accent1', 'accent2', 'accent3', 'accent4', 'pink-500', 'cyan-400', 'amber-500', 'lime-500'];

const LoadingSpinner: React.FC<{ text?: string; size?: 'sm' | 'md' | 'lg' }> = ({ text, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };
  
  return (
    <div className="flex items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} border-4 border-t-transparent border-purple-500 rounded-full animate-spin`}></div>
      {text && <span className="text-purple-300 animate-pulse">{text}</span>}
    </div>
  );
};

const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  className?: string;
}> = ({ children, onClick, variant = 'primary', size = 'md', disabled, isLoading, leftIcon, className = '' }) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white focus:ring-blue-400',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-200 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-400',
    ghost: 'bg-transparent hover:bg-gray-700 text-gray-300 hover:text-white focus:ring-gray-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'} ${className}`}
    >
      {isLoading ? <LoadingSpinner size="sm" /> : leftIcon}
      {children}
    </button>
  );
};

const Input: React.FC<{
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}> = ({ type = 'text', value, onChange, placeholder, className = '', id }) => {
  return (
    <input
      type={type}
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full p-2 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600 transition-colors ${className}`}
    />
  );
};

export const RoutePlannerView: React.FC = () => {
  const { theme, reduceMotion } = useContext(AppContext) as AppContextType;
  
  const [routeCalculations, setRouteCalculations] = useState<RouteCalculation[]>(() => [
    { 
      id: `route-${Date.now()}`, 
      locationAInput: '', 
      locationBInput: '', 
      travelMode: 'DRIVING',
      result: null, 
      color: RAW_COLOR_VALUES[ROUTE_COLORS_KEYS[0]] || '#00D4FF',
      aiRouteAnalysis: null,
      isAiRouteAnalysisLoading: false,
    }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("ID"); 
  const [uploadedFile, setUploadedFile] = useState<FileWithPath | null>(null);
  const [bulkRouteResults, setBulkRouteResults] = useState<BulkRouteResultItem[]>([]);
  const [bulkFileProcessingError, setBulkFileProcessingError] = useState<string | null>(null);
  
  const [aiAnalysisInstruction, setAiAnalysisInstruction] = useState<string>('');
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [isAiAnalysisLoading, setIsAiAnalysisLoading] = useState<boolean>(false);

  // State for minimizing sections
  const [isManualInputMinimized, setIsManualInputMinimized] = useState<boolean>(false);
  const [isBulkProcessingMinimized, setIsBulkProcessingMinimized] = useState<boolean>(true);
  const [isGlobalAiAnalysisMinimized, setIsGlobalAiAnalysisMinimized] = useState<boolean>(true);
  const [isAdvancedSettingsMinimized, setIsAdvancedSettingsMinimized] = useState<boolean>(true);

  // Advanced settings
  const [customSpeedKmh, setCustomSpeedKmh] = useState<number>(AVERAGE_TRAVEL_SPEED_KMH);
  const [includeTrafficFactor, setIncludeTrafficFactor] = useState<boolean>(true);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);

  const parseCoordinates = (input: string): LatLngTuple | null => {
    const parts = input.split(',').map(part => part.trim());
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lon = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        return [lat, lon];
      }
    }
    return null;
  };

  const degreesToRadians = (degrees: number): number => degrees * Math.PI / 180;

  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; 
    const dLat = degreesToRadians(lat2 - lat1);
    const dLon = degreesToRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
  };

  const formatDuration = (hours: number): string => {
    if (hours < 0) return "N/A";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    let parts = [];
    if (h > 0) parts.push(`${h} jam`);
    if (m > 0) parts.push(`${m} menit`);
    if (parts.length === 0 && hours > 0) return "< 1 menit";
    if (parts.length === 0) return "0 menit";
    return parts.join(' ');
  };
  
  const processSingleRoute = useCallback(async (
    routeToProcess: RouteCalculation
  ): Promise<RouteResult> => { 
    
    const { locationAInput, locationBInput, travelMode } = routeToProcess;
    const originalA = locationAInput;
    const originalB = locationBInput;
    
    let finalCoordsA: LatLngTuple | null = parseCoordinates(locationAInput);
    let finalCoordsB: LatLngTuple | null = parseCoordinates(locationBInput);
    let geocodingPerformedA = false;
    let geocodingPerformedB = false;
    let errorMsgA: string | null = null;
    let errorMsgB: string | null = null;
    let status: RouteResult['status'] = 'pending';

    if (!finalCoordsA && locationAInput.trim()) {
      const geocodeResultA = await geocodeAddressWithGemini(locationAInput);
      if (geocodeResultA && !('error' in geocodeResultA)) {
        finalCoordsA = geocodeResultA;
        geocodingPerformedA = true;
      } else if (geocodeResultA && 'error' in geocodeResultA) {
        errorMsgA = geocodeResultA.error;
      } else {
        errorMsgA = `Gagal mengubah "${locationAInput}" menjadi koordinat.`;
      }
    }

    if (!finalCoordsB && locationBInput.trim()) {
      const geocodeResultB = await geocodeAddressWithGemini(locationBInput);
      if (geocodeResultB && !('error' in geocodeResultB)) {
        finalCoordsB = geocodeResultB;
        geocodingPerformedB = true;
      } else if (geocodeResultB && 'error' in geocodeResultB) {
        errorMsgB = geocodeResultB.error;
      } else {
        errorMsgB = `Gagal mengubah "${locationBInput}" menjadi koordinat.`;
      }
    }
    
    if (errorMsgA && errorMsgB) status = 'error_both_geocoding';
    else if (errorMsgA) status = 'error_geocoding_A';
    else if (errorMsgB) status = 'error_geocoding_B';
    
    const calculatedAt = new Date().toLocaleString();

    const baseErrorResult = {
        straightLineDistanceKm: null, 
        straightLineDurationHours: null, 
        estimatedTravelDurationHours: null,
        travelMode,
        error: [errorMsgA, errorMsgB].filter(Boolean).join(' ') || "Geocoding error", 
        calculationType: null, 
        status, 
        fromLocation: originalA, 
        toLocation: originalB, 
        calculatedAt, 
        originalInputA: originalA, 
        originalInputB: originalB,
    };

    if (status.startsWith('error_geocoding')) {
        return baseErrorResult;
    }

    if (finalCoordsA && finalCoordsB) {
      const distanceKm = calculateHaversineDistance(finalCoordsA[0], finalCoordsA[1], finalCoordsB[0], finalCoordsB[1]);
      const straightLineHours = distanceKm / customSpeedKmh;
      const heuristicFactor = HEURISTIC_TRAVEL_FACTORS[travelMode] || 1;
      const trafficFactor = includeTrafficFactor ? 1.2 : 1;
      const estimatedTravelHours = straightLineHours * heuristicFactor * trafficFactor;
      
      status = 'success';
      return {
        straightLineDistanceKm: `${distanceKm.toFixed(2)} km`,
        straightLineDurationHours: formatDuration(straightLineHours),
        estimatedTravelDurationHours: formatDuration(estimatedTravelHours),
        travelMode,
        error: null,
        calculationType: (geocodingPerformedA || geocodingPerformedB) ? 'geocoded_haversine' : 'haversine',
        message: `Estimasi durasi garis lurus @${customSpeedKmh}km/jam. Durasi perjalanan difaktorkan untuk ${travelMode.toLowerCase()}${includeTrafficFactor ? ' dengan faktor lalu lintas' : ''}.`,
        status,
        fromLocation: finalCoordsA.join(','),
        toLocation: finalCoordsB.join(','),
        calculatedAt,
        originalInputA: originalA,
        originalInputB: originalB,
      };
    }
    
    status = 'error_calculation';
    let combinedError = "Lokasi A dan/atau B tidak valid.";
    if (!locationAInput.trim() && !locationBInput.trim()) combinedError = "Harap masukkan Lokasi A dan Lokasi B.";
    else if (!locationAInput.trim()) combinedError = "Lokasi A diperlukan.";
    else if (!locationBInput.trim()) combinedError = "Lokasi B diperlukan.";

    return { ...baseErrorResult, error: combinedError, status };
  }, [customSpeedKmh, includeTrafficFactor]); 

  const handleCalculateAllRoutes = async () => {
    setIsLoading(true);
    const newRouteCalculations = await Promise.all(
      routeCalculations.map(async (rc) => {
        if (!rc.locationAInput.trim() && !rc.locationBInput.trim()) {
          return { ...rc, result: { straightLineDistanceKm: null, straightLineDurationHours: null, estimatedTravelDurationHours: null, travelMode: rc.travelMode, error: "Input kosong.", calculationType: null, status: 'pending' as RouteResult['status'], originalInputA: rc.locationAInput, originalInputB: rc.locationBInput } };
        }
        const singleResult = await processSingleRoute(rc);
        
        let aiAnalysisForThisRoute: string | null = null;
        let isAiLoadingForThisRoute = false;
        if (singleResult.status === 'success' && singleResult.fromLocation && singleResult.toLocation) {
            isAiLoadingForThisRoute = true;
            setRouteCalculations(prev => prev.map(prevRc => prevRc.id === rc.id ? {...prevRc, isAiRouteAnalysisLoading: true} : prevRc));
            try {
                aiAnalysisForThisRoute = await getRouteAnalysisForDisplay(
                    singleResult.originalInputA || rc.locationAInput, 
                    singleResult.originalInputB || rc.locationBInput, 
                    singleResult.straightLineDistanceKm, 
                    singleResult.estimatedTravelDurationHours,
                    singleResult.travelMode || rc.travelMode,
                    COUNTRIES_DATA.find(c => c.code === selectedCountryCode)?.name || "Global"
                );
            } catch (aiError) {
                console.error("Error fetching AI analysis for route:", aiError);
                aiAnalysisForThisRoute = "Gagal memuat analisis AI untuk rute ini.";
            }
            isAiLoadingForThisRoute = false;
        }
        return { ...rc, result: singleResult, aiRouteAnalysis: aiAnalysisForThisRoute, isAiRouteAnalysisLoading: isAiLoadingForThisRoute };
      })
    );
    setRouteCalculations(newRouteCalculations);
    setIsLoading(false);
  };

  const handleAddRoute = () => {
    if (routeCalculations.length < MAX_ROUTES) {
      const nextColorIndex = routeCalculations.length % ROUTE_COLORS_KEYS.length;
      const newRouteId = `route-${Date.now()}`;
      setRouteCalculations(prev => [
        ...prev,
        { 
          id: newRouteId, 
          locationAInput: '', 
          locationBInput: '', 
          travelMode: 'DRIVING',
          result: null, 
          color: RAW_COLOR_VALUES[ROUTE_COLORS_KEYS[nextColorIndex]] || '#007BFF',
          aiRouteAnalysis: null,
          isAiRouteAnalysisLoading: false,
        }
      ]);
    }
  };

  const handleRemoveRoute = (idToRemove: string) => {
    setRouteCalculations(prev => {
        const newRoutes = prev.filter(rc => rc.id !== idToRemove);
        if (newRoutes.length === 0) { 
            const nextColorIndex = 0;
            return [{ id: `route-${Date.now()}`, locationAInput: '', locationBInput: '', travelMode: 'DRIVING', result: null, color: RAW_COLOR_VALUES[ROUTE_COLORS_KEYS[nextColorIndex]] || '#007BFF', aiRouteAnalysis: null, isAiRouteAnalysisLoading: false }];
        }
        return newRoutes;
    });
  };

  const handleInputChange = (id: string, point: 'A' | 'B' | 'TravelMode', value: string) => {
    setRouteCalculations(prev => prev.map(rc => {
      if (rc.id === id) {
        if (point === 'A') return { ...rc, locationAInput: value, result: null, aiRouteAnalysis: null, isAiRouteAnalysisLoading: false };
        if (point === 'B') return { ...rc, locationBInput: value, result: null, aiRouteAnalysis: null, isAiRouteAnalysisLoading: false };
        if (point === 'TravelMode') return { ...rc, travelMode: value as TravelMode, result: null, aiRouteAnalysis: null, isAiRouteAnalysisLoading: false };
      }
      return rc;
    }));
  };
  
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["From_Location", "To_Location", "Travel_Mode"],
      ["Jakarta, Indonesia", "Surabaya, Indonesia", "DRIVING"],
      ["Eiffel Tower, Paris", "Big Ben, London", "WALKING"],
      ["Central Park, New York", "Times Square, New York", "CYCLING"]
    ]);
    XLSX.utils.sheet_add_aoa(ws, [["Note: Travel_Mode options: DRIVING, WALKING, CYCLING. Defaults to DRIVING if blank."]], {origin: "A5"});
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RoutesTemplate");
    XLSX.writeFile(wb, "RoutePlanner_Template.xlsx");
  };

  const onBulkDrop = useCallback(async (acceptedFiles: FileWithPath[]) => {
    if (acceptedFiles.length === 0) {
      setBulkFileProcessingError("Tidak ada file yang dipilih atau tipe file tidak didukung.");
      return;
    }
    const file = acceptedFiles[0];
    setUploadedFile(file);
    setIsBulkLoading(true);
    setBulkRouteResults([]);
    setBulkFileProcessingError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const binaryStr = event.target?.result;
        if (!binaryStr) throw new Error("Konten file kosong.");
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<{ From_Location?: string, To_Location?: string, Travel_Mode?: string }>(worksheet, { defval: null });

        if (jsonData.length === 0) {
          setBulkFileProcessingError("Sheet yang dipilih kosong atau tidak dapat diparsing.");
          setIsBulkLoading(false);
          return;
        }

        const results: BulkRouteResultItem[] = [];
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          const from = row.From_Location || '';
          const to = row.To_Location || '';
          const modeInput = (row.Travel_Mode || 'DRIVING').toUpperCase();
          const travelMode = (TRAVEL_MODES.some(tm => tm.value === modeInput) ? modeInput : 'DRIVING') as TravelMode;
          const bulkId = `bulk-${Date.now()}-${i}`;
          
          results.push({id: bulkId, originalInputA: from, originalInputB: to, travelMode, straightLineDistanceKm: null, straightLineDurationHours: null, estimatedTravelDurationHours: null, error: null, calculationType: null, status: 'pending' });
          setBulkRouteResults([...results]); 

          if (from.trim() && to.trim()) {
            const routeCalcItem: RouteCalculation = { id: bulkId, locationAInput: from, locationBInput: to, travelMode, result: null, color: RAW_COLOR_VALUES[theme.accent1] || '#00D4FF' };
            const result = await processSingleRoute(routeCalcItem);
            results[i] = { ...results[i], ...result, originalInputA: from, originalInputB: to, fromLocation: result.fromLocation || from, toLocation: result.toLocation || to };
          } else {
            results[i] = { ...results[i], error: "Lokasi 'From' atau 'To' kosong.", status: 'error_calculation' };
          }
          setBulkRouteResults([...results]); 
        }
      } catch (e: any) {
        setBulkFileProcessingError(`Error memproses file massal: ${e.message}`);
      } finally {
        setIsBulkLoading(false);
      }
    };
    reader.onerror = () => { setBulkFileProcessingError("Error membaca file."); setIsBulkLoading(false); };
    reader.readAsBinaryString(file);
  }, [processSingleRoute, theme.accent1]);
  
  const { getRootProps: getBulkRootProps, getInputProps: getBulkInputProps, isDragActive: isBulkDragActive } = useDropzone({ 
    onDrop: onBulkDrop, 
    accept: { 
      'application/vnd.ms-excel': ['.xls'], 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] 
    }, 
    maxFiles: 1, 
    disabled: isBulkLoading 
  });
  
  const handleGenerateGlobalAiAnalysis = async () => {
    const successfulRoutes = routeCalculations.filter(rc => rc.result?.status === 'success');
    if (!aiAnalysisInstruction.trim()) {
      alert("Silakan masukkan perintah untuk analisis AI.");
      return;
    }
    if (successfulRoutes.length === 0) {
      alert("Tidak ada rute yang berhasil dihitung untuk dianalisis. Hitung rute terlebih dahulu.");
      return;
    }
    setIsAiAnalysisLoading(true);
    setAiAnalysisResult(null);
    try {
      const currentCountry = COUNTRIES_DATA.find(c => c.code === selectedCountryCode)?.name || "Global";
      
      let prompt = `Analyze the following route data for the ${currentCountry} region based on the user's instruction.\n`;
      prompt += `User Instruction: "${aiAnalysisInstruction.trim()}"\n\n`;
      prompt += `Route Data:\n`;
      successfulRoutes.forEach((route, idx) => {
          prompt += `Route ${idx + 1}:\n`;
          prompt += `  From: ${route.result?.originalInputA || route.locationAInput} (Resolved: ${route.result?.fromLocation || 'N/A'})\n`;
          prompt += `  To: ${route.result?.originalInputB || route.locationBInput} (Resolved: ${route.result?.toLocation || 'N/A'})\n`;
          prompt += `  Travel Mode: ${route.travelMode}\n`;
          prompt += `  Straight-Line Distance: ${route.result?.straightLineDistanceKm || 'N/A'}\n`;
          prompt += `  Estimated Travel Duration: ${route.result?.estimatedTravelDurationHours || 'N/A'}\n`;
          if (route.result?.message) prompt += `  Note: ${route.result.message}\n`;
          prompt += '\n';
      });
      prompt += "Provide a concise analysis in well-structured Markdown, considering the travel modes and typical conditions for such travel."

      const response = await analyzeTextWithGemini(prompt, undefined, 'text');
      if (response.type === 'text' && typeof response.content === 'string') {
        setAiAnalysisResult(response.content);
      } else {
        setAiAnalysisResult(`Gagal menghasilkan analisis AI. ${response.type === 'error' ? response.content : 'Respon tidak valid.'}`);
      }
    } catch (error: any) {
      setAiAnalysisResult(`Error menganalisis rute: ${error.message}`);
    }
    setIsAiAnalysisLoading(false);
  };

  const handleExportManualRoutes = () => {
    const successfulManualRoutes = routeCalculations.filter(rc => rc.result?.status === 'success');
    if (successfulManualRoutes.length === 0) {
      alert("Tidak ada rute manual yang berhasil dihitung untuk diekspor.");
      return;
    }
    exportRouteResultsToXLSX(successfulManualRoutes, 'ManualRouteResults', 'manual');
  };

  const handleExportBulkRoutes = () => {
    if (bulkRouteResults.length === 0) {
      alert("Tidak ada hasil rute massal untuk diekspor.");
      return;
    }
    exportRouteResultsToXLSX(bulkRouteResults, 'BulkRouteResults', 'bulk');
  };

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        handleCalculateAllRoutes();
      }, autoRefreshInterval * 60000); // Convert minutes to milliseconds
      
      return () => clearInterval(interval);
    }
  }, [autoRefreshInterval, handleCalculateAllRoutes]);

  const cardHoverClass = reduceMotion ? '' : `hover:shadow-neon-glow-${theme.accent1}/50 transition-shadow duration-300`;
  const animationClass = reduceMotion ? '' : 'animate-fade-in';
  const contentAnimationClasses = `${reduceMotion ? '' : 'transition-all duration-500 ease-in-out'} overflow-hidden`;

  const travelModeIcon = (mode: TravelMode) => {
    if (mode === 'DRIVING') return <Car size={12} className="inline mr-1"/>;
    if (mode === 'WALKING') return <PersonStanding size={12} className="inline mr-1"/>;
    if (mode === 'CYCLING') return <Bike size={12} className="inline mr-1"/>;
    return null;
  };

  const getSelectStyles = () => ({
    baseClassName: 'p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border transition-colors',
    style: {
      backgroundColor: RAW_COLOR_VALUES[theme.darkBg] || '#1f2937',
      color: '#e5e7eb',
      borderColor: '#4b5563'
    },
    optionStyle: {
      backgroundColor: RAW_COLOR_VALUES[theme.darkBg] || '#1f2937',
      color: '#e5e7eb'
    }
  });

  const selectStyles = getSelectStyles();

  return (
    <div className={`p-4 md:p-8 text-gray-100 overflow-auto h-full relative`}>
      <div className={`relative z-10 ${animationClass}`}>
        <div className="flex items-center justify-between mb-6">
          <h1 className={`text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500`}>
            <Route className="inline mr-3" size={36} />
            Perencana & Analis Rute Canggih
          </h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full border border-green-500/50">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 text-sm font-medium">AI Powered</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full border border-blue-500/50">
              <Globe size={14} className="text-blue-300" />
              <span className="text-blue-300 text-sm font-medium">Global Coverage</span>
            </div>
          </div>
        </div>

        {/* Advanced Settings Section */}
        <div className={`bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-gray-700 mb-6`}>
          <div className="flex justify-between items-center mb-3 cursor-pointer" onClick={() => setIsAdvancedSettingsMinimized(!isAdvancedSettingsMinimized)}>
            <div className="flex items-center">
              <Settings size={20} className="mr-2 text-amber-400" />
              <h2 className="text-lg font-semibold text-amber-400">Pengaturan Lanjutan</h2>
            </div>
            <Button variant="ghost" size="sm" className="!p-1">
              {isAdvancedSettingsMinimized ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </Button>
          </div>
          <div className={`${contentAnimationClasses} ${isAdvancedSettingsMinimized ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Kecepatan Rata-rata (km/jam):</label>
                <Input
                  type="number"
                  value={customSpeedKmh.toString()}
                  onChange={(e) => setCustomSpeedKmh(Math.max(1, parseInt(e.target.value) || AVERAGE_TRAVEL_SPEED_KMH))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Auto Refresh (menit, 0=off):</label>
                <Input
                  type="number"
                  value={autoRefreshInterval.toString()}
                  onChange={(e) => setAutoRefreshInterval(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="trafficFactor"
                  checked={includeTrafficFactor}
                  onChange={(e) => setIncludeTrafficFactor(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="trafficFactor" className="text-sm">Sertakan Faktor Lalu Lintas (+20%)</label>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Route Input Section */}
        <div className={`bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-gray-700 mb-6 ${cardHoverClass}`}>
          <div className="flex justify-between items-center mb-3 cursor-pointer" onClick={() => setIsManualInputMinimized(!isManualInputMinimized)}>
            <div className="flex items-center">
              <MapPin size={20} className="mr-2 text-blue-400" />
              <h2 className="text-lg font-semibold text-blue-400">Konfigurasi & Input Rute Manual</h2>
              <span className="ml-2 px-2 py-1 bg-blue-500/20 rounded-full text-xs text-blue-300">
                {routeCalculations.length}/{MAX_ROUTES} Rute
              </span>
            </div>
            <Button variant="ghost" size="sm" className="!p-1">
              {isManualInputMinimized ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </Button>
          </div>
          <div className={`${contentAnimationClasses} ${isManualInputMinimized ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}`}>
            <div className="mb-4">
                <label htmlFor="countryContext" className="block text-sm font-medium mb-1 flex items-center">
                  <Globe size={14} className="mr-1" />
                  Konteks Negara (untuk Analisis AI):
                </label>
                <select 
                  id="countryContext" 
                  value={selectedCountryCode} 
                  onChange={(e) => setSelectedCountryCode(e.target.value)} 
                  className={`${selectStyles.baseClassName} w-full md:w-1/2`} 
                  style={selectStyles.style}
                >
                    <option value="" style={selectStyles.optionStyle}>-- Pilih Negara (opsional) --</option>
                    {COUNTRIES_DATA.map(country => (
                      <option key={country.code} value={country.code} style={selectStyles.optionStyle}>
                        {country.name}
                      </option>
                    ))}
                </select>
            </div>

            <div className="space-y-4 mb-6">
              {routeCalculations.map((rc, index) => (
                <div key={rc.id} className={`bg-gray-900/50 p-4 rounded-xl shadow-inner border border-gray-600 border-opacity-50 ${cardHoverClass} flex flex-col`}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold" style={{color: rc.color}}>
                        Rute {index + 1}
                      </h2>
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: rc.color}}></div>
                    </div>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      onClick={() => handleRemoveRoute(rc.id)} 
                      className="!p-1.5" 
                      disabled={routeCalculations.length <= 1}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label htmlFor={`route${rc.id}LocationA`} className="block text-xs font-medium mb-0.5 flex items-center">
                        <MapPin size={14} className="inline mr-1.5 text-green-400" />
                        Lokasi A (Asal):
                      </label>
                      <Input 
                        type="text" 
                        id={`route${rc.id}LocationA`} 
                        value={rc.locationAInput} 
                        onChange={(e) => handleInputChange(rc.id, 'A', e.target.value)} 
                        placeholder="Alamat atau Lat,Lng" 
                        className="w-full !text-xs"
                      />
                    </div>
                    <div>
                      <label htmlFor={`route${rc.id}LocationB`} className="block text-xs font-medium mb-0.5 flex items-center">
                        <MapPin size={14} className="inline mr-1.5 text-red-400" />
                        Lokasi B (Tujuan):
                      </label>
                      <Input 
                        type="text" 
                        id={`route${rc.id}LocationB`} 
                        value={rc.locationBInput} 
                        onChange={(e) => handleInputChange(rc.id, 'B', e.target.value)} 
                        placeholder="Alamat atau Lat,Lng" 
                        className="w-full !text-xs"
                      />
                    </div>
                    <div>
                      <label htmlFor={`route${rc.id}TravelMode`} className="block text-xs font-medium mb-0.5 flex items-center">
                        <Route size={14} className="inline mr-1.5"/>
                        Mode Perjalanan:
                      </label>
                      <select 
                        id={`route${rc.id}TravelMode`} 
                        value={rc.travelMode} 
                        onChange={(e) => handleInputChange(rc.id, 'TravelMode', e.target.value)} 
                        className={`${selectStyles.baseClassName} w-full !text-xs`} 
                        style={selectStyles.style}
                      >
                        {TRAVEL_MODES.map(mode => (
                          <option key={mode.value} value={mode.value} style={selectStyles.optionStyle}>
                            {mode.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {rc.result && (
                    <div className="bg-gray-800/50 p-3 rounded-lg shadow-inner border border-gray-600 border-opacity-50 mb-3">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <span 
                                  className="px-2 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r" 
                                  style={{background: `linear-gradient(to right, ${rc.color}, ${RAW_COLOR_VALUES[theme.accent2] || '#8B5CF6'})`}} 
                                  title={rc.result.originalInputA || rc.locationAInput}
                                >
                                  {(rc.result.originalInputA?.substring(0,15) || rc.locationAInput.substring(0,15) || 'Asal') + '...'}
                                </span>
                                <Navigation size={14} className="text-white opacity-70" />
                                <span 
                                  className="px-2 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r" 
                                  style={{background: `linear-gradient(to right, ${RAW_COLOR_VALUES[theme.accent2] || '#8B5CF6'}, ${rc.color})`}} 
                                  title={rc.result.originalInputB || rc.locationBInput}
                                >
                                  {(rc.result.originalInputB?.substring(0,15) || rc.locationBInput.substring(0,15) || 'Tujuan') + '...'}
                                </span>
                            </div>
                            {rc.result.estimatedTravelDurationHours && (
                                <div className="px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 text-orange-300 bg-orange-600/50 border border-orange-500/50">
                                    <Clock size={10} /> 
                                    {rc.result.estimatedTravelDurationHours} 
                                    ({travelModeIcon(rc.travelMode)}{rc.travelMode.toLowerCase()})
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                            <div><strong className="opacity-70">Dari (Koordinat):</strong> <span className="font-mono">{rc.result.fromLocation || 'N/A'}</span></div>
                            <div><strong className="opacity-70">Ke (Koordinat):</strong> <span className="font-mono">{rc.result.toLocation || 'N/A'}</span></div>
                            <div><strong className="opacity-70">Jarak Lurus:</strong> <span className="font-bold text-green-400">{rc.result.straightLineDistanceKm || 'N/A'}</span></div>
                            <div><strong className="opacity-70">Durasi Lurus:</strong> <span className="font-bold">{rc.result.straightLineDurationHours || 'N/A'}</span></div>
                        </div>
                        <hr className="my-2 border-white/10" />
                        <div className="flex justify-between items-center">
                             <p className={`text-xs ${rc.result.error ? 'text-red-400' : 'text-green-400'} flex items-center gap-1`}>
                                {rc.result.error ? (
                                  <>
                                    <AlertTriangle size={12} />
                                    Error: {rc.result.error}
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle size={12} />
                                    Sukses Dihitung
                                  </>
                                )}
                            </p>
                            <div className="text-right text-[10px] opacity-60">
                                <p>Calculated: {rc.result.calculatedAt ? new Date(rc.result.calculatedAt).toLocaleTimeString() : '-'}</p>
                                {rc.result.calculationType && <p>Type: {rc.result.calculationType.replace(/_/g, ' ')}</p>}
                            </div>
                        </div>
                        {rc.result.message && <p className="text-[10px] opacity-70 mt-1 italic">{rc.result.message}</p>}
                    </div>
                  )}
                  {rc.result?.status === 'success' && (
                    <div className="mt-3">
                      {rc.isAiRouteAnalysisLoading ? 
                        <div className="flex items-center text-xs opacity-70">
                          <LoadingSpinner size="sm"/> 
                          <span className="ml-2">Memuat analisis AI...</span>
                        </div> :
                        rc.aiRouteAnalysis ? 
                        (<div className="p-2 border rounded-md bg-gray-800/30 border-gray-600 max-h-40 overflow-y-auto text-xs">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{rc.aiRouteAnalysis}</ReactMarkdown>
                        </div>) : 
                        <p className="text-xs italic opacity-60">Analisis AI belum tersedia untuk rute ini.</p>
                      }
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {routeCalculations.length < MAX_ROUTES && (
                  <Button onClick={handleAddRoute} variant="secondary" className="flex-1" leftIcon={<PlusCircle size={16}/>}>
                    Tambah Rute Lain ({routeCalculations.length}/{MAX_ROUTES})
                  </Button>
              )}
              <Button 
                onClick={handleExportManualRoutes} 
                variant="secondary" 
                className="flex-1" 
                leftIcon={<Download size={16}/>}
                disabled={!routeCalculations.some(rc => rc.result?.status === 'success')}
              >
                Unduh Rute Manual (XLSX)
              </Button>
            </div>
            <Button 
              onClick={handleCalculateAllRoutes} 
              variant="primary" 
              className="w-full mt-4" 
              isLoading={isLoading} 
              leftIcon={isLoading ? undefined : <Calculator size={18} />}
            >
              {isLoading ? 'Menghitung...' : 'Hitung Semua Rute Manual & Analisis AI'}
            </Button>
          </div>
        </div>

        {/* Bulk Route Processing Section */}
        <div className={`bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-gray-700 mb-6 ${cardHoverClass}`}>
          <div className="flex justify-between items-center mb-3 cursor-pointer" onClick={() => setIsBulkProcessingMinimized(!isBulkProcessingMinimized)}>
            <div className="flex items-center">
              <UploadCloud size={20} className="mr-2 text-yellow-400" />
              <h2 className="text-lg font-semibold text-yellow-400">Pemrosesan Rute Massal</h2>
              {bulkRouteResults.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-yellow-500/20 rounded-full text-xs text-yellow-300">
                  {bulkRouteResults.length} Hasil
                </span>
              )}
            </div>
             <Button variant="ghost" size="sm" className="!p-1">
              {isBulkProcessingMinimized ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </Button>
          </div>
           <div className={`${contentAnimationClasses} ${isBulkProcessingMinimized ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
            <div className="flex justify-end items-center mb-2">
              <Button 
                onClick={handleExportBulkRoutes} 
                variant="secondary" 
                size="sm" 
                leftIcon={<Download size={16}/>}
                disabled={bulkRouteResults.length === 0}
              >
                Unduh Hasil Massal (XLSX)
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div 
                  {...getBulkRootProps()} 
                  className={`p-6 border-2 border-dashed rounded-lg cursor-pointer text-center transition-all duration-300 ${
                    isBulkDragActive 
                      ? 'border-blue-400 bg-blue-400/10 scale-105' 
                      : 'border-gray-600 hover:border-blue-400 hover:bg-blue-400/5'
                  }`}
                >
                    <input {...getBulkInputProps()} disabled={isBulkLoading} />
                    <UploadCloud size={32} className={`mx-auto mb-2 ${isBulkDragActive ? 'text-blue-400' : 'text-gray-400'}`} />
                    <p className="text-sm">{isBulkDragActive ? "Letakkan file di sini..." : "Seret & lepas file Excel, atau klik"}</p>
                    <p className="text-xs opacity-60">(.xlsx, .xls) - Maksimal 20MB</p>
                </div>
                <Button 
                  onClick={handleDownloadTemplate} 
                  variant="secondary" 
                  size="md" 
                  leftIcon={<Download size={16}/>} 
                  className="w-full md:w-auto self-center"
                >
                  Unduh Template Excel
                </Button>
            </div>
            {uploadedFile && (
              <p className="text-xs mt-2 flex items-center gap-2">
                <FileText size={14} className="text-green-400" />
                File Terunggah: <span className="font-semibold text-green-400">{uploadedFile.name}</span>
              </p>
            )}
            {isBulkLoading && (
              <div className="mt-3 flex justify-center">
                <LoadingSpinner text="Memproses rute massal..." />
              </div>
            )}
            {bulkFileProcessingError && (
              <div className="my-2 p-2 rounded-md bg-red-500/20 border border-red-500 text-red-300 text-xs flex items-center gap-1">
                <AlertTriangle size={14}/>
                {bulkFileProcessingError}
              </div>
            )}
            {bulkRouteResults.length > 0 && (
                <div className="mt-4 max-h-80 overflow-y-auto border border-gray-600 rounded-md">
                    <table className="min-w-full text-xs">
                        <thead className="bg-gray-700 sticky top-0 z-10">
                          <tr className="text-left">
                            <th className="p-1.5">Dari (Input)</th>
                            <th className="p-1.5">Ke (Input)</th>
                            <th className="p-1.5">Mode</th>
                            <th className="p-1.5">Jarak</th>
                            <th className="p-1.5">Estimasi Waktu</th>
                            <th className="p-1.5">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkRouteResults.map(res => (
                            <tr key={res.id} className="border-b border-gray-600 last:border-b-0 hover:bg-gray-700/30">
                                <td className="p-1.5 truncate max-w-[100px]" title={res.originalInputA}>{res.originalInputA}</td>
                                <td className="p-1.5 truncate max-w-[100px]" title={res.originalInputB}>{res.originalInputB}</td>
                                <td className="p-1.5">{travelModeIcon(res.travelMode || 'DRIVING')}{res.travelMode || 'N/A'}</td>
                                <td className="p-1.5 font-mono">{res.straightLineDistanceKm || '-'}</td>
                                <td className="p-1.5 font-mono">{res.estimatedTravelDurationHours || '-'}</td>
                                <td className="p-1.5">
                                    {res.status === 'pending' && <Clock size={12} className="text-yellow-400 inline mr-1"/>}
                                    {res.status === 'success' && <CheckCircle size={12} className="text-green-400 inline mr-1"/>}
                                    {res.status?.startsWith('error') && <AlertTriangle size={12} className="text-red-400 inline mr-1"/>}
                                    <span className="text-[10px] opacity-80">
                                      {res.error ? res.error.substring(0,30)+'...' : res.status || 'Selesai'}
                                    </span>
                                </td>
                            </tr>
                          ))}
                        </tbody>
                    </table>
                </div>
            )}
          </div>
        </div>
        
        {/* Global AI Analysis Section */}
        <div className={`bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-gray-700 mt-8 ${cardHoverClass}`}>
            <div className="flex justify-between items-center mb-3 cursor-pointer" onClick={() => setIsGlobalAiAnalysisMinimized(!isGlobalAiAnalysisMinimized)}>
              <div className="flex items-center">
                <Brain size={20} className="mr-2 text-purple-400" />
                <h2 className="text-lg font-semibold text-purple-400">Analisis Global AI (Semua Rute Manual)</h2>
                <Zap size={16} className="ml-2 text-yellow-400 animate-pulse" />
              </div>
              <Button variant="ghost" size="sm" className="!p-1">
                {isGlobalAiAnalysisMinimized ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              </Button>
            </div>
            <div className={`${contentAnimationClasses} ${isGlobalAiAnalysisMinimized ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
              <textarea 
                value={aiAnalysisInstruction} 
                onChange={(e) => setAiAnalysisInstruction(e.target.value)} 
                placeholder="Masukkan perintah/pertanyaan Anda untuk AI tentang semua rute yang dihitung (misalnya, 'Bandingkan semua rute', 'Rute mana yang paling efisien?', 'Buat ringkasan potensi tantangan untuk semua rute')." 
                rows={3} 
                className="w-full p-2 border rounded-md text-xs bg-gray-700/50 border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-200"
              />
              <div className="flex gap-2 mt-2">
                <Button 
                  onClick={handleGenerateGlobalAiAnalysis} 
                  variant="primary" 
                  size="sm" 
                  isLoading={isAiAnalysisLoading} 
                  disabled={isAiAnalysisLoading || !aiAnalysisInstruction.trim() || routeCalculations.every(rc => rc.result?.status !== 'success')} 
                  className="flex-1" 
                  leftIcon={<Play size={14}/>}
                >
                  Generate Analisis Global
                </Button>
                <Button 
                  onClick={() => setAiAnalysisInstruction('Bandingkan efisiensi semua rute dan berikan rekomendasi terbaik')} 
                  variant="secondary" 
                  size="sm"
                  leftIcon={<TrendingUp size={14}/>}
                >
                  Quick: Analisis Efisiensi
                </Button>
              </div>
              {isAiAnalysisLoading && (
                <div className="mt-3 flex justify-center">
                  <LoadingSpinner text="AI sedang menganalisis rute..." />
                </div>
              )}
              {aiAnalysisResult && !isAiAnalysisLoading && (
                <div className="mt-3 p-3 border rounded-md bg-gray-800/30 border-gray-600 max-h-60 overflow-y-auto text-xs">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiAnalysisResult}</ReactMarkdown>
                </div>
              )}
            </div>
        </div>

        {/* Statistics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-500/20 p-4 rounded-lg border border-blue-500/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Total Rute Manual</p>
                <p className="text-2xl font-bold text-blue-100">{routeCalculations.length}</p>
              </div>
              <Route size={24} className="text-blue-400" />
            </div>
          </div>
          <div className="bg-green-500/20 p-4 rounded-lg border border-green-500/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-medium">Rute Berhasil</p>
                <p className="text-2xl font-bold text-green-100">
                  {routeCalculations.filter(rc => rc.result?.status === 'success').length}
                </p>
              </div>
              <CheckCircle size={24} className="text-green-400" />
            </div>
          </div>
          <div className="bg-yellow-500/20 p-4 rounded-lg border border-yellow-500/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-300 text-sm font-medium">Rute Massal</p>
                <p className="text-2xl font-bold text-yellow-100">{bulkRouteResults.length}</p>
              </div>
              <UploadCloud size={24} className="text-yellow-400" />
            </div>
          </div>
          <div className="bg-purple-500/20 p-4 rounded-lg border border-purple-500/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm font-medium">AI Analisis</p>
                <p className="text-2xl font-bold text-purple-100">
                  {routeCalculations.filter(rc => rc.aiRouteAnalysis).length}
                </p>
              </div>
              <Brain size={24} className="text-purple-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};