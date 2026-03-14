import { createContext, useContext, useState, useCallback, type ReactNode } from "react";


interface ChatContextType {
  isOpen: boolean;
  mode: "general" | "quote";
  openChat: (mode?: "general" | "quote") => void;
  closeChat: () => void;
  toggleChat: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"general" | "quote">("general");

  const openChat = useCallback((m: "general" | "quote" = "general") => {
    setMode(m);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen((p) => !p), []);

  return (
    <ChatContext.Provider value={{ isOpen, mode, openChat, closeChat, toggleChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
