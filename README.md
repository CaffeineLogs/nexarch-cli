<div align="center">
  <h1>🚀 Nexarch CLI</h1>
  <p><strong>The ultimate CLI tool for scaffolding production-ready Clean Architecture Frontend Projects</strong></p>

  [![npm version](https://img.shields.io/npm/v/nexarch-cli.svg?style=flat-square)](https://www.npmjs.com/package/nexarch-cli)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
</div>

---

## 🌟 Overview

**Nexarch CLI** automates the tedious setup of highly scalable, robust, and clean frontend architectures. Built for both **Next.js (App Router)** and **React (Vite)**, it provides an out-of-the-box feature-sliced design pattern, complete with pre-configured providers (`axios`, `@tanstack/react-query`, `react-hot-toast`, `zod`).

No more messy boilerplate. Just run one command and start building features instantly.

## 📦 Installation

To use the CLI globally across your machine, install it via npm:

```bash
npm install -g nexarch-cli
```

Alternatively, you can run it directly without installing:

```bash
npx nexarch-cli init
```

*(Note: The global command maps to `nexarch` in your terminal).*

---

## 🚀 Quick Start (Project Initialization)

Inside a new, empty directory, initialize a complete Next.js or Vite project:

```bash
mkdir my-app
cd my-app
nexarch init
```

### What does `nexarch init` do?
1. **Framework Prompts**: Choose between `Next.js (App Router)`, `React (Vite)`, or an existing project.
2. **Package Manager Choice**: Select between `npm` and `pnpm`.
3. **Clean Slate**: Downloads the framework, installs Tailwind CSS (v4 compatible), and actively deletes messy boilerplate code (e.g. `App.tsx` logos, `page.tsx` default layout).
4. **Provider Injection**: Automatically creates robust Clean Architecture `providers.tsx` wrappers for Tanstack Query, Axios (with Zod validation), and React Hot Toast, and seamlessly injects them into your root layout!

> [!WARNING]  
> **Important Scaffolding Rules:**
> - If you want to scaffold a **brand new Next.js or Vite project**, you MUST run `npx nexarch-cli init` in a completely **empty** directory. Do not run `npm install` first, or the framework generation will fail to prevent overwriting files.
> - If you want to inject Clean Architecture into an **existing** project, run `nexarch init` and select `None (Existing Project)` when prompted for the framework.

---

## 🛠️ Feature & Item Generation

Once your project is initialized, you can use the `generate` (or `g`) command to effortlessly scaffold isolated feature modules or individual items within a feature.

```bash
nexarch generate [type] [names...] [options]
# OR
nexarch g [type] [names...] [options]
```

### Generate a Complete Feature Module

To generate a full feature slice (which includes `api`, `components`, `hooks`, `store`, `types`, and `utils` folders):

```bash
nexarch g feature dashboard profile settings
```
*(This will generate `dashboard`, `profile`, and `settings` feature modules instantly).*

### Generate Specific Items Using Flags

If you don't want a complete feature, you can generate specific files inside an existing feature using shorthand flags!

**Available Flags:**
- `-c, --component` : Generate a React component
- `-h, --hook`      : Generate a custom React hook
- `-s, --store`     : Generate a state management store
- `-t, --type`      : Generate TypeScript types/interfaces
- `-u, --util`      : Generate utility/rules functions
- `-a, --api`       : Generate an API client file

**Examples of combining flags:**
```bash
# Generate ONLY a store and a hook for the 'auth' feature:
nexarch g feature auth -sh

# Generate a component, util, API, and store for the 'orders' feature:
nexarch g feature orders -cuas
```

---

## ❓ Help Menu

Forget a command? You can pull up the beautiful, color-coded help menu anytime:

```bash
nexarch -h
# or
nexarch g -h
```

---

## 🤝 Contributing
Contributions, issues, and feature requests are always welcome! Let's build the cleanest architectures together.
