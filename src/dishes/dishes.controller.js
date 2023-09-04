const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res) {
  res.json({data: dishes})
}

function dataIncludes(propertyName) {
  return function(req, res, next) {
    const {data = {}} = req.body
    if (data[propertyName]) {
      return next()
    } else {
      next({status: 400, message: `Must include a ${propertyName}`})
    }
  }
}

function priceIsANumber(req, res, next) {
  const {data: {price} = {} } = req.body
  if (Number.isInteger(price) && price > 0) {
    return next()
  } else {
    next({status: 400, message: 'Dish must have a price that is an integer greater than 0'})
  }
}

function create(req, res) {
  const {data : {name, description, price, image_url} = {} } = req.body
  const newId = nextId();
  const newDish = {
    id: newId,
    name,
    description,
    price,
    image_url
  }
  dishes.push(newDish);
  res.status(201).json({data: newDish})
}

function dishExists(req, res, next) {
  const {dishId} = req.params
  const foundDish = dishes.find((dish) => dish.id == dishId)
  if (foundDish) {
    res.locals.dish = foundDish
    return next()
  } else {
    next({status: 404, message: `Dish id not found: ${dishId}`})
  }
}

function read(req, res) {
  res.json({data: res.locals.dish})
}

function correctId(req, res, next) {
  const foundDish = res.locals.dish
  const {dishId} = req.params
  if (foundDish.id == dishId) {
    return next()
  } else {
    next({status: 400, message: `Dish id does not match: ${foundDish.id}`})
  }
}

function update(req, res, next) {
  const foundDish = res.locals.dish
  const {dishId} = req.params
  const {data: {name, description, price, image_url} = {} } = req.body
  foundDish.name = name
  foundDish.description = description
  foundDish.price = price
  foundDish.image_url = image_url
  
  if (!foundDish.id || foundDish.id == dishId) {
    res.json({data: foundDish})
  } else {
    next({status: 400, message: `Dish id's do not match: ${foundDish.id}`})
  }
  
}

function nonExistent(req, res, next) {
  const {dishId} = req.params
  const foundDish = dishes.find((dish) => dish.id == dishId)
  if (foundDish) {
    return next({status:405, message: 'Dishes cannot be deleted'})
  } else {
    next({status: 405, message: `Dish id not found: ${dishId}`})
  }
}
function destroy(req, res) {
  const {dishId} = req.params
  const index = dishes.findIndex((dish) => dish.id == dishId)
  const deletedDishes = dishes.splice(index, 1)
  res.sendStatus(405)
}

module.exports = {
  list,
  create: [dataIncludes('name'),
           dataIncludes('description'),
           dataIncludes('price'),
           dataIncludes('image_url'),
           priceIsANumber,
           create],
  read: [dishExists, read],
  update: [dishExists,
           dataIncludes('name'),
           dataIncludes('description'),
           dataIncludes('price'),
           dataIncludes('image_url'),
           priceIsANumber,
           update],
  destroy: [nonExistent, destroy]
}