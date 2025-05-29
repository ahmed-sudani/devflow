import hljs from "highlight.js/lib/common"; // load common languages only

export function detectLanguage(code: string) {
  const result = hljs.highlightAuto(code);
  return result.language || "plaintext"; // fallback
}
