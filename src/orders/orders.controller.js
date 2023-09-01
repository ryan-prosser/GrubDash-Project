const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res) {
  res.json({data: orders})
}

function dataIncludes(propertyName) {
  return function(req, res, next) {
    const {data = {}} = req.body
    if (data[propertyName]) {
      return next()
    } else {
      next({status: 400, message: `Order needs a ${propertyName}`})
    }
  }
}

function dishVerification(req, res, next) {
  const {data: {dishes}} = req.body
  const {quantity} = dishes
  if (dishes.length > 0 && Array.isArray(dishes)) {
    return next()
  } else {
    next({status: 400, message: 'Something is wrong with the dishes'})
  }
}
function quantityIsMissing(req, res, next) {
  const {data: {dishes} = {}} = req.body
  dishes.forEach((dish, index) => {
    if (dish.quantity > 0) {
      console.log("x")
    } else {
      next({status: 400, message: `Dish ${index} must have a quantity that is an integer greater than 0`})
    }
  })
next()
}

function quantityIsAnInteger(req, res, next) {
  const {data: {dishes} = {}} = req.body
  dishes.forEach((dish, index) => {
    if (Number.isInteger(dish.quantity)) {
      console.log("x")
    } else {
      next({status: 400, message: `Dish ${index} must have a quantity that is an integer greater than 0`})
    }
  })
next()
} 

function create(req, res) {
  const {data: {deliverTo, mobileNumber, dishes} = {}} = req.body
  const newId = nextId();
  const newOrder = {
    id: newId,
    deliverTo,
    mobileNumber,
    dishes
  }
  orders.push(newOrder)
  res.status(201).json({data: newOrder})
}

function orderExists(req, res, next) {
  const {orderId} = req.params
  const foundOrder = orders.find((order) => order.id == orderId)
  if (foundOrder) {
    res.locals.order = foundOrder
    return next()
  } else {
    next({status: 404, message: `Order id not found: ${orderId}`})
  }
}

function read(req, res) {
  const foundOrder = res.locals.order
  res.json({data: foundOrder})
}

  function statusIsValid(req, res, next) {
    const { data: { status } = {} } = req.body;
    const validStatus = ['pending', 'preparing', 'out-for-delivery', 'delivered'];
    if (validStatus.includes(status)) {
      return next();
    }
    next({status: 400, message: `Order must have a status of pending, preparing, out-for-delivery, delivered`});
  }

function orderDelivered(req, res, next) {
  const {data: {status} = {}} = req.body
  if (status == 'delivered') {
    next({status: 400, message: 'A delivered order cannot be changed'})
  } else {
    next()
  }
}

function update(req, res, next) {
  const foundOrder = res.locals.order
  const {orderId} = req.params
  const {data: {id, deliverTo, mobileNumber, status, dishes} = {}} = req.body
  foundOrder.deliverTo = deliverTo
  foundOrder.mobileNumber = mobileNumber
  foundOrder.status = status
  foundOrder.dishes = dishes
  
  if (!id || id == orderId) {
    res.json({data: foundOrder})
  } else {
    next({status: 400, message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`})
  }
}

function pendingStatus(req, res, next) {
  const {status} = res.locals.order
  if (status === "pending") {
    next()
  } else {
    next({status: 400, message:'An order cannot be deleted unless it is pending.'})
  }
}

function destroy(req, res) {
  const {orderId} = req.params
  const index = orders.findIndex((order) => order.id == orderId)
  const deletedOrders = orders.splice(index, 1)
  res.sendStatus(204)
}


module.exports = {
  list,
  create: [dataIncludes('deliverTo'),
           dataIncludes('mobileNumber'),
           dataIncludes('dishes'),
           dishVerification,
           quantityIsMissing,
           quantityIsAnInteger,
           create],
  read: [orderExists, read],
  update: [orderExists,
           dataIncludes('deliverTo'),
           dataIncludes('mobileNumber'),
           dataIncludes('dishes'),
           dataIncludes('status'),
           statusIsValid,
           orderDelivered,
           dishVerification,
           quantityIsMissing,
           quantityIsAnInteger,
           update],
  destroy: [orderExists,
            pendingStatus,
            destroy]
}