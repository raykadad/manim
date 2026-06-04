# AI Agent Guide for Manim Style Kit

Use this guide when prompting an AI agent to create educational Manim scenes in
this repository.

## Target style

- Dark cinematic background with subtle grid/depth cues.
- Large English typography suitable for YouTube and mobile screens.
- One primary idea per shot; avoid stacking unrelated objects.
- Formula cards should be centered or pinned near the bottom, not floating over
  dense visuals.
- Use color consistently:
  - `primary`: active variable, vector, or current focus.
  - `secondary`: comparison value, learning rate, or supporting term.
  - `accent`: transformation, model block, or abstract space.
  - `muted`: explanatory body text.
  - `danger` and `warning`: errors, instability, or caveats.

## Prompt template

```text
Create a Manim scene using this repository's manim_style_kit.

Topic: <topic>
Audience: advanced beginners who know basic math
Language on screen: English only
Scene type: 2D / 3D / mixed
Goal: explain <one idea>

Requirements:
- Subclass BaseAIExplainerScene for 2D or BaseAIThreeDScene for 3D.
- Use title_text/body_text/formula_card/card helpers instead of raw Text
  whenever possible.
- Keep all objects inside the safe area.
- Use at most 3-5 major visual objects in one shot.
- Use the theme color names; do not invent random colors.
- Keep formulas large and reveal them step by step.
- Add short waits after important reveals.
- Do not overlap captions, formulas, axes, or cards.
```

## Scene structure checklist

1. **Hook**: a short title or visual question.
2. **Objects**: introduce variables, particles, vectors, molecules, or algorithm
   blocks one group at a time.
3. **Relationship**: show a formula card or arrow flow that links the objects.
4. **Motion**: animate the change, not every decoration.
5. **Takeaway**: finish with one sentence or highlighted expression.

## Camera rules for 3D

- Start with `BaseAIThreeDScene`; it applies a readable camera preset.
- Use `camera_sweep(self, self.camera_preset)` only after the main object is
  visible.
- Pin text and formulas with `fixed_title`, `fixed_caption`, and
  `fixed_formula`.
- Keep the camera motion slow. A small sweep is better than a dramatic spin.

## Formula rules

- Use `formula_card(...)` for important equations.
- Use `color_map` to highlight repeated symbols:

```python
formula_card(
    r"\theta_{t+1}=\theta_t-\eta\nabla J(\theta_t)",
    self.theme,
    color_map={r"\theta": "primary", r"\eta": "secondary", r"\nabla": "accent"},
    title="Gradient descent update",
)
```

## Layout rules

- Use `card(...)` around text blocks.
- Use `stack(...)` for vertical lists.
- Use `place_title(...)` and `place_footer(...)` for fixed positioning.
- If a composition feels crowded, split it into two scenes instead of shrinking
  the font.

## Good topics for this kit

- Neural networks: attention, backpropagation, embeddings, diffusion, RL.
- Algorithms: sorting, graph search, dynamic programming, optimization.
- Mathematics: linear algebra, calculus, probability, statistics.
- Chemistry and physics: orbitals, reaction energy, thermodynamics, waves.
