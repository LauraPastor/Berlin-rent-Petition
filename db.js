const spicedPg = require('spiced-pg');
let secrets;
if (process.env.NODE_ENV === 'production') {
    secrets = process.env;
} else {
    secrets = require('./secrets');
}

const dbUrl = process.env.DATABASE_URL || `postgres:${secrets.dbUser}:${secrets.dbPassword}@localhost:5432/petition`;
const db = spicedPg(dbUrl);


exports.insertNewUser = function(first, last, email, hashedPw) {
    const q = `INSERT INTO users (first, last, email, password)
            VALUES ($1, $2, $3, $4) RETURNING id`;
    const params = [
        first || null,
        last || null,
        email || null,
        hashedPw || null
    ];
    return db.query(q, params);
};


exports.addSig = function(sig, user_id) {
    const q = `INSERT INTO signatures (sig, user_id)
    VALUES ($1, $2) RETURNING id`;
    const params = [sig || null, user_id || null];
    return db.query(q, params);
};

exports.getSig = function(id) {
    const q = `SELECT sig FROM signatures WHERE user_id = $1`;
    const params = [id];
    return db.query(q, params);
};

exports.deleteSig = function(id) {
    const q = `DELETE FROM signatures WHERE user_id = $1`;
    const params = [id];
    return db.query(q, params);
};

exports.deleteUser = function(id) {
    const q1 = `DELETE FROM signatures WHERE user_id = $1`;
    const params1 = [id || null];
    const q2 = `DELETE FROM user_profiles WHERE user_id = $1`;
    const q3 = `DELETE FROM users WHERE id = $1`;

    return Promise.all([
        db.query(q1, params1),
        db.query(q2, params1),
        db.query(q3, params1)
    ]);
};

exports.sessionInfo = function(email) {
    const q = `SELECT first, last, email, users.id, sig, password
    FROM users
    FULL OUTER JOIN signatures
    ON signatures.user_id = users.id
    WHERE email = $1`;
    const params = [email || null];
    return db.query(q, params);
};

exports.addUserProfile = function(age, city, url, user_id) {
    const q = `INSERT INTO user_profiles (age, city, url, user_id)
    VALUES ($1, $2, $3, $4)`;
    const params = [age || null, city || null, url || null, user_id];
    return db.query(q, params);
};

exports.updateUserProfile = function(id, age, city, url) {
    const q = `
        INSERT INTO user_profiles (user_id, age, city, url)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET age = $2, city = $3, url = $4
    `;
    const params = [id || null, age || null, city || null, url || null];
    return db.query(q, params);
};

exports.updateUserProfileAndPass = function(fname, lname, email, hash){
    const q = `
        INSERT INTO users (first, last, email, password)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email)
        DO UPDATE SET first = $1, last = $2, password = $4
    `;
    const params = [fname || null, lname || null, email || null, hash || null];
    return db.query(q, params);
};

exports.updateUserProfileNoPass = function(fname, lname, email) {
    const q = `
        INSERT INTO users (first, last, email)
        VALUES ($1, $2, $3)
        ON CONFLICT (email)
        DO UPDATE SET first = $1, last = $2
    `;
    const params = [fname || null, lname || null, email || null];
    return db.query(q, params);
};

exports.getSigners = function(){
    return db.query(`SELECT first, last FROM users ORDER by id ASC`);
};

exports.getHashedPw = function(email){
    const q = `SELECT password FROM users WHERE email = $1`;
    const params = [email];
    return db.query(q, params);
};



exports.getUserNum = function(){
    return db.query(`
        SELECT COUNT(*)
        FROM signatures
        LEFT JOIN users
        ON signatures.user_id = users.id
        `);
};

exports.getAllSigners = function(){
    return db.query(`
        SELECT signatures.user_id, first, last, age, url, city
        FROM signatures
        LEFT JOIN users
        ON signatures.user_id = users.id
        LEFT JOIN user_profiles
        ON user_profiles.user_id = users.id ORDER by signatures.id DESC
        `);
};

exports.getAllSignersEdit = function(id){
    const q = `
        SELECT *
        FROM users
        LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id WHERE users.id = $1
        `;
    const params = [id];
    return db.query(q, params);
};

exports.getAllSignersCity = function(city){
    const q = `
        SELECT *
        FROM signatures
        LEFT JOIN users
        ON signatures.user_id = users.id
        LEFT JOIN user_profiles
        ON user_profiles.user_id = users.id WHERE LOWER(city) = LOWER($1)
        `;
    const params = [city];
    return db.query(q, params);
};

exports.checkSigned = function(user_id) {
    const q = `SELECT * FROM signatures where user_id = $1`;
    const params = [user_id || null];
    return db.query(q, params);
};
