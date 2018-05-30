const express = require('express');
const menuitemsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menuitemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
  db.get('SELECT * FROM MenuItem WHERE MenuItem.id = $menuItemId', {
    $menuItemId: menuItemId
  }, (err, menuItem) => {
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
  db.all('SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId', {
    $menuId: req.params.menuId
  }, (err, menuItems) => {
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
  const menuItemToCreate = req.body.menuItem;
  db.get('SELECT * FROM Menu WHERE Menu.id = $menuId', {
    $menuId: req.params.menuId
  }, (err, menu) => {
    if (err) {
      next(err);
    } else {
      if (!menu) {
        return res.sendStatus(400);
      }

      db.run('INSERT INTO MenuItem (name, description, inventory, price, menu_id) ' +
      'VALUES ($name, $description, $inventory, $price, $menuId)', {
        $name: menuItemToCreate.name,
        $description: menuItemToCreate.description,
        $inventory: menuItemToCreate.inventory,
        $price: menuItemToCreate.price,
        $menuId: req.params.menuId
      }, function(err) {
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
  const menuItemToUpdate = req.body.menuItem;
  db.get('SELECT * FROM Menu WHERE Menu.id = $menuId', {
    $menuId: req.params.menuItemId
  }, (err, menu) => {
    if (err) {
      next(err);
    } else {
      if (!menu) {
        res.sendStatus(400);
      }

      db.run('UPDATE MenuItem SET name = $name, description = $description, ' +
      'inventory = $inventory, price = $price, menu_id = $menuItemId ' +
      'WHERE MenuItem.id = $menuItemId', {
        $name: menuItemToUpdate.name,
        $description: menuItemToUpdate.description,
        $inventory: menuItemToUpdate.inventory,
        $price: menuItemToUpdate.price,
        $menuItemId: req.params.menuItemId
      }, function(err) {
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
  db.run('DELETE FROM MenuItem WHERE MenuItem.id = $menuItemId', {
    $menuItemId: req.params.menuItemId
  }, (err) => {
    if (err) {
      next(err);
    } else {
      res.sendStatus(204);
    }
  });
});

module.exports = menuitemsRouter;
