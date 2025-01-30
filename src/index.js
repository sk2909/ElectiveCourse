import express from "express";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import mysql from "mysql2";
import Exceljs from "exceljs";
import dotenv from "dotenv";

dotenv.config();
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    timezone: 'Z'
}).promise();


const app = express();
const port = 3000;
const saltRounds = 10;

app.use(
    session({
        secret: "TOPSECRETWORD",
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 1000 * 60 * 60,
        }
    })
);
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');
//static file path
app.use(express.static("public"))

async function getSemRegisterList(sem) {
    let [details] = await pool.query(`select * from sem${sem};`);
    return details;
}

app.get('/', async (req, res) => {
    res.render('login');
})


app.post('/login', passport.authenticate("login-user", {
    successRedirect: '/branchSelection',
    failureRedirect: '/',
}));


app.post('/faculty', passport.authenticate("login-admin", {
    successRedirect: '/dashboard',
    failureRedirect: '/',
}));

app.get('/branchSelection', async (req, res) => {
    if (req.isAuthenticated()) {
        const { username } = req.user;
        const [details] = await pool.query(`SELECT * FROM details WHERE usn = ?`, [username]);
        if (details.length > 0) {
            let sem = "sem" + details[0].sem
            const [subDetails] = await pool.query(`SELECT * FROM ${sem} WHERE courseCode = ?`, [details[0].courseCode]);
            res.redirect('/subDisplay');
        } else {
            res.render('branchSelection');
        }
    } else {
        res.redirect('/');
    }
})

app.post('/branch', async (req, res) => {
    if (req.isAuthenticated()) {
        let dbBranch = req.user.username.substr(5, 2);
        let selectBranch = req.body.branch;
        let semester = req.body.sem;
        (async () => {
            try {
                let selSem = await getSemRegisterList(semester);
                if (dbBranch === selectBranch) {
                    res.render('subjectSelection', {
                        subjects: selSem,
                    })
                }
            } catch (err) {
                console.error("Error fetching course list:", err);
            }
        })();
    }
})

app.get('/subjectSelection', async (req, res) => {
    if (req.isAuthenticated()) {
        (async () => {
            try {
                let selSem = await getSemRegisterList(semester);
                res.render('subjectSelection', {
                    subjects: selSem,
                })
            } catch (err) {
                console.error("Error fetching course list:", err);
            }
        })();
    }
})

app.post('/courseRegister', async (req, res) => {
    if (req.isAuthenticated()) {
        let selSubCode = req.body.course;
        let subTitle = "";
        let usn = req.user.username;
        (async () => {
            try {

                for (let i = 1; i <= 7; i++) {
                    let [details] = await pool.query(`select registration from sem${i} where courseCode = ?;`, [selSubCode]);
                    if (details.length > 0) {
                        let curReg = ++details[0].registration;
                        await pool.query(`update sem${i} set registration = ? where courseCode = ?;`, [curReg, selSubCode]);
                        await pool.query(`insert into details values(?,?,?)`, [usn, selSubCode, i]);
                    }
                }
                for (let i = 1; i <= 7; i++) {
                    let [details] = await pool.query(`select courseTitle from sem${i} where courseCode = ?;`, [selSubCode]);
                    if (details.length > 0) {
                        subTitle = details[0].courseTitle;
                    }
                }
                res.render('subDisplay', {
                    subjectName: subTitle,
                    subjectCode: selSubCode
                })
            } catch (err) {
                console.error("Error fetching course list:", err);
            }
        })();
    }

})

app.get('/subDisplay', async (req, res) => {
    if (req.isAuthenticated()) {
        const { username } = req.user;
        const [details] = await pool.query(`SELECT * FROM details WHERE usn = ?`, [username]);
        if (details.length > 0) {
            let sem = "sem" + details[0].sem
            const [subDetails] = await pool.query(`SELECT * FROM ${sem} WHERE courseCode = ?`, [details[0].courseCode]);
            res.render('subDisplay', {
                subjectName: subDetails[0].courseTitle,
                subjectCode: subDetails[0].courseCode
            })
        }
    }
})




app.post('/dash', (req, res) => {
    const selectedSemester = req.body.selectedSemester;
    courses[0] = selectedSemester;
    let sem = courses[0].substring(0, 1);
    (async () => {
        try {
            courses[1] = await getSemRegisterList(sem);
        } catch (err) {
            console.error("Error fetching course list:", err);
        }
    })();
    res.redirect('dashboard')
});

app.get('/dashboard', async (req, res) => {
    if (req.isAuthenticated()) {
        const oddSem = ["1st Semester", "3rd Semester", "5th Semester", "7th Semester"];
        const evenSem = ["2nd Semester", "4th Semester", "6th Semester"]
        res.render('dashboardHome', {
            oddSem: oddSem,
            evenSem: evenSem,
            currentSem: courses[0],
            currentSemCourses: courses[1]
        })
    } else {
        res.redirect('/');
    }

})


let currentSem = "1st Semester";
let currentList = [];

async function getSemCourseList(sem) {
    let [details] = await pool.query(`select * from sem${sem};`);
    return details;
}

let courses = [currentSem, currentList]


app.post('/sem', (req, res) => {
    const selectedSemester = req.body.selectedSemester;
    courses[0] = selectedSemester;
    let sem = courses[0].substring(0, 1);
    (async () => {
        try {
            courses[1] = await getSemCourseList(sem);
        } catch (err) {
            console.error("Error fetching course list:", err);
        }
    })();
    res.redirect('creation')
});


