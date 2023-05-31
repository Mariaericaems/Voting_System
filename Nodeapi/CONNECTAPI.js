const express = require('express');
const mysql = require('mysql');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'votingsysm',
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});


app.get('/account', (req, res) => {
  const {username,password }= req.query;
  const query = " Select userinfo.Voter_id, userinfo.First_Name, userinfo.Last_Name, userinfo.Password, course.course from userinfo INNER join course on userinfo.course_id = course.course_id Where Voter_id = ? AND Password = ? ";
  
  db.query(query, [username, password], (err, result) => {
    if (err) {
      res.status(500).send({ error: 'Error fetching data' });
    } else {
      res.status(200).send(result);
    } 
  });

});



// Create account endpoint
app.post('/createacc', (req, res) => {
    const { Voter_id,First_Name,Last_Name,Middle_Name,Birthdate,Gender,course_id,Contact_No,Year_Level,Password,status } = req.query;
    console.log(req.query);
    if (!Voter_id ||!First_Name || !Last_Name || !Middle_Name || !Birthdate || !Gender || !course_id || !Contact_No || !Year_Level || !Password || !status ) {
      res.status(400).send({ error: 'Missing parameter or role ID error' });
      return;
    }
  
    const token = jwt.sign({ Voter_id }, SECRET_KEY); // Generate JWT token
  
    bcrypt.hash(Password, 10, (err, hashedPassword) => {
      if (err) {
        console.error('Error hashing password:', err);
        res.status(500).send({ error: 'Error creating account' });
        return;
      }
  
      const query =
      "INSERT INTO `userinfo`(Voter_id, First_Name, Last_Name, Middle_Name, Birthdate, Gender, course_id, Contact_No, Year_Level, Password, status, token) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";
  
      db.query(query, [Voter_id,First_Name,Last_Name,Middle_Name,Birthdate,Gender,course_id,Contact_No,Year_Level,hashedPassword,status, token], (err, result) => {
        if (err) {
          console.error('Error creating account:', err);
          res.status(500).send({ error: 'Error creating account' });
        } else {
          res.status(200).send({ message: 'Account created successfully' });
        }
      });
    });
  });
  


/// secret key
const SECRET_KEY ='1111144444';
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).send({ error: 'No token provided' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: 'Invalid token' });
    }
    next();
  });
};

app.post('/login', (req, res) => {
  const { Voter_id, Password } = req.query;
console.log(req.query);
  if (!Voter_id || !Password) {
    res.status(400).send({ error: 'Missing username or password' });
    return;
  }

  const query = 'SELECT * from userinfo WHERE Voter_id = ?';
  db.query(query, [Voter_id], (err, result) => {
    if (err) {
      res.status(500).send({ error: 'Error fetching data' });
      return;
    }
    if (result.length === 0) {
      res.status(401).send({ error: 'Invalid credentialssssssssssssss' });
      return;
    }
    const hashedPassword = result[0].Password;
    bcrypt.compare(Password, hashedPassword, (err, PasswordMatch) => {
      if (err) {
        res.status(500).send({ error: 'Error logging innnnnnnnnnnnnnnnnnnnnnnnn' });
        return;
      }

      if (PasswordMatch) {
        res.status(200).send(result);
      } else {
        res.status(401).send({ error: 'Invalid password' });
      }
    });
  });
});

