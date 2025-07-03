# LogStream - Sprint 1 Testing

## Quick Setup for Development

### Prerequisites
Ensure you have an `.env` file in the `apps/api-gateway` directory with the required environment variables.

### Backend Setup
```bash
cd apps/api-gateway
npm install
npm run dev
```

### Frontend Setup
```bash
cd apps/vdom-frontend
npm install
ojet serve
```

---

# LogStream Multi-Application Setup

## Overview
This Docker Compose setup simulates a multi-application logging scenario where:
- 3 different applications (app1, app2, app3) generate logs
- Each application has its own Fluent Bit instance
- All Fluent Bit instances send logs to the same producer service
- Logs are processed through Redis queues and stored in MongoDB

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌───────────┐
│ Simulator   │    │ Fluent Bit   │    │ Producer  │
│ App1        │───▶│ App1         │───▶│ Service   │
└─────────────┘    └──────────────┘    │           │
                                       │           │
┌─────────────┐    ┌──────────────┐    │           │
│ Simulator   │    │ Fluent Bit   │    │           │
│ App2        │───▶│ App2         │───▶│           │
└─────────────┘    └──────────────┘    │           │
                                       │           │
┌─────────────┐    ┌──────────────┐    │           │
│ Simulator   │    │ Fluent Bit   │    │           │
│ App3        │───▶│ App3         │───▶│           │
└─────────────┘    └──────────────┘    └───────────┘
                                             │
                                             ▼
                                       ┌───────────┐
                                       │   Redis   │
                                       │   Queue   │
                                       └───────────┘
                                             │
                                             ▼
                                       ┌───────────┐
                                       │ Consumer  │
                                       │ Service   │
                                       └───────────┘
                                             │
                                             ▼
                                       ┌───────────┐
                                       │ MongoDB   │
                                       └───────────┘
```

## Key Improvements Made

### 1. Docker Compose Enhancements
- **Removed obsolete version directive** (modern Docker Compose doesn't require it)
- **Added custom network** (`logstream`) for service isolation
- **Implemented health checks** for critical services
- **Added resource limits** to prevent resource exhaustion
- **Configured restart policies** (`unless-stopped`)
- **Added container names** for easier debugging
- **Environment variable support** via `.env` file

### 2. Multi-Application Simulation
- **Three simulator instances** (app1, app2, app3) with different:
  - Log generation intervals (3s, 7s, 5s respectively)
  - Application-specific log messages
  - Environment configurations
- **Separate Fluent Bit instances** for each application
- **Isolated storage** for each Fluent Bit instance
- **Application tagging** in logs for identification

### 3. Security and Configuration
- **Externalized sensitive data** to environment variables
- **Separated Fluent Bit configurations** per application
- **Added application metadata** to log entries
- **Improved log parsing** and enrichment

## Quick Start

<!-- ### 1. Environment Setup
Copy the provided `.env` file and adjust values as needed:
```bash
cp .env.example .env
``` -->


### 0. Change Directory
Make sure you are in the `apps` directory:
```bash
cd apps
```


### 1. Start All Services
```bash
docker compose up -d
```

### 2. Start Specific Application Stack
To start only one application with its Fluent Bit:
```bash
# Start only App1 and its dependencies
docker compose up -d redis producer consumer api-gateway simulator-app1 fluent-bit-app1

# Start only App2 and its dependencies  
docker compose up -d redis producer consumer api-gateway simulator-app2 fluent-bit-app2

# Start only App3 and its dependencies
docker compose up -d redis producer consumer api-gateway simulator-app3 fluent-bit-app3
```

### 3. Monitor Logs
```bash
# Monitor all services
docker compose logs -f

# Monitor specific application
docker compose logs -f simulator-app1 fluent-bit-app1

# Monitor producer to see incoming logs
docker compose logs -f producer
```

### 4. Stop Services
```bash
# Stop all services (keeps containers and volumes)
docker compose stop

# Stop and remove containers (keeps volumes and images)
docker compose down

# Stop and remove everything including volumes
docker compose down -v

# Stop and remove everything including volumes and images
docker compose down -v --rmi all

