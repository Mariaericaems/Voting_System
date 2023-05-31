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


  

// Token(ID) verification middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).send({ error: 'No token provided' });
  }
  const userId = parseInt(token); // Assuming token is the user_id
  const query = 'SELECT * FROM userinfo Where Voter_id = ?';
  //'SELECT * FROM account_information WHERE account_id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).send({ error: 'Error verifying token' });
    }

    if (results.length === 0) {
      return res.status(401).send({ error: 'Invalid token' });
    }
    next();
  });
};



app.get('/votingsysm', verifyToken, (req, res) => {
  const displayData = req.query.displayData; 
  let sqlQuery;
  if (displayData === "userinfo") {
    sqlQuery = "SELECT Voter_id, `First_Name`, `Last_Name`, `Middle_Name`, `Birthdate`, `Gender`, `course_id`, `Contact_No`, `Year_Level`, `Password`, `status` FROM `userinfo`";
  } else if (displayData === "partylist") {
    sqlQuery = "SELECT Partylist_id, `Name`, `Academic_year`, `Status` FROM `partylist`";
    //"SELECT Resident_ID, `Household_Number` as 'Household Number', `Family_Number` as 'Family Number', `First_Name` as 'First Name', `Middle_Name` as 'Middle Name', `Last_Name` as 'Last Name', `Extension_Name` as 'Extension Name', Date_Format(Birth_Date, '%d-%m-%Y') as 'Birth Date', `Age`, `Birth_Place` as 'Birth Place', `Civil_Status` as 'Civil Status', `Sex`, `Contact_Number` as 'Contact Number', `Purok` FROM `resident_profile`";
  } else if (displayData === "course") {
    sqlQuery = "SELECT course_id, `course`, `Status` FROM `course`";
    //"SELECT account_request.Request_ID, account_request.Name, account_request.Username, Date_Format(account_request.Date_Created, '%d-%m-%Y') as 'Date Created', account_role.Role_Name FROM `account_request` inner join Account_role on Account_role.Role_id=account_request.Role_id";
  } else if (displayData === "positions") {
    sqlQuery = "SELECT Position_id, `Name`, `Num_Winner`, `Rank`, `Status` FROM `positions`";
    //"SELECT `Beneficiary_ID`,concat(resident_profile.First_Name,' ',resident_profile.Middle_Name,' ',resident_profile.Last_Name,' ',resident_profile.Extension_Name) as Name, resident_profile.Age, resident_profile.Purok, benefits.Benefit_Name,benefits.Description, Date_Format(`Membership_Date`, '%d-%m-%Y') as 'Membership Date', `Status` FROM `beneficiary` INNER join resident_profile on resident_profile.Resident_ID=beneficiary.Resident_ID INNER join benefits on benefits.Benefit_ID=beneficiary.Benefit_ID";
  } else if (displayData === "tally") {
    sqlQuery = "SELECT candidate.candidate_id, Concat(userinfo.First_Name, ' ', userinfo.Last_Name) as Candidates, COUNT(votes.Voter_id) as vote_count FROM candidate INNER join userinfo on candidate.Voter_id = userinfo.Voter_id INNER join votes on candidate.candidate_id = votes.Candidate_id GROUP BY Candidates";
    //"SELECT Resident_ID,concat(First_Name, ' ', Middle_Name, ' ', Last_Name, ' ', Extension_Name) as Name, Age, Purok from resident_profile where Resident_ID not in (SELECT Resident_ID from pregnancy_information) and sex='Female'";
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
    //"SELECT Resident_ID, `Household_Number` as 'Household Number', `Family_Number` as 'Family Number', `First_Name` as 'First Name', `Middle_Name` as 'Middle Name', `Last_Name` as 'Last Name', `Extension_Name` as 'Extension Name', Date_Format(Birth_Date, '%d-%m-%Y') as 'Birth Date', `Age`, `Birth_Place` as 'Birth Place', `Civil_Status` as 'Civil Status', `Sex`, `Contact_Number` as 'Contact Number', `Purok` FROM `resident_profile` where sex = ?";
  } 
  else if (displayData === "search users") {
    sqlQuery = "SELECT  First_Name, Last_Name, Middle_Name, Birthdate, Gender, course_id, Contact_No, Year_Level, Password, status FROM userinfo Where Voter_id = ?";
    //"SELECT Resident_ID, `Household_Number` as 'Household Number', `Family_Number` as 'Family Number', `First_Name` as 'First Name', `Middle_Name` as 'Middle Name', `Last_Name` as 'Last Name', `Extension_Name` as 'Extension Name', Date_Format(Birth_Date, '%d-%m-%Y') as 'Birth Date', `Age`, `Birth_Place` as 'Birth Place', `Civil_Status` as 'Civil Status', `Sex`, `Contact_Number` as 'Contact Number', `Purok` FROM `resident_profile` where Purok = ?";
  } else if (displayData === "Search year") {
    searchData=searchData+"%";
    sqlQuery = "SELECT Name, Academic_year, Status from partylist Where Academic_year Like";
    //"SELECT Resident_ID, `Household_Number` as 'Household Number', `Family_Number` as 'Family Number', `First_Name` as 'First Name', `Middle_Name` as 'Middle Name', `Last_Name` as 'Last Name', `Extension_Name` as 'Extension Name', Date_Format(Birth_Date, '%d-%m-%Y') as 'Birth Date', `Age`, `Birth_Place` as 'Birth Place', `Civil_Status` as 'Civil Status', `Sex`, `Contact_Number` as 'Contact Number', `Purok` FROM `resident_profile` where First_Name like ? ";
  } else if (displayData === "presresult") {
    sqlQuery = "SELECT candidate.candidate_id, Concat(userinfo.First_Name, ' ', userinfo.Last_Name) as Candidates, COUNT(votes.Voter_id) as vote_count FROM candidate INNER join userinfo on candidate.Voter_id = userinfo.Voter_id INNER join votes on candidate.candidate_id = votes.Candidate_id Where candidate.position_id = ? GROUP BY candidates ORDER BY vote_count DESC";
    //"SELECT `Vaccine_ID`, `Vaccine_Name` as 'Vaccine Name', `Vaccine_Detail` as 'Detail', `Dossage_Sequence` as 'Dossage Sequence',  Date_Format(Date_Implemented, '%d-%m-%Y') 'Date Implemented'  FROM `vaccine`";
  } else if (displayData === "vpresult") {
    sqlQuery = "SELECT candidate.candidate_id, Concat(userinfo.First_Name,' ', userinfo.Last_Name) as Candidates,  COUNT(votes.Voter_id) as vote_count FROM candidate INNER join userinfo on candidate.Voter_id = userinfo.Voter_id INNER join votes on candidate.candidate_id = votes.Candidate_id Where candidate.position_id = ? GROUP BY candidates ORDER BY vote_count DESC";
    //"SELECT vaccination.Vaccination_ID,concat( `First_Name`,' ', `Middle_Name`, ' ',`Last_Name`,' ', `Extension_Name`) as Name, `Age`, `Sex`, `Purok`,vaccine.Vaccine_Name as 'Vaccine Name',vaccine.Dossage_Sequence as 'Dossage Sequence',vaccination.Vaccination_Count as 'Dossage Complete',vaccination.Status,vaccination.Vaccination_Date as 'Vaccination Date'  FROM `resident_profile` INNER join vaccination on vaccination.Resident_ID=resident_profile.Resident_ID inner join vaccine on vaccine.Vaccine_ID=vaccination.Vaccine_ID";
  }else if (displayData === "Senatorresult") {
    sqlQuery = "SELECT candidate.candidate_id, Concat(userinfo.First_Name,' ', userinfo.Last_Name) as Candidates,  COUNT(votes.Voter_id) as vote_count FROM candidate INNER join userinfo on candidate.Voter_id = userinfo.Voter_id INNER join votes on candidate.candidate_id = votes.Candidate_id Where candidate.position_id = ? GROUP BY candidates ORDER BY vote_count DESC";
    //"SELECT vaccination.Vaccination_ID,concat( `First_Name`,' ', `Middle_Name`, ' ',`Last_Name`,' ', `Extension_Name`) as Name, `Age`, `Sex`, `Purok`,vaccine.Vaccine_Name as 'Vaccine Name',vaccine.Dossage_Sequence as 'Dossage Sequence',vaccination.Vaccination_Count as 'Dossage Complete',vaccination.Status,vaccination.Vaccination_Date as 'Vaccination Date'  FROM `resident_profile` INNER join vaccination on vaccination.Resident_ID=resident_profile.Resident_ID inner join vaccine on vaccine.Vaccine_ID=vaccination.Vaccine_ID";
  } else if (displayData === "represults") {    
    sqlQuery = "SELECT candidate.candidate_id, Concat(userinfo.First_Name,' ', userinfo.Last_Name) as Candidates,  COUNT(votes.Voter_id) as vote_count FROM candidate INNER join userinfo on candidate.Voter_id = userinfo.Voter_id INNER join votes on candidate.candidate_id = votes.Candidate_id Where candidate.position_id = ? GROUP BY candidates ORDER BY vote_count DESC";  
  } else if (displayData === "candidate") {
    sqlQuery = "SELECT candidate.candidate_id, Concat(userinfo.First_Name, ' ', userinfo.Last_Name) as Full_Name, partylist.Name as Partylist, positions.Name as Positions from candidate  Inner Join partylist on candidate.partylist_id = partylist.Partylist_id Inner Join positions on candidate.position_id = positions.Position_id Inner Join userinfo on candidate.Voter_id = userinfo.Voter_id where positions.Name = ?";
    //"SELECT `Benefit_ID`, `Benefit_Name` as 'Benefit Name', `Description`, Date_Format(Date_Implemented, '%d-%m-%Y') 'Date Implemented' FROM `benefits`";
  } else if (displayData === "positions") {
    sqlQuery = "SELECT candidate.candidate_id, Concat(userinfo.First_Name, ' ', userinfo.Last_Name) as Full_Name, partylist.Name as Partylist, positions.Name as Positions from candidate  Inner Join partylist on candidate.partylist_id = partylist.Partylist_id Inner Join positions on candidate.position_id = positions.Position_id Inner Join userinfo on candidate.Voter_id = userinfo.Voter_id where positions.Name = ?";
    //"SELECT resident_profile.Resident_ID,CONCAT(First_Name,' ', Middle_Name,' ',Last_Name,' ',Extension_Name) AS Name,bmi_information.Height,bmi_information.Weight,  Status,Age, Purok,Date_Format(date_updated, '%d-%m-%Y') as 'Date Updated' FROM resident_profile inner join bmi_information on bmi_information.Resident_ID=resident_profile.Resident_ID;";
  } else if (displayData === "candidatevp") {
    sqlQuery = "SELECT candidate.candidate_id, Concat(userinfo.First_Name, ' ', userinfo.Last_Name) as Full_Name, partylist.Name as Partylist, positions.Name as Positions from candidate  Inner Join partylist on candidate.partylist_id = partylist.Partylist_id Inner Join positions on candidate.position_id = positions.Position_id Inner Join userinfo on candidate.Voter_id = userinfo.Voter_id where positions.Name = ?";
    //"SELECT BP_ID,concat(resident_profile.First_Name,' ',resident_profile.Middle_Name,' ',resident_profile.Last_Name,' ',resident_profile.Extension_Name) as Name, resident_profile.Age, resident_profile.Purok, resident_profile.Sex, concat(systolic,'/',diastolic) as 'Blood Pressure',Level, Date_Format(Date_Checked, '%d-%m-%Y') as 'Date Checked' FROM blood_pressure INNER join resident_profile on resident_profile.Resident_ID=blood_pressure.Resident_ID ";
  } else if (displayData === "votes") {
    sqlQuery = "SELECT * from votes Where Voter_id = ?"
    //"SELECT resident_profile.`Resident_ID`, `Household_Number` as 'Household_Number', `Family_Number` as 'Family Number', concat (`First_Name`,' ', `Middle_Name`,' ', `Last_Name`, ' ',`Extension_Name`) as Name, `Birth_Date`,`Sex`,`Purok`, Date_Format(immunization.Date_Checked, '%d-%m-%Y') as 'Date Last Checked' FROM `resident_profile` inner join immunization on immunization.Resident_ID=resident_profile.Resident_ID";
  } else if (displayData === "rep") {  
    sqlQuery = "SELECT candidate.candidate_id, Concat(userinfo.First_Name, ' ', userinfo.Last_Name) as Full_Name, partylist.Name as Partylist, positions.Name as Positions from candidate  Inner Join partylist on candidate.partylist_id = partylist.Partylist_id Inner Join positions on candidate.position_id = positions.Position_id Inner Join userinfo on candidate.Voter_id = userinfo.Voter_id where positions.Name  = ?";
    //"SELECT Pregnancy_ID,concat(resident_profile.First_Name,' ',resident_profile.Middle_Name,' ',resident_profile.Last_Name,' ',resident_profile.Extension_Name) as Name, resident_profile.Age, resident_profile.Purok,pregnancy_information.Months_of_Pregnancy, Date_Format(Date_Checked, '%d-%m-%Y') as 'Date Checked'FROM pregnancy_information INNER join resident_profile on resident_profile.Resident_ID=pregnancy_information.Resident_ID";
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
   // if (!Name || !tableName) {
    res.status(400).send({ error: 'Invalid or missing Parameter' });
    return;
  }
  if(tableName==="partylist"){
    sqlQuery = "DELETE FROM partylist WHERE Partylist_id = ? ";
    //"DELETE FROM `resident_profile` WHERE Resident_ID = ?";
  }
  else if(tableName==="positions"){
    sqlQuery = "DELETE FROM positions WHERE Position_id = ?";
    //"DELETE FROM `account_request` WHERE Request_ID=?";
  }
  else if(tableName==="candidate"){
    sqlQuery = "DELETE FROM candidate WHERE candidate_id = ?";
    //"DELETE FROM `beneficiary` WHERE Resident_ID=?";
  }
  else if(tableName==="delete course"){
    sqlQuery = "DELETE FROM course WHERE course_id = ?";
    //"DELETE FROM `beneficiary` WHERE Beneficiary_ID=?";
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
    //"INSERT into account_information(`Name`, `Username`, `Password`, `Date_Created`, `Role_ID`) SELECT `Name`, `Username`, `Password`, `Date_Created`, `Role_ID`  FROM account_request WHERE Request_ID=?";
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
    //"INSERT into account_information(`Name`, `Username`, `Password`, `Date_Created`, `Role_ID`) SELECT `Name`, `Username`, `Password`, `Date_Created`, `Role_ID`  FROM account_request WHERE Request_ID=?";
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
    //"INSERT into account_information(`Name`, `Username`, `Password`, `Date_Created`, `Role_ID`) SELECT `Name`, `Username`, `Password`, `Date_Created`, `Role_ID`  FROM account_request WHERE Request_ID=?";
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
    if (!Voter_id || isNaN(Voter_id) || !partylist_id || isNaN(partylist_id) || !position_id || isNaN(position_id)) {
      res.status(400).send({ error: "Missing parameter or id error" });
      return;
    }
    const query = "INSERT INTO `candidate`(Voter_id, partylist_id, position_id) VALUES(?,?,?)";
    //"INSERT into account_information(`Name`, `Username`, `Password`, `Date_Created`, `Role_ID`) SELECT `Name`, `Username`, `Password`, `Date_Created`, `Role_ID`  FROM account_request WHERE Request_ID=?";
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
    //"INSERT into account_information(`Name`, `Username`, `Password`, `Date_Created`, `Role_ID`) SELECT `Name`, `Username`, `Password`, `Date_Created`, `Role_ID`  FROM account_request WHERE Request_ID=?";
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
