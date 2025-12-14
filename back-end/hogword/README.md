# Hogword Backend

FastAPI backend for the Hogword English sentence practice application.

## Setup

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env` and fill in your credentials:
   - `SUPABASE_URL`: Your Supabase Project URL
   - `SUPABASE_KEY`: Your Supabase **Service Role** Key (secret, starts with `ey...`). This is required to bypass RLS for backend operations.
   - `N8N_WEBHOOK_URL`: Your n8n Webhook URL for validation

3. **Database Setup**
   Run the SQL commands in `schema.sql` in your Supabase SQL Editor to create the necessary tables.

4. **Run Locally**
   ```bash
   uvicorn app.main:app --reload
   ```

## Deployment (DigitalOcean)

The application is containerized using Docker.

### 1. Build the Image
```bash
docker build -t hogword-backend .
```

### 2. Run the Container
```bash
docker run -d \
  -p 80:80 \
  -e SUPABASE_URL=your_url \
  -e SUPABASE_KEY=your_key \
  -e N8N_WEBHOOK_URL=your_webhook \
  --name hogword \
  hogword-backend
```

### 3. Docker Compose (Recommended)

To run the full stack (or just the API with env vars loaded):

```bash
docker-compose up -d --build
```
This will start the service on port 1234.

### DigitalOcean Droplet Deployment

1. **Create a Droplet**: Choose the Docker Marketplace image (or standard Ubuntu and install Docker).
2. **Transfer Files**: Copy the project files to the droplet (or git clone).
3. **Build & Run**:
   ```bash
   docker-compose up -d --build
   ```
4. **Nginx Proxy (Optional)**: If you need HTTPS, set up Nginx and Certbot in front of the container.
