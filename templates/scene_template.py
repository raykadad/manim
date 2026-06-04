"""Copy this file when asking an AI agent to create a new Manim scene."""

from manim import DOWN

from manim_style_kit import BaseAIExplainerScene, body_text, card, formula_card, reveal


class NewExplainerScene(BaseAIExplainerScene):
    """Replace with a short description of the lesson."""

    def construct(self):
        self.title("Clear English title")

        hook = card(
            body_text("Start with the viewer's question in one short sentence.", self.theme),
            self.theme,
            padding=0.3,
            stroke_color="primary",
        )
        self.play(reveal(hook, method="grow"))
        self.wait(0.4)

        equation = formula_card(
            r"y = f(x)",
            self.theme,
            color_map={"x": "primary", "y": "secondary"},
            title="Core relationship",
        )
        equation.to_edge(DOWN, buff=self.theme.safe_margin_y)
        self.play(reveal(equation, method="grow"))
        self.wait(1)
