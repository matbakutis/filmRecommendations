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

// Find Genre Name
function findGenre(genreID) {
  if (genreID === 1){
    return('Action');
  }else if (genreID === 2){
    return('Adventure');
  }else if (genreID === 3){
    return('Animation');
  }else if (genreID === 4){
    return('Comedy');
  }else if (genreID === 5){
    return('Crime');
  }else if (genreID === 6){
    return('Documentary');
  }else if (genreID === 7){
    return('Drama');
  }else if (genreID === 8){
    return('Family');
  }else if (genreID === 9){
    return('Fantasy');
  }else if (genreID === 10){
    return('History');
  }else if (genreID === 11){
    return('Horror');
  }else if (genreID === 12){
    return('Music');
  }else if (genreID === 13){
    return('Mystery');
  }else if (genreID === 14){
    return('Romance');
  }else if (genreID === 15){
    return('Science Fiction');
  }else if (genreID === 16){
    return('TV Movie');
  }else if (genreID === 17){
    return('Thriller');
  }else if (genreID === 18){
    return('War');
  }else if (genreID === 19){
    return('Western');
  };
};

// ROUTE HANDLER
function getFilmRecommendations(req, res) {
  const id = parseInt(req.params.id);
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 10;
  const recommendationsArray = [];
  const finalResult = {
    meta: {
      limit: limit,
      offset: offset
    }
  };
  // Check wether the queries and ID are valid
  if (limit < 1 || offset < 0 || (isNaN(parseInt(req.query.limit)) && req.query.limit) || (isNaN(parseInt(req.query.offset)) && req.query.offset)) {
    res.status(422).json({ message: 'Incorrect Limit or Offset queries.' });
  }else if (!id) {
    res.status(422).json({ message: 'Incorrect Film ID.' });
  }else {
    // Find the requested film
    Film.findById(id).then(function(requestedFilm){
      if (requestedFilm) {
        // Find all films in the same genre
        Film.findAll({ where: { genre_id: requestedFilm.genre_id } } ).then(function(relatedFilms) {
          let filmIDs = '';
          relatedFilms.forEach(function (relatedFilm) {
            filmIDs += relatedFilm.id + ',';
          });
          // Request reviews for each related film
          request('http://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1?films=' + filmIDs, function (error, response, body) {
            const reviewsBody = JSON.parse(body);
            for (let i = 0; i < reviewsBody.length; i++) {
              if (reviewsBody[i].reviews.length >= 5) {
                let totalRating = 0;
                for (let j = 0; j < reviewsBody[i].reviews.length; j++) {
                  totalRating += reviewsBody[i].reviews[j].rating;
                };
                // Only accept recommendation if rating is above 4 and its within the year range
                if (totalRating / reviewsBody[i].reviews.length >= 4) {           
                  const relatedFilmIndex = relatedFilms.map(function(x) {return x.id; }).indexOf(reviewsBody[i].film_id);
                  if (parseInt(relatedFilms[relatedFilmIndex].release_date) >= parseInt(requestedFilm.release_date) - 15 && parseInt(relatedFilms[relatedFilmIndex].release_date) <= parseInt(requestedFilm.release_date) + 15) {
                    recommendationsArray.push({
                      id: relatedFilms[relatedFilmIndex].id,
                      title: relatedFilms[relatedFilmIndex].title,
                      releaseDate: relatedFilms[relatedFilmIndex].release_date,
                      genre: findGenre(relatedFilms[relatedFilmIndex].genre_id),
                      averageRating: parseFloat(totalRating / reviewsBody[i].reviews.length).toFixed(2),
                      reviews: reviewsBody[i].reviews.length
                    });
                  };
                };
              };
            };
            // Send final results once all potential films have been checked
            finalResult.recommendations = recommendationsArray.slice(offset, offset + limit).sort(function(a, b) {
              return a.id - b.id;
            });
            res.json(finalResult);
          });
        });
      }else {
        res.status(422).json({ message: 'That film could not be found.' });
      };
    });
  };
};

// Send error for unknown routes
app.get('*', function(req, res){
  res.status(404).json({ message: 'Route not found.' });
});

module.exports = app;