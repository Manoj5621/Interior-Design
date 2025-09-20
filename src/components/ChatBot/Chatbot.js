import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { MessageSquareText } from "lucide-react";

function Chatbot() {
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatLog, isLoading]);

  useEffect(() => {
    if (isOpen && chatLog.length === 0) {
      setChatLog([{ user: "bot", message: "Welcome, How May I Assist You!" }]);
    }
  }, [isOpen, chatLog.length]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    // Ensure we're not adding null/undefined messages
    const userMessage = message.trim();
    const newChatLog = [...chatLog, { user: "me", message: userMessage }];
    setChatLog(newChatLog);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage, 
          chatHistory: newChatLog.filter(msg => msg.message && typeof msg.message === 'string')
        }),
      });
      const data = await response.json();
      setChatLog([...newChatLog, { user: "bot", message: data.response }]);
    } catch (error) {
      console.error(error);
      setChatLog([
        ...newChatLog,
        { user: "bot", message: "Sorry, something went wrong!" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 1000,
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {isOpen ? (
        <div
          style={{
            width: "380px",
            height: "500px",
            backgroundColor: "#F5F5F5",
            borderRadius: "20px",
            boxShadow: "0 15px 50px rgba(99, 102, 241, 0.2)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid rgba(99, 102, 241, 0.1)",
            transition: "all 0.3s ease",
          }}
        >
          <div
            style={{
              padding: "15px 20px",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: "#4f46e5",
                  boxShadow: "0 0 5px rgba(255,255,255,0.5)",
                }}
              />
              <strong
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "18px",
                  letterSpacing: "0.7px",
                  fontWeight: "600",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.2)",
                }}
              >
                AssistIQ
              </strong>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontSize: "24px",
                padding: "5px",
                lineHeight: "1",
                transition: "transform 0.2s ease, color 0.2s ease",
                transformOrigin: "center",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "rotate(90deg)";
                e.currentTarget.style.color = "#c3cfe2";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "rotate(0deg)";
                e.currentTarget.style.color = "#fff";
              }}
            >
              ×
            </button>
          </div>

          <div
            style={{
              flex: 1,
              padding: "20px",
              overflowY: "auto",
              background:
                "linear-gradient(to bottom, #f8fafc 0%, #e2e8f0 100%)",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              scrollBehavior: "smooth",
            }}
          >
            {chatLog.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: msg.user === "me" ? "flex-end" : "flex-start",
                  perspective: "1000px",
                }}
              >
                <div
                  style={{
                    maxWidth: "75%",
                    padding: "12px 16px",
                    borderRadius: "18px",
                    backgroundColor: msg.user === "me" ? "#6366f1" : "#FFFFFF",
                    color: msg.user === "me" ? "#fff" : "#6366f1",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    fontSize: "15px",
                    lineHeight: "1.6",
                    letterSpacing: "0.3px",
                    fontWeight: "400",
                    transformStyle: "preserve-3d",
                    transform: "translateZ(10px)",
                    transition: "transform 0.3s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform =
                      "translateZ(20px) scale(1.02)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform =
                      "translateZ(10px) scale(1)";
                  }}
                >
                  {msg.user === "bot" ? (
                    <ReactMarkdown>{msg.message}</ReactMarkdown>
                  ) : (
                    msg.message
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  gap: "6px",
                  padding: "10px",
                }}
              >
                {[1, 2, 3].map((dot) => (
                  <div
                    key={dot}
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: "#6366f1",
                      animation: `pulse 1s infinite ${dot * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div
            style={{
              padding: "15px 20px",
              borderTop: "1px solid rgba(99, 102, 241, 0.1)",
              background: "linear-gradient(to right, #6366f1, #4f46e5)",
              boxShadow: "0 -4px 10px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                style={{
                  flex: 1,
                  padding: "10px 15px",
                  borderRadius: "25px",
                  border: "2px solid #c3cfe2",
                  outline: "none",
                  transition: "all 0.3s ease",
                  fontSize: "15px",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#6366f1";
                  e.target.style.boxShadow =
                    "inset 0 2px 4px rgba(99, 102, 241, 0.1), 0 0 10px rgba(99, 102, 241, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#c3cfe2";
                  e.target.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.05)";
                }}
                placeholder="Type a message..."
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading}
                style={{
                  padding: "10px 20px",
                  borderRadius: "25px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  color: "#fff",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  fontSize: "15px",
                  fontWeight: "500",
                  boxShadow: "0 4px 10px rgba(99, 102, 241, 0.2)",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 12px rgba(99, 102, 241, 0.3)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 10px rgba(99, 102, 241, 0.2)";
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: "70px",
            height: "70px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            border: "3px solid rgba(255,255,255,0.2)",
            color: "#fff",
            cursor: "pointer",
            boxShadow: "0 8px 20px rgba(99, 102, 241, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s ease",
            transform: "scale(1)",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "scale(1.1) rotate(5deg)";
            e.currentTarget.style.boxShadow =
              "0 12px 25px rgba(99, 102, 241, 0.4)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "scale(1) rotate(0deg)";
            e.currentTarget.style.boxShadow =
              "0 8px 20px rgba(99, 102, 241, 0.3)";
          }}
        >
          <MessageSquareText size={32} strokeWidth={1.5} />
        </button>
      )}

      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@600&display=swap');

          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.2); opacity: 1; }
          }

          ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #e2e8f0;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb {
            background: #6366f1;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #4f46e5;
          }
        `}
      </style>
    </div>
  );
}

export default Chatbot;