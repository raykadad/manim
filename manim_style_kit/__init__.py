"""Polished Manim helpers for educational explainer videos.

The package intentionally exposes a compact surface area so an AI agent can
compose scenes without remembering every Manim detail.
"""

from .animations import (
    concept_flow,
    emphasize,
    reveal,
    stagger_write,
    transform_formula,
)
from .backgrounds import (
    add_depth_cues,
    concept_stage,
    deep_space_background,
    grid_floor,
)
from .camera import (
    CameraPreset,
    camera_sweep,
    focus_camera_on,
    set_camera_preset,
)
from .layout import (
    card,
    fit_to_safe_area,
    place_footer,
    place_title,
    safe_group,
    stack,
)
from .scenes import BaseAIExplainerScene, BaseAIThreeDScene
from .text import (
    body_text,
    bullet_list,
    code_block,
    formula_card,
    keyword_text,
    math_formula,
    title_text,
)
from .theme import (
    AI_EXPLAINER_THEME,
    SCIENCE_THEME,
    StyleConfig,
    apply_theme,
    palette_color,
)

__all__ = [
    "AI_EXPLAINER_THEME",
    "SCIENCE_THEME",
    "BaseAIExplainerScene",
    "BaseAIThreeDScene",
    "CameraPreset",
    "StyleConfig",
    "add_depth_cues",
    "apply_theme",
    "body_text",
    "bullet_list",
    "camera_sweep",
    "card",
    "code_block",
    "concept_flow",
    "concept_stage",
    "deep_space_background",
    "emphasize",
    "fit_to_safe_area",
    "focus_camera_on",
    "formula_card",
    "grid_floor",
    "keyword_text",
    "math_formula",
    "palette_color",
    "place_footer",
    "place_title",
    "reveal",
    "safe_group",
    "set_camera_preset",
    "stack",
    "stagger_write",
    "title_text",
    "transform_formula",
]
