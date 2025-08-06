# Document Generator API

This Maven project contains the OpenAPI specification for the Document Generator microservice and generates both Java and TypeScript client interfaces for contract-first API development.

## Overview

The Document Generator API provides endpoints for generating PDF documents from templates. Currently supports:

- **MBI Quote Generation**: Generate Mechanical Breakdown Insurance quote PDFs
- **Health Check**: Service health monitoring

## Contract-First Development

This project follows a contract-first approach where:

1. **API Specification First**: The OpenAPI specification (`src/main/resources/openapi.yaml`) defines the contract
2. **Code Generation**: Both Java and TypeScript interfaces are generated from the specification
3. **Implementation Compliance**: The actual microservice should implement the generated TypeScript interfaces

## Generated Artifacts

### Java Client (for other Java microservices)
- **Location**: `target/generated-sources/java/`
- **Package**: `nz.co.turners.autosure.documentgenerator.api`
- **Models**: `nz.co.turners.autosure.documentgenerator.model`
- **Installation**: Automatically installed to local Maven repository

### TypeScript Client (for Node.js/browser applications)
- **Location**: `target/generated-sources/typescript-client/`
- **Package**: `@turners/document-generator-client`
- **Purpose**: Client library for calling the Document Generator API
- **Installation**: Automatically packaged and installed to local npm cache

### TypeScript Server Interfaces (for document-generator implementation)
- **Location**: `target/generated-sources/typescript-server/`
- **Package**: `@turners/document-generator-server`
- **Purpose**: Interfaces that the Node.js document-generator should implement
- **Installation**: Automatically packaged and installed to local npm cache

## Usage

### Generate and Package All Libraries

```bash
mvn clean install
```

This single command will:
1. Generate OpenAPI interfaces for Java and TypeScript
2. Compile and package the Java library
3. Install Java library to local Maven repository (`~/.m2/repository/`)
4. Build and package TypeScript libraries
5. Install TypeScript libraries to local npm cache

### Use in Other Projects

#### Java Projects
Add this as a dependency in your `pom.xml`:

```xml
<dependency>
    <groupId>nz.co.turners.autosure</groupId>
    <artifactId>document-generator-api</artifactId>
    <version>1.0.0-SNAPSHOT</version>
</dependency>
```

Then use the generated client:

```java
import nz.co.turners.autosure.documentgenerator.api.DocumentGenerationApi;
import nz.co.turners.autosure.documentgenerator.model.MbiQuoteRequest;

DocumentGenerationApi api = new DocumentGenerationApi();
// Configure base path, authentication, etc.
MbiQuoteRequest request = new MbiQuoteRequest();
// Set request properties...
byte[] pdfBytes = api.generateMbiQuote(request);
```

#### TypeScript/Node.js Client Projects
Add the client library to your `package.json`:

```json
{
  "dependencies": {
    "@turners/document-generator-client": "1.0.0-SNAPSHOT"
  }
}
```

Then use it in your code:

```typescript
import { DocumentGenerationApi, MbiQuoteRequest } from '@turners/document-generator-client';

const api = new DocumentGenerationApi();
const request: MbiQuoteRequest = {
  quotationNumber: "123456",
  quotationDate: "01/01/2025",
  // ... other required fields
};

const response = await api.generateMbiQuote(request);
// response contains the PDF binary data
```

#### Document Generator Server Implementation
Add the server interfaces to your Node.js project's `package.json`:

```json
{
  "dependencies": {
    "@turners/document-generator-server": "1.0.0-SNAPSHOT"
  }
}
```

Then implement the interfaces:

```typescript
import { DocumentGenerationApi, MbiQuoteRequest, HealthResponse } from '@turners/document-generator-server';

class DocumentGeneratorService implements DocumentGenerationApi {
  async healthCheck(): Promise<HealthResponse> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString()
    };
  }

  async generateMbiQuote(request: MbiQuoteRequest): Promise<Buffer> {
    // Your implementation here
    return pdfBuffer;
  }
}
```

## Local Development Workflow

1. **Update API Contract**: Modify `src/main/resources/openapi.yaml`
2. **Regenerate Libraries**: Run `mvn clean install`
3. **Update Dependencies**: Other projects automatically get the updated libraries from local caches
4. **No Manual Copying**: Libraries are automatically installed to Maven and npm local repositories

## API Endpoints

### Health Check
- **GET** `/health`
- Returns service health status

### Generate MBI Quote PDF
- **POST** `/generate/mbi-quote`
- Generates MBI quote PDF from provided data
- Returns PDF binary stream

## Implementation Guidelines

The document-generator Node.js service should:

1. Implement the generated TypeScript interfaces
2. Ensure all required fields from `MbiQuoteRequest` are handled
3. Return responses matching the OpenAPI specification
4. Handle all specified error conditions

## Updating the API

1. Modify `src/main/resources/openapi.yaml`
2. Run `mvn generate-sources` to regenerate interfaces
3. Update implementations to match new contract
4. Version bump and release

## Development Workflow

1. **Design**: Define API changes in `openapi.yaml`
2. **Generate**: Run Maven to generate new interfaces
3. **Implement**: Update microservice to implement new interfaces
4. **Test**: Verify implementation matches specification
5. **Deploy**: Release new version with updated contract