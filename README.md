## Tic Tac Toe with TypeScript

### Docker Compose

- **Build and start the container in detached mode:**
  ```bash
  docker compose up --build --detach
  ```

- **Access the running container's shell:**
  ```bash
  docker compose exec typescript sh
  ```

### npm (Node Package Manager) / npx (Node Package eXecute)

- **Create a `package.json` file**:
  ```bash
  npm init
  ```

- **Install all required packages**:
  ```bash
  npm install
  ```

- **Run the `build` script** (e.g., TypeScript compilation):
  ```bash
  npm run build
  ```

- **Run the `watch` script** (e.g., TypeScript in watch mode):
  ```bash
  npm run watch
  ```

- **`package.json`**:
  This file manages project metadata and scripts (e.g., build and watch commands).

### TypeScript (tsc - TypeScript Compiler)

- **Compile the TypeScript project**:
  ```bash
  tsc
  ```
  This will compile the project based on the `tsconfig.json` file.

- **Create a `tsconfig.json` configuration file** with the recommended settings:
  ```bash
  tsc --init
  ```

- **Generate a `.d.ts` declaration file** for type definitions:
  ```bash
  tsc --declaration  # or -d
  ```

- **Watch for file changes and recompile automatically**:
  ```bash
  tsc --watch  # or -w
  ```

- **`tsconfig.json`**:
  This file configures the TypeScript compiler settings (e.g., target, module, source directories).

### DOM (Document Object Model)

The **DOM** represents the structure of an HTML document and provides a way to interact with the document from JavaScript (or TypeScript). It represents the page so you can modify the content, structure, and style dynamically.

### http-server

- **Serve the project locally**:
  ```bash
  npm run serve
  ```
