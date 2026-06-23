package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"
)

// ==================== 配置管理 ====================
// API Key 和代理配置支持：
// 1. 环境变量（启动时读取）
// 2. 配置文件（config.json，优先级高于环境变量）
// 3. 前端运行时配置（优先级最高，存入 config.json）
// ============================================================

type AppConfig struct {
	APIKey   string `json:"apiKey"`
	Proxy    ProxyConfig `json:"proxy"`
}

type ProxyConfig struct {
	Host     string `json:"host"`
	Port     string `json:"port"`
	Username string `json:"username"`
	Password string `json:"password"`
}

var (
	runtimeConfig = AppConfig{}
	configMu     sync.RWMutex
	configPath   string
)

// loadConfig 加载配置文件，优先级：config.json > 环境变量
func loadConfig() {
	// 优先从环境变量读取默认值
	if envKey := os.Getenv("API_KEY"); envKey != "" {
		runtimeConfig.APIKey = envKey
	}

	// 尝试读取配置文件（优先级更高）
	cfgFile := getConfigPath()
	if data, err := os.ReadFile(cfgFile); err == nil {
		if cfg, err := parseConfig(string(data)); err == nil {
			// 配置文件中的值会覆盖环境变量
			if cfg.APIKey != "" {
				runtimeConfig.APIKey = cfg.APIKey
			}
			if cfg.Proxy.Host != "" || cfg.Proxy.Port != "" {
				runtimeConfig.Proxy = cfg.Proxy
			}
			fmt.Printf("[配置] 已从配置文件加载: %s\n", cfgFile)
		}
	}

	// 打印当前配置状态
	if runtimeConfig.APIKey != "" {
		fmt.Println("[配置] API Key: 已配置 ✓")
	} else {
		fmt.Println("[配置] API Key: 未配置（请在界面中填写）")
	}
}

// saveConfig 保存配置到文件
func saveConfig() error {
	cfgFile := getConfigPath()
	data, err := json.MarshalIndent(runtimeConfig, "", "  ")
	if err != nil {
		return fmt.Errorf("序列化配置失败: %v", err)
	}
	if err := os.WriteFile(cfgFile, data, 0644); err != nil {
		return fmt.Errorf("保存配置文件失败: %v", err)
	}
	fmt.Printf("[配置] 已保存到: %s\n", cfgFile)
	return nil
}

func getConfigPath() string {
	if configPath != "" {
		return configPath
	}
	exe, _ := os.Executable()
	dir := filepath.Dir(exe)
	return filepath.Join(dir, "config.json")
}

func parseConfig(data string) (AppConfig, error) {
	var cfg AppConfig
	if err := json.Unmarshal([]byte(data), &cfg); err != nil {
		return cfg, err
	}
	return cfg, nil
}

func getAPIKey() string {
	configMu.RLock()
	defer configMu.RUnlock()
	return runtimeConfig.APIKey
}

func getProxy() ProxyConfig {
	configMu.RLock()
	defer configMu.RUnlock()
	return runtimeConfig.Proxy
}

func setProxy(p ProxyConfig) {
	configMu.Lock()
	runtimeConfig.Proxy = p
	configMu.Unlock()
}

func clearProxy() {
	configMu.Lock()
	runtimeConfig.Proxy = ProxyConfig{}
	configMu.Unlock()
}

// ============================================================

// findAvailablePort 尝试找到一个可用的端口
func findAvailablePort(startPort int, maxAttempts int) int {
	for i := 0; i < maxAttempts; i++ {
		port := startPort + i
		ln, err := net.Listen("tcp", fmt.Sprintf(":%d", port))
		if err == nil {
			ln.Close()
			return port
		}
		fmt.Printf("⚠️  端口 %d 已被占用，尝试下一个端口...\n", port)
	}
	return -1
}

