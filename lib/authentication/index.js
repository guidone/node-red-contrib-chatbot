const Sequelize = require('sequelize');
const _ = require('lodash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const { hash } = require('../utils/index');

module.exports = ({ dbPath, salt }) => {

  const sequelize = new Sequelize('mission_control', '', '', {
    host: 'localhost',
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
  });

  const Admin = sequelize.define('admin', {
    username: Sequelize.STRING,
    password: Sequelize.STRING,
    first_name: Sequelize.STRING,
    last_name: Sequelize.STRING,
    avatar: Sequelize.STRING,
    email: Sequelize.STRING,
    payload: Sequelize.TEXT,
    permissions: Sequelize.STRING,
    chatbotIds: Sequelize.TEXT
  }, {
    indexes: [
      { name: 'admin_username', using: 'BTREE', fields: ['username'] },
      { name: 'admin_password', using: 'BTREE', fields: ['password'] },
      { name: 'admin_chatbotIds', using: 'BTREE', fields: ['chatbotIds'] }
    ]
  });

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    Admin.findOne({ where: { id: parseInt(id, 10) } })
      .then(user => {
        done(null, user)
      })
      .catch(err => done(err));
  });

  passport.use(new LocalStrategy(async function(username, password, done) {
    try {
      let user = await Admin.findOne({ where: {
        [Sequelize.Op.or]: [
            sequelize.where(sequelize.fn('lower', sequelize.col('username')), username.toLocaleLowerCase()),
            sequelize.where(sequelize.fn('lower', sequelize.col('email')), username.toLocaleLowerCase())
          ]
        }
      });
      if (user == null) {
        done(null, false);
      } else {
        const hashedPassword = hash(password, { salt });
        if (_.isEmpty(user.password) || user.password === hashedPassword) {
          done(null, {
            id: user.id,
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
            avatar: user.avatar,
            email: user.email,
            isEmptyPassword: _.isEmpty(user.password),
            permissions: !_.isEmpty(user.permissions) ? user.permissions.split(',') : [],
            chatbotIds: user.chatbotIds
          });
        } else {
          done(null, false);
        }
      }
    } catch (e) {
      done(e);
    }
  }));

  const passportMiddlewares = [
    passport.initialize(),
    passport.session()
  ];

  return {
    passportMiddlewares,
    passport
  };
};
