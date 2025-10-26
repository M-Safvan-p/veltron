
const session = require('express-session');
const MongoStore = require('connect-mongo');

const commonCookieOptions = {
  maxAge: 1000 * 60 * 60 * 24, 
  httpOnly: true,
  secure: false,
  sameSite: 'lax',    
};

const adminSession = session({
  name: 'admin.sid',
  secret: process.env.ADMIN_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'adminSessions'
  }),
  cookie: commonCookieOptions
});

const userSession = session({
  name: 'user.sid',
  secret: process.env.USER_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'userSessions'
  }),
  cookie: commonCookieOptions
});

const vendorSession = session({
  name: 'vendor.sid',
  secret: process.env.VENDOR_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'vendorSessions'
  }),
  cookie: commonCookieOptions
});


function sessionConfig(app) {
  app.use('/admin', adminSession);
  app.use('/vendor', vendorSession);
  app.use(userSession);
}

module.exports = sessionConfig;
