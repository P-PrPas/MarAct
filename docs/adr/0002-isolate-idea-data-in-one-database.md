# Isolate idea data in one database

Use one PostgreSQL database and a single ordered migration history to keep local setup and deployment simple. Each backend module owns its idea-prefixed tables and fixtures. This gives the starter data ownership by convention while keeping a shared connection pool.