app.get('/creation', async (req, res) => {
    if (req.isAuthenticated()) {
        const oddSem = ["1st Semester", "3rd Semester", "5th Semester", "7th Semester"];
        const evenSem = ["2nd Semester", "4th Semester", "6th Semester"]
        let sem = courses[0].substring(0, 1);
        (async () => {
            try {
                courses[1] = await getSemCourseList(sem);
                res.render('dashboardCreation', {
                    oddSem: oddSem,
                    evenSem: evenSem,
                    currentSem: courses[0],
                    currentSemCourses: courses[1]
                })
            } catch (err) {
                console.error("Error fetching course list:", err);
            }
        })();
    } else {
        res.redirect('/');
    }
})
app.post('/edit', async (req, res) => {
    let sem = courses[0].substring(0, 1)
    let title = req.body.courseTitle;
    let code = req.body.courseCode;
    let uppperCode = code.toUpperCase();
    let codePrev = req.body.courseCodePrev;
    let limit = req.body.courseLimit;
    await pool.query(`update sem${sem} set courseTitle = ?, courseCode = ?,  maxlimit = ? where courseCode = ?`, [title, uppperCode, limit, codePrev])
    res.redirect('creation')
})

app.post('/delete', (req, res) => {
    let courseCode = req.body.deleteCourse
    let sem = courses[0].substring(0, 1)
    pool.query(`delete from sem${sem} where courseCode = ?`, [courseCode])
    res.redirect('creation')
})

app.post('/deleteEntry', async (req, res) => {
    let semUser = req.body.deleteEntry;
    await pool.query(`delete from sem${semUser}`)
    res.redirect('creation')
})


app.post('/export', async (req, res) => {

    let sem = req.body.sem;
    let courseTitle = req.body.courseTitle;
    let courseCode = req.body.courseCode;

    try {
        const [result] = await pool.query(`select d.usn, s.name from details d, student s where d.courseCode = ? and d.usn = s.usn`, [courseCode])
        const jsonData = JSON.parse(JSON.stringify(result));

        const workbook = new Exceljs.Workbook();
        const worksheet = workbook.addWorksheet('Sheet1');
        worksheet.columns = [
            { header: "Sl No", key: 'slno', width: 5 },
            { header: 'USN', key: 'usn', width: 20 },
            { header: 'Name', key: 'name', width: 40 },
        ];
        jsonData.forEach((rowData, index) => {
            worksheet.addRow([(index + 1), rowData.usn, rowData.name])
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').setHeader("Content-Disposition", "attachment; filename=" + courseTitle + ".xlsx");

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.log(err)
    }

})

app.post('/merge', async (req, res) => {
    let srcCode = req.body.srcCode;
    let destCode = req.body.destCode;
    let sem = req.body.sem;

    const [srcCount] = await pool.query(`select registration from sem${sem} where courseCode = ?`, [srcCode]);
    const [destCount] = await pool.query(`select registration from sem${sem} where courseCode = ?`, [destCode]);
    if (srcCount[0] === undefined || destCount[0] === undefined) {
        res.redirect(302, 'dashboard');
    } else {
        await pool.query(`update sem${sem} set registration = ? where courseCode = ?`, [srcCount[0].registration + destCount[0].registration, destCode]);
        await pool.query(`update sem${sem} set registration = ? where courseCode = ?`, [0, srcCode])
        await pool.query(`update details set courseCode = ? where courseCode = ?`, [destCode, srcCode])
        res.redirect(302, 'dashboard');
    }
})

// Submission of Forms
for (let i = 1; i <= 7; i++) {
    app.post(`/${i}`, async (req, res) => {
        let upperCode = req.body.courseCode.toUpperCase();
        try {
            await pool.query(`insert into sem${i} values(?, ?, ?, ?)`, [
                req.body.courseTitle, upperCode, req.body.limit, 0
            ]
            );
            res.redirect('creation')

        } catch (err) {
            console.error("Error while inserting")
        }

    })
}

app.post('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

passport.use('login-admin',
    new Strategy(async function verify(username, password, cb) {
        try {
            let cred = await pool.query("select * from admin where username = ?", [username]);
            if (cred) {
                let passDb = cred[0][0].password.toISOString().split('T')[0];
                if (passDb === password) {
                    return cb(null, username);
                } else {
                    return cb(null, false);
                }
            } else {
                return cb("User not found");
            }
        } catch (err) {
            console.log(err);
        }
    })
);

passport.use('login-user',
    new Strategy(async function verify(username, password, cb) {
        try {
            const result = await pool.query("SELECT * FROM login WHERE username = ? ", [
                username,
            ]);
            if (result[0].length > 0) {
                const user = result[0][0];
                const storedHashedPassword = user.password;
                bcrypt.compare(password, storedHashedPassword, (err, valid) => {
                    if (err) {
                        //Error with password check
                        console.error("Error comparing passwords:", err);
                        return cb(err);
                    } else {
                        if (valid) {
                            //Passed password check
                            return cb(null, user);
                        } else {
                            //Did not pass password check
                            return cb(null, false);
                        }
                    }
                });

            } else {
                return cb("User not found");
            }
        } catch (err) {
            console.log(err);
        }
    })
);

passport.serializeUser((user, cb) => {
    cb(null, user);
});
passport.deserializeUser((user, cb) => {
    cb(null, user);
});

async function addUserDetails() {
    const result = await pool.query("select * from student")

    result[0].map(student => {
        let username = student.usn;
        let dob = student.dob.toISOString().split('T')[0];
        const sql = 'INSERT INTO login (username, password) VALUES (?, ?)';

        bcrypt.hash(dob, saltRounds, async (err, hash) => {
            if (err) {
                console.error("Error while hashing ", err);
            } else {
                await pool.query(sql, [username, hash], (err, res) => {
                    if (err) {
                        console.error("An error while inserting")
                    } else {
                        console.log("Value inserted sucessfully")
                    }
                })
            }
        })
    })
}


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})