const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
const sql = 'SELECT * FROM Timesheet WHERE Timesheet.id = $timesheetId';
const value = { $timesheetId: timesheetId };
  db.get(sql, value, (err, timesheet) => {
    if (err) {
      next(err);
    } else if (timesheet) {
      req.timesheet = timesheet;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

timesheetsRouter.get('/', (req, res, next) => {
const sql = 'SELECT * FROM Timesheet WHERE Timesheet.employee_id = $employeeId';
const value = {$employeeId: req.params.employeeId };
  db.all(sql, value, (err, timesheets) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({timesheets: timesheets});
    }
  });
});

const validateTimesheets = (req, res, next) => {
  const timesheetToValidate = req.body.timesheet;
  if (!timesheetToValidate.hours || !timesheetToValidate.rate || !timesheetToValidate.date) {
    return res.sendStatus(400);
  }
  next();
};

timesheetsRouter.post('/', validateTimesheets, (req, res, next) => {
  const employeeSql = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
  const menuValue = { $employeeId: req.params.employeeId };
  db.get(employeeSql, menuValue, (err, employee) => {
    if (err) {
      next(err);
    } else {
      if (!employee) {
        return res.sendStatus(400);
      }

      const value = {
        $hours: req.body.timesheet.hours,
        $rate: req.body.timesheet.rate,
        $date: req.body.timesheet.date,
        $employeeId: req.params.employeeId
      };
      const sql = 'INSERT INTO Timesheet (hours, rate, date, employee_id) ' +
      'VALUES ($hours, $rate, $date, $employeeId)';

      db.run(sql, value, function(err) {
        if (err) {
          next(err);
        } else {
          db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`,
          (err, timesheet) => {
            res.status(201).json({timesheet: timesheet});
          });
        }
      });
    }
  });
});

timesheetsRouter.put('/:timesheetId', validateTimesheets, (req, res, next) => {
  const employeeSql = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
  const employeeValue = { $employeeId: req.params.employeeId };
  db.get(employeeSql, employeeValue, (err, employee) => {
    if (err) {
      next(err);
    } else {
      if (!employee) {
        res.sendStatus(400);
      }

      const sql = 'UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employeeId ' +
      'WHERE Timesheet.id = $timesheetId';
      const value = {
        $hours: req.body.timesheet.hours,
        $rate: req.body.timesheet.rate,
        $date: req.body.timesheet.date,
        $employeeId: req.params.employeeId,
        $timesheetId: req.params.timesheetId
      };

      db.run(sql, value, function (err) {
        if (err) {
          next(err);
        } else {
          db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${req.params.timesheetId}`,
          (err, timesheet) => {
            res.status(200).json({timesheet: timesheet});
          });
        }
      });
    }
  });
});

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
  const sql = 'DELETE FROM Timesheet WHERE Timesheet.id = $timesheetId';
  const value = { $timesheetId: req.params.timesheetId };
  db.run(sql, value, (err) => {
    if (err) {
      next(err);
    } else {
      res.sendStatus(204);
    }
  });
});

module.exports = timesheetsRouter;
