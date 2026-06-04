from __future__ import annotations

import ast
from pathlib import Path


def test_python_files_parse() -> None:
    root = Path(__file__).resolve().parents[1]
    paths = [
        *root.glob("manim_style_kit/**/*.py"),
        *root.glob("examples/**/*.py"),
        *root.glob("templates/**/*.py"),
    ]
    assert paths
    for path in paths:
        ast.parse(path.read_text(), filename=str(path))
