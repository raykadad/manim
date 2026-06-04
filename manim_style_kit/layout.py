from __future__ import annotations

from collections.abc import Iterable

from manim import (
    DOWN,
    LEFT,
    ORIGIN,
    RIGHT,
    UP,
    Group,
    Mobject,
    RoundedRectangle,
    VGroup,
    config,
)

from .theme import AI_EXPLAINER_THEME, StyleConfig


def safe_bounds(theme: StyleConfig = AI_EXPLAINER_THEME) -> tuple[float, float]:
    """Return max content width and height inside the visual safe area."""

    return (
        config.frame_width - (2 * theme.safe_margin_x),
        config.frame_height - (2 * theme.safe_margin_y),
    )


def fit_to_safe_area(
    mob: Mobject,
    theme: StyleConfig = AI_EXPLAINER_THEME,
    width_ratio: float = 1.0,
    height_ratio: float = 1.0,
) -> Mobject:
    """Scale a mobject into the safe area without changing aspect ratio."""

    max_width, max_height = safe_bounds(theme)
    max_width *= width_ratio
    max_height *= height_ratio
    if mob.width > max_width:
        mob.scale_to_fit_width(max_width)
    if mob.height > max_height:
        mob.scale_to_fit_height(max_height)
    return mob


def keep_in_safe_area(mob: Mobject, theme: StyleConfig = AI_EXPLAINER_THEME) -> Mobject:
    """Move a mobject back inside the frame safe area."""

    half_width = config.frame_width / 2 - theme.safe_margin_x
    half_height = config.frame_height / 2 - theme.safe_margin_y
    if mob.get_right()[0] > half_width:
        mob.shift(LEFT * (mob.get_right()[0] - half_width))
    if mob.get_left()[0] < -half_width:
        mob.shift(RIGHT * (-half_width - mob.get_left()[0]))
    if mob.get_top()[1] > half_height:
        mob.shift(DOWN * (mob.get_top()[1] - half_height))
    if mob.get_bottom()[1] < -half_height:
        mob.shift(UP * (-half_height - mob.get_bottom()[1]))
    return mob


def stack(
    *items: Mobject,
    direction=DOWN,
    buff: float = 0.32,
    aligned_edge=LEFT,
    theme: StyleConfig = AI_EXPLAINER_THEME,
) -> VGroup:
    """Arrange items with safe-area fitting for text-heavy explainer shots."""

    group = VGroup(*items).arrange(direction, buff=buff, aligned_edge=aligned_edge)
    fit_to_safe_area(group, theme)
    return group


def safe_group(
    items: Iterable[Mobject],
    direction=DOWN,
    buff: float = 0.28,
    aligned_edge=LEFT,
    theme: StyleConfig = AI_EXPLAINER_THEME,
) -> VGroup:
    """Create a VGroup that is immediately arranged and safe-area constrained."""

    return stack(*list(items), direction=direction, buff=buff, aligned_edge=aligned_edge, theme=theme)


def card(
    content: Mobject,
    theme: StyleConfig = AI_EXPLAINER_THEME,
    padding: float = 0.35,
    min_width: float | None = None,
    min_height: float | None = None,
    stroke_color: str = "primary",
    fill_color: str = "surface",
) -> VGroup:
    """Wrap content in a rounded, readable card."""

    width = max(content.width + (2 * padding), min_width or 0)
    height = max(content.height + (2 * padding), min_height or 0)
    box = RoundedRectangle(
        width=width,
        height=height,
        corner_radius=theme.corner_radius,
        stroke_width=theme.stroke_width,
        stroke_color=theme.color(stroke_color),
        fill_color=theme.color(fill_color),
        fill_opacity=theme.card_opacity,
    )
    content.move_to(box.get_center())
    return VGroup(box, content)


def place_title(title: Mobject, theme: StyleConfig = AI_EXPLAINER_THEME) -> Mobject:
    """Anchor a title at the upper-left safe area."""

    title.to_corner(UP + LEFT, buff=theme.safe_margin_y)
    title.shift(RIGHT * (theme.safe_margin_x - theme.safe_margin_y))
    return keep_in_safe_area(title, theme)


def place_footer(footer: Mobject, theme: StyleConfig = AI_EXPLAINER_THEME) -> Mobject:
    """Anchor small context text at the lower-right safe area."""

    footer.to_corner(DOWN + RIGHT, buff=theme.safe_margin_y)
    footer.shift(LEFT * (theme.safe_margin_x - theme.safe_margin_y))
    return keep_in_safe_area(footer, theme)


def center_stage(content: Mobject, theme: StyleConfig = AI_EXPLAINER_THEME) -> Mobject:
    """Fit content and place it in the central composition zone."""

    fit_to_safe_area(content, theme, width_ratio=0.9, height_ratio=0.82)
    content.move_to(ORIGIN)
    return content


def overlap_free_columns(
    left: Mobject,
    right: Mobject,
    theme: StyleConfig = AI_EXPLAINER_THEME,
    gap: float = 0.7,
) -> Group:
    """Place two visual blocks as columns with a clear gap."""

    group = Group(left, right).arrange(RIGHT, buff=gap)
    fit_to_safe_area(group, theme, width_ratio=0.95, height_ratio=0.82)
    group.move_to(ORIGIN)
    return group
