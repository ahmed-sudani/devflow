import { detectLanguage } from "@/lib/detect-code-language";
import React, { useMemo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function CodePreview({
  code,
  language,
}: {
  code: string;
  language?: string | null;
}) {
  const autoLang = useMemo(
    () => language || detectLanguage(code),
    [code, language]
  );

  return (
    <div className="bg-bg-primary rounded-md py-2 mb-3 border border-border-secondary shadow-md overflow-hidden">
      <div className="bg-bg-primary px-3 py-2 flex items-center justify-between text-sm text-gray-300">
        <span>{autoLang.toUpperCase()}</span>
      </div>
      <SyntaxHighlighter
        language={autoLang}
        style={oneDark}
        customStyle={{
          margin: 0,
          fontSize: "0.875rem",
          lineHeight: "1.25rem",
          background: "transparent",
        }}
        showLineNumbers
        wrapLongLines
        wrapLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
