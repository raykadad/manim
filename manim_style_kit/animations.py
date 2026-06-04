from __future__ import annotations

from collections.abc import Sequence

from manim import (
    Animation,
    Arrow,
    Create,
    FadeIn,
    GrowFromCenter,
    Indicate,
    LaggedStart,
    MathTex,
    Mobject,
    Scene,
    TransformMatchingShapes,
    TransformMatchingTex,
    VGroup,
    Write,
)

from .theme import AI_EXPLAINER_THEME, StyleConfig


def reveal(mob: Mobject, method: str = "fade", shift=None) -> Animation:
    """Return a polished default reveal animation."""

    if method == "write":
        return Write(mob)
    if method == "grow":
        return GrowFromCenter(mob)
    if method == "create":
        return Create(mob)
    return FadeIn(mob, shift=shift)


def stagger_write(
    scene: Scene,
    items: Sequence[Mobject],
    lag_ratio: float = 0.16,
    run_time: float = 1.25,
    method: str = "fade",
) -> None:
    """Reveal many labels or cards with a calm stagger."""

    scene.play(
        LaggedStart(*(reveal(item, method=method) for item in items), lag_ratio=lag_ratio),
        run_time=run_time,
    )


def transform_formula(
    scene: Scene,
    old: Mobject,
    new: Mobject,
    run_time: float = 1.1,
) -> None:
    """Transform formulas with token-aware matching when possible."""

    if isinstance(old, MathTex) and isinstance(new, MathTex):
        scene.play(TransformMatchingTex(old, new), run_time=run_time)
    else:
        scene.play(TransformMatchingShapes(old, new), run_time=run_time)


def emphasize(
    scene: Scene,
    target: Mobject,
    theme: StyleConfig = AI_EXPLAINER_THEME,
    color: str = "secondary",
    scale_factor: float = 1.04,
    run_time: float = 0.8,
) -> None:
    """Briefly pulse an important object."""

    scene.play(
        Indicate(
            target,
            color=theme.color(color),
            scale_factor=scale_factor,
        ),
        run_time=run_time,
    )


def concept_flow(
    concepts: Sequence[Mobject],
    theme: StyleConfig = AI_EXPLAINER_THEME,
    arrow_buff: float = 0.14,
) -> VGroup:
    """Connect a row of concept cards with subtle arrows."""

    arrows = VGroup()
    for left, right in zip(concepts, concepts[1:]):
        arrows.add(
            Arrow(
                left.get_right(),
                right.get_left(),
                buff=arrow_buff,
                stroke_width=3,
                color=theme.color("primary"),
                max_tip_length_to_length_ratio=0.08,
            )
        )
    return VGroup(*concepts, arrows)
