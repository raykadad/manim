from manim import DOWN, UP

from manim_style_kit import (
    BaseAIExplainerScene,
    body_text,
    card,
    formula_card,
    reveal,
    transform_formula,
)


class FormulaShowcaseScene(BaseAIExplainerScene):
    """Demonstrates clean formula cards and readable explanatory copy."""

    def construct(self):
        self.title("One idea, three equivalent views")

        caption = card(
            body_text("Keep formulas large. Reveal one conceptual step at a time.", self.theme),
            self.theme,
            padding=0.28,
            stroke_color="grid",
        )
        caption.to_edge(UP, buff=1.25)
        self.play(reveal(caption))

        first = formula_card(
            r"J(\theta)= {1 \over m}\sum_{i=1}^{m} L(f_\theta(x_i), y_i)",
            self.theme,
            color_map={r"\theta": "primary", "L": "secondary"},
            title="Training objective",
        )
        first.shift(DOWN * 0.35)
        self.play(reveal(first, method="grow"))
        self.wait(0.4)

        second = formula_card(
            r"\theta_{t+1} = \theta_t - \eta \nabla_\theta J(\theta_t)",
            self.theme,
            color_map={r"\theta": "primary", r"\eta": "secondary", r"\nabla": "accent"},
            title="Gradient descent update",
        )
        second.move_to(first)
        transform_formula(self, first, second)
        self.wait(1)
