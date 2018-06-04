const express = require('express');
const menuitemsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menuitemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
  const sql = 'SELECT * FROM MenuItem WHERE MenuItem.id = $menuItemId';
  const value = { $menuItemId: menuItemId };
  db.get(sql, value, (err, menuItem) => {
    if (err) {
      next(err);
    } else if (menuItem) {
      req.menuItem = menuItem;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

menuitemsRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId';
  const value = { $menuId: req.params.menuId };
  db.all(sql, value, (err, menuItems) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({menuItems: menuItems});
    }
  });
});

const validateMenuItems = (req, res, next) => {
  const menuItemToValidate = req.body.menuItem;
  if (!menuItemToValidate.name || !menuItemToValidate.description
    || !menuItemToValidate.inventory || !menuItemToValidate.price) {
      return res.sendStatus(400);
    }
    next();
};

menuitemsRouter.post('/', validateMenuItems, (req, res, next) => {
  const menuSql = 'SELECT * FROM Menu WHERE Menu.id = $menuId';
  const menuValue = { $menuId: req.params.menuId };
  db.get(menuSql, menuValue, (err, menu) => {
    if (err) {
      next(err);
    } else {
      if (!menu) {
        return res.sendStatus(400);
      }

      const sql = 'INSERT INTO MenuItem (name, description, inventory, price, menu_id) ' +
      'VALUES ($name, $description, $inventory, $price, $menuId)';
      const value = {
        $name: req.body.menuItem.name,
        $description: req.body.menuItem.description,
        $inventory: req.body.menuItem.inventory,
        $price: req.body.menuItem.price,
        $menuId: req.params.menuId
      };

      db.run(sql, value, function(err) {
        if (err) {
          next(err);
        } else {
          db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${this.lastID}`,
          (err, menuItem) => {
            res.status(201).json({menuItem: menuItem});
          });
        }
      });
    }
  });
});

menuitemsRouter.put('/:menuItemId', validateMenuItems, (req, res, next) => {
  const menuSql = 'SELECT * FROM Menu WHERE Menu.id = $menuId';
  const menuValue = { $menuId: req.params.menuItemId };
  db.get(menuSql, menuValue, (err, menu) => {
    if (err) {
      next(err);
    } else {
      if (!menu) {
        res.sendStatus(400);
      }

      const sql = 'UPDATE MenuItem SET name = $name, description = $description, ' +
      'inventory = $inventory, price = $price, menu_id = $menuItemId ' +
      'WHERE MenuItem.id = $menuItemId';
      const value = {
        $name: req.body.menuItem.name,
        $description: req.body.menuItem.description,
        $inventory: req.body.menuItem.inventory,
        $price: req.body.menuItem.price,
        $menuItemId: req.params.menuItemId
      };

      db.run(sql, value, function(err) {
        if (err) {
          next(err);
        } else {
          db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${req.params.menuItemId}`,
          (err, menuItem) => {
            res.status(200).json({menuItem: menuItem});
          });
        }
      });
    }
  });
});

menuitemsRouter.delete('/:menuItemId', (req, res, next) => {
  const sql = 'DELETE FROM MenuItem WHERE MenuItem.id = $menuItemId';
  const value = { $menuItemId: req.params.menuItemId };
  db.run(sql , value, (err) => {
    if (err) {
      next(err);
    } else {
      res.sendStatus(204);
    }
  });
});

module.exports = menuitemsRouter;
