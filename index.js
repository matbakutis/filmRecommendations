const sqlite = require('sqlite'),
      Sequelize = require('sequelize'),
      request = require('request'),
      express = require('express'),
      app = express();

const { PORT=3000, NODE_ENV='development', DB_PATH='./db/database.db' } = process.env;

// Establish connection with db
const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  port: PORT,
  dialect: 'sqlite',
  storage: DB_PATH,
  define: {
    timestamps: false
  }
});

// Test connection with db
sequelize
  .authenticate()
  .then(function(err) {
    console.log('Connection has been established successfully.');
  })
  .catch(function (err) {
    console.log('Unable to connect to the database:', err);
  });

// Models
const Genre = sequelize.define('genres', {
  id: { type: Sequelize.INTEGER, primaryKey: true },
  name: { type: Sequelize.STRING }
});

const Film = sequelize.define('films', {
  id: { type: Sequelize.INTEGER, primaryKey: true },
  title: { type: Sequelize.STRING },
  release_date: { type: Sequelize.STRING },
  tagline: { type: Sequelize.STRING },
  revenue: { type: Sequelize.INTEGER },
  budget: { type: Sequelize.INTEGER },
  runtime: { type: Sequelize.INTEGER },
  original_language: { type: Sequelize.STRING },
  status: { type: Sequelize.STRING },
  genre_id: { type: Sequelize.INTEGER }
});

const ArtistFilm = sequelize.define('artist_films', {
  id: { type: Sequelize.INTEGER, primaryKey: true },
  credit_type: { type: Sequelize.STRING },
  role: { type: Sequelize.STRING },
  description: { type: Sequelize.STRING },
  artist_id: { type: Sequelize.INTEGER },
  film_id: { type: Sequelize.INTEGER }
});

const Artist = sequelize.define('artists', {
  id: { type: Sequelize.INTEGER, primaryKey: true },
  name: { type: Sequelize.STRING },
  birthday: { type: Sequelize.STRING },
  deathday: { type: Sequelize.STRING },
  gender: { type: Sequelize.INTEGER },
  place_of_birth: { type: Sequelize.STRING }
});

// Sync Models
sequelize.sync();

// START SERVER
Promise.resolve()
  .then(() => app.listen(PORT, () => console.log(`App listening on port ${PORT}`)))
  .catch((err) => { if (NODE_ENV === 'development') console.error(err.stack); });

// ROUTES
app.get('/films/:id/recommendations', getFilmRecommendations);

// ROUTE HANDLER
function getFilmRecommendations(req, res) {
  const id = parseInt(req.params.id);
  Film.findById(id).then(function(requestedFilm){
    if (requestedFilm) {
      res.send(requestedFilm);
    }else {
      res.status(404).send('That film could not be found.');
    }
  });
};

module.exports = app;
