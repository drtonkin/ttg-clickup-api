const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const CLICKUP_API_TOKEN = process.env.CLICKUP_API_TOKEN;

app.get('/clickup-tasks', async (req, res) => {
  const { folderId } = req.query;
  if (!folderId) return res.status(400).json({ error: 'No folder ID provided' });
  try {
    const response = await axios.get(
      `https://api.clickup.com/api/v2/folder/${folderId}/task`,
      {
        headers: { Authorization: CLICKUP_API_TOKEN },
        params: {
          page: 0,
          subtasks: true,
          include_closed: true
        }
      }
    );
    res.json(response.data.tasks);
  } catch (err) {
    res.status(500).json({ error: 'ClickUp API error: ' + err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));