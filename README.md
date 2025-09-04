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

This application's data is hosted on European servers, in Switzerland. This may not be suitable for all US applications, especially with live healthcare data. This is meant as a demonstration.

## API Documentation

API documentation is available from the backend server at http://localhost:3001/api/docs . 

## MCP Server

The MCP server is available on the backend server at http://localhost:3001/mcp . Information on functions and parameters are available at the backend README.

## AI rationale

Here, OpenAI APIs were used exclusively (while Claude was used in development), because of familiarity, as well as cost constraints - which also dictated which models were used. Structured content was used as opposed to individual API calls for sections to cut down on the number of network requests and API calls.

## SEO and Caching

All AI-generated content is cached, only the first user's page load would have any delay, as all subsequent loads would be happening with cached data on the server. Fallback META and TITLE information are given in such a scenario. Otherwise, both users and search engines see AI-optimized data cached on the server. Progressive loading is used, so that drug data and basic information is available on drug detail pages immediately even in absence of cache.

## Known limitations

The database used is the smallest, least powerful configuration - suitable for such a small number of rows - but it is subject to latency, as are OpenAI API calls. Some of this latency is out of this app's control. Were financial constraints not relevant, I would have hosted this in the cloud, with more powerful infrastructure, as well as used more powerful models for enhancing drug profiles.