app.get('/votingsysm', verifyToken, (req, res) => {
  const displayData = req.query.displayData; 
  let sqlQuery;
  if (displayData === "userinfo") {
    sqlQuery = "SELECT Voter_id, `First_Name`, `Last_Name`, `Middle_Name`, `Birthdate`, `Gender`, `course_id`, `Contact_No`, `Year_Level`, `Password`, `status` FROM `userinfo`";
  } else if (displayData === "partylist") {
    sqlQuery = "SELECT Partylist_id, `Name`, `Academic_year`, `Status` FROM `partylist`";
    
  } else if (displayData === "course") {
    sqlQuery = "SELECT course_id, `course`, `Status` FROM `course`";
   
  } else if (displayData === "cbxcourse") {
    sqlQuery = "SELECT course_id, `course` FROM `course`";
    
  } else if (displayData === "positions") {
    sqlQuery = "SELECT Position_id, `Name`, `Num_Winner`, `Rank`, `Status` FROM `positions`";
   
  } else if (displayData === "tally") {
    sqlQuery = "SELECT candidate.candidate_id, Concat(userinfo.First_Name, ' ', userinfo.Last_Name) as Candidates, COUNT(votes.Voter_id) as vote_count FROM candidate INNER join userinfo on candidate.Voter_id = userinfo.Voter_id INNER join votes on candidate.candidate_id = votes.Candidate_id GROUP BY Candidates";
    
  }  else if (displayData === "cbxviewptn") {
    sqlQuery = "SELECT Position_id, Name FROM `positions`";
   }  else if (displayData === "cbxviewpl") {
    sqlQuery = "SELECT Partylist_id, Name FROM `partylist`";
   } else if (displayData === "cbxviewcandi") {
    sqlQuery = "SELECT Voter_id, Concat(First_Name, ' ', Last_Name) as Full_Name FROM `userinfo`"
   } else if (displayData === "showcandi") {
    sqlQuery = "Select candidate_id, CONCAT(userinfo.First_Name, ' ', userinfo.Last_Name) as Full_Name, partylist.Name as Partylist, positions.Name as Positions from candidate inner join userinfo on candidate.Voter_id = userinfo.Voter_id INNER JOIN partylist on candidate.partylist_id = partylist.Partylist_id INNER join positions on candidate.position_id = positions.Position_id";
   }  
  else {
    return res.status(400).send({ error: 'Invalid displayData value' });
  }
  db.query(sqlQuery, (err, result) => {
    if (err) {
      res.status(500).send({ error: 'Error fetching data' });
    } else {
      res.status(200).send(result);
    }
  });   
  
});

