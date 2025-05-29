import prettier from "prettier/standalone";
import parserBabel from "prettier/parser-babel";
import prettierPluginEstree from "prettier/plugins/estree";
import * as prettierPluginPostcss from "prettier/plugins/postcss";
import * as prettierPluginHtml from "prettier/plugins/html";
import * as prettierPluginMarkdown from "prettier/plugins/markdown";
import * as prettierPluginTypescript from "prettier/plugins/typescript.js";

/**
 * Returns the appropriate Prettier plugins for the selected language.
 */
export const getPlugins = (selectedLanguage: string) => {
  switch (selectedLanguage) {
    case "typescript":
    case "tsx":
      return [prettierPluginTypescript, prettierPluginEstree];

    case "css":
    case "scss":
    case "sass":
    case "less":
      return [prettierPluginPostcss];

    case "html":
    case "xml":
      return [prettierPluginHtml];

    case "markdown":
      return [prettierPluginMarkdown];

    // Babel-based languages: JavaScript, JSX, JSON, and others using ESTree
    case "javascript":
    case "jsx":
    case "json":
      return [parserBabel, prettierPluginEstree];

    // Languages with no specific Prettier plugin will use default parser
    default:
      return [parserBabel, prettierPluginEstree];
  }
};

/**
 * Maps a language to its Prettier parser identifier.
 */
export const getParser = (language: string) => {
  switch (language) {
    case "javascript":
    case "jsx":
      return "babel";

    case "typescript":
    case "tsx":
      return "typescript";

    case "css":
      return "css";
    case "scss":
      return "scss";
    case "sass":
      return "scss";
    case "less":
      return "less";

    case "html":
      return "html";
    case "xml":
      return "xml";

    case "json":
      return "json";
    case "markdown":
      return "markdown";

    case "yaml":
      return "yaml";
    case "graphql":
      return "graphql";
    case "mdx":
      return "mdx";

    // Shell scripts
    case "bash":
    case "shell":
    case "powershell":
      return "bash";

    // Fallback: return the language as parser name
    default:
      return language;
  }
};

export function prettifyCode(code: string, language = "javascript") {
  try {
    return prettier.format(code, {
      parser: getParser(language),
      plugins: getPlugins(language),
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: "es5",
    });
  } catch (err) {
    console.error("Prettify error:", err);
    return code;
  }
}
