import sanitizeHtml from "sanitize-html";

export function sanitizeRichHtml(value: unknown): string {
  const html = String(value ?? "").trim();

  if (!html) {
    return "";
  }

  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "ul",
      "ol",
      "li",
      "h2",
      "h3",
      "h4",
      "blockquote",
      "a",
      "hr",
      "code",
      "pre",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    enforceHtmlBoundary: true,
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          ...(attribs.target === "_blank"
            ? { rel: "noopener noreferrer" }
            : {}),
        },
      }),
    },
  }).trim();
}
