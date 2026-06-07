import { createContext, useState } from "react";
import runChat, { startNewChat } from "../config/gemini";

export const ContextNew = createContext();

const formatResponse = (text) => {
  let result = text;
  result = result.replace(
    /```(\w*)\n?([\s\S]*?)```/g,
    (_, _lang, code) => `<pre class="code-block"><code>${code.trim()}</code></pre>`
  );
  result = result.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  result = result.replace(/^[-*] (.+)$/gm, "• $1");
  result = result.replace(/\n/g, "<br>");
  return result;
};

const getErrorMessage = (error) => {
  const msg = (error?.message || "").toLowerCase();
  if (msg.includes("api_key") || msg.includes("api key") || msg.includes("invalid")) {
    return "Invalid API key. Check your .env file (VITE_GEMINI_API_KEY).";
  }
  if (msg.includes("quota") || msg.includes("429") || msg.includes("rate")) {
    return "API quota exceeded. Please try again later.";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Network error. Check your internet connection.";
  }
  if (msg.includes("not found") || msg.includes("404")) {
    return "Model not available. Please try again.";
  }
  if (msg.includes("safety")) {
    return "Response blocked due to safety filters. Try rephrasing your prompt.";
  }
  return "Something went wrong. Please try again.";
};

const ContextProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [prevprompt, setPrevPrompt] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [recentPrompt, setRecentPrompt] = useState("");
  const [resultData, setResultData] = useState("");

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
      return next;
    });
  };

  const newChat = () => {
    setLoading(false);
    setShowResult(false);
    setMessages([]);
    setResultData("");
    startNewChat();
  };

  const onSent = async (prompt, imageData = null) => {
    const actualPrompt = (typeof prompt === "string" ? prompt : input).trim();
    if (!actualPrompt && !imageData) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: actualPrompt,
      imagePreview: imageData
        ? `data:${imageData.mimeType};base64,${imageData.base64}`
        : null,
    };

    setMessages((prev) => [...prev, userMsg]);
    const label = actualPrompt || "[Image]";
    setRecentPrompt(label);
    setPrevPrompt((prev) => {
      const filtered = prev.filter((p) => p !== label);
      return [...filtered, label].slice(-20);
    });

    setShowResult(true);
    setLoading(true);
    setInput("");

    try {
      const response = await runChat(
        actualPrompt || "Describe this image.",
        imageData || undefined
      );
      const formatted = formatResponse(response);

      const aiMsg = {
        id: Date.now() + 1,
        role: "model",
        content: formatted,
        rawContent: response,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setResultData(formatted);
    } catch (error) {
      console.error("Gemini error:", error);
      const errMsg = {
        id: Date.now() + 1,
        role: "model",
        content: `<span class="error-text">⚠️ ${getErrorMessage(error)}</span>`,
        isError: true,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContextNew.Provider
      value={{
        prevprompt,
        setPrevPrompt,
        onSent,
        setRecentPrompt,
        recentPrompt,
        showResult,
        loading,
        resultData,
        messages,
        input,
        setInput,
        newChat,
        darkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </ContextNew.Provider>
  );
};

export default ContextProvider;
