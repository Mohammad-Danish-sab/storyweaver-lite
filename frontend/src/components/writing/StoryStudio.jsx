import { useEffect, useMemo, useRef, useState } from "react";
import "./StoryStudio.css";
import { API_BASE_URL } from "../../services/api";
import { getWritingDraft, saveWritingDraft } from "../../services/accountApi";
import AccessibilityControls from "../common/AccessibilityControls";

const prompts = [
  "A tiny seed discovers a secret garden.",
  "Two friends build something helpful for their village.",
  "A kite carries an important message across the sky.",
  "Write about an animal who learns a brave new skill.",
];

const draftKey = "storyweaver-story-studio-draft";

function getDraft() {
  try { return JSON.parse(localStorage.getItem(draftKey)) || {}; }
  catch { return {}; }
}

async function translateStory(title, content, sourceLanguage, signal) {
  const sourceTexts = [];
  if (title.length >= 2) sourceTexts.push({ key: "title", text: title });
  if (content.length >= 20) sourceTexts.push({ key: "content", text: content });
  if (!sourceTexts.length) {
    throw new Error("Write a title or at least a few sentences before translating.");
  }
  const response = await fetch(`${API_BASE_URL}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      texts: sourceTexts.map(({ text }) => text),
      source_language: sourceLanguage,
    }),
    signal,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.detail || "Translation is unavailable. Please try again.");
  }
  if (!Array.isArray(result.translations) || result.translations.length !== sourceTexts.length) {
    throw new Error("Translation returned an unexpected response. Please try again.");
  }
  return sourceTexts.reduce((translated, { key }, index) => {
    translated[key] = result.translations[index];
    return translated;
  }, { title: "", content: "" });
}

export default function StoryStudio({ language, account, onBack }) {
  const [title, setTitle] = useState(() => getDraft().title || "");
  const [content, setContent] = useState(() => getDraft().content || "");
  const [prompt, setPrompt] = useState(() => getDraft().prompt || prompts[0]);
  const [translation, setTranslation] = useState(null);
  const [translationStatus, setTranslationStatus] = useState({ key: "", text: "" });
  const [translatingKey, setTranslatingKey] = useState("");
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechStatus, setSpeechStatus] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(!account);
  const [draftSyncStatus, setDraftSyncStatus] = useState("");
  const recognition = useRef(null);
  const wordCount = useMemo(() => content.trim() ? content.trim().split(/\s+/).length : 0, [content]);
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  const translationKey = JSON.stringify([language, trimmedTitle.length >= 2 ? trimmedTitle : "", trimmedContent.length >= 20 ? trimmedContent : ""]);
  const currentTranslation = translation?.key === translationKey ? translation : null;
  const currentTranslationStatus = translationStatus.key === translationKey ? translationStatus.text : "";
  const isTranslating = translatingKey === translationKey;
  const sourceLabel = language === "kn" ? "Kannada" : "English";
  const targetLabel = language === "kn" ? "English" : "Kannada";

  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify({ title, content, prompt }));
  }, [title, content, prompt]);

  useEffect(() => {
    if (!account) {
      return undefined;
    }
    let active = true;
    getWritingDraft().then((draft) => {
      if (!active) return;
      if (draft) {
        setTitle(draft.title);
        setContent(draft.content);
        setPrompt(draft.prompt);
      }
      setDraftLoaded(true);
      setDraftSyncStatus("Draft sync is on for this family account.");
    }).catch((error) => {
      if (!active) return;
      setDraftSyncStatus(`Could not load your synced draft: ${error.message}`);
      setDraftLoaded(true);
    });
    return () => { active = false; };
  }, [account]);

  useEffect(() => {
    if (!account || !draftLoaded) return undefined;
    const timer = window.setTimeout(() => {
      saveWritingDraft({ title, content, prompt })
        .then(() => setDraftSyncStatus("Draft saved to your family account."))
        .catch((error) => setDraftSyncStatus(`Draft sync failed: ${error.message}`));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [account, content, draftLoaded, prompt, title]);

  useEffect(() => () => recognition.current?.stop(), []);

  useEffect(() => {
    if (trimmedTitle.length < 2 && trimmedContent.length < 20) {
      return undefined;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setTranslatingKey(translationKey);
      setTranslationStatus({ key: translationKey, text: "Translating your story…" });
      try {
        const translated = await translateStory(trimmedTitle, trimmedContent, language, controller.signal);
        if (cancelled) return;
        setTranslation({ key: translationKey, ...translated });
        setTranslationStatus({ key: translationKey, text: "Translation ready. You can review it below." });
      } catch (error) {
        if (cancelled) return;
        setTranslationStatus({ key: translationKey, text: error.message });
      } finally {
        if (!cancelled) {
          setTranslatingKey((current) => current === translationKey ? "" : current);
        }
      }
    }, 800);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [language, trimmedTitle, trimmedContent, translationKey]);

  const startDictation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechStatus("Voice writing is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    recognition.current?.stop();
    const instance = new SpeechRecognition();
    instance.lang = language === "kn" ? "kn-IN" : "en-IN";
    instance.continuous = true;
    instance.interimResults = true;
    instance.onstart = () => {
      setIsRecording(true);
      setSpeechStatus(`Listening in ${sourceLabel}…`);
    };
    instance.onresult = (event) => {
      const finalTranscript = Array.from(event.results)
        .slice(event.resultIndex)
        .filter((result) => result.isFinal)
        .map((result) => result[0].transcript.trim())
        .filter(Boolean)
        .join(" ");
      if (!finalTranscript) return;

      setContent((current) => {
        const separator = current && !/\s$/.test(current) ? " " : "";
        return `${current}${separator}${finalTranscript} `.slice(0, 5000);
      });
      setSpeechStatus(`Added spoken words. Translating into ${targetLabel}…`);
    };
    instance.onerror = (event) => {
      const messages = {
        "not-allowed": "Allow microphone access in your browser to use voice writing.",
        "service-not-allowed": "Speech recognition is blocked by the browser.",
        "audio-capture": "No microphone was found. Connect a microphone and try again.",
        "no-speech": "No speech was detected. Try speaking a little louder.",
        network: "Speech recognition needs an internet connection.",
      };
      setSpeechStatus(messages[event.error] || "Could not hear that. Please try again.");
    };
    instance.onend = () => {
      setIsRecording(false);
      recognition.current = null;
      setSpeechStatus((current) => current.startsWith("Listening")
        ? `Voice input stopped. Your words will be translated into ${targetLabel}.`
        : current);
    };
    recognition.current = instance;
    try {
      instance.start();
    } catch {
      recognition.current = null;
      setIsRecording(false);
      setSpeechStatus("Could not start the microphone. Please try again.");
    }
  };

  const stopDictation = () => recognition.current?.stop();

  const submit = async (event) => {
    event.preventDefault();
    if (trimmedTitle.length < 2 || trimmedContent.length < 20) {
      setStatus("Add a title and at least a few sentences before sharing.");
      return;
    }
    setIsSaving(true);
    setStatus("");
    try {
      let translated = currentTranslation;
      if (!translated) {
        setTranslationStatus({ key: translationKey, text: "Translating your story…" });
        translated = {
          key: translationKey,
          ...(await translateStory(trimmedTitle, trimmedContent, language)),
        };
        setTranslation(translated);
        setTranslationStatus({ key: translationKey, text: "Translation ready. You can review it below." });
      }

      const response = await fetch(`${API_BASE_URL}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          content: trimmedContent,
          translated_title: translated.title,
          translated_content: translated.content,
          language,
          prompt,
        }),
      });
      if (!response.ok) throw new Error("Could not share story");
      localStorage.removeItem(draftKey);
      setTitle("");
      setContent("");
      setTranslation(null);
      setTranslationStatus({ key: "", text: "" });
      setStatus("Your story was shared for a librarian to review. Great work!");
    } catch (error) {
      setStatus(error.message || "Your draft is saved on this device. Connect to the library and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const startOver = () => {
    stopDictation();
    setTitle("");
    setContent("");
    setTranslation(null);
    setTranslationStatus({ key: "", text: "" });
    setSpeechStatus("");
    setStatus("A fresh page is ready. Your old draft was cleared.");
  };

  return <main className="studio-shell">
    <header className="studio-header"><button className="back-button" onClick={onBack}>← <span>Library</span></button><div><p className="eyebrow">Young authors</p><h1>Story studio</h1></div><span className="studio-language">{sourceLabel} → {targetLabel}</span><AccessibilityControls /></header>
    <section className="studio-card">
      <div className="studio-intro"><span aria-hidden="true">✦</span><h2>Your ideas belong in stories.</h2><p>Write in {sourceLabel}; we’ll translate it into {targetLabel} as you write. Story text is sent to Google Cloud Translation. Do not include your full name, address, school, or phone number.</p></div>
      {account ? <p className="studio-status" role="status" aria-live="polite">{draftSyncStatus || "Loading your synced draft…"}</p> : <p className="studio-status">Draft saved on this device. Sign in to sync it across devices.</p>}
      <form onSubmit={submit} className="studio-form">
        <label htmlFor="story-prompt">A starting idea</label><select id="story-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)}>{prompts.map((item) => <option key={item}>{item}</option>)}</select>
        <label htmlFor="story-title">Story title ({sourceLabel})</label><input id="story-title" value={title} maxLength="100" onChange={(event) => setTitle(event.target.value)} placeholder="Give your story a wonderful title" required />
        <div className="field-row"><label htmlFor="story-content">Your story ({sourceLabel})</label><span>{wordCount} words</span></div>
        <textarea id="story-content" value={content} maxLength="5000" onChange={(event) => setContent(event.target.value)} placeholder="Once upon a time…" required />
        <div className="dictation-row">
            <button className={isRecording ? "dictation-button recording" : "dictation-button"} type="button" onClick={isRecording ? stopDictation : startDictation} aria-pressed={isRecording} disabled={isSaving}>
              {isRecording ? "■ Stop microphone" : "● Speak to write"}
          </button>
          <span aria-live="polite">{speechStatus || `Speak in ${sourceLabel}; your words will appear here and translate into ${targetLabel}.`}</span>
        </div>
          <p className="speech-privacy-note">Your browser may process speech recognition online. Check its microphone permission before speaking.</p>
        <div className="translation-preview" aria-live="polite">
          <div className="field-row"><label htmlFor="translated-story">Automatic translation ({targetLabel})</label><span>{isTranslating ? "Updating…" : currentTranslation ? "Ready" : ""}</span></div>
          <label className="sr-only" htmlFor="translated-title">Translated title ({targetLabel})</label>
          <input id="translated-title" value={currentTranslation?.title || ""} readOnly placeholder={`Translated title appears in ${targetLabel}`} />
          <label className="sr-only" htmlFor="translated-story">Translated story ({targetLabel})</label>
          <textarea id="translated-story" value={currentTranslation?.content || ""} readOnly placeholder={`The ${targetLabel} version appears here after you write at least 20 characters.`} rows={8} />
          {currentTranslationStatus && <p className="studio-status" role="status">{currentTranslationStatus}</p>}
        </div>
        <div className="studio-actions"><button className="secondary-action" type="button" onClick={startOver}>Start over</button><button className="primary-action" disabled={isSaving || isTranslating || isRecording} type="submit">{isSaving ? "Sharing…" : "Share with librarian"}</button></div>
        {status && <p className="studio-status" role="status">{status}</p>}
      </form>
    </section>
  </main>;
}
