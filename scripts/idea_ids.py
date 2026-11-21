import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def idea_ids() -> list[str]:
    modules = ROOT / "backend/src/modules"
    return sorted(
        path.name.replace("_", "-")
        for path in modules.iterdir()
        if path.is_dir() and re.fullmatch(r"[a-z0-9]+(?:_[a-z0-9]+)*", path.name)
    )