app.get('/search', verifyToken, (req, res) => {
  let {displayData,searchData}=req.query;
  
  let sqlQuery;
  if (displayData === "search candidate") {
    sqlQuery = "Select Voter_id, partylist_id, position_id, image from candidate where Voter_id = ?";
   
  } 
  else if (displayData === "search users") {
    sqlQuery = "SELECT  First_Name, Last_Name, Middle_Name, Birthdate, Gender, course_id, Contact_No, Year_Level, Password, status FROM userinfo Where Voter_id = ?";
    
  } else if (displayData === "Search year") {
    searchData=searchData+"%";
    sqlQuery = "SELECT Name, Academic_year, Status from partylist Where Academic_year Like";
    
  } else if (displayData === "presresult") {
    sqlQuery = "SELECT candidate.candidate_id, Concat(userinfo.First_Name, ' ', userinfo.Last_Name) as Candidates, COUNT(votes.Voter_id) as vote_count FROM candidate INNER join userinfo on candidate.Voter_id = userinfo.Voter_id INNER join votes on candidate.candidate_id = votes.Candidate_id Where candidate.position_id = ? GROUP BY candidates ORDER BY vote_count DESC";
    
  } else if (displayData === "vpresult") {
    sqlQuery = "SELECT candidate.candidate_id, Concat(userinfo.First_Name,' ', userinfo.Last_Name) as Candidates,  COUNT(votes.Voter_id) as vote_count FROM candidate INNER join userinfo on candidate.Voter_id = userinfo.Voter_id INNER join votes on candidate.candidate_id = votes.Candidate_id Where candidate.position_id = ? GROUP BY candidates ORDER BY vote_count DESC";
    
  }else if (displayData === "Senatorresult") {
    sqlQuery = "SELECT candidate.candidate_id, Concat(userinfo.First_Name,' ', userinfo.Last_Name) as Candidates,  COUNT(votes.Voter_id) as vote_count FROM candidate INNER join userinfo on candidate.Voter_id = userinfo.Voter_id INNER join votes on candidate.candidate_id = votes.Candidate_id Where candidate.position_id = ? GROUP BY candidates ORDER BY vote_count DESC";
    
  } else if (displayData === "represults") {    
    sqlQuery = "SELECT candidate.candidate_id, Concat(userinfo.First_Name,' ', userinfo.Last_Name) as Candidates,  COUNT(votes.Voter_id) as vote_count FROM candidate INNER join userinfo on candidate.Voter_id = userinfo.Voter_id INNER join votes on candidate.candidate_id = votes.Candidate_id Where candidate.position_id = ? GROUP BY candidates ORDER BY vote_count DESC";  
  } else if (displayData === "candidate") {
    sqlQuery = "SELECT candidate.candidate_id, Concat(userinfo.First_Name, ' ', userinfo.Last_Name) as Full_Name, partylist.Name as Partylist, positions.Name as Positions from candidate  Inner Join partylist on candidate.partylist_id = partylist.Partylist_id Inner Join positions on candidate.position_id = positions.Position_id Inner Join userinfo on candidate.Voter_id = userinfo.Voter_id where positions.Name = ?";
    
  } else if (displayData === "positions") {
    sqlQuery = "SELECT candidate.candidate_id, Concat(userinfo.First_Name, ' ', userinfo.Last_Name) as Full_Name, partylist.Name as Partylist, positions.Name as Positions from candidate  Inner Join partylist on candidate.partylist_id = partylist.Partylist_id Inner Join positions on candidate.position_id = positions.Position_id Inner Join userinfo on candidate.Voter_id = userinfo.Voter_id where positions.Name = ?";
   
  } else if (displayData === "candidatevp") {
    sqlQuery = "SELECT candidate.candidate_id, Concat(userinfo.First_Name, ' ', userinfo.Last_Name) as Full_Name, partylist.Name as Partylist, positions.Name as Positions from candidate  Inner Join partylist on candidate.partylist_id = partylist.Partylist_id Inner Join positions on candidate.position_id = positions.Position_id Inner Join userinfo on candidate.Voter_id = userinfo.Voter_id where positions.Name = ?";

  } else if (displayData === "votes") {
    sqlQuery = "SELECT * from votes Where Voter_id = ?"
    
  } else if (displayData === "rep") {  
    sqlQuery = "SELECT candidate.candidate_id, Concat(userinfo.First_Name, ' ', userinfo.Last_Name) as Full_Name, partylist.Name as Partylist, positions.Name as Positions from candidate  Inner Join partylist on candidate.partylist_id = partylist.Partylist_id Inner Join positions on candidate.position_id = positions.Position_id Inner Join userinfo on candidate.Voter_id = userinfo.Voter_id where positions.Name  = ?";
    
  }
  
  else {
    return res.status(400).send({ error: 'Invalid displayData value' });
  }
  db.query(sqlQuery,[searchData], (err, result) => {
    if (err) {
      res.status(500).send({ error: 'Error fetching data' });
    } else {
      res.status(200).send(result);
    }
  });
});

app.delete('/votingsysm', verifyToken, (req, res) => {
  const {id,tableName}= req.query;
  let sqlQuery;
  if (!id || isNaN(id) || !tableName) {
   
    res.status(400).send({ error: 'Invalid or missing Parameter' });
    return;
  }
  if(tableName==="partylist"){
    sqlQuery = "DELETE FROM partylist WHERE Partylist_id = ? ";
    
  }
  else if(tableName==="positions"){
    sqlQuery = "DELETE FROM positions WHERE Position_id = ?";
   
  }
  else if(tableName==="candidate"){
    sqlQuery = "DELETE FROM candidate WHERE candidate_id = ?";
 
  }
  else if(tableName==="delete course"){
    sqlQuery = "DELETE FROM course WHERE course_id = ?";
    
  }
 
  else {
    return res.status(400).send({ error: 'Invalid table name' });
  }
  db.query(sqlQuery, [id], (err, result) => {
    if (err) {
      res.status(500).send({ error: 'Error' });
    } else {
      res.status(200).send({ message: 'Successfully deleted' });
    }
  });
});

