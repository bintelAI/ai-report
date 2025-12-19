
import React, { useState, useEffect } from 'react';
import { DataSourceConfig, KeyValuePair } from '../../types';
import { Globe, Loader2, AlertCircle, Settings2, FileJson, List } from 'lucide-react';
import { KeyValueEditor } from '../../common/KeyValueEditor';

interface Props {
  config: DataSourceConfig;
  onUpdate: (data: any, apiConfig: any) => void;
}

export const ApiDataEditor: React.FC<Props> = ({ config, onUpdate }) => {
  const apiConfig = config.api || { url: '', method: 'GET' };

  const [url, setUrl] = useState(apiConfig.url || '');
  const [method, setMethod] = useState(apiConfig.method || 'GET');
  const [responsePath, setResponsePath] = useState(apiConfig.responsePath || '');
  const [headers, setHeaders] = useState<KeyValuePair[]>(apiConfig.headers || []);
  const [queryParams, setQueryParams] = useState<KeyValuePair[]>(apiConfig.queryParams || []);
  const [body, setBody] = useState(apiConfig.body || '');
  
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('params');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const constructConfig = () => ({
      url, 
      method, 
      responsePath,
      headers,
      queryParams,
      body: method !== 'GET' ? body : undefined
  });

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    const currentConfig = constructConfig();

    try {
      // Basic fetch simulation for preview
      let fetchUrl = url;
      const params = new URLSearchParams();
      queryParams.forEach(p => { if(p.enabled && p.key) params.append(p.key, p.value); });
      const qs = params.toString();
      if(qs) fetchUrl += (fetchUrl.includes('?') ? '&' : '?') + qs;

      const fetchHeaders: Record<string, string> = {};
      headers.forEach(h => { if(h.enabled && h.key) fetchHeaders[h.key] = h.value; });

      let fetchBody = undefined;
      if (method !== 'GET' && body) {
         fetchBody = body;
         try { JSON.parse(body); fetchHeaders['Content-Type'] = 'application/json'; } catch(e) {}
      }

      const res = await fetch(fetchUrl, { method, headers: fetchHeaders, body: fetchBody });
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      
      const json = await res.json();
      
      let resultData = json;
      if (responsePath) {
        resultData = responsePath.split('.').reduce((o: any, k: string) => (o || {})[k], json);
      }

      if (!Array.isArray(resultData)) {
          if (typeof resultData === 'object' && resultData !== null) {
             resultData = Object.keys(resultData).map(k => ({ name: k, value: resultData[k] })); 
          } else {
             throw new Error("API 返回结果不是数组，请配置正确的提取路径");
          }
      }

      onUpdate(resultData, currentConfig);

    } catch (err: any) {
      setError(err.message);
      onUpdate([], currentConfig);
    } finally {
      setLoading(false);
    }
  };

  const handleBlur = () => {
    onUpdate([], constructConfig());
  };

  return (
    <div className="flex flex-col space-y-3 pb-2">
      
      {/* Method & URL */}
      <div className="flex gap-2">
        <select 
            className="select select-bordered select-sm w-24 font-bold"
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
        >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
        </select>
        <input 
            type="text" 
            className="input input-bordered input-sm flex-1 font-mono text-xs"
            placeholder="https://api.example.com/data"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={handleBlur}
        />
      </div>

      {/* TABS - Increased height to h-80 (320px) to allow seeing more params */}
      <div className="flex flex-col h-80 border border-base-200 rounded-lg bg-base-100 overflow-hidden shrink-0">
        <div className="flex bg-base-200/50 border-b border-base-200 shrink-0">
           <button 
             onClick={() => setActiveTab('params')}
             className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 ${activeTab === 'params' ? 'bg-base-100 text-primary border-b-2 border-primary' : 'hover:bg-base-200'}`}
           >
             <List size={12}/> Params
           </button>
           <button 
             onClick={() => setActiveTab('headers')}
             className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 ${activeTab === 'headers' ? 'bg-base-100 text-primary border-b-2 border-primary' : 'hover:bg-base-200'}`}
           >
             <Settings2 size={12}/> Headers
           </button>
           {method !== 'GET' && (
             <button 
                onClick={() => setActiveTab('body')}
                className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 ${activeTab === 'body' ? 'bg-base-100 text-primary border-b-2 border-primary' : 'hover:bg-base-200'}`}
             >
                <FileJson size={12}/> Body
             </button>
           )}
        </div>

        <div className="flex-1 p-2 overflow-y-auto custom-scrollbar">
            {activeTab === 'params' && (
                <KeyValueEditor 
                    layout="row" 
                    items={queryParams} 
                    onChange={(items) => { setQueryParams(items); handleBlur(); }}
                    keyPlaceholder="key"
                    valuePlaceholder="value"
                />
            )}
            {activeTab === 'headers' && (
                <KeyValueEditor 
                    layout="row" 
                    items={headers} 
                    onChange={(items) => { setHeaders(items); handleBlur(); }}
                    keyPlaceholder="Header"
                    valuePlaceholder="Value"
                />
            )}
            {activeTab === 'body' && (
                <div className="h-full flex flex-col">
                    <div className="text-xs text-slate-400 mb-1 flex justify-between px-1">
                        <span>JSON Body</span>
                        <span className="text-[10px] bg-slate-100 px-1 rounded">application/json</span>
                    </div>
                    <textarea 
                        className="textarea textarea-bordered flex-1 w-full font-mono text-xs leading-relaxed resize-none focus:outline-none"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        onBlur={handleBlur}
                        placeholder='{"key": "value"}'
                    />
                </div>
            )}
        </div>
      </div>

      {/* Response Mapping */}
      <div className="form-control">
         <label className="label text-xs font-medium opacity-60 p-1">数据提取路径 (Response Path)</label>
         <input 
            type="text" 
            className="input input-bordered input-sm font-mono text-xs"
            placeholder="例如: data.results"
            value={responsePath}
            onChange={(e) => setResponsePath(e.target.value)}
            onBlur={handleBlur}
         />
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error text-xs py-2 rounded-lg">
          <AlertCircle size={14}/> {error}
        </div>
      )}

      {/* Action */}
      <div className="flex justify-end pt-2 border-t border-base-200">
         <button 
           className="btn btn-sm btn-primary text-white w-full gap-2" 
           onClick={handleFetch}
           disabled={loading}
         >
           {loading ? <Loader2 size={16} className="animate-spin"/> : <Globe size={16} />}
           发送请求 & 预览
         </button>
      </div>
    </div>
  );
};
