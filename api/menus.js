const express = require('express');
const menusRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const menuitemsRouter = require('./menu-items.js');

menusRouter.param('menuId', (req, res, next, menuId) => {
  const sql = 'SELECT * FROM Menu WHERE Menu.id = $menuId';
  const value = { $menuId: menuId };
  db.get(sql, value, (err, menu) => {
    if (err) {
      next(err);
    } else if (menu) {
      req.menu = menu;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

menusRouter.use('/:menuId/menu-items', menuitemsRouter);

menusRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM Menu';
  db.all(sql, (err, menus) => {
    if (err) {
      next(err);
    }
      res.status(200).json({menus: menus});
  });
});

menusRouter.get('/:menuId', (req, res, next) => {
  res.status(200).json({menu: req.menu});
});

const validateMenu = (req, res, next) => {
  const menuToValidate = req.body.menu;
  if (!menuToValidate.title) {
    return res.sendStatus(400);
  }
  next();
};

menusRouter.post('/', validateMenu, (req, res, next) => {
  const sql = 'INSERT INTO Menu (title) VALUES ($title)';
  const value = { $title: req.body.menu.title };
  db.run(sql, value, function(err) {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`,
      (err, menu) => {
        res.status(201).json({menu: menu});
      });
    }
  });
});

menusRouter.put('/:menuId', validateMenu, (req, res, next) => {
  const sql = 'UPDATE Menu SET title = $title WHERE Menu.id = $menuId';
  const values = {
    $title: req.body.menu.title,
    $menuId: req.params.menuId
  };
  db.run(sql, values, (err) => {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${req.params.menuId}`,
      (err, menu) => {
        res.status(200).json({menu: menu});
      });
    }
  });
});

menusRouter.delete('/:menuId', (req, res, next) => {
  const sql = 'SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId';
  const value = { $menuId: req.params.menuId };
  db.get(sql, value, (err, menuItem) => {
    if (err) {
      next(err);
    } else if (menuItem) {
      res.sendStatus(400);
    } else {
      db.run('DELETE FROM Menu WHERE Menu.id = $menuId', {
        $menuId: req.params.menuId
      }, (err) => {
        if (err) {
          next(err);
        } else {
          res.sendStatus(204);
        }
      });
    }
  });
});

module.exports = menusRouter;