app.put('/votingsysm', verifyToken, (req, res) => {
  const id=req.query.id;
  const tableName=req.query.tableName;

  if ( !id || isNaN(id) || !tableName) {
    res.status(400).send({ error: "Missing parameter or id error" });
    return;
  }

  if(tableName==="upcourse"){
    const {course,Status} = req.query;
    console.log(req.query);
    if ( !course || !Status) {
      res.status(400).send({ error: "Missing parameterhhhhhhhhhhhhh" });
      console.log(req.query);
      return;
    }
    const query = "UPDATE `course` SET `course` = ?, `Status`= ? WHERE course_id = ?";
    db.query(query, [course,Status,id], (err, result) => {
      if (err) {
        res.status(500).send({ error: 'Error' });
      } else {
        res.status(200).send({ message: 'Successfully updated' });
      }
    });
  }
  else if(tableName==="upuserinfo"){
    const {First_Name,Last_Name,Middle_Name,Birthdate,Gender,course_id,Contact_No,Year_Level,Password,status} = req.query;
    console.log(req.query);
    if ( !First_Name || !Last_Name || !Middle_Name || !Birthdate || !Gender || !course_id || !Contact_No || !Year_Level || !Password || !status) {
      res.status(400).send({ error: "Missing parameter or id erroruuuuuuuuuu" });
      return;
    }
    const query = "UPDATE userinfo SET First_Name = ?, Last_Name = ?, Middle_Name = ?, Birthdate = ?, Gender = ?, course_id = ?, Contact_No = ?, Year_Level = ?, Password = ? where Voter_id = ? ";
    db.query(query, [First_Name,Last_Name,Middle_Name,Birthdate,Gender,course_id,Contact_No,Year_Level,Password,status,id], (err, result) => {
      if (err) {
        res.status(500).send({ error: 'Error' });
      } else {
        res.status(200).send({ message: 'Successfully updated' });
      }
    });
  }
  else if(tableName==="uppositions"){
    const {Name,Num_Winner,Rank,Status} = req.query;
    console.log(req.query);
    if ( !Name || !Num_Winner || !Rank || !Status) {
      res.status(400).send({ error: "Missing parameterhhhhhhhhhhhhh" });
      console.log(req.query);
      return;
    }
    const query = "UPDATE `positions` SET `Name` = ?, `Num_Winner`= ?, `Rank` = ?, `Status`= ? WHERE Position_id = ?";
    db.query(query, [Name,Num_Winner,Rank,Status,id], (err, result) => {
      if (err) {
        res.status(500).send({ error: 'Error' });
      } else {
        res.status(200).send({ message: 'Successfully updated' });
      }
    });
  } else if(tableName==="uppartylist"){
    const {Name,Academic_year,Status} = req.query;
    console.log(req.query);
    if ( !Name || !Academic_year || !Status) {
      res.status(400).send({ error: "Missing parameterhhhhhhhhhhhhh" });
      console.log(req.query);
      return;
    }
    const query = "UPDATE `partylist` SET `Name` = ?, `Academic_year`= ?, `Status` = ? WHERE Partylist_id = ?";
    db.query(query, [Name,Academic_year,Status,id], (err, result) => {
      if (err) {
        res.status(500).send({ error: 'Error' });
      } else {
        res.status(200).send({ message: 'Successfully updated' });
      }
    });
  }else if(tableName==="upcandidate"){
    const {Voter_id,partylist_id,position_id} = req.query;
    console.log(req.query);
    if ( !Voter_id || !partylist_id || !position_id) {
      res.status(400).send({ error: "Missing parameterhhhhhhhhhhhhh" });
      console.log(req.query);
      return;
    }
    const query = "UPDATE `candidate` SET `Voter_id` = ?, `partylist_id`= ?, `position_id` = ? WHERE candidate_id = ?";
    db.query(query, [Voter_id,partylist_id,position_id,id], (err, result) => {
      if (err) {
        res.status(500).send({ error: 'Error' });
      } else {
        res.status(200).send({ message: 'Successfully updated' });
      }
    });
  }
});


