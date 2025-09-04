## Description

This is the backend to the RxView application, built with the [Nest](https://github.com/nestjs/nest) framework. This is likely running inside of a Docker container, as explained in the parent README. However, if you need to run this individually, see the instructions below.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Note:
Values in the `.env` file are decoded at run-time, for a modicum of security. OpenAI models were chosen largely out of frugality, as was the database architecture.

## MCP Server data structure and tools:
```
{
        name: 'get_drug_by_name',
        description: 'Get detailed drug information by drug name and optional generic name',
        inputSchema: {
          type: 'object',
          properties: {
            drugName: {
              type: 'string',
              description: 'The brand name of the drug',
            },
            genericName: {
              type: 'string',
              description: 'The generic name of the drug (optional)',
            },
          },
          required: ['drugName'],
        },
      },
      {
        name: 'search_drugs',
        description: 'Search for drugs by name, generic name, or labeler',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to match against drug names, generic names, or labelers',
            },
            labeler: {
              type: 'string',
              description: 'Filter by specific drug manufacturer/labeler',
            },
            page: {
              type: 'number',
              description: 'Page number for pagination (default: 1)',
              default: 1,
            },
            limit: {
              type: 'number',
              description: 'Number of results per page (default: 20)',
              default: 20,
            },
          },
        },
      },
      {
        name: 'get_enhanced_sections',
        description: 'Get AI-enhanced content sections for a specific drug',
        inputSchema: {
          type: 'object',
          properties: {
            drugName: {
              type: 'string',
              description: 'The brand name of the drug',
            },
            genericName: {
              type: 'string',
              description: 'The generic name of the drug (optional)',
            },
          },
          required: ['drugName'],
        },
      }
```      