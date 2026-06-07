import React, { useContext, useState } from "react";
import "./Sidebar.css";
import { assets } from "../../assets/assets";
import { ContextNew } from "../../context/ContextNew";

const Sidebar = () => {
  const [extended, setExtended] = useState(false);
  const { onSent, prevprompt, setRecentPrompt, newChat, messages } = useContext(ContextNew);

  const loadPrompt = (prompt) => {
    setRecentPrompt(prompt);
    onSent(prompt);
  };

  const exportChat = () => {
    if (!messages || messages.length === 0) {
      alert("No conversation to export yet.");
      return;
    }
    const lines = messages.map((m) => {
      const speaker = m.role === "user" ? "You" : "Gemini";
      const body = (m.rawContent || m.content || "")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim();
      return `${speaker}:\n${body}`;
    });
    const blob = new Blob([lines.join("\n\n---\n\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gemini-chat.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="sidebar">
      <div className="top">
        <img
          onClick={() => setExtended((prev) => !prev)}
          className="menu"
          src={assets.menu_icon}
          alt="menu"
        />
        <div onClick={newChat} className="new-chat">
          <img src={assets.plus_icon} alt="new chat" />
          {extended && <p>New Chat</p>}
        </div>

        {extended && (
          <div className="recent">
            <p className="recent-title">Recent</p>
            {[...prevprompt].reverse().map((item, index) => (
              <div
                key={index}
                onClick={() => loadPrompt(item)}
                className="recent-entry"
                title={item}
              >
                <img src={assets.message_icon} alt="" />
                <p>{item.length > 22 ? item.slice(0, 22) + "…" : item}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bottom">
        <div className="bottom-item recent-entry">
          <img src={assets.question_icon} alt="help" />
          {extended && <p>Help</p>}
        </div>
        <div className="bottom-item recent-entry">
          <img src={assets.history_icon} alt="activity" />
          {extended && <p>Activity</p>}
        </div>
        <div className="bottom-item recent-entry export-item" onClick={exportChat} title="Export conversation as .txt">
          <span className="export-icon">⬇</span>
          {extended && <p>Export Chat</p>}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
