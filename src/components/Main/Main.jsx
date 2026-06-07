import React, { useContext, useRef, useEffect, useState } from "react";
import "./Main.css";
import { assets } from "../../assets/assets";
import { ContextNew } from "../../context/ContextNew";

const SUGGESTIONS = [
  { text: "Suggest beautiful places to see on an upcoming road trip", icon: assets.compass_icon },
  { text: "Briefly summarize this concept: urban planning", icon: assets.bulb_icon },
  { text: "Brainstorm team bonding activities for our work retreat", icon: assets.message_icon },
  { text: "Help me improve the readability of this code", icon: assets.code_icon },
];

const MODEL_DISPLAY = (import.meta.env.VITE_GEMINI_MODEL || "gemini-2.0-flash")
  .replace("gemini-", "")
  .split("-")
  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
  .join(" ");

const Main = () => {
  const { onSent, showResult, loading, messages, setInput, input, darkMode, toggleDarkMode } =
    useContext(ContextNew);

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const [copiedId, setCopiedId] = useState(null);
  const [pendingImage, setPendingImage] = useState(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = () => {
    if (!input.trim() && !pendingImage) return;
    onSent(
      input,
      pendingImage ? { base64: pendingImage.base64, mimeType: pendingImage.mimeType } : null
    );
    setPendingImage(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && (input.trim() || pendingImage)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setPendingImage({
        base64: dataUrl.split(",")[1],
        mimeType: file.type,
        previewUrl: dataUrl,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition is not supported in this browser. Try Chrome.");
      return;
    }
    if (isListening) return;
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    setIsListening(true);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setIsListening(false);
      onSent(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleCopy = async (text, id) => {
    const plain = (text || "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ");
    await navigator.clipboard.writeText(plain);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="main">
      <div className="nav">
        <div className="nav-left">
          <span className="nav-title">Gemini</span>
          <span className="model-tag">{MODEL_DISPLAY}</span>
        </div>
        <div className="nav-right">
          <button
            className="icon-btn"
            onClick={toggleDarkMode}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? "☀" : "☾"}
          </button>
          <img src={assets.user_icon} alt="user" className="avatar" />
        </div>
      </div>

      <div className="main-container">
        <div className="scroll-area">
          {!showResult ? (
            <div className="welcome">
              <h1 className="greet-text">
                <span>Hello, Friend.</span>
                <br />
                How can I help you today?
              </h1>
              <div className="cards">
                {SUGGESTIONS.map((s, i) => (
                  <div key={i} className="card" onClick={() => onSent(s.text)}>
                    <p>{s.text}</p>
                    <img src={s.icon} alt="" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="conversation">
              {messages.map((msg) =>
                msg.role === "user" ? (
                  <div key={msg.id} className="msg msg-user">
                    <img src={assets.user_icon} alt="you" className="msg-avatar" />
                    <div className="msg-user-content">
                      {msg.imagePreview && (
                        <img src={msg.imagePreview} className="msg-image" alt="uploaded" />
                      )}
                      {msg.content && (
                        <p className="msg-text">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="msg msg-model">
                    <img src={assets.gemini_icon} alt="gemini" className="msg-avatar" />
                    <div className="msg-body">
                      <div
                        className="msg-text"
                        dangerouslySetInnerHTML={{ __html: msg.content }}
                      />
                      {!msg.isError && (
                        <button
                          className={`copy-btn ${copiedId === msg.id ? "copied" : ""}`}
                          onClick={() => handleCopy(msg.rawContent || msg.content, msg.id)}
                        >
                          {copiedId === msg.id ? "✓ Copied" : "⎘ Copy"}
                        </button>
                      )}
                    </div>
                  </div>
                )
              )}
              {loading && (
                <div className="msg msg-model">
                  <img src={assets.gemini_icon} alt="gemini" className="msg-avatar" />
                  <div className="loader">
                    <div className="loader-bar" />
                    <div className="loader-bar" />
                    <div className="loader-bar" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="input-area">
          {pendingImage && (
            <div className="image-preview-wrap">
              <div className="image-preview-item">
                <img src={pendingImage.previewUrl} alt="preview" />
                <button className="remove-image" onClick={() => setPendingImage(null)}>×</button>
              </div>
              <span className="image-preview-label">Image attached</span>
            </div>
          )}
          <div className="search-box">
            <input
              type="text"
              placeholder={pendingImage ? "Ask about this image..." : "Ask Gemini anything..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="input-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageSelect}
              />
              <img
                src={assets.gallery_icon}
                alt="image"
                title="Attach image"
                onClick={() => fileInputRef.current?.click()}
              />
              <img
                src={assets.mic_icon}
                alt="mic"
                title={isListening ? "Listening..." : "Voice input"}
                onClick={handleMic}
                className={isListening ? "mic-listening" : ""}
              />
              {(input.trim() || pendingImage) && (
                <button className="send-btn" onClick={handleSend}>
                  <img src={assets.send_icon} alt="send" />
                </button>
              )}
            </div>
          </div>
          {(input.length > 0 || pendingImage) && (
            <div className="char-hint">
              {input.length > 0 ? `${input.length} chars · ` : ""}Enter to send
            </div>
          )}
          <p className="disclaimer">
            Gemini may display inaccurate info — always double-check important responses.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Main;
