
import { GoogleGenAI, Type } from "@google/genai";
import { WidgetConfig, DashboardParameter } from "../types";
import { useDashboardStore } from "../store/dashboardStore";

// --- 1. Define Interface ---
interface IAIService {
  generateDashboard(prompt: string): Promise<{ widgets: Omit<WidgetConfig, 'id'>[], parameters?: Omit<DashboardParameter, 'id'>[] }>;
  modifyDashboard(currentContext: any, prompt: string): Promise<any>; // Returns updated object(s)
  analyzeData(widget: WidgetConfig): Promise<string>;
  
  // New Methods for Data Source
  generateSQL(prompt: string, schemaDescription?: string): Promise<string>;
  simulateSQLData(sql: string): Promise<any[]>;
}

// --- 2. Prompt Definitions ---
const DASHBOARD_GENERATOR_PROMPT = `
你是一位专业的 AI 仪表盘架构师和数据分析专家。你的目标是根据用户描述生成**纯JSON格式**的仪表盘配置。

**核心组件支持：**
1. **图表类型 (widgets)**：
   - line (折线图): 适合趋势分析
   - bar (柱状图): 适合分类对比
   - area (面积图): 适合累积趋势
   - pie (饼图): 适合占比分析
   - stat (指标卡): 适合核心指标展示
   - table (数据表格): 适合展示明细数据或多维数据
   - composed (组合图): 柱状图+折线图组合
   - radar (雷达图): 多维能力/特征分析
   - scatter (散点图): 相关性分析
   - funnel (漏斗图): 转化流程分析
   - wordCloud (词云图): 文本频率分析
   - radialBar (径向条形图/仪表盘): 适合展示单个或多个 KPI 的达成率（如目标完成度 85%）
   - treemap (矩形树图): 展示具有层级关系的数据，或在分类非常多时展示占比
   - heatmap (热力图): 展示维度交叉分布（如“星期 vs 小时”的活跃度）
   - timeline (时间轴): 展示项目里程碑、版本更新或操作日志

2. **全局参数 (parameters)**：
   - text (文本框), select (下拉框), date (日期), date-range (日期范围)

**严格生成规则：**
1. **纯JSON输出**：只返回JSON对象，严禁包含 Markdown 标记（如 \`\`\`json）、解释说明或注释。
2. **数据源策略**：
   - 默认使用 'static' 模式生成高质量的模拟数据。
   - 模拟数据 (staticData) 必须真实、丰富，不得为空。
   - 表格类型 (table) 的数据应包含多个字段（如：姓名、日期、金额、状态等）。
3. **布局建议**：
   - colSpan 范围 1-12（12为全宽）。通常指标卡占 3，小型图表占 6，复杂图表或表格占 12。
   - height 通常在 300-500 之间。
4. **语言要求**：所有标题、描述、标签及模拟数据内容必须使用**中文**。
5. **逻辑严谨**：如果用户提到“筛选”、“搜索”或“时间段”，必须生成对应的 parameters。

**数据结构指南：**
- table: 数据可以是任意键值对数组，AI 应根据场景生成合理的列。
- stat: 数据包含 name 和 value，可带 trend (百分比，如 15.5 表示上升15.5%)。
- radialBar: 数据包含 name 和 value（通常是百分比 0-100）。
- treemap: 数据包含 name 和 value。
- heatmap: 数据包含 x (维度1), y (维度2), value (数值)。
- timeline: 数据包含 name (标题), description (详情), date (时间), status (状态，如 'success', 'warning', 'error', 'info')。
- 其他图表: 默认使用 name 和 value。

JSON 结构示例：
{
  "widgets": [{ "type": "bar", "title": "营收统计", "data": [...], "colSpan": 6, "height": 350 }],
  "parameters": [{ "key": "date", "label": "日期范围", "type": "date-range" }]
}
`;

const DASHBOARD_MODIFIER_PROMPT = `
你是一位专业的数据可视化专家，负责优化和修改仪表盘配置。
请根据用户的修改意图，对提供的 JSON 进行精确调整。

**修改原则：**
1. **保持结构**：仅修改必要的字段，保持其他配置项不变。
2. **类型转换**：如果用户要求“换成表格”或“改成折线图”，请更新 type 字段并确保 data 结构适配。
3. **丰富内容**：如果用户要求“增加数据”或“让数据更真实”，请生成更详细的 staticData。
4. **支持类型**：line, bar, area, pie, stat, table, composed, radar, scatter, funnel, wordCloud, radialBar, treemap, heatmap, timeline。
5. **禁止 Markdown**：只返回纯 JSON 对象。

**中文要求**：所有新增或修改的文字必须是中文。
`;

const SQL_GENERATOR_PROMPT = `
你是一位 SQL 专家。请根据用户的自然语言描述，生成标准的 SQL 查询语句。
假设有一个通用的电商数据库，包含 users, orders, products, sales 等常见表格。
支持参数语法: 使用 {{variableName}} 代表动态变量。
只返回纯文本 SQL 语句，不要包含 markdown 格式或解释。
`;

// --- 3. Providers ---

