const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const pug = require('pug');

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

const db = new sqlite3.Database('./db/database.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});

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
  console.log(sport);

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
        res.render('error.pug', { error: error.message });
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
  let { sport, name } = req.query;
  name = "%" + name + "%";

  let statement;

  if (name && sport) {
    statement = db.prepare(`SELECT * FROM users WHERE name like ? AND sport like ?`);
    statement.run('name');
    statement.run('sport');
  } else if (name) {
    statement = db.prepare(`SELECT * FROM users WHERE name like ?`);
    statement.run('name');
  } else if (sport) {
    statement = db.prepare(`SELECT * FROM users WHERE sport like ?`);
    statement.run('sport');
  } else {
    statement = db.prepare(`SELECT * FROM users`);
  }

  let values = [];
  if (name) values.push(name);
  if (sport && sport !== 'All') values.push(sport);

  statement.all(values, (err, rows) => {
    if (err) {
      console.error(err);
      res.render('error.pug', { error: error.message });
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
