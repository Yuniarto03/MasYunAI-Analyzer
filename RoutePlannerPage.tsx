
import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useDropzone, FileWithPath } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { AppContext } from '../contexts/AppContext';
import { AppContextType, RouteResult, CountryInfo, RouteCalculation, BulkRouteResultItem, LatLngTuple, TravelMode } from '../types';
import Button from './shared/Button';
import Input from './shared/Input';
import { RAW_COLOR_VALUES, COUNTRIES_DATA, AVERAGE_TRAVEL_SPEED_KMH, TRAVEL_MODES, HEURISTIC_TRAVEL_FACTORS } from '../constants';
import { MapPin, Navigation, AlertTriangle, CheckCircle, Calculator, Route, Info, Download, UploadCloud, Trash2, Clock, PlusCircle, Brain, Play, ChevronDown, ChevronUp, Bike, Car, PersonStanding } from 'lucide-react';
import FuturisticBackground from './shared/FuturisticBackground';
import { geocodeAddressWithGemini, getRouteAnalysisForDisplay, analyzeTextWithGemini } from '../services/geminiService';
import { getSharedSelectBaseStyles } from '../utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LoadingSpinner from './shared/LoadingSpinner';
import { exportRouteResultsToXLSX } from '../services/DataProcessingService';

const MAX_ROUTES = 5;
const ROUTE_COLORS_KEYS = ['accent1', 'accent2', 'accent3', 'accent4', 'pink-500'];

