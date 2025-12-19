
import React, { useState, useEffect } from 'react';
import { DataSourceConfig } from '../../types';
import { Sparkles, AlertCircle, Check } from 'lucide-react';

interface Props {
  config: DataSourceConfig;
  onUpdate: (data: any) => void;
}

export const StaticDataEditor: React.FC<Props> = ({ config, onUpdate }) => {
  const [dataString, setDataString] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    // Initial load
    const dataToLoad = config.staticData || [];
    setDataString(JSON.stringify(dataToLoad, null, 2));
  }, [config.staticData]);

  const handleDataChange = (val: string) => {
    setDataString(val);
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) throw new Error("数据必须是数组");
      setJsonError(null);
      onUpdate(parsed);
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  const generateSampleData = () => {
    // Generate simple random data
    let demoData = Array.from({length: 5}, (_, i) => ({
        name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][i],
        value: Math.floor(Math.random() * 800) + 200,
        trend: Math.floor(Math.random() * 400) + 100
    }));
    handleDataChange(JSON.stringify(demoData, null, 2));
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium opacity-60">JSON 数据编辑器</span>
        <button onClick={generateSampleData} className="btn btn-xs btn-outline">
          <Sparkles size={12} className="mr-1"/> 生成样例
        </button>
      </div>
      <div className="relative flex-1">
        <textarea 
            className={`textarea textarea-bordered w-full h-full font-mono text-xs leading-relaxed ${jsonError ? 'textarea-error' : ''}`}
            value={dataString}
            onChange={(e) => handleDataChange(e.target.value)}
            spellCheck={false}
            placeholder="[ { 'name': 'A', 'value': 100 } ... ]"
        />
        {!jsonError && (
          <div className="absolute bottom-2 right-2 text-green-500 bg-base-100/80 rounded-full p-1 shadow-sm border border-green-100 animate-in fade-in">
             <Check size={14} />
          </div>
        )}
      </div>
      {jsonError && (
        <div className="text-xs text-error flex items-center gap-1 bg-error/10 p-2 rounded">
          <AlertCircle size={12} /> {jsonError}
        </div>
      )}
    </div>
  );
};
