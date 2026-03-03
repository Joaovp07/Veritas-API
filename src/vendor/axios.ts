export type AxiosRequestConfig = {
  baseURL?: string;
  headers?: Record<string, string>;
  method?: string;
  url?: string;
  data?: unknown;
};

type RequestInterceptor = (config: AxiosRequestConfig) => AxiosRequestConfig;

type AxiosResponse<T> = {
  data: T;
  status: number;
};

function combineUrl(baseURL = "", url = "") {
  if (url.startsWith("http")) return url;
  return `${baseURL.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}

class AxiosLike {
  private defaults: AxiosRequestConfig;
  private interceptor?: RequestInterceptor;

  interceptors = {
    request: {
      use: (handler: RequestInterceptor) => {
        this.interceptor = handler;
      },
    },
  };

  constructor(defaults: AxiosRequestConfig) {
    this.defaults = defaults;
  }

  async request<T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const merged = { ...this.defaults, ...config, headers: { ...this.defaults.headers, ...config.headers } };
    const finalConfig = this.interceptor ? this.interceptor(merged) : merged;
    const response = await fetch(combineUrl(finalConfig.baseURL, finalConfig.url), {
      method: finalConfig.method,
      headers: finalConfig.headers,
      body: finalConfig.data ? JSON.stringify(finalConfig.data) : undefined,
    });
    const data = await response.json();

    if (!response.ok) {
      const error = { response: { data, status: response.status } };
      throw error;
    }

    return { data: data as T, status: response.status };
  }

  get<T>(url: string, config: AxiosRequestConfig = {}) {
    return this.request<T>({ ...config, method: "GET", url });
  }

  post<T>(url: string, data?: unknown, config: AxiosRequestConfig = {}) {
    return this.request<T>({ ...config, method: "POST", url, data });
  }
}

const axios = {
  create(defaults: AxiosRequestConfig) {
    return new AxiosLike(defaults);
  },
};

export default axios;