const RoutePlannerPage: React.FC = () => {
  const { theme, reduceMotion } = useContext(AppContext) as AppContextType;
  
  const [routeCalculations, setRouteCalculations] = useState<RouteCalculation[]>(() => [
    { 
      id: `route-${Date.now()}`, 
      locationAInput: '', 
      locationBInput: '', 
      travelMode: 'DRIVING', // Default travel mode
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
      const straightLineHours = distanceKm / AVERAGE_TRAVEL_SPEED_KMH;
      const heuristicFactor = HEURISTIC_TRAVEL_FACTORS[travelMode] || 1;
      const estimatedTravelHours = straightLineHours * heuristicFactor;
      
      status = 'success';
      return {
        straightLineDistanceKm: `${distanceKm.toFixed(2)} km`,
        straightLineDurationHours: formatDuration(straightLineHours),
        estimatedTravelDurationHours: formatDuration(estimatedTravelHours),
        travelMode,
        error: null,
        calculationType: (geocodingPerformedA || geocodingPerformedB) ? 'geocoded_haversine' : 'haversine',
        message: `Estimasi durasi garis lurus @${AVERAGE_TRAVEL_SPEED_KMH}km/jam. Durasi perjalanan difaktorkan untuk ${travelMode.toLowerCase()}.`,
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
  }, []); 

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
                    singleResult.travelMode || rc.travelMode, // Use travelMode from result or from input
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
    const ws = XLSX.utils.aoa_to_sheet([["From_Location", "To_Location", "Travel_Mode (DRIVING, WALKING, CYCLING)"], ["Jakarta, Indonesia", "Surabaya, Indonesia", "DRIVING"], ["Eiffel Tower, Paris", "Big Ben, London", "WALKING"]]);
    XLSX.utils.sheet_add_aoa(ws, [["Optional: Use 'DRIVING', 'WALKING', or 'CYCLING'. Defaults to DRIVING if blank or invalid."]], {origin: "A4"});
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
            const routeCalcItem: RouteCalculation = { id: bulkId, locationAInput: from, locationBInput: to, travelMode, result: null, color: theme.accent1 };
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
  
  const { getRootProps: getBulkRootProps, getInputProps: getBulkInputProps, isDragActive: isBulkDragActive } = useDropzone({ onDrop: onBulkDrop, accept: { 'application/vnd.ms-excel': ['.xls'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }, maxFiles: 1, disabled: isBulkLoading });
  
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

  const cardHoverClass = reduceMotion ? '' : `hover:shadow-neon-glow-${theme.accent1}/50 transition-shadow duration-300`;
  const animationClass = reduceMotion ? '' : 'animate-fade-in';
  const selectStyles = getSharedSelectBaseStyles(theme);
  const contentAnimationClasses = `${reduceMotion ? '' : 'transition-all duration-500 ease-in-out'} overflow-hidden`;

  const travelModeIcon = (mode: TravelMode) => {
    if (mode === 'DRIVING') return <Car size={12} className="inline mr-1"/>;
    if (mode === 'WALKING') return <PersonStanding size={12} className="inline mr-1"/>;
    if (mode === 'CYCLING') return <Bike size={12} className="inline mr-1"/>;
    return null;
  };


  return (
    <div className={`p-4 md:p-8 ${theme.textColor} futuristic-scrollbar overflow-auto h-full relative`}>
      <FuturisticBackground theme={theme} reduceMotion={reduceMotion} />
      <div className={`relative z-10 ${animationClass}`}>
        <h1 className={`text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-${theme.accent1} to-${theme.accent2}`}>
            Perencana & Analis Rute (Beta)
        </h1>

        {/* Manual Route Input Section */}
        <div className={`${theme.cardBg} p-4 rounded-xl shadow-xl border ${theme.borderColor} mb-6`}>
          <div className="flex justify-between items-center mb-3 cursor-pointer" onClick={() => setIsManualInputMinimized(!isManualInputMinimized)}>
            <h2 className={`text-lg font-semibold text-${theme.accent1}`}>Konfigurasi & Input Rute Manual</h2>
            <Button variant="ghost" size="sm" className="!p-1" aria-label={isManualInputMinimized ? "Expand Manual Input" : "Collapse Manual Input"}>
              {isManualInputMinimized ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </Button>
          </div>
          <div className={`${contentAnimationClasses} ${isManualInputMinimized ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}`}>
            <div className="mb-4">
                <label htmlFor="countryContext" className="block text-sm font-medium mb-1">Konteks Negara (untuk Analisis AI):</label>
                <select id="countryContext" value={selectedCountryCode} onChange={(e) => setSelectedCountryCode(e.target.value)} className={`${selectStyles.baseClassName} w-full md:w-1/2`} style={selectStyles.style}>
                    <option value="" style={selectStyles.optionStyle}>-- Pilih Negara (opsional) --</option>
                    {COUNTRIES_DATA.map(country => (<option key={country.code} value={country.code} style={selectStyles.optionStyle}>{country.name}</option>))}
                </select>
            </div>

            <div className="space-y-4 mb-6">
              {routeCalculations.map((rc, index) => (
                <div key={rc.id} className={`${theme.cardBg} p-4 rounded-xl shadow-inner border ${theme.borderColor} border-opacity-50 ${cardHoverClass} flex flex-col`}>
                  <div className="flex justify-between items-center mb-3">
                    <h2 className={`text-lg font-semibold`} style={{color: rc.color}}>Rute {index + 1}</h2>
                    <Button variant="danger" size="sm" onClick={() => handleRemoveRoute(rc.id)} title="Hapus Rute Ini" className="!p-1.5" disabled={routeCalculations.length <= 1}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label htmlFor={`route${rc.id}LocationA`} className="block text-xs font-medium mb-0.5 flex items-center"><MapPin size={14} className={`inline mr-1.5`} />Lokasi A (Asal):</label>
                      <Input type="text" id={`route${rc.id}LocationA`} value={rc.locationAInput} onChange={(e) => handleInputChange(rc.id, 'A', e.target.value)} placeholder="Alamat atau Lat,Lng" className="w-full !text-xs"/>
                    </div>
                    <div>
                      <label htmlFor={`route${rc.id}LocationB`} className="block text-xs font-medium mb-0.5 flex items-center"><MapPin size={14} className={`inline mr-1.5`} />Lokasi B (Tujuan):</label>
                      <Input type="text" id={`route${rc.id}LocationB`} value={rc.locationBInput} onChange={(e) => handleInputChange(rc.id, 'B', e.target.value)} placeholder="Alamat atau Lat,Lng" className="w-full !text-xs"/>
                    </div>
                    <div>
                      <label htmlFor={`route${rc.id}TravelMode`} className="block text-xs font-medium mb-0.5 flex items-center"><Route size={14} className="inline mr-1.5"/>Mode Perjalanan:</label>
                      <select id={`route${rc.id}TravelMode`} value={rc.travelMode} onChange={(e) => handleInputChange(rc.id, 'TravelMode', e.target.value)} className={`${selectStyles.baseClassName} w-full !text-xs`} style={selectStyles.style}>
                        {TRAVEL_MODES.map(mode => (<option key={mode.value} value={mode.value} style={selectStyles.optionStyle}>{mode.label}</option>))}
                      </select>
                    </div>
                  </div>
                  
                  {rc.result && (
                    <div className={`${theme.cardBg} p-3 rounded-lg shadow-inner border ${theme.borderColor} border-opacity-50`} style={{backgroundColor: `${RAW_COLOR_VALUES[rc.color.replace('text-', '')] || rc.color}1A`}}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r`} style={{background: `linear-gradient(to right, ${rc.color}, ${RAW_COLOR_VALUES[theme.accent2] || '#8B5CF6'})`}} title={rc.result.originalInputA || rc.locationAInput}>{rc.result.originalInputA?.substring(0,15) || rc.locationAInput.substring(0,15) || 'Asal'}</span>
                                <Navigation size={14} className="text-white opacity-70" />
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r`} style={{background: `linear-gradient(to right, ${RAW_COLOR_VALUES[theme.accent2] || '#8B5CF6'}, ${rc.color})`}} title={rc.result.originalInputB || rc.locationBInput}>{rc.result.originalInputB?.substring(0,15) || rc.locationBInput.substring(0,15) || 'Tujuan'}</span>
                            </div>
                            {rc.result.estimatedTravelDurationHours && (
                                <div className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 text-orange-300 bg-orange-600/50 border border-orange-500/50`}>
                                    <Clock size={10} /> {rc.result.estimatedTravelDurationHours} ({travelModeIcon(rc.travelMode)}{rc.travelMode.toLowerCase()})
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                            <div><strong className="opacity-70">Dari (Koordinat):</strong> <span className="font-mono">{rc.result.fromLocation || 'N/A'}</span></div>
                            <div><strong className="opacity-70">Ke (Koordinat):</strong> <span className="font-mono">{rc.result.toLocation || 'N/A'}</span></div>
                            <div><strong className="opacity-70">Jarak Lurus:</strong> <span className="font-bold" style={{color: RAW_COLOR_VALUES[theme.accent3] || '#00FF88'}}>{rc.result.straightLineDistanceKm || 'N/A'}</span></div>
                            <div><strong className="opacity-70">Durasi Lurus:</strong> <span className="font-bold">{rc.result.straightLineDurationHours || 'N/A'}</span></div>
                        </div>
                        <hr className="my-2 border-white/10" />
                        <div className="flex justify-between items-center">
                             <p className={`text-xs ${rc.result.error ? 'text-red-400' : `text-green-400`}`}>
                                {rc.result.error ? `Error: ${rc.result.error}` : (rc.result.status === 'success' ? "Sukses Dihitung" : "Status Tidak Diketahui")}
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
                        <div className="flex items-center text-xs opacity-70"><LoadingSpinner size="sm"/> <span className="ml-2">Memuat analisis AI...</span></div> :
                        rc.aiRouteAnalysis ? 
                        (<div className={`p-2 border rounded-md bg-${theme.darkGray}/30 border-${theme.mediumGray} max-h-40 overflow-y-auto futuristic-scrollbar text-xs`}>
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
                  <Button onClick={handleAddRoute} variant="secondary" className="flex-1" leftIcon={<PlusCircle size={16}/>}>Tambah Rute Lain</Button>
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
            <Button onClick={handleCalculateAllRoutes} variant="primary" className="w-full mt-4" isLoading={isLoading} leftIcon={isLoading ? undefined : <Calculator size={18} />}>Hitung Semua Rute Manual & Analisis AI</Button>
          </div>
        </div>

        {/* Bulk Route Processing Section */}
        <div className={`${theme.cardBg} p-4 rounded-xl shadow-xl border ${theme.borderColor} mb-6`}>
          <div className="flex justify-between items-center mb-3 cursor-pointer" onClick={() => setIsBulkProcessingMinimized(!isBulkProcessingMinimized)}>
            <h2 className={`text-lg font-semibold text-${theme.accent4}`}>Pemrosesan Rute Massal</h2>
             <Button variant="ghost" size="sm" className="!p-1" aria-label={isBulkProcessingMinimized ? "Expand Bulk Processing" : "Collapse Bulk Processing"}>
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
                <div {...getBulkRootProps()} className={`p-6 border-2 border-dashed rounded-lg cursor-pointer text-center ${theme.borderColor} hover:border-${theme.accent1} ${isBulkDragActive ? `border-${theme.accent1} bg-${theme.accent1}/10` : ''}`}>
                    <input {...getBulkInputProps()} disabled={isBulkLoading} />
                    <UploadCloud size={32} className={`mx-auto mb-2 ${isBulkDragActive ? `text-${theme.accent1}` : `${theme.textColor} opacity-70`}`} />
                    <p className="text-sm">{isBulkDragActive ? "Letakkan file di sini..." : "Seret & lepas file Excel, atau klik"}</p>
                    <p className="text-xs opacity-60">(.xlsx, .xls)</p>
                </div>
                <Button onClick={handleDownloadTemplate} variant="secondary" size="md" leftIcon={<Download size={16}/>} className="w-full md:w-auto self-center">Unduh Template Excel</Button>
            </div>
            {uploadedFile && <p className="text-xs mt-2">File Terunggah: <span className={`font-semibold text-${theme.accent2}`}>{uploadedFile.name}</span></p>}
            {isBulkLoading && <div className="mt-3 flex justify-center"><LoadingSpinner text="Memproses rute massal..." /></div>}
            {bulkFileProcessingError && <div className={`my-2 p-2 rounded-md bg-${theme.accent4}/20 border border-${theme.accent4} text-${theme.accent4} text-xs flex items-center gap-1`}><AlertTriangle size={14}/>{bulkFileProcessingError}</div>}
            {bulkRouteResults.length > 0 && (
                <div className="mt-4 max-h-80 overflow-y-auto futuristic-scrollbar border ${theme.borderColor} rounded-md">
                    <table className="min-w-full text-xs">
                        <thead className={`bg-${theme.mediumGray} sticky top-0 z-10`}><tr className="text-left">
                            <th className="p-1.5">Dari (Input)</th><th className="p-1.5">Ke (Input)</th><th className="p-1.5">Mode</th><th className="p-1.5">Jarak</th><th className="p-1.5">Estimasi Waktu</th><th className="p-1.5">Status</th>
                        </tr></thead>
                        <tbody>{bulkRouteResults.map(res => (
                            <tr key={res.id} className={`border-b ${theme.borderColor} last:border-b-0 hover:bg-${theme.mediumGray}/30`}>
                                <td className="p-1.5 truncate max-w-[100px]" title={res.originalInputA}>{res.originalInputA}</td>
                                <td className="p-1.5 truncate max-w-[100px]" title={res.originalInputB}>{res.originalInputB}</td>
                                <td className="p-1.5">{res.travelMode || 'N/A'}</td>
                                <td className="p-1.5">{res.straightLineDistanceKm || '-'}</td>
                                <td className="p-1.5">{res.estimatedTravelDurationHours || '-'}</td>
                                <td className="p-1.5">
                                    {res.status === 'pending' && <Clock size={12} className="text-yellow-400 inline mr-1"/>}
                                    {res.status === 'success' && <CheckCircle size={12} className="text-green-400 inline mr-1"/>}
                                    {res.status?.startsWith('error') && <AlertTriangle size={12} className="text-red-400 inline mr-1"/>}
                                    <span className="text-[10px] opacity-80">{res.error ? res.error.substring(0,30)+'...' : res.status || 'Selesai'}</span>
                                </td>
                            </tr>))}
                        </tbody>
                    </table>
                </div>
            )}
          </div>
        </div>
        
        {/* Global AI Analysis Section */}
        <div className={`${theme.cardBg} p-4 rounded-xl shadow-xl border ${theme.borderColor} mt-8`}>
            <div className="flex justify-between items-center mb-3 cursor-pointer" onClick={() => setIsGlobalAiAnalysisMinimized(!isGlobalAiAnalysisMinimized)}>
              <div className="flex items-center">
                <Brain size={20} className={`mr-2 text-${theme.accent3}`} />
                <h2 className={`text-lg font-semibold text-${theme.accent3}`}>Analisis Global AI (Semua Rute Manual)</h2>
              </div>
              <Button variant="ghost" size="sm" className="!p-1" aria-label={isGlobalAiAnalysisMinimized ? "Expand Global AI Analysis" : "Collapse Global AI Analysis"}>
                {isGlobalAiAnalysisMinimized ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              </Button>
            </div>
            <div className={`${contentAnimationClasses} ${isGlobalAiAnalysisMinimized ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
              <textarea value={aiAnalysisInstruction} onChange={(e) => setAiAnalysisInstruction(e.target.value)} placeholder="Masukkan perintah/pertanyaan Anda untuk AI tentang semua rute yang dihitung (misalnya, 'Bandingkan semua rute', 'Rute mana yang paling efisien?', 'Buat ringkasan potensi tantangan untuk semua rute')." rows={3} className={`w-full p-2 border rounded-md text-xs futuristic-scrollbar bg-${theme.darkGray}/50 border-${theme.mediumGray} focus:ring-1 focus:ring-${theme.accent1} focus:border-${theme.accent1}`} style={{color: RAW_COLOR_VALUES[theme.textColor.replace('text-','')]}}/>
              <Button onClick={handleGenerateGlobalAiAnalysis} variant="primary" size="sm" isLoading={isAiAnalysisLoading} disabled={isAiAnalysisLoading || !aiAnalysisInstruction.trim() || routeCalculations.every(rc => rc.result?.status !== 'success')} className="mt-2 w-full md:w-auto" leftIcon={<Play size={14}/>}>Generate Analisis Global</Button>
              {isAiAnalysisLoading && <div className="mt-3 flex justify-center"><LoadingSpinner text="AI sedang menganalisis rute..." /></div>}
              {aiAnalysisResult && !isAiAnalysisLoading && (<div className={`mt-3 p-3 border rounded-md bg-${theme.darkGray}/30 border-${theme.mediumGray} max-h-60 overflow-y-auto futuristic-scrollbar text-xs`}><ReactMarkdown remarkPlugins={[remarkGfm]}>{aiAnalysisResult}</ReactMarkdown></div>)}
            </div>
        </div>
      </div>
    </div>
  );
};

export default RoutePlannerPage;
