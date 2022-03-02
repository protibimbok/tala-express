import express from "express";
import { dirname } from "path";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
//import { database, setTala, genToken, ensureUser, getOfUser, getOfToken, revokeToken } from "./mysql.js";
import { database, User, setTala, genToken, ensureUser, getOfUser, getOfToken, revokeToken } from "./mongo.js";

const _root = dirname(import.meta.url).substring(8);
const app = express();

app.use(bodyParser.urlencoded({
   extended: true
}));
app.use(cookieParser());

app.set('view engine', 'ejs');
app.set('trust proxy', true);
app.set('views', _root + '/views');


const cookie = 'tala';
setTala(database, {
  promise: true,
  cookie,//{name: 'tala', signed: false},
  //userModel: User,
  userModel: 'users',
  populate: 'name'
})

app.use('/assets', express.static(_root + "/assets"))
app.use('/', ensureUser((req, res) => {
  res.render("index", {
    userId: req.userId,
    msg: JSON.stringify(req._parsedUrl)
  })
}, ['/']));

app.get('/', async (req, res) => {
  const data = {
    userId: req.userId,
    msg: ''
  };
  if(req.userId){
    data.token = req.accessToken;
    data.users = await getOfToken(req.accessToken, 1);
    data.tokens = await getOfUser(req.userId, 1);
  }
  res.render("index", data);
})

app.get('/revoke', async (req, res)=>{
  if(!req.userId || typeof req.query.token !== 'string'){
    res.redirect('/');
  }
  try {
    await revokeToken(req.userId, req.query.token);
    res.redirect('/');
  } catch (error) {
    res.send(error.message);
  }
})

app.post('/', async (req, res) => {
  const { username, password } = req.body;
  if(username !== 'admin' || password !== 'admin'){
    res.render("index", {
      userId: null,
      msg: "Invalid username or password!"
    })
  }else{
    const uid = '621e5a450dd05c1262fffa79';
    //const uid = 1;
    let token = await genToken(req, uid);
    res.cookie(cookie, token, {
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
    }).redirect('/');
  }
  
})


app.get('/ensureUser', (req, res)=>{
  res.send(JSON.stringify(req.user));
});

app.listen(3000, ()=>{
  console.clear();
  console.log('Running on http://localhost:3000/');
})