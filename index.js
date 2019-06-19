// make a middleware js file.
// app.use should all be at the start. && req.url = '/login' etc...
const express       = require('express');
const hb            = require('express-handlebars');
const bodyParser    = require('body-parser');
const cookieSession = require('cookie-session');
const csurf         = require('csurf');
const db            = require('./db.js');
const auth          = require('./auth.js');
const urlCleaner    = require('./urlcleaner.js');

const app = express();

app.engine('handlebars', hb({
    helpers: {
        checkActiveUrl: function(a, b) {
            return a === b;
        }
    }
}));

app.set('view engine', 'handlebars');

app.use(cookieSession({
    secret: `I'm always angry.`,
    maxAge: 1000 * 60 * 60 * 24 * 14
}));

app.use(bodyParser.urlencoded({extended: false}));
app.use(csurf());
app.use(express.static('./public'));

app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    res.setHeader('X-Frame-Options', 'deny');
    res.locals.userfirstname = req.session.fname;
    res.locals.url = req.url;
    res.locals.signed = req.session.signed;
    next();
});

function checkIfUserSigned(req, res, next) {
    if (req.session.sigId) {
        res.redirect('/petition/signed');
    } else {
        next();
    }
}

function userSignedIn(req, res, next) {
    if (req.session.fname) {
        res.redirect('/petition/signers');
    } else {
        next();
    }
}

app.use(function(req, res, next) {
    if (!req.session.loggedIn && req.url != '/login' && req.url != '/register') {
        res.redirect('/register');
    } else {
        next();
    }
});

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////    ROUTES    ///////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

app.get('/', (req, res) => {
    res.redirect('/register');
});

app.get('/login',userSignedIn, (req, res) => {
    res.render('login', {
        layout: 'main',
    });
});

app.post('/login',userSignedIn, (req, res) => {
    db.getHashedPw(req.body.email)
        .then((result) => {
            if (result.rows.length == 0) {
                res.render('login', {
                    layout: 'main',
                    error: 'error'
                });
            } else {
                db.sessionInfo(req.body.email)
                    .then((result) => {
                        if (result.rows[0].sig != null) {
                            req.session.signed = 'signed';
                        }
                        req.session.userId = result.rows[0].id;
                        req.session.fname = result.rows[0].first;
                        req.session.lname = result.rows[0].last;
                        auth.checkPassword(req.body.password, result.rows[0].password)
                            .then((passedAuth) => {
                                if (passedAuth) {
                                    req.session.loggedIn = true;
                                    res.redirect('/petition');
                                } else {
                                    res.render('login', {
                                        layout: 'main',
                                        error: 'error'
                                    });
                                }
                            }).catch((err) => {console.log(err);});
                    }).catch((err) => {console.log(err);});
            }
        });
});

app.get('/register',userSignedIn, (req, res) => {
    res.render('register', {
        layout: 'main',
    });
});

app.post('/register',userSignedIn, (req, res) => {
    auth.hashPassword(req.body.password)
        .then((hash) => {
            let fname = req.body.fname;
            let lname = req.body.lname;
            let email = req.body.email;
            db.insertNewUser(fname, lname, email, hash).then((result) => {
                req.session.loggedIn = true;
                req.session.userId = result.rows[0].id;
                req.session.fname = fname;
                req.session.lname = lname;
                res.redirect('/profile');
            }).catch(() => {
                res.render('register', {
                    layout: 'main',
                    error: 'error'
                });
            });
        }).catch((err) => {console.log(err);});
});

app.use(function(req, res, next) {
    db.getUserNum()
        .then(result => {
            res.locals.numSigs = result.rows[0].count;
            next();
        }).catch(err => {console.log(err);});
});

app.get('/profile', (req, res) => {
    res.render('profile', {
        layout: 'main',
        name: req.session.fname
    });
});

app.post('/profile', (req, res) => {
    let httpsUrl = urlCleaner.cleanUrl(req.body.website);
    console.log(req.session.userId, req.body.age, req.body.city)
    db.updateUserProfile(req.session.userId, req.body.age, req.body.city, httpsUrl)
        .then(() => {
            res.redirect('/petition');
        }).catch((err) => {
            console.log(err);
            res.render('profile', {
                layout: 'main',
                error: 'error'
            });
        });
});

