const express = require('express');
const app = express();


const students = [
    { id: 1, name: 'Alice', age: 21},
    { id: 2, name: 'Bob', age: 22},
    { id: 3, name: 'Charlie', age: 23},
    { id: 4, name: 'David', age: 24},
    { id: 5, name: 'Eve', age: 25},
];

app.get('/students', (req, res) => {
 res.json(students);
});

app.get('/students/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const student = students.find(s => s.id === id);
    if (!students) {
        res.status(408).send('student not found');

    }
    else{
        res.json(student);
    }
});

app.get('/student', (req, res) => {
    res,send(student);
});

app.get('/student/:id', (req, res) => {
    const student = students.find(s => s.id === parseInt(req.params.id));
    if (!student) return res.status(404).send('Student not found');
    res.send(student);
});

app.post('/student', (req, res) => {
    const student = {
        id: student.length + 1,
        name: req.body.name,
        age: req.body.age,
    };
    student.push(student);
    res.send(student);
});

app.put('/students/:id', (req, res) =>{
    const student = students.find(s => s.id === parseInt(req.params.id));
    if (!student) return res.status(404).send('Student not found');
   student.name = req.body.name;
   student.age = req.body.age;

   res.send(student);
});

app.delete('/students/:id', (req, res) =>{
    const studentIndex = students.findIndex(s => s.id === parseInt(req.params.id));
    if (studentIndex === -1) return res.status(404).send('Student not found');
    students.splice(studentIndex, 1);
    res.send('Student with ID ${req.params.id} deleted.');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Listening on port ${port}...'));