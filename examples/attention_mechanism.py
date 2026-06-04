from manim import DOWN, RIGHT, VGroup

from manim_style_kit import (
    BaseAIExplainerScene,
    body_text,
    card,
    concept_flow,
    emphasize,
    formula_card,
    keyword_text,
    reveal,
)


class AttentionMechanismScene(BaseAIExplainerScene):
    """A clean 2D explainer shot for transformer attention."""

    def construct(self):
        self.title("Attention turns context into weights")

        tokens = []
        for label, subtitle, color in [
            ("Query", "What am I looking for?", "primary"),
            ("Key", "What do I contain?", "secondary"),
            ("Value", "What should I pass on?", "accent"),
        ]:
            content = VGroup(
                keyword_text(label, self.theme, color=color),
                body_text(subtitle, self.theme),
            ).arrange(DOWN, buff=0.18)
            tokens.append(card(content, self.theme, min_width=3.0, min_height=1.55, stroke_color=color))

        row = VGroup(*tokens).arrange(RIGHT, buff=0.65)
        row.shift(DOWN * 0.2)
        flow = concept_flow(tokens, self.theme)
        self.play(reveal(row, method="grow"), reveal(flow[-1]))
        self.wait(0.3)

        formula = formula_card(
            r"\mathrm{Attention}(Q,K,V)=\mathrm{softmax}\left({QK^T \over \sqrt{d_k}}\right)V",
            self.theme,
            color_map={"Q": "primary", "K": "secondary", "V": "accent"},
            title="Scaled dot-product attention",
        )
        formula.to_edge(DOWN, buff=self.theme.safe_margin_y)
        self.play(reveal(formula, method="grow"))
        emphasize(self, formula, self.theme)
        self.wait(1)
