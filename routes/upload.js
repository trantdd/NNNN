var express = require("express");
var router = express.Router();
let { uploadExcel, uploadImage } = require('../utils/uploadHandler')
let path = require('path')
let excelJs = require('exceljs')
let studentModel = require('../schemas/students')
let teacherModel = require('../schemas/teachers')
let userModel = require('../schemas/users')
let subjectModel = require('../schemas/subjects')
let mongoose = require('mongoose')

router.post('/one_file', uploadImage.single('file'), function (req, res, next) {
    res.send({
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size
    })
})
router.post('/multiple_file', uploadImage.array('files', 5), function (req, res, next) {
    res.send(req.files.map(function (f) {
        return {
            filename: f.filename,
            path: f.path,
            size: f.size
        }
    }))
})
router.get('/:filename', function (req, res, next) {
    let pathFile = path.join(__dirname, '../uploads', req.params.filename)
    res.sendFile(pathFile)
})
router.post('/excel', uploadExcel.single('file'), async function (req, res, next) {
    let workBook = new excelJs.Workbook();
    let pathFile = path.join(__dirname, '../uploads', req.file.filename)
    await workBook.xlsx.readFile(pathFile)
    let worksheet = workBook.worksheets[0];
    let result = [];
    let batchsize = 50;
    let maxcommit = Math.ceil(worksheet.rowCount / batchsize);
    for (let commitTime = 0; commitTime < maxcommit; commitTime++) {
        let validRows = []
        let start = batchsize * commitTime + 1
        let end = Math.min(start + batchsize, worksheet.rowCount)
        let session = await mongoose.startSession();
        session.startTransaction()
        try {
            for (let index = start; index <= end; index++) {
                let rowError = [];
                const row = worksheet.getRow(index)
                let studentCode = row.getCell(1).value;
                let fullName = row.getCell(2).value;
                let email = row.getCell(3).value;
                let phone = row.getCell(4).value;

                if (!studentCode) {
                    rowError.push("studentCode khong duoc de trong")
                }
                if (!fullName) {
                    rowError.push("fullName khong duoc de trong")
                }
                if (rowError.length > 0) {
                    result.push({
                        success: false,
                        data: rowError
                    })
                    continue;
                } else {
                    validRows.push({
                        studentCode: studentCode,
                        fullName: fullName,
                        email: email || "",
                        phone: phone || ""
                    })
                }
            }
            let inserted = [];
            for (const row of validRows) {
                let newUser = new userModel({
                    username: row.studentCode,
                    password: 'Default@123',
                    email: row.email || row.studentCode + '@qlsv.com',
                    fullName: row.fullName,
                    role: 'STUDENT'
                })
                await newUser.save({ session })
                let newStudent = new studentModel({
                    user: newUser._id,
                    studentCode: row.studentCode,
                    fullName: row.fullName,
                    email: row.email || "",
                    phone: row.phone || ""
                })
                await newStudent.save({ session })
                inserted.push(newStudent)
            }
            if (inserted.length > 0) {
                result.push({
                    success: true,
                    data: inserted
                })
            }
            await session.commitTransaction();
            await session.endSession()
        } catch (error) {
            await session.abortTransaction();
            await session.endSession()
            result.push({
                success: false,
                data: error.message
            })
        }
    }
    res.send(result)
})
router.post('/excel/teachers', uploadExcel.single('file'), async function (req, res, next) {
    let workBook = new excelJs.Workbook();
    let pathFile = path.join(__dirname, '../uploads', req.file.filename)
    await workBook.xlsx.readFile(pathFile)
    let worksheet = workBook.worksheets[0];
    let result = [];
    let batchsize = 50;
    let maxcommit = Math.ceil(worksheet.rowCount / batchsize);
    for (let commitTime = 0; commitTime < maxcommit; commitTime++) {
        let validRows = []
        let start = batchsize * commitTime + 1
        let end = Math.min(start + batchsize, worksheet.rowCount)
        let session = await mongoose.startSession();
        session.startTransaction()
        try {
            for (let index = start; index <= end; index++) {
                let rowError = [];
                const row = worksheet.getRow(index)
                let teacherCode = row.getCell(1).value;
                let fullName = row.getCell(2).value;
                let email = row.getCell(3).value;
                let phone = row.getCell(4).value;
                let department = row.getCell(5).value;
                if (!teacherCode) {
                    rowError.push("teacherCode khong duoc de trong")
                }
                if (!fullName) {
                    rowError.push("fullName khong duoc de trong")
                }
                if (rowError.length > 0) {
                    result.push({
                        success: false,
                        data: rowError
                    })
                    continue;
                } else {
                    validRows.push({
                        teacherCode: teacherCode,
                        fullName: fullName,
                        email: email || "",
                        phone: phone || "",
                        department: department || ""
                    })
                }
            }
            let inserted = [];
            for (const row of validRows) {
                let newUser = new userModel({
                    username: row.teacherCode,
                    password: 'Default@123',
                    email: row.email || row.teacherCode + '@qlsv.com',
                    fullName: row.fullName,
                    role: 'TEACHER'
                })
                await newUser.save({ session })
                let newTeacher = new teacherModel({
                    user: newUser._id,
                    fullName: row.fullName,
                    email: row.email || "",
                    phone: row.phone || "",
                    department: row.department || undefined
                })
                await newTeacher.save({ session })
                inserted.push(newTeacher)
            }
            if (inserted.length > 0) {
                result.push({
                    success: true,
                    data: inserted
                })
            }
            await session.commitTransaction();
            await session.endSession()
        } catch (error) {
            await session.abortTransaction();
            await session.endSession()
            result.push({
                success: false,
                data: error.message
            })
        }
    }
    res.send(result)
})
router.post('/excel/grades', uploadExcel.single('file'), async function (req, res, next) {
    let enrollmentModel = require('../schemas/enrollments')
    let gradeModel = require('../schemas/grades')
    let notificationModel = require('../schemas/notifications')
    let workBook = new excelJs.Workbook();
    let pathFile = path.join(__dirname, '../uploads', req.file.filename)
    await workBook.xlsx.readFile(pathFile)
    let worksheet = workBook.worksheets[0];
    let courseClassId = req.body.courseClassId;
    if (!courseClassId) {
        res.status(400).send({ message: "courseClassId la bat buoc" })
        return;
    }
    let enrollments = await enrollmentModel.find({
        courseClass: courseClassId,
        isDeleted: false
    }).populate('student')
    let result = [];
    for (let index = 1; index <= worksheet.rowCount; index++) {
        const row = worksheet.getRow(index)
        let studentCode = row.getCell(1).value;
        let attendanceScore = row.getCell(2).value;
        let midtermScore = row.getCell(3).value;
        let finalScore = row.getCell(4).value;
        if (!studentCode) continue;
        studentCode = String(studentCode).trim()
        let enrollment = null
        for (let i = 0; i < enrollments.length; i++) {
            if (enrollments[i].student && enrollments[i].student.studentCode === studentCode) {
                enrollment = enrollments[i]
                break
            }
        }
        if (!enrollment) {
            result.push({ success: false, studentCode: studentCode, message: "khong tim thay sinh vien trong lop" })
            continue
        }
        try {
            let grade = await gradeModel.findOne({ enrollment: enrollment._id, isDeleted: false })
            if (!grade) {
                result.push({ success: false, studentCode: studentCode, message: "khong tim thay grade" })
                continue
            }
            if (attendanceScore !== undefined && attendanceScore !== null && attendanceScore !== '') grade.attendanceScore = parseFloat(attendanceScore)
            if (midtermScore !== undefined && midtermScore !== null && midtermScore !== '') grade.midtermScore = parseFloat(midtermScore)
            if (finalScore !== undefined && finalScore !== null && finalScore !== '') grade.finalScore = parseFloat(finalScore)
            if (grade.attendanceScore !== undefined && grade.midtermScore !== undefined && grade.finalScore !== undefined) {
                grade.averageScore = Math.round((grade.attendanceScore * 0.1 + grade.midtermScore * 0.3 + grade.finalScore * 0.6) * 100) / 100
            }
            await grade.save()
            result.push({ success: true, studentCode: studentCode, grade: grade })
        } catch (error) {
            result.push({ success: false, studentCode: studentCode, message: error.message })
        }
    }
    res.send(result)
})
module.exports = router;