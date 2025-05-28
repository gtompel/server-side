import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Generate test data (1 to 1,000,000)
const generateTestData = () => {
  const data = [];
  for (let i = 1; i <= 1000000; i++) {
    data.push({
      id: i,
      value: `Test Value ${i}`,
    });
  }
  return data;
};

// In-memory data storage
const allData = generateTestData();

// In-memory storage for user selections and sorting order
let selectedItems = [];
let sortedOrder = [];

// Get paginated data
app.get('/api/data', (req, res) => {
  const { page = 0, limit = 20 } = req.query;
  const startIndex = parseInt(page) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);

  // If we have a custom sort order, use it
  if (sortedOrder.length > 0) {
    // Get the slice of sorted IDs for the current page
    const sortedIds = sortedOrder.slice(startIndex, endIndex);
    // Map these IDs to their corresponding data items
    const sortedData = sortedIds.map(id => allData.find(item => item.id === id));
    
    return res.json({
      data: sortedData,
      total: sortedOrder.length,
      hasMore: endIndex < sortedOrder.length,
    });
  }

  // Otherwise return data in default order
  const paginatedData = allData.slice(startIndex, endIndex);
  
  res.json({
    data: paginatedData,
    total: allData.length,
    hasMore: endIndex < allData.length,
  });
});

// Search API with pagination
app.get('/api/search', (req, res) => {
  const { query, page = 0, limit = 20 } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  // Filter data by query
  const filteredData = allData.filter(item => 
    item.value.toLowerCase().includes(query.toLowerCase())
  );

  // Apply custom sort order to filtered results if available
  let resultData = filteredData;
  if (sortedOrder.length > 0) {
    // Create a map for faster lookups
    const orderMap = new Map(sortedOrder.map((id, index) => [id, index]));
    
    // Sort filtered data based on the custom order
    resultData = [...filteredData].sort((a, b) => {
      const orderA = orderMap.has(a.id) ? orderMap.get(a.id) : Infinity;
      const orderB = orderMap.has(b.id) ? orderMap.get(b.id) : Infinity;
      
      return orderA - orderB;
    });
  }

  const startIndex = parseInt(page) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  const paginatedResults = resultData.slice(startIndex, endIndex);

  res.json({
    data: paginatedResults,
    total: resultData.length,
    hasMore: endIndex < resultData.length,
  });
});

// Save selected items
app.post('/api/selected', (req, res) => {
  const { selected } = req.body;
  selectedItems = selected;
  res.json({ success: true, count: selectedItems.length });
});

// Get selected items
app.get('/api/selected', (req, res) => {
  res.json({ selected: selectedItems });
});

// Save sorted order
app.post('/api/sortorder', (req, res) => {
  const { order } = req.body;
  sortedOrder = order;
  res.json({ success: true });
});

// Get sorted order
app.get('/api/sortorder', (req, res) => {
  res.json({ order: sortedOrder });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});