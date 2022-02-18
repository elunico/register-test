const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const pug = require('pug');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

const sports = [
  "Football",
  "Baseball",
  "Soccer",
  "Ultimate Frisbee",
];

let db = new sqlite3.Database('./db/database.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});

app.get('/', (req, res) => {
  return res.render('index.pug', { sports: sports });
});

app.post('/register', (req, res) => {
  const { name, email, sport } = req.body;

  if (!name) {
    res.render('error.pug', { error: 'Missing field name.' });
    return;
  }

  if (!email || !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email)) {
    res.render('error.pug', { error: 'Missing or invalid email.' });
    return;
  }

  if (!sport || !sports.includes(sport)) {
    res.render('error.pug', { error: 'Missing or invalid sport.' });
    return;
  }

  db.serialize(() => {
    console.log(email);
    db.get('SELECT email from users where email = ?', [email], (err, row) => {
      if (err) {
        console.error(err);
        res.sendFile(__dirname + '/public/error.html');
      } else {
        console.log(row);
        if (row) {
          res.render('alreadyRegistered.pug', { ...row });
        } else {
          db.run(`INSERT INTO users (name, email, sport) VALUES (?, ?, ?)`, [name, email, sport], (err) => {
            if (err) {
              console.error(err);
            } else {
              res.redirect(`/success?name=${name}&email=${email}&sport=${sport}`);
            }
          });
        }
      }
    });
  });
});

app.get('/success', (req, res) => {

  const { name, email, sport } = req.query;

  res.render('success.pug', {
    registrant: {
      name,
      sport
    }
  });
});

app.get('/registrants', (req, res) => {

  db.all('SELECT * FROM users', (err, rows) => {
    if (err) {
      console.error(err);
      res.sendFile(__dirname + '/public/error.html');
    } else {
      res.render('registrants.pug', { registrants: rows });
    }
  });
});

function cleanup() {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log('Close the database connection.');
    }
    process.exit();
  });
}

process.on('exit', cleanup);
process.on('SIGINT', cleanup);

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
