const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const format = require('date-fns/format')
const isMatch = require('date-fns/isMatch')
const isValid = require('date-fns/isValid')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const hasStatus = query => {
  return query.status !== undefined
}

const hasPriority = query => {
  return query.priority !== undefined
}

const hasPriorityAndStatus = query => {
  return query.priority !== undefined && query.status !== undefined
}

const hasSearch = query => {
  return query.search_q !== undefined
}

const hasCategoryAndstatus = query => {
  return query.category !== undefined && query.status !== undefined
}

const hasCategory = query => {
  return query.category !== undefined
}

const hasCategoryAndPriority = query => {
  return query.category !== undefined && query.priority !== undefined
}

const convertTodoObject = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  }
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''

  const {status, priority, search_q = '', category} = request.query

  switch (true) {
    case hasStatus(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodosQuery = `SELECT * FROM todo WHERE status='${status}';`
        data = await db.all(getTodosQuery)
        response.send(data.map(eachItem => convertTodoObject(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case hasPriority(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getTodosQuery = `SELECT * FROM todo WHERE priority='${priority}';`
        data = await db.all(getTodosQuery)
        response.send(data.map(eachItem => convertTodoObject(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasPriorityAndStatus(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE priority='${priority}' AND status='${status}';`
          data = await db.all(getTodosQuery)
          response.send(data.map(eachItem => convertTodoObject(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasSearch(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo like '%${search_q}%';`
      data = await db.all(getTodosQuery)
      response.send(data.map(eachItem => convertTodoObject(eachItem)))
      break
    case hasCategoryAndstatus(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE category='${category}' AND status='${status}';`
          data = await db.all(getTodosQuery)
          response.send(data.map(eachItem => convertTodoObject(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasCategory(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getTodosQuery = `SELECT * FROM todo WHERE category='${category}';`
        data = await db.all(getTodosQuery)
        response.send(data.map(eachItem => convertTodoObject(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasCategoryAndPriority(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          priority === 'HIGH' ||
          priority === 'MEDIUM' ||
          priority === 'LOW'
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE category='${category}' AND priority='${priority}';`
          data = await db.all(getTodosQuery)
          response.send(data.map(eachItem => convertTodoObject(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    default:
      getTodosQuery = `SELECT * FROM todo;`
      data = await db.all(getTodosQuery)
      response.send(data.map(eachItem => convertTodoObject(eachItem)))
  }
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`
  const getResult = await db.get(getTodoQuery)
  response.send(convertTodoObject(getResult))
})

app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  if (isMatch(date, 'yyyy-MM-dd')) {
    const dateFormat = format(new Date(date), 'yyyy-MM-dd')
    const getAgendaQuery = `SELECT * from todo WHERE due_date='${dateFormat}';`
    const getAgenda = await db.all(getAgendaQuery)
    response.send(getAgenda.map(eachItem => convertTodoObject(eachItem)))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const postDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
          const postTodosQuery = `
            INSERT INTO
              todo (id, todo, priority, status, category, due_date)
            VALUES
              (${id}, '${todo}', '${priority}', '${status}', '${category}', '${postDueDate}');`
          await db.run(postTodosQuery)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const todoQuery = `SELECT * FROM todo WHERE id=${todoId};`
  const requestedBody = request.body
  const todoObject = await db.get(todoQuery)
  const {
    status = todoObject.status,
    priority = todoObject.priority,
    todo = todoObject.todo,
    category = todoObject.category,
    dueDate = todoObject.due_date,
  } = request.body
  let putTodosQuery
  switch (true) {
    case requestedBody.status !== undefined:
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        putTodosQuery = `
          UPDATE todo SET 
            status='${status}', priority='${priority}', todo='${todo}', category='${category}', due_date='${dueDate}'
          WHERE id=${todoId};`
        await db.run(putTodosQuery)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case requestedBody.priority !== undefined:
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        putTodosQuery = `
          UPDATE todo SET
            status='${status}', priority='${priority}', todo='${todo}', category='${category}', due_date='${dueDate}' 
          WHERE id=${todoId};`
        await db.run(putTodosQuery)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case requestedBody.todo !== undefined:
      putTodosQuery = `
        UPDATE todo SET
          status='${status}', priority='${priority}', todo='${todo}', category='${category}', due_date='${dueDate}' 
        WHERE id=${todoId};`
      await db.run(putTodosQuery)
      response.send('Todo Updated')
      break
    case requestedBody.category !== undefined:
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        putTodosQuery = `
        UPDATE todo SET
          status='${status}', priority='${priority}', todo='${todo}', category='${category}', due_date='${dueDate}' 
        WHERE id=${todoId};`
        await db.run(putTodosQuery)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case requestedBody.dueDate !== undefined:
      if (isMatch(dueDate, 'yyyy-MM-dd')) {
        const postDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
        putTodosQuery = `
          UPDATE todo SET
          status='${status}', priority='${priority}', todo='${todo}', category='${category}', due_date='${postDueDate}' 
        WHERE id=${todoId};`
        await db.run(putTodosQuery)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
  }
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodosQuery = `
    DELETE
    FROM
    todo
    WHERE
    id=${todoId};`
  await db.run(deleteTodosQuery)
  response.send('Todo Deleted')
})

module.exports = app
