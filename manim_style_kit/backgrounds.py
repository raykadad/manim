from __future__ import annotations

import random

from manim import (
    BLUE_E,
    Circle,
    Dot,
    NumberPlane,
    ORIGIN,
    OUT,
    Rectangle,
    ThreeDAxes,
    VGroup,
    config,
)

from .theme import AI_EXPLAINER_THEME, StyleConfig


def deep_space_background(
    theme: StyleConfig = AI_EXPLAINER_THEME,
    stars: int = 70,
    seed: int = 12,
) -> VGroup:
    """Layered dark background with subtle particles.

    The deterministic seed keeps renders stable across agent runs.
    """

    rng = random.Random(seed)
    base = Rectangle(
        width=config.frame_width,
        height=config.frame_height,
        stroke_width=0,
        fill_color=theme.color("background"),
        fill_opacity=1,
    ).set_z_index(-100)
    glow_primary = Circle(
        radius=3.7,
        stroke_width=0,
        fill_color=theme.color("accent"),
        fill_opacity=0.12,
    ).shift(OUT * 0.01).move_to([-4.8, 2.6, 0]).set_z_index(-99)
    glow_secondary = Circle(
        radius=2.9,
        stroke_width=0,
        fill_color=theme.color("primary"),
        fill_opacity=0.09,
    ).move_to([4.7, -2.7, 0]).set_z_index(-99)

    particles = VGroup()
    for _ in range(stars):
        x = rng.uniform(-config.frame_width / 2, config.frame_width / 2)
        y = rng.uniform(-config.frame_height / 2, config.frame_height / 2)
        opacity = rng.uniform(0.12, 0.36)
        radius = rng.uniform(0.008, 0.026)
        particles.add(
            Dot(
                point=[x, y, 0],
                radius=radius,
                color=theme.color("muted"),
                fill_opacity=opacity,
            ).set_z_index(-98)
        )
    return VGroup(base, glow_primary, glow_secondary, particles)


def concept_stage(theme: StyleConfig = AI_EXPLAINER_THEME, grid_opacity: float = 0.18) -> VGroup:
    """Default stage for 2D explainers: background plus faint coordinate grid."""

    background = deep_space_background(theme=theme)
    grid = NumberPlane(
        x_range=(-8, 9, 1),
        y_range=(-5, 6, 1),
        background_line_style={
            "stroke_color": theme.color("grid"),
            "stroke_width": 1,
            "stroke_opacity": grid_opacity,
        },
        axis_config={"stroke_opacity": 0},
    ).set_z_index(-90)
    return VGroup(background, grid)


def grid_floor(
    theme: StyleConfig = AI_EXPLAINER_THEME,
    x_range: tuple[int, int, int] = (-7, 8, 1),
    y_range: tuple[int, int, int] = (-4, 5, 1),
) -> NumberPlane:
    """Create a low-contrast floor grid for ThreeDScene compositions."""

    return NumberPlane(
        x_range=x_range,
        y_range=y_range,
        background_line_style={
            "stroke_color": theme.color("grid"),
            "stroke_width": 1,
            "stroke_opacity": 0.28,
        },
        axis_config={"stroke_color": BLUE_E, "stroke_opacity": 0.15},
    ).set_z_index(-50)


def add_depth_cues(theme: StyleConfig = AI_EXPLAINER_THEME) -> VGroup:
    """Return translucent rings that make 3D scenes feel less empty."""

    rings = VGroup()
    for index, radius in enumerate((1.4, 2.6, 3.8)):
        ring = Circle(
            radius=radius,
            stroke_color=theme.color("accent" if index % 2 else "primary"),
            stroke_width=1.4,
            stroke_opacity=0.18 - index * 0.035,
        )
        ring.move_to(ORIGIN)
        ring.set_z_index(-40 + index)
        rings.add(ring)
    return rings


def three_d_axes(theme: StyleConfig = AI_EXPLAINER_THEME) -> ThreeDAxes:
    """A restrained 3D axes preset suitable for math and ML surfaces."""

    return ThreeDAxes(
        x_range=(-4, 4, 1),
        y_range=(-4, 4, 1),
        z_range=(-2, 4, 1),
        x_length=7.5,
        y_length=7.5,
        z_length=4.2,
        axis_config={
            "stroke_color": theme.color("muted"),
            "stroke_width": 1.6,
            "stroke_opacity": 0.65,
        },
    )
