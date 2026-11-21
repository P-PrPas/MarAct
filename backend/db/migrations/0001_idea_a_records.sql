CREATE TABLE idea_a_records (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title varchar(120) NOT NULL CHECK (length(trim(title)) > 0),
  seed_key text UNIQUE
);