# Stop specific services only
docker compose stop simulator-app1 fluent-bit-app1
```

## Service Details

### Simulators
- **app1**: High-traffic application (logs every 3s) - Authentication & Payment logs
- **app2**: Medium-traffic application (logs every 7s) - File & Email processing logs  
- **app3**: Regular-traffic application (logs every 5s) - Order & Inventory logs

### Fluent Bit Instances
- **Port mappings**: 
  - fluent-bit-app1: 2020
  - fluent-bit-app2: 2021
  - fluent-bit-app3: 2022
- **Individual configurations** with application-specific tags
- **Separate storage** to prevent data conflicts

### Core Services
- **Producer**: Receives logs from all Fluent Bit instances (Port 3001)
- **Consumer**: Processes logs from Redis queue (Port 3002)
- **API Gateway**: Main API interface (Port 3000)
- **Frontend**: Web interface (Port 5173)
- **Redis**: Message queue (Port 6379)

## Monitoring and Debugging

### Check Service Status
```bash
docker compose ps
```

<!-- ### View Fluent Bit Status
```bash
# App1 Fluent Bit status
curl http://localhost:2020

# App2 Fluent Bit status  
curl http://localhost:2021

# App3 Fluent Bit status
curl http://localhost:2022
``` -->

### Check Log Files
```bash
# View generated log files
ls -la simulator/logs/app*/

# View Fluent Bit storage
ls -la fluent-bit/storage/app*/
```

### Producer Health Check
```bash
curl http://localhost:3001/health
```

## Scaling Scenarios

### Add More Applications
1. Create new simulator service in `docker-compose.yaml`
2. Create corresponding Fluent Bit service
3. Add new configuration in `fluent-bit/configs/`
4. Create storage directory for new app

### Load Testing
Adjust log generation intervals in simulator code:
```typescript
const intervals: { [key: string]: number } = {
  app1: 1000,  // Every 1 second for high load testing
  app2: 2000,  // Every 2 seconds
  app3: 1500,  // Every 1.5 seconds
};
```

## Troubleshooting

### Common Issues
1. **Port conflicts**: Check if ports 3000-3002, 5173, 6379, 2020-2022 are available
2. **Storage permissions**: Ensure Docker has write access to `./fluent-bit/storage/` and `./simulator/logs/`
3. **Memory issues**: Monitor Docker resource usage, adjust limits in docker-compose.yaml if needed
4. **Services not starting**: Check logs with `docker compose logs <service-name>`
5. **Stale containers**: Clean up with `docker compose down -v --remove-orphans`

### Quick Troubleshooting Commands
```bash
# Check what's running
docker compose ps

# Check service logs
docker compose logs <service-name>

# Restart problematic service
docker compose restart <service-name>

# Force recreate containers
docker compose up -d --force-recreate

# Check Docker system resources
docker system df
docker system events
```

### Useful Commands
```bash
# View service status and health
docker compose ps
docker compose top

# Restart services
docker compose restart
docker compose restart simulator-app1 fluent-bit-app1

# View logs
docker compose logs --tail=50 producer
docker compose logs --since=1h consumer

# Execute commands in running containers
docker compose exec producer bash
docker compose exec redis redis-cli

# Build and start (useful after code changes)
docker compose up -d --build

# View resource usage
docker stats

# Clean up everything
docker compose down -v --remove-orphans

# Remove unused Docker resources
docker system prune -a --volumes
```

## Development Notes

### Configuration Files
- `docker-compose.yaml`: Main orchestration file
- `.env`: Environment variables
- `fluent-bit/configs/app*.conf`: Individual Fluent Bit configurations
- Individual service Dockerfiles in respective directories

### Log Format
Each log entry includes:
- Timestamp (ISO 8601)
- Log level ('INFO', 'WARNING', 'ERROR', 'DEBUG')
- Trace ID (randomly generated)
- Log message

Example:
```
[2025-06-27T05:14:17.839Z] [WARNING] [mcecxtgvmu9r10tgd9h] Cache hit for user preferences
^                          ^         ^                     ^
|                          |         |-- Trace ID          |
|-- Timestamp              |                               |-- Log message
                           |-- Log level
```
