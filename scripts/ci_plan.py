import argparse
import json
import os
import re
import subprocess
from pathlib import Path

from scripts.idea_ids import ROOT, idea_ids


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("base", nargs="?", default="")
    parser.add_argument("head", nargs="?", default="HEAD")
    args = parser.parse_args()
    known_ideas = idea_ids()
    full = not args.base
    affected: set[str] = set()

    if args.base:
        paths = subprocess.check_output(
            ["git", "diff", "--no-renames", "--name-only", "-z", f"{args.base}...{args.head}", "--"],
            cwd=ROOT,
        )
        for raw_path in filter(None, paths.split(b"\0")):
            match = re.match(r"^(frontend/src/ideas|backend/src/modules|backend/db/seeds)/([^/]+)/",
                             os.fsdecode(raw_path))
            if not match:
                full = True
                continue
            directory, idea = match.groups()
            if directory == "backend/src/modules":
                idea = idea.replace("_", "-")
            if idea in known_ideas:
                affected.add(idea)
            else:
                full = True

    selected = known_ideas if full else sorted(affected)
    output = f"ideas={json.dumps(selected)}\nfull={str(full).lower()}\n"
    if destination := os.getenv("GITHUB_OUTPUT"):
        with Path(destination).open("a") as file:
            file.write(output)
    else:
        print(output, end="")


if __name__ == "__main__":
    main()
