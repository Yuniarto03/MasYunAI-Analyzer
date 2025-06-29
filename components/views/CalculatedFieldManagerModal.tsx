import React, { useState, useEffect, useMemo } from 'react';
import { CalculatedFieldDef } from '../../types';

// Icons for the modal
const CloseIcon: React.FC<{className?: string}> = ({className = "w-6 h-6"}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const PlusIcon: React.FC<{className?: string}> = ({className = "w-5 h-5"}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5V4.5z" /></svg>;
const TrashIcon: React.FC<{className?: string}> = ({className = "w-5 h-5"}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193v-.443A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>;
const EditIcon: React.FC<{className?: string}> = ({className = "w-5 h-5"}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>;


interface CalculatedFieldManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  definitions: CalculatedFieldDef[];
  onSave: (definitions: CalculatedFieldDef[]) => void;
  availableFields: string[];
}

const emptyField: Omit<CalculatedFieldDef, 'name'> & { name: string | null } = { name: null, formula: '' };

export const CalculatedFieldManagerModal: React.FC<CalculatedFieldManagerModalProps> = ({
  isOpen,
  onClose,
  definitions,
  onSave,
  availableFields,
}) => {
  const [localDefs, setLocalDefs] = useState(definitions);
  const [editingField, setEditingField] = useState<CalculatedFieldDef | typeof emptyField | null>(null);

  useEffect(() => {
    setLocalDefs(definitions);
  }, [definitions, isOpen]);

  const handleStartAdd = () => {
    setEditingField({ name: '', formula: '' });
  };
  
  const handleStartEdit = (def: CalculatedFieldDef) => {
    setEditingField(def);
  };
  
  const handleCancelEdit = () => {
    setEditingField(null);
  };

  const handleSaveField = () => {
    if (!editingField || !editingField.name) {
      alert("Field name cannot be empty.");
      return;
    }
    const finalName = editingField.name.trim();
    if (finalName.length === 0) {
      alert("Field name cannot be empty.");
      return;
    }
    if (availableFields.includes(finalName) && !definitions.some(d => d.name === finalName)) {
        alert("Calculated field name cannot be the same as an existing data field.");
        return;
    }

    const isEditing = definitions.some(d => d.name === editingField.name);
    
    let newDefs;
    if (isEditing) {
      newDefs = localDefs.map(d => d.name === finalName ? { name: finalName, formula: editingField.formula } : d);
    } else {
      newDefs = [...localDefs, { name: finalName, formula: editingField.formula }];
    }
    setLocalDefs(newDefs);
    setEditingField(null);
  };

  const handleDelete = (name: string) => {
    if (window.confirm(`Are you sure you want to delete the field "${name}"?`)) {
      setLocalDefs(localDefs.filter(d => d.name !== name));
    }
  };

  const handleFinalSave = () => {
    onSave(localDefs);
  };

  const editorTitle = editingField ? (editingField.name === '' ? 'Add New Calculated Field' : `Editing: ${editingField.name}`) : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1070] p-4" onClick={onClose}>
        <div 
            className="bg-gray-800 border border-teal-700/70 rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
        >
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
                    Manage Calculated Fields
                </h2>
                <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors" aria-label="Close">
                    <CloseIcon />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow overflow-y-auto">
                {/* Left Side: List of fields */}
                <div className="bg-gray-900/50 p-4 rounded-lg flex flex-col">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-300">Defined Fields</h3>
                        <button onClick={handleStartAdd} className="px-3 py-1.5 text-xs flex items-center gap-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded-md transition-colors">
                            <PlusIcon className="w-4 h-4" /> Add New
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                        {localDefs.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-10">No calculated fields defined.</p>
                        )}
                        {localDefs.map(def => (
                            <div key={def.name} className={`p-2 rounded-md flex justify-between items-center transition-colors ${editingField?.name === def.name ? 'bg-teal-900/80 ring-2 ring-teal-500' : 'bg-gray-700/60'}`}>
                                <div>
                                    <p className="font-semibold text-teal-300">{def.name}</p>
                                    <p className="text-xs text-gray-400 font-mono truncate" title={def.formula}>{def.formula}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button onClick={() => handleStartEdit(def)} className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-600/50 rounded-md" title="Edit">
                                        <EditIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(def.name)} className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-900/50 rounded-md" title="Delete">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Editor */}
                <div className="bg-gray-900/50 p-4 rounded-lg">
                    {editingField ? (
                        <div className="flex flex-col h-full">
                            <h3 className="text-lg font-semibold text-gray-300 mb-3">{editorTitle}</h3>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="calc-field-name" className="block text-sm font-medium text-gray-400 mb-1">Field Name</label>
                                    <input
                                        id="calc-field-name"
                                        type="text"
                                        value={editingField.name || ''}
                                        onChange={e => setEditingField({ ...editingField, name: e.target.value })}
                                        className="w-full p-2 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        placeholder="e.g., Profit"
                                        disabled={definitions.some(d => d.name === editingField.name)}
                                    />
                                    {definitions.some(d => d.name === editingField.name) && <p className="text-xs text-amber-500 mt-1">Field name cannot be changed after creation.</p>}
                                </div>
                                <div>
                                    <label htmlFor="calc-field-formula" className="block text-sm font-medium text-gray-400 mb-1">Formula</label>
                                    <textarea
                                        id="calc-field-formula"
                                        value={editingField.formula}
                                        onChange={e => setEditingField({ ...editingField, formula: e.target.value })}
                                        className="w-full p-2 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 h-24 font-mono text-sm"
                                        placeholder="e.g., [Revenue] - [Cost]"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Use square brackets to reference fields, e.g., `[FieldName] * 1.1`.</p>
                                </div>
                            </div>
                            <div className="mt-auto pt-4 flex justify-end gap-3">
                                <button onClick={handleCancelEdit} className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-500 rounded-md text-white transition-colors">Cancel</button>
                                <button onClick={handleSaveField} className="px-4 py-2 text-sm text-white bg-teal-600 hover:bg-teal-500 rounded-md transition-colors">Save Field</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center text-gray-500">
                            <p>Select a field to edit or add a new one.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                 <button onClick={handleFinalSave} className="px-6 py-2.5 font-semibold text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-md hover:shadow-lg transition-all">
                    Apply All Changes
                </button>
            </div>
        </div>
    </div>
  );
};
