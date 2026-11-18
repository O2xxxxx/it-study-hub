package com.itstudy.util;

import org.commonmark.Extension;
import org.commonmark.ext.gfm.tables.TablesExtension;
import org.commonmark.node.Node;
import org.commonmark.parser.Parser;
import org.commonmark.renderer.html.HtmlRenderer;
import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Markdown -> HTML：CommonMark(+GFM 表格) 渲染后用 OWASP HTML Sanitizer 白名单清洗。
 */
@Component
public class MarkdownRenderer {

    private final Parser parser;
    private final HtmlRenderer renderer;
    private final PolicyFactory policy;

    public MarkdownRenderer() {
        List<Extension> extensions = List.of(TablesExtension.create());
        this.parser = Parser.builder().extensions(extensions).build();
        this.renderer = HtmlRenderer.builder().extensions(extensions).escapeHtml(true).build();
        this.policy = new HtmlPolicyBuilder()
                .allowElements(
                        "p", "h1", "h2", "h3", "h4", "h5", "h6",
                        "ul", "ol", "li", "blockquote", "pre", "code",
                        "table", "thead", "tbody", "tr", "th", "td",
                        "a", "img", "strong", "em", "del", "hr", "br")
                .allowUrlProtocols("http", "https", "mailto")
                .allowAttributes("href", "title").onElements("a")
                .allowAttributes("src", "alt", "title").onElements("img")
                .toFactory();
    }

    /** 渲染并清洗，输出可直接注入页面的安全 HTML。 */
    public String toHtml(String markdown) {
        if (markdown == null || markdown.isBlank()) {
            return "";
        }
        Node document = parser.parse(markdown);
        return policy.sanitize(renderer.render(document));
    }
}