func main() {
	defaultPort := 3578
	port := flag.Int("port", defaultPort, "HTTP server port")
	flag.Parse()

	// 获取当前可执行文件所在目录
	exe, err := os.Executable()
	if err != nil {
		exe = "./server"
	}
	dir := filepath.Dir(exe)

	// 设置配置文件路径
	configPath = filepath.Join(dir, "config.json")

	// 加载配置（环境变量 + 配置文件）
	loadConfig()

	distDir := filepath.Join(dir, "dist")
	if _, err := os.Stat(distDir); err != nil {
		// 如果 dist 不存在，尝试从当前目录找
		distDir = "./dist"
	}

	// 尝试绑定端口，如果失败则自动查找可用端口
	listenPort := *port
	ln, err := net.Listen("tcp", fmt.Sprintf(":%d", listenPort))
	if err != nil {
		fmt.Printf("❌ 端口 %d 绑定失败: %v\n", listenPort, err)
		fmt.Println("🔍 正在自动查找可用端口...")
		listenPort = findAvailablePort(defaultPort, 20)
		if listenPort == -1 {
			fmt.Println("❌ 无法找到可用端口，请手动指定端口或关闭占用端口的程序")
			fmt.Println("   使用方法: server.exe -port 3578")
			os.Exit(1)
		}
		fmt.Printf("✅ 找到可用端口: %d\n", listenPort)
		ln, err = net.Listen("tcp", fmt.Sprintf(":%d", listenPort))
		if err != nil {
			fmt.Printf("❌ 端口 %d 绑定失败: %v\n", listenPort, err)
			os.Exit(1)
		}
	}

	url := fmt.Sprintf("http://localhost:%d", listenPort)

	fmt.Printf("\n========================================\n")
	fmt.Printf("  世界杯信息服务器\n")
	fmt.Printf("  静态目录: %s\n", distDir)
	fmt.Printf("  API源: football-data.org\n")
	fmt.Printf("  API Key: ")
	if getAPIKey() == "" {
		fmt.Printf("未配置（请在界面中填写）\n")
	} else {
		fmt.Printf("已配置 ✓\n")
	}
	fmt.Printf("========================================\n\n")
	fmt.Printf("🚀 服务器已启动，请打开浏览器访问: %s\n", url)
	fmt.Printf("📝 按 Ctrl+C 停止服务器\n\n")
	fmt.Printf("💡 首次使用：请在界面右上角「设置」中填写 API Key\n\n")

	// 自动打开浏览器
	go func() {
		time.Sleep(500 * time.Millisecond)
		if err := openBrowser(url); err != nil {
			fmt.Printf("⚠️  无法自动打开浏览器，请手动访问: %s\n", url)
		}
	}()

	// API 路由
	http.HandleFunc("/api/matches", handleMatchesAPI)
	http.HandleFunc("/api/proxy", handleProxyAPI)
	http.HandleFunc("/api/config", handleConfigAPI)

	// 静态文件
	fs := http.FileServer(http.Dir(distDir))
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// SPA 路由支持：非根路径且不含扩展名的请求也返回 index.html
		if r.URL.Path != "/" && !strings.Contains(r.URL.Path, ".") {
			http.ServeFile(w, r, filepath.Join(distDir, "index.html"))
			return
		}
		fs.ServeHTTP(w, r)
	})

	log.Fatal(http.Serve(ln, nil))
}

func handleMatchesAPI(w http.ResponseWriter, r *http.Request) {
	// 允许跨域
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	// 如果未配置 Key，直接返回回退数据
	if getAPIKey() == "" {
		fmt.Println("[API] API Key 未配置，使用官方分组回退数据")
		w.Write([]byte(getFallbackData()))
		return
	}

	// 尝试请求真实 API（带超时和重试）
	// 策略：
	// 1. 如果用户配置了代理 → 优先用代理
	// 2. 否则直连
	// 3. 都失败 → 回退数据
	fmt.Println("[API] 正在请求 football-data.org...")

	proxy := getProxy()
	hasProxy := proxy.Host != "" && proxy.Port != ""

	var body []byte
	var lastErr error

	if hasProxy {
		// 优先使用用户配置的代理
		fmt.Println("[API] 检测到用户配置的代理，优先使用...")
		proxyClient, proxyErr := buildProxyClientWithProxy(proxy)
		if proxyErr != nil {
			fmt.Printf("[API] 创建代理客户端失败: %v，尝试直连\n", proxyErr)
			lastErr = proxyErr
		} else {
			body, lastErr = tryFetchFromAPI(proxyClient, getAPIKey())
			if lastErr == nil {
				fmt.Println("[API] 代理请求成功 ✓")
			} else {
				fmt.Printf("[API] 代理请求失败: %v，尝试直连...\n", lastErr)
			}
		}
	}

	// 如果代理没配置或失败，尝试直连
	if lastErr != nil || !hasProxy {
		fmt.Println("[API] 尝试直连...")
		body, lastErr = tryFetchFromAPI(nil, getAPIKey())
		if lastErr != nil {
			fmt.Printf("[API] 直连也失败: %v\n", lastErr)
		} else {
			fmt.Println("[API] 直连成功 ✓")
		}
	}

	if lastErr != nil {
		fmt.Println("[API] 直连和代理都失败，使用官方分组回退数据")
		w.Write([]byte(getFallbackData()))
		return
	}

	fmt.Println("[API] 返回 real-time 数据成功")
	w.Write(body)
}

