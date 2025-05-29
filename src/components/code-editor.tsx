import React, { memo, useMemo, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ChevronDown, Wand2 } from "lucide-react";
import { prettifyCode } from "@/lib/prettify-code";
import { detectLanguage } from "@/lib/detect-code-language";

// Supported languages by react-syntax-highlighter
const SUPPORTED_LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "jsx", label: "JSX" },
  { value: "tsx", label: "TSX" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "scala", label: "Scala" },
  { value: "dart", label: "Dart" },
  { value: "r", label: "R" },
  { value: "matlab", label: "MATLAB" },
  { value: "sql", label: "SQL" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "scss", label: "SCSS" },
  { value: "sass", label: "Sass" },
  { value: "less", label: "Less" },
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "bash", label: "Bash" },
  { value: "shell", label: "Shell" },
  { value: "powershell", label: "PowerShell" },
  { value: "dockerfile", label: "Dockerfile" },
  { value: "nginx", label: "Nginx" },
  { value: "apache", label: "Apache" },
  { value: "vim", label: "Vim" },
  { value: "makefile", label: "Makefile" },
  { value: "plaintext", label: "Plain Text" },
];

interface CodeEditorProps {
  onChange: (code: string, language: string) => void;
}

export const CodeEditor = memo(function CodeEditor({
  onChange,
}: CodeEditorProps) {
  const [code, setCode] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [isAuto, setIsAuto] = useState(true);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlighterRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const autoLang = useMemo(
    () => (isAuto ? detectLanguage(code) : ""),
    [code, isAuto]
  );

  const usedLanguage = useMemo(
    () => (isAuto ? autoLang : selectedLanguage),
    [autoLang, isAuto, selectedLanguage]
  );

  // Update parent component when code or language changes
  React.useEffect(() => {
    setSelectedLanguage(usedLanguage);
    onChange(code, usedLanguage);
  }, [code, usedLanguage, onChange]);

  // Sync scrolling
  const handleScroll = () => {
    if (!textareaRef.current || !highlighterRef.current) return;
    highlighterRef.current.scrollTop = textareaRef.current.scrollTop;
    highlighterRef.current.scrollLeft = textareaRef.current.scrollLeft;
  };

  // Handle Tab character
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab" && textareaRef.current) {
      e.preventDefault();
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const updatedCode = code.slice(0, start) + "\t" + code.slice(end);
      setCode(updatedCode);

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      });
    }
  };

  const handleLanguageSelect = (lang: string) => {
    setIsAuto(false);
    setSelectedLanguage(lang);
    setShowLanguageDropdown(false);
  };

  const formatCode = async () => {
    if (isFormatting) return;
    setIsFormatting(true);
    try {
      const formattedCode = await prettifyCode(code, usedLanguage);
      setCode(formattedCode);
    } catch (error) {
      console.error("Formatting error:", error);
      // If formatting fails, silently continue without changing the code
    } finally {
      setIsFormatting(false);
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLangLabel =
    SUPPORTED_LANGUAGES.find((lang) => lang.value === selectedLanguage)
      ?.label || selectedLanguage.toUpperCase();

  return (
    <div className="rounded-md border border-border-secondary shadow-md bg-bg-primary">
      <div className="px-4 py-2 text-sm text-gray-400 flex justify-between items-center border-b border-border-secondary">
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex items-center gap-2 px-3 py-1 bg-bg-tertiary border border-border-secondary rounded-md hover:border-primary transition-colors"
            >
              <span className="font-medium">{selectedLangLabel}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showLanguageDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 max-h-60 overflow-y-auto bg-bg-secondary border border-border-primary rounded-md shadow-lg z-50">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => handleLanguageSelect(lang.value)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-bg-tertiary transition-colors ${
                      selectedLanguage === lang.value
                        ? "bg-primary/10 text-primary"
                        : "text-text-primary"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Format Button */}
        <button
          type="button"
          onClick={formatCode}
          disabled={isFormatting}
          className="flex items-center gap-2 px-3 py-1 bg-bg-tertiary border border-border-secondary rounded-md hover:border-primary transition-colors disabled:opacity-50"
          title="Format code"
        >
          <Wand2 className={`w-4 h-4 ${isFormatting ? "animate-spin" : ""}`} />
          <span className="text-xs">Format</span>
        </button>
      </div>

      <div className="relative font-mono h-[200px] leading-5">
        {/* Highlighting Layer */}
        <div
          ref={highlighterRef}
          className="absolute inset-0 px-4 py-3 overflow-auto pointer-events-none"
          aria-hidden="true"
        >
          <SyntaxHighlighter
            language={usedLanguage}
            style={oneDark}
            wrapLongLines
            customStyle={{
              background: "transparent",
              margin: 0,
              padding: 0,
              fontSize: "0.875rem",
            }}
          >
            {code.endsWith("\n") ? code + " " : code}
          </SyntaxHighlighter>
        </div>

        {/* Input Layer */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          className="relative w-full text-sm leading-[1.5] tab resize-none px-4 min-h-[200px] py-3 text-transparent caret-white outline-none bg-transparent whitespace-pre overflow-auto z-10"
          spellCheck={false}
          placeholder="// Start typing your code here..."
          style={{ tabSize: 2 }}
        />
      </div>
    </div>
  );
});
export default CodeEditor;
