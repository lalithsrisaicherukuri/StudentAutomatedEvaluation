const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');

const Teacher = require('./models/teacher');
const Student = require('./models/student');
const Question = require('./models/question'); // Make sure path is correct
const TestSet = require("./models/testSet");

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



// add question

app.post("/addQuestion", async (req, res) => {
  const { questionText, options, correctAnswerIndex } = req.body;

  try {
    const newQuestion = new Question({
      questionText,
      options,
      correctAnswerIndex: parseInt(correctAnswerIndex),
    });

    await newQuestion.save();
    res.redirect("back"); // Reloads the dashboard
  } catch (error) {
    console.error("Error adding question:", error);
    res.status(500).send("Failed to add question.");
  }
});



// register

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

// submit test

app.post("/submit:studentId",isLoggedIn,async(reg,req)=>{


});

// login

app.post("/login", async (req, res) => {
    let { email, password } = req.body;
    
    let teacher = await Teacher.findOne({ email });
    if (!teacher) return res.status(500).send("Invalid credentials");

    bcrypt.compare(password, teacher.password, function (err, result) {
        if (result) {
            let token = jwt.sign({ email: email, userId: teacher._id }, "shhhh");
            res.cookie("token", token);
            res.redirect(`/dashboard/${teacher._id}`);
        } else {
            res.redirect("/login");
        }
    });
});


//logout

app.get("/logout", (req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
});


// display 

app.get("/display/:studentId",isLoggedIn, async(req, res) => {
    const studentId = req.params.studentId;
      const student = await Student.findById(studentId);
  const marksArray = student.marks ; // Example array
  res.render("display", { marks: JSON.stringify(marksArray) }); // Pass to frontend
});

// add student
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

// create testSet

app.post("/createTestSet", isLoggedIn, async (req, res) => {
  const { testSetName, questionIds } = req.body;
  const questionArray = Array.isArray(questionIds)
    ? questionIds
    : [questionIds];
  await TestSet.create({
    name: testSetName,
    questions: questionArray,
    createdBy: req.user._id, // or teacherId if not using sessions
  });
  res.redirect("/dashboard");
});



app.get("/dashboard/:employeeId", isLoggedIn, async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ email: req.user.email }).populate(
      "students"
    );
    const allQuestions = await Question.find();
    const testSets = await TestSet.find();

    res.render("dashboard", {
      teacher,
      allQuestions,
      testSets, // send test sets for the modal
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading dashboard");
  }
});


// GET route to render the assessment page for a student
app.get('/assessment/:studentId', isLoggedIn,async (req, res) => {
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

app.post('/assessment/:studentId/submit', async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const { similarity } = req.body;
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

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

    // Add new score to the marks array
    student.marks.push(increment);

    // Recalculate grade as average
    let total = student.marks.reduce((a, b) => a + b, 0);
    student.grade = total / student.marks.length;
    await student.save();

    // Redirect to the display page with the increment value
    res.json({ message: "Grade updated", newGrade: student.grade });

  } catch (err) {
    console.error("Error updating grade:", err);
    res.status(500).json({ error: "Error updating grade" });
  }
});

  //delete student
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
  

  // edit student
  app.post("/edit/:studentId", async (req, res) => {
    const studentId = req.params.studentId;
    const { name, age} = req.body;

    try {
      await Student.findByIdAndUpdate(studentId, { name, age});
      res.redirect("/dashboard"); // adjust if your route is different
    } catch (err) {
      res.status(500).send("Error updating student");
    }
  });

  // written test
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

    // ✅ Prevent browser from caching the test page
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
 

  // check Key
   
app.post("/submitTest/:studentId", isLoggedIn, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { testSetId } = req.query;
    const submittedAnswers = req.body.answers;

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).send("Student not found");

    // ❌ Block resubmission for same testSet
    if (student.submittedTests.includes(testSetId)) {
      return res.status(403).send("Test already submitted.");
    }

    let correct = 0;
    let total = 0;
    let finalAnswers = [];

    const questionIds = Object.keys(submittedAnswers);
    const questions = await Question.find({ _id: { $in: questionIds } });

    questions.forEach((question) => {
      const qid = question._id.toString();
      const correctIndex = question.correctAnswerIndex;
      const userAnswer = parseInt(submittedAnswers[qid]);

      const isCorrect = userAnswer === correctIndex;
      if (isCorrect) correct++;
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
    student.submittedTests.push(testSetId); // ✅ Mark testSet as submitted

    await student.save();

    res.render("result", {
      studentId,
      correct,
      total,
      finalAnswers,
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error evaluating test.");
  }
});

app.get("/already-submitted", (req, res) => {
  res.send("<h2>You have already submitted the test. You cannot go back to it.</h2>");
});


// start-speech

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

app.listen(4000, () => {
    console.log("Server running on port 4000");
});
