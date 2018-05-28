const express = require('express');
const employeesRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const timesheetsRouter = require('./timesheets.js');

employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  db.get('SELECT * FROM Employee WHERE Employee.id = $employeeId', {
    $employeeId: employeeId
  }, (err, employee) => {
    if (err) {
      next(err);
    } else if (employee) {
      req.employee = employee;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

employeesRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Employee WHERE Employee.is_current_employee = 1',
  (err, employees) => {
    if (err) {
      next(err);
    }
    res.status(200).json({employees: employees});
  });
});

employeesRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).json({employee: req.employee});
});

const validateEmployees = (req, res, next) => {
  const employeeToValidate = req.body.employee;
  if (!employeeToValidate.name || !employeeToValidate.position || !employeeToValidate.wage) {
    return res.sendStatus(400);
  }
  next();
};

employeesRouter.post('/', validateEmployees, (req, res, next) => {
  const employeeToCreate = req.body.employee;
  db.run('INSERT INTO Employee (name, position, wage) ' +
  'VALUES ($name, $position, $wage)', {
    $name: employeeToCreate.name,
    $position: employeeToCreate.position,
    $wage: employeeToCreate.wage
  }, function(err) {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`,
      (err, employee) => {
        res.status(201).json({employee: employee});
      });
    }
  });
});

employeesRouter.put('/:employeeId', validateEmployees, (req, res, next) => {
  const employeeToCreate = req.body.employee;
  db.run('UPDATE Employee SET name = $name, position = $position, wage = $wage ' +
  'WHERE Employee.id = $employeeId', {
    $name: employeeToCreate.name,
    $position: employeeToCreate.position,
    $wage: employeeToCreate.wage,
    $employeeId: req.params.employeeId
  }, (err) => {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`,
      (err, employee) => {
        res.status(200).json({employee: employee});
      });
    }
  });
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
  db.run('UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = $employeeId', {
    $employeeId: req.params.employeeId
  }, (err) => {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`,
      (err, employee) => {
        res.status(200).json({employee: employee});
      });
    }
  });
});

module.exports = employeesRouter;
