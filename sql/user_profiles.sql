DROP TABLE IF EXISTS user_profiles;

CREATE TABLE user_profiles(
    id SERIAL PRIMARY KEY,
    age INTEGER,
    city VARCHAR(100),
    url VARCHAR(400),
    user_id INTEGER UNIQUE NOT NULL
);
