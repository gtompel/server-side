import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Генерация тестовых данных (от 1 до 1,000,000)
const generateTestData = () => {
  const data = [];
  for (let i = 1; i <= 1000000; i++) {
    data.push({
      id: i,
      value: `Тестовое значение ${i}`,
    });
  }
  return data;
};

// Хранение данных в памяти
const allData = generateTestData();
let selectedItems = [];
let sortedOrder = [];

// Получение данных с пагинацией
app.get('/api/data', (req, res) => {
  const { page = 0, limit = 20 } = req.query;
  const startIndex = parseInt(page) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  
  let resultData = allData;
  
  // Применяем пользовательскую сортировку
  if (sortedOrder.length > 0) {
    const orderMap = new Map(sortedOrder.map((id, index) => [id, index]));
    resultData = [...allData].sort((a, b) => {
      const orderA = orderMap.has(a.id) ? orderMap.get(a.id) : Infinity;
      const orderB = orderMap.has(b.id) ? orderMap.get(b.id) : Infinity;
      return orderA - orderB;
    });
  }
  
  const paginatedData = resultData.slice(startIndex, endIndex);
  
  res.json({
    data: paginatedData,
    total: resultData.length,
    hasMore: endIndex < resultData.length
  });
});

// Поиск с пагинацией
app.get('/api/search', (req, res) => {
  const { query, page = 0, limit = 20 } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Необходим поисковый запрос' });
  }
  
  // Фильтруем данные по запросу
  let filteredData = allData.filter(item => 
    item.value.toLowerCase().includes(query.toLowerCase())
  );
  
  // Применяем пользовательскую сортировку к отфильтрованным результатам
  if (sortedOrder.length > 0) {
    const orderMap = new Map(sortedOrder.map((id, index) => [id, index]));
    filteredData = filteredData.sort((a, b) => {
      const orderA = orderMap.has(a.id) ? orderMap.get(a.id) : Infinity;
      const orderB = orderMap.has(b.id) ? orderMap.get(b.id) : Infinity;
      return orderA - orderB;
    });
  }
  
  const startIndex = parseInt(page) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  const paginatedResults = filteredData.slice(startIndex, endIndex);
  
  res.json({
    data: paginatedResults,
    total: filteredData.length,
    hasMore: endIndex < filteredData.length
  });
});

// Сохранение выбранных элементов
app.post('/api/selected', (req, res) => {
  const { selected } = req.body;
  selectedItems = selected;
  res.json({ success: true, count: selectedItems.length });
});

// Получение выбранных элементов
app.get('/api/selected', (req, res) => {
  res.json({ selected: selectedItems });
});

// Сохранение порядка сортировки
app.post('/api/sortorder', (req, res) => {
  const { order } = req.body;
  sortedOrder = order;
  res.json({ success: true });
});

// Получение порядка сортировки
app.get('/api/sortorder', (req, res) => {
  res.json({ order: sortedOrder });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});