// buildProxyClient 从环境变量读取代理配置，构造带代理的 HTTP 客户端
// 支持 HTTP_PROXY / HTTPS_PROXY / http_proxy / https_proxy（多种大小写）
// 如果环境变量中未设置，则从系统代理配置读取（Windows 注册表或系统设置）
func buildProxyClient() (*http.Client, error) {
	proxyURL := getProxyURL()
	if proxyURL == "" {
		return nil, fmt.Errorf("未配置代理环境变量 (HTTP_PROXY/HTTPS_PROXY)")
	}

	fmt.Printf("[API] 检测到代理: %s\n", proxyURL)

	// 解析代理URL
	parsed, err := url.Parse(proxyURL)
	if err != nil {
		return nil, fmt.Errorf("代理URL格式错误: %v", err)
	}

	transport := &http.Transport{
		Proxy: http.ProxyURL(parsed),
		TLSHandshakeTimeout:   20 * time.Second,
		ResponseHeaderTimeout: 20 * time.Second,
		MaxIdleConns:          10,
		IdleConnTimeout:       60 * time.Second,
	}

	return &http.Client{
		Timeout:   30 * time.Second,
		Transport: transport,
	}, nil
}

// getProxyURL 获取代理URL（从用户配置或环境变量）
func getProxyURL() string {
	// 优先使用用户运行时配置的代理
	proxy := getProxy()
	if proxy.Host != "" && proxy.Port != "" {
		// 拼接代理URL
		var proxyURL string
		if proxy.Username != "" && proxy.Password != "" {
			proxyURL = fmt.Sprintf("http://%s:%s@%s:%s", proxy.Username, proxy.Password, proxy.Host, proxy.Port)
		} else {
			proxyURL = fmt.Sprintf("http://%s:%s", proxy.Host, proxy.Port)
		}
		return proxyURL
	}

	// 其次使用环境变量
	envs := []string{"HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy", "ALL_PROXY", "all_proxy"}
	for _, env := range envs {
		if val := os.Getenv(env); val != "" {
			return val
		}
	}
	return ""
}

// buildProxyClientWithProxy 使用指定代理配置构建客户端
func buildProxyClientWithProxy(proxy ProxyConfig) (*http.Client, error) {
	var proxyURL string
	if proxy.Username != "" && proxy.Password != "" {
		proxyURL = fmt.Sprintf("http://%s:%s@%s:%s", proxy.Username, proxy.Password, proxy.Host, proxy.Port)
	} else {
		proxyURL = fmt.Sprintf("http://%s:%s", proxy.Host, proxy.Port)
	}

	fmt.Printf("[代理] 使用代理: %s:%s\n", proxy.Host, proxy.Port)

	parsed, err := url.Parse(proxyURL)
	if err != nil {
		return nil, fmt.Errorf("代理URL格式错误: %v", err)
	}

	transport := &http.Transport{
		Proxy: http.ProxyURL(parsed),
		TLSHandshakeTimeout:   20 * time.Second,
		ResponseHeaderTimeout: 20 * time.Second,
		MaxIdleConns:          10,
		IdleConnTimeout:       60 * time.Second,
	}

	return &http.Client{
		Timeout:   30 * time.Second,
		Transport: transport,
	}, nil
}

