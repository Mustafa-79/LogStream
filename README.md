# Log Stream

## Logging Pipeline Simulation

This project simulates a complete logging pipeline with the following components:

- **Log Simulator (Dummy Log Generator):**  
  Generates log entries every 5 seconds and writes them to `apps/simulator/logs/app.log`.

- **Fluent Bit:**  
  Tails the log file from the simulator, parses log entries using the custom parser defined in `apps/fluent-bit/parsers.conf`, and forwards the logs via HTTP.

- **Producer (Log Ingest Server):**  
  An Express server that receives logs from Fluent Bit at the `/ingest` endpoint and enqueues them into a BullMQ Redis queue.

- **Consumer:**  
  A worker service that listens to the BullMQ queue, processes log entries, and can be extended to write or further process logs.

### How to Run the Simulation

Follow these steps to run the complete pipeline:

1. **Reset the Redis Queue**  
   Open a terminal and flush all data from Redis:
   ```bash
   redis-cli flushall
   ```

2. **Start the Producer (Log Ingest Server)**  
   In one terminal, navigate to the producer directory and start the server:
   ```bash
   cd apps/producer
   npm install  # if not already installed
   npm start
   ```  
   The producer listens on port `3000` for HTTP POST requests from Fluent Bit.

3. **Start Fluent Bit**  
   In a second terminal, navigate to the Fluent Bit directory and start Fluent Bit:
   ```bash
   cd apps/fluent-bit
   fluent-bit -c fluent-bit.conf
   ```  
   Fluent Bit tails the log file from the simulator (`../simulator/logs/app.log`), parses each log entry, and sends the entries to the producer's `/ingest` endpoint.

4. **Start the Consumer**  
   In a third terminal, navigate to the consumer directory and launch the worker:
   ```bash
   cd apps/consumer
   npm install  # if not already installed
   npm start
   ```  
   The consumer processes the logs enqueued by the producer via BullMQ.

5. **Start the Log Simulator**  
   Finally, in a fourth terminal, navigate to the simulator directory and run the log simulator:
   ```bash
   cd apps/simulator
   npm install  # if not already installed
   npm start
   ```  
   The simulator writes a new log entry every 5 seconds to `apps/simulator/logs/app.log`.

### Requirements

- Redis running on `localhost:6379`
- Node.js installed (with npm)
- Fluent Bit installed on your system

