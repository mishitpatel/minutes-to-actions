# Engineering Documentation

Defines *how* the system is built.

| Document                             | Purpose                                 |
| ------------------------------------ | --------------------------------------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, tech stack, data flow    |
| [API_DESIGN.md](./API_DESIGN.md)     | REST conventions, endpoints, validation |
| [DATABASE.md](./DATABASE.md)         | Schema patterns, migrations, queries    |
| [decisions/](./decisions/)           | Architecture Decision Records           |
|                                      |                                         |

## Key Patterns
- API-first: Design OpenAPI spec before implementing
- Types-first: Define shared types before coding
- 3-file module pattern: schemas → handler → routes
