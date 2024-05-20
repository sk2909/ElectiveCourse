import express from "express"

const app = express()
const port = 3000

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

app.set('view engine', 'ejs');
//static file path
app.use(express.static("public"))

app.get('/', async (req, res) => {
    res.render("login");
})

app.post('login', async(req, res)=>{
    res.redirect('branchSelection')
})

app.get('/branchSelection', async(req, res)=>{
    res.render('branchSelection')
})

app.get('/subjectSelection', async(req, res)=>{
    res.render('subjectSelection')
})

app.get('/subDisplay', async(req, res)=>{
    res.render('subDisplay')
})


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})