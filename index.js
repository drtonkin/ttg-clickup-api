const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const CLICKUP_API_TOKEN = process.env.CLICKUP_API_TOKEN;
const HUBSPOT_API_TOKEN = process.env.HUBSPOT_API_TOKEN;

app.get('/clickup-tasks-by-deal', async (req, res) => {
  const { dealId } = req.query;
  if (!dealId) return res.status(400).json({ error: 'No deal ID provided' });

  try {
    const dealResponse = await axios.get(
      `https://api.hubapi.com/crm/v3/objects/deals/${dealId}?properties=ttg_clickup_folder_id`,
      { headers: { Authorization: `Bearer ${HUBSPOT_API_TOKEN}` } }
    );

    const folderId = dealResponse.data?.properties?.ttg_clickup_folder_id;
    if (!folderId) return res.json([]);

    const listsResponse = await axios.get(
      `https://api.clickup.com/api/v2/folder/${folderId}/list`,
      { headers: { Authorization: CLICKUP_API_TOKEN } }
    );

    const lists = listsResponse.data.lists || [];
    const taskPromises = lists.map(list =>
      axios.get(
        `https://api.clickup.com/api/v2/list/${list.id}/task`,
        {
          headers: { Authorization: CLICKUP_API_TOKEN },
          params: { page: 0, subtasks: true, include_closed: false }
        }
      ).then(r => r.data.tasks || []).catch(() => [])
    );

    const taskArrays = await Promise.all(taskPromises);
    const allTasks = taskArrays.flat()
      .filter(task => task.status?.status?.toLowerCase() !== 'complete')
      .sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return parseInt(a.due_date) - parseInt(b.due_date);
      });

    res.json(allTasks);
  } catch (err) {
    res.status(500).json({ error: 'API error: ' + err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));