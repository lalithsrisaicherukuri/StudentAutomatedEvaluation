const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const natural = require('natural');
const { exec } = require('child_process');

const studentRoutes = require('./studentRoutes');

const Teacher = require('./models/teacher');
const Student = require('./models/student');
const Question = require('./models/question');
const TestSet = require('./models/testSet');

const app = express();
  
mongoose.connect("mongodb://127.0.0.1:27017/studentevaluation");

app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/', studentRoutes);   

// Middleware
function isLoggedIn(req, res, next) {
    if (!req.cookies.token) return res.redirect("/login");
    let data = jwt.verify(req.cookies.token, "shhhh");
    req.user = data;
    next();
}

// Routes
app.get("/", (req, res) => {
    res.render("index");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/assessment", (req, res) => {
    res.render("assessment");
});

// Add Question
app.post('/addQuestion', async (req, res) => {
  const { teacherId, questionText, options, correctAnswerIndex } = req.body;

  try {
    await Question.create({
      questionText: questionText.trim(),
      options,
      correctAnswerIndex: Number(correctAnswerIndex),
    });

    res.redirect(`/dashboard/${teacherId}`);
  } catch (err) {
    console.error('Error adding question:', err);
    res.status(500).send('Failed to add question.');
  }
});

// Register
app.post("/register", async (req, res) => {
    let { email, password, employeeId, name, age } = req.body;
    let teacher = await Teacher.findOne({employeeId });
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


// Login
app.post("/login", async (req, res) => {
    let { email, password } = req.body;

    const teacher = await Teacher.findOne({ email });
    if (!teacher) return res.status(500).send("Invalid credentials");

    function func(err, result) {
        if (result) {
            let token = jwt.sign({ email: email, userId: teacher._id }, "shhhh");
            res.cookie("token", token);
            res.redirect(`/dashboard/${teacher._id}`);
        } else {
            res.redirect("/login");
        }
    }

    bcrypt.compare(password, teacher.password,func);
});

// Logout
app.get("/logout", (req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
});

// Display Marks
app.get("/display/:studentId", isLoggedIn, async (req, res) => {
    const studentId = req.params.studentId;
    const student = await Student.findById(studentId);
    const marksArray = student.marks;
    res.render("display", { marks: JSON.stringify(marksArray) });
});

// Create Test Set
app.post('/createTestSet', isLoggedIn, async (req, res) => {
  try {
    const { teacherId, testSetName, questionIds = [] } = req.body;

    await TestSet.create({
      name:      testSetName.trim(),
      questions: Array.isArray(questionIds) ? questionIds : [questionIds],
      createdBy: teacherId,               
    });

    res.redirect(`/dashboard/${teacherId}`);  
  } catch (err) {
    console.error('Error creating test set:', err);
    res.status(500).send('Failed to create test set.');
  }
});

// Dashboard
app.get("/dashboard/:employeeId", isLoggedIn, async (req, res) => {
    try {
        const teacher = await Teacher.findOne({ email: req.user.email }).populate("students");
        const allQuestions = await Question.find();
        const testSets = await TestSet.find();

        res.render("dashboard", {
            teacher,
            allQuestions,
            testSets,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading dashboard");
    }
});
// Assessment Page
app.get('/assessment/:studentId', isLoggedIn, async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const student = await Student.findById(studentId);
        if (!student) return res.status(404).send("Student not found");

        res.render("assessment", { student });
    } catch (err) {
        console.error("Error loading assessment page:", err);
        res.status(500).send("Error loading assessment page");
    }
});

app.get('/assessment/:studentId',isLoggedIn,async(req,res)=>{

    try{
        const studentId = req.params.studentId;
        const student = await Student.findById(studentId);
        if(!student) return res.status(404).send("Student not");
        res.render("assement");
    }

    catch (err){
        console.log("error");
    }
});

// Assessment Submit
app.post('/assessment/:studentId/submit', async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const { similarity } = req.body;
        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ error: "Student not found" });

        let increment = 0;
        if (similarity >= 10 && similarity < 20) increment = 2;
        else if (similarity >= 20 && similarity < 30) increment = 3;
        else if (similarity >= 30 && similarity < 40) increment = 4;
        else if (similarity >= 40 && similarity < 50) increment = 5;
        else if (similarity >= 50 && similarity < 60) increment = 6;
        else if (similarity >= 60 && similarity < 70) increment = 7;
        else if (similarity >= 70 && similarity < 80) increment = 8;
        else if (similarity >= 80 && similarity < 90) increment = 9;
        else if (similarity >= 90 && similarity <= 100) increment = 10;

        student.marks.push(increment);
        const total = student.marks.reduce((a, b) => a + b, 0);
        student.grade = total / student.marks.length;
        await student.save();

        res.json({ message: "Grade updated", newGrade: student.grade });

    } catch (err) {
        console.error("Error updating grade:", err);
        res.status(500).json({ error: "Error updating grade" });
    }
});

