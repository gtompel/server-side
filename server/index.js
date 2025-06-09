import express from "express"
import cors from "cors"
import { rateLimit } from "express-rate-limit"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Хранение данных в памяти
const DATA_SIZE = 1000000
const data = Array.from({ length: DATA_SIZE }, (_, index) => ({
  id: index + 1,
  value: `Элемент ${index + 1}`,
}))

// Хранение состояния пользователя
let userSelections = new Set()
let sortOrder = []

const app = express()
const PORT = process.env.PORT || 3001

// Применение ограничения скорости
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 1000, // Увеличиваем лимит для продакшен��
  standardHeaders: true,
  legacyHeaders: false,
})

app.use(cors())
app.use(express.json())
app.use("/api", limiter)

// Health check endpoint для мониторинга
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  })
})

// API маршруты
app.get("/api/data", (req, res) => {
  const page = Number.parseInt(req.query.page) || 0
  const limit = Number.parseInt(req.query.limit) || 20
  const search = req.query.search || ""

  let filteredData = [...data]

  // Применяем фильтр поиска, если предоставлен
  if (search) {
    filteredData = filteredData.filter((item) => item.value.toLowerCase().includes(search.toLowerCase()))
  }

  // Применяем пользовательский порядок сортировки, если доступен
  if (sortOrder.length > 0) {
    const orderMap = new Map()
    sortOrder.forEach((id, index) => {
      orderMap.set(id, index)
    })

    filteredData.sort((a, b) => {
      const aIndex = orderMap.has(a.id) ? orderMap.get(a.id) : Number.POSITIVE_INFINITY
      const bIndex = orderMap.has(b.id) ? orderMap.get(b.id) : Number.POSITIVE_INFINITY

      if (aIndex === Number.POSITIVE_INFINITY && bIndex === Number.POSITIVE_INFINITY) {
        return a.id - b.id
      }

      return aIndex - bIndex
    })
  }

  // Вычисляем пагинацию
  const start = page * limit
  const end = start + limit
  const paginatedData = filteredData.slice(start, end)

  res.json({
    items: paginatedData,
    total: filteredData.length,
    page,
    hasMore: end < filteredData.length,
  })
})

app.post("/api/selections", (req, res) => {
  const { selections } = req.body
  userSelections = new Set(selections)
  res.json({ success: true })
})

app.get("/api/selections", (req, res) => {
  res.json({
    selections: Array.from(userSelections),
  })
})

app.post("/api/sort-order", (req, res) => {
  const { order } = req.body
  sortOrder = order
  res.json({ success: true })
})

app.get("/api/sort-order", (req, res) => {
  res.json({
    order: sortOrder,
  })
})

// Обслуживание статических файлов из папки dist (Vite build output)
const distPath = join(__dirname, "../dist")
app.use(express.static(distPath))

// Обработка всех остальных маршрутов для SPA
app.get("*", (req, res) => {
  res.sendFile(join(distPath, "index.html"))
})

// Запуск сервера с привязкой к 0.0.0.0 для деплоя
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Сервер запущен на 0.0.0.0:${PORT}`)
  console.log(`📱 Приложение доступно по адресу: http://0.0.0.0:${PORT}`)
  console.log(`🏥 Health check: http://0.0.0.0:${PORT}/health`)
})
