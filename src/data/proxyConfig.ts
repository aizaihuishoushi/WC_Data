// 应用配置管理（API Key + 代理）
// 用户填的配置保存到 localStorage，下次自动填入
// 同时会同步到后端 config.json 文件中

export interface ProxyConfig {
  host: string;        // 代理地址，如 127.0.0.1 或 proxy.company.com
  port: string;        // 代理端口，如 7890
  username: string;    // 用户名（可空）
  password: string;    // 密码（可空）
}

export interface AppConfig {
  apiKey: string;
  proxy: ProxyConfig;
}

const STORAGE_KEY = 'worldcup_app_config';

// 从 localStorage 读取配置
export function getAppConfig(): AppConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('[配置] 读取失败:', e);
  }
  return { apiKey: '', proxy: { host: '', port: '', username: '', password: '' } };
}

// 保存配置到 localStorage
export function saveAppConfig(config: AppConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('[配置] 保存失败:', e);
  }
}

// 清除配置
export function clearAppConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// 获取当前配置（从后端）
export async function fetchCurrentConfig(): Promise<AppConfig> {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) throw new Error('获取配置失败');
    const data = await response.json();
    return {
      apiKey: data.apiKey || '',
      proxy: {
        host: data.proxy?.host || '',
        port: data.proxy?.port || '',
        username: data.proxy?.username || '',
        password: '', // 密码不回显
      },
    };
  } catch (e) {
    console.error('[配置] 获取当前配置失败:', e);
    return getAppConfig();
  }
}

// 保存配置到后端（会写入 config.json）
export async function saveConfigToBackend(config: AppConfig): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    const data = await response.json();
    // 同时保存到 localStorage
    if (data.success) {
      saveAppConfig(config);
    }
    return data;
  } catch (e: any) {
    return { success: false, message: `网络错误: ${e?.message || e}` };
  }
}

// 页面加载时：同步 localStorage 配置到后端
export async function syncConfigToBackend(): Promise<void> {
  const localConfig = getAppConfig();
  if (localConfig.apiKey || localConfig.proxy.host) {
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localConfig),
      });
    } catch (e) {
      console.log('[配置] 同步配置失败（不影响正常请求）');
    }
  }
}
