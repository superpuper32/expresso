const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
  db.get('SELECT * FROM Timesheet WHERE Timesheet.id = $timesheetId', {
    $timesheetId: timesheetId
  }, (err, timesheet) => {
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
  db.all('SELECT * FROM Timesheet WHERE Timesheet.employee_id = $employeeId', {
    $employeeId: req.params.employeeId
  }, (err, timesheets) => {
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
  const timesheetToCreate = req.body.timesheet;
  db.get('SELECT * FROM Employee WHERE Employee.id = $employeeId', {
    $employeeId: req.params.employeeId
  }, (err, employee) => {
    if (err) {
      next(err);
    } else {
      if (!employee) {
        return res.sendStatus(400);
      }

      db.run('INSERT INTO Timesheet (hours, rate, date, employee_id) ' +
      'VALUES ($hours, $rate, $date, $employeeId)', {
        $hours: timesheetToCreate.hours,
        $rate: timesheetToCreate.rate,
        $date: timesheetToCreate.date,
        $employeeId: req.params.employeeId
      }, function(err) {
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
  const timesheetToUpdate = req.body.timesheet;
  db.get('SELECT * FROM Employee WHERE Employee.id = $employeeId', {
    $employeeId: req.params.employeeId
  }, (err, employee) => {
    if (err) {
      next(err);
    } else {
      if (!employee) {
        res.sendStatus(400);
      }

      db.run('UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employeeId ' +
      'WHERE Timesheet.id = $timesheetId', {
        $hours: timesheetToUpdate.hours,
        $rate: timesheetToUpdate.rate,
        $date: timesheetToUpdate.date,
        $employeeId: req.params.employeeId,
        $timesheetId: req.params.timesheetId
      }, function (err) {
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
  db.run('DELETE FROM Timesheet WHERE Timesheet.id = $timesheetId', {
    $timesheetId: req.params.timesheetId
  }, (err) => {
    if (err) {
      next(err);
    } else {
      res.sendStatus(204);
    }
  });
});

module.exports = timesheetsRouter;
