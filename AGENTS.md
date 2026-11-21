# Working in MarAct

1. Start in your assigned idea’s folders under `frontend/src/ideas/`, `backend/src/modules/`, and `backend/db/seeds/`. Use a separate branch or worktree for parallel work.
2. Keep each module’s SQL and seed fixtures scoped to its own prefixed tables. Keep applied migrations intact and append a uniquely numbered migration for schema changes.
3. Coordinate edits to the idea registry, backend route mounts, and migration filenames with the teammate responsible for shared changes.
4. Run `make test-idea IDEA=<id>` before handing off idea changes. Run `make check` for shared changes.

See [README.md](README.md) when setting up a clone, adding an idea, or changing the default demo.
