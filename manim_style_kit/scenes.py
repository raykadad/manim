from __future__ import annotations

from collections.abc import Sequence

from manim import DOWN, FadeOut, Scene, ThreeDScene, VGroup, Write

from .animations import reveal, stagger_write
from .backgrounds import concept_stage, deep_space_background, grid_floor
from .camera import CameraPreset, FRONT_3D, set_camera_preset
from .layout import card, center_stage, place_footer, place_title, stack
from .text import body_text, bullet_list, formula_card, title_text
from .theme import AI_EXPLAINER_THEME, StyleConfig, apply_theme


class BaseAIExplainerScene(Scene):
    """Base class for polished 2D educational scenes.

    Subclass this for algorithm, math, chemistry, or conceptual explainer shots.
    """

    theme: StyleConfig = AI_EXPLAINER_THEME
    use_grid: bool = True

    def setup(self) -> None:
        super().setup()
        apply_theme(self.theme)
        self._background = concept_stage(self.theme) if self.use_grid else deep_space_background(self.theme)
        self.add(self._background)

    def title(self, text: str):
        mob = place_title(title_text(text, self.theme), self.theme)
        self.play(Write(mob), run_time=self.theme.animation_run_time)
        return mob

    def caption(self, text: str, position=DOWN):
        mob = card(body_text(text, self.theme), theme=self.theme, padding=0.25, stroke_color="grid")
        mob.to_edge(position, buff=self.theme.safe_margin_y)
        self.play(reveal(mob, shift=position * 0.15), run_time=self.theme.animation_run_time)
        return mob

    def footer(self, text: str):
        mob = place_footer(body_text(text, self.theme, size=self.theme.small_size), self.theme)
        self.play(reveal(mob), run_time=0.6)
        return mob

    def key_points(self, lines: Sequence[str]):
        bullets = bullet_list(lines, self.theme)
        wrapped = card(bullets, self.theme, padding=0.38, stroke_color="primary")
        center_stage(wrapped, self.theme)
        self.play(reveal(wrapped, method="grow"), run_time=0.9)
        return wrapped

    def formula(self, tex: str, title: str | None = None, color_map: dict[str, str] | None = None):
        mob = formula_card(tex, self.theme, color_map=color_map, title=title)
        center_stage(mob, self.theme)
        self.play(reveal(mob, method="grow"), run_time=0.9)
        return mob

    def explain_steps(self, steps: Sequence[str]):
        items = [card(body_text(step, self.theme), self.theme, padding=0.24) for step in steps]
        group = stack(*items, direction=DOWN, buff=0.24, theme=self.theme)
        center_stage(group, self.theme)
        stagger_write(self, list(group), run_time=1.4)
        return group

    def clear_stage(self, keep: Sequence[object] | None = None) -> None:
        keep_set = {self._background, *(keep or [])}
        removable = [mob for mob in self.mobjects if mob not in keep_set]
        if removable:
            self.play(FadeOut(VGroup(*removable)), run_time=0.55)


class BaseAIThreeDScene(ThreeDScene):
    """Base class for cinematic but readable 3D educational scenes."""

    theme: StyleConfig = AI_EXPLAINER_THEME
    camera_preset: CameraPreset = FRONT_3D
    use_floor: bool = True

    def setup(self) -> None:
        super().setup()
        apply_theme(self.theme)
        set_camera_preset(self, self.camera_preset)
        self._background = deep_space_background(self.theme)
        self.add_fixed_in_frame_mobjects(self._background)
        self.add(self._background)
        if self.use_floor:
            self._floor = grid_floor(self.theme)
            self.add(self._floor)

    def fixed_title(self, text: str):
        mob = place_title(title_text(text, self.theme), self.theme)
        self.add_fixed_in_frame_mobjects(mob)
        self.play(Write(mob), run_time=self.theme.animation_run_time)
        return mob

    def fixed_caption(self, text: str, position=DOWN):
        mob = card(body_text(text, self.theme), theme=self.theme, padding=0.25, stroke_color="grid")
        mob.to_edge(position, buff=self.theme.safe_margin_y)
        self.add_fixed_in_frame_mobjects(mob)
        self.play(reveal(mob, shift=position * 0.15), run_time=self.theme.animation_run_time)
        return mob

    def fixed_formula(self, tex: str, title: str | None = None, color_map: dict[str, str] | None = None):
        mob = formula_card(tex, self.theme, color_map=color_map, title=title)
        mob.to_edge(DOWN, buff=self.theme.safe_margin_y)
        self.add_fixed_in_frame_mobjects(mob)
        self.play(reveal(mob, method="grow"), run_time=0.9)
        return mob
