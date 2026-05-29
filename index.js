const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const CLICKUP_API_TOKEN = process.env.CLICKUP_API_TOKEN;
const CLICKUP_TEAM_ID = '9014456463';
const HUBSPOT_DEAL_FIELD_ID = '16cfe29b-bc97-4b7b-b084-b9f8f52b59f9';

app.get('/clickup-tasks', async (req, res) => {
  const { dealId } = req.query;
  if (!dealId) return res.status(400).json({ error: 'No deal ID provided' });
  try {
    const response = await axios.get(
      `https://api.clickup.com/api/v2/team/${CLICKUP_TEAM_ID}/task`,
      {
        headers: { Authorization: CLICKUP_API_TOKEN },
        params: {
          custom_fields: JSON.stringify([{
            field_id: HUBSPOT_DEAL_FIELD_ID,
            operator: '=',
            value: String(dealId)
          }]),
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