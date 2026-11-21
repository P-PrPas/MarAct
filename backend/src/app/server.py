import argparse
import os

import uvicorn
from dotenv import load_dotenv


def main() -> None:
    load_dotenv(".env")
    parser = argparse.ArgumentParser()
    parser.add_argument("--reload", action="store_true")
    parser.add_argument("--port", type=int, default=os.getenv("API_PORT", os.getenv("PORT", "3000")))
    args = parser.parse_args()
    uvicorn.run(
        "backend.src.app.main:app",
        host=os.getenv("API_HOST", "127.0.0.1"),
        port=args.port,
        reload=args.reload,
        reload_dirs=["backend/src"] if args.reload else None,
    )


if __name__ == "__main__":
    main()
