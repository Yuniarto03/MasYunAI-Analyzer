import React from 'react';

export interface IconProps {
  className?: string;
  size?: number;
}
export type IconType = React.FC<IconProps>;

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  imageUrl?: string; // To display attached images in chat
  outputFile?: { // For downloadable AI-generated files
    filename: string;
    content: string;
    mimeType: string;
  };
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  retrievedContext?: {
    uri?: string;
    title?: string;
  };
  // Add other possible chunk types if needed
}

export interface TableRow {
  [key: string]: string | number | boolean | Date | null | undefined; // Allow null/undefined
}

export type TableData = TableRow[];
export type FileHeaders = string[];

export interface ChartDataItem {
  name: string; // Typically the category axis
  [key: string]: number | string; // Allows multiple Y-axis values or other series data
}

export type ViewKey = 
  | 'welcome'
  | 'dashboard' 
  | 'dataUpload' 
  | 'dataTable' 
  | 'visualizations' 
  | 'settings'
  | 'onlineConnectors'
  | 'projectDetails'
  | 'advancedAITools'
  | 'genericPlaceholder'
  | 'pivotTable'
  | 'statisticalAnalysis'
  | 'workflow'
  | 'about'
  | 'aiAssistant'
  | 'diagrammingMatrix'
  | 'routePlanner'
  | 'map';

export interface NavSubMenuItemConfig {
    name: string;
    viewId: ViewKey;
}
export interface NavMenuItemConfig {
    name: string;
    subItems: NavSubMenuItemConfig[];
}

// Pivot Table Specific Types
export type AggregatorType = 'sum' | 'count' | 'average' | 'min' | 'max' | 'countNonEmpty';

export interface PivotValueFieldConfig {
  field: string;
  aggregator: AggregatorType;
  displayName?: string; // Optional custom display name for this value field instance
  color?: string; // To store custom color for chart series
}

export interface PivotFilterConfig {
  field: string;
  selectedValues: (string | number)[]; // Allow number for selected values as well for consistency
}

export interface PivotConfig {
  rowFields: string[];
  colFields:string[];
  valueFields: PivotValueFieldConfig[]; 
  filters?: PivotFilterConfig[]; // Added for data pre-filtering
}

export interface PivotHeaderGroup {
  key: string; // Unique key for this header group (e.g., "CategoryA|SubCategory1")
  name: string; // Display name (e.g., "SubCategory1")
  level: number;
  subGroups?: PivotHeaderGroup[]; // For multi-level columns or rows
  subtotal?: (number | string)[]; // Subtotal for this group (array for multiple value fields)
  valueFieldLabel?: string; // Used for column headers representing value fields
}

export interface PivotCell {
  values?: (number | string)[]; // Array for multiple value fields
  // Potentially add other properties like sourceData (for drill-through later)
}

export interface PivotRowData {
  rowHeaderGroups: PivotHeaderGroup[]; // Hierarchical row headers
  cells: PivotCell[]; // Data cells corresponding to column structure
  isSubtotalRow?: boolean;
}

export interface PivotResult {
  config: PivotConfig;
  rowStructure: PivotHeaderGroup[]; // Hierarchical row structure with expansion state
  colStructure: PivotHeaderGroup[]; // Hierarchical column structure with value field sub-headers
  dataMatrix: ( (number | string | undefined)[] )[][]; // Processed values [rowIndex][colIndex] - colIndex now spans across all value fields for each original colKey
  uniqueFlatRowKeys: string[][]; // Array of key arrays, e.g., [['Electronics'], ['Electronics', 'TV']]
  uniqueFlatColKeys: string[][]; // Array of key arrays (base column keys, not including value fields yet)
  grandTotalRow?: (number | string | undefined)[]; // Array for multiple value fields
  rowSubTotals?: { [key: string]: (number | string | undefined)[] }; // Key is combined row key, array for multiple value fields
  chartData?: ChartDataItem[]; // Data prepared for charting (might need adjustment for multi-value)
  error?: string;
  effectiveColStructureForHeaders: PivotHeaderGroup[]; // Used by thead to render columns including value fields
}

export type PivotChartType = 'bar' | 'line' | 'pie' | 'area' | 'donut' | 'horizontalBar' | 'butterfly';

export interface PivotTableUISettings {
  showRowSubtotals: boolean;
  showGrandTotals: boolean;
  compactMode: boolean;
  zebraStriping: boolean;
  decimalPlaces: number;
  useThousandsSeparator: boolean;
  emptyCellText: string;
  highlightNegativeValues: boolean;
  freezeRowHeaders: boolean;
  freezeColumnHeaders: boolean;
  chartType: PivotChartType;
  theme: string;
}

export const DEFAULT_PIVOT_UI_SETTINGS: PivotTableUISettings = {
  showRowSubtotals: true,
  showGrandTotals: true,
  compactMode: false,
  zebraStriping: true,
  decimalPlaces: 0, // Changed default to 0
  useThousandsSeparator: true,
  emptyCellText: '-',
  highlightNegativeValues: true,
  freezeRowHeaders: true,
  freezeColumnHeaders: true,
  chartType: 'bar',
  theme: 'professionalBlue',
};

// For App-level display mode
export type AppDisplayMode = 'normal' | 'pivotMaximized' | 'pivotPresentation';

export interface CalculatedFieldDef {
  name: string;
  formula: string; 
}

export interface PivotReportState {
    id: string;
    name: string;
    config: PivotConfig;
    calculatedFieldDefinitions: CalculatedFieldDef[];
    pivotResult: PivotResult | null;
    expandedRows: { [key: string]: boolean };
    uiSettings: PivotTableUISettings;
}


// --- NEW TYPES FOR ADVANCED DATA TABLE ---

