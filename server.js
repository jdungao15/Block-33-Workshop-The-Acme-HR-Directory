const express = require('express');
const app = express();
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL) || 'postgress://localhost/acme_hr_db';
const PORT =  process.env.PORT || 3000;


app.use(express.json());
app.use(require('morgan')('dev'));


app.get('/api/employees', async (req,res, next) => {
    const SQL = `
        SELECT * FROM employees;
    
    `
   try {
        const response = await client.query(SQL);
        res.send(response.rows)
   } catch (error) {
     next(error)
    
   }
})

app.get('/api/departments', async (req,res,next) => {
    const SQL = `
        SELECT * FROM department;
    
    `
   try {
        const response = await client.query(SQL);
        res.send(response.rows)
   } catch (error) {
     next(error)
    
   }
})


app.post('/api/employees', async(req,res,next) => {
    const {name, department_id} = req.body;
    const SQL = `
        INSERT INTO employees(name, department_id) VALUES($1,$2)
        RETURNING *
    `
    try {
        const response = await client.query(SQL,[name, department_id])
        res.send(response.rows)
    } catch (error) {
       next(error) 
    }
})

app.delete('/api/employees/:id', async (req, res,next) => {
    const SQL = `
        DELETE from employees
        WHERE id = $1
    
    `
    try {
        const response = await client.query(SQL, [req.params.id]);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

app.put('/api/employees/:id', async (req,res,next) => {
    const {name, department_id} = req.body;
    const {id} = req.params;
    console.log(name,department_id,id)
    const SQL = `
        UPDATE employees
        SET name=$1, department_id=$2, updated_at = now()
        WHERE id=$3 RETURNING *
    `;
    try {
        const response = await client.query(SQL,[name,department_id,id])
        res.send(response.rows);
    } catch (error) {
        next(error);
    }
})

const init = async () => {

    // Connect to DB
    
    await client.connect();
    let SQL = `
        DROP TABLE IF EXISTS employees;
        DROP TABLE IF EXISTS department;

        CREATE TABLE department(
            id SERIAL PRIMARY KEY,
            name VARCHAR(100)
        );

        CREATE TABLE employees(
            id SERIAL PRIMARY KEY,
            name VARCHAR(100),
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now(),
            department_id INTEGER REFERENCES categories(id) NOT NULL
        );
    `;
    await client.query(SQL);
    console.log('connected to database');

    SQL = `
        INSERT INTO department(name) VALUES('HR');
        INSERT INTO department(name) VALUES('Project Manager');

        INSERT INTO employees(name, department_id) VALUES('JOHN DUNGAO',(SELECT id from department WHERE name='HR'));
    
    
    `;

    // Seed data
    await client.query(SQL);
    console.log('data seeded');


    // Sever listen
    app.listen(PORT, ()=> {
        console.log(`Server is running on PORT ${PORT}`)
    })

}

init();