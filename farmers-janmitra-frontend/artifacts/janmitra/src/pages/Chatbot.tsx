import { useState, useRef, useEffect, useCallback } from "react";
import { useSendChatMessage, useGetChatHistory, ChatMessageRequestLanguage, ChatMessageRequestUserType } from "@workspace/api-client-react";
import { useUserPreferences } from "@/lib/store";
import { getTranslation } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, Send, Loader2, Volume2, Landmark, User, WifiOff, AlertCircle, Play, Pause, Square } from "lucide-react";
import PageIconGuide from "@/components/PageIconGuide";

import { LANG_CODES, LANG_LABELS, speakText, cancelSpeech, pauseSpeech, resumeSpeech } from "@/lib/speech";
import { toast } from "@/hooks/use-toast";

const USER_TYPE_LABELS: Record<string, string> = {
  general: "General Public",
  farmer: "Farmer",
  student: "Student",
  msme: "MSME Owner",
  salaried: "Salaried",
};

type InputMode = "text" | "voice";

export default function Chatbot() {
  const { sessionId, language, userType, setLanguage, setUserType } = useUserPreferences();
  const t = (key: string) => getTranslation(language, key);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<number | null>(null);
  const [isBotPaused, setIsBotPaused] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const manualPauseRef = useRef(false);
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const {
    data: history,
    refetch,
    isError: historyError,
  } = useGetChatHistory(
    { sessionId },
    {
      query: {
        enabled: !!sessionId,
        queryKey: ["chat-history", sessionId],
        retry: 1,               // Don't hammer a missing server
        retryDelay: 2000,
      },
    }
  );

  const sendChat = useSendChatMessage();

  // True when backend is unreachable
  const isOffline = historyError;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, sendChat.isPending]);

  const playBotVoice = useCallback((text: string, msgId: number) => {
    setSpeakingMsgId(msgId);
    setIsSpeaking(true);
    setIsBotPaused(false);
    speakText(
      text,
      language,
      () => { setIsSpeaking(false); setSpeakingMsgId(null); setIsBotPaused(false); },
      () => {
        setIsSpeaking(false);
        setSpeakingMsgId(null);
        setIsBotPaused(false);
        if (language === "odia" || language === "assamese") {
          toast({
            title: "Speech Reading Unsupported",
            description: `Text-to-speech voice reading is not supported for ${language.toUpperCase()} in this browser. Please use a browser like Microsoft Edge which has native ${language.toUpperCase()} voices, or ensure the Sarvam API has active credits.`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Speech Reading Failed",
            description: "Failed to play audio reading. Please try again.",
            variant: "destructive"
          });
        }
      }
    );
  }, [language]);

  const toggleBotPlayPause = (msgContent: string, msgId: number) => {
    if (speakingMsgId === msgId) {
      if (isBotPaused) {
        resumeSpeech();
        setIsBotPaused(false);
      } else {
        pauseSpeech();
        setIsBotPaused(true);
      }
    } else {
      playBotVoice(msgContent, msgId);
    }
  };

  const stopSpeaking = () => {
    cancelSpeech();
    setIsSpeaking(false);
    setSpeakingMsgId(null);
    setIsBotPaused(false);
  };

  const submitMessage = (message: string, fromVoice: boolean) => {
    if (!message.trim()) return;
    setInput("");
    sendChat.mutate(
      { data: { message, sessionId, language, userType } },
      {
        onSuccess: (data: any) => {
          refetch();
          if ((fromVoice || inputMode === "voice") && data?.response) {
            const uid = Date.now();
            setSpeakingMsgId(uid);
            setIsSpeaking(true);
            speakText(
              data.response,
              language,
              () => {
                setIsSpeaking(false);
                setSpeakingMsgId(null);
                setIsBotPaused(false);
                // Hands-free conversational loop: start listening again if in voice mode
                if (inputMode === "voice") {
                  setTimeout(() => {
                    startRecording();
                  }, 50);
                }
              },
              () => {
                setIsSpeaking(false);
                setSpeakingMsgId(null);
                setIsBotPaused(false);
                if (language === "odia" || language === "assamese") {
                  toast({
                    title: "Speech Reading Unsupported",
                    description: `Text-to-speech voice reading is not supported for ${language.toUpperCase()} in this browser. Please use a browser like Microsoft Edge which has native ${language.toUpperCase()} voices, or ensure the Sarvam API has active credits.`,
                    variant: "destructive"
                  });
                } else {
                  toast({
                    title: "Speech Reading Failed",
                    description: "Failed to play audio reading. Please try again.",
                    variant: "destructive"
                  });
                }
              }
            );
          }
        },
        onError: () => {
          // Error displayed inline — no unhandled rejection
        },
      }
    );
  };

  const handleTextSend = () => submitMessage(input, false);

  const startRecording = (resume = false) => {
    if (isRecording) return;
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition is not supported. Please use Chrome or Edge.");
      return;
    }
    
    // Stop any bot audio playback before listening
    cancelSpeech();
    setIsSpeaking(false);
    setSpeakingMsgId(null);
    setIsBotPaused(false);

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = LANG_CODES[language] ?? "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;
    
    let baseTranscript = resume ? input : "";
    if (!resume) setInput("");

    recognition.onstart = () => {
      setIsRecording(true);
      setIsRecordingPaused(false);
      manualPauseRef.current = false;
    };
    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      baseTranscript += final;
      setInput((baseTranscript + " " + interim).trim());
    };
    recognition.onerror = () => {
      if (!manualPauseRef.current) {
        setIsRecording(false);
        setIsRecordingPaused(false);
      }
    };
    recognition.onend = () => {
      if (!manualPauseRef.current) {
         setIsRecording(false);
         setIsRecordingPaused(false);
         if (baseTranscript.trim() || input.trim()) {
            submitMessage((baseTranscript || input).trim(), true);
         }
      }
    };
    recognition.start();
  };

  const toggleRecordingPause = () => {
    if (isRecording) {
      manualPauseRef.current = true;
      recognitionRef.current?.stop();
      setIsRecording(false);
      setIsRecordingPaused(true);
    } else if (isRecordingPaused) {
      startRecording(true);
    } else {
      startRecording(false);
    }
  };

  const stopRecordingAndSend = () => {
    manualPauseRef.current = true;
    recognitionRef.current?.stop();
    setIsRecording(false);
    setIsRecordingPaused(false);
    if (input.trim()) {
      submitMessage(input, true);
    }
  };

  const stopRecordingAndClear = () => {
    manualPauseRef.current = true;
    recognitionRef.current?.stop();
    setIsRecording(false);
    setIsRecordingPaused(false);
    setInput("");
  };

  // Automatically start recording when switching to Voice Mode and not speaking
  useEffect(() => {
    if (inputMode === "voice" && !isRecording && !isSpeaking && !sendChat.isPending) {
      const timer = setTimeout(() => {
        startRecording();
      }, 50);
      return () => clearTimeout(timer);
    }
    return;
  }, [inputMode, isSpeaking, sendChat.isPending]);

  // Cleanup speech synthesis on component unmount
  useEffect(() => {
    return () => {
      cancelSpeech();
    };
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">

      {/* ── Offline banner ── */}
      {isOffline && (
        <div className="flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-5 py-2.5 text-sm text-amber-800">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>API server is offline.</strong> Chat history and responses won't load until the API server and RAG service are running.
          </span>
        </div>
      )}

      {/* ── Controls Bar ── */}
      <div className="border-b bg-card px-5 py-3 flex flex-wrap items-center gap-4">

        {/* Language selector */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
            {t("nav.language")}
          </span>
          <Select value={language} onValueChange={(v) => setLanguage(v as ChatMessageRequestLanguage)}>
            <SelectTrigger className="h-9 w-[148px] text-sm font-medium border-2 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-50">
              {(Object.values(ChatMessageRequestLanguage) as any[]).map((l: any) => (
                <SelectItem key={l} value={l} className="text-sm py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{LANG_LABELS[l] ?? l}</span>
                    {LANG_LABELS[l] !== l && (
                      <span className="text-xs text-muted-foreground capitalize">({l})</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Profile selector */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
            {t("nav.profile")}
          </span>
          <Select value={userType} onValueChange={(v) => setUserType(v as ChatMessageRequestUserType)}>
            <SelectTrigger className="h-9 w-[148px] text-sm font-medium border-2 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-50">
              {["farmer", "msme"].map((tVal: any) => (
                <SelectItem key={tVal} value={tVal} className="text-sm py-2 font-medium">
                  {t(`userTypes.${tVal}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Input mode toggle */}
        <div className="ml-auto flex items-center bg-muted rounded-lg p-1 gap-0.5">
          <button
            onClick={() => { setInputMode("text"); stopSpeaking(); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              inputMode === "text"
                ? "bg-white shadow text-[hsl(224,65%,23%)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Send className="w-3 h-3" />
            {t("nav.text")}
          </button>
          <button
            onClick={() => setInputMode("voice")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              inputMode === "voice"
                ? "bg-[#FF9933] shadow text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mic className="w-3 h-3" />
            {t("nav.voice")}
          </button>
        </div>

        {/* Voice mode badge */}
        {inputMode === "voice" && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#FF9933] bg-[#FF9933]/10 border border-[#FF9933]/25 px-2.5 py-1 rounded-full">
            <Volume2 className="w-3 h-3" />
            {t("chatbot.botVoiceBadge")}
          </div>
        )}
      </div>

      {/* Guide Banner */}
      <div className="px-5 py-1 bg-background border-b border-border/40">
        <PageIconGuide page="chatbot" />
      </div>

      {/* ── Chat Messages ── */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5" ref={scrollRef}>

        {/* Bot intro — always visible */}
        <div className="flex items-start gap-3 max-w-2xl">
          <div className="w-9 h-9 rounded-full bg-[hsl(224,65%,23%)] flex items-center justify-center flex-shrink-0 shadow-md">
            <Landmark className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="bg-[hsl(224,65%,23%)] text-white rounded-2xl rounded-tl-none px-5 py-4 shadow max-w-lg">
            <p className="text-xs font-bold text-[#FF9933] mb-1.5 tracking-wide uppercase">{t("appName")} — {t("subTitle")}</p>
            <p className="text-sm leading-relaxed text-white/85">
              {t("chatbot.introGreeting")}
            </p>
            <p className="text-xs text-white/50 mt-2.5 leading-relaxed">
              {t("chatbot.introInstructions")}
            </p>
          </div>
        </div>

        {/* Chat history */}
        {Array.isArray(history) && history.map((msg, i) => (
          <div key={i} className={`flex items-end gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            {/* Avatar */}
            {msg.role === "assistant" ? (
              <div className="w-8 h-8 rounded-full bg-[hsl(224,65%,23%)] flex items-center justify-center flex-shrink-0 shadow">
                <Landmark className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#FF9933] flex items-center justify-center flex-shrink-0 shadow">
                <User className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </div>
            )}

            <div className={`flex flex-col gap-2 max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
              {/* Bubble */}
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-[hsl(224,65%,23%)] text-white rounded-br-none"
                  : "bg-card border text-foreground rounded-bl-none"
              }`}>
                {msg.content}
              </div>

              {/* Voice listen button — only shown for assistant messages in voice mode */}
              {msg.role === "assistant" && inputMode === "voice" && msg.id !== undefined && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleBotPlayPause(msg.content, msg.id!)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      speakingMsgId === msg.id && !isBotPaused
                        ? "bg-[#FF9933] text-white border-[#FF9933]"
                        : "bg-background text-muted-foreground border-border hover:border-[#FF9933] hover:text-[#FF9933]"
                    }`}
                  >
                    {speakingMsgId === msg.id && !isBotPaused ? (
                      <><Pause className="w-3 h-3" /> {t("chatbot.pause") || "Pause"}</>
                    ) : (
                      <><Play className="w-3 h-3" /> {speakingMsgId === msg.id && isBotPaused ? (t("chatbot.resume") || "Resume") : (t("chatbot.listen") || "Listen")}</>
                    )}
                  </button>
                  {speakingMsgId === msg.id && (
                    <button
                      onClick={stopSpeaking}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border bg-background text-red-500 border-border hover:border-red-500 transition-colors"
                    >
                      <Square className="w-3 h-3" /> {t("chatbot.stop") || "Stop"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Thinking spinner */}
        {sendChat.isPending && (
          <div className="flex items-end gap-3">
            <div className="w-8 h-8 rounded-full bg-[hsl(224,65%,23%)] flex items-center justify-center flex-shrink-0 shadow">
              <Landmark className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <div className="bg-card border rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-[#FF9933]" />
              <span className="text-sm text-muted-foreground">{t("chatbot.thinking")}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Send error notice ── */}
      {sendChat.isError && !sendChat.isPending && (
        <div className="mx-5 mb-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {t("chatbot.apiOffline")}
        </div>
      )}

      {/* ── Input Bar ── */}
      <div className="border-t bg-card px-5 py-4">
        {inputMode === "voice" ? (
          /* ─ Voice mode ─ */
          <div className="flex flex-col items-center gap-3">
            {isSpeaking ? (
              <div className="flex items-center gap-2 text-sm text-[#FF9933] font-medium">
                <Volume2 className="w-4 h-4 animate-pulse" />
                {t("chatbot.speaking")}
                <button
                  onClick={stopSpeaking}
                  className="ml-2 text-xs text-muted-foreground hover:text-foreground underline"
                >
                  {t("chatbot.stop")}
                </button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {isRecording ? t("chatbot.listening") : t("chatbot.tapMic").replace("{lang}", LANG_LABELS[language] ?? language)}
              </p>
            )}

            <div className="flex items-center gap-4">
              {/* Clear / Stop button */}
              {(isRecording || isRecordingPaused) && (
                <button
                  onClick={stopRecordingAndClear}
                  className="w-12 h-12 rounded-full bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center transition-colors"
                  title="Clear recording"
                >
                  <Square className="w-5 h-5" />
                </button>
              )}

              {/* Main Record / Pause button */}
              <button
                onClick={toggleRecordingPause}
                disabled={sendChat.isPending || isSpeaking}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all disabled:opacity-50 ${
                  isRecording
                    ? "bg-red-500 text-white animate-pulse scale-110"
                    : "bg-[#FF9933] text-white hover:bg-[#e88800] hover:scale-105 active:scale-95"
                }`}
              >
                {isRecording ? <Pause className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
              </button>

              {/* Send button */}
              {(isRecording || isRecordingPaused) && (
                <button
                  onClick={stopRecordingAndSend}
                  disabled={!input.trim()}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    input.trim()
                      ? "bg-[hsl(224,65%,23%)] text-white hover:bg-[hsl(224,65%,18%)]"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                  title="Send message"
                >
                  <Send className="w-5 h-5" />
                </button>
              )}
            </div>

            {input && !sendChat.isPending && (
              <div className="w-full max-w-md bg-muted/60 rounded-xl px-4 py-2 text-sm text-foreground/70 text-center border italic">
                "{input}"
              </div>
            )}
          </div>
        ) : (
          /* ─ Text mode ─ */
          <div className="flex gap-2 max-w-4xl mx-auto w-full">
            <button
              onClick={toggleRecordingPause}
              disabled={sendChat.isPending}
              title={isRecording ? t("chatbot.stopRecording") : t("chatbot.dictate")}
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border transition-colors ${
                isRecording
                  ? "bg-red-500 text-white border-red-500 animate-pulse"
                  : "bg-background text-muted-foreground border-border hover:border-[#FF9933] hover:text-[#FF9933]"
              }`}
            >
              {isRecording ? <Pause className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleTextSend()}
              placeholder={t("chatbot.askPlaceholder").replace("{lang}", LANG_LABELS[language] ?? language)}
              className="flex-1 h-10 border-2 focus-visible:ring-0 focus-visible:border-[hsl(224,65%,23%)]"
            />
            <Button
              onClick={handleTextSend}
              disabled={!input.trim() || sendChat.isPending}
              className="bg-[hsl(224,65%,23%)] hover:bg-[hsl(224,65%,18%)] text-white gap-2 h-10 px-5 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
              {t("chatbot.send")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
