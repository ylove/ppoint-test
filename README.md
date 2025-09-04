# RxView Application

A full-stack application for drug information lookup and management, built with NextJS frontend and NestJS backend.

## Tech Stack

- **Frontend**: NextJS (React-based framework)
- **Backend**: NestJS (Node.js framework)
- **Database**: PostgreSQL 17.6, hosted at Exoscale Cloud
- **Containerization**: Docker & Docker Compose

## Quick Start

1. Clone the repository:
```bash
git clone <repository-url>
cd demo
```

2. Build and run the application:
```bash
docker-compose up --build
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Development Setup

For detailed setup instructions for individual components:

- **Frontend Setup**: See [rxfrontend/README.md](./rxfrontend/README.md)
- **Backend Setup**: See [rxview/README.md](./rxview/README.md)

## Environment Configuration

The application uses Docker Compose with environment files that are configured for the containerized setup. The `.env` files have been pre-configured to work with `docker-compose up --build`.

## Project Structure

- `rxfrontend/` - NextJS frontend application
- `rxview/` - NestJS backend API
- `docker-compose.yml` - Container orchestration configuration

## Data Governance

This application's data is hosted on European servers, in Switzerland. This may not be suitable for all US applications. This is meant as a demonstration.

## API Documentation

API documentation is available from the backend server at http://localhost:3001/api/docs . 

## MCP Server

The MCP server is available on the backend server at http://localhost:3001/mcp . Information on functions and parameters are available at the backend README.