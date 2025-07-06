import React from 'react';
import { PivotTableUISettings, PivotChartType } from '../../types';

interface PivotSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PivotTableUISettings;
  onUpdateSetting: (key: keyof PivotTableUISettings, value: any) => void;
  onReset: () => void;
  availableChartTypes: PivotChartType[];
}

const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-purple-300 mb-3 border-b border-purple-700/50 pb-2">{title}</h3>
    <div className="space-y-3">{children}</div>
  </div>
);

const CheckboxSetting: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = 
  ({ label, checked, onChange }) => (
  <label className="flex items-center space-x-2 cursor-pointer text-gray-300 hover:text-white transition-colors">
    <input 
      type="checkbox" 
      checked={checked} 
      onChange={(e) => onChange(e.target.checked)}
      className="form-checkbox h-5 w-5 text-purple-500 bg-gray-700 border-gray-600 rounded focus:ring-purple-400 focus:ring-offset-gray-800"
    />
    <span>{label}</span>
  </label>
);

const SelectSetting: React.FC<{label: string; value: string | number; onChange: (value: any) => void; options: {value: string | number; label: string}[];}> = 
  ({label, value, onChange, options}) => (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2.5 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600 text-sm shadow-sm"
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
);

const TextSetting: React.FC<{label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string}> = 
  ({label, value, onChange, type = "text", placeholder}) => (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-2.5 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600 text-sm shadow-sm"
      />
    </div>
);


export const PivotSettingsModal: React.FC<PivotSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSetting,
  onReset,
  availableChartTypes
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1050] p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="pivot-settings-title">
      <div 
        className="bg-gray-800 border border-purple-700/70 rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto hide-scrollbar transform transition-all duration-300 ease-out scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="pivot-settings-title" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            Pivot Table Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="Close settings"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <SettingsSection title="Display Options">
          <CheckboxSetting label="Show Row Subtotals" checked={settings.showRowSubtotals} onChange={v => onUpdateSetting('showRowSubtotals', v)} />
          <CheckboxSetting label="Show Grand Totals" checked={settings.showGrandTotals} onChange={v => onUpdateSetting('showGrandTotals', v)} />
          <CheckboxSetting label="Compact Mode (Reduced Padding)" checked={settings.compactMode} onChange={v => onUpdateSetting('compactMode', v)} />
          <CheckboxSetting label="Zebra Striping (Alternating Row Colors)" checked={settings.zebraStriping} onChange={v => onUpdateSetting('zebraStriping', v)} />
        </SettingsSection>

        <SettingsSection title="Value Formatting">
          <SelectSetting 
            label="Decimal Places" 
            value={settings.decimalPlaces} 
            onChange={v => onUpdateSetting('decimalPlaces', parseInt(v))}
            options={[0,1,2,3,4].map(n => ({value: n, label: n.toString()}))}
          />
          <CheckboxSetting label="Use Thousands Separator" checked={settings.useThousandsSeparator} onChange={v => onUpdateSetting('useThousandsSeparator', v)} />
          <TextSetting label="Text for Empty Cells" value={settings.emptyCellText} onChange={v => onUpdateSetting('emptyCellText', v)} placeholder="-"/>
          <CheckboxSetting label="Highlight Negative Values (Red Text)" checked={settings.highlightNegativeValues} onChange={v => onUpdateSetting('highlightNegativeValues', v)} />
        </SettingsSection>

        <SettingsSection title="Header Formatting">
          <CheckboxSetting label="Freeze Row Headers (Sticky)" checked={settings.freezeRowHeaders} onChange={v => onUpdateSetting('freezeRowHeaders', v)} />
          <CheckboxSetting label="Freeze Column Headers (Sticky)" checked={settings.freezeColumnHeaders} onChange={v => onUpdateSetting('freezeColumnHeaders', v)} />
        </SettingsSection>
        
        <SettingsSection title="Chart Options">
            <SelectSetting
                label="Default Chart Type"
                value={settings.chartType}
                onChange={v => onUpdateSetting('chartType', v as PivotChartType)}
                options={availableChartTypes.map(type => ({value: type, label: type.charAt(0).toUpperCase() + type.slice(1)}))}
            />
        </SettingsSection>

        <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
          <button
            onClick={onReset}
            className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-75 shadow-md hover:shadow-lg transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};