// Delete Student
app.post('/deleteStudent/:studentId', async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const student = await Student.findById(studentId);
        if (!student) return res.status(404).send("Student not found");

        const teacherId = student.teacher;
        await Student.findByIdAndDelete(studentId);
        await Teacher.findByIdAndUpdate(teacherId, { $pull: { students: studentId } });
        res.redirect(`/dashboard/${teacherId}`);   
    } catch (err) {
        console.error("Error deleting student:", err);
        res.status(500).send("Error deleting student");
    }
});

// Edit Student
app.post('/edit/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { name, age }  = req.body;

    const student = await Student.findByIdAndUpdate(
      studentId,
      { name, age },
      { new: true }    
    );
    if (!student) return res.status(404).send('Student not found');

    res.redirect(`/dashboard/${student.teacher}`);    
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(500).send('Error updating student');
  }
});

// Written Test Page
app.get("/test/:studentId", isLoggedIn, async (req, res) => {
    const { studentId } = req.params;
    const { testSetId } = req.query;

    try {
        const student = await Student.findById(studentId);
        if (!student) return res.status(404).send("Student not found");

        if (student.submittedTests.includes(testSetId)) {
            return res.status(403).send("You have already submitted this test.");
        }

        const testSet = await TestSet.findById(testSetId).populate("questions");
        if (!testSet) return res.status(404).send("Test Set not found");

        res.set({
            "Cache-Control": "no-store, no-cache, must-revalidate, private",
            "Pragma": "no-cache",
            "Expires": "0"
        });

        res.render("test", {
            studentId,
            testSetId,
            questions: testSet.questions,
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading test.");
    }
});

// Submit Written Test
app.post("/submitTest/:studentId", isLoggedIn, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { testSetId } = req.query;
        const submittedAnswers = req.body.answers;

        const student = await Student.findById(studentId);
        if (!student) return res.status(404).send("Student not found");

        if (student.submittedTests.includes(testSetId)) {
            return res.status(403).send("Test already submitted.");
        }

        let correct = 0;
        let total = 0;
        let finalAnswers = [];

        const wrong = [];

        const questionIds = Object.keys(submittedAnswers);
        const questions = await Question.find({ _id: { $in: questionIds } });

        questions.forEach((question) => {
            const qid = question._id.toString();
            const correctIndex = question.correctAnswerIndex;
            const userAnswer = parseInt(submittedAnswers[qid]);

            const isCorrect = userAnswer === correctIndex;
            if (isCorrect) correct++;
            else wrong.push(question.questionText);
            total++;

            finalAnswers.push({
                question: question.questionText,
                selectedOption: question.options[userAnswer],
                correctOption: question.options[correctIndex],
                isCorrect,
            });
        });

        student.writtenMarks.push(correct);
        student.totalWrittenMarks.push(total);
        student.submittedTests.push(testSetId);
        await student.save();

        const axios = require('axios');
        
        // ✅ Replace with your actual API key
        const API_KEY = '';
        
        const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
        
        async function askGemini(prompt) {
          try {
            const response = await axios.post(URL, {
              contents: [
                {
                  parts: [{ text: prompt }]
                }
              ]
            });
        
            const reply = response.data.candidates[0].content.parts[0].text;
            return reply;
          } catch (err) {
            console.error("❌ Error:", err.response?.data || err.message);
          }
        }
        

         const geminiReplies = [];
        for (const q of wrong) {
  const prompt = `
Return HTML only (≤ 10 lines).

If the question contains math symbols (\\int, ^, _, d/dx, =, etc.):
  • Generate five MCQs *about this exact question*.
  • Each option must be a plausible numeric or algebraic answer—do **NOT** use "…".
  • Use inline LaTeX where needed (e.g. \\frac{3}{2}, \\sqrt{2}).

If the question is conceptual/theoretical:
  • Give 1–2 lines of context, then five MCQs with solid distractors.

Finish with one line: <strong>Key:</strong> 1-A, 2-C, 3-B, 4-D, 5-A

Question:
${q}`.trim();

  const reply = await askGemini(prompt);
  geminiReplies.push(reply);
}


        res.render("result", {
            studentId,
            correct,
            total,
            finalAnswers,
            geminiReplies
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error evaluating test.");
    }
});

app.get("/already-submitted", (req, res) => {
    res.send("<h2>You have already submitted the test. You cannot go back to it.</h2>");
});

// Start Speech
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

// Compare Text
app.post('/compare-text', (req, res) => {
    try {
        const { original, spoken } = req.body;
        const tokenizer = new natural.WordTokenizer();
        const originalTokens = tokenizer.tokenize(original);
        const spokenTokens = tokenizer.tokenize(spoken);

        const allWords = Array.from(new Set([...originalTokens, ...spokenTokens]));
        const originalVector = allWords.map(word => originalTokens.filter(w => w === word).length);
        const spokenVector = allWords.map(word => spokenTokens.filter(w => w === word).length);

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

// Stop Speech
app.get('/stop-speech', (req, res) => {
    res.json({ message: "Speech recognition stopped." });
});

app.listen(4000, () => {
    console.log("Server running on port 4000");
});
