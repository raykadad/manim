# Manim Style Kit for AI, Math, and Science Explainers

This repository contains a reusable Manim toolkit for building polished
educational videos with a cinematic dark style, large English typography,
formula cards, safe layouts, subtle backgrounds, and 3D camera presets.

The goal is to make it easier for an AI agent to generate scenes that feel
consistent, readable, and suitable for a YouTube explainer channel about AI,
algorithms, mathematics, chemistry, physics, and related topics.

## What is included

- `manim_style_kit/theme.py` - palettes, typography sizes, safe margins.
- `manim_style_kit/text.py` - title, body text, keyword text, formula cards,
  bullet lists, and code cards.
- `manim_style_kit/layout.py` - safe-area fitting, cards, stacking, title and
  footer placement.
- `manim_style_kit/backgrounds.py` - dark cinematic background, subtle grid,
  3D floor, axes, and depth cues.
- `manim_style_kit/camera.py` - 3D camera presets and gentle camera sweeps.
- `manim_style_kit/animations.py` - reveal, emphasis, formula transforms, and
  concept-flow helpers.
- `manim_style_kit/scenes.py` - base 2D and 3D scene classes.
- `examples/` - reference scenes for attention, formulas, and 3D optimization.
- `templates/scene_template.py` - starter file for new AI-generated scenes.
- `docs/AI_AGENT_GUIDE.md` - prompt guide and rules for AI scene generation.

## Install

Manim needs system dependencies for rendering, LaTeX, and fonts. In a prepared
Python environment:

```bash
pip install -e .
```

Recommended fonts:

- Inter for general text
- JetBrains Mono for code blocks

If those fonts are not installed, Manim will fall back to available system
fonts, but installing them keeps the intended look.

## Render examples

```bash
manim examples/attention_mechanism.py AttentionMechanismScene
manim examples/formula_showcase.py FormulaShowcaseScene
manim examples/gradient_descent_3d.py GradientDescent3DScene
```

The default `manim.cfg` renders at high quality, 60 FPS, with a dark background.

## Minimal scene

```python
from manim_style_kit import BaseAIExplainerScene


class MyScene(BaseAIExplainerScene):
    def construct(self):
        self.title("Why attention works")
        self.key_points([
            "Queries ask what to find.",
            "Keys describe what each token contains.",
            "Values carry the information forward.",
        ])
        self.formula(
            r"\mathrm{softmax}\left({QK^T \over \sqrt{d_k}}\right)V",
            title="Scaled dot-product attention",
            color_map={"Q": "primary", "K": "secondary", "V": "accent"},
        )
```

## AI agent workflow

When asking an AI agent to create a new scene:

1. Tell it to read `docs/AI_AGENT_GUIDE.md`.
2. Tell it to subclass `BaseAIExplainerScene` for 2D or `BaseAIThreeDScene` for
   3D.
3. Require English on-screen text.
4. Require safe-area layout and no overlapping objects.
5. Ask for one concept per scene.
6. Ask it to render a low-quality preview first, then adjust spacing and camera
   before final render.

## Design principles

- Keep formulas large and isolated inside formula cards.
- Prefer a few strong objects over crowded scenes.
- Use the theme palette names instead of arbitrary colors.
- Pin captions/formulas in 3D scenes so they stay readable.
- Use slow, small camera moves; clarity is more important than spectacle.
