const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const json = require('body-parser/lib/types/json');
const multer = require('multer');
const app = express();
const path = require('path');
app.use (bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename:(req, file, cb) => {
        cb(null,file.originalname);
    }
  });

  const upload = multer({storage: storage});

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'student'
});

connection.connect((error) => {
    if (error) {
      console.error('Error connecting to MySQL database: ', error);
    } else {
      console.log('Connected to MySQL database!');
    }
  });
  
  module.exports = connection;
app.get('/', (req, res) => {
  res.send('Welcome to my API!');
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
// read
app.get('/student', (req, res) => {
    connection.query('SELECT * FROM students', (error, results) => {
        if (error) {
            console.error('No Student found!', error)
            res.status(500).json({error: 'No Student found'});
        } else {
            res.json(results);
        }
    });
});
// read 
app.get('/student/:id', (req, res) => {
     const id = req.params.id;
     const student = "SELECT * FROM students WHERE id = ?";
     connection.query(student, [id],function(error, results) {
        if(error) throw error;
        if (results.length > 0) {
            res.json(results);
        } else {
            res.json("NO RECORD FOR ID " + id);
        }
});
});

//Update
app.put('/student/:id', upload.single('Profile_Picture'), (req, res) => {
    const id = req.params.id;
    const {Name, Major} = req.body;
    let Profile_Picture = null;
    if (req.file) {
        Profile_Picture = req.file.filename;
    }
    connection.query('UPDATE students SET Name = ?, Major = ?, Profile_Picture = ? WHERE id = ?', [Name, Major, Profile_Picture, id], (err, result) => {
        if (err) throw err;
        res.send('Student Updated');
});
});

//delete
app.delete('/student/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM students WHERE id = ?";
    connection.query(sql, [id], function (error, results) {
        if(error) throw error;
        res.json({message:"DELETED"});
        });
  });
  //add
app.post('/student', upload.single('Profile_Picture'), (req, res) => {
    const {Name, Major} = req.body;
    const Profile_Picture = req.file.filename;
    connection.query('INSERT INTO students (Name, Major, Profile_Picture) VALUES (?, ?, ?)', [Name, Major, Profile_Picture], (err, result) => {
        if (err) throw err;
        res.send('Created');
    });
  });


  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

