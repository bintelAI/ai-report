
import React, { useState, useEffect } from 'react';
import { DataSourceConfig } from '../../types';
import { Play, Sparkles, Database, Loader2 } from 'lucide-react';
import { generateSQLFromText, simulateSQLExecution } from '../../services/geminiService';

interface Props {
  config: DataSourceConfig;
  onUpdate: (data: any, sqlConfig: any) => void;
}

export const SqlDataEditor: React.FC<Props> = ({ config, onUpdate }) => {
  const [sql, setSql] = useState(config.sql?.query || 'SELECT name, value FROM sales_data LIMIT 10');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);

  // Sync internal state if props change drastically (e.g. switch widget)
  useEffect(() => {
     if (config.sql?.query) {
         setSql(config.sql.query);
     }
  }, [config.sql?.query]);

  const handleAiGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const generatedSql = await generateSQLFromText(prompt);
      setSql(generatedSql);
      // Auto execute won't happen, but user can click run
    } catch (error) {
      console.error(error);
      alert("AI 生成 SQL 失败");
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    setExecuting(true);
    try {
      // Simulate execution via AI for now
      const result = await simulateSQLExecution(sql);
      // Update parent config with new data AND the sql string
      onUpdate(result, { query: sql });
    } catch (error) {
      console.error(error);
      alert("模拟执行失败"); 
    } finally {
      setExecuting(false);
    }
  };

  const handleBlur = () => {
     // Just save config without running
     onUpdate([], { query: sql });
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      
      {/* AI Assistant */}
      <div className="bg-base-200/50 p-3 rounded-lg border border-base-200">
        <label className="text-xs font-bold flex items-center gap-1 text-primary mb-2">
          <Sparkles size={12} /> AI SQL 助手
        </label>
        <div className="flex gap-2">
          <input 
            type="text" 
            className="input input-xs input-bordered w-full" 
            placeholder="例如: 查询上个月销量前5的产品..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
          />
          <button 
            className="btn btn-xs btn-primary text-white"
            onClick={handleAiGenerate}
            disabled={loading}
          >
            {loading ? <Loader2 size={12} className="animate-spin"/> : '生成'}
          </button>
        </div>
      </div>

      {/* SQL Editor */}
      <div className="flex-1 flex flex-col">
        <label className="text-xs font-medium opacity-60 mb-1 flex justify-between">
           <span>SQL 查询语句</span>
           <span className="text-[10px] bg-warning/20 text-warning px-1 rounded">模拟环境</span>
        </label>
        <textarea 
          className="textarea textarea-bordered flex-1 font-mono text-xs leading-relaxed resize-none"
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          onBlur={handleBlur}
          placeholder="SELECT * FROM table..."
        />
      </div>

      {/* Action Bar */}
      <div className="flex justify-end pt-2 border-t border-base-200">
        <button 
          className="btn btn-sm btn-accent text-white gap-2"
          onClick={handleRun}
          disabled={executing}
        >
          {executing ? <Loader2 size={16} className="animate-spin"/> : <Play size={16} />}
          执行查询
        </button>
      </div>
    </div>
  );
};
