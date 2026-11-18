package com.itstudy.util;

/** 摘要、搜索片段与转义工具。 */
public final class TextUtil {

    private TextUtil() {
    }

    /** 把 Markdown 压成纯文本：去掉代码块围栏、标题/列表/引用/强调标记。 */
    public static String stripMarkdown(String markdown) {
        if (markdown == null) {
            return "";
        }
        String text = markdown.replace("\r\n", "\n");
        StringBuilder sb = new StringBuilder(text.length());
        for (String line : text.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.startsWith("\u0060\u0060\u0060")) {
                continue;
            }
            trimmed = trimmed.replaceAll("^#{1,6}\\s*", "");
            trimmed = trimmed.replaceAll("^>\\s*", "");
            trimmed = trimmed.replaceAll("^[-*+]\\s+", "");
            trimmed = trimmed.replaceAll("^\\d+\\.\\s+", "");
            sb.append(trimmed).append(' ');
        }
        String plain = sb.toString()
                .replaceAll("!\\[([^\\]]*)]\\([^)]*\\)", "$1")
                .replaceAll("\\[([^\\]]*)]\\([^)]*\\)", "$1")
                .replaceAll("\\*\\*|__|\u0060|~~", "")
                .replaceAll("\\s+", " ")
                .trim();
        return plain;
    }

    /** 取正文首段作为列表摘要。 */
    public static String summarize(String markdown, int maxLength) {
        String plain = stripMarkdown(markdown);
        if (plain.length() <= maxLength) {
            return plain;
        }
        return plain.substring(0, maxLength) + "\u2026";
    }

    /** HTML 转义（先转义再插 mark 标签）。 */
    public static String escapeHtml(String raw) {
        if (raw == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder(raw.length() + 16);
        for (char c : raw.toCharArray()) {
            switch (c) {
                case '&' -> sb.append("&amp;");
                case '<' -> sb.append("&lt;");
                case '>' -> sb.append("&gt;");
                case '"' -> sb.append("&quot;");
                case '\'' -> sb.append("&#39;");
                default -> sb.append(c);
            }
        }
        return sb.toString();
    }

    /**
     * 生成搜索片段：关键字先按明文定位，再对三段文本分别做 HTML 转义，最后包上 mark 标签。
     */
    public static String snippet(String source, String keyword, int radius) {
        String text = stripMarkdown(source == null ? "" : source).replaceAll("\\s+", " ").trim();
        if (text.isEmpty()) {
            return "";
        }
        if (keyword == null || keyword.isBlank()) {
            return escapeHtml(text.length() > radius * 2 ? text.substring(0, radius * 2) + "\u2026" : text);
        }
        String lowerText = text.toLowerCase();
        String lowerKeyword = keyword.toLowerCase();
        int index = lowerText.indexOf(lowerKeyword);
        if (index < 0) {
            String head = text.length() > radius * 2 ? text.substring(0, radius * 2) + "\u2026" : text;
            return escapeHtml(head);
        }
        int start = Math.max(0, index - radius);
        int end = Math.min(text.length(), index + keyword.length() + radius);
        String before = text.substring(start, index);
        String hit = text.substring(index, index + keyword.length());
        String after = text.substring(index + keyword.length(), end);
        StringBuilder sb = new StringBuilder();
        if (start > 0) {
            sb.append("\u2026");
        }
        sb.append(escapeHtml(before));
        sb.append("<mark>").append(escapeHtml(hit)).append("</mark>");
        sb.append(escapeHtml(after));
        if (end < text.length()) {
            sb.append("\u2026");
        }
        return sb.toString();
    }
}