// A. Gemini Provider
class GeminiProvider implements IAIService {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new GoogleGenAI({ apiKey });
    // Fix: Default to a current supported model name
    this.model = model || 'gemini-3-flash-preview';
  }

  async generateDashboard(prompt: string): Promise<{ widgets: Omit<WidgetConfig, 'id'>[], parameters?: Omit<DashboardParameter, 'id'>[] }> {
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: `创建一个仪表盘配置，需求如下: ${prompt}。返回 JSON 对象包含 widgets 和 parameters。`,
        config: {
          systemInstruction: DASHBOARD_GENERATOR_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
                parameters: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            key: { type: Type.STRING },
                            label: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ['text', 'select', 'date', 'date-range'] },
                            defaultValue: { type: Type.STRING },
                            loadedOptions: { 
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: { label: {type: Type.STRING}, value: {type: Type.STRING} }
                                }
                            }
                        },
                        required: ['key', 'label', 'type']
                    }
                },
                widgets: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, enum: ['line', 'bar', 'area', 'pie', 'stat', 'composed', 'radar', 'scatter', 'funnel', 'wordCloud', 'table', 'radialBar', 'treemap', 'heatmap', 'timeline'] },
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            colSpan: { type: Type.INTEGER },
                            height: { type: Type.INTEGER },
                            dataSource: {
                                type: Type.OBJECT,
                                properties: {
                                    mode: { type: Type.STRING, enum: ['static', 'sql', 'api']},
                                    sql: { type: Type.OBJECT, properties: { query: {type: Type.STRING} } },
                                    api: { type: Type.OBJECT, properties: { url: {type: Type.STRING}, method: {type: Type.STRING}, responsePath: {type: Type.STRING} } },
                                    staticData: { 
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            // Allow arbitrary properties for flexibility (especially for tables)
                                            additionalProperties: true,
                                            properties: {
                                                name: { type: Type.STRING },
                                                value: { type: Type.NUMBER },
                                                trend: { type: Type.NUMBER },
                                                x: { type: Type.STRING },
                                                y: { type: Type.STRING },
                                                date: { type: Type.STRING },
                                                status: { type: Type.STRING },
                                                description: { type: Type.STRING }
                                            }
                                        }
                                    }
                                }
                            },
                            data: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    // Allow arbitrary properties for flexibility (especially for tables)
                                    additionalProperties: true,
                                    properties: {
                                        name: { type: Type.STRING },
                                        value: { type: Type.NUMBER },
                                        trend: { type: Type.NUMBER },
                                        x: { type: Type.STRING },
                                        y: { type: Type.STRING },
                                        date: { type: Type.STRING },
                                        status: { type: Type.STRING },
                                        description: { type: Type.STRING }
                                    }
                                }
                            }
                        },
                        required: ['type', 'title', 'data', 'colSpan', 'height']
                    }
                }
            }
          }
        }
      });
      const text = response.text;
      const json = text ? JSON.parse(text) : { widgets: [] };
      return { widgets: json.widgets || [], parameters: json.parameters || [] };
    } catch (e) {
      console.error("Gemini Generate Error", e);
      throw e;
    }
  }

  async modifyDashboard(currentContext: any, prompt: string): Promise<any> {
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: `
        当前配置 JSON: ${JSON.stringify(currentContext)}
        用户修改需求: ${prompt}
        请返回修改后的 JSON。
        `,
        config: {
          systemInstruction: DASHBOARD_MODIFIER_PROMPT,
          responseMimeType: "application/json",
        }
      });
      
      const text = response.text;
      return text ? JSON.parse(text) : currentContext;
    } catch (e) {
      console.error("Gemini Modify Error", e);
      throw e;
    }
  }

  async analyzeData(widget: WidgetConfig): Promise<string> {
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: `分析此图表数据并提供简明的商业洞察（50字以内）。
        图表标题: ${widget.title}
        数据: ${JSON.stringify(widget.data)}`,
      });
      return response.text || "无法生成洞察。";
    } catch (e) {
      console.error("Gemini Analysis Error", e);
      return "分析出错。";
    }
  }

  async generateSQL(prompt: string): Promise<string> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        systemInstruction: SQL_GENERATOR_PROMPT
      }
    });
    return response.text?.replace(/```sql|```/g, '').trim() || "";
  }

  async simulateSQLData(sql: string): Promise<any[]> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: `Execute this SQL simulation: "${sql}". Generate realistic JSON result array (max 10 items). keys should include 'name', 'value' at minimum if possible.`,
      config: {
        responseMimeType: "application/json"
      }
    });
    const text = response.text;
    return text ? JSON.parse(text) : [];
  }
}

