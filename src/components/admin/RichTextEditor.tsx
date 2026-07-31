"use client";

import { useEffect, useRef } from "react";
import { Bold, Italic, Link2, List, ListOrdered } from "lucide-react";

type RichTextEditorProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  minHeightClassName?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
};

type EditorCommand = "bold" | "italic" | "insertUnorderedList" | "insertOrderedList";

function normalizeLink(value: string): string | null {
  const link = value.trim();
  if (!link) {
    return null;
  }

  if (/^(https?:\/\/|mailto:|tel:)/i.test(link)) {
    return link;
  }

  return `https://${link}`;
}

export default function RichTextEditor({
  id,
  value,
  onChange,
  minHeightClassName = "min-h-40",
  placeholder = "Escribe aquí...",
  disabled = false,
  required = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && document.activeElement !== editor && editor.innerHTML !== value) {
      editor.innerHTML = value;
    }
  }, [value]);

  function emitChange() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const hasText = Boolean(editor.textContent?.replace(/\u00a0/g, " ").trim());
    onChange(hasText ? editor.innerHTML : "");
  }

  function saveSelection() {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      selectionRef.current = range.cloneRange();
    }
  }

  function restoreSelection() {
    const editor = editorRef.current;
    const range = selectionRef.current;
    if (!editor || !range) {
      return false;
    }

    editor.focus();
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    return true;
  }

  function runCommand(command: EditorCommand) {
    restoreSelection();
    document.execCommand(command, false);
    saveSelection();
    emitChange();
  }

  function addLink() {
    const selectedText = selectionRef.current?.toString().trim();
    if (!selectedText) {
      window.alert("Selecciona primero el texto que quieres convertir en enlace.");
      editorRef.current?.focus();
      return;
    }

    const enteredLink = window.prompt("Ingresa la dirección del enlace:", "https://");
    if (enteredLink === null) {
      return;
    }

    const link = normalizeLink(enteredLink);
    if (!link || !restoreSelection()) {
      return;
    }

    document.execCommand("createLink", false, link);
    editorRef.current?.querySelectorAll("a").forEach((anchor) => {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    });
    saveSelection();
    emitChange();
  }

  function applyColor(color: string) {
    restoreSelection();
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("foreColor", false, color);
    saveSelection();
    emitChange();
  }

  const toolbarButtonClass =
    "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-slate-300 focus-within:ring-2 focus-within:ring-sky-100">
      <div
        className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-white px-3 py-2"
        role="toolbar"
        aria-label={`Formato de ${id}`}
      >
        <button type="button" className={toolbarButtonClass} aria-label="Negrita" title="Negrita" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("bold")}>
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" className={toolbarButtonClass} aria-label="Cursiva" title="Cursiva" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("italic")}>
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" className={toolbarButtonClass} aria-label="Lista con viñetas" title="Lista con viñetas" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("insertUnorderedList")}>
          <List className="h-4 w-4" />
        </button>
        <button type="button" className={toolbarButtonClass} aria-label="Lista numerada" title="Lista numerada" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("insertOrderedList")}>
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" className={toolbarButtonClass} aria-label="Agregar enlace" title="Agregar enlace" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={addLink}>
          <Link2 className="h-4 w-4" />
        </button>
        <label className="ml-1 inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600">
          Color
          <input
            type="color"
            aria-label="Color del texto"
            className="h-6 w-7 cursor-pointer border-0 bg-transparent p-0"
            defaultValue="#334155"
            disabled={disabled}
            onMouseDown={saveSelection}
            onChange={(event) => applyColor(event.target.value)}
          />
        </label>
      </div>

      <div
        ref={editorRef}
        id={id}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-required={required}
        aria-disabled={disabled}
        data-placeholder={placeholder}
        className={`${minHeightClassName} news-content px-4 py-3 text-sm leading-7 text-slate-800 outline-none empty:before:pointer-events-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]`}
        onInput={emitChange}
        onBlur={() => {
          saveSelection();
          emitChange();
        }}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
      />
    </div>
  );
}
