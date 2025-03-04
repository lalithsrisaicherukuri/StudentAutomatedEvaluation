const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');

const Teacher = require('./models/teacher');
const Student = require('./models/student');
const natural = require('natural');
const app = express();
const { exec } = require('child_process');
mongoose.connect("mongodb://127.0.0.1:27017/studentevaluation");
app.use(express.static(path.join(__dirname, 'public')));

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

function isLoggedIn(req, res, next) {
    if (!req.cookies.token) return res.redirect("/login");
    let data = jwt.verify(req.cookies.token, "shhhh");
    req.user = data;
    next();
}


app.get("/", (req, res) => {
    res.render("index");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/assessment",(req,res)=>{
    res.render("assessment");
});


app.post("/register", async (req, res) => {
    let { email, password, employeeId, name, age } = req.body;
    
    let teacher = await Teacher.findOne({ email });
    if (teacher) return res.status(500).send("Teacher already registered");

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            let newTeacher = await Teacher.create({
                employeeId,
                email,
                age,
                name,
                password: hash
            });

            let token = jwt.sign({ email: email, userId: newTeacher._id }, "shhhh");
            res.cookie("token", token);
            res.send("Registered successfully");
        });
    });
});

app.post("/login", async (req, res) => {
    let { email, password } = req.body;
    
    let teacher = await Teacher.findOne({ email });
    if (!teacher) return res.status(500).send("Invalid credentials");

    bcrypt.compare(password, teacher.password, function (err, result) {
        if (result) {
            let token = jwt.sign({ email: email, userId: teacher._id }, "shhhh");
            res.cookie("token", token);
            res.redirect("/dashboard");
        } else {
            res.redirect("/login");
        }
    });
});

app.get("/logout", (req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
});

app.get("/dashboard", isLoggedIn, async (req, res) => {
    let teacher = await Teacher.findOne({ email: req.user.email }).populate("students");
    res.render("dashboard", { teacher });
});


app.post('/addStudent', async (req, res) => {
    let { studentId, name, age, grade, teacherId } = req.body;

    if (!studentId || !teacherId) {
        return res.status(400).send("Student ID and Teacher ID are required");
    }

    try {
        let existingStudent = await Student.findOne({ studentId });
        if (existingStudent) {
            return res.status(400).send("Student ID already exists");
        }

        let student = new Student({ studentId, name, age, grade, teacher: teacherId });
        await student.save();

        await Teacher.findByIdAndUpdate(teacherId, { $push: { students: student._id } });

        res.redirect('/dashboard'); 
    } catch (err) {
        console.error(err);
        res.status(500).send("Error adding student");
    }
});

// GET route to render the assessment page for a student
app.get('/assessment/:studentId', async (req, res) => {
    try {
      const studentId = req.params.studentId;
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).send("Student not found");
      }
      // Render the assessment page and pass the student data
      res.render("assessment", { student });
    } catch (err) {
      console.error("Error loading assessment page:", err);
      res.status(500).send("Error loading assessment page");
    }
  });
  
  // POST route to update the student's grade based on the similarity score
  app.post('/assessment/:studentId/submit', async (req, res) => {
    try {
      const studentId = req.params.studentId;
      const { similarity } = req.body;
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      
      // Determine the grade increment based on similarity decile ranges
      let increment = 0;
      if (similarity >= 10 && similarity < 20) {
        increment = 2;
      } else if (similarity >= 20 && similarity < 30) {
        increment = 3;
      } else if (similarity >= 30 && similarity < 40) {
        increment = 4;
      } else if (similarity >= 40 && similarity < 50) {
        increment = 5;
      } else if (similarity >= 50 && similarity < 60) {
        increment = 6;
      } else if (similarity >= 60 && similarity < 70) {
        increment = 7;
      } else if (similarity >= 70 && similarity < 80) {
        increment = 8;
      } else if (similarity >= 80 && similarity < 90) {
        increment = 9;
      } else if (similarity >= 90 && similarity <= 100) {
        increment = 10;
      }
      
      // Update the student's grade with the calculated increment
      student.grade += increment;
      await student.save();
      
      res.json({ message: "Grade updated", newGrade: student.grade });
    } catch (err) {
      console.error("Error updating grade:", err);
      res.status(500).json({ error: "Error updating grade" });
    }
  });
  
  
  app.post('/deleteStudent/:studentId', async (req, res) => {
    try {
      const studentId = req.params.studentId;
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).send("Student not found");
      }
      const teacherId = student.teacher;
      await Student.findByIdAndDelete(studentId);
      await Teacher.findByIdAndUpdate(teacherId, { $pull: { students: studentId } });
      res.redirect('/dashboard');
    } catch (err) {
      console.error("Error deleting student:", err);
      res.status(500).send("Error deleting student");
    }
  });
  


app.post("/editStudent", isLoggedIn, async (req, res) => {
    let { id, name, age, grade } = req.body;
    await Student.findByIdAndUpdate(id, { name, age, grade });
    res.redirect("/dashboard");
});

app.get('/start-speech', (req, res) => {
    exec('python speech_to_text.py', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).json({ error: error.message });
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return res.status(500).json({ error: stderr });
        }

        console.log("Raw Python Output:", stdout);

        try {
            const output = JSON.parse(stdout.trim()); 
            res.json(output);
        } catch (parseError) {
            console.error("Parsing error:", parseError);
            console.error("Raw output:", stdout);
            res.status(500).json({ error: "Failed to parse speech recognition output" });
        }
    });
});


app.post('/compare-text', (req, res) => {
    try {
        const { original, spoken } = req.body;

        // Tokenize the texts
        const tokenizer = new natural.WordTokenizer();
        const originalTokens = tokenizer.tokenize(original);
        const spokenTokens = tokenizer.tokenize(spoken);

        // Create a term frequency map
        const allWords = Array.from(new Set([...originalTokens, ...spokenTokens]));
        const originalVector = allWords.map(word => originalTokens.filter(w => w === word).length);
        const spokenVector = allWords.map(word => spokenTokens.filter(w => w === word).length);

        // Compute Cosine Similarity
        const dotProduct = originalVector.reduce((sum, val, i) => sum + val * spokenVector[i], 0);
        const magnitudeA = Math.sqrt(originalVector.reduce((sum, val) => sum + val * val, 0));
        const magnitudeB = Math.sqrt(spokenVector.reduce((sum, val) => sum + val * val, 0));

        let similarity = (dotProduct / (magnitudeA * magnitudeB)) * 100;
        similarity = similarity ? similarity.toFixed(2) : 0;

        res.json({ similarity });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error comparing texts" });
    }
});


app.get('/stop-speech', (req, res) => {
    res.json({ message: "Speech recognition stopped." });
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
