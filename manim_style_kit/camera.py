from __future__ import annotations

from dataclasses import dataclass

from manim import DEGREES, Mobject, Scene, ThreeDScene


@dataclass(frozen=True)
class CameraPreset:
    """Named 3D camera angle that works well for educational scenes."""

    phi: float = 62 * DEGREES
    theta: float = -42 * DEGREES
    gamma: float = 0
    zoom: float = 0.88
    focal_distance: float = 20


FRONT_3D = CameraPreset(phi=58 * DEGREES, theta=-52 * DEGREES, zoom=0.9)
TOP_DOWN = CameraPreset(phi=20 * DEGREES, theta=-90 * DEGREES, zoom=0.95)
LOW_DRAMA = CameraPreset(phi=72 * DEGREES, theta=-28 * DEGREES, zoom=0.82)


def set_camera_preset(scene: ThreeDScene, preset: CameraPreset = FRONT_3D) -> None:
    """Apply a stable 3D camera preset."""

    scene.set_camera_orientation(
        phi=preset.phi,
        theta=preset.theta,
        gamma=preset.gamma,
        zoom=preset.zoom,
        focal_distance=preset.focal_distance,
    )


def camera_sweep(
    scene: ThreeDScene,
    preset: CameraPreset = FRONT_3D,
    delta_theta: float = 18 * DEGREES,
    run_time: float = 3.0,
) -> None:
    """Move the 3D camera slightly to reveal depth without disorienting viewers."""

    scene.move_camera(
        phi=preset.phi,
        theta=preset.theta + delta_theta,
        gamma=preset.gamma,
        zoom=preset.zoom,
        run_time=run_time,
    )


def focus_camera_on(scene: Scene, target: Mobject, scale: float = 1.08, run_time: float = 1.0) -> None:
    """For scenes with a moving frame, focus on a target object."""

    frame = getattr(scene.camera, "frame", None)
    if frame is None:
        return
    scene.play(frame.animate.move_to(target).set(width=target.width * scale), run_time=run_time)
