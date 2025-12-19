
import React from 'react';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { KeyValuePair } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  items: KeyValuePair[];
  onChange: (items: KeyValuePair[]) => void;
  title?: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  layout?: 'row' | 'card'; // New prop to control layout style
}

export const KeyValueEditor: React.FC<Props> = ({ 
  items = [], 
  onChange, 
  title, 
  keyPlaceholder = "Key", 
  valuePlaceholder = "Value",
  layout = 'row' // Default to row for cleaner API editing
}) => {
  
  const handleAdd = () => {
    onChange([...items, { id: uuidv4(), key: '', value: '', enabled: true }]);
  };

  const handleChange = (id: string, field: 'key' | 'value', val: string) => {
    onChange(items.map(item => item.id === id ? { ...item, [field]: val } : item));
  };

  const handleToggle = (id: string) => {
    onChange(items.map(item => item.id === id ? { ...item, enabled: !item.enabled } : item));
  };

  const handleRemove = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  // Auto-height for textarea in card mode
  const adjustHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {title && (
        <div className="flex justify-between items-center mb-2 px-1">
          <div className="text-xs font-bold opacity-60 uppercase tracking-wider">{title}</div>
          <span className="text-[10px] opacity-40 bg-base-200 px-1 rounded">{items.length} items</span>
        </div>
      )}
      
      {/* List Area */}
      <div className="flex-1 space-y-2 min-h-0 pb-2 overflow-y-auto custom-scrollbar pr-1">
        {items.length === 0 && (
          <div className="text-center py-4 border-2 border-dashed border-base-200 rounded-lg bg-base-50/50 hover:bg-base-100 transition-colors cursor-pointer" onClick={handleAdd}>
             <div className="text-xs text-slate-400 mb-1">暂无参数</div>
             <div className="text-[10px] text-primary flex items-center justify-center gap-1">
                <Plus size={10}/> 点击添加
             </div>
          </div>
        )}

        {items.map((item) => (
          <div 
            key={item.id} 
            className={`group flex items-start gap-2 transition-all duration-200 ${layout === 'card' ? 'flex-col p-3 border rounded-lg bg-base-100' : 'items-center'}`}
          >
            {/* --- Row Layout Implementation --- */}
            {layout === 'row' && (
              <>
                <button 
                    onClick={() => handleToggle(item.id)}
                    className={`btn btn-xs btn-circle btn-ghost shrink-0 ${item.enabled ? 'text-success' : 'text-slate-300'}`}
                    title={item.enabled ? "已启用" : "已禁用"}
                >
                    {item.enabled ? <CheckCircle2 size={14}/> : <Circle size={14}/>}
                </button>
                
                <div className="flex-1 min-w-0">
                    <input 
                      type="text" 
                      className={`input input-xs input-bordered w-full font-mono text-xs ${item.enabled ? 'text-primary font-semibold' : 'text-slate-400'}`}
                      placeholder={keyPlaceholder}
                      value={item.key}
                      onChange={(e) => handleChange(item.id, 'key', e.target.value)}
                      disabled={!item.enabled}
                    />
                </div>
                
                <span className="text-slate-300 font-light select-none">:</span>

                <div className="flex-1 min-w-0">
                    <input 
                      type="text" 
                      className="input input-xs input-bordered w-full font-mono text-xs"
                      placeholder={valuePlaceholder}
                      value={item.value}
                      onChange={(e) => handleChange(item.id, 'value', e.target.value)}
                      disabled={!item.enabled}
                    />
                </div>

                <button 
                  onClick={() => handleRemove(item.id)}
                  className="btn btn-xs btn-circle btn-ghost text-slate-300 hover:text-error hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="删除"
                >
                  <Trash2 size={12}/>
                </button>
              </>
            )}

            {/* --- Card Layout Implementation (Legacy/Complex) --- */}
            {layout === 'card' && (
              <>
                <div className="flex items-center gap-2 w-full">
                    <button onClick={() => handleToggle(item.id)} className={item.enabled ? 'text-success' : 'text-slate-300'}>
                        {item.enabled ? <CheckCircle2 size={16}/> : <Circle size={16}/>}
                    </button>
                    <input 
                      className="input input-sm input-bordered flex-1 font-mono text-xs font-bold"
                      placeholder={keyPlaceholder}
                      value={item.key}
                      onChange={(e) => handleChange(item.id, 'key', e.target.value)}
                    />
                    <button onClick={() => handleRemove(item.id)} className="text-slate-300 hover:text-error">
                        <Trash2 size={14}/>
                    </button>
                </div>
                <textarea 
                  className="textarea textarea-bordered textarea-sm w-full font-mono text-xs leading-relaxed resize-y min-h-[2.5rem]"
                  placeholder={valuePlaceholder}
                  value={item.value}
                  onChange={(e) => { handleChange(item.id, 'value', e.target.value); adjustHeight(e); }}
                  rows={1}
                />
              </>
            )}
          </div>
        ))}
      </div>

      {/* Footer Action */}
      <button 
          onClick={handleAdd} 
          className="btn btn-xs btn-block btn-ghost border-dashed border-base-300 text-slate-500 hover:text-primary hover:border-primary mt-2"
      >
          <Plus size={12}/> 添加参数
      </button>
    </div>
  );
};
