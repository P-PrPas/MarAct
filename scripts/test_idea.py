import argparse
import subprocess
import sys

from scripts.idea_ids import ROOT, idea_ids


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("idea", choices=idea_ids())
    idea = parser.parse_args().idea
    module = idea.replace("-", "_")
    subprocess.run(
        [sys.executable, "-m", "pytest", f"backend/src/modules/{module}"],
        cwd=ROOT,
        check=True,
    )
    subprocess.run(
        ["npm", "run", "test:web", "--", f"src/ideas/{idea}/"],
        cwd=ROOT / "frontend",
        check=True,
    )


if __name__ == "__main__":
    main()
