"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ImageIcon } from "@/components/icons";

/** Новый пост: POST /Post/add-post (multipart, поле Images обязательно). */
export default function CreatePage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<{ file: File; url: string }[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const files = picked.map((item) => item.file);

  // Локальные превью живут в blob-URL — освобождаем при смене выбора и уходе.
  useEffect(() => () => picked.forEach((item) => URL.revokeObjectURL(item.url)), [picked]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (files.length === 0) {
      setError("Выберите хотя бы один файл");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      if (title.trim()) form.append("Title", title.trim());
      if (content.trim()) form.append("Content", content.trim());
      files.forEach((file) => form.append("Images", file));

      await api.addPost(form);
      router.push("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось опубликовать");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[600px] px-4 py-6">
      <h1 className="animate-fade-up mb-5 text-[22px] font-bold">Create post</h1>

      <form onSubmit={submit} className="space-y-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#dbdbdb] bg-[linear-gradient(135deg,#fafafa,#f7f9ff)] py-12 text-[#8e8e8e] transition-all duration-300 hover:border-[#0095f6] hover:bg-[#f5faff] hover:text-[#0095f6]"
        >
          <span className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110">
            <ImageIcon size={40} />
          </span>
          <span className="text-[14px]">
            {files.length ? `Выбрано файлов: ${files.length}` : "Выбрать фото или видео"}
          </span>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={(event) =>
            setPicked(
              Array.from(event.target.files ?? []).map((file) => ({
                file,
                url: URL.createObjectURL(file),
              })),
            )
          }
        />

        {picked.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {picked.map((item, index) => (
              <div
                key={item.url}
                style={{ animationDelay: `${Math.min(index, 9) * 50}ms` }}
                className="animate-scale-in aspect-square overflow-hidden rounded-xl bg-[#efefef] transition-transform duration-300 hover:scale-[1.03]"
              >
                {item.file.type.startsWith("video") ? (
                  <video src={item.url} className="h-full w-full object-cover" muted />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
            ))}
          </div>
        )}

        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Заголовок (необязательно)"
          className="w-full rounded-xl border border-[#dbdbdb] px-3 py-2.5 text-[14px] outline-none transition-all duration-200 focus:border-[#0095f6] focus:shadow-[0_0_0_3px_rgba(0,149,246,0.15)]"
        />

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Описание"
          rows={4}
          className="w-full resize-none rounded-xl border border-[#dbdbdb] px-3 py-2.5 text-[14px] outline-none transition-all duration-200 focus:border-[#0095f6] focus:shadow-[0_0_0_3px_rgba(0,149,246,0.15)]"
        />

        {error && <p className="text-[13px] text-[#ed4956]">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-[#0095f6] py-2.5 text-[14px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(0,149,246,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1877f2] active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? "Публикуем..." : "Опубликовать"}
        </button>
      </form>
    </div>
  );
}
