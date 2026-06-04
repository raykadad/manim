from manim import BLUE, Create, DOWN, FadeIn, GrowFromCenter, LaggedStart, RED, Sphere, Surface, VGroup, color_gradient

from manim_style_kit import BaseAIThreeDScene, camera_sweep
from manim_style_kit.backgrounds import three_d_axes


class GradientDescent3DScene(BaseAIThreeDScene):
    """A 3D optimization landscape with a calm camera sweep."""

    def construct(self):
        self.fixed_title("Gradient descent follows local slope")
        axes = three_d_axes(self.theme)

        surface = Surface(
            lambda u, v: axes.c2p(u, v, 0.18 * (u**2 + 0.65 * v**2)),
            u_range=(-3.4, 3.4),
            v_range=(-3.4, 3.4),
            resolution=(32, 32),
        )
        surface.set_style(fill_opacity=0.68, stroke_opacity=0.14, stroke_width=0.6)
        surface.set_fill_by_checkerboard(*color_gradient([BLUE, self.theme.color("accent")], 2))

        points = [
            (-2.7, 2.2),
            (-2.1, 1.65),
            (-1.45, 1.1),
            (-0.9, 0.66),
            (-0.42, 0.3),
            (0.0, 0.0),
        ]
        path_dots = VGroup()
        for x, y in points:
            z = 0.18 * (x**2 + 0.65 * y**2)
            path_dots.add(Sphere(radius=0.075, color=RED).move_to(axes.c2p(x, y, z + 0.06)))

        self.play(self._floor.animate.set_opacity(0.45), FadeIn(axes), Create(surface), run_time=1.4)
        self.add(path_dots)
        self.play(LaggedStart(*(GrowFromCenter(dot) for dot in path_dots), lag_ratio=0.16), run_time=1.4)

        self.fixed_formula(
            r"\theta_{t+1}=\theta_t-\eta\nabla J(\theta_t)",
            title="Move opposite the gradient",
            color_map={r"\eta": "secondary", r"\nabla": "primary"},
        ).to_edge(DOWN, buff=self.theme.safe_margin_y)

        camera_sweep(self, self.camera_preset, run_time=3.0)
        self.wait(0.8)
