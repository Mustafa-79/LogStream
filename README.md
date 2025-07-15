# LogStream Multi-Application Setup

## Overview
This Docker Compose setup simulates a multi-application logging scenario where:
- 5 different applications (app1, app2, app3, app4, app5) generate logs
- Each application has its own Fluent Bit instance
- All Fluent Bit instances send logs to the same producer service
- Logs are processed through Redis queues and stored in MongoDB

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌───────────┐
│ Simulator   │    │ Fluent Bit   │    │ Producer  │
│ App1        │───▶│ App1         │───▶│ Service   │
│ (File)      │    │              │    │           │
└─────────────┘    └──────────────┘    │           │
                                       │           │
┌─────────────┐    ┌──────────────┐    │           │
│ Simulator   │    │ Fluent Bit   │    │           │
│ App2        │───▶│ App2         │───▶│           │
│ (File)      │    │              │    │           │
└─────────────┘    └──────────────┘    │           │
                                       │           │
┌─────────────┐    ┌──────────────┐    │           │
│ Simulator   │    │ Fluent Bit   │    │           │
│ App3        │───▶│ App3         │───▶│           │
│ (File)      │    │              │    │           │
└─────────────┘    └──────────────┘    │           │
                                       │           │
┌─────────────┐    ┌──────────────┐    │           │
│ Simulator   │    │ Fluent Bit   │    │           │
│ App4        │───▶│ App4         │───▶│           │
│ (IO Stream) │    │              │    │           │
└─────────────┘    └──────────────┘    │           │
                                       │           │
┌─────────────┐    ┌──────────────┐    │           │
│ Simulator   │    │ Fluent Bit   │    │           │
│ App5        │───▶│ App5         │───▶│           │
│ (DB)        │    │              │    │           │
└─────────────┘    └──────────────┘    │           │
                                       └───────────┘
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


### 2. Start Just the Backend and Frontend
If you want to start only the backend services and the frontend (without the simulators):
```bash
docker compose up -d vdom-frontend api-gateway
```

> **After running this command, open [http://localhost:8000/](http://localhost:8000/) in your browser to access the frontend.**



### 3. Start Specific Application Stack
To start only one application with its Fluent Bit:
```bash

# Start only App1 and its dependencies
docker compose up -d redis producer consumer api-gateway simulator-app1 fluent-bit-app1 vdom-frontend

# Start only App4 and its dependencies
docker compose up -d redis producer consumer api-gateway simulator-app4 fluent-bit-app4 vdom-frontend

# Start only App5 and its dependencies
docker compose up -d redis producer consumer api-gateway simulator-app5 fluent-bit-app5 vdom-frontend
```

### 4. Monitor Logs
```bash
# Monitor all services
docker compose logs -f

# Monitor specific application
docker compose logs -f simulator-app1 fluent-bit-app1

# Monitor producer to see incoming logs
docker compose logs -f producer
```

### 5. Stop Services
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


## Troubleshooting

### Common Issues
1. **Environment variables**: Ensure .env file is correctly set up
2. **Port conflicts**: Check if ports 3000-3002, 8000, 6379, 27017, 2020-2024 are available
3. **Storage permissions**: Ensure Docker has write access to `./fluent-bit/storage/` and `./simulator/logs/`
4. **Memory issues**: Monitor Docker resource usage, adjust limits in docker-compose.yaml if needed
5. **Services not starting**: Check logs with `docker compose logs <service-name>`
6. **Stale containers**: Clean up with `docker compose down -v --remove-orphans`

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
