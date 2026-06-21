const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "nujoom_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  skipAuth?: boolean;
}

/**
 * دالة طلب HTTP مركزية لكل تواصل مع الباك إند.
 * ترفق التوكن تلقائيًا (إلا إذا skipAuth=true، مثل /auth/login نفسه).
 * ترمي ApiError عند أي استجابة غير ناجحة، تحمل رسالة الخطأ من الخادم.
 */
export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, skipAuth = false } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // بعض الاستجابات (مثل تحميل ملف Word) ليست JSON
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    let message = `خطأ في الطلب (${response.status})`;
    if (isJson) {
      try {
        const data = await response.json();
        message = data.error || message;
      } catch {
        // تجاهل، استخدم الرسالة الافتراضية
      }
    }
    throw new ApiError(message, response.status);
  }

  if (isJson) {
    return response.json() as Promise<T>;
  }

  // استجابة غير JSON (مثل ملف)، نُعيدها كـ unknown — المستدعي يتعامل معها بطريقته
  return response as unknown as T;
}

/**
 * لتنزيل ملف (مثل محضر Word) — يتعامل مع الاستجابة الثنائية مباشرة
 * ويُنزّلها في المتصفح، بدل تمريرها كـ JSON.
 */
export async function downloadFile(path: string, suggestedFilename: string): Promise<void> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { headers });

  if (!response.ok) {
    throw new ApiError(`فشل تحميل الملف (${response.status})`, response.status);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = suggestedFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * MongoDB يُعيد المعرّف كـ _id، بينما كل الفرونت إند مبني على حقل id.
 * هذه الدالة تحوّل أي مستند (أو مصفوفة مستندات) من _id إلى id،
 * حتى لا نحتاج لتعديل كل صفحة تستخدم .id في المشروع.
 */
export function normalizeId<T extends Record<string, unknown>>(
  doc: T
): T & { id: string } {
  const { _id, ...rest } = doc as Record<string, unknown>;
  return { ...rest, id: String(_id ?? doc.id) } as T & { id: string };
}

export function normalizeIds<T extends Record<string, unknown>>(
  docs: T[]
): (T & { id: string })[] {
  return docs.map(normalizeId);
}