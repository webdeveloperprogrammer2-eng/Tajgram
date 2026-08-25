"use client";

// ============================================================
//  ChatWindow - sutuni rost: khudi suhbat.
//    GET  /Chat/get-chat-by-id?chatId=..  -> payomho (har 6 son. nav)
//    PUT  /Chat/send-message              -> payomi nav (matn / surat / ovoz)
//    DELETE /Chat/delete-message          -> payomi khudam
//
//  QOIDA: agar hamsuhbat na ba man podpiska kunad va
//  na man ba u - maidoni navishtan BASTA ast.
//
//  IMKONIYATHOI NAV:
//    - zvanoki sadoi va zvanoki video (tugmaho dar sarlavha)
//    - payomi ovozi (golosovoy) - mikrofon dar maidoni navishtan
//    - surathoi ZIYOD yakbora + khurd kardani hajmi surat
//      (backend yak fayl dar yak so-rov megirad -> yak-yak mefiristem)
// ============================================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ImagePlus,
  Lock,
  Phone,
  Send,
  Trash2,
  Video,
  X,
} from "lucide-react";

import {
  deleteMessage,
  errorText,
  getChatMessages,
  isAudioFile,
  isImageFile,
  isVideoFile,
  mediaUrl,
  sendMessage,
  type Chat,
  type Message,
} from "../api";
import { useCall } from "../call/CallProvider";
import { sameId } from "../call/signaling";
import { clockTime, dayLabel } from "../format";
import { useChats } from "../providers";
import styles from "../chats.module.css";

import Avatar from "./Avatar";
import VoiceMessage from "./VoiceMessage";
import VoiceRecorder from "./VoiceRecorder";

// Yakbora chand surat guzoshtan mumkin ast
const MAX_FILES = 6;

