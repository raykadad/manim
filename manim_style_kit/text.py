from __future__ import annotations

from collections.abc import Sequence

from manim import DOWN, LEFT, MathTex, Mobject, Text, VGroup

from .layout import card as make_card
from .layout import fit_to_safe_area, stack
from .theme import AI_EXPLAINER_THEME, StyleConfig


def title_text(
    text: str,
    theme: StyleConfig = AI_EXPLAINER_THEME,
    color: str = "text",
) -> Text:
    """Large, high-contrast title text."""

    return Text(
        text,
        font=theme.font,
        font_size=theme.title_size,
        color=theme.color(color),
        weight="BOLD",
    )


def body_text(
    text: str,
    theme: StyleConfig = AI_EXPLAINER_THEME,
    color: str = "muted",
    size: int | None = None,
) -> Text:
    """Readable explanatory copy for captions and labels."""

    return Text(
        text,
        font=theme.font,
        font_size=size or theme.body_size,
        color=theme.color(color),
        line_spacing=0.9,
    )


def keyword_text(
    text: str,
    theme: StyleConfig = AI_EXPLAINER_THEME,
    color: str = "primary",
    size: int | None = None,
) -> Text:
    """Accent text for terms the viewer should remember."""

    return Text(
        text,
        font=theme.font,
        font_size=size or theme.subtitle_size,
        color=theme.color(color),
        weight="BOLD",
    )


def math_formula(
    tex: str,
    theme: StyleConfig = AI_EXPLAINER_THEME,
    color_map: dict[str, str] | None = None,
    isolate: Sequence[str] | None = None,
    size: int | None = None,
) -> MathTex:
    """Create a styled MathTex expression with optional token highlighting."""

    tex_to_color_map = {
        token: theme.color(color_name)
        for token, color_name in (color_map or {}).items()
    }
    formula = MathTex(
        tex,
        substrings_to_isolate=list(isolate or []),
        tex_to_color_map=tex_to_color_map,
        font_size=size or theme.formula_size,
        color=theme.color("text"),
    )
    return formula


def formula_card(
    tex: str,
    theme: StyleConfig = AI_EXPLAINER_THEME,
    color_map: dict[str, str] | None = None,
    title: str | None = None,
) -> VGroup:
    """Render a formula in a dedicated card with optional label."""

    formula = math_formula(tex, theme=theme, color_map=color_map)
    if title:
        label = keyword_text(title, theme=theme, color="secondary", size=theme.small_size)
        content = stack(label, formula, direction=DOWN, buff=0.22, aligned_edge=LEFT, theme=theme)
    else:
        content = formula
    wrapped = make_card(content, theme=theme, padding=0.42, stroke_color="accent")
    fit_to_safe_area(wrapped, theme, width_ratio=0.92, height_ratio=0.35)
    return wrapped


def bullet_list(
    lines: Sequence[str],
    theme: StyleConfig = AI_EXPLAINER_THEME,
    bullet_color: str = "primary",
    text_color: str = "muted",
    gap: float = 0.18,
) -> VGroup:
    """Create simple ASCII bullets that remain legible after compression."""

    rows: list[Mobject] = []
    for line in lines:
        bullet = Text("-", font=theme.font, font_size=theme.body_size, color=theme.color(bullet_color))
        label = body_text(line, theme=theme, color=text_color)
        row = VGroup(bullet, label).arrange(LEFT * -1, buff=0.18, aligned_edge=DOWN)
        rows.append(row)
    return stack(*rows, direction=DOWN, buff=gap, aligned_edge=LEFT, theme=theme)


def code_block(
    code: str,
    theme: StyleConfig = AI_EXPLAINER_THEME,
    language_label: str | None = None,
) -> VGroup:
    """Create a compact code card using a monospace font."""

    code_lines = [
        Text(line, font=theme.code_font, font_size=theme.small_size, color=theme.color("text"))
        for line in code.splitlines()
    ]
    code_group = stack(*code_lines, direction=DOWN, buff=0.08, aligned_edge=LEFT, theme=theme)
    if language_label:
        label = keyword_text(language_label, theme=theme, color="secondary", size=theme.small_size)
        code_group = stack(label, code_group, direction=DOWN, buff=0.2, aligned_edge=LEFT, theme=theme)
    return make_card(code_group, theme=theme, padding=0.34, stroke_color="grid")