app.post('/votingsysm', verifyToken, (req, res) => {
  const tableName=req.query.tableName;
  console.log(tableName);
  if(tableName==="userinfo"){
    const {Voter_id,First_Name,Last_Name,Middle_Name,Birthdate,Gender,course_id,Contact_No,Year_Level,Password,status} = req.query;
    console.log(req.query);
    if ( !Voter_id ||!First_Name || !Last_Name || !Middle_Name || !Birthdate || !Gender || !course_id || !Contact_No || !Year_Level || !Password || !status ) {
      res.status(400).send({ error: "Missing parameterrrrrrrrrrrrrrrr" });
      return;
    }
    const query = "INSERT INTO `userinfo`VALUES (?,?,?,?,?,?,?,?,?,?,?)";
    db.query(query, [Voter_id,First_Name,Last_Name,Middle_Name,Birthdate,Gender,course_id,Contact_No,Year_Level,Password,status], (err, result) => {
      if (err) {
        res.status(500).send({ error: 'Error' });
      } else {
        res.status(200).send({ message: 'Successfully inserted' });
      }
    });
  }
  else if(tableName==="course"){
    const {course, Status} = req.query;
    if (!course || !Status) {
      res.status(400).send({ error: "Missing parameter or id error" });
      return;
    }
    const query = "INSERT INTO `course`(course, Status) Values (?, ?)";
    
    db.query(query, [course, Status], (err, result) => {
      if (err) {
        res.status(500).send({ error: 'Error' });
      } else {
        res.status(200).send({ message: 'Successfully inserted' });
      }
    });
  }
  else if(tableName==="partylist"){
    const {Name, Academic_year, Status} = req.query;
    if (!Name || !Academic_year || !Status) {
      res.status(400).send({ error: "Missing parameter or id error" });
      return;
    }
    const query = "INSERT INTO `partylist`(Name, Academic_year, Status) Values (?, ?, ?)";
   
    db.query(query, [Name, Academic_year, Status], (err, result) => {
      if (err) {
        res.status(500).send({ error: 'Error' });
      } else {
        res.status(200).send({ message: 'Successfully inserted' });
      }
    });
  }
  else if(tableName==="positions"){
    const {Name, Num_Winner,Rank, Status} = req.query;
    if (!Name || !Num_Winner || !Rank  || !Status) {
      res.status(400).send({ error: "Missing parameter or id error" });
      return;
    }
    const query = "INSERT INTO `positions`(Name, Num_Winner, Rank, Status) Values (?, ?, ?, ?)";
    
    db.query(query, [Name,Num_Winner,Rank,Status], (err, result) => {
      if (err) {
        res.status(500).send({ error: 'Error' });
      } else {
        res.status(200).send({ message: 'Successfully inserted' });
      }
    });
  }
 
  else if(tableName==="candidate"){
    const {Voter_id, partylist_id, position_id} = req.query;
    console.log(req.query)
    if (!Voter_id || isNaN(Voter_id) || !partylist_id || isNaN(partylist_id) || !position_id || isNaN(position_id)) {
      res.status(400).send({ error: "Missing parameter or id error" });
      return;
    }
    const query = "INSERT INTO `candidate`(Voter_id, partylist_id, position_id) VALUES(?,?,?)";
    
    db.query(query, [Voter_id, partylist_id, position_id], (err, result) => {
      if (err) {
        res.status(500).send({ error: 'Error' });
      } else {
        res.status(200).send({ message: 'Successfully inserted' });
      }
    });
  }
  else if(tableName==="votes"){
    const {Voter_id, Candidate_id, V_date_time} = req.query;
    if (!Voter_id || isNaN(Voter_id) || !Candidate_id || isNaN(Candidate_id) || !V_date_time) {
      res.status(400).send({ error: "Missing parameter or id error" });
      return;
    }
    const query = "INSERT INTO `votes`(Voter_id, Candidate_id, V_date_time) VALUES(?,?,?)";
    
    db.query(query, [Voter_id, Candidate_id, V_date_time], (err, result) => {
      if (err) {
        res.status(500).send({ error: 'Error' });
      } else {
        res.status(200).send({ message: 'Successfully inserted' });
      }
    });
  }
  
  else{
    return res.status(400).send({ error: 'Invalid table name' });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
