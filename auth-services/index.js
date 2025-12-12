const express = require('express');
const { Client } = require('ldapts');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const LDAP_URL = process.env.LDAP_URL || 'ldap://openldap:1389';

// Middleware to parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get(['/health', '/'], (req, res) => {
  res.status(200).json({ status: 'Webhook Auth Service is running' });
});

// Auth route
app.post('/auth', async (req, res) => {
  const { spec } = req.body;

  if (!spec || !spec.token || !spec.token.includes(':')) {
    return res.status(400).json({ error: 'Invalid TokenReview request' });
  }

  const [username, password] = spec.token.split(':');
  const client = new Client({ url: LDAP_URL });
  const userDN = `cn=${username},ou=dev,dc=example,dc=org`;

  try {
    await client.bind(userDN, password);
    await client.unbind();

    const response = {
      apiVersion: "authentication.k8s.io/v1",
      kind: "TokenReview",
      status: {
        authenticated: true,
        user: {
          username,
          uid: username,
          groups: ["dev"]
        }
      }
    };

    res.status(200).json(response);
  } catch (err) {
    console.error("LDAP error:", err.message);

    res.status(200).json({
      apiVersion: "authentication.k8s.io/v1",
      kind: "TokenReview",
      status: { authenticated: false }
    });
  }
});

// Fallback route
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start HTTP server
app.listen(port, () => {
  console.log(`Webhook auth server running on http://localhost:${port}`);
});