// tryFetchFromAPI 实际发起 API 请求，支持传入自定义 client（直连/代理）
// 重试3次，每次间隔3秒
func tryFetchFromAPI(client *http.Client, apiKey string) ([]byte, error) {
	if client == nil {
		client = &http.Client{
			Timeout: 30 * time.Second,
			Transport: &http.Transport{
				TLSHandshakeTimeout:   20 * time.Second,
				ResponseHeaderTimeout: 20 * time.Second,
				MaxIdleConns:          10,
				IdleConnTimeout:       60 * time.Second,
			},
		}
	}

	var lastErr error
	for attempt := 1; attempt <= 3; attempt++ {
		req, reqErr := http.NewRequest("GET",
			"https://api.football-data.org/v4/competitions/WC/matches", nil)
		if reqErr != nil {
			lastErr = reqErr
			fmt.Printf("[API] 创建请求失败 (第%d次): %v\n", attempt, reqErr)
			time.Sleep(2 * time.Second)
			continue
		}

		req.Header.Set("X-Auth-Token", apiKey)
		req.Header.Set("User-Agent", "WorldCupApp/1.0")

		resp, err := client.Do(req)
		if err != nil {
			lastErr = err
			fmt.Printf("[API] 请求失败 (第%d次): %v\n", attempt, err)
			if attempt < 3 {
				time.Sleep(3 * time.Second)
			}
			continue
		}

		if resp.StatusCode != http.StatusOK {
			lastErr = fmt.Errorf("响应状态码: %d", resp.StatusCode)
			fmt.Printf("[API] 响应异常 (第%d次): %d\n", attempt, resp.StatusCode)
			resp.Body.Close()
			if attempt < 3 {
				time.Sleep(3 * time.Second)
			}
			continue
		}

		defer resp.Body.Close()
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			lastErr = err
			fmt.Printf("[API] 读取响应失败 (第%d次): %v\n", attempt, err)
			continue
		}

		fmt.Printf("[API] 请求成功 (第%d次)\n", attempt)
		return body, nil
	}
	return nil, lastErr
}

// handleProxyAPI 处理前端提交的代理配置
// POST /api/proxy
// Body: { enabled: bool, host: string, port: string, username: string, password: string }
// 流程：保存配置 → 立刻用该代理重新请求API → 返回结果
func handleProxyAPI(w http.ResponseWriter, r *http.Request) {
	// 允许跨域
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "仅支持POST方法",
		})
		return
	}

	// 解析请求体
	var req struct {
		Enabled  bool   `json:"enabled"`
		Host     string `json:"host"`
		Port     string `json:"port"`
		Username string `json:"username"`
		Password string `json:"password"`
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "读取请求体失败: " + err.Error(),
		})
		return
	}

	if err := json.Unmarshal(body, &req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "JSON格式错误: " + err.Error(),
		})
		return
	}

	// 校验必填字段
	if req.Host == "" || req.Port == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "代理地址和端口不能为空",
		})
		return
	}

	// 保存到运行时代理配置
	setProxy(ProxyConfig{
		Host:     req.Host,
		Port:     req.Port,
		Username: req.Username,
		Password: req.Password,
	})

	fmt.Printf("\n[代理] 用户提交了新的代理配置: %s:%s (用户名: %s)\n",
		req.Host, req.Port,
		ternary(req.Username != "", req.Username, "无"))

	// 立刻用该代理测试一次 API
	if getAPIKey() == "" {
		// 没配置 API Key，无法测试
		saveConfig()
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"message": "API Key 未配置，但代理已保存。\n请先在「设置」中填写 API Key。",
		})
		return
	}

	fmt.Println("[代理] 正在用新代理测试 API 连接...")

	// 先清掉之前的 client 缓存，强制重新创建
	proxyClient, err := buildProxyClient()
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "代理配置已保存，但创建代理客户端失败: " + err.Error(),
		})
		return
	}

	// 用新代理尝试请求（只重试1次，节省时间）
	testClient := *proxyClient
	testClient.Timeout = 15 * time.Second
	apiBody, err := tryFetchFromAPI(&testClient, getAPIKey())
	if err != nil {
		// 代理测试失败，回滚配置
		clearProxy()
		fmt.Printf("[代理] 代理测试失败: %v\n", err)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "代理测试失败（已回滚配置）: " + err.Error(),
		})
		return
	}

	// 验证返回数据格式
	var apiResp map[string]interface{}
	if err := json.Unmarshal(apiBody, &apiResp); err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"message": "代理连接成功，但返回数据格式异常: " + err.Error(),
		})
		return
	}

	// 检查 matches 字段
	if matches, ok := apiResp["matches"].([]interface{}); ok {
		fmt.Printf("[代理] ✓ 代理测试成功！获取到 %d 场比赛数据\n", len(matches))
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"message": fmt.Sprintf("代理连接成功 ✓ 获取到 %d 场比赛数据", len(matches)),
			"count":   len(matches),
		})
	} else {
		fmt.Println("[代理] ✓ 代理测试成功！返回数据无 matches 字段")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"message": "代理连接成功 ✓（API 返回数据未含比赛列表）",
		})
	}
}

