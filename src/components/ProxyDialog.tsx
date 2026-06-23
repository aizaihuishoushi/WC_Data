import { useState, useEffect } from 'react';
import { AppConfig, getAppConfig, saveAppConfig, fetchCurrentConfig, saveConfigToBackend, clearAppConfig } from '../data/proxyConfig';
import { X, Loader2, CheckCircle2, AlertCircle, Settings, Trash2, Key } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void; // 配置成功后回调（让前端重新拉数据）
}

export default function SettingsDialog({ open, onClose, onSuccess }: SettingsDialogProps) {
  const [config, setConfig] = useState<AppConfig>(getAppConfig());
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (open) {
      // 加载当前配置
      fetchCurrentConfig().then(cfg => {
        setConfig(cfg);
        setResult(null);
      });
    }
  }, [open]);

  if (!open) return null;

  const handleSave = async () => {
    if (!config.apiKey) {
      setResult({ success: false, message: '请填写 API Key' });
      return;
    }

    setSaving(true);
    setResult(null);

    const res = await saveConfigToBackend(config);
    setSaving(false);
    setResult({ success: res.success, message: res.message });

    if (res.success) {
      // 保存成功，2秒后自动关闭并刷新数据
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    }
  };

  const handleClear = () => {
    clearAppConfig();
    setConfig({ apiKey: '', proxy: { host: '', port: '', username: '', password: '' } });
    setResult({ success: true, message: '已清除所有配置' });
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a2e] rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#e94560]" />
            <h3 className="text-lg font-bold text-white">设置</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          请填写 football-data.org 的 API Key。
          <a href="https://www.football-data.org/register" target="_blank" rel="noopener noreferrer"
             className="text-[#e94560] hover:underline ml-1">
            前往注册获取免费API Key →
          </a>
        </p>

        {/* API Key */}
        <div className="mb-4">
          <label className="text-xs text-gray-400 block mb-1 flex items-center gap-1">
            <Key className="w-3 h-3" />
            API Key <span className="text-red-400">*</span>
          </label>
          <input
            type="password"
            value={config.apiKey}
            onChange={e => setConfig({ ...config, apiKey: e.target.value })}
            placeholder="请输入你的 API Key"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-[#e94560] focus:outline-none"
          />
        </div>

        <div className="border-t border-white/10 my-4 pt-4">
          <p className="text-sm text-gray-400 mb-3">代理设置（可选，如果API直连失败）</p>

          {/* 代理地址 */}
          <div className="mb-3">
            <label className="text-xs text-gray-400 block mb-1">代理地址</label>
            <input
              type="text"
              value={config.proxy.host}
              onChange={e => setConfig({ ...config, proxy: { ...config.proxy, host: e.target.value } })}
              placeholder="127.0.0.1 或 proxy.company.com"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-[#e94560] focus:outline-none"
            />
          </div>

          {/* 代理端口 */}
          <div className="mb-3">
            <label className="text-xs text-gray-400 block mb-1">代理端口</label>
            <input
              type="text"
              value={config.proxy.port}
              onChange={e => setConfig({ ...config, proxy: { ...config.proxy, port: e.target.value } })}
              placeholder="7890"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-[#e94560] focus:outline-none"
            />
          </div>

          {/* 用户名（可空） */}
          <div className="mb-3">
            <label className="text-xs text-gray-400 block mb-1">用户名（可空）</label>
            <input
              type="text"
              value={config.proxy.username}
              onChange={e => setConfig({ ...config, proxy: { ...config.proxy, username: e.target.value } })}
              placeholder="如不需要认证则留空"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-[#e94560] focus:outline-none"
            />
          </div>

          {/* 密码（可空） */}
          <div className="mb-3">
            <label className="text-xs text-gray-400 block mb-1">密码（可空）</label>
            <input
              type="password"
              value={config.proxy.password}
              onChange={e => setConfig({ ...config, proxy: { ...config.proxy, password: e.target.value } })}
              placeholder="如不需要认证则留空"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-[#e94560] focus:outline-none"
            />
          </div>
        </div>

        {/* 提示信息 */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
          <p className="text-xs text-blue-300">
            💡 配置会保存到服务器，重启后依然有效。
            免费API Key有请求频率限制（约10次/分钟）。
          </p>
        </div>

        {/* 测试结果 */}
        {result && (
          <div
            className={`mb-4 p-3 rounded-lg flex items-start gap-2 text-sm ${
              result.success
                ? 'bg-green-500/10 text-green-300 border border-green-500/30'
                : 'bg-red-500/10 text-red-300 border border-red-500/30'
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            )}
            <span className="break-all">{result.message}</span>
          </div>
        )}

        {/* 按钮组 */}
        <div className="flex gap-2">
          <button
            onClick={handleClear}
            disabled={saving}
            className="flex items-center justify-center gap-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            清除
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-all disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !config.apiKey}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#e94560] hover:bg-[#d63d56] text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                保存中
              </>
            ) : (
              '保存并测试'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
