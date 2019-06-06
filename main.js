const hbs = require('express-handlebars')
const express = require('express')
const mysql = require('mysql')
const bodyParser = require('body-parser');

const config = require('./config.json');
const empModule = require('./lib/employee');

const SQL_SELECT_EMPLOYEE = "select * from employees limit ? offset ?";
const SQL_SELECT_EMPLOYEE_BY_EMPNO = "select * from employees where emp_no = ?";

const empPool = mysql.createPool(config.employees)
//const playPool = mysql.createPool(config.playstore)

const PORT = parseInt(process.argv[2] || process.env.APP_PORT || 3000);

const app = express();

const sgEmp = empModule(empPool, "SG");
const usEmp = empModule(empPool, "US");

const db = { };

app.engine('hbs', hbs())
app.set('view engine', 'hbs')
app.set('views', __dirname + '/views');

app.use(bodyParser.urlencoded());

app.use('/sg', sgEmp);

app.use('/us', usEmp);

app.post('/cart', (req, resp) => {
    const name = req.body.name;
    const toAdd = req.body.toAdd;
    const cart = JSON.parse(req.body.cart);
    cart.push(toAdd);

    resp.status(200)
    resp.type('text/html')
    resp.render('cart', { 
        name: name,
        cart: JSON.stringify(cart),
        items: cart,
        layout: false
    })
});

app.get('/cart', (req, resp) => {
    const name = req.query.name;
    let cart = [];
    if (req.query.cart)
        cart = JSON.parse(req.query.cart);

    resp.status(200)
    resp.type('text/html')
    resp.render('cart', { 
        name: name,
        cart: JSON.stringify(cart),
        layout: false
    })
})

app.get('/healthz', (req, resp) => {
    resp.status(200).end();
})

app.get(/.*/, express.static(__dirname + '/public'));

empPool.getConnection((err, conn) => {
    if (err) {
        console.error('Error: ', err);
        process.exit(-1);
        return;
    }
    console.info('Pinging database...')
    conn.ping(err => {
        conn.release();
        if (err) {
            console.error('Cannot ping database: ', err);
            process.exit(-1);
            return;
        }
        app.listen(PORT, () => {
            console.info('Application started at %s on port %d',
                new Date(), PORT);
        });
    })
})