export type ConditionOperator =
  | 'equals'
  | 'does_not_equal'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'contains'
  | 'does_not_contain'
  | 'is_empty'
  | 'is_not_empty';

export interface FilterRule {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: any;
}

export interface CellStyle {
  // Direct styles can be used but className is preferred for theme consistency
  backgroundColor?: string;
  color?: string;
  fontWeight?: 'normal' | 'bold';
  // CSS class name for more complex styles from index.html
  className?: string; 
}

export interface FormattingRule {
  id: string;
  name: string; // User-given name for the rule
  field: string; // Field to apply the rule to
  operator: ConditionOperator;
  value: any;
  style: CellStyle;
}

export type ColumnFilterState = Record<string, Set<string>>;


// --- Types moved from constants.tsx for better separation of concerns ---
export interface DockItemConfig {
  id: ViewKey;
  label: string;
  icon: IconType;
}

export interface SidebarItemConfig {
    name: string;
    icon: IconType;
    viewId: ViewKey;
}

export interface SidebarSectionConfig {
    title: string;
    items: SidebarItemConfig[];
}

export interface PivotTheme {
  name: string;
  description: string;
  tableClasses: {
    headerDefault: string;
    headerRowDesc: string;
    headerGrandTotal: string;
    cellDefault: string;
    cellRowHeader: string;
    cellGrandTotal: string;
    cellSubtotalHeader: string;
    cellSubtotalValue: string;
    zebraStripeClass: string;
  };
  chartColors: string[];
}


// --- NEW TYPES FOR FUTURISTIC BACKGROUND ---
export interface Theme {
  accent1: string;
  accent2: string;
  accent3: string;
  accent4: string;
  darkBg: string;
  textColor: string;
  cardBg: string;
  borderColor: string;
  darkGray: string;
  mediumGray: string;
}

// --- NEW TYPES FOR DIAGRAMMING MATRIX ---
export interface DiagramNodeStyle {
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    color: string;
    fontSize: number;
    fontFamily: string;
    opacity: number;
    shadow: boolean;
    backgroundImage: string;
    icon: string;
    imageFit?: 'cover' | 'contain' | 'fill';
    filter?: string; // For CSS filters like grayscale, brightness etc.
}

export interface DiagramNode {
    id: string;
    type: 'rectangle' | 'ellipse' | 'diamond' | 'text' | 'image';
    position: { x: number; y: number };
    size: { width: number; height: number };
    data: {
        label: string;
        style: Partial<DiagramNodeStyle>;
    };
}

export interface DiagramEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
    style?: {
        type?: 'curved' | 'straight' | 'orthogonal';
        stroke: string;
        strokeWidth: number;
        strokeDasharray?: string;
        arrowHead?: 'arrow' | 'circle' | 'none' | 'openArrow' | 'diamond';
        midpoint?: { x: number; y: number };
    };
}

export interface DiagramState {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
}

export interface DiagramTheme {
    node: Partial<DiagramNodeStyle>;
    edge: { stroke: string; labelColor: string };
    canvas: { backgroundColor: string; gridColor: string };
}

// --- NEW TYPES FOR ROUTE PLANNER ---
export type LatLngTuple = [number, number];
export type TravelMode = 'DRIVING' | 'WALKING' | 'CYCLING';

export interface RouteResult {
  straightLineDistanceKm: string | null;
  straightLineDurationHours: string | null;
  estimatedTravelDurationHours: string | null;
  travelMode: TravelMode;
  error: string | null;
  calculationType: 'haversine' | 'geocoded_haversine' | null;
  status: 'success' | 'error_geocoding_A' | 'error_geocoding_B' | 'error_both_geocoding' | 'error_calculation' | 'pending';
  message?: string;
  fromLocation?: string;
  toLocation?: string;
  calculatedAt?: string;
  originalInputA?: string;
  originalInputB?: string;
}

export interface RouteCalculation {
  id: string;
  locationAInput: string;
  locationBInput: string;
  travelMode: TravelMode;
  result: RouteResult | null;
  color: string;
  aiRouteAnalysis?: string | null;
  isAiRouteAnalysisLoading?: boolean;
}

export interface BulkRouteResultItem extends Partial<RouteResult> {
  id: string;
  originalInputA: string;
  originalInputB: string;
}

export interface CountryInfo {
  code: string;
  name: string;
}

// --- TYPE FOR RoutePlannerPage.tsx ---
export interface AppContextType {
    theme: Theme;
    reduceMotion: boolean;
}

// --- NEW TYPES FOR DYNAMIC DASHBOARD ---
export type WidgetType = 'kpi' | 'bar' | 'line' | 'pie' | 'table';

export interface BaseWidgetConfig {
    id: string;
    title: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface KPIWidgetConfig extends BaseWidgetConfig {
    type: 'kpi';
    valueField: string | null;
    aggregator: AggregatorType;
}

export interface ChartWidgetConfig extends BaseWidgetConfig {
    type: 'bar' | 'line' | 'pie';
    xAxisField: string | null;
    yAxisField: string | null;
    aggregator: AggregatorType;
}

export interface TableWidgetConfig extends BaseWidgetConfig {
    type: 'table';
    columns: string[];
    rowCount: number;
}

export type DashboardWidget = KPIWidgetConfig | ChartWidgetConfig | TableWidgetConfig;

// --- NEW TYPES FOR GEOJSON MAP VIEW ---
export interface GeoJsonProperties {
  [name: string]: any;
}

export interface GeoJsonGeometry {
  type: 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon' | 'GeometryCollection';
  coordinates: any[];
  geometries?: GeoJsonGeometry[];
}

export interface GeoJsonFeature {
  type: 'Feature';
  geometry: GeoJsonGeometry | null;
  properties: GeoJsonProperties | null;
  id?: string | number;
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

export interface MapFeatureStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}
