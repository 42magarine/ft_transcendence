## Tic Tac Toe with TypeScript

### Docker Compose

- **Build and start the container in detached mode:**
  ```bash
  docker compose up --build --detach
  ```

- **Access the running container's shell:**
  ```bash
  docker compose exec ft_transcendence sh
  ```

### npm (Node Package Manager) / npx (Node Package eXecute)

- **Create a `package.json` file**:
  ```bash
  npm init -y
  ```

- **Install all required packages**:
  ```bash
  npm install
  ```

- **Run the `build` , `start` or `dev` script**
  ```bash
  npm run build # start or dev
  ```

- **`package.json`**:
  This file manages project metadata and scripts.

### TypeScript (tsc - TypeScript Compiler)

- **Create a `tsconfig.json` configuration file** with the recommended settings:
  ```bash
  tsc --init
  ```

- **Compile the TypeScript project**:
  ```bash
  tsc
  ```
  This will compile the project based on the `tsconfig.json` file.

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