// B. Custom / OpenAI Compatible Provider
class CustomAIProvider implements IAIService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey: string, baseUrl: string, model: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.model = model || 'gpt-3.5-turbo';
  }

  private async fetchOpenAI(messages: any[], jsonMode = false) {
    const url = `${this.baseUrl}/chat/completions`;
    const body: any = {
      model: this.model,
      messages: messages,
      temperature: 0.7,
    };

    if (jsonMode) {
      body.response_format = { type: "json_object" };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Custom AI API Error: ${res.status} - ${err}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  }

  async generateDashboard(prompt: string): Promise<{ widgets: Omit<WidgetConfig, 'id'>[], parameters?: Omit<DashboardParameter, 'id'>[] }> {
    const systemPrompt = DASHBOARD_GENERATOR_PROMPT + "\n 返回格式必须是纯 JSON 对象 { widgets: [], parameters: [] }，不要包含 Markdown 标记。";
    const content = await this.fetchOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ], true); 
    
    try {
      const cleanJson = content.replace(/```json\n?|```/g, '');
      const parsed = JSON.parse(cleanJson);
      // Compatibility if AI returns array or object
      if (Array.isArray(parsed)) return { widgets: parsed, parameters: [] };
      return { widgets: parsed.widgets || [], parameters: parsed.parameters || [] };
    } catch (e) {
      console.error("Custom AI Parse Error", e);
      throw new Error("AI 返回格式错误，无法解析 JSON");
    }
  }

  async modifyDashboard(currentContext: any, prompt: string): Promise<any> {
    const systemPrompt = DASHBOARD_MODIFIER_PROMPT;
    const content = await this.fetchOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: `当前配置: ${JSON.stringify(currentContext)}\n 需求: ${prompt}` }
    ], true);

    try {
      const cleanJson = content.replace(/```json\n?|```/g, '');
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error("Custom AI Modify Error", e);
      throw new Error("解析修改结果失败");
    }
  }

  async analyzeData(widget: WidgetConfig): Promise<string> {
    const content = await this.fetchOpenAI([
      { role: "system", content: "你是一个商业数据分析师。" },
      { role: "user", content: `分析此图表数据并提供简明的商业洞察（50字以内）。标题: ${widget.title}, 数据: ${JSON.stringify(widget.data)}` }
    ]);
    return content;
  }

  async generateSQL(prompt: string): Promise<string> {
    const content = await this.fetchOpenAI([
      { role: "system", content: SQL_GENERATOR_PROMPT },
      { role: "user", content: prompt }
    ]);
    return content.replace(/```sql|```/g, '').trim();
  }

  async simulateSQLData(sql: string): Promise<any[]> {
    const content = await this.fetchOpenAI([
      { role: "system", content: "You are a database engine. Return JSON array result." },
      { role: "user", content: `Execute SQL: ${sql}. Return fake JSON data.` }
    ], true);
    return JSON.parse(content);
  }
}

// --- 4. Factory ---
class AIFactory {
  static getService(): IAIService | null {
    const settings = useDashboardStore.getState().settings.ai;
    const apiKey = settings.apiKey || process.env.API_KEY || '';
    
    // Check API key requirement for Gemini
    if (settings.provider === 'gemini' && !apiKey && !process.env.API_KEY) {
       return null;
    }
    
    // Check API key requirement for all other providers
    if (settings.provider !== 'gemini' && !apiKey) {
      return null;
    }

    // Use Gemini provider only for gemini
    if (settings.provider === 'gemini') {
      return new GeminiProvider(apiKey, settings.model);
    } 
    // Use CustomAIProvider for all other providers (OpenAI compatible)
    else {
      let baseUrl = settings.baseUrl;
      
      // Set default base URL if not provided
      if (!baseUrl) {
        switch(settings.provider) {
          case 'openai':
            baseUrl = 'https://api.openai.com/v1';
            break;
          case 'tongyi':
            baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
            break;
          case 'deepseek':
            baseUrl = 'https://api.deepseek.com/v1';
            break;
          case 'anthropic':
            baseUrl = 'https://api.anthropic.com/v1';
            break;
          case 'custom':
          default:
            baseUrl = 'https://api.openai.com/v1';
        }
      }
      
      return new CustomAIProvider(apiKey, baseUrl, settings.model);
    }
  }
}

// --- 5. Exported Functions (Facade) ---
export const generateDashboardFromText = async (prompt: string): Promise<{ widgets: Omit<WidgetConfig, 'id'>[], parameters?: Omit<DashboardParameter, 'id'>[] }> => {
  const service = AIFactory.getService();
  if (!service) throw new Error("请先在设置中配置 API Key");
  return await service.generateDashboard(prompt);
};

export const modifyDashboardConfig = async (currentContext: any, prompt: string): Promise<any> => {
  const service = AIFactory.getService();
  if (!service) throw new Error("请先在设置中配置 API Key");
  return await service.modifyDashboard(currentContext, prompt);
};

export const analyzeChartData = async (widget: WidgetConfig): Promise<string> => {
  const service = AIFactory.getService();
  if (!service) return "请配置 API Key";
  return await service.analyzeData(widget);
};

export const generateSQLFromText = async (prompt: string): Promise<string> => {
  const service = AIFactory.getService();
  if (!service) throw new Error("请先在设置中配置 API Key");
  return await service.generateSQL(prompt);
};

export const simulateSQLExecution = async (sql: string): Promise<any[]> => {
  const service = AIFactory.getService();
  if (!service) throw new Error("请先在设置中配置 API Key");
  return await service.simulateSQLData(sql);
};