func ternary(cond bool, a, b string) string {
	if cond {
		return a
	}
	return b
}

// handleConfigAPI 处理前端提交的配置（API Key + 代理）
// GET  /api/config  - 获取当前配置
// POST /api/config  - 保存配置
func handleConfigAPI(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// GET: 返回当前配置
	if r.Method == "GET" {
		configMu.RLock()
		cfg := runtimeConfig
		configMu.RUnlock()

		// 不返回密码
		safeCfg := map[string]interface{}{
			"apiKey":  cfg.APIKey,
			"apiKeyConfigured": cfg.APIKey != "",
			"proxy": map[string]interface{}{
				"host":     cfg.Proxy.Host,
				"port":     cfg.Proxy.Port,
				"username": cfg.Proxy.Username,
				"hasPassword": cfg.Proxy.Password != "",
			},
		}
		json.NewEncoder(w).Encode(safeCfg)
		return
	}

	// POST: 保存配置
	if r.Method != "POST" {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "仅支持GET和POST方法",
		})
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "读取请求体失败: " + err.Error(),
		})
		return
	}

	var req struct {
		APIKey   string `json:"apiKey"`
		Proxy    ProxyConfig `json:"proxy"`
	}

	if err := json.Unmarshal(body, &req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "JSON格式错误: " + err.Error(),
		})
		return
	}

	// 保存配置
	configMu.Lock()
	if req.APIKey != "" {
		runtimeConfig.APIKey = req.APIKey
	}
	if req.Proxy.Host != "" || req.Proxy.Port != "" {
		runtimeConfig.Proxy = req.Proxy
	}
	configMu.Unlock()

	if err := saveConfig(); err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "保存配置失败: " + err.Error(),
		})
		return
	}

	fmt.Println("[配置] ✓ 配置已保存")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "配置已保存",
	})
}

// getFallbackData 返回官方分组信息（不含假比分）
// 数据来源：2026年美加墨世界杯官方抽签结果（FIFA 2025年12月5日）
func getFallbackData() string {
	return `{
  "count": 0,
  "matches": [],
  "fallback": true,
  "groups": [
    {"group": "A", "teams": ["Mexico", "South Africa", "Korea Republic", "Denmark"]},
    {"group": "B", "teams": ["Canada", "Italy", "Qatar", "Switzerland"]},
    {"group": "C", "teams": ["Brazil", "Morocco", "Haiti", "Scotland"]},
    {"group": "D", "teams": ["United States", "Paraguay", "Australia", "Turkey"]},
    {"group": "E", "teams": ["Germany", "Curaçao", "Côte d'Ivoire", "Ecuador"]},
    {"group": "F", "teams": ["Netherlands", "Japan", "Poland", "Tunisia"]},
    {"group": "G", "teams": ["Belgium", "Egypt", "IR Iran", "New Zealand"]},
    {"group": "H", "teams": ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"]},
    {"group": "I", "teams": ["France", "Senegal", "Iraq", "Norway"]},
    {"group": "J", "teams": ["Argentina", "Algeria", "Austria", "Jordan"]},
    {"group": "K", "teams": ["Portugal", "Jamaica", "Uzbekistan", "Colombia"]},
    {"group": "L", "teams": ["England", "Croatia", "Ghana", "Panama"]}
  ],
  "note": "API访问受限或Key未配置，当前展示官方分组信息。如需实时比分，请在 server.go 中配置有效的 API_KEY。"
}`
}

// ========= 跨平台浏览器打开 =========
func openBrowser(url string) error {
	var cmd *exec.Cmd

	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", "", url)
	case "darwin": // macOS
		cmd = exec.Command("open", url)
	case "linux":
		cmd = exec.Command("xdg-open", url)
	default:
		// 尝试 xdg-open，失败就让用户手动打开
		cmd = exec.Command("xdg-open", url)
	}

	return cmd.Start()
}
