import mysql from "mysql2"

const pool = mysql.createPool({
    host: 'sql12.freesqldatabase.com',
    user: 'sql12707946',
    password: 'pNL8YVacQh',
    database: 'sql12707946',
    timezone: 'Z'
}).promise()


const result = await pool.query("select * from student`")
console.log(result)
result[0].map(student => {
    console.log(student.usn)
    console.log(student.dob.toISOString().split('T')[0])
})