app.get('/profile/edit', (req, res) => {
    db.getAllSignersEdit(req.session.userId)
        .then((result) => {
            res.render('profileedit', {
                layout: 'main',
                firstname: result.rows[0].first,
                lastname: result.rows[0].last,
                email: result.rows[0].email,
                age: result.rows[0].age,
                city: result.rows[0].city,
                website: result.rows[0].url,
            });
        }).catch((err) => {console.log(err);});
});

app.post('/profile/edit', (req, res) => {
    let httpsUrl = urlCleaner.cleanUrl(req.body.website);
    const updateUserProfile = db.updateUserProfile(req.session.userId, req.body.age, req.body.city, httpsUrl);
    let updateUser;

    if (req.body.password === '') {
        updateUser = db.updateUserProfileNoPass(req.body.firstname, req.body.lastname, req.body.email);
    } else {
        updateUser = auth.hashPassword(req.body.password)
            .then((hash) => {
                return db.updateUserProfileAndPass(req.body.firstname, req.body.lastname, req.body.email, hash).then(() => {
                    req.session.fname = req.body.firstname;
                    req.session.lname = req.body.lastname;
                }).catch((err) => {
                    console.log(err);
                    res.render('register', {
                        layout: 'main',
                        error: 'error'
                    });
                });
            }).catch((err) => {console.log(err);});
    }
    Promise.all([
        updateUserProfile,
        updateUser
    ])
        .then(() => {
            req.session.fname = req.body.firstname;
            if (req.session.signed == null) {
                res.redirect('/petition');
            } else {
                res.redirect('/petition/signed');
            }
        });
});

app.get('/petition', checkIfUserSigned, (req, res) => {
    db.checkSigned(req.session.userId)
        .then((result) => {
            if (result.rows.length == 0) {
                res.render('petition', {
                    layout: 'main',
                });
            } else {
                res.redirect('/petition/signed');
            }
        }).catch((err) => {console.log(err);});
});

app.post('/petition', (req, res) => {
    let sig = req.body.sig;
    db.addSig(sig, req.session.userId).then((result) => {
        req.session.signed = 'signed';
        req.session.sigId = result.rows[0].id;
        res.redirect('/petition/signed');
    }).catch((err) => {
        console.log(err);
        res.render('petition', {
            layout: 'main',
            error: 'error'
        });
    });
});

app.get('/petition/signed', (req, res) => {
    db.getSig(req.session.userId)
        .then((result) => {
            let sigUrl = result.rows[0].sig;
            res.render('signed', {
                layout: 'main',
                sigUrl: sigUrl
            });
        }).catch((err) => {console.log(err);});
});

app.get('/petition/signers', (req, res) => {
    db.getAllSigners()
        .then(result => {
            let signedUsers = result.rows;
            res.render('signers', {
                layout: 'main',
                signedUsers: signedUsers
            });
        }).catch(err => {console.log(err);});
});

app.get('/petition/signers/:city', (req, res) => {
    db.getAllSignersCity(req.params.city)
        .then(result => {
            let signedUsers = result.rows;
            res.render('cityprofile', {
                layout: 'main',
                signedUsers: signedUsers,
                city: req.params.city
            });
        }).catch(err => {console.log(err);});
});

app.post('/sig/delete', (req, res) => {
    db.deleteSig(req.session.userId)
        .then(() => {
            req.session.sigId = null;
            req.session.signed = null;
            res.redirect('/petition');
        }).catch((err) => {console.log(err);});
});

app.post('/profile/delete', (req, res) => {
    if (!req.body.delete) {
        console.log("deleting...");
        db.deleteUser(req.session.userId)
            .then(() => {
                req.session.fname = null;
                res.redirect('/register');
            });
    } else {
        console.log("stop delete!");
        res.redirect('/profile/edit');
    }
});

app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/login');
});

app.get('/404', function(req, res){
    res.render('404', {
        layout: 'main'
    });
});

app.get('*', function(req, res){
    res.redirect('/404');
});

app.listen(process.env.PORT || 8080, () => console.log("Listening!"));
