# Engineering Documentation

Defines *how* the system is built.

| Document                             | Purpose                                 |
| ------------------------------------ | --------------------------------------- |
| [architecture.md](./architecture.md) | System design, tech stack, data flow    |
| [api-spec.md](./api-spec.md)         | REST conventions, endpoints, validation |
| [database-schema.md](./database-schema.md)         | Schema patterns, migrations, queries    |
| [decisions/](./decisions/)           | Architecture Decision Records           |

## Key Patterns
- API-first: Design OpenAPI spec before implementing
- Types-first: Define shared types before coding
- 3-file module pattern: schemas → handler → routes