export default function ChatWindow({
  chat,
  onBack,
}: {
  chat: Chat;
  onBack: () => void;
}) {
  const { token, allowedIds, reloadChats, me } = useChats();
  const { callUser, phase, notifyChat, onChatEvent, notifyTyping, onTypingEvent } =
    useCall();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [focused, setFocused] = useState(false);

  // Hamsuhbat dar KADOM suhbat navishta istodaast?
  // (raqami suhbat nigoh medorem, na "ha/ne" - to hangomi guzashtan
  //  ba suhbati digar khudash khomush shavad, be effect-i zieda)
  const [typingChatId, setTypingChatId] = useState<number | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);
  const bottom = useRef<HTMLDivElement>(null);

  // ---------- Baroi "pechatayet" ----------
  // Har harf yak signal nafiristem - faqat vaqte holat ivaz shavad,
  // va har 2.5 soniya yak bor "hanuz menavisam" mego-em.
  const typingOn = useRef(false);
  const typingSentAt = useRef(0);
  const typingStop = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Agar hamsuhbat naghz qat' kunad - khudaman ba'di 4 soniya khomush mekunem
  const peerTypingOff = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ------------------------------------------------------------
  //  ADRESI HAMSUHBAT (baroi ZVANOK va signalhoi real-time)
  //
  //  MUHIM: `chat.userId` az /Chat/get-chats meoyad va HAMESHA
  //  durust nest - baroi yak taraf on ID-i KHUDI hamon odamro
  //  medihad. On vaqt zvanok "ba khudam" meraft, signaling onro
  //  hamchun sadoi khudam mepartoft va ba hamsuhbat NAMERASID.
  //  (Payomho kor mekardand, chunki onho az rohi backend
  //   meravand va har 2.5 soniya az nav khonda meshavand.)
  //
  //  Baroi hamin ID-i haqiqiro az KHUDI payomho megirem:
  //  payome ki `isMine === false` ast - hatman az hamsuhbat ast.
  // ------------------------------------------------------------
  const peerId = useMemo(() => {
    const fromMessages = messages.find(
      (message) =>
        !message.isMine &&
        typeof message.userId === "string" &&
        message.userId.trim() !== "" &&
        !sameId(message.userId, me?.userId)
    );
    if (fromMessages !== undefined) return fromMessages.userId;

    // Payom hanuz nest: chat.userId faqat on vaqt, ki on MAN nabosam.
    if (chat.userId.trim() !== "" && !sameId(chat.userId, me?.userId)) {
      return chat.userId;
    }
    return "";
  }, [messages, chat.userId, me?.userId]);

  // Hamsuhbati "durust" - hamin ba callUser doda meshavad
  const peerChat = useMemo<Chat>(
    () => (peerId === "" ? chat : { ...chat, userId: peerId }),
    [chat, peerId]
  );

  // Bo in odam navishtan mumkin ast yo ne?
  // GUID-ho gohe bo harfi kalon, gohe khurd meoyand -> sanjishi
  // "has()" hamon khel nodurust mesud. Hozir bo sameId mesanjem.
  const canWrite = useMemo(
    () =>
      allowedIds.has(chat.userId) ||
      [...allowedIds].some(
        (id) => sameId(id, chat.userId) || (peerId !== "" && sameId(id, peerId))
      ),
    [allowedIds, chat.userId, peerId]
  );

  // Zvanok hozir jori ast? -> tugmahoro band mekunem
  const busy = phase !== "idle" && phase !== "ended";

  // "menavisad" faqat baroi HAMIN suhbat namoyon meshavad
  const peerTyping = typingChatId === chat.chatId;

  // ---------- Payomho: bori avval + har 6 soniya ----------
  useEffect(() => {
    let alive = true;

    async function load(first: boolean) {
      if (first) {
        setLoading(true);
        setError("");
      }

      try {
        const list = await getChatMessages(token, chat.chatId);
        if (!alive) return;

        setMessages(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!alive || !first) return;
        setError(errorText(err, "Payomho bor nashudand."));
      } finally {
        if (alive && first) setLoading(false);
      }
    }

    load(true);
    // Rohi asosi signal-i "chat" ast (fori merasad).
    // In interval faqat baroi ehtiyot - agar signal narasad.
    const timer = setInterval(() => load(false), 2500);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [token, chat.chatId]);

  // ------------------------------------------------------------
  //  REAL TIME
  //  Har bor ki hamsuhbat chize firistad (matn, surat, video,
  //  ovoz yo tark kardani payom) - FORI az nav mekhonem.
  //  Interval-i 6 soniya faqat baroi ehtiyot memonad.
  // ------------------------------------------------------------
  const refetch = useCallback(async () => {
    try {
      const list = await getChatMessages(token, chat.chatId);
      setMessages(Array.isArray(list) ? list : []);
    } catch {
      // khomush - polling khudash ba'd meorad
    }
  }, [token, chat.chatId]);

  // reloadChats har render nav mesozad -> dar ref nigoh medorem
  const reloadRef = useRef(reloadChats);
  useEffect(() => {
    reloadRef.current = reloadChats;
  }, [reloadChats]);

  useEffect(
    () =>
      onChatEvent((incomingChatId) => {
        if (incomingChatId === chat.chatId) {
          // Payom firistod -> yani digar naminavisad
          setTypingChatId(null);
          if (peerTypingOff.current !== null) {
            clearTimeout(peerTypingOff.current);
          }
          void refetch();
        }
        void reloadRef.current();
      }),
    [onChatEvent, refetch, chat.chatId]
  );

  // Ba hamsuhbat khabar medihem ki chize guzoshtem
  const ping = useCallback(() => {
    notifyChat(peerId, chat.chatId);
  }, [notifyChat, peerId, chat.chatId]);

  // ------------------------------------------------------------
  //  "PECHATAYET" — firistodan
  // ------------------------------------------------------------
  const stopTyping = useCallback(() => {
    if (typingStop.current !== null) {
      clearTimeout(typingStop.current);
      typingStop.current = null;
    }
    if (!typingOn.current) return;

    typingOn.current = false;
    notifyTyping(peerId, chat.chatId, false);
  }, [notifyTyping, peerId, chat.chatId]);

  const beatTyping = useCallback(() => {
    const now = Date.now();

    // Bori avval yo har 2.5 soniya yak bor
    if (!typingOn.current || now - typingSentAt.current > 2500) {
      typingOn.current = true;
      typingSentAt.current = now;
      notifyTyping(peerId, chat.chatId, true);
    }

    // Agar 3 soniya harf nazanad - "bas kard"
    if (typingStop.current !== null) clearTimeout(typingStop.current);
    typingStop.current = setTimeout(stopTyping, 3000);
  }, [notifyTyping, stopTyping, peerId, chat.chatId]);

  // ------------------------------------------------------------
  //  "PECHATAYET" — giriftan
  // ------------------------------------------------------------
  useEffect(
    () =>
      onTypingEvent((incomingChatId, _fromUserId, on) => {
        if (incomingChatId !== chat.chatId) return;

        setTypingChatId(on ? incomingChatId : null);

        if (peerTypingOff.current !== null) clearTimeout(peerTypingOff.current);
        if (on) {
          // Agar "khomush" narasad - khudaman poyon mekunam
          peerTypingOff.current = setTimeout(() => setTypingChatId(null), 4000);
        }
      }),
    [onTypingEvent, chat.chatId]
  );

  // Suhbat ivaz shud yo sahifa basta shud - taymerhoro toza mekunem
  // va ba hamsuhbat mego-em ki digar naminavisam.
  useEffect(
    () => () => {
      stopTyping();
      if (peerTypingOff.current !== null) clearTimeout(peerTypingOff.current);
    },
    [chat.chatId, stopTyping]
  );

  // Har bor ki payomi nav omad - ba poyon meravem
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length, chat.chatId]);

  // ---------- Guzoshtani faylho (surat / video) ----------
  function addFiles(picked: File[]) {
    if (picked.length === 0) return;

    const clean: File[] = [];

    for (const item of picked) {
      const ok =
        item.type.startsWith("image/") ||
        item.type.startsWith("video/") ||
        item.type.startsWith("audio/");

      if (!ok) {
        setError(`"${item.name}" surat yo video nest.`);
        continue;
      }

      // Videohoi az 40 MB kalon - backend qabul namekunad
      if (item.type.startsWith("video/") && item.size > 40 * 1024 * 1024) {
        setError(`"${item.name}" khele kalon ast (az 40 MB ziyod).`);
        continue;
      }

      clean.push(item);
    }

    if (clean.length === 0) return;

    setFiles((old) => [...old, ...clean].slice(0, MAX_FILES));
  }

  function dropFile(index: number) {
    setFiles((old) => old.filter((_, position) => position !== index));
  }

  // ---------- Firistodani payom ----------
  async function handleSend(event?: React.FormEvent) {
    event?.preventDefault();

    if (!canWrite || sending) return;
    if (text.trim() === "" && files.length === 0) return;

    setSending(true);
    setError("");

    const body = text;
    const queue = files;

    try {
      if (queue.length === 0) {
        // Faqat matn
        const created = await sendMessage(token, {
          chatId: chat.chatId,
          text: body,
          file: null,
        });
        if (created) setMessages((old) => [...old, created]);
      } else {
        // Backend YAK fayl dar yak so-rov megirad -> yak-yak.
        // Matn hamrohi fayli AVVAL meravad.
        for (let index = 0; index < queue.length; index += 1) {
          const ready = await shrinkImage(queue[index]);

          const created = await sendMessage(token, {
            chatId: chat.chatId,
            text: index === 0 ? body : "",
            file: ready,
          });

          if (created) setMessages((old) => [...old, created]);
        }
      }

      // Baroi bovari - ro-ykhati poyonro az server megirem
      const list = await getChatMessages(token, chat.chatId).catch(() => null);
      if (Array.isArray(list)) setMessages(list);

      setText("");
      setFiles([]);
      stopTyping();
      ping(); // REAL TIME: matn / surat / video
      await reloadChats(); // dar ro-ykhat "payomi okhirin" nav shavad
    } catch (err) {
      setError(errorText(err, "Payom firistoda nashud."));
    } finally {
      setSending(false);
    }
  }

  // ---------- Firistodani payomi OVOZI ----------
  async function sendVoice(voice: File) {
    if (!canWrite || sending) return;

    setSending(true);
    setError("");

    try {
      const created = await sendMessage(token, {
        chatId: chat.chatId,
        text: "",
        file: voice,
      });

      if (created) setMessages((old) => [...old, created]);
      else {
        const list = await getChatMessages(token, chat.chatId);
        if (Array.isArray(list)) setMessages(list);
      }

      stopTyping();
      ping(); // REAL TIME: payomi ovozi
      await reloadChats();
    } catch (err) {
      setError(errorText(err, "Payomi ovozi firistoda nashud."));
    } finally {
      setSending(false);
    }
  }

  // ---------- Tark kardani payom ----------
  async function handleDelete(messageId: number) {
    try {
      await deleteMessage(token, messageId);
      setMessages((old) => old.filter((item) => item.messageId !== messageId));
      stopTyping();
      ping(); // REAL TIME: payom tark shud
      await reloadChats();
    } catch (err) {
      setError(errorText(err, "Payom tark nashud."));
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* ---------- Sarlavhai suhbat ---------- */}
      <header
        className="flex shrink-0 items-center gap-3 border-b px-4 py-3"
        style={{ borderColor: "var(--line)" }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Bozgasht"
          className={`${styles.iconBtn} md:hidden`}
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
        </button>

        <Avatar
          image={chat.userImage}
          name={chat.fullName || chat.userName}
          size={44}
          ring={canWrite}
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{chat.userName}</p>

          {/* Dar tagi nom: yo nomi purra, yo "menavisad..." */}
          {peerTyping ? (
            <p
              className={`${styles.typing} truncate text-[12px]`}
              aria-live="polite"
            >
              menavisad
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
            </p>
          ) : (
            <p
              className="truncate text-[12px]"
              style={{ color: "var(--muted)" }}
            >
              {chat.fullName}
            </p>
          )}
        </div>

        {/* ---------- ZVANOKHO ---------- */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => callUser(peerChat, "audio")}
            disabled={!canWrite || busy}
            aria-label="Zvanoki sadoi"
            title={canWrite ? "Zvanoki sadoi" : "Bo in korbar zvanok mumkin nest"}
            className={styles.headBtn}
          >
            <Phone className="h-5 w-5" strokeWidth={1.8} />
          </button>

          <button
            type="button"
            onClick={() => callUser(peerChat, "video")}
            disabled={!canWrite || busy}
            aria-label="Zvanoki video"
            title={canWrite ? "Zvanoki video" : "Bo in korbar zvanok mumkin nest"}
            className={styles.headBtn}
          >
            <Video className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>
      </header>

      {/* ---------- Payomho ---------- */}
      <div className={`${styles.scroll} flex-1 px-4 py-5`}>
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={styles.skeleton}
                style={{
                  height: 44,
                  width: i % 2 === 0 ? "55%" : "40%",
                  marginLeft: i % 2 === 0 ? 0 : "auto",
                }}
              />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <p
            className="py-20 text-center text-[13px]"
            style={{ color: "var(--muted)" }}
          >
            Hanuz payom nest. Avvalin payomro shumo navised.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((message, index) => {
              const previous = messages[index - 1];
              const newDay =
                previous === undefined ||
                new Date(previous.dateSent).toDateString() !==
                  new Date(message.dateSent).toDateString();

              return (
                <div key={message.messageId} className="flex flex-col gap-2">
                  {newDay && (
                    <span className={styles.dayChip}>
                      {dayLabel(message.dateSent)}
                    </span>
                  )}

                  <Bubble message={message} onDelete={handleDelete} />
                </div>
              );
            })}
          </div>
        )}

        <div ref={bottom} />
      </div>

      {/* ---------- Khato ---------- */}
      {error !== "" && (
        <p
          className={`${styles.snap} px-5 pb-2 text-[12px]`}
          style={{ color: "var(--signal)" }}
        >
          {error}
        </p>
      )}

      {/* ---------- Maidoni navishtan ---------- */}
      <div className="shrink-0 px-4 pb-4">
        {!canWrite ? (
          <div
            className="flex items-center gap-3 rounded-3xl px-5 py-4 text-[13px] leading-relaxed"
            style={{ background: "var(--panel)", color: "var(--muted)" }}
          >
            <Lock className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            <span>
              Bo in korbar navishtan mumkin nest: na u ba shumo podpiska
              kardaast, na shumo ba u.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSend}>
            {/* Peshnamoishi faylho */}
            {files.length > 0 && (
              <div className={`${styles.shotGrid} mb-2`}>
                {files.map((item, index) => (
                  <Shot
                    key={`${item.name}-${index}`}
                    file={item}
                    busy={sending}
                    onKill={() => dropFile(index)}
                  />
                ))}

                {files.length < MAX_FILES && (
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className={`${styles.shot} flex items-center justify-center`}
                    style={{ color: "var(--muted)" }}
                    aria-label="Boz surat guzored"
                  >
                    <ImagePlus className="h-5 w-5" strokeWidth={1.8} />
                  </button>
                )}
              </div>
            )}

            <div
              className={`${styles.composer} ${focused ? styles.composerFocus : ""}`}
            >
              <VoiceRecorder
                disabled={sending}
                onReady={sendVoice}
                onError={setError}
              />

              <textarea
                rows={1}
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  // Ba hamsuhbat: "man navishta istodaam"
                  if (event.target.value === "") stopTyping();
                  else beatTyping();
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                  setFocused(false);
                  stopTyping();
                }}
                onPaste={(event) => {
                  // Surat az buferi khotira (Ctrl+V)
                  const pasted = Array.from(event.clipboardData.files);
                  if (pasted.length > 0) {
                    event.preventDefault();
                    addFiles(pasted);
                  }
                }}
                onKeyDown={(event) => {
                  // Enter = firistodan, Shift+Enter = satri nav
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Payom navised..."
                className={styles.composerInput}
              />

              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={files.length >= MAX_FILES}
                aria-label="Surat yo video guzored"
                title="Surat yo video"
                className={styles.iconBtn}
              >
                <ImagePlus className="h-5 w-5" strokeWidth={1.8} />
              </button>

              <input
                ref={fileInput}
                type="file"
                accept="image/*,video/*"
                multiple
                hidden
                onChange={(event) => {
                  const picked = Array.from(event.target.files ?? []);
                  event.target.value = "";
                  addFiles(picked);
                }}
              />

              <button
                type="submit"
                disabled={
                  sending || (text.trim() === "" && files.length === 0)
                }
                aria-label="Firistodan"
                className={styles.sendBtn}
              >
                {sending ? (
                  <span className={styles.blocks}>
                    <i />
                    <i />
                    <i />
                  </span>
                ) : (
                  <Send className="h-4 w-4" strokeWidth={2} />
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
//  Peshnamoishi yak fayli intikhobshuda
// ------------------------------------------------------------
function Shot({
  file,
  busy,
  onKill,
}: {
  file: File;
  busy: boolean;
  onKill: () => void;
}) {
  // Manzili peshnamoish - yakbora soakhta meshavad va ba'd ozod
  const url = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  const video = file.type.startsWith("video/");

  return (
    <span className={styles.shot}>
      {video ? (
        <video src={url} className="h-full w-full object-cover" muted />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      )}

      <span className={styles.shotSize}>{sizeText(file.size)}</span>

      {busy ? (
        <span className={styles.shotBusy}>...</span>
      ) : (
        <button
          type="button"
          onClick={onKill}
          aria-label="Faylro tark kuned"
          className={styles.shotKill}
        >
          <X className="h-3 w-3" strokeWidth={2.6} />
        </button>
      )}
    </span>
  );
}

// ------------------------------------------------------------
//  Yak payom. Payomhoi KHUDAM - rost va gradient.
// ------------------------------------------------------------
function Bubble({
  message,
  onDelete,
}: {
  message: Message;
  onDelete: (id: number) => void;
}) {
  const mine = message.isMine;
  const src = mediaUrl(message.fileName);

  const audio = isAudioFile(message.fileName);
  const image = isImageFile(message.fileName);
  const video = isVideoFile(message.fileName);

  return (
    <div
      className={`group flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
    >
      {mine && (
        <button
          type="button"
          onClick={() => onDelete(message.messageId)}
          aria-label="Payomro tark kuned"
          className="mb-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          style={{ color: "var(--muted)" }}
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      )}

      <div
        className={`${mine ? styles.bubbleMine : styles.bubbleTheirs} max-w-[78%] px-4 py-2.5 sm:max-w-[65%]`}
      >
        {src !== null && audio && <VoiceMessage src={src} />}

        {src !== null && !audio && image && (
          <a href={src} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              className="mb-2 max-h-72 w-full rounded-2xl object-cover"
              loading="lazy"
            />
          </a>
        )}

        {src !== null && !audio && video && (
          <video
            src={src}
            controls
            className="mb-2 max-h-72 w-full rounded-2xl object-cover"
          />
        )}

        {src !== null && !audio && !image && !video && (
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="mb-1 block text-[13px] underline"
          >
            {message.fileName}
          </a>
        )}

        {message.messageText !== null && message.messageText !== "" && (
          <p className="whitespace-pre-wrap wrap-break-words text-[14px] leading-relaxed">
            {message.messageText}
          </p>
        )}

        <span
          className="mt-1 block text-right text-[10px]"
          style={{ opacity: 0.7 }}
        >
          {clockTime(message.dateSent)}
        </span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
//  Khurd kardani surat.
//  Suratho az telefon 4-8 MB meshavand -> server "413" medihad.
//  Baroi hamin pahni ba 1600px va JPEG 0.82 tabdil mekunem.
//  Agar chize nashavad - fayli asli mefiristem.
// ------------------------------------------------------------
async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/gif") return file; // gif harakatashro gum mekunad
  if (typeof document === "undefined") return file;

  const LIMIT = 1600;
  const SOFT = 900 * 1024; // az 900 KB khurdtar - hamon tavr mefiristem

  try {
    const bitmap = await loadBitmap(file);

    const scale = Math.min(1, LIMIT / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= SOFT) return file;

    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (ctx === null) return file;

    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82)
    );

    if (blob === null || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

function loadBitmap(
  file: File
): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("surat kushoda nashud"));
    };

    image.src = url;
  });
}

// 1536000 -> "1.5 MB"
function sizeText(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
