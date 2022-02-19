const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const pug = require('pug');

const DB_FILE = process.env.DB_FILE || './db/database.db';

let cleanedUp = false;

const sports = [
  "Football",
  "Basketball",
  "Baseball",
  "Soccer",
  "Golf",
  "Tennis",
  "Ultimate Frisbee",
];

const db = new sqlite3.Database(DB_FILE, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});

// pure function
const fuzz = (string) => `%${string}%`;

function cleanup() {
  if (cleanedUp) return;
  db.serialize(() => {
    db.close((err) => {
      if (err) {
        console.error(err.message);
      } else {
        cleanedUp = true;
        console.log('Close the database connection.');
      }
      process.exit();
    });
  });
}

process.on('exit', cleanup);
process.on('SIGINT', cleanup);

app.use((req, res, next) => console.log(`${req.method} ${req.url}`) || next());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render('index.pug', { sports: sports });
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
    db.get('SELECT email from users where email = ?', [email], (err, row) => {
      if (err) {
        console.error(err);
        res.render('error.pug', { error: err.message });
      } else if (row) {
        res.render('alreadyRegistered.pug', { ...row });
      } else {
        db.run(`INSERT INTO users (name, email, sport) VALUES (?, ?, ?)`, [name, email, sport], (err) => {
          if (err) {
            console.error(err);
          } else {
            res.redirect(`/success?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&sport=${encodeURIComponent(sport)}`);
          }
        });
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
  // obtain query parameters from URL
  let { sport, name } = req.query;

  // determine if the name should exact match or fuzzy match
  if (name && /['"]/g.test(name)) {
    name = name.replace(/["']/g, '');
  } else if (name) {
    name = fuzz(name);
  }

  // create the array of values for the SQL statement
  let values = [];
  if (name) values.push(name);
  if (sport && sport !== 'All') values.push(sport);

  // build the statement based on URL query
  let statement;
  if (name && sport) {
    statement = db.prepare(`SELECT * FROM users WHERE name like ? AND sport like ?`);
  } else if (name) {
    statement = db.prepare(`SELECT * FROM users WHERE name like ?`);
  } else if (sport) {
    statement = db.prepare(`SELECT * FROM users WHERE sport like ?`);
  } else {
    statement = db.prepare(`SELECT * FROM users`);
  }

  // execute the statement
  statement.all(values, (err, rows) => {
    if (err) {
      console.error(err);
      res.render('error.pug', { error: err.message });
    } else {
      res.render('registrants.pug', { registrants: rows, sports: [...sports, 'All'] });
    }
    statement.finalize();
  });
});

app.get('/api/registrants', (req, res) => {
  db.all('SELECT * FROM users', (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: err });
    } else {
      res.json({ registrants: rows });
    }
  });
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
