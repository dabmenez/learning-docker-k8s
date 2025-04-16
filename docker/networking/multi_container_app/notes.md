
# 📘 Multi-Container Application with Docker

These are my personal study notes for the module **"Building a Multi-Container Application with Docker"** from the course *Docker & Kubernetes: The Practical Guide (2025 Edition)* by Maximilian Schwarzmüller.

---

## 🧱 Project Structure

In this module, we build a full-stack application using:

- **MongoDB** – database
- **NodeJS (Express)** – backend API
- **React (SPA)** – frontend app

Each component runs in its own Docker container, and we connect them using Docker networks and volumes.

---

## 1. 🐳 Dockerizing MongoDB

We start by running MongoDB in a container:

```bash
docker run --name mongodb --rm -d --network goals-net mongo
```

- Uses the official MongoDB image.
- Connected to a custom Docker network (`goals-net`).
- No volume yet, so data is not persisted.

➡️ Backend connects to Mongo using:

```js
mongoose.connect('mongodb://mongodb:27017/course-goals', ...)
```

---

## 2. 🐳 Dockerizing the Node.js Backend

### Backend `Dockerfile`

```Dockerfile
FROM node

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .

EXPOSE 80

ENV MONGODB_USERNAME=root
ENV MONGODB_PASSWORD=secret

CMD ["npm", "start"]
```

### Running the backend:

```bash
docker run --name goals-backend --rm -d --network goals-net goals-node
```

📝 Notes:
- Container uses environment variables (not yet injected).
- Connected to MongoDB container via Docker DNS.

---

## 3. 🐳 Dockerizing the React Frontend

### Frontend `Dockerfile`

```Dockerfile
FROM node

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Running the frontend:

```bash
docker run --name goals-frontend --rm -p 3000:3000 -it goals-react
```

📝 Notes:
- Maps port `3000` so app is accessible.
- Frontend fetches from backend using container name (`goals-backend`).

---

## 4. 🔗 Docker Networks

We create a shared network:

```bash
docker network create goals-net
```

All containers are connected with `--network goals-net`.

🔁 Enables container name-based communication:
- Frontend → Backend
- Backend → MongoDB

---

## 5. 🛡️ Fixing MongoDB Authentication

To secure the DB, we use credentials:

```bash
docker run --name mongodb -v data:/data/db \
  --rm -d --network goals-net \
  -e MONGO_INITDB_ROOT_USERNAME=max \
  -e MONGO_INITDB_ROOT_PASSWORD=secret \
  mongo
```

Connection string in backend changes to:

```js
mongoose.connect(
  'mongodb://max:secret@mongodb:27017/course-goals?authSource=admin',
  { useNewUrlParser: true, useUnifiedTopology: true }
)
```

---

## 6. 💾 Adding Data Persistence with Volumes

To persist MongoDB data:

```bash
docker run --name mongodb \
  -v data:/data/db ...
```

📝 Notes:
- Volume name `data` stores the database files persistently.
- Useful during development and production.

---

## 7. 🔁 Live Source Code Updates (Bind Mounts)

To enable live updates (hot reload):

```bash
docker run -v $(pwd):/app \
  -v /app/node_modules goals-node
```

For frontend:

```bash
docker run -v $(pwd):/app \
  -v /app/node_modules \
  -p 3000:3000 goals-react
```

🔍 Explanation:
- First volume mounts project folder.
- Second volume prevents node_modules overwrite.

---

## ✅ Module Summary

✔ Built 3 separate containers  
✔ Used Docker networks for inter-container communication  
✔ Secured MongoDB using environment variables  
✔ Added persistent data storage via named volumes  
✔ Enabled hot reload using bind mounts

---