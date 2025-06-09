import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Хранение данных в памяти
const DATA_SIZE = 1000000;
const data = Array.from({ length: DATA_SIZE }, (_, index) => ({
  id: index + 1,
  value: `Элемент ${index + 1}`
}));

// Хранение состояния пользователя
let userSelections = new Set();
let sortOrder = [];

const app = express();
const PORT = process.env.PORT || 3001;

// Применение ограничения скорости
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // Ограничение каждого IP до 100 запросов за windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors());
app.use(express.json());
app.use('/api', limiter);

// Обслуживание статических файлов в продакшене
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));
}

// API маршруты
app.get('/api/data', (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  
  let filteredData = [...data];
  
  // Применяем фильтр поиска, если предоставлен
  if (search) {
    filteredData = filteredData.filter(item => 
      item.value.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  // Применяем пользовательский порядок сортировки, если доступен
  if (sortOrder.length > 0) {
    const orderMap = new Map();
    sortOrder.forEach((id, index) => {
      orderMap.set(id, index);
    });
    
    filteredData.sort((a, b) => {
      const aIndex = orderMap.has(a.id) ? orderMap.get(a.id) : Infinity;
      const bIndex = orderMap.has(b.id) ? orderMap.get(b.id) : Infinity;
      
      if (aIndex === Infinity && bIndex === Infinity) {
        return a.id - b.id;
      }
      
      return aIndex - bIndex;
    });
  }
  
  // Вычисляем пагинацию
  const start = page * limit;
  const end = start + limit;
  const paginatedData = filteredData.slice(start, end);
  
  res.json({
    items: paginatedData,
    total: filteredData.length,
    page,
    hasMore: end < filteredData.length
  });
});

app.post('/api/selections', (req, res) => {
  const { selections } = req.body;
  userSelections = new Set(selections);
  res.json({ success: true });
});

app.get('/api/selections', (req, res) => {
  res.json({
    selections: Array.from(userSelections)
  });
});

app.post('/api/sort-order', (req, res) => {
  const { order } = req.body;
  sortOrder = order;
  res.json({ success: true });
});

app.get('/api/sort-order', (req, res) => {
  res.json({
    order: sortOrder
  });
});

// Обслуживание React приложения для любых других маршрутов в продакшене
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});