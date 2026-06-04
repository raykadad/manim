from __future__ import annotations

from dataclasses import dataclass, field
from typing import Mapping

from manim import ManimColor, config


PALETTES: dict[str, dict[str, str]] = {
    "ai_explainer": {
        "background": "#0B1020",
        "surface": "#141B34",
        "surface_high": "#1D2747",
        "primary": "#42E8F4",
        "secondary": "#FFB86B",
        "accent": "#8C7CF8",
        "success": "#70E08A",
        "warning": "#FFD166",
        "danger": "#FF6B7A",
        "text": "#F7FAFF",
        "muted": "#B7C0D8",
        "grid": "#2C365F",
        "shadow": "#050814",
    },
    "science": {
        "background": "#07130F",
        "surface": "#10261D",
        "surface_high": "#18372C",
        "primary": "#72F2B6",
        "secondary": "#F5D76E",
        "accent": "#7AA2FF",
        "success": "#9CF27A",
        "warning": "#FFB86B",
        "danger": "#FF6B7A",
        "text": "#F5FFF9",
        "muted": "#B7D3C5",
        "grid": "#244D3C",
        "shadow": "#020805",
    },
}


@dataclass(frozen=True)
class StyleConfig:
    """Central visual contract for a family of videos.

    Keep a scene tied to one StyleConfig. That makes generated scenes easier to
    review and prevents AI-produced shots from drifting between styles.
    """

    palette_name: str = "ai_explainer"
    font: str = "Inter"
    code_font: str = "JetBrains Mono"
    title_size: int = 54
    subtitle_size: int = 34
    body_size: int = 30
    small_size: int = 22
    formula_size: int = 42
    stroke_width: float = 2.0
    corner_radius: float = 0.18
    card_opacity: float = 0.92
    safe_margin_x: float = 0.85
    safe_margin_y: float = 0.55
    animation_run_time: float = 0.9
    palette_overrides: Mapping[str, str] = field(default_factory=dict)

    @property
    def palette(self) -> dict[str, str]:
        base = PALETTES[self.palette_name].copy()
        base.update(self.palette_overrides)
        return base

    def color(self, name: str) -> ManimColor:
        return ManimColor(self.palette[name])


AI_EXPLAINER_THEME = StyleConfig()
SCIENCE_THEME = StyleConfig(palette_name="science")


def palette_color(name: str, theme: StyleConfig = AI_EXPLAINER_THEME) -> ManimColor:
    """Return a named color from a theme palette."""

    return theme.color(name)


def apply_theme(theme: StyleConfig = AI_EXPLAINER_THEME) -> None:
    """Apply global Manim settings shared by the kit.

    Call this before constructing scenes if a file defines custom Manim config.
    Base scene classes call it automatically.
    """

    config.background_color = theme.color("background")
