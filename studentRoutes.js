// studentRoutes.js
const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');

const Student = require('./models/student');
const Teacher = require('./models/teacher');
const TestSet = require('./models/testSet');

const router = express.Router();

/* ───────────── 1. GET login page ───────────── */
router.get('/studentLogin', (req, res) => {
  res.render('studentLogin');                 // views/studentLogin.ejs
});

/* ───────────── 2. POST login credentials ───── */
router.post('/studentLogin', async (req, res) => {
  const studentId = req.body.studentId || req.body.student_id;
  const { password } = req.body;

  const student = await Student.findOne({ studentId });
  if (!student || !student.password)
    return res.status(400).send('Invalid credentials');

  const ok = await bcrypt.compare(password, student.password);
  if (!ok)
    return res.status(400).send('Invalid credentials');

  const token = jwt.sign({ userId: student._id, role: 'student' }, 'shhhh');
  res.cookie('token', token);
  res.redirect(`/studentDashboard/${student._id}`);
});

/* ───────────── 3. Student dashboard ────────── */
// studentRoutes.js
router.get('/studentDashboard/:studentId', async (req, res) => {
  const student  = await Student.findById(req.params.studentId);
  if (!student) return res.status(404).send('Student not found');

  const testSets = await TestSet.find();  
  res.render('studentDashboard', { student, testSets });
});
;

/* ───────────── 4. Add student (teacher side) ─ */
router.post('/addStudent', async (req, res) => {
  const { studentId, name, age, grade, password, teacherId } = req.body;
  if (!studentId || !teacherId)
    return res.status(400).send('Student ID and Teacher ID are required');

  if (await Student.findOne({ studentId }))
    return res.status(400).send('Student ID already exists');

  const hashed = await bcrypt.hash(password, 10);

  const student = await Student.create({
    studentId,
    name,
    age,
    grade,
    password: hashed,
    teacher:  teacherId,
  });

  await Teacher.findByIdAndUpdate(teacherId, { $push: { students: student._id } });
  res.redirect(`/dashboard/${teacherId}`);
});

module.exports = router;
